import test from "node:test";
import assert from "node:assert/strict";
import { createTreeBranchActions } from "../src/background/tree-branch-actions.js";
import { LOGICAL_ID_KEY, TREE_PARENT_LOGICAL_ID_KEY } from "../src/background/browser-state.js";

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
    groupId: -1,
    splitViewId: -1,
    incognito: false,
    ...overrides
  };
}

function sessionApi(tabs) {
  const values = new Map();
  const keyFor = (tabId, key) => `${tabId}:${key}`;

  for (const item of tabs) {
    if (item.logicalId) values.set(keyFor(item.id, LOGICAL_ID_KEY), item.logicalId);
    if (item.treeParentLogicalId) values.set(keyFor(item.id, TREE_PARENT_LOGICAL_ID_KEY), item.treeParentLogicalId);
  }

  return {
    values,
    api: {
      async getTabValue(tabId, key) {
        return values.get(keyFor(tabId, key));
      },
      async setTabValue(tabId, key, value) {
        values.set(keyFor(tabId, key), value);
      },
      async removeTabValue(tabId, key) {
        values.delete(keyFor(tabId, key));
      }
    }
  };
}

function snapshot(tabs) {
  const windowsById = new Map();
  for (const item of tabs) {
    if (!windowsById.has(item.windowId)) {
      windowsById.set(item.windowId, { id: item.windowId, focused: item.windowId === 1, incognito: false, tabs: [] });
    }
    windowsById.get(item.windowId).tabs.push(item);
  }
  return { schemaVersion: 2, capturedAt: 1, groups: [], windows: [...windowsById.values()] };
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


test("move tree branch opens a new window and preserves the verified branch", async () => {
  const reasons = [];
  const moves = [];
  const created = [];
  let readCount = 0;
  const source = [
    tab(1,"root",0),
    tab(2,"child",1,"root"),
    tab(3,"leaf",2,"child"),
    tab(4,"other",3)
  ];
  const moved = [
    tab(1,"root",0,null,{ windowId: 9 }),
    tab(2,"child",1,"root",{ windowId: 9 }),
    tab(3,"leaf",2,"child",{ windowId: 9 }),
    tab(4,"other",0,null,{ windowId: 1 })
  ];
  const session = sessionApi(source);
  const manager = createTreeBranchActions({
    browser: {
      sessions: session.api,
      windows: {
        create: async (details) => {
          created.push(details);
          session.values.delete(`1:${LOGICAL_ID_KEY}`);
          session.values.delete(`1:${TREE_PARENT_LOGICAL_ID_KEY}`);
          return { id: 9 };
        },
        remove: async () => {}
      },
      tabs: {
        remove: async () => {},
        discard: async () => {},
        move: async (ids, details) => {
          moves.push({ ids, details });
          session.values.delete(`${ids}:${LOGICAL_ID_KEY}`);
          session.values.delete(`${ids}:${TREE_PARENT_LOGICAL_ID_KEY}`);
        },
        get: async () => { throw new Error("rollback should not run"); },
        query: async () => []
      }
    },
    readLiveSnapshot: async () => {
      readCount += 1;
      return readCount <= 2 ? snapshot(source) : snapshot(moved);
    },
    broadcastChange: (reason) => reasons.push(reason)
  });

  const result = await manager.moveTreeBranchToNewWindow(1);
  assert.deepEqual(result, { ok: true, moved: 3, windowId: 9 });
  assert.deepEqual(created, [{ tabId: 1, focused: true }]);
  assert.deepEqual(moves, [
    { ids: 2, details: { windowId: 9, index: -1 } },
    { ids: 3, details: { windowId: 9, index: -1 } }
  ]);
  assert.deepEqual(reasons, ["tree-branch-moved"]);
  assert.equal(session.values.get(`1:${LOGICAL_ID_KEY}`), "root");
  assert.equal(session.values.get(`2:${LOGICAL_ID_KEY}`), "child");
  assert.equal(session.values.get(`2:${TREE_PARENT_LOGICAL_ID_KEY}`), "root");
  assert.equal(session.values.get(`3:${LOGICAL_ID_KEY}`), "leaf");
  assert.equal(session.values.get(`3:${TREE_PARENT_LOGICAL_ID_KEY}`), "child");
});

test("move tree branch rejects pinned native-group or Split View members before Firefox mutation", async () => {
  let createCalled = false;
  const manager = createTreeBranchActions({
    browser: {
      windows: { create: async () => { createCalled = true; return { id: 9 }; }, remove: async () => {} },
      tabs: { remove: async () => {}, discard: async () => {}, move: async () => {}, get: async () => ({}), query: async () => [] }
    },
    readLiveSnapshot: async () => snapshot([
      tab(1,"root",0),
      tab(2,"child",1,"root",{ pinned: true }),
      tab(3,"leaf",2,"child",{ groupId: 5 }),
      tab(4,"split",3,"root",{ splitViewId: 8 })
    ]),
    broadcastChange: () => {}
  });

  const result = await manager.moveTreeBranchToNewWindow(1);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "tree-branch-not-movable");
  assert.equal(result.blockedCount, 3);
  assert.equal(result.pinnedCount, 1);
  assert.equal(result.groupedCount, 1);
  assert.equal(result.splitViewCount, 1);
  assert.equal(createCalled, false);
});

test("move tree branch rolls the root back when descendant movement fails", async () => {
  const reasons = [];
  const rollbackMoves = [];
  const rollbackSource = [
    tab(1,"root",0),
    tab(2,"child",1,"root"),
    tab(3,"leaf",2,"child")
  ];
  const rollbackSession = sessionApi(rollbackSource);
  const manager = createTreeBranchActions({
    browser: {
      sessions: rollbackSession.api,
      windows: {
        create: async () => ({ id: 9 }),
        remove: async () => {}
      },
      tabs: {
        remove: async () => {},
        discard: async () => {},
        move: async (id, details) => {
          if (id === 2 && details.windowId === 9) throw new Error("simulated descendant move failure");
          rollbackMoves.push({ id, details });
        },
        get: async (id) => id === 1
          ? { id: 1, windowId: 9, index: 0 }
          : { id, windowId: 1, index: id - 1 },
        query: async () => []
      }
    },
    readLiveSnapshot: async () => snapshot(rollbackSource),
    broadcastChange: (reason) => reasons.push(reason)
  });

  const result = await manager.moveTreeBranchToNewWindow(1);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "browser-move-failed");
  assert.equal(result.rollbackFailed, false);
  assert.deepEqual(rollbackMoves, [{ id: 1, details: { windowId: 1, index: 0 } }]);
  assert.deepEqual(reasons, ["tree-branch-move-rollback"]);
});
