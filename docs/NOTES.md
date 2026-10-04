# Repository Notes

## Firefox Hardening — 2026-10-03

- `extensions/firefox-hardening/` introduces a standalone Firefox product for native browser-configuration hardening without maintaining a `user.js` file.
- The extension intentionally does not duplicate Privacy Shield's request/page filtering boundary.
- Version 0.1.0 is a source candidate only. Stable status requires independent Mozilla signing and governed runtime/restart/target acceptance.
- The implementation uses WebExtension BrowserSetting ownership semantics for reversible live controls and exports Firefox Enterprise `policies.json` for startup-level settings that extensions cannot control.
- No host permissions, content scripts, browsing-data collection, remote configuration, or telemetry are part of the source candidate.

## Maintenance

Keep this record for repository-specific working observations and known limitations that do not belong in authoritative requirements, specifications, or release evidence. Promote durable normative decisions to the appropriate canonical record.
