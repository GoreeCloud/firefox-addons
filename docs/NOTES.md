# Repository Notes

## Browser Hardening — 2026-10-03

- `extensions/firefox-hardening/` introduces a standalone Firefox product for native browser-configuration hardening without maintaining a `user.js` file.
- The extension intentionally does not duplicate Privacy Shield's request/page filtering boundary.
- Version 0.1.0 remains a source candidate. AMO signing run `37165746695` rejected the former display name because it contained the Firefox trademark; no signed XPI was created. The user-facing name is now GoreeCloud Browser Hardening. Fresh post-rename qualification passed in run `37166231119` for exact source `7726d8ee91ae72dc81b4c407a6c1572c9bdc790c` with deterministic candidate SHA-256 `52333b66989c61da92342f7f386c2a2f0a6718585cab96c7037f04d1760d93ba`; the signing workflow is rebound to this exact candidate, while signed persistent-install/full-restart acceptance and final Stable promotion remain open.
- The implementation uses WebExtension BrowserSetting ownership semantics for reversible live controls and exports Firefox Enterprise `policies.json` for startup-level settings that extensions cannot control.
- No host permissions, content scripts, browsing-data collection, remote configuration, or telemetry are part of the source candidate.

## Maintenance

Keep this record for repository-specific working observations and known limitations that do not belong in authoritative requirements, specifications, or release evidence. Promote durable normative decisions to the appropriate canonical record.
