# GoreeCloud Advanced Tab Manager — GLAZE UI V1.6.0 Consumer Adoption

## Status

**Product:** GoreeCloud Advanced Tab Manager 0.1.12  
**Lifecycle:** Development / source candidate  
**Accepted product Stable:** 0.1.11  
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

Current machine evidence deliberately reports `status: adoption-required`. It may prove source mapping and preserved authority/privacy invariants, but it must not emit `accepted-v1` until product-specific V1.6 rendered, accessibility, supported-environment, and other applicable acceptance evidence is complete.

## Applicable V1.6 source mapping

The current 0.1.12 source maps the following applicable V1.6 principles:

- a shared repository-local `src/shared/glaze.css` surface/token layer consumed by the sidebar, popup, and Manager so material hierarchy, geometry, focus treatment, and product lockup presentation remain consistent without a remote runtime dependency;
- semantic system colors and protected state meaning;
- visible live-tab residency semantics that distinguish Firefox automatic-unload protection from current resident/discarded state without using color alone or manufacturing foreground-execution claims;
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

Expected evidence state before downstream acceptance:

- `glazeTargetVersion: 1.6.0`;
- `status: adoption-required`;
- `sourceMappingValidated: true`;
- `applicablePresentationObligationsAccepted: false`;
- `representativeRenderedAcceptanceComplete: false`;
- `assistiveTechnologyAcceptanceComplete: false`;
- `largeTextAcceptanceComplete: false`;
- `consumerRegistryAccepted: false`;
- `productStableStatusImplied: false`;
- `productionEligibilityImplied: false`.

## Governed target-review infrastructure

`TARGET-ACCEPTANCE-0.1.12.md` and `scripts/target_acceptance.py` define a closed, privacy-minimized human-review evidence contract. The manual **Advanced Tab Manager Target Review Candidate** workflow can package one exact source revision twice, prove deterministic bytes, rerun repository/runtime/security/Glaze-source checks, and retain the exact unsigned XPI for human review. The complete human record remains local unless a later governed release step explicitly binds to a privacy-safe provenance digest.

This infrastructure is preparatory evidence governance only. It does not establish keyboard, assistive-technology, alternate-appearance, or large-text acceptance.

September 27 owner-rendered screenshots of the then-current 0.1.12 candidate were reviewed as remediation evidence. They confirmed that runtime surfaces were functional but still lacked the visual refinement expected for current V1.6 consumer acceptance, especially in Manager material hierarchy and cross-surface cohesion. The resulting shared-token/visual-polish source change therefore requires fresh post-change rendered review and does not inherit the earlier normal-light acceptance record.

## Remaining product acceptance

Before Advanced Tab Manager 0.1.12 can claim current Glaze consumer acceptance or replace Stable 0.1.11, it still requires the applicable product-specific evidence, including:

- representative keyboard and assistive-technology acceptance;
- Forced Colors rendered acceptance;
- Reduced Transparency rendered acceptance;
- dark-appearance rendered acceptance;
- high-zoom and large-text/reflow acceptance;
- any resulting corrections and fresh exact-head qualification;
- product-specific packaging/security/restart/signing gates;
- a separate governed product Stable promotion.

The source-adoption record is therefore a migration/control record, not a Stable or production acceptance record.


## Residency visibility refinement

The 0.1.12 Development candidate now preserves Firefox's `autoDiscardable` state in the privacy-minimized live snapshot so the sidebar, popup, and Manager can make the default residency policy visible. The presentation distinguishes automatic-discard protection from current resident/discarded state and keeps explicit manual Discard available.

This refinement changes rendered sidebar, popup, and Manager presentation after the post-PR #110 normal-light screenshot review. That earlier review remains bounded evidence for its exact revision and observed conditions; it is not silently inherited as rendered acceptance for the residency-visibility candidate. Fresh representative rendered review remains required after integration, alongside the already-pending accessibility and alternate-environment gates.
