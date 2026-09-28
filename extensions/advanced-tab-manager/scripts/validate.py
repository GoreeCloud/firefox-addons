#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = ROOT.parents[1]
manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
inventory = json.loads((REPOSITORY_ROOT / "docs/extension-inventory.json").read_text(encoding="utf-8"))
inventory_entry = next(item for item in inventory["extensions"] if item["slug"] == "advanced-tab-manager")

assert manifest["manifest_version"] == 3
assert manifest["name"] == "GoreeCloud Advanced Tab Manager"
assert manifest["version"] == "0.1.12"
assert manifest["homepage_url"] == "https://github.com/GoreeCloud/firefox-addons"
assert manifest["browser_specific_settings"]["gecko"]["id"] == "advanced-tab-manager@goreecloud.com"
assert manifest["browser_specific_settings"]["gecko"]["strict_min_version"] == "139.0"
assert manifest["incognito"] == "not_allowed"
assert set(manifest["permissions"]) == {"activeTab", "alarms", "menus", "scripting", "sessions", "storage", "tabGroups", "tabs"}
assert not manifest.get("host_permissions"), "Stable source must not request host permissions"
assert "content_scripts" not in manifest, "Stable source must not inspect page content"
assert "unlimitedStorage" not in manifest["permissions"], "bounded Stable saved state must not request unlimited storage"
assert "persistent" not in manifest["background"], "Manifest V3 background must not declare unsupported persistent"
assert manifest["background"].get("type") == "module"
assert inventory_entry["source_version"] == "0.1.12"
assert inventory_entry["source_state"] == "source-candidate"
assert inventory_entry["accepted_stable_version"] == "0.1.11"

required = [
    "README.md", "FEATURES.md", "IMPLEMENTED-FEATURES.md", "PLANNED-FEATURES.md", "CHANGELOGS.md", "SPECIFICATIONS.md", "ARCHITECTURE.md",
    "PRIVACY.md", "SECURITY.md", "CHANGELOG.md", "LICENSE",
    "GLAZE-UI-1.5.1-ADOPTION.md", "GLAZE-UI-1.6.0-ADOPTION.md", "RENDERED-ACCEPTANCE-0.1.12.md", "STABLE-SECURITY-REVIEW-0.1.11.md", "RELEASE-ACCEPTANCE-0.1.11.md",
    "src/background/background.js", "src/background/browser-state.js", "src/background/tab-residency.js", "src/background/tab-title-renaming.js", "src/background/tree-branch-actions.js", "src/background/saved-state.js", "src/background/duplicate-cleanup.js", "src/background/snooze.js", "src/background/rules.js", "src/background/manager.js", "src/background/portability.js",
    "src/core/state.js", "src/core/tree.js", "src/core/tree-session.js", "src/core/duplicates.js",
    "src/core/persistent-state.js", "src/core/tab-sets.js", "src/core/stash-transaction.js",
    "src/core/snooze-store.js", "src/core/snooze.js", "src/core/snooze-time.js", "src/core/snooze-transaction.js",
    "src/core/rule-state.js", "src/core/rules.js", "src/core/commands.js", "src/core/manager-model.js", "src/core/portability.js", "src/core/session-snapshots.js",
    "src/shared/glaze.css",
    "src/tab-title/rename.html", "src/tab-title/rename.js", "src/tab-title/rename.css",
    "src/sidebar/sidebar.html", "src/sidebar/sidebar.js", "src/sidebar/open-tabs-view.js", "src/sidebar/saved-view.js", "src/sidebar/duplicates-view.js", "src/sidebar/snoozed-view.js", "src/sidebar/rules-view.js", "src/sidebar/command-palette.js", "src/sidebar/command-palette.css", "src/sidebar/manager-link.js", "src/sidebar/rules.css", "src/sidebar/ui.js", "src/sidebar/sidebar.css",
    "src/popup/popup.html", "src/popup/popup.js", "src/popup/popup.css",
    "src/manager/manager.html", "src/manager/manager.js", "src/manager/manager.css",
    "tests/state.test.mjs", "tests/tree.test.mjs", "tests/tree-session.test.mjs", "tests/tree-branch-actions.test.mjs",
    "tests/persistent-state.test.mjs", "tests/tab-sets.test.mjs", "tests/stash-transaction.test.mjs", "tests/background-storage.test.mjs",
    "tests/duplicates.test.mjs", "tests/duplicate-cleanup.test.mjs",
    "tests/snooze-store.test.mjs", "tests/snooze.test.mjs", "tests/snooze-time.test.mjs", "tests/snooze-transaction.test.mjs", "tests/background-snooze.test.mjs",
    "tests/rule-state.test.mjs", "tests/rules.test.mjs", "tests/background-rules.test.mjs", "tests/commands.test.mjs",
    "tests/manager-model.test.mjs", "tests/background-manager.test.mjs", "tests/portability.test.mjs", "tests/background-portability.test.mjs",
    "tests/session-snapshots.test.mjs", "tests/background-session-snapshots.test.mjs", "tests/tab-residency.test.mjs", "tests/tab-title-renaming.test.mjs",
    "tests/firefox_runtime_smoke.py", "tests/signed_restart_smoke.py", "tests/amo_signed_version_recovery.py", "tests/verify_signed_xpi.py",
    "RELEASE-ACCEPTANCE-0.1.10.md",
    "scripts/large-session-qualification.mjs", "scripts/stable_security_review.py", "scripts/glaze_consumer_qualification.py",
    "scripts/target_acceptance.py", "scripts/test_target_acceptance.py", "scripts/validate_target_acceptance_source.py",
    "TARGET-ACCEPTANCE-0.1.12.md"
]
for relative in required:
    assert (ROOT / relative).is_file(), f"missing required source-candidate file: {relative}"

