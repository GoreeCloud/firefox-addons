# GoreeCloud Advanced Tab Manager 0.1.12 — Rendered Acceptance Record

## Status

- Product: GoreeCloud Advanced Tab Manager
- Candidate version: `0.1.12`
- Lifecycle: Development / source candidate
- Accepted Stable release remains: `0.1.11`
- Exact reviewed source revision: `35c4d2dd8aa2a3fcd5742f430d8c8388ab85846a`
- Review date: 2026-09-18
- Review environment observed: Mozilla Firefox 156 on Linux
- Evidence type: owner-supplied representative rendered screenshots
- Stable acceptance implied: no

This record captures only what the supplied rendered evidence demonstrates. It does not replace automated Glaze/security/runtime qualification and does not establish Stable status.

## Reviewed surfaces

The supplied screenshots show:

- Firefox `about:debugging#/runtime/this-firefox` with the temporary 0.1.12 candidate loaded;
- the Advanced Tab Manager sidebar at a constrained desktop sidebar width;
- the full Manager surface;
- the toolbar popup.

## Verified rendered observations

### Firefox manifest/runtime presentation

- The earlier yellow Manifest V3 `background.persistent` warning is no longer present in the displayed temporary-extension card.
- The background script is shown as running.
- The add-on identity displayed by Firefox is GoreeCloud Advanced Tab Manager with extension ID `advanced-tab-manager@goreecloud.com`.

### Sidebar

- The top action row remains on one line at the observed sidebar width.
- The command trigger, Manager, Save, and Refresh controls are visibly separated and usable without the prior Refresh wrap.
- Search, view selection, summary chips, window heading, tab rows, active-tab treatment, and row actions remain readable at the observed width.
- The current native-tab-activation/source semantics are not fully proven by screenshots alone; keyboard and assistive-technology behavior remain separate acceptance work.

### Manager

- Live browser metrics render in a balanced 3×2 layout.
- Saved workspace renders six metrics in a balanced 3×2 layout.
- Snapshot count renders as `0`.
- Snapshot limit renders as `10`.
- The retention number input renders `10`.
- The empty recovery state visibly renders `No local session snapshots yet.`.
- Recovery and portability panels no longer rely on unnecessary equal-height stretching.
- Permission boundary renders host permissions as `None`, content scripts as `None`, and private browsing as `Not allowed`.
- The build identity continues to report version `0.1.12` while release lifecycle truth is delegated to canonical release records.

### Popup

- The popup metrics render as a readable 2×2 grid for Open tabs, Tab Sets, Snoozed, and Duplicates.
- The primary `Save focused window` action is visually dominant.
- `Open sidebar` and `Open manager` remain secondary actions.
- Version `0.1.12`, local-first/no-host-permissions copy, and Refresh remain visible without crowding.

## Acceptance limited to observed conditions

The supplied evidence supports representative **normal-light rendered acceptance** for the specific observed Firefox 156/Linux conditions above.

It does not establish the following:

- full keyboard traversal and focus order;
- screen-reader/assistive-technology announcements;
- Forced Colors rendered acceptance;
- Reduced Transparency rendered acceptance;
- dark appearance rendered acceptance;
- reduced-motion behavior;
- high zoom or text scaling;
- every supported constrained window width;
- other operating systems or Firefox versions;
- signed-XPI behavior;
- persistent signed installation and full-browser-restart acceptance;
- Stable release qualification.

## Automated evidence paired with this review

For the exact reviewed revision `35c4d2dd8aa2a3fcd5742f430d8c8388ab85846a`:

- Firefox Repository run `35389864473`: passed.
- Advanced Tab Manager Release Qualification run `35389864508`: passed.
- Advanced Tab Manager Firefox Runtime run `35389864484`: passed.
- Deterministic unsigned XPI SHA-256: `bebcc35d97b3e4f6312b80a2f7eb89b4f16d81017a4c89a36b53ee9260115da0`.
- Release-qualification artifact: `10566070379`.
- Release artifact digest: `sha256:fcc4ec83164599d249995bfe2f0d559ea2346d443084ff93766081879cab596a`.
- Runtime artifact: `10566310103`.
- Glaze UI target: V1.5 / machine version 1.5.1.
- Glaze source/machine evidence reports `status: accepted-v1` and does not imply Stable or production eligibility.

## September 27, 2026 current-target visual review

Additional owner-supplied Firefox 156.0.1/Linux screenshots were reviewed for the distributed 0.1.12 current-main candidate. They show the extension loading successfully, its background script running, the sidebar populated, the toolbar popup functioning, and the Manager rendering live state. They also show that the visual system was not yet sufficiently polished for current GLAZE UI V1.6 consumer acceptance.

