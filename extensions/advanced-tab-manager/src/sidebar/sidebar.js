import { flattenTabs, summarizeTabResidency } from "../core/state.js";
import {
  defaultSnoozeWakeAt,
  laterTodayWakeAt,
  nextWeekWakeAt,
  parseLocalSnoozeTime,
  toLocalDateTimeValue,
  tomorrowMorningWakeAt
} from "../core/snooze-time.js";
import { analyzeTree } from "../core/tree.js";
import { renderDuplicateView } from "./duplicates-view.js";
import { renderOpenTabs } from "./open-tabs-view.js";
import { renderRulesView } from "./rules-view.js";
import { renderSavedView } from "./saved-view.js";
import { renderSnoozedView } from "./snoozed-view.js";

const search = document.querySelector("#search");
const summary = document.querySelector("#summary");
const content = document.querySelector("#content");
const refresh = document.querySelector("#refresh");
const saveWindow = document.querySelector("#save-window");
const viewMode = document.querySelector("#view-mode");
const snoozeDialog = document.querySelector("#snooze-dialog");
const snoozeForm = document.querySelector("#snooze-form");
const snoozeDialogTab = document.querySelector("#snooze-dialog-tab");
const snoozeDeadline = document.querySelector("#snooze-deadline");
const snoozeDialogError = document.querySelector("#snooze-dialog-error");
const snoozeSubmit = document.querySelector("#snooze-submit");
const snoozeCancel = document.querySelector("#snooze-cancel");
const snoozeCancelX = document.querySelector("#snooze-cancel-x");
const laterTodayPreset = snoozeDialog.querySelector('[data-snooze-preset="later-today"]');

let snapshot = null;
let organizationalState = null;
let snoozeState = null;
let ruleState = null;
let rulePreview = null;
let snoozeContext = null;

function renderSummaryChips(items) {
  summary.replaceChildren();
  for (const [value, label, title] of items) {
    const chip = document.createElement("span");
    chip.className = "summary-chip";
    if (title) chip.title = title;
    const strong = document.createElement("strong");
    strong.textContent = String(value);
    const text = document.createElement("span");
    text.textContent = label;
    chip.append(strong, text);
    summary.append(chip);
  }
}

function render() {
  content.replaceChildren();
  if (!snapshot) return;

  const needle = search.value.trim().toLocaleLowerCase();
  const allTabs = flattenTabs(snapshot);
  const residency = summarizeTabResidency(snapshot);
  const discarded = residency.discardedTabs;
  const pinned = allTabs.filter((tab) => tab.pinned).length;
  const attached = snapshot.windows.reduce(
    (count, window) => count + [...analyzeTree(window.tabs).statusByLogicalId.values()].filter((status) => status === "attached").length,
    0
  );
  const savedSetCount = organizationalState?.tabSets.length ?? 0;
  const stashCount = organizationalState?.stashedItems.length ?? 0;
  const snoozedCount = snoozeState?.items.length ?? 0;
  const ruleCount = ruleState?.rules.length ?? 0;
  const summaryItems = [
    [allTabs.length, "tabs"],
    [residency.protectedTabs, "auto-protected", `${residency.protectedTabs} of ${residency.eligibleTabs} eligible tabs are protected from Firefox automatic unload. Manual Discard remains available.`],
    [snapshot.windows.length, "windows"],
    [savedSetCount, "Tab Sets"],
    [snoozedCount, "snoozed"],
    [pinned, "pinned"]
  ];
  if (snapshot.groups.length) summaryItems.push([snapshot.groups.length, "groups"]);
  if (attached) summaryItems.push([attached, "tree"]);
  if (stashCount) summaryItems.push([stashCount, "stashed"]);
  if (ruleCount) summaryItems.push([ruleCount, "rules"]);
  if (discarded) summaryItems.push([discarded, "discarded"]);
  renderSummaryChips(summaryItems);

  if (viewMode.value === "saved") {
    content.append(renderSavedView({ organizationalState, needle }));
    return;
  }
  if (viewMode.value === "snoozed") {
    content.append(renderSnoozedView({ snoozeState, needle }));
    return;
  }
  if (viewMode.value === "duplicates") {
    content.append(renderDuplicateView({ snapshot, needle }));
    return;
  }
  if (viewMode.value === "rules") {
    content.append(renderRulesView({ ruleState, rulePreview, needle }));
    return;
  }

  renderOpenTabs({ snapshot, needle, viewMode: viewMode.value, content });
}

