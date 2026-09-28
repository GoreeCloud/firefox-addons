# GoreeCloud Advanced Tab Manager — Repository Specifications

This repository document is the canonical source-controlled specification for the accepted Stable `0.1.13` boundary while preserving Stable `0.1.12` rollback evidence. Legacy Drive project-specification copies are migration sources only and do not supersede repository-native specification state.

## Component and dependency contract

- Component class: browser extension.
- Supported platform: Firefox 139+.
- Source state: `stable`; product lifecycle: Stable. Accepted Stable release: `0.1.13`.
- Required GoreeCloud runtime dependencies: none.
- Optional/planned integrations such as Webspaces are not implemented dependencies in 0.1.12.
- Browser-surface presentation has authoritative GLAZE UI V1.6 / 1.6.0 consumer acceptance for exact runtime revision `89f93d9fcfd77adbdf9296e0d823a6fe8861b1fe` at registry merge `937d2a31e2ff55ec1c9e4c6688899389a9323642`; no separate Glaze runtime package is embedded.

## Implemented source contract

- Manifest V3 add-on ID `advanced-tab-manager@goreecloud.com`.
- Stable 0.1.13 packages the canonical Advanced Tab Manager product SVG at `icons/advanced-tab-manager.svg`, requires byte identity with branding blob `2c1865ee3809ae91c3bcb42d2d39275668651ab7`, and declares Firefox `icons` plus `action.default_icon`; this changes product identity presentation only and does not widen browser authority.
- Non-persistent ES-module background scripts.
- Permissions only: `activeTab`, `alarms`, `menus`, `scripting`, `sessions`, `storage`, `tabGroups`, and `tabs`.
- No `unlimitedStorage`, host permissions, declarative/persistent content scripts, remote telemetry, general page-content inspection, or private-browsing access. Tab-title renaming may programmatically touch only the clicked eligible page's `document.title` under temporary `activeTab` authority.
- Firefox remains authoritative for live tabs/windows/native groups; extension UI and automation snapshots are reconstructed from Firefox APIs.
- Runtime Firefox tab/group IDs are not durable persistent identity.
- Organizational state contains Tab Sets, stashed items, retained session snapshots, and snapshot-retention configuration; snooze recovery and rule definitions remain in separate versioned `storage.local` records.
- Restorable URLs remain limited to `http:`, `https:`, and `about:blank`.
- Existing tree, Tab Set/stash, duplicate-cleanup, snooze, rule-action, and command-palette contracts remain in force.

### ATM-008C manager/diagnostics boundary — 0.1.8

- `src/core/manager-model.js` is a pure aggregation layer. It has no browser API dependency.
- The manager model contains source/lifecycle/component metadata, live/saved counts, local-store availability/schema/revision metadata, and manifest-declared permission posture.
- The manager model deliberately omits tab titles, tab URLs, Tab Set/stash/snooze URLs, rule contents, and browsing-history records.
- `src/background/manager.js` reads the already-established dashboard, snooze, and rule-state interfaces. A failed store read is converted to a degraded availability state so one broken local store does not suppress the remaining diagnostics.
- `atm:get-manager-state` is read-only. It does not mutate Firefox or extension-owned saved state.
- `src/manager/manager.html`, `.css`, and `.js` provide the full-window read-only diagnostic surface with Refresh and Open sidebar actions only.
- The manager can be opened from the sidebar, popup, or command palette. The command palette still routes through an existing UI control and contains no direct browser API calls.
- The manager adds no new manifest permission, host permission, content script, remote dependency, telemetry, or private-browsing access.
- Reduced Transparency, responsive layout, keyboard focus indication, and Forced Colors fallbacks are included in source.
- Session snapshots, bulk organization, destructive settings, automatic rule execution, remote management, and synchronization remain outside the current boundary.

### ATM-008D local backup portability boundary — 0.1.9

