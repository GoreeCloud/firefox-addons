#!/usr/bin/env python3
"""Persistent-install and full-restart acceptance for Mozilla-signed Browser Hardening."""

from __future__ import annotations

import hashlib
import json
import os
import sys
import tempfile
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait

import runtime_smoke as runtime

EXPECTED_ADDON_ID = "firefox-hardening@goreecloud.com"
EXPECTED_VERSION = "0.1.1"
CONTROL_LEVELS = {"controllable_by_this_extension", "controlled_by_this_extension"}
STRICT_TARGETS = {
    "networkPredictionEnabled": False,
    "hyperlinkAuditingEnabled": False,
    "trackingProtectionMode": "always",
    "cookieConfig": {"behavior": "reject_trackers_and_partition_foreign", "nonPersistentCookies": False},
    "resistFingerprinting": True,
    "webNotificationsDisabled": True,
}


def require(condition: bool, name: str, detail: str = "") -> None:
    if not condition:
        suffix = f": {detail}" if detail else ""
        raise AssertionError(f"FAIL {name}{suffix}")
    print(f"PASS {name}")


def expected_owned_settings(snapshot: dict) -> set[str]:
    expected: set[str] = set()
    for name, target in STRICT_TARGETS.items():
        item = snapshot.get(name)
        require(isinstance(item, dict) and "error" not in item, f"pre-apply {name} API available", repr(item))
        require(
            item.get("levelOfControl") in CONTROL_LEVELS,
            f"pre-apply {name} is locally controllable",
            repr(item),
        )
        if item.get("value") != target:
            expected.add(name)
    return expected


def verify_target_control(snapshot: dict, expected_owned: set[str], phase: str) -> None:
    for name in STRICT_TARGETS:
        item = snapshot.get(name)
        require(isinstance(item, dict) and "error" not in item, f"{phase} {name} API available", repr(item))
        level = item.get("levelOfControl")
        if name in expected_owned:
            require(
                level == "controlled_by_this_extension",
                f"{phase} {name} remains owned after Browser Hardening changed it",
                repr(item),
            )
        else:
            require(
                level in CONTROL_LEVELS,
                f"{phase} {name} remains locally controllable when no write was needed",
                repr(item),
            )


def strict_runtime_checks(driver: webdriver.Firefox, phase: str, expected_owned: set[str]) -> dict:
    runtime.navigate_extension(driver, "dashboard.html")
    WebDriverWait(driver, 15).until(lambda d: d.find_element("css selector", "#settingsBody"))
    WebDriverWait(driver, 15).until(
        lambda d: d.find_element("css selector", "#selectedBadge").text.strip() == "Strict"
    )
    runtime.wait_score(driver, 100)

    snapshot = runtime.setting_snapshot(driver)
    runtime.assert_value(snapshot, "networkPredictionEnabled", False)
    runtime.assert_value(snapshot, "hyperlinkAuditingEnabled", False)
    runtime.assert_value(snapshot, "trackingProtectionMode", "always")
    runtime.assert_value(
        snapshot,
        "cookieConfig",
        {"behavior": "reject_trackers_and_partition_foreign", "nonPersistentCookies": False},
    )
    runtime.assert_value(snapshot, "resistFingerprinting", True)
    runtime.assert_value(snapshot, "webNotificationsDisabled", True)
    verify_target_control(snapshot, expected_owned, phase)
    require(True, f"{phase} Strict profile runtime state")
    return snapshot