Observed remediation needs included:

- stronger cross-surface product identity and a shared material/geometry system;
- less cramped and less visually noisy sidebar chrome/tab-row actions;
- a popup treatment that feels like a deliberate Glaze command surface rather than a conventional flat extension popup;
- a substantially stronger Manager hierarchy so overview, recovery, portability, and technical status do not read as a uniform gray-card grid;
- improved material depth, optical spacing, accent restraint, and lower-level diagnostic hierarchy;
- fresh dark/alternate-appearance and accessibility/environment evidence after the visual corrections.

This September 27 review is **remediation evidence, not acceptance evidence**. The earlier normal-light observations remain bounded historical evidence for their exact reviewed revision and conditions. A fresh post-refinement rendered review is required before current-target V1.6 rendered acceptance can be claimed.

### Post-PR #109 owner review

A second owner-supplied normal-light screenshot set was reviewed after PR #109 merged as `46dc24f9607ebead51a7c8730a65cc27b9027b16`. The screenshots show Firefox 156.0.1 on Linux with the temporary 0.1.12 XPI loaded, the background script running, the refreshed sidebar, toolbar popup, and Manager rendering live data.

The second-stage Glaze direction is visibly improved: the product lockup is coherent across surfaces, the popup has a clear primary action and compact metric hierarchy, the sidebar active-row treatment is readable, and the Manager has a stronger hero plus differentiated overview/recovery/portability regions. The same evidence also exposed two remaining normal-light polish issues: secondary sidebar tab actions are too faint at rest, and the Manager lower diagnostic region remains visually heavier than its secondary importance. The follow-up source pass therefore raises sidebar action legibility, gives the command palette trigger a readable text label, removes non-semantic metric-circle decoration, moves status into the Manager hero, and collapses technical diagnostics behind a native disclosure.

This second screenshot set remains **remediation evidence** because it precedes the follow-up source change. Fresh post-change screenshots are still required before normal-light V1.6 rendered acceptance is updated for the current head.

## Remaining gates

Before 0.1.12 can replace Stable 0.1.11, remaining applicable work includes representative keyboard/assistive-technology acceptance, Forced Colors, Reduced Transparency, dark-appearance and other required environmental rendered review, any corrections and fresh exact-head requalification, Mozilla signing, signed-artifact parity/integrity, persistent signed installation, full Firefox restart acceptance, and separate governed Stable promotion.


## Post-PR #110 normal-light review — 2026-09-27

Owner-supplied Firefox 156.0.1/Linux screenshots were reviewed against current main `c59264cb15ac26f5f9eb1f1192fa00eaefb1e56d`.

Observed acceptance for this exact current-head screenshot set:
- sidebar layout and tab-row controls render cleanly at the supplied constrained width;
- the Commands palette opens and remains readable without observed clipping;
- the Manager renders cleanly with the new hero status treatment and collapsed Diagnostics and boundaries section.

This establishes normal-light rendered acceptance for the sidebar, command palette, and Manager under the observed conditions only.

The toolbar popup is not shown in this exact post-PR #110 screenshot set, so current-head popup rendered confirmation remains pending.

Stable remains `0.1.11`. All other governed accessibility, alternate-appearance, signing, restart, and Stable-promotion gates remain separate.


## Residency-visibility refinement boundary

After the post-PR #110 normal-light review was recorded, the 0.1.12 Development line began a bounded residency-visibility refinement so the product can show the Firefox automatic-discard protection it already enforces.

The candidate carries Firefox `autoDiscardable` state into normalized live tab state and adds:
- an `auto-protected` sidebar summary chip;
- a popup automatic-unload protection status line;
- a Manager Automatic unload protection explanation with protected/eligible, resident, and explicitly discarded counts.

This change does not add permissions, host access, content scripts, telemetry, remote dependencies, private-browsing access, storage schema, or page-content inspection. It also does not change the truthful behavior boundary: automatic-discard protection is not foreground-equivalent scheduling.

Because the refinement changes sidebar, popup, and Manager rendering, the post-PR #110 screenshot evidence remains historical evidence for its exact reviewed source and conditions. Fresh rendered review is required for the residency-visibility candidate before normal-light acceptance is rebound to its exact source revision. Stable remains `0.1.11`.


## Snooze-control refinement boundary

The 0.1.12 Development line now adds **Later today**, **Tomorrow 9:00 AM**, and **Next week 9:00 AM** presets to the native snooze dialog plus an explicit **Cancel snooze** action in the Snoozed view. Later today selects the next bounded same-day afternoon/evening slot with at least 30 minutes of lead time and becomes unavailable late at night rather than crossing into tomorrow. These controls reuse the existing one-shot recovery/alarm model and do not add permissions or storage schema.