- `src/core/portability.js` defines a versioned GoreeCloud Advanced Tab Manager backup envelope with exact Gecko identity, source extension version, export timestamp, implemented store payloads, canonical JSON hashing, and SHA-256 integrity verification.
- Imported organizational, snooze, and rule payloads are revalidated through their existing authoritative store validators before replacement.
- Preview returns only imported counts, ID-conflict counts, source version/time, integrity status, and expected current revisions; it does not return imported URLs or titles to the Manager UI.
- `src/background/portability.js` serializes export/preview/apply operations and does not call live-tab create/update/remove/discard APIs.
- Apply requires the exact revisions observed during preview. Drift fails closed with `state-changed-since-preview`.
- Imported store revision numbers are not trusted as local chronology; successful replacement writes each imported payload at the current local revision + 1.
- One storage write replaces the three implemented extension-owned stores, readback verifies all three, and snooze alarms are reconstructed from imported deadlines.
- Readback or snooze-reconstruction failure attempts exact restoration of all pre-import records and then reconstructs the prior snooze alarms.
- The Manager enforces a 16 MiB selected-file cap before JSON parsing and requires explicit confirmation before replacement.
- Import itself never opens or closes Firefox tabs. Restoring saved records and opening live browser tabs remain separate user actions.
- Version 0.1.9 adds no Firefox permission and preserves the existing no-host/no-content-script/private-browsing boundary.

### ATM-008E retained session snapshots and core-scale qualification — 0.1.10

- `src/core/session-snapshots.js` captures supported non-private Firefox windows into bounded extension-owned recovery records using the same safe restorable-URL, group, tree, pin, order, and active-tab semantics already used by Tab Set capture.
- Snapshot retention defaults to 10 and is explicitly configurable from 1 through 50 records. Lowering retention prunes the oldest records through the verified organizational-state mutation path.
- Snapshot restore is additive: saved windows are reconstructed as new Firefox windows. Existing live windows are not closed or replaced.
- Multi-window restore failure attempts to remove every window created by that restore while the saved snapshot remains available.
- The Manager exposes only snapshot ID, capture timestamp, window count, and tab count. Saved snapshot URLs and titles are not included in the diagnostic model.
- Session snapshots are included inside the existing organizational backup payload and are therefore covered by backup identity, integrity, schema validation, preview, stale-revision rejection, readback verification, and rollback.
- `scripts/large-session-qualification.mjs` runs deterministic 100/500/1,000-tab core-scale fixtures for snapshot capture and Manager aggregation. CI retains the JSON report with the unsigned candidate XPI and SHA-256 checksum.
- Core-scale success is not representative Firefox runtime/rendered-performance acceptance.

### 0.1.11 release-preparation boundary

- Functional behavior from the accepted 0.1.10 slice is preserved; 0.1.11 introduces no feature expansion.
- Packaged lifecycle wording is neutral so a later signed artifact does not contradict canonical release metadata.
- The popup gains an explicit Forced Colors border fallback.
- Repository-local Glaze UI 1.5.1 qualification and Stable Security Blocker qualification are exact-revision gates.
- Governed Mozilla signing, signed parity/integrity verification, persistent install, full Firefox restart, and post-restart acceptance all passed for the accepted 0.1.11 Stable release.

### 0.1.12 interface-refinement boundary

#### Tab-title renaming boundary

