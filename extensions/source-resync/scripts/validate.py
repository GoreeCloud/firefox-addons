#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parents[1]

manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
inventory = json.loads((REPO_ROOT / "docs/extension-inventory.json").read_text(encoding="utf-8"))
entry = next(item for item in inventory["extensions"] if item["slug"] == "source-resync")

assert manifest["manifest_version"] == 3
assert manifest["name"] == "GoreeCloud Source Resync"
assert manifest["version"] == "1.1.3"
assert manifest["permissions"] == ["storage", "tabs"]
assert manifest["host_permissions"] == ["https://chatgpt.com/*"]
assert manifest["content_scripts"][0]["matches"] == ["https://chatgpt.com/*"]
assert manifest["browser_specific_settings"]["gecko"]["id"] == "source-resync@goreecloud.com"
assert "alarms" not in manifest["permissions"]
assert entry["source_version"] == "1.1.3"
assert entry["source_state"] == "canonical-source"
assert entry["accepted_stable_version"] is None

for relative in ("README.md", "PRIVACY.md", "SECURITY.md", "background.js", "content.js", "content.css", "popup.html", "popup.js", "popup.css", "icons/icon.svg"):
    assert (ROOT / relative).is_file(), relative

background = (ROOT / "background.js").read_text(encoding="utf-8")
content = (ROOT / "content.js").read_text(encoding="utf-8")
popup_html = (ROOT / "popup.html").read_text(encoding="utf-8")
popup_js = (ROOT / "popup.js").read_text(encoding="utf-8")
readme = (ROOT / "README.md").read_text(encoding="utf-8")

assert "browser.alarms" not in background
for marker in ("GOREECLOUD_RUN_NOW", "GOREECLOUD_RETRY_FAILED", "GOREECLOUD_GET_STATUS", "runHistory", ".slice(0, 10)", "validSourcesUrl"):
    assert marker in background, marker
assert 'sendResync(tab.id, sources, "retry")' in background
assert 'sources: Array.isArray(sources) ? sources : null' in background
assert 'Array.isArray(requestedSources) ? null : current[index]' in content
assert "return resyncAll(message.sources)" in content
assert 'id="retryFailed"' in popup_html and 'id="runHistory"' in popup_html
assert 'runMessage("GOREECLOUD_RETRY_FAILED")' in popup_js
assert "setInterval(refreshRuntimeStatus, 400)" in popup_js
assert "1.1.3" in readme and "manual-only" in readme
privacy = (ROOT / "PRIVACY.md").read_text(encoding="utf-8").lower()
security = (ROOT / "SECURITY.md").read_text(encoding="utf-8").lower()
for marker in ("up to ten runs", "source display names", "not transmitted", "manual-only"):
    assert marker in privacy, marker
for marker in ("fail-closed", "exact displayed name", "does not substitute another card"):
    assert marker in security, marker

print("Source Resync 1.1.3 manual-only retry/history source contract validated.")