Earlier normal-light screenshot evidence remains valid for the unchanged surfaces and conditions it actually showed, but it does not constitute rendered acceptance of these newly added snooze-control states. Fresh representative rendering of the updated snooze dialog and Snoozed-view cancellation control is required before those exact UI states are accepted.

Recurring snooze behavior remains outside this change pending a separate repeat-policy/UX definition.


## Tree-branch action refinement boundary

The 0.1.12 Development line now adds compact Tree-view branch close/discard controls for tabs with current descendants. The controls appear only when the whole branch is visible. Closing a branch and discarding an eligible branch both require explicit confirmation; discard is withheld for branches containing active, pinned, or audible tabs.

This changes constrained-sidebar row-action presentation after the previously reviewed normal-light screenshots. Those screenshots remain valid historical evidence for their exact revisions and unchanged surfaces, but they do not establish rendered acceptance for the new branch-control state. Fresh exact-candidate sidebar rendering is required before this new Tree-view state can be accepted.

The subsequent ATM-004A branch-move slice adds one more Tree-row branch control for fully visible, unpinned, ungrouped, non-Split-View branches. Split View members are intentionally withheld because Firefox may move an associated partner as a browser-owned side effect outside the verified branch plan. That move operation has automated source/unit/real-Firefox qualification requirements, but the previously supplied screenshots do not show this new control or its post-move window state. Fresh exact-candidate rendering of a branch row with Move/Discard/Close controls is therefore still required before the expanded Tree-view action state is visually accepted.

Drag-and-drop and richer manual reparenting remain outside this slice. Stable remains `0.1.11`.


## Normalized duplicate refinement boundary

The 0.1.12 Development line now adds an opt-in **Ignore tracking parameters** mode inside the Duplicates view. Exact URL matching remains the default. The new selector and normalized-review cards show original URLs and explain that only recognized tracking query parameters are ignored; path, fragment, and all other query data remain significant.

This changes the Duplicates-view presentation after the previously supplied normal-light screenshots. Those screenshots remain bounded evidence for the exact revisions and surfaces they actually show, but they do not establish rendered acceptance for the new matching selector, normalized URL rows, or normalized-cleanup confirmation state. Fresh exact-candidate rendering of the Duplicates view is required before this UI state is visually accepted.

Automated source/unit/real-Firefox qualification may establish the bounded matching and cleanup behavior, but it does not substitute for that rendered review or the still-pending accessibility/alternate-environment gates. Stable remains `0.1.11`.

## Tab-title rename dialog delta — pending rendered acceptance

The current 0.1.12 Development source adds a new **Rename tab title** dialog launched from Firefox's native tab context menu. No screenshot set previously recorded in this document includes that dialog or its Restore page title/error states.

Earlier screenshots therefore remain bounded evidence only for the exact surfaces and revisions they actually show. They do not establish normal-light, alternate-appearance, large-text, keyboard, or assistive-technology acceptance for the new dialog. Fresh exact-candidate rendered review must also confirm that the Firefox tab-strip title visibly changes on an eligible HTTP(S) page and that restricted pages fail without misleading success state. Stable remains `0.1.11`.


## Native tab rename menu regression evidence — September 27, 2026

Owner-supplied Firefox 156.0.1/Linux evidence for the distributed unsigned 0.1.12 candidate shows the extension loaded and running, but Firefox's native tab context menu does **not** contain the expected **Rename tab title…** item. This is a functional acceptance failure for the newly introduced tab-title feature, not a cosmetic discrepancy.

Source review identified a Manifest V3 event-page lifecycle defect: the candidate removed and recreated the menu during ordinary background initialization instead of creating persistent menu state from `runtime.onInstalled`. The corrective candidate binds menu creation to the installation/update event and adds real-Firefox qualification that opens the native tab context menu and requires the rename label to be present. The owner screenshots remain regression/remediation evidence; fresh post-fix owner-visible rendering and interaction evidence is still required before this UI path is considered visually accepted.


## Post-fix tab-title rename review — September 27, 2026

Fresh Firefox 156.0.1/Linux screenshots show the corrected unsigned 0.1.12 candidate loaded as a temporary extension. The native tab context menu contains **Rename tab title…**, selecting it opens the dedicated rename dialog without visible clipping, and applying the custom title changes the visible tab-strip label to **Rename Apps**.