background = (ROOT / "src/background/background.js").read_text(encoding="utf-8")
tab_residency = (ROOT / "src/background/tab-residency.js").read_text(encoding="utf-8")
tab_title_renaming = (ROOT / "src/background/tab-title-renaming.js").read_text(encoding="utf-8")
tab_title_html = (ROOT / "src/tab-title/rename.html").read_text(encoding="utf-8")
tab_title_js = (ROOT / "src/tab-title/rename.js").read_text(encoding="utf-8")
tab_title_css = (ROOT / "src/tab-title/rename.css").read_text(encoding="utf-8")
tree_branch_actions = (ROOT / "src/background/tree-branch-actions.js").read_text(encoding="utf-8")
tree_core = (ROOT / "src/core/tree.js").read_text(encoding="utf-8")
manager_background = (ROOT / "src/background/manager.js").read_text(encoding="utf-8")
manager_model = (ROOT / "src/core/manager-model.js").read_text(encoding="utf-8")
state_core = (ROOT / "src/core/state.js").read_text(encoding="utf-8")
duplicates_core = (ROOT / "src/core/duplicates.js").read_text(encoding="utf-8")
duplicates_background = (ROOT / "src/background/duplicate-cleanup.js").read_text(encoding="utf-8")
duplicates_view = (ROOT / "src/sidebar/duplicates-view.js").read_text(encoding="utf-8")
manager_page = (ROOT / "src/manager/manager.js").read_text(encoding="utf-8")
manager_html = (ROOT / "src/manager/manager.html").read_text(encoding="utf-8")
manager_css = (ROOT / "src/manager/manager.css").read_text(encoding="utf-8")
portability_core = (ROOT / "src/core/portability.js").read_text(encoding="utf-8")
portability_background = (ROOT / "src/background/portability.js").read_text(encoding="utf-8")
session_snapshots = (ROOT / "src/core/session-snapshots.js").read_text(encoding="utf-8")
large_session_qualification = (ROOT / "scripts/large-session-qualification.mjs").read_text(encoding="utf-8")
runtime_smoke = (ROOT / "tests/firefox_runtime_smoke.py").read_text(encoding="utf-8")
release_acceptance = (ROOT / "RELEASE-ACCEPTANCE-0.1.10.md").read_text(encoding="utf-8")
runtime_workflow = (REPOSITORY_ROOT / ".github/workflows/advanced-tab-manager-firefox-runtime.yml").read_text(encoding="utf-8")
rule_background = (ROOT / "src/background/rules.js").read_text(encoding="utf-8")
rule_state = (ROOT / "src/core/rule-state.js").read_text(encoding="utf-8")
rules_core = (ROOT / "src/core/rules.js").read_text(encoding="utf-8")
rules_view = (ROOT / "src/sidebar/rules-view.js").read_text(encoding="utf-8")
sidebar = (ROOT / "src/sidebar/sidebar.js").read_text(encoding="utf-8")
snoozed_view = (ROOT / "src/sidebar/snoozed-view.js").read_text(encoding="utf-8")
open_tabs_view = (ROOT / "src/sidebar/open-tabs-view.js").read_text(encoding="utf-8")
commands_core = (ROOT / "src/core/commands.js").read_text(encoding="utf-8")
palette = (ROOT / "src/sidebar/command-palette.js").read_text(encoding="utf-8")
palette_css = (ROOT / "src/sidebar/command-palette.css").read_text(encoding="utf-8")
snooze_time = (ROOT / "src/core/snooze-time.js").read_text(encoding="utf-8")
sidebar_html = (ROOT / "src/sidebar/sidebar.html").read_text(encoding="utf-8")
manager_link = (ROOT / "src/sidebar/manager-link.js").read_text(encoding="utf-8")
popup_html = (ROOT / "src/popup/popup.html").read_text(encoding="utf-8")
popup_js = (ROOT / "src/popup/popup.js").read_text(encoding="utf-8")