def main() -> int:
    if len(sys.argv) != 2:
        raise SystemExit("usage: signed_restart_smoke.py /path/to/mozilla-signed-firefox-hardening.xpi")

    xpi = Path(sys.argv[1]).resolve()
    require(xpi.is_file(), "signed XPI exists", str(xpi))
    signed_digest = hashlib.sha256(xpi.read_bytes()).hexdigest()

    result: dict[str, object] = {
        "schemaVersion": 1,
        "product": "GoreeCloud Browser Hardening",
        "version": EXPECTED_VERSION,
        "firefoxAddonId": EXPECTED_ADDON_ID,
        "sourceRevision": os.environ.get("FIREFOX_HARDENING_SOURCE_REVISION", ""),
        "signedSha256": signed_digest,
        "persistentInstallAccepted": False,
        "preRestartStrictAccepted": False,
        "postRestartAddonActive": False,
        "postRestartStrictAccepted": False,
        "postRestartRestoreAccepted": False,
        "persistentInstallRestartAccepted": False,
    }

    with tempfile.TemporaryDirectory(prefix="firefox-hardening-signed-profile-") as profile_tmp:
        profile = Path(profile_tmp)
        first: webdriver.Firefox | None = None
        second: webdriver.Firefox | None = None
        try:
            first = webdriver.Firefox(
                options=runtime.firefox_options(profile),
                service=runtime.firefox_service(),
            )
            addon_id = first.install_addon(str(xpi), temporary=False)
            require(addon_id == EXPECTED_ADDON_ID, "persistent signed installation", repr(addon_id))
            result["persistentInstallAccepted"] = True
            identity = runtime.addon_identity(first)
            require(identity.get("version") == EXPECTED_VERSION, "pre-restart signed version", repr(identity))
            require(identity.get("active") is True, "pre-restart signed add-on active", repr(identity))
            result["preRestartFirefoxVersion"] = first.capabilities.get("browserVersion", "")

            runtime.navigate_extension(first, "dashboard.html")
            WebDriverWait(first, 15).until(lambda d: d.find_element("css selector", "#settingsBody"))
            pre_apply = runtime.setting_snapshot(first)
            expected_owned = expected_owned_settings(pre_apply)
            runtime.click_profile(first, "strict")
            strict_runtime_checks(first, "pre-restart", expected_owned)
            result["preRestartStrictAccepted"] = True
            result["settingsChangedByExtension"] = sorted(expected_owned)

            first.quit()
            first = None
            time.sleep(1.0)

            second = webdriver.Firefox(
                options=runtime.firefox_options(profile),
                service=runtime.firefox_service(),
            )
            # Do not reinstall. Everything below must come from the persistent signed add-on.
            identity = runtime.addon_identity(second)
            require(identity.get("version") == EXPECTED_VERSION, "post-restart signed version", repr(identity))
            require(identity.get("active") is True, "post-restart signed add-on active", repr(identity))
            result["postRestartAddonActive"] = True
            result["postRestartFirefoxVersion"] = second.capabilities.get("browserVersion", "")

            strict_runtime_checks(second, "post-restart", expected_owned)
            result["postRestartStrictAccepted"] = True

            second.find_element("css selector", "#restore").click()
            WebDriverWait(second, 5).until(lambda d: d.switch_to.alert)
            second.switch_to.alert.accept()
            WebDriverWait(second, 15).until(
                lambda d: d.find_element("css selector", "#status").text.strip().startswith("Released ")
            )
            restored = runtime.setting_snapshot(second)
            controlled = [
                name
                for name, item in restored.items()
                if isinstance(item, dict) and item.get("levelOfControl") == "controlled_by_this_extension"
            ]
            require(not controlled, "post-restart restore released signed extension settings", repr(controlled))
            # BrowserSetting.clear() releases extension ownership; Firefox then
            # resolves the effective value from its current defaults/next
            # controlling source, which need not equal the startup snapshot.
            result["postRestartRestoreAccepted"] = True

            result["persistentInstallRestartAccepted"] = all(
                [
                    result["persistentInstallAccepted"],
                    result["preRestartStrictAccepted"],
                    result["postRestartAddonActive"],
                    result["postRestartStrictAccepted"],
                    result["postRestartRestoreAccepted"],
                ]
            )
            require(result["persistentInstallRestartAccepted"] is True, "signed persistent-install/full-restart acceptance")
        finally:
            if first is not None:
                first.quit()
            if second is not None:
                second.quit()

    output = Path("dist/firefox-hardening-signed-restart.json")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


def self_test() -> int:
    before = {
        name: {"value": target, "levelOfControl": "controllable_by_this_extension"}
        for name, target in STRICT_TARGETS.items()
    }
    before["networkPredictionEnabled"] = {"value": True, "levelOfControl": "controllable_by_this_extension"}
    expected = expected_owned_settings(before)
    require(expected == {"networkPredictionEnabled"}, "self-test identifies settings requiring a write", repr(expected))

    after = {
        name: {"value": target, "levelOfControl": "controllable_by_this_extension"}
        for name, target in STRICT_TARGETS.items()
    }
    after["networkPredictionEnabled"]["levelOfControl"] = "controlled_by_this_extension"
    verify_target_control(after, expected, "self-test")

    blocked = {name: dict(item) for name, item in after.items()}
    blocked["hyperlinkAuditingEnabled"]["levelOfControl"] = "controlled_by_other_extensions"
    try:
        verify_target_control(blocked, expected, "self-test-blocked")
    except AssertionError:
        print("PASS self-test rejects externally controlled already-compliant targets")
    else:
        raise AssertionError("FAIL self-test must reject externally controlled targets")
    return 0


if __name__ == "__main__":
    if len(sys.argv) == 2 and sys.argv[1] == "--self-test":
        raise SystemExit(self_test())
    raise SystemExit(main())
