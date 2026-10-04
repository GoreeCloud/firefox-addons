# Repository Notes

## Browser Hardening — 2026-10-03

- `extensions/firefox-hardening/` introduces a standalone Firefox product for native browser-configuration hardening without maintaining a `user.js` file.
- The extension intentionally does not duplicate Privacy Shield's request/page filtering boundary.
- Version 0.1.0 remains a source candidate. Fresh post-rename qualification passed in run `37166231119` for exact source `7726d8ee91ae72dc81b4c407a6c1572c9bdc790c` with deterministic unsigned SHA-256 `52333b66989c61da92342f7f386c2a2f0a6718585cab96c7037f04d1760d93ba`. Governed signing/restart run `37167368897` recovered the approved unlisted Mozilla-signed XPI, verified signed payload parity, persistent installation, a full Firefox 156.0 restart without reinstalling, post-restart Strict-profile behavior, and Restore release of all extension-owned settings. Signed SHA-256 is `d123228b15a58762895540342d063e012195eedd2d65bf1a937e8b634604f0ae`. Final Stable promotion remains open.
- The implementation uses WebExtension BrowserSetting ownership semantics for reversible live controls and exports Firefox Enterprise `policies.json` for startup-level settings that extensions cannot control.
- No host permissions, content scripts, browsing-data collection, remote configuration, or telemetry are part of the source candidate.

## Maintenance

Keep this record for repository-specific working observations and known limitations that do not belong in authoritative requirements, specifications, or release evidence. Promote durable normative decisions to the appropriate canonical record.