assert "createTabResidencyPolicy" in background
assert "createTabTitleRenaming" in background and "tabTitleRenaming.register()" in background
assert "atm:get-tab-title-rename-state" in background and "atm:set-tab-title-override" in background
assert "protectAllOpenTabs" in background and "protectTab(tab)" in background
assert "autoDiscardable: false" in tab_residency
assert "autoDiscardable" in state_core and "summarizeTabResidency" in state_core
assert 'TRACKING_NORMALIZED: "tracking-normalized"' in duplicates_core
assert 'normalized.startsWith("utm_")' in duplicates_core
for tracking_key in ("gclid", "dclid", "fbclid", "msclkid", "mc_cid", "mc_eid"):
    assert f'"{tracking_key}"' in duplicates_core, f"missing conservative tracking key: {tracking_key}"
assert 'parsed.hash' not in duplicates_core, "tracking-normalized mode must preserve fragments rather than stripping hash state"
assert "buildExactDuplicateReview" in duplicates_core and "buildTrackingNormalizedDuplicateReview" in duplicates_core
assert "planDuplicateCleanup" in duplicates_core and "reviewRequired: true" in duplicates_core
assert "cleanupDuplicates" in duplicates_background and "cleanupExactDuplicates" in duplicates_background
assert "browser.tabs.remove" in duplicates_background
assert "Ignore tracking parameters" in duplicates_view and "Matching is exact by default" in duplicates_view
assert "never runs cleanup automatically" in duplicates_view
assert "window.confirm(confirmation)" in sidebar, "normalized duplicate cleanup must remain explicitly confirmed"
assert '"atm:cleanup-duplicates"' in background and '"atm:cleanup-exact-duplicates"' in background
assert "splitViewId" in state_core, "normalized live state must retain Firefox Split View membership for move safety"
assert "browser.tabs.query({})" in tab_residency and "browser.tabs.update" in tab_residency
assert "browser.tabs.reload" not in tab_residency, "default residency must not silently reload a user-discarded tab"
assert "browser.scripting.executeScript" in tab_title_renaming, "tab title changes must use explicit activeTab-scoped script injection"
assert "browser.sessions.setTabValue" in tab_title_renaming and "browser.sessions.removeTabValue" in tab_title_renaming
assert 'contexts: ["tab"]' in tab_title_renaming and 'title: "Rename tab title…"' in tab_title_renaming
assert "browser.runtime.onInstalled.addListener" in tab_title_renaming, "MV3 menu creation must be bound to runtime.onInstalled so event-page restarts cannot remove it"
assert "browser.menus.remove(" not in tab_title_renaming and "browser.menus.removeAll(" not in tab_title_renaming, "persistent MV3 menu state must not be torn down during background startup"
assert 'protocol === "http:" || protocol === "https:"' in tab_title_renaming, "rename eligibility must fail closed outside HTTP(S)"
assert "host_permissions" not in manifest, "tab title renaming must not introduce broad host access"
assert "Rename tab title" in tab_title_html and "atm:set-tab-title-override" in tab_title_js
assert "prefers-reduced-transparency" in tab_title_css and "forced-colors" in tab_title_css
assert "collectTreeBranchTabs" in tree_core
assert "createTreeBranchActions" in tree_branch_actions
assert "tree-branch-changed" in tree_branch_actions and "tree-branch-not-discardable" in tree_branch_actions
assert "browser.tabs.remove" in tree_branch_actions and "browser.tabs.discard" in tree_branch_actions
assert "moveTreeBranchToNewWindow" in tree_branch_actions and "browser.windows.create" in tree_branch_actions and "browser.tabs.move" in tree_branch_actions
assert "tree-branch-not-movable" in tree_branch_actions and "tree-branch-move-rollback" in tree_branch_actions
assert "splitViewId" in tree_branch_actions, "branch move must guard Firefox Split View side effects"
assert "atm:close-tree-branch" in background and "atm:discard-tree-branch" in background and "atm:move-tree-branch-new-window" in background
assert "close-tree-branch" in open_tabs_view and "discard-tree-branch" in open_tabs_view and "move-tree-branch-new-window" in open_tabs_view
assert "branchTabs.every((tab) => visibleIds.has(tab.id))" in open_tabs_view
assert "tab.groupId === TAB_GROUP_ID_NONE" in open_tabs_view, "branch move UI must fail closed for native-group members"
assert "tab.splitViewId === -1" in open_tabs_view, "branch move UI must fail closed for Firefox Split View members"
assert "atm:move-tree-branch-new-window" in sidebar, "sidebar must route guarded branch move"
assert "guarded tree branch moved to a new Firefox window" in runtime_smoke, "real-Firefox smoke must exercise branch move"
assert "createRuleManager" in background
assert "atm:get-rule-state" in background and "atm:set-rule-engine-enabled" in background
assert "atm:upsert-rule" in background and "atm:delete-rule" in background and "atm:preview-rule-evaluation" in background
assert "atm:apply-rule-actions" in background, "explicit rule application route is required"
assert "RULE_STATE_KEY" in rule_state and "commitRuleStateMutation" in rule_state and "restoreRuleStateRecord" in rule_state
assert "goreecloud.advancedTabManager.ruleState.v1" in rule_state
assert "RULE_ACTION_TYPES" in rule_state
assert "enabled: false" in rule_state, "rule engine must fail closed by default"
assert "evaluateRules" in rules_core and "explanation" in rules_core
assert "planRuleActions" in rules_core and "equal-priority-action-conflict" in rules_core
assert "hostname" in rules_core and "nativeGroupTitle" in rules_core and "treeChild" in rules_core
assert "!tab.incognito" in rules_core, "private tabs must be excluded"
assert "previewOnly: true" in rule_background
assert "browser-state-changed" in rule_background, "live-state drift must fail closed"
assert rule_background.count("readLiveSnapshot()") >= 3, "preview and apply paths must read fresh Firefox state"
assert "browser.tabs.update" in rule_background and "browser.tabs.discard" in rule_background
assert "browser.tabs.remove" not in rule_background, "rule actions must not close tabs"
assert "tabs.create" not in rule_background and "url:" not in rule_background, "rule actions must not navigate or create tabs"
assert "rule-create-form" in rules_view and "apply-rule-actions" in rules_view
assert "atm:apply-rule-actions" in sidebar
assert 'activation.className = "tab-activate"' in open_tabs_view, "tab activation must use a native button"
assert 'row.setAttribute("role", "button")' not in open_tabs_view, "tab rows must not wrap child buttons in button semantics"
assert 'event.target.closest(".tab-activate")' in sidebar, "sidebar must route activation through the native tab button"
assert 'classList.contains("tab-row")' not in sidebar, "sidebar must not require custom keyboard activation for tab rows"

