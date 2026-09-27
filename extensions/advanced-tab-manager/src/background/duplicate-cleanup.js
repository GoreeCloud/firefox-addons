import {
  buildDuplicateReview,
  DUPLICATE_MODES,
  planDuplicateCleanup
} from "../core/duplicates.js";

export function createDuplicateCleanup({ browser, readLiveSnapshot, broadcastChange }) {
  async function cleanupDuplicates({ mode = DUPLICATE_MODES.EXACT_URL, matchKey, keepTabId }) {
    if (!Object.values(DUPLICATE_MODES).includes(mode)) {
      return { ok: false, reason: "unsupported-duplicate-mode" };
    }
    if (typeof matchKey !== "string" || !matchKey) {
      return { ok: false, reason: "duplicate-match-key-required" };
    }
    if (!Number.isInteger(keepTabId)) return { ok: false, reason: "selected-keeper-required" };

    const snapshot = await readLiveSnapshot();
    const review = buildDuplicateReview(snapshot, { mode });
    const duplicateSet = review.sets.find((candidate) => candidate.matchKey === matchKey);
    if (!duplicateSet) return { ok: false, reason: "duplicate-set-no-longer-current" };

    const plan = planDuplicateCleanup(duplicateSet, { keepTabId });
    if (!plan.ok) return plan;
    if (!plan.closeTabIds.length) {
      return {
        ok: true,
        mode,
        matchKey,
        closed: 0,
        keepTabId: plan.keepTabId,
        blocked: plan.blocked
      };
    }

    try {
      await browser.tabs.remove(plan.closeTabIds);
    } catch (error) {
      broadcastChange("duplicate-cleanup-reconcile");
      return { ok: false, reason: "browser-remove-failed", detail: String(error?.message || error) };
    }

    broadcastChange("duplicate-cleanup");
    return {
      ok: true,
      mode,
      matchKey,
      closed: plan.closeTabIds.length,
      keepTabId: plan.keepTabId,
      blocked: plan.blocked
    };
  }

  async function cleanupExactDuplicates({ url, keepTabId }) {
    if (typeof url !== "string" || !url) return { ok: false, reason: "duplicate-url-required" };
    return cleanupDuplicates({
      mode: DUPLICATE_MODES.EXACT_URL,
      matchKey: url,
      keepTabId
    });
  }

  return { cleanupDuplicates, cleanupExactDuplicates };
}