This resolves the previously observed missing-menu regression and records normal-light visual confirmation for menu discovery, dialog launch, dialog rendering, and a successful rename operation. Restore behavior, reload/navigation behavior, restricted-page handling, keyboard and assistive-technology review, alternate appearances, large-text/zoom review, Mozilla signing, persistent installation, restart acceptance, and Stable promotion remain separate. Stable remains `0.1.11`.


## Tab-title rename Glaze refinement — fresh review pending

The rename dialog was visually refined after the September 27 post-fix screenshots to use the shared Glaze product mark and material surface system. The prior screenshots remain historical evidence for the exact revision they show, but they do not establish rendered acceptance for this new visual source. Fresh normal-light and alternate-appearance review is required. Stable remains `0.1.11`.


## Glaze-refined tab-title rename normal-light review — September 27, 2026

Fresh owner-supplied Firefox/Linux screenshots were reviewed after PR #132 merged the Glaze-refined rename dialog to `main` as `042ff6ce3c5d4b604f39b1f6a497b2c24b128d4f`. The reviewed distributed candidate was the qualified unsigned 0.1.12 XPI produced from the exact PR head that passed repository, release-qualification, and real-Firefox runtime checks before merge.

Observed normal-light acceptance for the refined rename path:
- the dedicated dialog visibly uses the shared GoreeCloud product mark/lockup and layered Glaze material treatment;
- the custom-title field shows visible keyboard focus and remains fully readable;
- current-page-title text, privacy explanation, Restore page title, Cancel, and Rename controls are simultaneously visible without clipping or overlap;
- the dialog fits comfortably inside its Firefox popup window in the supplied default-scale view;
- the subsequent screenshot shows the Firefox tab-strip label changed to **Tab Manager**, confirming the refined UI still completes the rename operation visibly.

This closes the fresh **normal-light rendered review** requirement for the Glaze-refined rename dialog itself. It does not establish dark-appearance, Forced Colors, Reduced Transparency, large-text/200%-zoom human review, assistive-technology review, persistent signed installation, restart acceptance, or overall 0.1.12 target acceptance. Those gates remain separate. Stable remains `0.1.11`.


## Forced Colors corrective candidate — fresh exact-candidate review pending

Automated Firefox appearance capture found that the primary Rename action could lose readable text under Forced Colors even though layout and focus geometry remained intact. The 0.1.12 Development candidate now maps that primary action to system `ButtonText` on `ButtonFace` in Forced Colors and retains controlled preflight screenshots for normal light, dark appearance, Forced Colors, Reduced Transparency, Reduced Motion, and 200% zoom.

The corrected Forced Colors preflight now renders the Rename label visibly and the exact-head real-Firefox runtime suite passes. These CI images are controlled-fixture regression evidence, not human target acceptance. Because the packaged CSS changed after the September 27 owner normal-light screenshots, the final 0.1.12 candidate still requires fresh exact-candidate owner review before release acceptance can be complete. Stable remains `0.1.11`.


## Current exact-candidate normal-light owner review — September 27, 2026

Fresh owner-supplied Firefox/Linux screenshots were reviewed after the Forced Colors correction merged to `main` as `43f3010607550d7d4380353b97f85a4dd0186695`. The screenshots show `ATM.xpi` loaded as a temporary extension in Firefox 156.0.1 and provide owner-visible rendered/interaction evidence; package identity remains bound by repository and release-qualification records rather than by screenshots.

The screenshots show the current sidebar, popup, Manager, and refined Rename tab title dialog rendering without visible clipping or overlap in normal light. The rename dialog shows visible input focus and all three actions, and a later screenshot shows the Firefox tab-strip label changed to **Tab Manager**.

This closes the fresh current-candidate normal-light rendered subset reopened by the Forced Colors correction. Human dark, Forced Colors, Reduced Transparency, Reduced Motion, 200%/large-text reflow, constrained layout, assistive-technology, and full keyboard-traversal review remain separate. Stable remains `0.1.11`.


## Owner final human review — September 27, 2026

After the fresh current-candidate normal-light review, the owner explicitly reported **all remaining human review gates PASS** for the same exact 0.1.12 candidate.

This closes the outstanding dark-appearance, Forced Colors, Reduced Transparency, Reduced Motion, 200%/large-text reflow, constrained/narrow layout, complete keyboard traversal, and assistive-technology human-review subsets for target acceptance.

The automated Firefox captures and runtime checks remain regression evidence; the owner's PASS declaration is the human acceptance decision. Stable status still depends on successful provenance-bound Mozilla signing, signed-XPI parity, persistent installation, full Firefox restart acceptance, and the separate Stable-promotion change.
