# GoreeCloud Advanced Tab Manager

GoreeCloud Advanced Tab Manager is a local-first Firefox WebExtension for high-scale tab organization. Firefox remains authoritative for live tabs, windows, and native tab groups; the extension reconstructs live state on demand and augments it with extension-owned organization and recovery metadata.

## Current source state

- Version: `0.1.14`
- Source state: `source-candidate`
- Product lifecycle: Candidate source; accepted Stable remains 0.1.13
- Component class: Browser extension
- Firefox add-on ID: `advanced-tab-manager@goreecloud.com`
- Minimum Firefox version: `139.0`
- Stable release: `0.1.13`
- Permissions: `activeTab`, `alarms`, `menus`, `scripting`, `sessions`, `storage`, `tabGroups`, `tabs`
- Host permissions: none
- Content scripts: none
- Private browsing: explicitly not allowed by manifest

The current source implements live Firefox tab/window/native-group reconstruction, durable logical-ID trees, persistent Tab Sets, transactional tab stashing, reviewed exact-URL duplicate cleanup with opt-in conservative tracking-normalized review and durable per-tab cleanup protection, restart-safe one-shot snoozing, deterministic local rules with bounded explicit actions, a keyboard-first command palette, explicit user-invoked Firefox tab-title renaming, the Manager/diagnostics foundation, source-preserving local backup portability, and ATM-008E retained local session snapshots.

Firefox runtime tab/group IDs remain transient. Tree relationships use extension-owned logical IDs. Tab Set/stash, snooze, and rule data remain in separate versioned local records so one capability does not silently reinterpret another capability's saved state.

The restorable URL boundary is `http:`, `https:`, and `about:blank`. Privileged or executable schemes are not persisted for reconstruction.

### Protected duplicate-cleanup exclusions — 0.1.14 source candidate

0.1.14 adds a durable **Protected** tab state for reviewed duplicate cleanup. The flag is stored in Firefox session metadata, rendered in the sidebar, and re-read from live browser state immediately before cleanup. Protected tabs are never selected for automatic closure by the reviewed duplicate cleanup path. The feature adds no host permission and does not change the existing active, pinned, audible, hidden/private, or tree-link cleanup guards.

0.1.14 is source-candidate work only. Accepted Stable remains 0.1.13 until the exact candidate completes the applicable runtime, security, signing, persistent-install, restart, and user-facing acceptance gates.

### Extension icon packaging correction — 0.1.13

Stable 0.1.13 corrects Firefox product-identity packaging without changing tab-management authority or permissions. It vendors the approved canonical Advanced Tab Manager SVG from `GoreeCloud/branding-assets/products/advanced-tab-manager/app-icon.svg` (canonical Git blob `2c1865ee3809ae91c3bcb42d2d39275668651ab7`) and declares it through the manifest's top-level `icons` map and `action.default_icon`.

This corrects the generic puzzle-piece placeholder shown by Firefox when an extension does not declare packaged icon metadata. The exact 0.1.13 runtime completed governed human target acceptance, Mozilla signing, signed-payload parity, persistent-install/full-restart acceptance, and fresh GLAZE UI V1.6 consumer acceptance before Stable lifecycle promotion. Stable 0.1.12 is retained as rollback provenance.

### Interface refinement — 0.1.12

Version 0.1.12 is the accepted Stable successor to 0.1.11. Its runtime payload is frozen to accepted source revision `43f3010607550d7d4380353b97f85a4dd0186695`; Stable promotion changes lifecycle metadata, release records, and qualification harnesses without changing the accepted signed runtime bytes.

The Stable 0.1.12 release:

