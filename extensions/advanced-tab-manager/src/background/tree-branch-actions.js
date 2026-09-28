import { TAB_GROUP_ID_NONE, flattenTabs } from "../core/state.js";
import { LOGICAL_ID_KEY, TREE_PARENT_LOGICAL_ID_KEY } from "./browser-state.js";
import { collectTreeBranchTabs } from "../core/tree.js";

function branchPlan(snapshot, rootTabId) {
  if (!Number.isInteger(rootTabId)) return { ok: false, reason: "tree-root-required" };
  const tabs = flattenTabs(snapshot);
  const root = tabs.find((tab) => tab.id === rootTabId);
  if (!root) return { ok: false, reason: "tree-root-unavailable" };
  if (root.incognito) return { ok: false, reason: "private-window" };

  const branch = collectTreeBranchTabs(tabs, rootTabId);
  if (branch.length < 2) return { ok: false, reason: "tree-branch-has-no-descendants" };
  if (branch.some((tab) => tab.incognito || tab.windowId !== root.windowId)) {
    return { ok: false, reason: "tree-branch-invalid" };
  }

  return {
    ok: true,
    rootTabId,
    rootLogicalId: root.logicalId,
    sourceWindowId: root.windowId,
    members: branch.map((tab) => ({
      id: tab.id,
      logicalId: tab.logicalId,
      treeParentLogicalId: tab.treeParentLogicalId || null,
      windowId: tab.windowId,
      index: tab.index,
      groupId: Number.isInteger(tab.groupId) ? tab.groupId : TAB_GROUP_ID_NONE,
      splitViewId: Number.isInteger(tab.splitViewId) ? tab.splitViewId : -1,
      active: Boolean(tab.active),
      pinned: Boolean(tab.pinned),
      audible: Boolean(tab.audible),
      discarded: Boolean(tab.discarded)
    }))
  };
}

function planSignature(plan) {
  if (!plan?.ok) return null;
  return JSON.stringify(plan.members.map((tab) => [
    tab.id,
    tab.logicalId,
    tab.treeParentLogicalId,
    tab.windowId,
    tab.index,
    tab.groupId,
    tab.splitViewId
  ]));
}

