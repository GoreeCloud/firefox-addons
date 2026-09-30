import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SETTINGS_SOURCE = fs.readFileSync(path.join(HERE, "..", "shared", "settings.js"), "utf8");

function loadSettings() {
  const context = vm.createContext({});
  vm.runInContext(SETTINGS_SOURCE, context, { filename: "settings.js" });
  return context.GoreeChatGPTSettings;
}

test("normalization clamps numeric settings and bounds snippets", () => {
  const Settings = loadSettings();
  const snippets = Array.from({ length: 60 }, (_, index) => ({
    id: `snippet-${index}`,
    name: `Snippet ${index}`,
    body: "x".repeat(9000)
  }));
  const normalized = Settings.normalize({
    contentWidth: 500,
    fontScale: 200,
    snippets
  });

  assert.equal(normalized.contentWidth, 720);
  assert.equal(normalized.fontScale, 130);
  assert.equal(normalized.snippets.length, 50);
  assert.equal(normalized.snippets[0].body.length, 8000);
});

test("normalization preserves duplicate snippet content with unique IDs", () => {
  const Settings = loadSettings();
  const normalized = Settings.normalize({
    snippets: [
      { id: "same", name: "One", body: "First" },
      { id: "same", name: "Two", body: "Second" },
      { id: "same", name: "Three", body: "Third" }
    ]
  });

  assert.deepEqual(
    Array.from(normalized.snippets, (snippet) => snippet.id),
    ["same", "same-2", "same-3"]
  );
  assert.deepEqual(
    Array.from(normalized.snippets, (snippet) => snippet.body),
    ["First", "Second", "Third"]
  );
});

test("settings export is product-bound and excludes draft storage", () => {
  const Settings = loadSettings();
  const envelope = Settings.buildSettingsExport(
    { wideMode: false, snippets: [{ id: "one", name: "One", body: "Body" }] },
    "2026-09-30T13:00:00.000Z"
  );

  assert.equal(envelope.formatVersion, 1);
  assert.equal(envelope.product, "GoreeCloud ChatGPT Enhancer");
  assert.equal(envelope.geckoId, "chatgpt-enhancer@goreecloud.com");
  assert.equal(envelope.exportedAt, "2026-09-30T13:00:00.000Z");
  assert.equal(envelope.settings.wideMode, false);
  assert.equal(Object.hasOwn(envelope, "drafts"), false);
  assert.equal(JSON.stringify(envelope).includes("gcce.drafts.v1"), false);
});

test("settings import rejects malformed and foreign envelopes", () => {
  const Settings = loadSettings();

  assert.throws(() => Settings.parseSettingsImport("{"), /valid JSON/);
  assert.throws(
    () => Settings.parseSettingsImport(JSON.stringify({
      formatVersion: 1,
      product: "Other Extension",
      geckoId: "other@example.invalid",
      settings: {}
    })),
    /different extension/
  );
  assert.throws(
    () => Settings.parseSettingsImport(JSON.stringify({
      formatVersion: 99,
      product: "GoreeCloud ChatGPT Enhancer",
      geckoId: "chatgpt-enhancer@goreecloud.com",
      settings: {}
    })),
    /Unsupported/
  );
});

test("settings import normalizes untrusted backup values", () => {
  const Settings = loadSettings();
  const imported = Settings.parseSettingsImport(JSON.stringify({
    formatVersion: 1,
    product: "GoreeCloud ChatGPT Enhancer",
    geckoId: "chatgpt-enhancer@goreecloud.com",
    settings: {
      contentWidth: -50,
      fontScale: "not-a-number",
      snippets: [
        { id: "<bad id>", name: "   Valid name   ", body: "  Valid body  " },
        { id: "empty", name: "", body: "ignored" }
      ]
    }
  }));

  assert.equal(imported.contentWidth, 720);
  assert.equal(imported.fontScale, 100);
  assert.equal(imported.snippets.length, 1);
  assert.equal(imported.snippets[0].id, "-bad-id-");
  assert.equal(imported.snippets[0].name, "Valid name");
  assert.equal(imported.snippets[0].body, "Valid body");
});
