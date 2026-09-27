import test from "node:test";
import assert from "node:assert/strict";
import { createTabResidencyPolicy } from "../src/background/tab-residency.js";

function mockBrowser(initialTabs, failingUpdates = new Set()) {
  const state = new Map(initialTabs.map((tab) => [tab.id, { ...tab }]));
  const updates = [];
  return {
    updates,
    browser: {
      tabs: {
        async query() {
          return [...state.values()].map((tab) => ({ ...tab }));
        },
        async update(tabId, changes) {
          if (failingUpdates.has(tabId)) throw new Error(`update failed for ${tabId}`);
          const current = state.get(tabId);
          if (!current) throw new Error("missing tab");
          const next = { ...current, ...changes };
          state.set(tabId, next);
          updates.push({ tabId, changes: { ...changes } });
          return { ...next };
        },
        async get(tabId) {
          const current = state.get(tabId);
          if (!current) throw new Error("missing tab");
          return { ...current };
        }
      }
    }
  };
}

test("protectAllOpenTabs disables Firefox automatic discard for every eligible open tab", async () => {
  const { browser, updates } = mockBrowser([
    { id: 1, incognito: false, autoDiscardable: true },
    { id: 2, incognito: false, autoDiscardable: false },
    { id: 3, incognito: true, autoDiscardable: true }
  ]);
  const policy = createTabResidencyPolicy({ browser });
  const result = await policy.protectAllOpenTabs();

  assert.equal(result.ok, true);
  assert.equal(result.inspected, 3);
  assert.equal(result.changed, 1);
  assert.equal(result.skipped, 1);
  assert.deepEqual(updates, [{ tabId: 1, changes: { autoDiscardable: false } }]);
});

test("protectTab applies the same default to a newly created background tab", async () => {
  const { browser, updates } = mockBrowser([
    { id: 7, incognito: false, active: false, autoDiscardable: true }
  ]);
  const policy = createTabResidencyPolicy({ browser });
  const result = await policy.protectTab({ id: 7, incognito: false, active: false, autoDiscardable: true });

  assert.deepEqual(result, { ok: true, changed: true, skipped: false, tabId: 7 });
  assert.deepEqual(updates, [{ tabId: 7, changes: { autoDiscardable: false } }]);
});

test("bulk protection is fail-soft and reports an individual tab update failure", async () => {
  const { browser, updates } = mockBrowser([
    { id: 11, incognito: false, autoDiscardable: true },
    { id: 12, incognito: false, autoDiscardable: true }
  ], new Set([12]));
  const policy = createTabResidencyPolicy({ browser });
  const result = await policy.protectAllOpenTabs();

  assert.equal(result.ok, false);
  assert.equal(result.changed, 1);
  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0].tabId, 12);
  assert.deepEqual(updates, [{ tabId: 11, changes: { autoDiscardable: false } }]);
});
