# GoreeCloud ChatGPT Enhancer — Security

## Trust boundary

GoreeCloud ChatGPT Enhancer 0.1.1 is designed as a least-privilege content extension for `https://chatgpt.com/*`.

The manifest requests only `storage`. It does not request broad host access, cookies, webRequest, history, tabs, downloads, native messaging, management, scripting, or clipboard permissions.

The ChatGPT page is treated as an independently changing and potentially adversarial DOM surface. The extension does not treat page content as trusted authority.

## Security controls

- Manifest V3.
- Fixed Firefox add-on ID.
- Private browsing disabled.
- Content-script scope restricted to `https://chatgpt.com/*`.
- Gecko data-collection declaration is `required: ["none"]`.
- No remote code, dynamic script loading, `eval`, or `new Function`.
- No extension-owned network requests.
- No cookie/token/authentication access.
- No request interception or modification.
- No native messaging or filesystem helper.
- No automatic prompt submission.
- No automatic conversation deletion, account changes, or other destructive ChatGPT actions.
- All persistent records pass through bounded normalization in `shared/settings.js`.
- Settings imports are capped at 1 MiB before parsing and require exact portability format, product identity, and Gecko ID.
- Duplicate imported snippet IDs are normalized to unique local IDs without dropping valid snippet content.
- Integration diagnostics are content-minimized and omit conversation/prompt text and full conversation paths.
- Draft capture is opt-in and bounded.
- User-visible search/outline results are created with DOM text nodes rather than interpreting ChatGPT message text as HTML.
- Export filenames are normalized before use.
- Blob download URLs are revoked after use.
- Copy/export actions require an explicit command.
- Focus, width, compact, and code-wrap behavior is presentation-only.

## DOM compatibility boundary

The extension uses semantic selectors such as `data-message-author-role` and `#prompt-textarea`, with conservative accessible fallbacks for the composer.

If ChatGPT changes its DOM, a feature may become unavailable or visually degraded. The intended failure mode is loss of the enhancement rather than widening permissions or bypassing page security.

The extension must not add brittle workarounds that read authentication state, scrape unrelated page regions, inject remote code, or broaden host access merely to preserve a convenience feature.

## Clipboard and download boundary

Clipboard writes are attempted only from explicit user commands using the page's Clipboard API with a local fallback. No clipboard-read capability exists.

Markdown download uses an in-memory Blob and a temporary object URL. The extension does not request Firefox's `downloads` permission and does not choose arbitrary filesystem paths.

## Local storage boundary

Settings, prompt snippets, and opt-in drafts are extension-owned data. They are not executable input.

Snippets and draft text are assigned as text to the ChatGPT composer and are not evaluated as HTML or JavaScript by extension code.

## Content Security Policy

The extension packages all runtime code locally. It does not require a relaxed extension content-security policy.

## Release boundary

Passing static validation, syntax checks, deterministic packaging, or the controlled unsigned real-Firefox smoke is not sufficient for a Stable claim. The runtime smoke uses a localhost HTTPS fixture mapped to `chatgpt.com`, temporarily installs the exact candidate, records only privacy-minimized outcomes, and does not contact the live ChatGPT service.  Current-site Firefox runtime validation, accessibility checks, privacy/security review, applicable Glaze UI acceptance, Mozilla signing, persistent installation, browser restart, and post-restart verification remain separate release gates.

Security exceptions for 0.1.1: **none recorded**.