assert "COMMANDS" in commands_core and "searchCommands" in commands_core and "commandById" in commands_core
for command_id in ("view-tree", "view-groups", "view-duplicates", "view-saved", "view-snoozed", "view-rules", "open-manager", "focus-search", "refresh-state", "save-window"):
    assert f'id: "{command_id}"' in commands_core, f"missing bounded command: {command_id}"
assert "browser." not in commands_core, "command catalog must remain browser-API independent"
assert "browser." not in palette, "command palette must route through established sidebar controls rather than direct browser APIs"
assert "Control+K Meta+K" in palette and "aria-modal" in palette and "role=\"listbox\"" in palette
assert 'href="command-palette.css"' in sidebar_html and 'src="command-palette.js"' in sidebar_html
assert 'id="open-manager"' in sidebar_html and 'src="manager-link.js"' in sidebar_html
assert 'id="snooze-dialog"' in sidebar_html and 'id="snooze-deadline"' in sidebar_html and 'type="datetime-local"' in sidebar_html
assert "parseLocalSnoozeTime" in snooze_time and "laterTodayWakeAt" in snooze_time and "tomorrowMorningWakeAt" in snooze_time and "nextWeekWakeAt" in snooze_time
assert "parseLocalSnoozeTime" in sidebar and "atm:reschedule-snoozed-item" in sidebar and "atm:cancel-snoozed-item" in sidebar and "showModal()" in sidebar
assert "cancel-snoozed-item" in snoozed_view, "Snoozed view must expose explicit cancellation without reopening"
assert "snooze-custom-time-restore" in runtime_smoke, "real-Firefox smoke must exercise arbitrary snooze scheduling through the sidebar"
assert "snooze-next-week-cancel" in runtime_smoke, "real-Firefox smoke must exercise next-week snooze and cancellation"
assert 'data-snooze-preset="later-today"' in sidebar_html, "sidebar must expose a Later today snooze preset"
assert 'data-snooze-preset="next-week"' in sidebar_html, "sidebar must expose a Next week snooze preset"
assert "prefers-reduced-transparency" in palette_css and "forced-colors" in palette_css

