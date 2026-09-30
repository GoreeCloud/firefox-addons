# GoreeCloud ChatGPT Enhancer — Privacy

## Current boundary

Version 0.1.1 is a local-first source candidate.

The extension does **not** intentionally transmit user data to GoreeCloud, OpenAI APIs, analytics providers, advertising systems, or any other extension-owned remote service. The Firefox manifest declares Gecko data collection as `required: ["none"]`.

## Page access

The content script runs only on `https://chatgpt.com/*`.

To provide its user-requested features, it may read:

- text from messages currently loaded in the ChatGPT page;
- the current prompt composer text;
- the current page title and URL;
- semantic role attributes needed to distinguish user and assistant messages.

This information is processed in the browser page context for navigation, search, copy, export, and prompt operations.

Conversation search and outline do not create a persistent conversation index. Conversation copy/export does not save a second extension-owned history database.

## Local extension storage

`browser.storage.local` stores only extension-owned settings and user-authored local productivity data:

- presentation settings;
- prompt snippets;
- draft-recovery records, only when draft recovery is enabled.

Prompt snippets can contain any text the user chooses to save and should therefore be treated as private user data. Version 0.1.1 can export presentation settings and snippets to an explicit local JSON backup. Drafts are intentionally excluded from that file.

### Draft recovery

Draft recovery is disabled by default.

When enabled, the extension stores current composer text locally, keyed by the ChatGPT conversation path. Draft records are bounded to the 20 most recently updated paths and 20,000 characters per draft. Restore is explicit; the extension does not automatically submit restored text.

Turning draft recovery off stops new draft capture. The Settings page provides a separate **Clear all saved drafts** action because disabling a feature should not silently destroy user data.

## Privacy-safe integration diagnostics

The integration-health view reports only extension version, site origin, loaded message/user/assistant counts, and whether expected semantic selectors/composer fallbacks are available. It does not include conversation text, prompt text, cookies, account identifiers, or the full conversation URL/path.

## Settings portability

Settings import/export is explicit and local. Exported JSON contains only normalized presentation settings and prompt snippets. Draft records are not exported. Imports are capped at 1 MiB before parsing and must match this extension's product identity, Gecko ID, and supported portability format before normalized settings can replace the current settings after confirmation.

## Export and clipboard

Copy and Markdown-download actions occur only after an explicit user command.

A Markdown export contains the conversation text currently loaded in the page and the current conversation URL. The resulting clipboard contents or downloaded file leave the extension's custody and are controlled by the user and operating system.

## Excluded data and authority

The extension does not request or intentionally read:

- ChatGPT/OpenAI cookies;
- authentication tokens;
- passwords;
- payment information;
- browser history;
- tabs outside the current ChatGPT page;
- private-browsing data;
- network request or response bodies;
- other websites.

Private browsing is explicitly disabled through `incognito: "not_allowed"`.

## Remote dependencies

There are no remote scripts, web fonts, analytics libraries, remote configuration services, or extension-owned network requests in version 0.1.1.

ChatGPT itself continues to communicate with OpenAI as part of the website's normal operation. That traffic is outside the extension's authority and is not proxied, duplicated, intercepted, or modified by this source candidate.

## Data removal

Users can:

- delete individual prompt snippets;
- restore the built-in settings/snippet defaults;
- clear all saved drafts from the Settings page;
- remove the extension to remove its Firefox extension storage according to Firefox behavior.

## Future changes

Any future feature that introduces remote synchronization, account integration, external APIs, broader site access, additional browser permissions, or new persistence of conversation content requires separate privacy review and cannot inherit this version's no-transmission claim.
