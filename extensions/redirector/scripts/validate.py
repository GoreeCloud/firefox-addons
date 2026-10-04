#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parents[1]

manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
inventory = json.loads((REPO_ROOT / "docs/extension-inventory.json").read_text(encoding="utf-8"))
entry = next(item for item in inventory["extensions"] if item["slug"] == "redirector")

assert manifest["manifest_version"] == 3
assert manifest["name"] == "GoreeCloud Redirector"
assert manifest["version"] == "0.2.2"
assert manifest["homepage_url"] == "https://github.com/GoreeCloud/firefox-addons/tree/main/extensions/redirector"
assert manifest["permissions"] == ["declarativeNetRequest", "storage"]
assert manifest["host_permissions"] == ["https://keep.google.com/*"]
assert set(manifest["optional_host_permissions"]) == {"http://*/*", "https://*/*"}
assert manifest["browser_specific_settings"]["gecko"]["id"] == "redirector@goreecloud.com"
assert manifest["browser_specific_settings"]["gecko"]["data_collection_permissions"]["required"] == ["none"]
assert entry["source_version"] == "0.2.2"
assert entry["source_state"] == "canonical-source"
assert entry["accepted_stable_version"] == "0.2.0"

for relative in (
    "README.md", "PRIVACY.md", "SECURITY.md", "options.html", "options.js",
    "popup.html", "popup.js", "portability.js", "rules.json",
    "tests/portability.test.mjs", "icons/redirector.svg",
):
    assert (ROOT / relative).is_file(), relative

options_html = (ROOT / "options.html").read_text(encoding="utf-8")
options_js = (ROOT / "options.js").read_text(encoding="utf-8")
portability_js = (ROOT / "portability.js").read_text(encoding="utf-8")
readme = (ROOT / "README.md").read_text(encoding="utf-8")

for marker in ("test-rule", "export-rules", "import-rules", "import-file", "portability.js"):
    assert marker in options_html, marker
for marker in ("MAX_IMPORT_BYTES = 1024 * 1024", "permissions.contains", "releaseUnusedPermission", "Portability.preview", "Portability.parseImport"):
    assert marker in options_js, marker
for marker in ("FORMAT_VERSION = 1", "MAX_RULES = 200", "buildExport", "parseImport", "preview", "permissionOrigin"):
    assert marker in portability_js, marker
assert "fetch(" not in portability_js and "XMLHttpRequest" not in portability_js
assert "content_scripts" not in manifest
assert "0.2.2" in readme and "accepted Stable remains `0.2.0`" in readme

print("Redirector 0.2.2 source contract validated.")