- Firefox exposes no direct Tabs API setter for tab titles. Advanced Tab Manager therefore changes only the clicked eligible page's `document.title` through `browser.scripting.executeScript`.
- The action is surfaced through Firefox's native tab context menu as **Rename tab title…**. Because Manifest V3 uses a non-persistent event-page background in Firefox, the persistent menu item is created from `runtime.onInstalled` and must not be removed/recreated on routine background startup. Selecting that menu item grants temporary `activeTab` authority for the clicked tab, including an inactive clicked tab, without granting all-sites host access.
- Eligibility is limited to non-private HTTP(S) tabs. The native menu is filtered with HTTP(S) `documentUrlPatterns` so ordinary restricted Firefox/system/extension pages do not present an inapplicable rename action, while the background eligibility check still fails closed if an unsupported context reaches it by another path.
- The custom title is bounded to 160 characters and stored with `browser.sessions.setTabValue` under the tab's Firefox session identity; no new `storage.local` schema is introduced.
- Rename and Restore attempt to return both the visible title and the saved tab metadata to the prior state when a metadata update fails.
- Rename and Restore are rollback-aware across the page-title mutation and Firefox session metadata boundary. If the metadata write/remove step fails after the visible title changes, the extension verifies or restores the prior session value, reapplies the prior custom/page title state when scripting authority remains available, reports whether full rollback completed, and does not broadcast a successful rename/restore event.
- The injected same-document observer watches only title/head mutations needed to preserve the custom label when a site updates its own title. It does not inspect body content, forms, cookies, credentials, or page application state.
- **Restore page title** disconnects the observer, restores the latest observed site title for that document, and removes the session value.
- Navigation or reload revokes the temporary scripting authority and can restore the site's own title. The saved custom label remains available to the rename dialog for explicit reapplication; persistent cross-navigation injection is deliberately not implemented because it would require broader host authority.
- Real-Firefox qualification must exercise the complete bounded user path against controlled local fixtures: native-menu invocation, custom-title application, same-document overwrite resistance, reload semantics with saved-label reapplication, Restore page title behavior, restricted-page menu absence, initial keyboard focus, native form/live-status semantics, keyboard submit, keyboard Restore, and keyboard Cancel.
- The rename dialog must reflow without horizontal clipping at narrow effective widths; fixed minimum-width assumptions are not permitted. Real-Firefox qualification includes a 200% zoom horizontal-overflow preflight for the dialog and its action controls.
- The dialog consumes the shared `src/shared/glaze.css` product lockup and material tokens, while semantic system colors, Reduced Transparency, Forced Colors, and native control semantics remain authoritative fallbacks.
- Real-Firefox qualification also preflights the rename dialog under Firefox dark color-scheme override, Forced Colors override, Reduced Transparency preference, and Reduced Motion preference. It verifies media-state activation, fallback material behavior, zero active motion under Reduced Motion, and bounded horizontal reflow.
- Automated keyboard/semantic/reflow/appearance qualification is a preflight only. It does not substitute for the separately governed human assistive-technology, visible-focus, appearance, large-text, or zoom acceptance record.
- The feature completed independent exact-candidate permission, rendered-dialog, keyboard/accessibility, real-Firefox, signed-restart, and Stable acceptance for 0.1.12; it does not inherit those facts from 0.1.11.


