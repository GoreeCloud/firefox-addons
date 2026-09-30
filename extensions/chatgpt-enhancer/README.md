# GoreeCloud ChatGPT Enhancer

GoreeCloud ChatGPT Enhancer is a local-first Firefox extension that improves the ChatGPT web experience with faster navigation, local conversation tools, reusable prompts, reading controls, and accessibility-aware workspace options.

**Current source version:** 0.1.0  
**Current lifecycle:** Source candidate  
**Firefox add-on ID:** `chatgpt-enhancer@goreecloud.com`  
**Supported web origin:** `https://chatgpt.com/*`

This source candidate is not a Mozilla-signed or Stable release.

## Role

The extension augments the existing ChatGPT web interface without replacing ChatGPT, proxying ChatGPT traffic, or using OpenAI account/API credentials. ChatGPT remains authoritative for conversations, account state, model behavior, and service functionality.

The extension operates entirely in Firefox on the ChatGPT page and in its own local extension pages.

## Implemented capabilities

- **Command center** — press **Alt+Shift+G** or use the floating launcher.
- **Prompt focus** — press **Alt+Shift+P** to return to the composer.
- **Conversation search** — search text in messages currently loaded in the page.
- **Conversation outline** — list user prompts and jump directly to them.
- **Response copy** — copy the last loaded assistant response.
- **Markdown export** — copy or download the currently loaded conversation as Markdown.
- **Prompt snippets** — maintain a local reusable instruction library and insert a snippet into the composer.
- **Opt-in draft recovery** — save prompt drafts locally by conversation path and restore them explicitly.
- **Focus mode** — temporarily hide side navigation.
- **Wide mode** — expand the readable conversation width.
- **Compact mode** — reduce message spacing.
- **Code wrapping** — wrap long code blocks.
- **Reading scale** — adjust conversation text from 85–130%.
- **Keyboard navigation** — jump to previous/next user prompts, top, or bottom.
- **Accessible presentation** — visible focus, semantic controls, responsive layout, Reduced Motion behavior, and Forced Colors fallback.

## Privacy model

The extension has no analytics, telemetry, remote service, ChatGPT API integration, cookie access, token access, request interception, or remote code.

Conversation content used by search, outline, copy, and export is read from the currently loaded page only when needed and is not persisted by those features.

Prompt snippets are stored in `browser.storage.local`. Draft recovery is **off by default** because typed prompts may contain sensitive content. When the user enables it, drafts are stored locally in Firefox extension storage and are never transmitted by the extension.

See [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md).

## Permission boundary

The manifest requests only the Firefox `storage` permission.

The content script is restricted to:

```text
https://chatgpt.com/*
```

There is no `<all_urls>`, wildcard HTTP/HTTPS host access, `cookies`, `webRequest`, `tabs`, `history`, `downloads`, `clipboardWrite`, or native-messaging permission.

## Development loading

For temporary development testing:

1. Open `about:debugging#/runtime/this-firefox`.
2. Choose **Load Temporary Add-on…**.
3. Select `extensions/chatgpt-enhancer/manifest.json`.
4. Open or reload `https://chatgpt.com/`.
5. Press **Alt+Shift+G**.

Temporary loading is development evidence only. It is not a persistent signed release.

## Validation

From repository root:

```bash
python extensions/chatgpt-enhancer/scripts/validate.py
python shared/scripts/validate_repository.py
python shared/scripts/package_extension.py chatgpt-enhancer
```

The repository workflow additionally syntax-checks maintained JavaScript and verifies the deterministic XPI archive.

## Architecture

```text
manifest.json
├── shared/settings.js       local settings/snippet/draft storage contract
├── src/content.js           ChatGPT-page behavior and command center
├── src/content.css          page presentation and accessibility fallbacks
├── popup/                   toolbar quick controls
├── options/                 full settings and snippet management
├── assets/icon.svg          first-party product identity
└── scripts/validate.py      source/privacy/security contract validation
```

No background service worker/event page is required for the initial scope.

## Compatibility boundary

The extension relies on stable semantic web cues where practical, including `data-message-author-role` and `#prompt-textarea`, and includes broader accessible composer fallbacks. ChatGPT is an independently evolving web application, so runtime acceptance against the current site remains required before any Stable release claim.

## Glaze UI

The source candidate targets the current GLAZE UI V1.6 presentation principles: solid readable content surfaces, glazed transient command chrome where appropriate, semantic state, keyboard focus, accessibility precedence, responsive composition, Reduced Motion, and Forced Colors resilience.

This source-level target is not a claim of formal Glaze consumer acceptance.

## Release boundary

Version 0.1.0 remains a source candidate until applicable repository checks, current-site Firefox runtime testing, privacy/security review, Glaze UI consumer acceptance where required, Mozilla signing, persistent installation, full Firefox restart, and post-restart behavior are verified under the governed release workflow.
