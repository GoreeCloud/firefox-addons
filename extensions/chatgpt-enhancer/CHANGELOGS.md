# GoreeCloud ChatGPT Enhancer — Changelog

## 0.1.1 — Source candidate — 2026-09-30

### Added

- Searchable prompt snippets in the command center and Settings page.
- Privacy-safe integration-health diagnostics and copyable diagnostic snapshot.
- Local settings/snippet JSON export.
- Local settings/snippet JSON import with a 1 MiB pre-parse limit, extension identity/schema validation, normalization, and explicit confirmation.
- Regression tests for settings normalization, portability identity, bounds, duplicate IDs, and draft exclusion.
- CI execution of the ChatGPT Enhancer local-core tests.

### Preserved boundaries

- Firefox permission set remains exactly `storage`.
- Content-script scope remains exactly `https://chatgpt.com/*`.
- Gecko data collection remains declared as none.
- Draft recovery remains disabled by default.
- No remote code, analytics, ChatGPT API integration, cookies, tokens, request interception, or extension-owned network requests.

### Lifecycle

0.1.1 remains a source candidate. No Stable, Mozilla-signed, persistent-install/restart, or current-site runtime acceptance is claimed by this source update.

## 0.1.0 — Source candidate — 2026-09-30

Initial first-party source candidate.

### Added

- ChatGPT-only Manifest V3 integration.
- Local keyboard command center.
- Conversation search and user-prompt outline.
- Previous/next prompt and top/bottom navigation.
- Last-response copy and conversation Markdown copy/download.
- Local prompt snippet library and insertion.
- Wide, compact, focus, code-wrap, text-scale, and content-width controls.
- Optional in-page launcher.
- Opt-in local prompt draft recovery with bounded retention and explicit restore/clear behavior.
- Toolbar popup and full Settings page.
- Accessibility-aware Reduced Motion and Forced Colors fallbacks.
- Gecko no-data-collection manifest declaration.
- Privacy, security, product, branding, user, testing, and lifecycle documentation.
- Extension-specific source validation and repository CI/package integration.

### Lifecycle

0.1.0 is not a Stable release. Mozilla signing, persistent installation, full-restart acceptance, current ChatGPT runtime acceptance, and remaining governed release gates are pending.
