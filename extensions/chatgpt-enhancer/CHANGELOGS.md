# GoreeCloud ChatGPT Enhancer — Changelog

## 0.1.2 — Source candidate — 2026-09-30

### Added

- First-install welcome guide covering privacy, core shortcuts, features, and Settings.
- Background install hook that opens onboarding only after a normal first install and skips updates/temporary installs.
- Settings link for reopening the welcome guide.
- Command-list keyboard traversal with ArrowUp/ArrowDown, Home/End, Enter, Space, and semantic selection state.
- Real-Firefox runtime coverage for command-list keyboard traversal.
- Command-center layout hardening that keeps the scrollable command region above a separate footer and prevents keyboard-focused commands from being clipped.
- Responsive desktop Settings layout that uses available Firefox viewport width, reduces unnecessary vertical scrolling, and keeps internal Glaze implementation terminology out of user-facing labels.

### Preserved boundaries

- Explicit Firefox permissions remain exactly `storage`.
- Content-script scope remains exactly `https://chatgpt.com/*`.
- Gecko data collection remains declared as none.
- The onboarding background uses only the unprivileged tab-creation path to open a packaged extension page.
- No analytics, remote code, ChatGPT API integration, cookies, tokens, or request interception.

### Lifecycle

0.1.2 remains a source candidate. Stable and signed/persistent restart acceptance are not implied.

## 0.1.1 — Source candidate — 2026-09-30

### Added

- Searchable prompt snippets in the command center and Settings page.
- Privacy-safe integration-health diagnostics and copyable diagnostic snapshot.
- Local settings/snippet JSON export.
- Local settings/snippet JSON import with a 1 MiB pre-parse limit, extension identity/schema validation, normalization, and explicit confirmation.
- Regression tests for settings normalization, portability identity, bounds, duplicate IDs, and draft exclusion.
- CI execution of the ChatGPT Enhancer local-core tests.
- Controlled real-Firefox runtime workflow that temporarily installs the exact deterministic candidate and exercises the real `chatgpt.com` manifest boundary against a localhost HTTPS fixture.

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
