# Architecture

## Product boundary

GoreeCloud Browser Hardening owns browser-configuration hardening. It does not duplicate GoreeCloud Privacy Shield's request filtering, URL cleaning, cosmetic filtering, or page-level privacy controls.

## Runtime layers

1. `src/hardening.js` — pure setting catalog, profile targets, control-ownership checks, change-plan generation, opt-out-aware scan/apply/restore behavior, scoring, deterministic Firefox Enterprise Policy generation, read-only policy parsing/diff, compatibility diagnostics, and deployment-guide generation.
2. `src/popup.js` — compact profile/score surface that opens dashboard review instead of mutating settings directly.
3. `src/dashboard.js` — full live-state table, non-mutating change preview, persistent local opt-outs, first-use guidance, conflict reporting, reversible restore, explicit policy export, session-local policy audit, compatibility diagnostics, and deployment-guide presentation.
4. `popup.html` / `dashboard.html` / `styles.css` — local Glaze-aligned presentation with Reduced Motion support and no remote assets.

There is no background worker, content script, host permission, or network interceptor.

## BrowserSetting ownership model

Before changing a WebExtension-exposed setting, the core reads `levelOfControl`. It writes only when Firefox reports `controllable_by_this_extension` or `controlled_by_this_extension`. Locked settings and settings controlled by another extension are reported without mutation.

Restore calls `clear()` only when Firefox reports `controlled_by_this_extension`. This returns control to the next authority/default instead of attempting to reconstruct an assumed prior value.

## Profile model

Profile targets are explicit per setting. `null` means the profile deliberately leaves that browser setting unchanged; it does not mean false.

Balanced targets only the lower-breakage baseline. Strict adds anti-fingerprinting and web-notification defaults. Maximum adds disruptive WebRTC/password-saving changes. Before application, the dashboard materializes a change plan from live Firefox state. User opt-outs are stored locally and suppress both WebExtension writes and matching generated policy controls.

## Enterprise Policy boundary

WebExtensions do not expose every Firefox preference. The core therefore generates an independent native `policies.json` document for a user or administrator to review and deploy. The extension does not write to Firefox installation directories or attempt privilege escalation.

The generated policy uses named Firefox Enterprise Policy keys where available and uses the `Preferences` policy only for settings without a dedicated policy in the selected profile. Saved opt-outs remove the corresponding policy entry where an equivalent control exists. Policy export is a configuration artifact, not evidence that the policy has been installed or accepted by a target Firefox runtime.

Existing-policy audit is a separate read-only path. A selected or pasted JSON document is parsed in page memory and diffed against the selected generated profile. Imported policy text is not persisted or applied. Deployment guides are generated text only.

## Release boundary

Version 0.1.1 is the accepted Stable release for Mozilla unlisted/self-distribution after exact-source qualification, Mozilla signing, signed-payload parity verification, persistent installation, full Firefox restart, post-restart Strict acceptance, and ownership release in governed run `37170617536`. Version 0.1.0 remains the previous Stable rollback. Future source changes must independently repeat the applicable release gates before replacing Stable 0.1.1.