assert "createManagerState" in background and 'atm:get-manager-state' in background
assert "buildManagerModel" in manager_background and "buildManagerModel" in manager_model
assert "tab.title" not in manager_model and "tab.url" not in manager_model, "manager model must not serialize live browsing content"
assert "atm:get-manager-state" in manager_page
assert "browser.runtime.sendMessage" in manager_page
assert "browser.tabs.remove" not in manager_page and "browser.tabs.update" not in manager_page and "browser.tabs.discard" not in manager_page
assert "Local backup and portability" in manager_html and 'id="export-backup"' in manager_html and 'id="import-file"' in manager_html
assert 'id="apply-import"' in manager_html and 'id="clear-import"' in manager_html
assert "prefers-reduced-transparency" in manager_css and "forced-colors" in manager_css
assert "browser.tabs.create" in manager_link and "src/manager/manager.html" in manager_link
assert 'id="open-manager"' in popup_html and "0.1.12" in popup_html and 'id="metric-tabs"' in popup_html
assert 'id="residency-status"' in popup_html and "summarizeTabResidency" in popup_js
assert "source candidate" not in popup_html.lower(), "packaged popup must be lifecycle-neutral for release signing"
assert "development source only" not in manager_html.lower(), "packaged Manager must be lifecycle-neutral for release signing"
assert "Stable status" not in manager_html, "packaged Manager must not hard-code Stable lifecycle truth"
assert "src/manager/manager.html" in popup_js

