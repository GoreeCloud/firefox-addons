import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { URL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = fs.readFileSync(path.join(HERE, "..", "portability.js"), "utf8");

function load() {
  const context = vm.createContext({ URL });
  vm.runInContext(SOURCE, context, { filename: "portability.js" });
  return context.GoreeRedirectorPortability;
}

test("backup round-trip normalizes rules without permission state", () => {
  const P = load();
  const envelope = P.buildExport({
    builtinEnabled: false,
    rules: [{ name: " Docs ", source: "https://example.com/docs/?q=1#x", destination: "https://docs.goreecloud.com", enabled: true }],
    exportedAt: "2026-10-03T12:00:00.000Z"
  });
  assert.equal(envelope.rules[0].source, "https://example.com/docs");
  assert.equal(Object.hasOwn(envelope.rules[0], "permissionOrigin"), false);
  const parsed = P.parseImport(JSON.stringify(envelope));
  assert.equal(parsed.builtinEnabled, false);
  assert.equal(parsed.rules[0].permissionOrigin, "https://example.com/*");
});

test("import rejects duplicate sources and redirect loops", () => {
  const P = load();
  const base = { formatVersion: 1, product: "GoreeCloud Redirector", geckoId: "redirector@goreecloud.com", builtinEnabled: true };
  assert.throws(() => P.parseImport(JSON.stringify({
    ...base,
    rules: [
      { name: "A", source: "https://example.com/", destination: "https://goreecloud.com/" },
      { name: "B", source: "https://example.com/", destination: "https://other.example/" }
    ]
  })), /Duplicate source/);
  assert.throws(() => P.parseImport(JSON.stringify({
    ...base,
    rules: [{ name: "Loop", source: "https://example.com/", destination: "https://example.com/path" }]
  })), /own source/);
});

test("preview follows built-in priority and enabled custom rules", () => {
  const P = load();
  assert.equal(P.preview("https://keep.google.com/u/0/", [], true).builtIn, true);
  const result = P.preview("https://example.com/docs/page", [{
    name: "Docs", source: "https://example.com/docs", destination: "https://docs.goreecloud.com/", enabled: true
  }], false);
  assert.equal(result.matched, true);
  assert.equal(result.name, "Docs");
  assert.equal(P.preview("https://example.com/other", [], false).matched, false);
});
