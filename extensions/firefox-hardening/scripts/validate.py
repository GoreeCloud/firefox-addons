#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "manifest.json"
EXPECTED_NAME = "GoreeCloud Browser Hardening"
EXPECTED_ID = "firefox-hardening@goreecloud.com"
EXPECTED_VERSION = "0.1.0"
EXPECTED_PERMISSIONS = {"browserSettings", "privacy", "storage"}

def fail(message: str) -> None:
    raise SystemExit(f"ERROR: {message}")

def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if manifest.get("manifest_version") != 3:
        fail("manifest_version must be 3")
    if manifest.get("name") != EXPECTED_NAME:
        fail("unexpected extension name")
    if manifest.get("version") != EXPECTED_VERSION:
        fail(f"source validator is scoped to {EXPECTED_VERSION}")
    gecko = manifest.get("browser_specific_settings", {}).get("gecko", {})
    if gecko.get("id") != EXPECTED_ID:
        fail("unexpected Firefox add-on ID")
    if gecko.get("data_collection_permissions", {}).get("required") != ["none"]:
        fail("Firefox data collection declaration must require none")
    permissions = set(manifest.get("permissions", []))
    if permissions != EXPECTED_PERMISSIONS:
        fail(f"permissions must be exactly {sorted(EXPECTED_PERMISSIONS)}; got {sorted(permissions)}")
    for key in ("host_permissions", "optional_host_permissions", "content_scripts", "background", "web_accessible_resources"):
        if manifest.get(key):
            fail(f"{key} must remain absent")
    action = manifest.get("action", {})
    if action.get("default_popup") != "popup.html":
        fail("action.default_popup must be popup.html")
    options = manifest.get("options_ui", {})
    if options.get("page") != "dashboard.html" or options.get("open_in_tab") is not True:
        fail("options_ui must open dashboard.html in a tab")
    required_files = [
        "popup.html", "dashboard.html", "styles.css",
        "src/hardening.js", "src/popup.js", "src/dashboard.js",
        "icons/firefox-hardening.svg", "README.md", "PRIVACY.md",
        "SECURITY.md", "ARCHITECTURE.md", "IMPLEMENTED-FEATURES.md",
        "PLANNED-FEATURES.md", "CHANGELOG.md", "LICENSE"
    ]
    for rel in required_files:
        if not (ROOT / rel).is_file():
            fail(f"missing required file: {rel}")
    print("Firefox Hardening source contract validated.")

if __name__ == "__main__":
    main()
