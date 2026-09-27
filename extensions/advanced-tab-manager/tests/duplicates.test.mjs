import test from "node:test";
import assert from "node:assert/strict";
import {
  buildExactDuplicateReview,
  buildTrackingNormalizedDuplicateReview,
  normalizeTrackingUrl,
  planDuplicateCleanup,
  planExactDuplicateCleanup
} from "../src/core/duplicates.js";

function snapshot(tabs) {
  return { schemaVersion: 2, capturedAt: 1, groups: [], windows: [{ id: 1, focused: true, incognito: false, tabs }] };
}

function tab(id, url, overrides = {}) {
  return {
    id,
    logicalId: `logical-${id}`,
    treeParentLogicalId: null,
    windowId: 1,
    index: id,
    groupId: -1,
    active: false,
    highlighted: false,
    pinned: false,
    audible: false,
    muted: false,
    discarded: false,
    hidden: false,
    incognito: false,
    title: `Tab ${id}`,
    url,
    favIconUrl: "",
    ...overrides
  };
}

test("groups only exact non-empty duplicate URLs", () => {
  const review = buildExactDuplicateReview(snapshot([
    tab(1, "https://example.com/a"),
    tab(2, "https://example.com/a"),
    tab(3, "https://example.com/a#fragment"),
    tab(4, "")
  ]));
  assert.equal(review.duplicateSets, 1);
  assert.equal(review.duplicateTabs, 1);
  assert.equal(review.sets[0].url, "https://example.com/a");
  assert.deepEqual(review.sets[0].members.map((item) => item.id), [1, 2]);
});

test("blocks active, pinned, audible, hidden, incognito, and tree-linked tabs", () => {
  const tabs = [
    tab(1, "https://example.com", { active: true }),
    tab(2, "https://example.com", { pinned: true }),
    tab(3, "https://example.com", { audible: true }),
    tab(4, "https://example.com", { hidden: true }),
    tab(5, "https://example.com", { incognito: true }),
    tab(6, "https://example.com", { treeParentLogicalId: "logical-7" }),
    tab(7, "https://example.com"),
    tab(8, "https://example.com")
  ];
  const set = buildExactDuplicateReview(snapshot(tabs)).sets[0];
  assert.deepEqual(set.members[0].blockedReasons, ["active"]);
  assert.deepEqual(set.members[1].blockedReasons, ["pinned"]);
  assert.deepEqual(set.members[2].blockedReasons, ["audible"]);
  assert.deepEqual(set.members[3].blockedReasons, ["hidden"]);
  assert.deepEqual(set.members[4].blockedReasons, ["incognito"]);
  assert.deepEqual(set.members[5].blockedReasons, ["tree-child"]);
  assert.deepEqual(set.members[6].blockedReasons, ["tree-parent"]);
  assert.deepEqual(set.members[7].blockedReasons, []);
});

test("uses the first guarded tab as the conservative default keeper", () => {
  const set = buildExactDuplicateReview(snapshot([
    tab(1, "https://example.com"),
    tab(2, "https://example.com", { pinned: true }),
    tab(3, "https://example.com")
  ])).sets[0];
  assert.equal(set.defaultKeepTabId, 2);
});

test("uses deterministic first tab when no duplicate is guarded", () => {
  const set = buildExactDuplicateReview(snapshot([
    tab(4, "https://example.com", { index: 4 }),
    tab(2, "https://example.com", { index: 2 })
  ])).sets[0];
  assert.equal(set.defaultKeepTabId, 2);
});

test("cleanup plan preserves user-selected keeper and every guarded tab", () => {
  const set = buildExactDuplicateReview(snapshot([
    tab(1, "https://example.com"),
    tab(2, "https://example.com", { pinned: true }),
    tab(3, "https://example.com"),
    tab(4, "https://example.com", { audible: true })
  ])).sets[0];
  const plan = planExactDuplicateCleanup(set, { keepTabId: 3 });
  assert.equal(plan.ok, true);
  assert.deepEqual(plan.closeTabIds, [1]);
  assert.deepEqual(plan.blocked.map((item) => item.tabId), [2, 4]);
});

test("cleanup plan fails closed when the selected keeper is stale", () => {
  const set = buildExactDuplicateReview(snapshot([
    tab(1, "https://example.com"),
    tab(2, "https://example.com")
  ])).sets[0];
  assert.deepEqual(planExactDuplicateCleanup(set, { keepTabId: 99 }), {
    ok: false,
    reason: "selected-keeper-not-in-current-set"
  });
});


test("tracking normalization removes only recognized tracking query parameters", () => {
  assert.deepEqual(
    normalizeTrackingUrl("https://Example.com/path?item=7&utm_source=newsletter&fbclid=abc#section"),
    {
      key: "https://example.com/path?item=7#section",
      removedTrackingParameters: 2
    }
  );
  assert.deepEqual(
    normalizeTrackingUrl("https://example.com/path?item=7&ref=home#section"),
    {
      key: "https://example.com/path?item=7&ref=home#section",
      removedTrackingParameters: 0
    }
  );
  assert.equal(normalizeTrackingUrl("about:blank"), null);
  assert.equal(normalizeTrackingUrl("https://user:secret@example.com/path?utm_source=x"), null);
});

test("tracking-normalized review groups only URLs that differ by recognized tracking parameters", () => {
  const review = buildTrackingNormalizedDuplicateReview(snapshot([
    tab(1, "https://example.com/article?id=7&utm_source=mail#comments"),
    tab(2, "https://example.com/article?id=7&fbclid=abc#comments"),
    tab(3, "https://example.com/article?id=8&utm_source=mail#comments"),
    tab(4, "https://example.com/article?id=7&utm_source=mail#top")
  ]));

  assert.equal(review.mode, "tracking-normalized");
  assert.equal(review.duplicateSets, 1);
  assert.equal(review.duplicateTabs, 1);
  assert.equal(review.sets[0].matchKey, "https://example.com/article?id=7#comments");
  assert.deepEqual(review.sets[0].members.map((item) => item.id), [1, 2]);
  assert.deepEqual(review.sets[0].originalUrls, [
    "https://example.com/article?id=7&utm_source=mail#comments",
    "https://example.com/article?id=7&fbclid=abc#comments"
  ]);
});

test("tracking-normalized cleanup preserves the same conservative guards", () => {
  const set = buildTrackingNormalizedDuplicateReview(snapshot([
    tab(1, "https://example.com/a?utm_source=one"),
    tab(2, "https://example.com/a?fbclid=two", { pinned: true }),
    tab(3, "https://example.com/a?msclkid=three")
  ])).sets[0];

  const plan = planDuplicateCleanup(set, { keepTabId: 3 });
  assert.equal(plan.ok, true);
  assert.equal(plan.mode, "tracking-normalized");
  assert.equal(plan.matchKey, "https://example.com/a");
  assert.deepEqual(plan.closeTabIds, [1]);
  assert.deepEqual(plan.blocked, [{ tabId: 2, reasons: ["pinned"] }]);
});
