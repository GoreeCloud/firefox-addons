# GoreeCloud Advanced Tab Manager — Features

## In development — 0.1.12

- Default live-tab residency: on background startup and for newly created tabs, Advanced Tab Manager sets Firefox `autoDiscardable=false` for every eligible non-private open tab so Firefox does not automatically unload background tabs. Explicit manual/rule-driven Discard remains available as a user action.
- Residency visibility: live snapshot normalization preserves Firefox's `autoDiscardable` state so the sidebar can show an `auto-protected` count, the popup can report protection health, and the Manager can explain eligible/protected/resident/explicitly-discarded counts without exposing tab titles, URLs, or page content.
- The residency default does not claim foreground-equivalent scheduling. Firefox remains authoritative for background timer/rendering throttling and operating-system process/resource constraints; the extension does not inspect or alter page content to bypass those browser policies.
- Snooze scheduling now covers +1 hour, Later today, tomorrow morning, Next week at the local morning default, and arbitrary future local date/time selection. Later today selects the next bounded same-day afternoon/evening slot with at least 30 minutes of lead time and disables itself when no same-day preset remains. Snoozed items can be reopened early, rescheduled, or explicitly cancelled without reopening; cancellation removes the recovery record and alarm through a rollback-aware path.
- Tree branch actions: when the entire selected branch is visible, the Tree view can close the selected tab plus all current descendants, or discard the whole eligible branch. Both operations require explicit confirmation; the background reconstructs the branch twice and fails closed on drift. Branch discard refuses branches containing active, pinned, or audible tabs.

- Redesigned popup command surface with glanceable open-tab, Tab Set, snoozed, and exact-duplicate counts.
- Redesigned sidebar chrome, search/view composition, compact state chips, active-tab treatment, responsive density, and clearer primary/secondary actions.
- Reorganized full Manager around overview, recovery, portability, and secondary technical-status sections.
- Removed stale embedded lifecycle/source-candidate labels from the runtime Manager model; canonical release records remain authoritative for lifecycle and signing truth.
- Corrected Manager rendering of retained session-snapshot count.
- Strengthened sidebar tab-row keyboard and assistive semantics.
- Preserved existing Firefox permissions, host/content/private-browsing boundaries, storage schemas, recovery semantics, automation boundaries, and local-first behavior.
- The current shared Glaze adoption target is GLAZE UI V1.6 / 1.6.0. Version 0.1.12 now requires fresh repository-local V1.6.0 source mapping plus representative rendered/accessibility acceptance before consumer acceptance; historical V1.5.1 evidence remains provenance for Stable 0.1.11 only.
- Stable 0.1.11 remains the accepted signed rollback/production baseline until a later release completes all required gates.


## Implemented in Stable 0.1.11

- Firefox Manifest V3 identity, canonical component directory, Firefox 139+ baseline, and deterministic packaging integration.
- Non-persistent ES-module background event page with cold-start Firefox state reconstruction.
- Firefox session-backed logical tab IDs and durable tree-parent metadata with cycle/orphan reconciliation and verified rollback-aware persistence.
- Persistent reusable Tab Sets and transactional stashing in versioned `storage.local` state.
- Safe restoration boundary limited to `http:`, `https:`, and `about:blank`.
- Exact-URL duplicate review with user-selected keeper, explicit confirmation, fresh-state recheck, and conservative cleanup guards.
- Restart-safe one-shot snoozing with separately versioned local recovery records and startup alarm reconstruction.
- Independently versioned local rule state with verified write/readback/rollback behavior.
- Deterministic local rule evaluation with explicit priority, stable ties, explainable condition matches, private-tab exclusion, bounded explicit actions, conflict rejection, and user-triggered Apply now rechecks.
- Rules sidebar view with engine enable/disable, bounded rule creation, rule enable/disable/delete, preview, conflict visibility, and Apply now confirmation.
- Keyboard-first command palette with deterministic local search and bounded view/search/refresh/Tab Set/manager routing.
- ATM-008C full-window Manager/diagnostics foundation.
- ATM-008D versioned local JSON backup export and validated replacement import for implemented organizational, snooze, and rule stores.
- SHA-256 backup integrity, exact GoreeCloud Advanced Tab Manager identity validation, strict existing-store schema validation, stale-preview rejection, readback verification, and exact-record rollback on failed import.
- Import preview with counts/conflicts only, explicit replacement confirmation, 16 MiB file safety cap, and no live-tab opening/closing by the import path.
- ATM-008E retained local session snapshots with configurable 1–50 record retention, restorable non-private URL filtering, window/group/tree/pin/active-state preservation, additive new-window restore, and created-window rollback on restore failure.
- Privacy-minimized Manager snapshot metadata limited to snapshot ID, capture time, window count, and tab count.
- Deterministic CI core-scale qualification at 100, 500, and 1,000 synthetic tabs, with candidate report, unsigned XPI, and SHA-256 checksum retained as workflow artifacts.
- Manager aggregation limited to counts, source/lifecycle metadata, store availability/schema/revisions, and manifest permission posture; tab titles/URLs, saved URLs, rule contents, and browsing history are not included in the manager model.
- Degraded manager rendering when one local store is unavailable.
- Manager entry points from sidebar, toolbar popup, and command palette.
- Reduced Transparency and Forced Colors fallbacks across the bounded manager/command surfaces, including an explicit popup Forced Colors release fallback.
- Lifecycle-neutral packaged popup/Manager text suitable for signing without embedding candidate or Stable claims.
- Repository-local GLAZE UI 1.5.1 qualification and fail-closed Stable Security Blocker qualification with full relevant Git-history secret scanning.
- Governed Mozilla signing, signed-XPI parity/integrity, persistent installation, full Firefox restart, and post-restart release-critical acceptance completed for Stable 0.1.11.
- No host permissions, no content scripts, no telemetry, no remote synchronization, and private browsing disabled.

## Planned / not yet implemented

Tree drag-and-drop, branch move, richer manual reparenting, normalized duplicate matching, durable protected-tab rules, recurring snoozing after a separate repeat-policy/UX design, event-driven automatic rule application, richer rule editing, optional user-enabled automatic discard policy, richer command actions, broader manager/settings workflows, Webspaces integration, optional hidden-tab Focus Mode, additional representative rendered Firefox large-session/performance coverage, and future feature expansion remain planned. Stable 0.1.11 release qualification itself is complete.
