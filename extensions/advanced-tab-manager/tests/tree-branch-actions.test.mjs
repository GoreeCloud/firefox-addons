import test from "node:test";
import assert from "node:assert/strict";
import { createTreeBranchActions } from "../src/background/tree-branch-actions.js";

function tab(id, logicalId, index, treeParentLogicalId = null, overrides = {}) {
  return {
    id,
    logicalId,
    treeParentLogicalId,
    windowId: 1,
    index,
    active: false,
    pinned: false,
    audible: false,
    discarded: false,
    incognito: false,
    ...overrides
  };
}

function snapshot(tabs) {
  return { schemaVersion: 2, capturedAt: 1, groups: [], windows: [{ id: 1, focused: true, incognito: false, tabs }] };
}

test("close tree branch rechecks branch identity before closing every current descendant", async () => {
  const removed = [];
  const reasons = [];
  const tabs = [tab(1,"root",0),tab(2,"child",1,"root"),tab(3,"leaf",2,"child"),tab(4,"other",3)];
  const manager = createTreeBranchActions({
    browser: { tabs: { remove: async (ids) => removed.push(...ids), discard: async () => {} } },
    readLiveSnapshot: async () => snapshot(tabs),
    broadcastChange: (reason) => reasons.push(reason)
  });
  const result = await manager.closeTreeBranch(2);
  assert.deepEqual(result, { ok: true, closed: 2 });
  assert.deepEqual(removed, [2,3]);
  assert.deepEqual(reasons, ["tree-branch-closed"]);
});

test("tree branch operations fail closed when the branch changes between verification reads", async () => {
  let readCount = 0;
  let removeCalled = false;
  const manager = createTreeBranchActions({
    browser: { tabs: { remove: async () => { removeCalled = true; }, discard: async () => {} } },
    readLiveSnapshot: async () => {
      readCount += 1;
      return readCount === 1
        ? snapshot([tab(1,"root",0),tab(2,"child",1,"root")])
        : snapshot([tab(1,"root",0),tab(2,"child",1,null)]);
    },
    broadcastChange: () => {}
  });
  const result = await manager.closeTreeBranch(1);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "tree-branch-changed");
  assert.equal(removeCalled, false);
});

test("discard tree branch rejects active pinned or audible members without partial mutation", async () => {
  let discardCalled = false;
  const manager = createTreeBranchActions({
    browser: { tabs: { remove: async () => {}, discard: async () => { discardCalled = true; } } },
    readLiveSnapshot: async () => snapshot([
      tab(1,"root",0),
      tab(2,"child",1,"root",{ pinned: true }),
      tab(3,"leaf",2,"child")
    ]),
    broadcastChange: () => {}
  });
  const result = await manager.discardTreeBranch(1);
  assert.deepEqual(result, { ok: false, reason: "tree-branch-not-discardable", blockedCount: 1 });
  assert.equal(discardCalled, false);
});

test("discard tree branch sends only currently loaded eligible members to Firefox", async () => {
  const discarded = [];
  const reasons = [];
  const manager = createTreeBranchActions({
    browser: { tabs: { remove: async () => {}, discard: async (ids) => discarded.push(...ids) } },
    readLiveSnapshot: async () => snapshot([
      tab(1,"root",0),
      tab(2,"child",1,"root",{ discarded: true }),
      tab(3,"leaf",2,"child")
    ]),
    broadcastChange: (reason) => reasons.push(reason)
  });
  const result = await manager.discardTreeBranch(1);
  assert.deepEqual(result, { ok: true, discarded: 2 });
  assert.deepEqual(discarded, [1,3]);
  assert.deepEqual(reasons, ["tree-branch-discarded"]);
});
