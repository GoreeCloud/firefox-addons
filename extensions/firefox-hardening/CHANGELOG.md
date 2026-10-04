# Changelog

## 0.1.0 — Source candidate

- Introduced the first-party GoreeCloud Browser Hardening extension.
- Added native Firefox BrowserSetting scan/apply/restore architecture.
- Added Balanced, Strict, and Maximum profiles with explicit breakage boundaries.
- Added deterministic Firefox Enterprise `policies.json` generation.
- Added local-only popup/dashboard UI, privacy/security documentation, and unit tests.
- Added deterministic real-Firefox release qualification; run `37165320162` accepted exact source `05c73782d9edb072fda3f6872406cb6809099011` and unsigned candidate SHA-256 `82043d51fafed43635b480f7530a5f5c2ea3ef7bd16a7f79fa2eb62ca63a1151` on Firefox 156.0.
- Added governed Mozilla-signing, signed-payload parity, existing-version recovery, and persistent-install/full-restart acceptance infrastructure.
- Mozilla signing run `37165746695` rejected the former add-on display name because it contained the Firefox trademark; no signed artifact was created. Renamed the user-facing product to **GoreeCloud Browser Hardening** and paused automatic signing until the revised candidate receives fresh exact-source qualification and digest binding.

This entry records source and unsigned runtime qualification. It does not claim Mozilla signing or Stable release acceptance.
