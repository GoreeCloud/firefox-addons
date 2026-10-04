# Repository Notes

## Browser Hardening — 2026-10-03

- `extensions/firefox-hardening/` introduces a standalone Firefox product for native browser-configuration hardening without maintaining a `user.js` file.
- The extension intentionally does not duplicate Privacy Shield's request/page filtering boundary.
- Version 0.1.0 remains a source candidate. The earlier display-name candidate passed automated real-Firefox unsigned qualification in run `37165320162`, but Mozilla Add-ons rejected the name because it contained the Firefox trademark. The AMO-safe GoreeCloud Browser Hardening identity changes packaged bytes and requires fresh exact-candidate qualification before signing; persistent-install/full-restart acceptance and final Stable promotion remain open.
- The implementation uses WebExtension BrowserSetting ownership semantics for reversible live controls and exports Firefox Enterprise `policies.json` for startup-level settings that extensions cannot control.
- No host permissions, content scripts, browsing-data collection, remote configuration, or telemetry are part of the source candidate.

## Maintenance

Keep this record for repository-specific working observations and known limitations that do not belong in authoritative requirements, specifications, or release evidence. Promote durable normative decisions to the appropriate canonical record.
