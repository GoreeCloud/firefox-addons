# Repository Notes

## Browser Hardening — 2026-10-03

- `extensions/firefox-hardening/` introduces a standalone Firefox product for native browser-configuration hardening without maintaining a `user.js` file.
- The extension intentionally does not duplicate Privacy Shield's request/page filtering boundary.
- Version 0.1.0 remains a source candidate. The pre-rename candidate passed automated real-Firefox unsigned qualification on source `05c73782d9edb072fda3f6872406cb6809099011` in run `37165320162` with SHA-256 `82043d51fafed43635b480f7530a5f5c2ea3ef7bd16a7f79fa2eb62ca63a1151`. AMO signing run `37165746695` rejected the former display name because it contained the Firefox trademark; no signed XPI was created. The user-facing name is now GoreeCloud Browser Hardening, automatic signing is paused, and fresh exact-source qualification/digest binding is required before the signed restart gate can resume.
- The implementation uses WebExtension BrowserSetting ownership semantics for reversible live controls and exports Firefox Enterprise `policies.json` for startup-level settings that extensions cannot control.
- No host permissions, content scripts, browsing-data collection, remote configuration, or telemetry are part of the source candidate.

## Maintenance

Keep this record for repository-specific working observations and known limitations that do not belong in authoritative requirements, specifications, or release evidence. Promote durable normative decisions to the appropriate canonical record.