assert "captureSessionSnapshot" in session_snapshots and "trimSessionSnapshots" in session_snapshots
assert "DEFAULT_SNAPSHOT_RETENTION" in (ROOT / "src/core/persistent-state.js").read_text(encoding="utf-8")
for route in ("atm:create-session-snapshot", "atm:restore-session-snapshot", "atm:delete-session-snapshot", "atm:set-snapshot-retention"):
    assert route in background, f"missing session snapshot route: {route}"
for control_id in ("create-snapshot", "snapshot-retention", "save-retention", "snapshot-list"):
    assert f'id="{control_id}"' in manager_html, f"missing Manager snapshot control: {control_id}"
assert 'id="count-snapshot-retention"' in manager_html, "Manager must expose configured snapshot retention"
assert "renderSnapshotList(model.snapshots)" in manager_page, "Manager must render snapshot retention/list state from the model"
assert 'model.permissions.contentScripts ? model.permissions.contentScripts : "None"' in manager_page, "zero content scripts should render as human-readable None"
assert "sessionSnapshots" in manager_model and "snapshotRetention" in manager_model
assert "summarizeTabResidency" in manager_model and 'id="residency-panel"' in manager_html and 'id="residency-status"' in manager_html
assert "eligible tabs reject Firefox automatic discard" in manager_page
assert "snapshot.test" not in manager_model, "manager model must not encode fixture browsing content"
assert "SIZES = [100, 500, 1000]" in large_session_qualification
assert "readFileSync(new URL(\"../manifest.json\", import.meta.url)" in large_session_qualification, "large-session evidence must bind to the current manifest version"
assert 'sourceVersion: "0.1.11"' not in large_session_qualification, "large-session evidence must not retain a stale Stable version"
assert "representative Firefox rendered/runtime performance remains separate" in large_session_qualification

assert 'EXPECTED_ADDON_ID = "advanced-tab-manager@goreecloud.com"' in runtime_smoke
assert 'EXPECTED_VERSION = "0.1.12"' in runtime_smoke
assert "gBrowser.addTrustedTab" in runtime_smoke and "--allow-system-access" in runtime_smoke
assert "tabContextMenu" in runtime_smoke and "Rename tab title…" in runtime_smoke, "real-Firefox smoke must verify the native tab context menu item is visible"
assert "tab-title-rename-restore-reload-restricted" in runtime_smoke, "real-Firefox smoke must exercise rename, same-document persistence, reload reapplication, restore, and restricted-page failure"
assert "Runtime custom title" in runtime_smoke and "about:blank" in runtime_smoke, "real-Firefox rename acceptance must use controlled title data and a restricted Firefox page"
assert "temporary=True" in runtime_smoke, "unsigned runtime gate must not masquerade as persistent signed acceptance"
for route in (
    "atm:get-manager-state", "atm:set-tree-parent", "atm:save-focused-window-tab-set",
    "atm:stash-tab", "atm:snooze-tab", "atm:cleanup-exact-duplicates", "atm:cleanup-duplicates",
    "atm:get-rule-state", "atm:create-session-snapshot", "atm:restore-session-snapshot",
    "atm:export-backup", "atm:preview-import"
):
    assert route in runtime_smoke, f"runtime smoke is missing release-critical route: {route}"
assert '"signedPersistentRestartAccepted": False' in runtime_smoke
assert "controlledLocalFixtureOnly" in runtime_smoke
assert "browser-actions/setup-firefox@v1" in runtime_workflow
assert "browser-actions/setup-geckodriver@latest" in runtime_workflow
assert "firefox_runtime_smoke.py" in runtime_workflow
assert "advanced-tab-manager-firefox-runtime.json" in runtime_workflow
assert "wait_for_snapshot_url_count" in runtime_smoke, "Firefox duplicate acceptance must wait for reconciled live state"
assert "duplicate-tracking-normalized-cleanup" in runtime_smoke, "Firefox runtime must exercise opt-in tracking-normalized cleanup"
assert "github.event.pull_request.head.sha || github.sha" in runtime_workflow
assert "ATM_SOURCE_REVISION" in runtime_workflow
assert '"sourceRevision": source_revision' in runtime_smoke
assert "Mozilla-signed persistent-install and full-process restart acceptance remain separate" in release_acceptance

