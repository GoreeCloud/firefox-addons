# Changelog

## 0.1.1 — Source candidate

- Fixed the remaining user-facing pre-rename product strings in the Restore confirmation and icon accessibility title.
- Added non-mutating profile change preview before any BrowserSetting write.
- Added persistent local per-setting opt-outs and made reviewed profile application skip opted-out controls.
- Made generated Firefox Enterprise Policy output respect saved opt-outs where an equivalent policy exists.
- Changed popup profile buttons to open the dashboard review instead of applying settings directly.
- Added first-use guidance for the reviewed-apply model.
- Advanced runtime/source validators and tests to the 0.1.1 candidate without adding permissions.
- Preserved 0.1.0 as the accepted Stable rollback rather than silently changing its bytes. Signing/restart run `37167368897` accepted exact source `7726d8ee91ae72dc81b4c407a6c1572c9bdc790c`, unsigned SHA-256 `52333b66989c61da92342f7f386c2a2f0a6718585cab96c7037f04d1760d93ba`, Mozilla-signed SHA-256 `d123228b15a58762895540342d063e012195eedd2d65bf1a937e8b634604f0ae`, persistent installation, full restart, and restore ownership release; PR #178 later promoted that exact payload to Stable. Final governed lifecycle readback run `37167984845` re-verified the same signed payload and recorded `stablePromoted: true`.

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
- Governed signing/restart run `37167368897` accepted Mozilla-signed SHA-256 `d123228b15a58762895540342d063e012195eedd2d65bf1a937e8b634604f0ae`, payload parity, persistent installation, full restart, and restore ownership release. PR #178 promoted that exact payload to Stable.

This entry records accepted Stable 0.1.0 provenance; 0.1.1 remains a separate source candidate.