- uses a shared repository-local Glaze surface/token layer across the sidebar, popup, and Manager to keep material hierarchy, geometry, focus treatment, and product identity consistent;
- applies a second-stage V1.6 visual polish pass based on September 27 owner-rendered feedback, strengthening the sidebar lockup and density, framing the popup as a concise Glaze command surface, and giving the Manager a clearer hero/overview/feature/technical hierarchy rather than a uniform gray-card grid;
- redesigns the toolbar popup into a compact command surface with glanceable live metrics, one clear primary action, quieter navigation actions, and lifecycle-neutral runtime copy;
- restructures the sidebar into a stronger Firefox-native/GoreeCloud workspace with clearer product hierarchy, sticky search/view controls, compact state chips, stronger active-tab treatment, and reduced visual noise;
- reorganizes the full Manager around live-browser overview, saved workspace, recovery, portability, and secondary technical status instead of giving every diagnostic card equal visual weight;
- removes stale embedded `In Development · source-candidate` text from the Manager model so runtime UI does not manufacture canonical release lifecycle truth;
- fixes the Manager so retained session-snapshot count is actually rendered instead of remaining an em dash;
- strengthens interactive tab-row semantics with explicit button/current-page semantics;
- moves a fully visible unpinned/ungrouped/non-Split-View tree branch to a new Firefox window through the existing `tabs`/window authority, with two-snapshot drift rejection, destination verification, rollback attempts on partial failure, and an explicit Split View guard so Firefox cannot implicitly move a partner outside the verified branch;
- adds an optional tracking-normalized duplicate mode while keeping exact URL matching as the default; only `utm_*`, `gclid`, `dclid`, `fbclid`, `msclkid`, `mc_cid`, and `mc_eid` are ignored, while path, fragment, and every other query parameter remain significant; normalized cleanup keeps the same guarded-tab exclusions, requires a reviewed keeper plus confirmation, and reconstructs current live state before closing;
- keeps every eligible non-private open tab non-auto-discardable by default, including background tabs, by applying Firefox `autoDiscardable=false` at background startup and when tabs are created; explicit manual/rule-driven Discard remains available as a deliberate override;
- makes that residency policy visible instead of implicit: normalized live tab state preserves Firefox's `autoDiscardable` flag, the sidebar shows an `auto-protected` count, the popup reports automatic-unload protection status, and the Manager explains protected/eligible, resident, and explicitly discarded counts without exposing browsing content;
- adds guarded Tree-view branch bulk actions: close a fully visible branch or discard a fully visible eligible branch after confirmation, with two-snapshot branch-drift rejection and active/pinned/audible discard guards; drag-and-drop and richer manual reparenting remain future ATM-004A work;
- adds **Rename tab title…** to Firefox's native tab context menu. The user-invoked flow uses `activeTab` plus `scripting` only for the clicked HTTP(S) tab, stores the custom name as Firefox session tab metadata, and never requests broad host permission or a persistent/declarative content script. The rename dialog includes an explicit Restore page title action. Firefox-restricted pages fail closed, and navigation/reload can restore the site's own title until the saved custom name is explicitly reapplied.
- preserves the local-first privacy, storage, recovery, telemetry, remote-dependency, and private-browsing boundaries. The new `menus`, `activeTab`, and `scripting` permissions are narrowly scoped to explicit tab-title renaming; host permissions remain none.

The default residency policy prevents Firefox's automatic tab discard, but it does not override browser-owned background timer/animation throttling or operating-system process/resource limits, and it does not silently reload a tab the user has explicitly discarded.

The material 0.1.12 presentation and behavior change completed exact-revision repository/runtime/security review, owner-rendered and accessibility review, GLAZE UI V1.6 consumer acceptance, Mozilla signing, signed-XPI parity, persistent installation, full Firefox restart, and post-restart acceptance. Authoritative Glaze registry acceptance is commit `b5362a2defb9df0bd33e3b8c5b1ba9d14ce81efb`; governed signing/restart run `36378135958` accepted the signed runtime. Stable 0.1.11 remains historical rollback provenance.


### Source-preserving operations

Stashing uses **persist recovery state → verify persistence → close source tab**.

Snoozing uses **persist snooze recovery state → verify persistence → create and verify a one-shot Firefox alarm → close source tab**. Persisted deadlines are authoritative because Firefox alarms do not survive browser restarts. Startup reconstructs alarms from local storage; failed due restoration retains recovery state and schedules a bounded retry. The 0.1.12 sidebar supports +1 hour, Later today, tomorrow morning, Next week, and arbitrary future local date/time selection; snoozed items can be opened early, rescheduled, or explicitly cancelled without reopening. Later today chooses the next bounded same-day afternoon/evening slot with at least 30 minutes of lead time and becomes unavailable late at night rather than silently crossing into tomorrow. Recurring schedules remain outside this slice until their repeat semantics receive separate policy/UX design.

