# GoreeCloud ChatGPT Enhancer — Testing

## Automated source validation

From repository root:

```bash
python extensions/chatgpt-enhancer/scripts/validate.py
node --test extensions/chatgpt-enhancer/tests/*.test.mjs
python shared/scripts/validate_repository.py
python shared/scripts/package_extension.py chatgpt-enhancer
python -m py_compile extensions/chatgpt-enhancer/tests/firefox_runtime_smoke.py
```

Repository CI also runs `node --check` against maintained JavaScript and verifies generated XPI archives. The dedicated `ChatGPT Enhancer Firefox Runtime` workflow installs the deterministic unsigned XPI temporarily in a clean headless Firefox profile and exercises a controlled local HTTPS fixture mapped to `chatgpt.com`.

## Required 0.1.2 source checks

The extension-specific validator fails if:

- the manifest is not V3;
- product identity/version/add-on ID changes unexpectedly;
- the explicit permission set is broader than `storage`;
- required or optional host-permission keys are introduced;
- the content-script scope is not exactly `https://chatgpt.com/*`;
- the no-data-collection declaration is missing;
- private browsing becomes allowed;
- required product/privacy/security files disappear;
- JavaScript adds remote requests, cookie/webRequest access, dynamic evaluation, or remote script construction;
- draft recovery stops defaulting to off;
- local retention bounds disappear;
- required commands/features disappear from source;
- privacy-safe diagnostics stop omitting conversation/prompt content or expected selector-health markers disappear;
- settings portability loses its product/Gecko-ID/format validation or 1 MiB pre-parse cap;
- the local regression suite disappears;
- onboarding background behavior stops being install-only/non-temporary or gains broader tab/browser authority;
- welcome UI loses Reduced Motion / Forced Colors fallbacks;
- command-list Arrow/Home/End/activation keyboard behavior disappears;
- the command center loses its bounded scroll region or permits command content to overlap the footer;
- the Settings page loses its responsive wide-desktop layout or leaks internal design-system implementation labels into user-facing text;
- Reduced Motion or Forced Colors fallbacks disappear;
- controlled extension pages stop declaring the Glaze UI V1.6 target.

## Automated controlled real-Firefox smoke

The runtime workflow must verify exact add-on identity/version/icon, real content-script injection under the manifest's `https://chatgpt.com/*` match, launcher/dialog semantics, command-list keyboard traversal with the focused final command fully visible above a non-overlapping footer, privacy-safe integration diagnostics, snippet insertion without submission, reversible compact/focus presentation toggles, and both keyboard shortcuts. Evidence must contain only candidate/runtime metadata, controlled counts, and pass-group names—not fixture conversation text, prompt text, full URLs, profile paths, cookies, credentials, or account data.

The workflow rewrites `chatgpt.com` to localhost for the job and uses a self-signed controlled fixture accepted only by the test profile. It must not contact the live ChatGPT service. This gate is unsigned runtime evidence and does not prove live-site compatibility.

## Manual/current-site Firefox checks before release promotion

Using a clean supported Firefox profile and the exact candidate package:

- temporary installation succeeds for development evaluation;
- ChatGPT loads normally with the extension enabled;
- toolbar popup opens and all toggles persist;
- Alt+Shift+G opens/closes the command center;
- Alt+Shift+P focuses the composer;
- search finds loaded user and assistant messages without creating stored history;
- outline and prompt navigation scroll to correct messages;
- last-response copy contains only the selected response text;
- Markdown copy and download preserve expected loaded-message order;
- snippet insertion changes the composer but never submits;
- draft recovery remains inactive by default;
- integration diagnostics contain no conversation text, prompt text, account identifiers, or full conversation path;
- settings export contains normalized settings/snippets and no drafts;
- malformed, oversized, wrong-product, wrong-Gecko-ID, and unsupported-format settings imports fail closed;
- enabled draft recovery saves/restores locally and clear-all removes records;
- focus/wide/compact/code-wrap modes are reversible;
- text scale and content width remain readable at supported extremes;
- keyboard-only operation is possible;
- the command center remains fully operable at constrained heights with no final-row clipping or footer overlap;
- Settings uses available desktop width without forcing a narrow single-column layout, while remaining single-column and readable on constrained widths;
- Reduced Motion avoids smooth/transition-heavy movement;
- Forced Colors keeps controls and focus boundaries visible;
- disabling/removing the extension leaves ChatGPT usable.

## Stable release gates

Automated and temporary runtime checks are not enough for Stable. The governed release still requires applicable privacy/security review, current Glaze consumer acceptance, Mozilla signing, signed-payload verification, persistent installation, a full Firefox restart, and post-restart acceptance.