export function createTreeBranchActions({ browser, readLiveSnapshot, broadcastChange }) {
  async function restoreBranchSessionMetadata(plan) {
    let failed = false;

    for (const member of plan.members) {
      try {
        await browser.sessions.setTabValue(member.id, LOGICAL_ID_KEY, member.logicalId);
        if (member.treeParentLogicalId) {
          await browser.sessions.setTabValue(member.id, TREE_PARENT_LOGICAL_ID_KEY, member.treeParentLogicalId);
        } else {
          await browser.sessions.removeTabValue(member.id, TREE_PARENT_LOGICAL_ID_KEY);
        }

        const [logicalId, parentLogicalId] = await Promise.all([
          browser.sessions.getTabValue(member.id, LOGICAL_ID_KEY),
          browser.sessions.getTabValue(member.id, TREE_PARENT_LOGICAL_ID_KEY)
        ]);
        if (logicalId !== member.logicalId || (parentLogicalId || null) !== member.treeParentLogicalId) {
          failed = true;
        }
      } catch {
        failed = true;
      }
    }

    return { ok: !failed };
  }

  async function verifiedPlan(rootTabId) {
    const first = branchPlan(await readLiveSnapshot(), rootTabId);
    if (!first.ok) return first;
    const second = branchPlan(await readLiveSnapshot(), rootTabId);
    if (!second.ok) {
      return { ok: false, reason: "tree-branch-changed", detailReason: second.reason };
    }
    if (first.rootLogicalId !== second.rootLogicalId || planSignature(first) !== planSignature(second)) {
      return { ok: false, reason: "tree-branch-changed" };
    }
    return second;
  }

  async function rollbackTreeBranchMove(plan, destinationWindowId) {
    let rollbackFailed = false;
    for (const member of [...plan.members].sort((left, right) => left.index - right.index || left.id - right.id)) {
      try {
        const live = await browser.tabs.get(member.id);
        if (live.windowId !== member.windowId || live.index !== member.index) {
          await browser.tabs.move(member.id, { windowId: member.windowId, index: member.index });
        }
      } catch {
        rollbackFailed = true;
      }
    }
    if (Number.isInteger(destinationWindowId)) {
      try {
        const remaining = await browser.tabs.query({ windowId: destinationWindowId });
        if (remaining.length === 0) await browser.windows.remove(destinationWindowId);
      } catch {
        // Firefox may already have closed an empty rollback window.
      }
    }
    const metadata = await restoreBranchSessionMetadata(plan);
    if (!metadata.ok) rollbackFailed = true;

    broadcastChange("tree-branch-move-rollback");
    return { rollbackFailed };
  }

  async function closeTreeBranch(rootTabId) {
    const plan = await verifiedPlan(rootTabId);
    if (!plan.ok) return plan;

    const tabIds = plan.members.map((tab) => tab.id);
    try {
      await browser.tabs.remove(tabIds);
    } catch (error) {
      broadcastChange("tree-branch-close-reconcile");
      return { ok: false, reason: "browser-remove-failed", detail: String(error?.message || error) };
    }

    broadcastChange("tree-branch-closed");
    return { ok: true, closed: tabIds.length };
  }

  async function discardTreeBranch(rootTabId) {
    const plan = await verifiedPlan(rootTabId);
    if (!plan.ok) return plan;

    const blocked = plan.members.filter((tab) => tab.active || tab.pinned || tab.audible);
    if (blocked.length) {
      return { ok: false, reason: "tree-branch-not-discardable", blockedCount: blocked.length };
    }

    const tabIds = plan.members.filter((tab) => !tab.discarded).map((tab) => tab.id);
    if (!tabIds.length) return { ok: true, discarded: 0 };

    try {
      await browser.tabs.discard(tabIds);
    } catch (error) {
      broadcastChange("tree-branch-discard-reconcile");
      return { ok: false, reason: "browser-discard-failed", detail: String(error?.message || error) };
    }

    broadcastChange("tree-branch-discarded");
    return { ok: true, discarded: tabIds.length };
  }

  async function moveTreeBranchToNewWindow(rootTabId) {
    const plan = await verifiedPlan(rootTabId);
    if (!plan.ok) return plan;

    const blocked = plan.members.filter((tab) => tab.pinned || tab.groupId !== TAB_GROUP_ID_NONE || tab.splitViewId !== -1);
    if (blocked.length) {
      return {
        ok: false,
        reason: "tree-branch-not-movable",
        blockedCount: blocked.length,
        pinnedCount: blocked.filter((tab) => tab.pinned).length,
        groupedCount: blocked.filter((tab) => tab.groupId !== TAB_GROUP_ID_NONE).length,
        splitViewCount: blocked.filter((tab) => tab.splitViewId !== -1).length
      };
    }

    let destinationWindowId = null;
    try {
      const created = await browser.windows.create({ tabId: plan.rootTabId, focused: true });
      destinationWindowId = created?.id;
      if (!Number.isInteger(destinationWindowId)) throw new Error("Firefox did not return the new window ID");

      const descendantIds = plan.members.slice(1).map((tab) => tab.id);
      for (const descendantId of descendantIds) {
        await browser.tabs.move(descendantId, { windowId: destinationWindowId, index: -1 });
      }

      const metadata = await restoreBranchSessionMetadata(plan);
      if (!metadata.ok) throw new Error("Firefox tab session metadata verification failed after window move");
    } catch (error) {
      const rollback = await rollbackTreeBranchMove(plan, destinationWindowId);
      return {
        ok: false,
        reason: "browser-move-failed",
        detail: String(error?.message || error),
        rollbackFailed: rollback.rollbackFailed
      };
    }

    const after = branchPlan(await readLiveSnapshot(), rootTabId);
    const sameMembers = after.ok
      && after.members.length === plan.members.length
      && after.members.every((tab, index) => {
        const before = plan.members[index];
        return tab.id === before.id
          && tab.logicalId === before.logicalId
          && tab.treeParentLogicalId === before.treeParentLogicalId
          && tab.splitViewId === before.splitViewId
          && tab.windowId === destinationWindowId;
      });

    if (!sameMembers) {
      const rollback = await rollbackTreeBranchMove(plan, destinationWindowId);
      return {
        ok: false,
        reason: "tree-branch-move-verification-failed",
        rollbackFailed: rollback.rollbackFailed
      };
    }

    broadcastChange("tree-branch-moved");
    return { ok: true, moved: plan.members.length, windowId: destinationWindowId };
  }

  return { closeTreeBranch, discardTreeBranch, moveTreeBranchToNewWindow };
}