assert "createPortabilityManager" in background
assert "atm:export-backup" in background and "atm:preview-import" in background and "atm:apply-import" in background
assert "PORTABILITY_FORMAT" in portability_core and "PORTABILITY_SCHEMA_VERSION" in portability_core and "PORTABILITY_MAX_BYTES" in portability_core
assert "SHA-256" in portability_core and "backup-integrity-mismatch" in portability_core and "backup-too-large" in portability_core
assert "validatePersistentState" in portability_background and "validateSnoozeState" in portability_background and "validateRuleState" in portability_background
assert "state-changed-since-preview" in portability_background and "import-verification-failed" in portability_background
assert "browser.tabs.create" not in portability_background and "browser.tabs.remove" not in portability_background
assert "browser.tabs.update" not in portability_background and "browser.tabs.discard" not in portability_background
assert "MAX_IMPORT_BYTES = 16 * 1024 * 1024" in manager_page
assert "atm:export-backup" in manager_page and "atm:preview-import" in manager_page and "atm:apply-import" in manager_page
assert "new Blob" in manager_page and "JSON.parse" in manager_page and "window.confirm" in manager_page
assert "file.size > MAX_IMPORT_BYTES" in manager_page
assert "sessionSnapshots" in portability_core, "portable organizational state must include snapshot preview accounting"
assert "prefers-reduced-transparency" in manager_css and "forced-colors" in manager_css
historical_glaze_adoption = (ROOT / "GLAZE-UI-1.5.1-ADOPTION.md").read_text(encoding="utf-8")
glaze_adoption = (ROOT / "GLAZE-UI-1.6.0-ADOPTION.md").read_text(encoding="utf-8")
rendered_acceptance = (ROOT / "RENDERED-ACCEPTANCE-0.1.12.md").read_text(encoding="utf-8")
security_review = (ROOT / "STABLE-SECURITY-REVIEW-0.1.11.md").read_text(encoding="utf-8")
release_acceptance_011 = (ROOT / "RELEASE-ACCEPTANCE-0.1.11.md").read_text(encoding="utf-8")
security_script = (ROOT / "scripts/stable_security_review.py").read_text(encoding="utf-8")
glaze_script = (ROOT / "scripts/glaze_consumer_qualification.py").read_text(encoding="utf-8")
release_workflow = (REPOSITORY_ROOT / ".github/workflows/advanced-tab-manager-release-qualification.yml").read_text(encoding="utf-8")
signing_workflow = (REPOSITORY_ROOT / ".github/workflows/advanced-tab-manager-mozilla-signing.yml").read_text(encoding="utf-8")
signed_restart = (ROOT / "tests/signed_restart_smoke.py").read_text(encoding="utf-8")
signed_parity = (ROOT / "tests/verify_signed_xpi.py").read_text(encoding="utf-8")
amo_recovery = (ROOT / "tests/amo_signed_version_recovery.py").read_text(encoding="utf-8")
assert "GLAZE UI V1.6 / machine version 1.6.0" in glaze_adoption
assert "a7180679ea851389e0f3004515f9a25f420e716d" in glaze_adoption
assert "1.5.1" in historical_glaze_adoption, "historical Stable 0.1.11 Glaze provenance must remain available"
assert "35c4d2dd8aa2a3fcd5742f430d8c8388ab85846a" in rendered_acceptance
assert "normal-light rendered acceptance" in rendered_acceptance.lower(), "rendered acceptance must remain scoped to normal-light observed evidence"
assert "does not establish the following" in rendered_acceptance.lower(), "rendered acceptance must preserve explicit unverified-condition boundaries"
assert "forced colors rendered acceptance" in rendered_acceptance.lower()
assert "reduced transparency rendered acceptance" in rendered_acceptance.lower()
assert "dark appearance rendered acceptance" in rendered_acceptance.lower()
assert "stable acceptance implied: no" in rendered_acceptance.lower()
assert "Security exceptions:** None" in security_review
assert "full Git history" in security_review
assert "0.1.11" in release_acceptance_011 and "**Lifecycle:** Stable" in release_acceptance_011
assert "35350654198" in release_acceptance_011
assert "e0f16901529cb8fa76e57d9aa056c98de9fa04e708f2232c151d5b75c1dfdb1d" in release_acceptance_011
assert '"git"' in security_script and '"log"' in security_script and "--full-history" in security_script
assert "manifest.json" in security_script and "EXPECTED_VERSION" in security_script
assert 'GLAZE_VERSION = "1.6.0"' in glaze_script
assert 'GLAZE_AUTHORITY_REPOSITORY = "GoreeCloud/glaze-ui"' in glaze_script
assert 'GLAZE_STABLE_SOURCE = "a7180679ea851389e0f3004515f9a25f420e716d"' in glaze_script
assert '"status": "adoption-required"' in glaze_script
assert '"consumerRegistryAccepted": False' in glaze_script
assert "sharedPerformanceAcceptanceInherited" in glaze_script and "False" in glaze_script
assert "fetch-depth: 0" in release_workflow
assert "github.event.pull_request.head.sha || github.sha" in release_workflow
assert "stable_security_review.py" in release_workflow and "glaze_consumer_qualification.py" in release_workflow
assert "advanced-tab-manager-glaze-1.6.0-adoption.json" in release_workflow
assert "GLAZE UI 1.6.0 source adoption state" in release_workflow
assert "cmp \"$A\" \"$B\"" in release_workflow

