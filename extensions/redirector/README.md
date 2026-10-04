# GoreeCloud Redirector

GoreeCloud Redirector is the first-party Firefox extension for privacy-preserving URL redirection into approved GoreeCloud services.

This directory is the canonical development and maintenance location. The historical standalone repository `GoreeCloud/goreecloud-redirector` remains a legacy source and release-history reference; active Firefox development belongs here.

## Current source state

- Source version: `0.2.2`
- Source state: `canonical-source`
- Accepted Stable version: `0.2.0`
- Firefox add-on ID: `redirector@goreecloud.com`
- Canonical repository: `GoreeCloud/firefox-addons`

## Current capability

- Manifest V3 Firefox extension.
- Built-in Google Keep → GoreeCloud Memos redirect.
- User-controlled enable/disable state.
- Custom redirect rules stored locally in Firefox.
- Per-source optional host-permission requests.
- Redirect-loop prevention and duplicate-source validation.
- Dynamic-rule reconciliation after permission changes.
- Local URL preview that explains which enabled built-in or custom redirect would match without navigating.
- Versioned local JSON export/import for redirect definitions; imported rules that lack an already-granted source permission are restored paused until the user explicitly enables them and Firefox can request that origin.
- No analytics, injected page scripts, remote code, or external runtime service.
- Glaze UI 1.3 interface foundation.

## Privacy boundary

Redirect decisions are evaluated through Firefox Declarative Net Request. Custom rule definitions remain in local extension storage. The extension asks for a source site's host permission only when the user creates or enables a rule requiring that site.

## Release state

Version `0.2.2` is the current canonical source candidate with local rule preview and validated portability. Accepted Stable remains `0.2.0`; source validation and unsigned packaging do not promote 0.2.2 to Stable.
