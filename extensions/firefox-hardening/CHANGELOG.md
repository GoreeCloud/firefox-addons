# Changelog

## 0.1.0 — Stable

- Introduced the first-party GoreeCloud Browser Hardening extension.
- Added native Firefox BrowserSetting scan/apply/restore architecture.
- Added Balanced, Strict, and Maximum profiles with explicit breakage boundaries.
- Added deterministic Firefox Enterprise `policies.json` generation.
- Added local-only popup/dashboard UI, privacy/security documentation, and unit tests.
- Added deterministic real-Firefox release qualification; run `37165320162` accepted exact source `05c73782d9edb072fda3f6872406cb6809099011` and unsigned candidate SHA-256 `82043d51fafed43635b480f7530a5f5c2ea3ef7bd16a7f79fa2eb62ca63a1151` on Firefox 156.0.
- Added governed Mozilla-signing, signed-payload parity, existing-version recovery, and persistent-install/full-restart acceptance infrastructure.
- Mozilla signing run `37165746695` rejected the former add-on display name because it contained the Firefox trademark; no signed artifact was created. Renamed the user-facing product to **GoreeCloud Browser Hardening**.
- Fresh post-rename qualification passed in run `37166231119` for exact source `7726d8ee91ae72dc81b4c407a6c1572c9bdc790c`, deterministic unsigned SHA-256 `52333b66989c61da92342f7f386c2a2f0a6718585cab96c7037f04d1760d93ba`, and Firefox 156.0.
- Governed signing/restart run `37167368897` recovered and parity-verified the approved unlisted Mozilla-signed XPI, installed it persistently, fully restarted Firefox 156.0 without reinstalling, revalidated Strict-profile behavior after restart, and verified Restore released all extension-owned settings. Signed SHA-256: `d123228b15a58762895540342d063e012195eedd2d65bf1a937e8b634604f0ae`.

This entry records the accepted 0.1.0 source, unsigned runtime qualification, Mozilla signing, and signed persistent-restart acceptance. Final machine lifecycle evidence is regenerated after the Stable metadata merge.
