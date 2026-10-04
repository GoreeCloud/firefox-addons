# Repository Notes

## Browser Hardening — 2026-10-03

- `extensions/firefox-hardening/` introduces a standalone Firefox product for native browser-configuration hardening without maintaining a `user.js` file.
- The extension intentionally does not duplicate Privacy Shield's request/page filtering boundary.
- Version 0.1.1 is the accepted Stable release for Mozilla unlisted/self-distribution. It adds reviewed profile application, local per-setting opt-outs, opt-out-aware policy generation, first-use guidance, read-only policy audit/diff, compatibility diagnostics, platform deployment guides, and the remaining user-facing rename cleanup without adding permissions. Exact source `3927516c82970d1b6e59adf314949cb4e2a233d6` produced unsigned SHA-256 `4789363331792d596776ca2d3b2979369a142edafd959726992cf56b8a3a1052`; governed signing/restart run `37170617536` verified Mozilla-signed SHA-256 `12fc5e9481365c123bbc0487609907d6473f0e16ad1b761ecf732e4313f80632`, payload parity, persistent installation, full restart, post-restart Strict behavior, and ownership release. Version 0.1.0 remains rollback provenance.
- The implementation uses WebExtension BrowserSetting ownership semantics for reversible live controls and exports Firefox Enterprise `policies.json` for startup-level settings that extensions cannot control.
- No host permissions, content scripts, browsing-data collection, remote configuration, or telemetry are part of the source candidate.

## Maintenance

Keep this record for repository-specific working observations and known limitations that do not belong in authoritative requirements, specifications, or release evidence. Promote durable normative decisions to the appropriate canonical record.
