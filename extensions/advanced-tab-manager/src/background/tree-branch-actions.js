import { flattenTabs } from "../core/state.js";
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
    members: branch.map((tab) => ({
      id: tab.id,
      logicalId: tab.logicalId,
      treeParentLogicalId: tab.treeParentLogicalId || null,
      windowId: tab.windowId,
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
    tab.windowId
  ]));
}

export function createTreeBranchActions({ browser, readLiveSnapshot, broadcastChange }) {
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

  return { closeTreeBranch, discardTreeBranch };
}
