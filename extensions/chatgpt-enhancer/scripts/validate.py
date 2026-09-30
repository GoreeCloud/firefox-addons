#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parents[1]


def fail(message: str) -> None:
    raise SystemExit(f"ERROR: {message}")


def main() -> None:
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))

    if manifest.get("manifest_version") != 3:
        fail("Manifest V3 is required")
    if manifest.get("name") != "GoreeCloud ChatGPT Enhancer":
        fail("unexpected product name")
    if manifest.get("version") != "0.1.1":
        fail("source version must remain synchronized with canonical inventory")
    if manifest.get("incognito") != "not_allowed":
        fail("private browsing must remain outside the operating boundary")

    gecko = manifest.get("browser_specific_settings", {}).get("gecko", {})
    if gecko.get("id") != "chatgpt-enhancer@goreecloud.com":
        fail("unexpected Firefox add-on ID")
    if gecko.get("strict_min_version") != "139.0":
        fail("unexpected minimum Firefox version")
    if gecko.get("data_collection_permissions", {}).get("required") != ["none"]:
        fail("AMO data collection declaration must remain required: [none]")

    if set(manifest.get("permissions", [])) != {"storage"}:
        fail(f"unexpected permission set: {manifest.get('permissions', [])}")
    if manifest.get("host_permissions"):
        fail("ChatGPT Enhancer must not declare required host_permissions")
    if manifest.get("optional_host_permissions"):
        fail("ChatGPT Enhancer must not declare optional_host_permissions")

    content_scripts = manifest.get("content_scripts", [])
    if len(content_scripts) != 1:
        fail("exactly one bounded content-script registration is required")
    registration = content_scripts[0]
    if registration.get("matches") != ["https://chatgpt.com/*"]:
        fail("content-script scope must remain exactly https://chatgpt.com/*")
    if registration.get("js") != ["shared/settings.js", "src/content.js"]:
        fail("unexpected content-script JavaScript registration")
    if registration.get("css") != ["src/content.css"]:
        fail("unexpected content-script stylesheet registration")

    required_files = [
        "README.md",
        "SPECIFICATIONS.md",
        "FEATURES.md",
        "BENEFITS.md",
        "COMPETITIVE-OBJECTIVES.md",
        "BRANDING.md",
        "IMPLEMENTED-FEATURES.md",
        "PLANNED-FEATURES.md",
        "CHANGELOGS.md",
        "USER-MANUAL.md",
        "PRIVACY.md",
        "SECURITY.md",
        "TESTING.md",
        "assets/icon.svg",
        "shared/settings.js",
        "src/content.js",
        "src/content.css",
        "popup/popup.html",
        "popup/popup.js",
        "popup/popup.css",
        "options/options.html",
        "options/options.js",
        "options/options.css",
        "scripts/validate.py",
        "tests/settings.test.mjs",
        "tests/firefox_runtime_smoke.py",
    ]
    missing = [path for path in required_files if not (ROOT / path).is_file()]
    if missing:
        fail(f"missing required source files: {', '.join(missing)}")

    settings_js = (ROOT / "shared/settings.js").read_text(encoding="utf-8")
    content_js = (ROOT / "src/content.js").read_text(encoding="utf-8")
    popup_js = (ROOT / "popup/popup.js").read_text(encoding="utf-8")
    options_js = (ROOT / "options/options.js").read_text(encoding="utf-8")
    runtime_js = "\n".join([settings_js, content_js, popup_js, options_js])

    forbidden_runtime_markers = [
        "fetch(",
        "XMLHttpRequest",
        "browser.cookies",
        "browser.webRequest",
        "browser.history",
        "browser.downloads",
        "browser.tabs",
        "eval(",
        "new Function(",
        "import(",
        "http://",
        "https://api.",
    ]
    for marker in forbidden_runtime_markers:
        if marker in runtime_js:
            fail(f"forbidden runtime authority or remote-code marker: {marker}")

    required_content_markers = [
        'data-message-author-role',
        '#prompt-textarea',
        'Alt+Shift+G',
        'conversationMarkdown',
        'showConversationSearch',
        'showOutline',
        'showSnippets',
        'showDiagnostics',
        'integrationSnapshot',
        'restore-draft',
        'previous-user',
        'next-user',
    ]
    for marker in required_content_markers:
        if marker not in content_js:
            fail(f"missing core content capability marker: {marker}")

    if "draftRecovery: false" not in settings_js:
        fail("draft recovery must remain off by default")
    for marker in ("MAX_DRAFTS = 20", "MAX_DRAFT_LENGTH = 20000", "MAX_SNIPPETS = 50"):
        if marker not in settings_js:
            fail(f"local storage bound missing: {marker}")

    for marker in (
        "buildSettingsExport",
        "parseSettingsImport",
        "PORTABILITY_FORMAT_VERSION = 1",
        'GECKO_ID = "chatgpt-enhancer@goreecloud.com"',
    ):
        if marker not in settings_js:
            fail(f"settings portability contract missing: {marker}")

    if "MAX_IMPORT_BYTES = 1024 * 1024" not in options_js:
        fail("settings import must retain the 1 MiB pre-parse limit")
    for marker in ("export-settings", "import-settings", "import-file", "snippet-filter"):
        options_html = (ROOT / "options/options.html").read_text(encoding="utf-8")
        if marker not in options_html:
            fail(f"settings UI capability missing: {marker}")

    for relative in ("popup/popup.html", "options/options.html"):
        html = (ROOT / relative).read_text(encoding="utf-8")
        if 'data-glaze-version="1.6"' not in html:
            fail(f"{relative} must declare the Glaze UI V1.6 target")
        if "../shared/settings.js" not in html:
            fail(f"{relative} must use the shared local settings contract")
        if "../assets/icon.svg" not in html:
            fail(f"{relative} must use first-party product artwork")

    for relative in ("src/content.css", "popup/popup.css", "options/options.css"):
        css = (ROOT / relative).read_text(encoding="utf-8")
        if "forced-colors: active" not in css:
            fail(f"{relative} must retain Forced Colors fallback")
        if "prefers-reduced-motion: reduce" not in css:
            fail(f"{relative} must retain Reduced Motion fallback")


    runtime_smoke = (ROOT / "tests/firefox_runtime_smoke.py").read_text(encoding="utf-8")
    for marker in (
        "driver.install_addon",
        "temporary=True",
        "controlledLocalFixtureOnly",
        "liveChatGPTContacted",
        "manifestChatGPTMatchExercised",
        "FIXTURE_USER_SECRET",
        "FIXTURE_ASSISTANT_SECRET",
        "FIXTURE_PROMPT_SECRET",
    ):
        if marker not in runtime_smoke:
            fail(f"real-Firefox runtime contract missing: {marker}")

    runtime_workflow = REPO_ROOT / ".github/workflows/chatgpt-enhancer-firefox-runtime.yml"
    if not runtime_workflow.is_file():
        fail("ChatGPT Enhancer real-Firefox runtime workflow is missing")
    runtime_workflow_text = runtime_workflow.read_text(encoding="utf-8")
    for marker in (
        "browser-actions/setup-firefox@v1",
        "browser-actions/setup-geckodriver@latest",
        "python extensions/chatgpt-enhancer/tests/firefox_runtime_smoke.py",
        "127.0.0.1 chatgpt.com",
        "dist/chatgpt-enhancer-firefox-runtime.json",
    ):
        if marker not in runtime_workflow_text:
            fail(f"real-Firefox runtime workflow contract missing: {marker}")

    privacy = (ROOT / "PRIVACY.md").read_text(encoding="utf-8").lower()
    security = (ROOT / "SECURITY.md").read_text(encoding="utf-8").lower()
    for marker in ("draft recovery is disabled by default", "no remote scripts", "data collection"):
        if marker not in privacy:
            fail(f"privacy record missing required boundary: {marker}")
    for marker in ("no remote code", "no automatic prompt submission", "security exceptions"):
        if marker not in security:
            fail(f"security record missing required boundary: {marker}")

    print(
        "Validated GoreeCloud ChatGPT Enhancer 0.1.1 source candidate: "
        "ChatGPT-only scope, storage-only permission, no-data-collection declaration, "
        "local-first runtime, bounded draft recovery, privacy-safe diagnostics, bounded settings portability, accessibility fallbacks, and required documentation."
    )


if __name__ == "__main__":
    main()
