# GoreeCloud Browser Hardening

GoreeCloud Browser Hardening is a local-first Firefox hardening manager designed as a native alternative to maintaining a large `user.js` file by hand.

It is **not** a fork of arkenfox/user.js and does not copy or redistribute arkenfox preference lists. The design instead uses supported Firefox interfaces directly:

1. Firefox WebExtension `privacy` and `browserSettings` APIs for settings that Firefox exposes to extensions.
2. A generated Firefox Enterprise `policies.json` for startup-level controls that WebExtensions cannot own.

## Source status

Version 0.1.0 is the **accepted Stable release for Mozilla unlisted/self-distribution**, subject to final post-promotion lifecycle readback. Exact source revision `7726d8ee91ae72dc81b4c407a6c1572c9bdc790c` passed real-Firefox qualification in run `37166231119`; deterministic unsigned SHA-256 is `52333b66989c61da92342f7f386c2a2f0a6718585cab96c7037f04d1760d93ba`. Governed signing/restart run `37167368897` recovered the approved Mozilla-signed XPI, verified signed payload parity, persistent installation, a full Firefox 156.0 restart without reinstalling, post-restart Strict-profile behavior, and Restore release of all extension-owned settings. Signed SHA-256 is `d123228b15a58762895540342d063e012195eedd2d65bf1a937e8b634604f0ae`.

## Current capabilities

- Live scan of supported Firefox privacy/browser settings and their `levelOfControl` state.
- Balanced, Strict, and Maximum hardening profiles.
- Conflict-safe application: settings locked by policy or controlled by another extension are reported rather than overwritten.
- Reversible extension ownership using Firefox `BrowserSetting.clear()`.
- Total Cookie Protection-compatible third-party cookie partitioning through `privacy.websites.cookieConfig`.
- Tracking protection, hyperlink-auditing, speculative-network, anti-fingerprinting, web-notification, WebRTC, and password-saving controls where the selected profile applies them.
- Native `policies.json` generation for telemetry/studies controls, network prediction, HTTPS-Only Mode, cookies, tracking protection, notification prompts, anti-fingerprinting, and Maximum-mode WebRTC/password-saving preferences.
- No host permissions, content scripts, page inspection, browsing-history collection, remote configuration, or telemetry.
- Automated real-Firefox qualification of all three profiles, policy generation, popup privacy copy, and reversible restore against the deterministic unsigned XPI.
- Mozilla-signed unlisted XPI parity verification plus persistent-install, full-process restart, post-restart Strict-profile, and Restore acceptance.

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