### Rule and command boundaries

Rules are local, globally disabled by default, priority-ordered, explainable, and limited to local tab/group metadata. Explicit actions remain restricted to pin/unpin, mute/unmute, and discard. Apply now re-reads live Firefox state and fails closed on drift or conflict.

The command palette is sidebar-local and opened by its visible control or `Ctrl/⌘+K`. Its pure command catalog/search layer has no browser API dependency. Commands route through established sidebar controls instead of creating a second browser-authority path.

### ATM-008C manager/diagnostics foundation — 0.1.8

Version 0.1.8 adds a full-window Manager surface reachable from the sidebar, toolbar popup, and command palette. This first manager slice is intentionally read-only.

The background aggregates a privacy-minimized manager model containing only live/saved counts, store availability/schema/revision metadata, immutable source/build metadata, and manifest-declared permission posture. It does **not** serialize tab titles, tab URLs, saved-item URLs, rule contents, or browsing history into the manager model.

The Manager displays:

- current source version/component class and Firefox baseline, with release lifecycle delegated to canonical release records;
- live tab/window/native-group/tree/pinned/discarded counts;
- Tab Set, stash, snooze, and rule counts;
- organizational/snooze/rule store schema/revision availability;
- extension permissions, host-permission count/list, content-script count, and private-browsing boundary.

A failure in one extension-owned store degrades that section without preventing the remaining diagnostics from rendering. The surface includes Reduced Transparency and Forced Colors fallbacks and uses native Firefox/system color semantics consistent with the existing constrained-browser Glaze presentation approach.

### ATM-008D local backup portability — 0.1.9

Version 0.1.9 adds explicit Manager controls to export and import implemented extension-owned state without widening Firefox authority.

Exports are versioned JSON envelopes containing organizational state (Tab Sets and stashed items), snooze recovery state, and rule state. The envelope records the extension identity/version and a SHA-256 integrity digest. Because backups can contain saved URLs, titles, and user-authored rules, exported files must be treated as private user data.

Imports use **parse → verify envelope/integrity/identity → validate every store → preview counts/conflicts → explicit confirmation → fresh-revision check → replace all three stores → readback verify → reconstruct snooze alarms**. The import itself never opens or closes Firefox tabs. A changed local revision after preview fails closed. Failed readback or snooze reconstruction attempts exact rollback to the pre-import records.

The Manager caps a selected import file at 16 MiB before JSON parsing. Import preview is deliberately privacy-minimized: it returns counts, conflict counts, source version/time, integrity status, and expected current revisions rather than browsing URLs or titles.

Broader settings, bulk organization, automatic rule execution, remote management, synchronization, representative Firefox runtime/accessibility acceptance, and new Firefox permissions remain outside this milestone.

### ATM-008E retained session snapshots — 0.1.10

Version 0.1.10 adds explicit local session snapshots to the existing organizational state. A snapshot captures only restorable non-private tabs, window boundaries, native-group presentation metadata, pin state, active-tab identity, ordering, and supported tree relationships. Firefox remains authoritative for the current live session.

Snapshot retention is configurable from 1 through 50 records and defaults to 10. Reducing retention explicitly prunes the oldest local snapshots. Snapshot restore is additive: it creates new Firefox windows and never replaces or closes the user's existing live windows. If a multi-window snapshot restore fails, the operation attempts to remove every newly created window while preserving the saved snapshot as recovery state.

The Manager exposes only snapshot ID, capture time, window count, and tab count. It does not project snapshot URLs or titles into the diagnostic model. Snapshot records are included in the existing versioned local backup/export path, and imports continue to use schema validation, preview, fresh-revision checks, readback verification, and rollback.

