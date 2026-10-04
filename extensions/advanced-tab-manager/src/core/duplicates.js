import { flattenTabs } from "./state.js";

export const DUPLICATE_MODES = Object.freeze({
  EXACT_URL: "exact-url",
  TRACKING_NORMALIZED: "tracking-normalized"
});

export const DUPLICATE_POLICY = Object.freeze({
  mode: DUPLICATE_MODES.EXACT_URL,
  normalizedMode: DUPLICATE_MODES.TRACKING_NORMALIZED,
  reviewRequired: true,
  blockedReasons: Object.freeze(["active", "pinned", "audible", "hidden", "incognito", "protected", "tree-child", "tree-parent", "excluded"])
});

const TRACKING_PARAMETERS = Object.freeze(new Set([
  "gclid",
  "dclid",
  "fbclid",
  "msclkid",
  "mc_cid",
  "mc_eid"
]));

function tabOrder(a, b) {
  return Number(b.windowFocused) - Number(a.windowFocused) || a.windowId - b.windowId || a.index - b.index || a.id - b.id;
}

function blockReasons(tab, treeParentLogicalIds, excludedTabIds) {
  const reasons = [];
  if (tab.active) reasons.push("active");
  if (tab.pinned) reasons.push("pinned");
  if (tab.audible) reasons.push("audible");
  if (tab.hidden) reasons.push("hidden");
  if (tab.incognito) reasons.push("incognito");
  if (tab.cleanupProtected) reasons.push("protected");
  if (tab.treeParentLogicalId) reasons.push("tree-child");
  if (tab.logicalId && treeParentLogicalIds.has(tab.logicalId)) reasons.push("tree-parent");
  if (excludedTabIds.has(tab.id)) reasons.push("excluded");
  return reasons;
}

export function isTrackingParameter(name) {
  const normalized = String(name || "").toLocaleLowerCase();
  return normalized.startsWith("utm_") || TRACKING_PARAMETERS.has(normalized);
}

export function normalizeTrackingUrl(url) {
  if (typeof url !== "string" || !url) return null;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) return null;
  if (parsed.username || parsed.password) return null;

  let removedTrackingParameters = 0;
  for (const key of [...parsed.searchParams.keys()]) {
    if (!isTrackingParameter(key)) continue;
    removedTrackingParameters += parsed.searchParams.getAll(key).length;
    parsed.searchParams.delete(key);
  }

  return {
    key: removedTrackingParameters ? parsed.href : url,
    removedTrackingParameters
  };
}

function duplicateKeyForUrl(url, mode) {
  if (mode === DUPLICATE_MODES.EXACT_URL) return typeof url === "string" && url ? url : null;
  if (mode === DUPLICATE_MODES.TRACKING_NORMALIZED) return normalizeTrackingUrl(url)?.key ?? null;
  return null;
}

export function buildDuplicateReview(snapshot, { mode = DUPLICATE_MODES.EXACT_URL, excludedTabIds = [] } = {}) {
  if (!Object.values(DUPLICATE_MODES).includes(mode)) {
    return {
      mode,
      reviewRequired: true,
      duplicateSets: 0,
      duplicateTabs: 0,
      sets: [],
      reason: "unsupported-duplicate-mode"
    };
  }

  const excluded = new Set(excludedTabIds);
  const treeParentLogicalIds = new Set(
    flattenTabs(snapshot).map((tab) => tab.treeParentLogicalId).filter(Boolean)
  );
  const byKey = new Map();

  for (const window of snapshot.windows) {
    for (const tab of window.tabs) {
      const matchKey = duplicateKeyForUrl(tab.url, mode);
      if (!matchKey) continue;
      if (!byKey.has(matchKey)) byKey.set(matchKey, []);
      byKey.get(matchKey).push({ ...tab, windowFocused: Boolean(window.focused) });
    }
  }

  const sets = [];
  for (const [matchKey, rawTabs] of byKey) {
    if (rawTabs.length < 2) continue;
    const members = rawTabs.sort(tabOrder).map((tab) => ({
      ...tab,
      blockedReasons: blockReasons(tab, treeParentLogicalIds, excluded)
    }));
    const blocked = members.filter((tab) => tab.blockedReasons.length > 0);
    const defaultKeepTabId = (blocked[0] || members[0]).id;
    const originalUrls = [...new Set(members.map((tab) => tab.url))];

    sets.push({
      id: `${mode}:${matchKey}`,
      mode,
      matchKey,
      url: matchKey,
      originalUrls,
      members,
      defaultKeepTabId,
      eligibleCloseCount: members.filter((tab) => tab.id !== defaultKeepTabId && tab.blockedReasons.length === 0).length
    });
  }

  sets.sort((a, b) => a.matchKey.localeCompare(b.matchKey));
  return {
    mode,
    reviewRequired: true,
    duplicateSets: sets.length,
    duplicateTabs: sets.reduce((count, set) => count + set.members.length - 1, 0),
    sets
  };
}

export function buildExactDuplicateReview(snapshot, options = {}) {
  return buildDuplicateReview(snapshot, { ...options, mode: DUPLICATE_MODES.EXACT_URL });
}

export function buildTrackingNormalizedDuplicateReview(snapshot, options = {}) {
  return buildDuplicateReview(snapshot, { ...options, mode: DUPLICATE_MODES.TRACKING_NORMALIZED });
}

export function planDuplicateCleanup(duplicateSet, { keepTabId = duplicateSet?.defaultKeepTabId } = {}) {
  if (!duplicateSet || !Array.isArray(duplicateSet.members) || duplicateSet.members.length < 2) {
    return { ok: false, reason: "duplicate-set-unavailable" };
  }
  const selected = duplicateSet.members.find((tab) => tab.id === keepTabId);
  if (!selected) return { ok: false, reason: "selected-keeper-not-in-current-set" };

  const closeTabIds = duplicateSet.members
    .filter((tab) => tab.id !== selected.id && tab.blockedReasons.length === 0)
    .map((tab) => tab.id);
  const blocked = duplicateSet.members
    .filter((tab) => tab.id !== selected.id && tab.blockedReasons.length > 0)
    .map((tab) => ({ tabId: tab.id, reasons: [...tab.blockedReasons] }));

  return {
    ok: true,
    mode: duplicateSet.mode,
    matchKey: duplicateSet.matchKey ?? duplicateSet.url,
    url: duplicateSet.url,
    keepTabId: selected.id,
    closeTabIds,
    blocked
  };
}

export function planExactDuplicateCleanup(duplicateSet, options = {}) {
  return planDuplicateCleanup(duplicateSet, options);
}
