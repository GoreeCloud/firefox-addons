# Architecture

## Product boundary

GoreeCloud Browser Hardening owns browser-configuration hardening. It does not duplicate GoreeCloud Privacy Shield's request filtering, URL cleaning, cosmetic filtering, or page-level privacy controls.

## Runtime layers

1. `src/hardening.js` — pure setting catalog, profile targets, control-ownership checks, scan/apply/restore behavior, scoring, and deterministic Firefox Enterprise Policy generation.
2. `src/popup.js` — compact profile/score surface using the shared core.
3. `src/dashboard.js` — full live-state table, conflict reporting, reversible restore, and explicit policy export.
4. `popup.html` / `dashboard.html` / `styles.css` — local Glaze-aligned presentation with Reduced Motion support and no remote assets.

There is no background worker, content script, host permission, or network interceptor.

## BrowserSetting ownership model

Before changing a WebExtension-exposed setting, the core reads `levelOfControl`. It writes only when Firefox reports `controllable_by_this_extension` or `controlled_by_this_extension`. Locked settings and settings controlled by another extension are reported without mutation.

Restore calls `clear()` only when Firefox reports `controlled_by_this_extension`. This returns control to the next authority/default instead of attempting to reconstruct an assumed prior value.

## Profile model

Profile targets are explicit per setting. `null` means the profile deliberately leaves that browser setting unchanged; it does not mean false.

Balanced targets only the lower-breakage baseline. Strict adds anti-fingerprinting and web-notification defaults. Maximum adds disruptive WebRTC/password-saving changes.

## Enterprise Policy boundary

WebExtensions do not expose every Firefox preference. The core therefore generates an independent native `policies.json` document for a user or administrator to review and deploy. The extension does not write to Firefox installation directories or attempt privilege escalation.

The generated policy uses named Firefox Enterprise Policy keys where available and uses the `Preferences` policy only for settings without a dedicated policy in the selected profile. Policy export is a configuration artifact, not evidence that the policy has been installed or accepted by a target Firefox runtime.

## Release boundary

Version 0.1.0 is a source candidate. Repository validation, JavaScript tests, and deterministic XPI packaging are necessary source checks but do not establish Mozilla signing, persistent-install acceptance, restart acceptance, target-environment acceptance, or Stable promotion.
