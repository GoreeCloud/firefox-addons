# GoreeCloud Advanced Tab Manager — GLAZE UI V1.6.0 Consumer Adoption

## Status

**Product:** GoreeCloud Advanced Tab Manager 0.1.12  
**Lifecycle:** Stable  
**Accepted product Stable:** 0.1.12  
**Platform:** Firefox browser extension  
**Required shared target:** GLAZE UI V1.6 / machine version 1.6.0  
**Shared authority repository:** `GoreeCloud/glaze-ui`  
**Accepted shared release source:** `a7180679ea851389e0f3004515f9a25f420e716d`  
**Shared qualification anchor:** `c7509c79256b04b0aa67cb9dd0737d7588e0ae4a`  
**Qualification evidence integration:** `354f5759385c28596fcfec26a3ad525e89fb1c35`  
**Published shared artifact SHA-256:** `687268b5eb76917eccae9d935ffa1bead333d5dee50b6098e996a3f44cee50af`

GLAZE UI V1.6 / 1.6.0 is the current shared GoreeCloud adoption target. V1.5.1 is the immediate shared rollback baseline and remains historical provenance for Advanced Tab Manager Stable 0.1.11; it is not the current acceptance target for 0.1.12.

## Adoption boundary

Advanced Tab Manager uses repository-local Firefox HTML/CSS/JavaScript presentation rather than embedding the shared Glaze runtime package. V1.6 adoption therefore means mapping the applicable Glaze contracts into the product's own constrained browser surfaces and proving those mappings at an exact consumer revision.

The shared V1.6 Stable release does not grant Advanced Tab Manager consumer acceptance, product Stable status, production eligibility, signing acceptance, or deployment acceptance automatically.

Current machine evidence reports `status: accepted-v1` only after product-specific V1.6 rendered/accessibility/environmental acceptance, Mozilla-signed restart acceptance, and authoritative consumer-registry acceptance are all recorded.

## Applicable V1.6 source mapping

The current 0.1.12 source maps the following applicable V1.6 principles:

- a shared repository-local `src/shared/glaze.css` surface/token layer consumed by the sidebar, popup, Manager, and tab-title rename dialog so material hierarchy, geometry, focus treatment, and product lockup presentation remain consistent without a remote runtime dependency;
- semantic system colors and protected state meaning;
- visible live-tab residency semantics that distinguish Firefox automatic-unload protection from current resident/discarded state without using color alone or manufacturing foreground-execution claims;
- a native, explicitly labeled duplicate-matching selector whose optional tracking-normalized state remains subordinate to exact matching and explains its bounded policy in text rather than relying on color;
- presentation-only authority with no inferred permission, privacy, security, or release truth;
- a single visually dominant primary action where appropriate and subordinate secondary actions;
- local-first presentation with no remote Glaze dependency;
- keyboard-visible focus and native control semantics;
- Forced Colors and Reduced Transparency source fallbacks;
- responsive constrained-window composition;
- privacy-minimized Manager diagnostics;
- fail-closed rule automation and explicit confirmation before consequential Manager replacement operations;
- explicit empty-state handling;
- no unqualified animation/transition layer in the candidate surfaces;
- manual/rule-driven browser actions remaining application-owned rather than inferred by Glaze.

These source checks do not establish representative screen-reader behavior, large-text/high-zoom acceptance, alternate appearance rendering, cross-platform acceptance, performance acceptance, or Stable status.

## Historical V1.5.1 evidence

`GLAZE-UI-1.5.1-ADOPTION.md` is retained as immutable product provenance for the accepted Stable 0.1.11 lineage. Its accepted V1.5.1 consumer evidence must not be rebound to 0.1.12 or treated as current V1.6 acceptance.

The previous 0.1.12 source/machine qualification against V1.5.1 and the owner-rendered Firefox 156/Linux normal-light review remain useful historical evidence for the exact revisions and visual conditions recorded. They do not satisfy the current V1.6.0 consumer target.

## Machine evidence

`scripts/glaze_consumer_qualification.py` now validates the bounded V1.6 source-mapping invariants and writes exact-revision evidence to:

`dist/advanced-tab-manager-glaze-1.6.0-adoption.json`

Accepted evidence state:

- `glazeTargetVersion: 1.6.0`;
- `status: accepted-v1`;
- `sourceMappingValidated: true`;
- `applicablePresentationObligationsAccepted: true`;
- `representativeRenderedAcceptanceComplete: true`;
- `assistiveTechnologyAcceptanceComplete: true`;
- `largeTextAcceptanceComplete: true`;
- `consumerRegistryAccepted: true`;
- `productStableStatusImplied: false`;
- `productionEligibilityImplied: false`.

## Governed target-review infrastructure

`TARGET-ACCEPTANCE-0.1.12.md` and `scripts/target_acceptance.py` define a closed, privacy-minimized human-review evidence contract. The manual **Advanced Tab Manager Target Review Candidate** workflow can package one exact source revision twice, prove deterministic bytes, rerun repository/runtime/security/Glaze-source checks, and retain the exact unsigned XPI for human review. The complete human record remains local unless a later governed release step explicitly binds to a privacy-safe provenance digest.

