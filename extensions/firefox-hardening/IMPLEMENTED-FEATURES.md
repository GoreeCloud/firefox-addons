# Implemented Features — 0.1.1 Source Candidate

- Native Firefox `privacy` and `browserSettings` setting inspection.
- `levelOfControl` conflict detection before writes.
- Balanced, Strict, and Maximum profile targets.
- Reversible extension-owned setting release.
- Hardening compliance score against the selected profile.
- Live settings table with current value, target, ownership, and compliance state.
- Local Firefox Enterprise `policies.json` generator.
- Copy and save actions for generated policy output.
- Explicit warnings for disruptive Maximum-mode behavior.
- Zero host permissions and zero browsing-content access.
- Node unit tests for profile behavior, conflicts, restore semantics, scoring, and policy generation.
- Automated real-Firefox unsigned release qualification covering Balanced, Strict, Maximum, policy generation, popup privacy messaging, and reversible restore for the exact deterministic 0.1.0 candidate.
- Mozilla-signed unlisted XPI parity verification, persistent installation, full Firefox restart without reinstalling, post-restart Strict-profile verification, and reversible extension-control release acceptance for Stable 0.1.0.

- Reviewed profile application: selecting a profile opens an explicit current-value → target-value preview before any write.
- Per-setting local opt-outs that persist across reviewed applications and are honored by WebExtension application and generated policy output where equivalent controls exist.
- Popup profile actions route to the dashboard review instead of mutating Firefox directly.
- First-use guidance explains the reviewed-apply model and can be dismissed after the user understands the flow.
- Completed user-facing rename cleanup for the SVG accessibility title and Restore confirmation.
- Stable 0.1.0 rollback evidence retained: governed run `37167368897` accepted Mozilla signing, payload parity, persistent installation, full restart, and ownership release for the exact 0.1.0 payload, later promoted by PR #178. Final governed lifecycle readback run `37167984845` re-verified the same signed payload and recorded `stablePromoted: true`.
