import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_CUSTOM_TAB_TITLE_LENGTH,
  TAB_TITLE_MENU_ID,
  TAB_TITLE_SESSION_KEY,
  createTabTitleRenaming,
  isTabTitleRenameEligible
} from "../src/background/tab-title-renaming.js";

function createMockBrowser({
  tab = { id: 42, url: "https://example.com/research", title: "Example", incognito: false },
  storedTitle = "",
  executionResult = { ok: true, title: "Research" },
  failGetValue = false,
  failSetValue = false,
  failRemoveValue = false
} = {}) {
  let currentStoredTitle = storedTitle;
  const calls = {
    createdMenus: [],
    installedListeners: [],
    menuClickListeners: [],
    windows: [],
    execute: [],
    setValues: [],
    removedValues: []
  };

  return {
    calls,
    browser: {
      tabs: {
        async get(tabId) {
          assert.equal(tabId, tab.id);
          return { ...tab };
        }
      },
      sessions: {
        async getTabValue(tabId, key) {
          assert.equal(tabId, tab.id);
          assert.equal(key, TAB_TITLE_SESSION_KEY);
          if (failGetValue) throw new Error("simulated getTabValue failure");
          return currentStoredTitle || undefined;
        },
        async setTabValue(tabId, key, value) {
          calls.setValues.push({ tabId, key, value });
          if (failSetValue) throw new Error("simulated setTabValue failure");
          currentStoredTitle = value;
        },
        async removeTabValue(tabId, key) {
          calls.removedValues.push({ tabId, key });
          if (failRemoveValue) throw new Error("simulated removeTabValue failure");
          currentStoredTitle = "";
        }
      },
      scripting: {
        async executeScript(options) {
          calls.execute.push(options);
          return [{ frameId: 0, result: executionResult }];
        }
      },
      runtime: {
        lastError: null,
        getURL(path) {
          return `moz-extension://test/${path}`;
        },
        onInstalled: {
          addListener(listener) {
            calls.installedListeners.push(listener);
          }
        }
      },
      windows: {
        async create(options) {
          calls.windows.push(options);
          return { id: 9 };
        }
      },
      menus: {
        create(options, callback) {
          calls.createdMenus.push(options);
          callback?.();
          return options.id;
        },
        onClicked: {
          addListener(listener) {
            calls.menuClickListeners.push(listener);
          }
        }
      }
    }
  };
}

test("tab title renaming eligibility is limited to non-private HTTP(S) tabs", () => {
  assert.equal(isTabTitleRenameEligible({ id: 1, url: "https://example.com", incognito: false }), true);
  assert.equal(isTabTitleRenameEligible({ id: 2, url: "http://localhost", incognito: false }), true);
  assert.equal(isTabTitleRenameEligible({ id: 3, url: "about:config", incognito: false }), false);
  assert.equal(isTabTitleRenameEligible({ id: 4, url: "file:///tmp/test.html", incognito: false }), false);
  assert.equal(isTabTitleRenameEligible({ id: 5, url: "https://example.com", incognito: true }), false);
});

test("rename state fails closed when saved title metadata cannot be read", async () => {
  const { browser } = createMockBrowser({ failGetValue: true });
  const manager = createTabTitleRenaming({ browser });

  assert.deepEqual(await manager.readRenameState(42), {
    ok: false,
    reason: "session-metadata-read-failed"
  });
});

test("rename state reads the saved custom title without page-content inspection", async () => {
  const { browser } = createMockBrowser({ storedTitle: "Quarterly research" });
  const manager = createTabTitleRenaming({ browser });
  const state = await manager.readRenameState(42);

  assert.equal(state.ok, true);
  assert.equal(state.eligible, true);
  assert.equal(state.pageTitle, "Example");
  assert.equal(state.customTitle, "Quarterly research");
  assert.equal(state.maxLength, MAX_CUSTOM_TAB_TITLE_LENGTH);
});

test("applying a custom title scripts only the selected tab and saves session metadata", async () => {
  const { browser, calls } = createMockBrowser({
    executionResult: { ok: true, title: "Quarterly research" }
  });
  const changes = [];
  const manager = createTabTitleRenaming({
    browser,
    broadcastChange: (reason) => changes.push(reason)
  });

  const result = await manager.applyRename(42, "  Quarterly research  ");

  assert.deepEqual(result, { ok: true, title: "Quarterly research", restored: false });
  assert.equal(calls.execute.length, 1);
  assert.deepEqual(calls.execute[0].target, { tabId: 42 });
  assert.deepEqual(calls.execute[0].args, ["Quarterly research", "Example", MAX_CUSTOM_TAB_TITLE_LENGTH]);
  assert.deepEqual(calls.setValues, [{
    tabId: 42,
    key: TAB_TITLE_SESSION_KEY,
    value: "Quarterly research"
  }]);
  assert.deepEqual(calls.removedValues, []);
  assert.deepEqual(changes, ["tab-title-renamed"]);
});

