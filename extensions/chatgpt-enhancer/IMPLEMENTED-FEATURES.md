# GoreeCloud ChatGPT Enhancer — Implemented Features

## 0.1.1 source candidate

Added on top of the 0.1.0 foundation:

- Searchable prompt snippets in the in-page command center.
- Searchable prompt snippets in Settings.
- Privacy-safe integration-health diagnostics with counts and selector availability only.
- Copyable privacy-safe diagnostic snapshot.
- Local JSON export of normalized presentation settings and prompt snippets.
- Local JSON import with 1 MiB pre-parse cap, exact product/Gecko-ID/format validation, normalization, and explicit replacement confirmation.
- Draft exclusion from settings portability.
- Duplicate imported snippet-ID normalization without dropping valid snippet content.
- Node regression tests for normalization and portability boundaries.
- CI execution of the ChatGPT Enhancer regression suite.

## 0.1.0 source candidate

Implemented in source:

- ChatGPT-only Manifest V3 content script.
- Toolbar popup with quick presentation/privacy controls.
- Full Settings page.
- Keyboard command center.
- Alt+Shift+G command-center shortcut.
- Alt+Shift+P prompt-focus shortcut.
- Conversation text search.
- User-prompt outline.
- Previous/next user-prompt navigation.
- Top/bottom navigation.
- Copy last assistant response.
- Copy loaded conversation as Markdown.
- Download loaded conversation as Markdown.
- Local prompt snippet library.
- Prompt snippet insertion.
- Wide conversation mode.
- Compact spacing.
- Focus mode.
- Code wrapping.
- Configurable content width.
- Configurable conversation text scale.
- Optional floating launcher.
- Opt-in bounded local draft recovery.
- Explicit draft restore.
- Clear-all-drafts control.
- Reduced Motion behavior.
- Forced Colors fallback.
- No-data-collection Gecko declaration.
- Local-first privacy and security documentation.
- Deterministic shared packaging compatibility.
- Extension-specific static validation.

Implementation status does not imply Mozilla signing or Stable acceptance.
