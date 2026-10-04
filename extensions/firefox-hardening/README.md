# GoreeCloud Browser Hardening

GoreeCloud Browser Hardening is a local-first Firefox hardening manager designed as a native alternative to maintaining a large `user.js` file by hand.

It is **not** a fork of arkenfox/user.js and does not copy or redistribute arkenfox preference lists. The design instead uses supported Firefox interfaces directly:

1. Firefox WebExtension `privacy` and `browserSettings` APIs for settings that Firefox exposes to extensions.
2. A generated Firefox Enterprise `policies.json` for startup-level controls that WebExtensions cannot own.

## Source status

Version 0.1.1 is the accepted **Stable release for Mozilla unlisted/self-distribution**. Exact source `3927516c82970d1b6e59adf314949cb4e2a233d6` produced deterministic unsigned SHA-256 `4789363331792d596776ca2d3b2979369a142edafd959726992cf56b8a3a1052`. Governed signing/restart run `37170617536` submitted the exact candidate to Mozilla, verified signed XPI SHA-256 `12fc5e9481365c123bbc0487609907d6473f0e16ad1b761ecf732e4313f80632`, preserved governed payload parity, installed the signed XPI persistently, completed a full Firefox restart, verified post-restart Strict behavior, and released extension-owned settings successfully.

Version 0.1.0 remains the previous accepted Stable rollback. Its final lifecycle readback run `37167984845` recorded `stablePromoted: true` for the earlier signed payload.

## Current capabilities

- Live scan of supported Firefox privacy/browser settings and their `levelOfControl` state.
- Balanced, Strict, and Maximum hardening profiles.
- Non-mutating change preview before profile application, with locally persisted per-setting opt-outs.
- First-use guidance that explains reviewed application and keeps popup actions non-mutating until reviewed in the dashboard.
- Conflict-safe application: settings locked by policy or controlled by another extension are reported rather than overwritten.
- Reversible extension ownership using Firefox `BrowserSetting.clear()`.
- Total Cookie Protection-compatible third-party cookie partitioning through `privacy.websites.cookieConfig`.
- Tracking protection, hyperlink-auditing, speculative-network, anti-fingerprinting, web-notification, WebRTC, and password-saving controls where the selected profile applies them.
- Native `policies.json` generation for telemetry/studies controls, network prediction, HTTPS-Only Mode, cookies, tracking protection, notification prompts, anti-fingerprinting, and Maximum-mode WebRTC/password-saving preferences; generated policy output respects saved opt-outs where an equivalent policy control exists.
- Read-only load/paste audit of an existing `policies.json` with selected-profile diff; imported policy text is kept only in the current dashboard session and is never applied automatically.
- Profile-aware compatibility diagnostics for higher-impact controls and local platform deployment guides for Linux, Windows, and macOS.
- No host permissions, content scripts, page inspection, browsing-history collection, remote configuration, or telemetry.
- Automated real-Firefox qualification of all three profiles, policy generation, popup privacy copy, and reversible restore against the deterministic unsigned XPI.

## Profiles

**Balanced** applies a strong low-breakage baseline: network prediction off, hyperlink auditing off, tracking protection always on, and third-party cookie partitioning.

**Strict** adds Firefox Resist Fingerprinting and denies new website notification prompts by default. Some websites can render differently or expose fewer device/browser capabilities.

**Maximum** adds WebRTC disabling and disables Firefox's password-saving offers. This can break browser-based calling/conferencing and is intentionally treated as disruptive.

## Why two layers?

Firefox intentionally exposes only a subset of browser configuration through WebExtensions. The extension can safely inspect ownership and reverse its own changes for exposed `BrowserSetting` values, while Firefox Enterprise Policy can configure additional native settings at startup. The dashboard keeps those boundaries visible instead of claiming that an add-on can control every Firefox preference.

## Development

Run the local core tests:

```bash
node --test extensions/firefox-hardening/tests/*.test.js
```

Run repository validation, core tests, and build a deterministic unsigned candidate:

```bash
python shared/scripts/validate_repository.py
python extensions/firefox-hardening/scripts/validate.py
node --test extensions/firefox-hardening/tests/*.test.js
python shared/scripts/package_extension.py firefox-hardening
```

Packaging or unsigned runtime qualification does not establish Mozilla signing or Stable acceptance. The governed signing workflow additionally verifies signed payload parity and persistent-install/full-restart behavior before lifecycle promotion can be considered.

## Privacy and security

See [`PRIVACY.md`](PRIVACY.md), [`SECURITY.md`](SECURITY.md), and [`ARCHITECTURE.md`](ARCHITECTURE.md).
