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

The 0.1.12 Development line now adds a **Next week 9:00 AM** preset to the native snooze dialog and an explicit **Cancel snooze** action in the Snoozed view. These controls reuse the existing one-shot recovery/alarm model and do not add permissions or storage schema.

Earlier normal-light screenshot evidence remains valid for the unchanged surfaces and conditions it actually showed, but it does not constitute rendered acceptance of these newly added snooze-control states. Fresh representative rendering of the updated snooze dialog and Snoozed-view cancellation control is required before those exact UI states are accepted.

Recurring snooze behavior remains outside this change pending a separate repeat-policy/UX definition.