This infrastructure remains the governed evidence mechanism. For Stable 0.1.12, its human keyboard, assistive-technology, alternate-appearance, and large-text/reflow review is complete and bound to the accepted runtime revision.

September 27 owner-rendered screenshots initially served as remediation evidence and drove the shared-token/visual-polish refinement. Subsequent exact-candidate owner review completed the required post-change rendering and accessibility acceptance for the runtime revision recorded below.

## Completed product acceptance

Advanced Tab Manager 0.1.12 completed the applicable product-specific V1.6 rendered, keyboard, assistive-technology, Forced Colors, Reduced Transparency, dark-appearance, Reduced Motion, high-zoom/large-text/reflow, constrained-layout, packaging/security, Mozilla signing, persistent-install, and full-restart gates.

The authoritative Glaze consumer registry accepted the product as `accepted-v1` at target `1.6.0` in `GoreeCloud/glaze-ui` merge `b5362a2defb9df0bd33e3b8c5b1ba9d14ce81efb`. The registry intentionally retains `productionEligible: false` because product lifecycle authority remains independent.

## Residency visibility refinement

Stable 0.1.12 preserves Firefox's `autoDiscardable` state in the privacy-minimized live snapshot so the sidebar, popup, and Manager can make the default residency policy visible. The presentation distinguishes automatic-discard protection from current resident/discarded state and keeps explicit manual Discard available.

The residency-visibility refinement received fresh representative rendered, accessibility, and alternate-environment review as part of the completed 0.1.12 target acceptance; earlier screenshots remain historical remediation evidence only.


## Normalized duplicate review refinement

ATM-006A adds a native Duplicates-view selector for exact versus tracking-normalized review. Exact matching remains selected by default. The normalized state exposes the original URLs, uses textual policy copy, and preserves native focus/Forced Colors behavior through the existing sidebar control system.

This is a presentation and interaction change, not a new authority grant: no permission, storage schema, remote dependency, telemetry path, page-content access, or private-browsing access is added. Representative rendering and accessibility review of the Duplicates state completed in the governed 0.1.12 target acceptance.

## Tab-title rename dialog refinement

Stable 0.1.12 includes a dedicated Glaze-aligned **Rename tab title** dialog reached from Firefox's native tab context menu. The dialog uses semantic native controls, visible focus, system/Firefox colors, Reduced Transparency handling, and Forced Colors border fallbacks. It deliberately explains the no-broad-host-permission boundary and the navigation/reload limitation.

The dialog now also consumes the shared Glaze product mark and material tokens directly, with a layered semantic surface, accent privacy note, stronger primary-action hierarchy, narrow-width stacking, and a 200% zoom overflow preflight. These source/runtime guards complement the completed representative human review in normal light, dark appearance, Forced Colors, Reduced Transparency, and large-text/zoom conditions.

This feature also adds narrowly scoped `activeTab`, `menus`, and `scripting` permissions for explicit user invocation, while host permissions remain none and no declarative content script is registered. Exact-candidate permission/security review plus representative normal-light, dark, Forced Colors, Reduced Transparency, large-text/zoom, keyboard, and assistive-technology review completed before current V1.6 consumer acceptance.

Fresh owner-visible screenshots confirmed the Glaze-refined dialog's product lockup, material hierarchy, visible focused input, unclipped controls, and successful visible tab-title change. The owner subsequently completed the remaining dark appearance, Forced Colors, Reduced Transparency, large-text/zoom, keyboard, assistive-technology, and product-level V1.6 acceptance gates.


## Product acceptance completion — September 28, 2026

The owner completed the governed 0.1.12 target review and explicitly reported all remaining human review gates PASS for exact runtime source revision `43f3010607550d7d4380353b97f85a4dd0186695` and deterministic unsigned XPI SHA-256 `3db751f3a2c80d8d339ea0648d00a8ff016840f6587b58e5a61c484bf687588f`.

The completed product-specific Glaze review now covers the current V1.6-mapped sidebar, popup, Manager, command palette, duplicate selector, residency presentation, and Rename tab title dialog across the governed keyboard, assistive-technology, normal-light, dark-appearance, Forced Colors, Reduced Transparency, Reduced Motion, 200%/large-text reflow, and constrained-layout conditions.

Governed Mozilla signing/restart run `36378135958` subsequently verified the same accepted runtime payload, Mozilla-signed parity, persistent installation, full Firefox restart, and post-restart release-critical behavior. The signed XPI SHA-256 is `2e54bdf2aa312c9cfe2895fd456f6d088a58eab6d24de80339e996e3e9ae11ba`.

At this point the repository-local product evidence needed for current Glaze V1.6 consumer acceptance is complete. The authoritative `GoreeCloud/glaze-ui` consumer registry accepted Advanced Tab Manager as `accepted-v1` for exact reviewed runtime revision `43f3010607550d7d4380353b97f85a4dd0186695` in merge `b5362a2defb9df0bd33e3b8c5b1ba9d14ce81efb`, backed by `acceptance/consumer-advanced-tab-manager-v1.6.0.json`.

Product Stable promotion is recorded separately in canonical Firefox-extension lifecycle metadata; Glaze registry acceptance does not itself grant product production eligibility.