test("restoring the page title clears only the tab title session value", async () => {
  const { browser, calls } = createMockBrowser({
    storedTitle: "Quarterly research",
    executionResult: { ok: true, title: "", restoredTitle: "Example" }
  });
  const manager = createTabTitleRenaming({ browser });

  const result = await manager.applyRename(42, "   ");

  assert.deepEqual(result, { ok: true, title: "", restored: true });
  assert.deepEqual(calls.setValues, []);
  assert.deepEqual(calls.removedValues, [{
    tabId: 42,
    key: TAB_TITLE_SESSION_KEY
  }]);
});

test("metadata write failure rolls the page title back to the prior custom title", async () => {
  const { browser, calls } = createMockBrowser({
    storedTitle: "Existing label",
    executionResult: { ok: true, title: "New label" },
    failSetValue: true
  });
  const changes = [];
  const manager = createTabTitleRenaming({
    browser,
    broadcastChange: (reason) => changes.push(reason)
  });

  const result = await manager.applyRename(42, "New label");

  assert.deepEqual(result, {
    ok: false,
    reason: "session-metadata-write-failed",
    rollbackApplied: true,
    metadataRollbackApplied: true,
    pageRollbackApplied: true
  });
  assert.equal(calls.execute.length, 2);
  assert.deepEqual(calls.execute[1].args, [
    "Existing label",
    "Example",
    MAX_CUSTOM_TAB_TITLE_LENGTH
  ]);
  assert.deepEqual(changes, []);
});

test("metadata remove failure reapplies the prior custom title after restore", async () => {
  const { browser, calls } = createMockBrowser({
    storedTitle: "Existing label",
    executionResult: { ok: true, title: "", restoredTitle: "Example" },
    failRemoveValue: true
  });
  const manager = createTabTitleRenaming({ browser });

  const result = await manager.applyRename(42, "");

  assert.equal(result.ok, false);
  assert.equal(result.reason, "session-metadata-write-failed");
  assert.equal(result.rollbackApplied, true);
  assert.equal(calls.execute.length, 2);
  assert.deepEqual(calls.execute[1].args, [
    "Existing label",
    "Example",
    MAX_CUSTOM_TAB_TITLE_LENGTH
  ]);
});

test("rename refuses unsupported Firefox pages before scripting", async () => {
  const { browser, calls } = createMockBrowser({
    tab: { id: 42, url: "about:addons", title: "Add-ons Manager", incognito: false }
  });
  const manager = createTabTitleRenaming({ browser });

  const result = await manager.applyRename(42, "Extensions");

  assert.deepEqual(result, { ok: false, reason: "page-not-scriptable" });
  assert.equal(calls.execute.length, 0);
});

test("tab context menu opens the dedicated rename dialog for the clicked tab", async () => {
  const { browser, calls } = createMockBrowser();
  const manager = createTabTitleRenaming({ browser });

  const result = await manager.handleMenuClick({ menuItemId: TAB_TITLE_MENU_ID }, {
    id: 42,
    url: "https://example.com/research",
    title: "Example",
    incognito: false
  });

  assert.deepEqual(result, { ok: true });
  assert.equal(calls.windows.length, 1);
  assert.equal(calls.windows[0].type, "popup");
  assert.match(calls.windows[0].url, /src\/tab-title\/rename\.html\?tabId=42$/);
});

test("menu creation is synchronous and visible only for eligible HTTP(S) Firefox tabs", async () => {
  const { browser, calls } = createMockBrowser();
  const manager = createTabTitleRenaming({ browser });

  const pending = manager.installMenu();

  assert.deepEqual(calls.createdMenus, [{
    id: TAB_TITLE_MENU_ID,
    title: "Rename tab title…",
    contexts: ["tab"],
    documentUrlPatterns: ["http://*/*", "https://*/*"]
  }]);
  assert.deepEqual(await pending, {
    ok: true,
    id: TAB_TITLE_MENU_ID,
    existing: false
  });
});

test("registering defers persistent MV3 menu creation to runtime.onInstalled", async () => {
  const { browser, calls } = createMockBrowser();
  const manager = createTabTitleRenaming({ browser });

  assert.deepEqual(manager.register(), { ok: true });
  assert.equal(calls.createdMenus.length, 0);
  assert.equal(calls.installedListeners.length, 1);
  assert.equal(calls.menuClickListeners.length, 1);

  calls.installedListeners[0]({ reason: "install", temporary: true });

  assert.deepEqual(calls.createdMenus, [{
    id: TAB_TITLE_MENU_ID,
    title: "Rename tab title…",
    contexts: ["tab"],
    documentUrlPatterns: ["http://*/*", "https://*/*"]
  }]);
});