CI also runs a deterministic core-scale qualification at 100, 500, and 1,000 synthetic tabs and retains the resulting JSON report with the unsigned XPI and SHA-256 package checksum. This is core-scale evidence only; representative Firefox rendering, interaction latency, accessibility, browser-restart, and device/runtime performance remain separate acceptance gates.

### Release preparation — 0.1.11

Version 0.1.11 preserves the accepted 0.1.10 functional slice while advancing the manifest identity, making packaged popup/Manager lifecycle wording neutral, adding an explicit popup Forced Colors fallback, and introducing exact-revision Glaze 1.5.1 plus Stable-security qualification gates. It adds no permission and does not widen browser authority.

Those exact-candidate gates subsequently passed for 0.1.11. Version 0.1.12 independently completed its own governed acceptance and is now the current Stable release.

## Stable 0.1.12 release evidence

GoreeCloud Advanced Tab Manager 0.1.12 is the accepted Stable Firefox release for Mozilla unlisted/self-distribution.

Accepted runtime source revision: `43f3010607550d7d4380353b97f85a4dd0186695`. Deterministic unsigned XPI SHA-256: `3db751f3a2c80d8d339ea0648d00a8ff016840f6587b58e5a61c484bf687588f`. Mozilla-signed XPI SHA-256: `2e54bdf2aa312c9cfe2895fd456f6d088a58eab6d24de80339e996e3e9ae11ba`.

Governed signing/restart run `36378135958` verified signed payload parity, persistent installation, full Firefox restart, and post-restart release-critical behavior. GLAZE UI V1.6 consumer acceptance is authoritative in `GoreeCloud/glaze-ui` at `b5362a2defb9df0bd33e3b8c5b1ba9d14ce81efb`. This Stable promotion changes lifecycle metadata and documentation only; accepted packaged runtime bytes are unchanged.

## GoreeCloud platform dependency posture

Required GoreeCloud runtime dependencies: none. Core tab management remains local and Firefox-native.

Stable 0.1.12 has authoritative GLAZE UI V1.6 / 1.6.0 consumer acceptance for exact runtime revision `43f3010607550d7d4380353b97f85a4dd0186695`. Historical V1.5.1 / Stable 0.1.11 evidence remains rollback provenance. Webspaces integration and other platform-system integrations remain optional/planned and are not represented as implemented.

## Development validation

```bash
python extensions/advanced-tab-manager/scripts/validate.py
python extensions/advanced-tab-manager/scripts/validate_target_acceptance_source.py
python extensions/advanced-tab-manager/scripts/test_target_acceptance.py
node --test extensions/advanced-tab-manager/tests/*.test.mjs
node extensions/advanced-tab-manager/scripts/large-session-qualification.mjs
python shared/scripts/validate_repository.py
python shared/scripts/package_extension.py advanced-tab-manager
python -m py_compile extensions/advanced-tab-manager/tests/firefox_runtime_smoke.py
```

The permanent **Advanced Tab Manager Firefox Runtime** workflow packages the exact candidate and exercises release-critical paths in a clean real Firefox profile against controlled local fixtures. That workflow remains an unsigned temporary-install regression gate. Stable 0.1.12 additionally has independent Mozilla-signed persistent-install/full-restart evidence.

The manual **Advanced Tab Manager Target Review Candidate** workflow prepares an exact-source, deterministic unsigned 0.1.12 XPI plus security, Glaze-source-mapping, real-Firefox runtime, and scale evidence for governed human keyboard/assistive-technology/appearance review. `TARGET-ACCEPTANCE-0.1.12.md` and `scripts/target_acceptance.py` define the fail-closed privacy-minimized record contract. The target-review tooling remains the governed mechanism for future material changes; the 0.1.12 human acceptance record is complete.

Packaging produces a deterministic unsigned XPI under `dist/`. `RELEASE-ACCEPTANCE-0.1.12.md`, `STABLE-SECURITY-REVIEW-0.1.12.md`, `GLAZE-UI-1.6.0-ADOPTION.md`, and `RENDERED-ACCEPTANCE-0.1.12.md` record current Stable acceptance; the 0.1.11 records remain historical rollback provenance.
