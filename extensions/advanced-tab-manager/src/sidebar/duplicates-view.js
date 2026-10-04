import {
  buildDuplicateReview,
  DUPLICATE_MODES
} from "../core/duplicates.js";
import { badge } from "./ui.js";

const REASON_LABELS = new Map([
  ["active", "Active"],
  ["pinned", "Pinned"],
  ["audible", "Audio"],
  ["hidden", "Hidden"],
  ["incognito", "Private"],
  ["protected", "Protected"],
  ["tree-child", "Tree child"],
  ["tree-parent", "Tree parent"],
  ["excluded", "Excluded"]
]);

function memberRow(tab, duplicateSet) {
  const row = document.createElement("label");
  row.className = "duplicate-member";

  const chooser = document.createElement("input");
  chooser.type = "radio";
  chooser.name = `duplicate-keeper-${duplicateSet.id}`;
  chooser.value = String(tab.id);
  chooser.checked = tab.id === duplicateSet.defaultKeepTabId;
  chooser.setAttribute("aria-label", `Keep ${tab.title}`);

  const main = document.createElement("div");
  main.className = "duplicate-main";
  const title = document.createElement("div");
  title.className = "tab-title";
  title.textContent = tab.title;
  const meta = document.createElement("div");
  meta.className = "tab-url";
  meta.textContent = `Window ${tab.windowId} · position ${tab.index + 1}`;
  main.append(title, meta);

  if (duplicateSet.mode === DUPLICATE_MODES.TRACKING_NORMALIZED) {
    const originalUrl = document.createElement("div");
    originalUrl.className = "duplicate-original-url";
    originalUrl.textContent = tab.url;
    main.append(originalUrl);
  }

  if (tab.blockedReasons.length) {
    const badges = document.createElement("div");
    badges.className = "badges";
    for (const reason of tab.blockedReasons) badges.append(badge(REASON_LABELS.get(reason) || reason));
    badges.append(badge("Never auto-closed"));
    main.append(badges);
  }

  row.append(chooser, main);
  return row;
}

function duplicateCard(duplicateSet) {
  const card = document.createElement("section");
  card.className = "duplicate-card";
  card.dataset.duplicateSetId = duplicateSet.id;

  const heading = document.createElement("div");
  heading.className = "duplicate-heading";
  const title = document.createElement("div");
  title.className = "duplicate-url";
  title.textContent = duplicateSet.matchKey;
  const count = document.createElement("div");
  count.className = "saved-meta";
  const matchLabel = duplicateSet.mode === DUPLICATE_MODES.EXACT_URL ? "exact matches" : "tracking-normalized matches";
  count.textContent = `${duplicateSet.members.length} ${matchLabel} · ${duplicateSet.eligibleCloseCount} currently eligible to close`;
  heading.append(title, count);
  card.append(heading);

  const members = document.createElement("div");
  members.className = "duplicate-members";
  for (const tab of duplicateSet.members) members.append(memberRow(tab, duplicateSet));
  card.append(members);

  const tools = document.createElement("div");
  tools.className = "duplicate-tools";
  const policy = document.createElement("div");
  policy.className = "duplicate-policy";
  policy.textContent = duplicateSet.mode === DUPLICATE_MODES.EXACT_URL
    ? "Exact URL only. Active, pinned, audible, hidden/private, protected, and tree-linked tabs are excluded from cleanup."
    : "Tracking-normalized mode ignores only utm_* and recognized click-tracking parameters. Path, fragment, and every other query parameter remain significant. Existing cleanup guards still apply.";

  const cleanup = document.createElement("button");
  cleanup.className = "row-action duplicate-cleanup";
  cleanup.type = "button";
  cleanup.dataset.action = "cleanup-duplicates";
  cleanup.dataset.duplicateMode = duplicateSet.mode;
  cleanup.dataset.duplicateKey = duplicateSet.matchKey;
  cleanup.dataset.duplicateUrl = duplicateSet.url;
  cleanup.textContent = "Close eligible duplicates";
  cleanup.disabled = duplicateSet.eligibleCloseCount === 0;
  tools.append(policy, cleanup);
  card.append(tools);
  return card;
}

function renderReview(results, { snapshot, needle, mode }) {
  results.replaceChildren();
  const review = buildDuplicateReview(snapshot, { mode });
  const sets = needle
    ? review.sets.filter((set) => `${set.matchKey} ${set.members.map((tab) => `${tab.title} ${tab.url}`).join(" ")}`.toLocaleLowerCase().includes(needle))
    : review.sets;

  const intro = document.createElement("div");
  intro.className = "duplicate-intro";
  if (mode === DUPLICATE_MODES.EXACT_URL) {
    intro.textContent = `${review.duplicateSets} exact duplicate sets · ${review.duplicateTabs} extra exact-match tabs. Review each set and choose a tab to keep before cleanup.`;
  } else {
    intro.textContent = `${review.duplicateSets} tracking-normalized duplicate sets · ${review.duplicateTabs} extra matching tabs. This optional mode ignores recognized tracking query parameters only; review the original URLs before cleanup.`;
  }
  results.append(intro);

  for (const set of sets) results.append(duplicateCard(set));
  if (!sets.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    if (needle) {
      empty.textContent = "No duplicate set matches this search.";
    } else if (mode === DUPLICATE_MODES.EXACT_URL) {
      empty.textContent = "No exact-URL duplicate tabs are open.";
    } else {
      empty.textContent = "No tracking-normalized duplicate tabs are open.";
    }
    results.append(empty);
  }
}

export function renderDuplicateView({ snapshot, needle }) {
  const wrapper = document.createElement("div");
  wrapper.className = "duplicate-view";

  const controls = document.createElement("div");
  controls.className = "duplicate-mode-control";
  const copy = document.createElement("div");
  copy.className = "duplicate-policy";
  copy.textContent = "Matching is exact by default. Tracking-normalized review is optional and never runs cleanup automatically.";

  const field = document.createElement("label");
  field.className = "duplicate-mode-field";
  const label = document.createElement("span");
  label.textContent = "Match";
  const select = document.createElement("select");
  select.setAttribute("aria-label", "Duplicate matching mode");
  select.innerHTML = `
    <option value="${DUPLICATE_MODES.EXACT_URL}">Exact URL</option>
    <option value="${DUPLICATE_MODES.TRACKING_NORMALIZED}">Ignore tracking parameters</option>
  `;
  field.append(label, select);
  controls.append(copy, field);

  const results = document.createElement("div");
  results.className = "duplicate-results";

  select.addEventListener("change", () => {
    renderReview(results, { snapshot, needle, mode: select.value });
  });

  wrapper.append(controls, results);
  renderReview(results, { snapshot, needle, mode: DUPLICATE_MODES.EXACT_URL });
  return wrapper;
}