- Stable 0.1.12 is the accepted signed production baseline; 0.1.11 remains historical rollback provenance.
- Popup, sidebar, and Manager presentation is reorganized for clearer hierarchy, density, action priority, responsive behavior, and GoreeCloud/Firefox fit without changing browser authority.
- The Manager model no longer embeds mutable release lifecycle labels. It exposes immutable build version/component/platform information while canonical release records remain authoritative for lifecycle/signing status.
- The Manager now renders the retained session-snapshot count already present in the privacy-minimized manager model.
- Sidebar tab rows expose stronger keyboard/assistive semantics while preserving the established activation and action routes.
- Semantic Firefox/system colors, visible focus, Reduced Transparency, Forced Colors, and responsive constrained-window fallbacks remain mandatory.
- Tab-title renaming adds the narrowly scoped `activeTab`, `menus`, and `scripting` permissions for explicit user invocation. No host permission, declarative content script, telemetry path, remote dependency, private-browsing access, or extension storage schema is introduced.
- 0.1.12 adds one bounded browser-state policy through the existing `tabs` permission: on extension/background startup and when a new tab is created, eligible non-private open tabs are updated with `autoDiscardable: false`. This prevents Firefox from automatically discarding those tabs while keeping explicit `tabs.discard` actions available when the user deliberately chooses to unload a tab.
- ATM-004A now includes a bounded **Move branch to new window** operation. The action is exposed only when the entire branch is visible and every member is non-private, unpinned, outside a native Firefox group, and outside Firefox Split View. The background reconstructs the branch twice, creates a new Firefox window by moving the root tab, moves the verified descendants, then reconstructs the branch again to verify that every member arrived in one destination window with logical parent-child relationships intact.
- If Firefox fails during branch movement or the post-move verification does not match the verified plan, Advanced Tab Manager attempts to move affected branch members back to their original source window/indexes and reports incomplete rollback instead of claiming success. Native-group membership, pin semantics, and Split View composition are deliberately not rewritten by this slice; grouped, pinned, or Split View branches remain blocked until a later explicit policy design. The Split View guard prevents Firefox from implicitly moving a split partner that was not part of the verified branch plan.
- ATM-006A adds an optional `tracking-normalized` duplicate review/cleanup mode while retaining `exact-url` as the default. Normalization is limited to removing `utm_*`, `gclid`, `dclid`, `fbclid`, `msclkid`, `mc_cid`, and `mc_eid` from valid non-credentialed HTTP(S) URLs. Path, fragment, and every non-tracking query parameter remain significant.
- Tracking-normalized cleanup preserves the existing active/pinned/audible/hidden/private/tree guards, requires an explicitly reviewed keeper plus confirmation, and reconstructs the current live duplicate set in the background before any tab closure. Unsupported URL schemes are excluded from normalized review. Durable user-defined protected-tab cleanup exclusions remain planned and are not manufactured by this slice.
- The live snapshot model carries the Firefox `autoDiscardable` property so residency protection can be represented truthfully in product UI. Sidebar, popup, and Manager residency summaries must distinguish automatic-discard protection from current resident/discarded state and must not serialize page content or imply foreground-equivalent scheduling.
- The residency policy does not silently reload an already user-discarded tab and does not claim foreground-equivalent execution for background pages. Firefox remains authoritative for timer/animation throttling and operating-system process/resource constraints.
- Tree branch bulk close/discard is a bounded 0.1.12 ATM-004A slice. A branch is derived only from valid same-window logical parent relationships. The sidebar exposes branch actions only when the full current descendant set is visible; the background reconstructs the branch twice immediately before mutation and rejects drift. Branch close requires explicit user confirmation. Branch discard also requires confirmation and fails closed if any member is active, pinned, or audible. Drag-and-drop and richer manual reparenting remain outside this slice; branch move is implemented by the separate guarded move operation above.
- One-shot snooze scheduling in 0.1.12 supports +1 hour, Later today, tomorrow morning, Next week at the local morning default, and arbitrary future local date/time selection through the native sidebar dialog. Later today selects the next bounded same-day afternoon/evening slot with at least 30 minutes of lead time and becomes unavailable when no same-day preset remains.
- Snoozed items can be opened early, rescheduled, or explicitly cancelled. Cancellation deletes the local recovery record and clears its alarm without reopening the tab; alarm-cleanup exceptions restore the prior recovery record and alarm when possible.
- Recurring snooze schedules are not implemented by this slice because repeat/reopen semantics require separate policy and UX definition; no recurrence behavior is inferred or silently manufactured.
- Because the presentation delta is material, 0.1.12 requires fresh exact-revision GLAZE UI V1.6 / 1.6.0 repository-local adoption evidence plus representative real-Firefox rendered/accessibility acceptance before consumer acceptance or any Stable promotion. Historical V1.5.1 qualification remains valid only for the accepted Stable 0.1.11 lineage.
- Advanced Tab Manager has no approved canonical product icon in `GoreeCloud/goreecloud-branding-assets` at this source revision; no local replacement is invented by this candidate.

## Release boundary

`0.1.12` is the accepted Stable release for Mozilla unlisted/self-distribution. Governed signing/restart run `36378135958` accepted exact runtime source revision `43f3010607550d7d4380353b97f85a4dd0186695`, unsigned SHA-256 `3db751f3a2c80d8d339ea0648d00a8ff016840f6587b58e5a61c484bf687588f`, signed SHA-256 `2e54bdf2aa312c9cfe2895fd456f6d088a58eab6d24de80339e996e3e9ae11ba`, Stable Security Blockers, GLAZE UI V1.6 consumer acceptance, persistent signed installation, full Firefox restart, and post-restart product acceptance. Stable 0.1.11 remains historical rollback evidence.
