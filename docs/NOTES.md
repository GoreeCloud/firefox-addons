# Repository Notes

## Browser Hardening — 2026-10-03

- `extensions/firefox-hardening/` introduces a standalone Firefox product for native browser-configuration hardening without maintaining a `user.js` file.
- The extension intentionally does not duplicate Privacy Shield's request/page filtering boundary.
- Version 0.1.1 is the current source candidate. It adds reviewed profile application, local per-setting opt-outs, opt-out-aware policy generation, first-use guidance, and completes the remaining user-facing rename cleanup without adding permissions. Version 0.1.0 is the accepted Stable rollback: governed run `37167368897` accepted exact source `7726d8ee91ae72dc81b4c407a6c1572c9bdc790c`, unsigned SHA-256 `52333b66989c61da92342f7f386c2a2f0a6718585cab96c7037f04d1760d93ba`, Mozilla-signed SHA-256 `d123228b15a58762895540342d063e012195eedd2d65bf1a937e8b634604f0ae`, persistent installation, full restart, and ownership release; PR #178 promoted that exact payload to Stable. Final governed lifecycle readback run `37167984845` re-verified the same signed payload and recorded `stablePromoted: true`. Automatic signing is paused until the exact 0.1.1 source and digest are separately qualified and bound.
- The implementation uses WebExtension BrowserSetting ownership semantics for reversible live controls and exports Firefox Enterprise `policies.json` for startup-level settings that extensions cannot control.
- No host permissions, content scripts, browsing-data collection, remote configuration, or telemetry are part of the source candidate.

## Maintenance

Keep this record for repository-specific working observations and known limitations that do not belong in authoritative requirements, specifications, or release evidence. Promote durable normative decisions to the appropriate canonical record.