async function load() {
  summary.textContent = "Reading live Firefox and saved state…";
  const [dashboard, snooze, rules] = await Promise.all([
    browser.runtime.sendMessage({ type: "atm:get-dashboard-state" }),
    browser.runtime.sendMessage({ type: "atm:get-snooze-state" }),
    browser.runtime.sendMessage({ type: "atm:get-rule-state" })
  ]);
  if (!dashboard?.ok) {
    snapshot = dashboard?.snapshot;
    organizationalState = null;
    snoozeState = snooze?.ok ? snooze.state : null;
    ruleState = rules?.ok ? rules.state : null;
    summary.textContent = `Saved state is unavailable (${dashboard?.reason || "unknown error"}).`;
    if (snapshot) render();
    return;
  }
  snapshot = dashboard.snapshot;
  organizationalState = dashboard.state;
  snoozeState = snooze?.ok ? snooze.state : null;
  ruleState = rules?.ok ? rules.state : null;
  render();
}

async function activate(tabId) {
  await browser.runtime.sendMessage({ type: "atm:activate-tab", tabId });
}

function openSnoozeDialog(context) {
  snoozeContext = context;
  snoozeDialogError.textContent = "";
  snoozeDialogTab.textContent = context.title || "Untitled tab";
  const wakeAt = context.wakeAt || defaultSnoozeWakeAt();
  snoozeDeadline.min = toLocalDateTimeValue(Date.now() + 60_000);
  snoozeDeadline.value = toLocalDateTimeValue(wakeAt);
  snoozeSubmit.textContent = context.mode === "reschedule" ? "Save wake time" : "Snooze tab";
  const laterToday = laterTodayWakeAt();
  laterTodayPreset.disabled = laterToday === null;
  laterTodayPreset.title = laterToday === null
    ? "No Later today preset remains; choose a custom time or Tomorrow."
    : `Later today at ${new Date(laterToday).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  snoozeDialog.showModal();
  snoozeDeadline.focus();
}

function closeSnoozeDialog() {
  if (snoozeDialog.open) snoozeDialog.close();
  snoozeContext = null;
  snoozeDialogError.textContent = "";
}


async function handleTreeAction(button) {
  const tabId = Number(button.dataset.tabId);
  const parentTabId = button.dataset.action === "indent" ? Number(button.dataset.parentTabId) : null;
  const result = await browser.runtime.sendMessage({ type: "atm:set-tree-parent", tabId, parentTabId });
  if (!result?.ok) {
    summary.textContent = `Tree relationship was not changed (${result?.reason || "unknown error"}).`;
    return;
  }
  await load();
}

async function handleSavedAction(button) {
  const id = button.dataset.savedId;
  const messages = {
    "restore-tab-set": { type: "atm:restore-tab-set", tabSetId: id },
    "delete-tab-set": { type: "atm:delete-tab-set", tabSetId: id },
    "restore-stashed-item": { type: "atm:restore-stashed-item", stashedItemId: id },
    "delete-stashed-item": { type: "atm:delete-stashed-item", stashedItemId: id },
    "clear-saved-items": { type: "atm:clear-saved-items" }
  };
  if (button.dataset.action === "clear-saved-items" && !window.confirm("Delete all saved Tab Sets and stashed items? Open Firefox tabs will not be closed.")) return;
  const result = await browser.runtime.sendMessage(messages[button.dataset.action]);
  if (!result?.ok) summary.textContent = `Saved-item operation failed (${result?.reason || "unknown error"}).`;
  await load();
}

async function handleSnoozedAction(button) {
  const snoozedItemId = button.dataset.snoozeId;
  if (button.dataset.action === "reschedule-snoozed-item") {
    const item = snoozeState?.items.find((candidate) => candidate.id === snoozedItemId);
    if (!item) {
      summary.textContent = "That snoozed tab is no longer available. Refresh and try again.";
      return;
    }
    openSnoozeDialog({
      mode: "reschedule",
      snoozedItemId,
      title: item.title,
      wakeAt: item.wakeAt
    });
    return;
  }

  if (button.dataset.action === "cancel-snoozed-item") {
    const item = snoozeState?.items.find((candidate) => candidate.id === snoozedItemId);
    if (!item) {
      summary.textContent = "That snoozed tab is no longer available. Refresh and try again.";
      return;
    }
    if (!window.confirm(`Cancel the snooze for "${item.title}" without reopening the tab? The stored recovery record will be deleted.`)) return;
    const cancelled = await browser.runtime.sendMessage({ type: "atm:cancel-snoozed-item", snoozedItemId });
    if (!cancelled?.ok) {
      summary.textContent = `Snooze was not cancelled (${cancelled?.reason || "unknown error"}).`;
    } else {
      summary.textContent = "Snooze cancelled. The tab was not reopened.";
    }
    await load();
    return;
  }

  const result = await browser.runtime.sendMessage({ type: "atm:restore-snoozed-item", snoozedItemId });
  if (!result?.ok) {
    summary.textContent = `Snoozed tab could not be opened (${result?.reason || "unknown error"}).`;
  }
  await load();
}

async function handleDuplicateCleanup(button) {
  const card = button.closest(".duplicate-card");
  const selected = card?.querySelector('input[type="radio"]:checked');
  const keepTabId = Number(selected?.value);
  if (!Number.isInteger(keepTabId)) {
    summary.textContent = "Choose one reviewed tab to keep before duplicate cleanup.";
    return;
  }

  const mode = button.dataset.duplicateMode || "exact-url";
  const matchKey = button.dataset.duplicateKey || button.dataset.duplicateUrl;
  const confirmation = mode === "tracking-normalized"
    ? "Close only the currently eligible tabs in this tracking-normalized set? This mode ignores recognized tracking query parameters, but preserves path, fragment, and all other query data. Guarded tabs will remain open."
    : "Close only the currently eligible exact-URL duplicates in this reviewed set? Guarded tabs will remain open.";
  if (!window.confirm(confirmation)) return;

  const result = await browser.runtime.sendMessage({
    type: "atm:cleanup-duplicates",
    mode,
    matchKey,
    keepTabId
  });
  if (!result?.ok) {
    summary.textContent = `Duplicate cleanup did not run (${result?.reason || "unknown error"}). Refresh and review the set again.`;
    await load();
    return;
  }
  const modeLabel = mode === "tracking-normalized" ? " tracking-normalized" : "";
  summary.textContent = `${result.closed} eligible${modeLabel} duplicate tab${result.closed === 1 ? "" : "s"} closed. Guarded tabs were preserved.`;
  await load();
}

async function handleRuleAction(button) {
  if (button.dataset.action === "toggle-rule-engine") {
    const result = await browser.runtime.sendMessage({
      type: "atm:set-rule-engine-enabled",
      enabled: !Boolean(ruleState?.enabled)
    });
    if (!result?.ok) summary.textContent = `Rule engine state was not changed (${result?.reason || "unknown error"}).`;
    rulePreview = null;
    await load();
    return;
  }

  if (button.dataset.action === "preview-rule-actions") {
    rulePreview = await browser.runtime.sendMessage({ type: "atm:preview-rule-evaluation" });
    if (!rulePreview?.ok) summary.textContent = `Rule preview failed (${rulePreview?.reason || "unknown error"}).`;
    render();
    return;
  }

  if (button.dataset.action === "apply-rule-actions") {
    if (!window.confirm("Apply the current conflict-free rule plan to live non-private tabs? No tabs will be closed or navigated.")) return;
    const result = await browser.runtime.sendMessage({ type: "atm:apply-rule-actions" });
    if (!result?.ok) {
      summary.textContent = `Rule actions were not fully applied (${result?.reason || "unknown error"}). Refresh and preview again.`;
    } else {
      summary.textContent = `${result.changedTabCount} tab${result.changedTabCount === 1 ? "" : "s"} changed from ${result.plannedTabCount} planned rule target${result.plannedTabCount === 1 ? "" : "s"}.`;
    }
    rulePreview = null;
    await load();
    return;
  }

  const rule = ruleState?.rules.find((candidate) => candidate.id === button.dataset.ruleId);
  if (!rule) {
    summary.textContent = "That rule is no longer available. Refresh and try again.";
    return;
  }

  if (button.dataset.action === "toggle-rule") {
    const result = await browser.runtime.sendMessage({
      type: "atm:upsert-rule",
      rule: { ...rule, enabled: !rule.enabled }
    });
    if (!result?.ok) summary.textContent = `Rule was not updated (${result?.reason || "unknown error"}).`;
    rulePreview = null;
    await load();
    return;
  }

  if (button.dataset.action === "delete-rule") {
    if (!window.confirm(`Delete rule "${rule.name}"?`)) return;
    const result = await browser.runtime.sendMessage({ type: "atm:delete-rule", ruleId: rule.id });
    if (!result?.ok) summary.textContent = `Rule was not deleted (${result?.reason || "unknown error"}).`;
    rulePreview = null;
    await load();
  }
}

content.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (button) {
    event.stopPropagation();

    if (button.dataset.action === "toggle-rule-engine"
      || button.dataset.action === "preview-rule-actions"
      || button.dataset.action === "apply-rule-actions"
      || button.dataset.action === "toggle-rule"
      || button.dataset.action === "delete-rule") {
      await handleRuleAction(button);
      return;
    }
    if (button.dataset.action === "cleanup-duplicates") {
      await handleDuplicateCleanup(button);
      return;
    }
    if (button.dataset.snoozeId) {
      await handleSnoozedAction(button);
      return;
    }
    if (button.dataset.savedId) {
      await handleSavedAction(button);
      return;
    }

    const tabId = Number(button.dataset.tabId);
    if (button.dataset.action === "move-tree-branch-new-window") {
      const branchSize = Number(button.dataset.branchSize);
      if (!window.confirm(`Move this tree branch of ${branchSize} tabs to a new Firefox window? The tabs stay open and their tree relationships are preserved.`)) return;
      const result = await browser.runtime.sendMessage({ type: "atm:move-tree-branch-new-window", tabId });
      if (!result?.ok) {
        const detail = result?.reason === "tree-branch-not-movable"
          ? ` ${result.blockedCount} tab${result.blockedCount === 1 ? " is" : "s are"} pinned, in a native group, or in Firefox Split View.`
          : result?.rollbackFailed
            ? " Automatic rollback was incomplete; refresh and review the affected windows."
            : "";
        summary.textContent = `Tree branch move did not run (${result?.reason || "unknown error"}).${detail}`;
      } else {
        summary.textContent = `${result.moved} tabs moved to a new Firefox window with tree relationships preserved.`;
      }
      await load();
      return;
    }

    if (button.dataset.action === "close-tree-branch" || button.dataset.action === "discard-tree-branch") {
      const branchSize = Number(button.dataset.branchSize);
      const closeBranch = button.dataset.action === "close-tree-branch";
      const confirmation = closeBranch
        ? `Close this tree branch of ${branchSize} tabs? The selected tab and all current descendants will close.`
        : `Discard this tree branch of ${branchSize} tabs? The tabs stay open and reload when activated.`;
      if (!window.confirm(confirmation)) return;
      const result = await browser.runtime.sendMessage({
        type: closeBranch ? "atm:close-tree-branch" : "atm:discard-tree-branch",
        tabId
      });
      if (!result?.ok) {
        const detail = result?.reason === "tree-branch-not-discardable"
          ? ` ${result.blockedCount} tab${result.blockedCount === 1 ? " is" : "s are"} active, pinned, or audible.`
          : "";
        summary.textContent = `Tree branch action did not run (${result?.reason || "unknown error"}).${detail}`;
      } else {
        const count = closeBranch ? result.closed : result.discarded;
        summary.textContent = closeBranch
          ? `${count} tabs in the tree branch closed.`
          : `${count} loaded tabs in the tree branch discarded.`;
      }
      await load();
      return;
    }
    if (button.dataset.action === "indent" || button.dataset.action === "outdent") {
      await handleTreeAction(button);
      return;
    }
    if (button.dataset.action === "toggle-cleanup-protected") {
      const result = await browser.runtime.sendMessage({
        type: "atm:set-cleanup-protected",
        tabId,
        protected: button.dataset.protected === "true"
      });
      if (!result?.ok) {
        summary.textContent = `Cleanup protection was not changed (${result?.reason || "unknown error"}).`;
      }
      await load();
      return;
    }
    if (button.dataset.action === "snooze") {
      const tab = flattenTabs(snapshot).find((candidate) => candidate.id === tabId);
      if (!tab) {
        summary.textContent = "That tab is no longer available. Refresh and try again.";
        return;
      }
      openSnoozeDialog({ mode: "new", tabId, title: tab.title });
      return;
    }
    if (button.dataset.action === "stash") {
      const result = await browser.runtime.sendMessage({ type: "atm:stash-tab", tabId });
      if (!result?.ok) summary.textContent = `Tab was not stashed (${result?.reason || "unknown error"}).`;
      await load();
      return;
    }

    const type = button.dataset.action === "discard" ? "atm:discard-tab" : "atm:close-tab";
    await browser.runtime.sendMessage({ type, tabId });
    return;
  }

  const activation = event.target.closest(".tab-activate");
  if (activation) await activate(Number(activation.dataset.tabId));
});

snoozeDialog.addEventListener("click", (event) => {
  const preset = event.target.closest("button[data-snooze-preset]");
  if (!preset) return;
  const wakeAt = preset.dataset.snoozePreset === "later-today"
    ? laterTodayWakeAt()
    : preset.dataset.snoozePreset === "tomorrow"
      ? tomorrowMorningWakeAt()
      : preset.dataset.snoozePreset === "next-week"
        ? nextWeekWakeAt()
        : defaultSnoozeWakeAt();
  if (wakeAt === null) {
    snoozeDialogError.textContent = "No Later today preset remains. Choose a custom time or Tomorrow.";
    snoozeDeadline.focus();
    return;
  }
  snoozeDeadline.value = toLocalDateTimeValue(wakeAt);
  snoozeDialogError.textContent = "";
  snoozeDeadline.focus();
});

snoozeCancel.addEventListener("click", closeSnoozeDialog);
snoozeCancelX.addEventListener("click", closeSnoozeDialog);
snoozeDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeSnoozeDialog();
});

snoozeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!snoozeContext) return;

  const parsed = parseLocalSnoozeTime(snoozeDeadline.value);
  if (!parsed.ok) {
    snoozeDialogError.textContent = parsed.reason === "deadline-not-in-future"
      ? "Choose a future date and time."
      : "Choose a valid date and time.";
    snoozeDeadline.focus();
    return;
  }

  snoozeSubmit.disabled = true;
  const message = snoozeContext.mode === "reschedule"
    ? { type: "atm:reschedule-snoozed-item", snoozedItemId: snoozeContext.snoozedItemId, wakeAt: parsed.wakeAt }
    : { type: "atm:snooze-tab", tabId: snoozeContext.tabId, wakeAt: parsed.wakeAt };
  const result = await browser.runtime.sendMessage(message);
  snoozeSubmit.disabled = false;

  if (!result?.ok) {
    snoozeDialogError.textContent = snoozeContext.mode === "reschedule"
      ? `Wake time was not changed (${result?.reason || "unknown error"}).`
      : `Tab was not snoozed (${result?.reason || "unknown error"}).`;
    return;
  }

  closeSnoozeDialog();
  viewMode.value = "snoozed";
  await load();
});

content.addEventListener("submit", async (event) => {
  if (event.target.id !== "rule-create-form") return;
  event.preventDefault();
  const data = new FormData(event.target);
  const name = String(data.get("name") || "").trim();
  const hostname = String(data.get("hostname") || "").trim();
  const action = String(data.get("action") || "");
  const priority = Number(data.get("priority"));
  const result = await browser.runtime.sendMessage({
    type: "atm:upsert-rule",
    rule: {
      name,
      priority,
      conditions: [{ field: "hostname", operator: "contains", value: hostname }],
      actions: [action]
    }
  });
  if (!result?.ok) {
    summary.textContent = `Rule was not created (${result?.reason || "unknown error"}).`;
    return;
  }
  event.target.reset();
  rulePreview = null;
  await load();
});

saveWindow.addEventListener("click", async () => {
  const result = await browser.runtime.sendMessage({ type: "atm:save-focused-window-tab-set" });
  if (!result?.ok) {
    summary.textContent = `Focused window was not saved (${result?.reason || "unknown error"}).`;
    return;
  }
  viewMode.value = "saved";
  await load();
});

search.addEventListener("input", render);
viewMode.addEventListener("change", render);
refresh.addEventListener("click", load);
browser.runtime.onMessage.addListener((message) => {
  if (message?.type === "atm:state-changed") load();
});

load().catch((error) => {
  console.error(error);
  summary.textContent = "Unable to read Firefox or saved tab state.";
});
