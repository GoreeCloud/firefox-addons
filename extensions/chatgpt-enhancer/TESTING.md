# GoreeCloud ChatGPT Enhancer — Testing

## Automated source validation

From repository root:

```bash
python extensions/chatgpt-enhancer/scripts/validate.py
python shared/scripts/validate_repository.py
python shared/scripts/package_extension.py chatgpt-enhancer
```

Repository CI also runs `node --check` against maintained JavaScript and verifies generated XPI archives.

## Required 0.1.0 source checks

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
- Reduced Motion or Forced Colors fallbacks disappear;
- controlled extension pages stop declaring the Glaze UI V1.6 target.

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
- enabled draft recovery saves/restores locally and clear-all removes records;
- focus/wide/compact/code-wrap modes are reversible;
- text scale and content width remain readable at supported extremes;
- keyboard-only operation is possible;
- Reduced Motion avoids smooth/transition-heavy movement;
- Forced Colors keeps controls and focus boundaries visible;
- disabling/removing the extension leaves ChatGPT usable.

## Stable release gates

Automated and temporary runtime checks are not enough for Stable. The governed release still requires applicable privacy/security review, current Glaze consumer acceptance, Mozilla signing, signed-payload verification, persistent installation, a full Firefox restart, and post-restart acceptance.