assert "ATM_RELEASE_VERSION: '0.1.11'" in signing_workflow
assert "ATM_RELEASE_CANDIDATE_SHA256: '9c0f44926ac1d2f213fd07f82dd18fa11bd54ceebc6cd871898fe82b962a5b02'" in signing_workflow
assert "Bind signing to authoritative main" in signing_workflow
assert "web-ext@10.5.0 sign" in signing_workflow and "--channel=unlisted" in signing_workflow
assert "AMO_JWT_ISSUER" in signing_workflow and "AMO_JWT_SECRET" in signing_workflow
assert "stable_security_review.py" in signing_workflow and "glaze_consumer_qualification.py" in signing_workflow
assert "verify_signed_xpi.py" in signing_workflow and "signed_restart_smoke.py" in signing_workflow
assert "advanced-tab-manager-signing-evidence.json" in signing_workflow
assert "statuses: write" in signing_workflow
assert "goreecloud/advanced-tab-manager-mozilla-signing" in signing_workflow
assert "Publish signing gate pending status" in signing_workflow
assert "Publish authoritative signing gate result" in signing_workflow
assert "github.run_id" in signing_workflow or "GITHUB_RUN_ID" in signing_workflow

assert "temporary=False" in signed_restart, "signed restart acceptance must use persistent installation"
assert signed_restart.count("install_addon(") == 1, "signed restart acceptance must not reinstall after restart"
assert "post-restart organizational state readable" in signed_restart
assert "advanced-tab-manager-signed-restart.json" in signed_restart
assert "wait_for_snapshot_url_count" in signed_restart, "signed restart duplicate acceptance must wait for reconciled live state"

assert 'EXPECTED_ADDON_ID = "advanced-tab-manager@goreecloud.com"' in signed_parity
assert "META-INF/" in signed_parity and "nonManifestPayloadByteExact" in signed_parity
assert "data_collection_permissions" in signed_parity

assert 'ADDON_ID = "advanced-tab-manager@goreecloud.com"' in amo_recovery
assert "NoRedirect" in amo_recovery and "/api/v4/file/" in amo_recovery
assert '"Authorization": f"JWT {token}"' in amo_recovery
assert 'mirror_request = Request(location, headers={"User-Agent": USER_AGENT})' in amo_recovery

print("Validated Advanced Tab Manager 0.1.12 source candidate while preserving accepted Stable 0.1.11 release evidence.")
