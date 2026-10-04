# GoreeCloud Firefox Hardening

GoreeCloud Firefox Hardening is a local-first Firefox hardening manager designed as a native alternative to maintaining a large `user.js` file by hand.

It is **not** a fork of arkenfox/user.js and does not copy or redistribute arkenfox preference lists. The design instead uses supported Firefox interfaces directly:

1. Firefox WebExtension `privacy` and `browserSettings` APIs for settings that Firefox exposes to extensions.
2. A generated Firefox Enterprise `policies.json` for startup-level controls that WebExtensions cannot own.

## Source status

Version 0.1.0 is a **source candidate**. It is not an accepted Stable, Mozilla-signed, or release-qualified build.

## Current capabilities

- Live scan of supported Firefox privacy/browser settings and their `levelOfControl` state.
- Balanced, Strict, and Maximum hardening profiles.
- Conflict-safe application: settings locked by policy or controlled by another extension are reported rather than overwritten.
- Reversible extension ownership using Firefox `BrowserSetting.clear()`.
- Total Cookie Protection-compatible third-party cookie partitioning through `privacy.websites.cookieConfig`.
- Tracking protection, hyperlink-auditing, speculative-network, anti-fingerprinting, web-notification, WebRTC, and password-saving controls where the selected profile applies them.
- Native `policies.json` generation for telemetry/studies controls, network prediction, HTTPS-Only Mode, cookies, tracking protection, notification prompts, anti-fingerprinting, and Maximum-mode WebRTC/password-saving preferences.
- No host permissions, content scripts, page inspection, browsing-history collection, remote configuration, or telemetry.

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

Run repository validation and build a deterministic unsigned candidate:

```bash
python shared/scripts/validate_repository.py
python shared/scripts/package_extension.py firefox-hardening
```

Packaging success does not establish Mozilla signing or Stable acceptance.

## Privacy and security

See [`PRIVACY.md`](PRIVACY.md), [`SECURITY.md`](SECURITY.md), and [`ARCHITECTURE.md`](ARCHITECTURE.md).
