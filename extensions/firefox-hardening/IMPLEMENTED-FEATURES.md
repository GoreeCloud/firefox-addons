# Implemented Features — 0.1.0 Stable

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
- Mozilla-signed unlisted XPI parity verification, persistent installation, full Firefox restart without reinstalling, post-restart Strict-profile verification, and reversible extension-control release acceptance.
