#!/usr/bin/env python3
"""Persistent-install and full-restart acceptance for signed Firefox Hardening 0.1.0."""

from __future__ import annotations

import hashlib
import json
import os
import socket
import sys
import tempfile
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import WebDriverWait

EXPECTED_ADDON_ID = "firefox-hardening@goreecloud.com"
EXPECTED_VERSION = "0.1.0"
FIXED_EXTENSION_UUID = "7fe4782b-b376-4f78-93a7-8af6c942dbe9"


def require(condition: bool, name: str, detail: str = "") -> None:
    if not condition:
        suffix = f": {detail}" if detail else ""
        raise AssertionError(f"FAIL {name}{suffix}")
    print(f"PASS {name}")


def free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def options_for(profile: Path) -> Options:
    options = Options()
    options.add_argument("-headless")
    options.add_argument("--profile")
    options.add_argument(str(profile))
    options.add_argument("--marionette-port")
    options.add_argument(str(free_port()))
    options.set_preference("browser.shell.checkDefaultBrowser", False)
    options.set_preference("browser.startup.page", 0)
    options.set_preference("datareporting.policy.dataSubmissionEnabled", False)
    options.set_preference("toolkit.telemetry.reportingpolicy.firstRun", False)
    options.set_preference(
        "extensions.webextensions.uuids",
        json.dumps({EXPECTED_ADDON_ID: FIXED_EXTENSION_UUID}, separators=(",", ":")),
    )
    return options


def service() -> Service:
    return Service(service_args=["--allow-system-access"])


def extension_url(path: str) -> str:
    return f"moz-extension://{FIXED_EXTENSION_UUID}/{path.lstrip('/')}"


def navigate_extension(driver: webdriver.Firefox, path: str) -> None:
    target = extension_url(path)
    before = set(driver.window_handles)
    driver.set_context(driver.CONTEXT_CHROME)
    try:
        opened = driver.execute_script(
            """
            const target = arguments[0];
            if (!window.gBrowser) throw new Error("gBrowser unavailable");
            const tab = window.gBrowser.addTrustedTab(target);
            window.gBrowser.selectedTab = tab;
            return Boolean(tab);
            """,
            target,
        )
        require(opened is True, f"trusted extension tab created for {path}")
    finally:
        driver.set_context(driver.CONTEXT_CONTENT)

    WebDriverWait(driver, 15).until(lambda d: len(set(d.window_handles) - before) == 1)
    handle = list(set(driver.window_handles) - before)[0]
    driver.switch_to.window(handle)
    WebDriverWait(driver, 15).until(lambda d: d.current_url == target)


def addon_identity(driver: webdriver.Firefox) -> dict:
    driver.set_context(driver.CONTEXT_CHROME)
    try:
        result = driver.execute_async_script(
            """
            const id = arguments[0];
            const done = arguments[arguments.length - 1];
            (async () => {
              try {
                const {AddonManager} = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
                const addon = await AddonManager.getAddonByID(id);
                done(addon ? {
                  ok: true,
                  id: addon.id,
                  name: addon.name,
                  version: addon.version,
                  active: addon.isActive === true
                } : {ok: false, error: "missing"});
              } catch (error) {
                done({ok: false, error: String(error)});
              }
            })();
            """,
            EXPECTED_ADDON_ID,
        )
    finally:
        driver.set_context(driver.CONTEXT_CONTENT)
    require(isinstance(result, dict) and result.get("ok") is True, "Firefox AddonManager identity available", repr(result))
    require(result.get("id") == EXPECTED_ADDON_ID, "Firefox add-on ID persisted", repr(result))
    require(result.get("version") == EXPECTED_VERSION, "Firefox add-on version persisted", repr(result))
    require(result.get("active") is True, "Firefox add-on active", repr(result))
    return result


def snapshot(driver: webdriver.Firefox) -> dict:
    return driver.execute_async_script(
        """
        const done = arguments[arguments.length - 1];
        (async () => {
          const entries = [
            ["networkPredictionEnabled", browser.privacy.network.networkPredictionEnabled],
            ["hyperlinkAuditingEnabled", browser.privacy.websites.hyperlinkAuditingEnabled],
            ["trackingProtectionMode", browser.privacy.websites.trackingProtectionMode],
            ["cookieConfig", browser.privacy.websites.cookieConfig]
          ];
          const output = {};
          for (const [name, setting] of entries) {
            output[name] = await setting.get({});
          }
          done(output);
        })();
        """
    )


def verify_balanced(values: dict, phase: str) -> None:
    expected = {
        "networkPredictionEnabled": False,
        "hyperlinkAuditingEnabled": False,
        "trackingProtectionMode": "always",
        "cookieConfig": {
            "behavior": "reject_trackers_and_partition_foreign",
            "nonPersistentCookies": False,
        },
    }
    for name, target in expected.items():
        item = values.get(name)
        require(isinstance(item, dict), f"{phase} {name} setting available", repr(item))
        require(item.get("value") == target, f"{phase} {name} matches Balanced", repr(item))
        require(
            item.get("levelOfControl") == "controlled_by_this_extension",
            f"{phase} {name} remains extension-controlled",
            repr(item),
        )


def apply_balanced(driver: webdriver.Firefox) -> None:
    navigate_extension(driver, "dashboard.html")
    driver.find_element("css selector", '[data-profile="balanced"]').click()
    WebDriverWait(driver, 15).until(
        lambda d: d.find_element("css selector", "#score").text.strip() == "100"
    )
    verify_balanced(snapshot(driver), "pre-restart")


def restore_owned(driver: webdriver.Firefox) -> None:
    driver.find_element("css selector", "#restore").click()
    WebDriverWait(driver, 5).until(lambda d: d.switch_to.alert)
    driver.switch_to.alert.accept()
    WebDriverWait(driver, 15).until(
        lambda d: d.find_element("css selector", "#status").text.strip().startswith("Released ")
    )


def main() -> int:
    if len(sys.argv) != 2:
        raise SystemExit("usage: signed_restart_smoke.py SIGNED_XPI")

    signed_xpi = Path(sys.argv[1]).resolve()
    require(signed_xpi.is_file(), "signed XPI exists", str(signed_xpi))
    result = {
        "schemaVersion": 1,
        "product": "GoreeCloud Firefox Hardening",
        "version": EXPECTED_VERSION,
        "firefoxAddonId": EXPECTED_ADDON_ID,
        "sourceRevision": os.environ.get("FIREFOX_HARDENING_RELEASE_SOURCE_REVISION", ""),
        "signedSha256": hashlib.sha256(signed_xpi.read_bytes()).hexdigest(),
        "persistentInstallAccepted": False,
        "preRestartBalancedAccepted": False,
        "postRestartIdentityAccepted": False,
        "postRestartBalancedAccepted": False,
        "restoreAccepted": False,
        "persistentInstallRestartAccepted": False,
    }

    with tempfile.TemporaryDirectory(prefix="firefox-hardening-signed-profile-") as tmp:
        profile = Path(tmp)
        first: webdriver.Firefox | None = None
        second: webdriver.Firefox | None = None
        try:
            first = webdriver.Firefox(options=options_for(profile), service=service())
            addon_id = first.install_addon(str(signed_xpi), temporary=False)
            require(addon_id == EXPECTED_ADDON_ID, "persistent signed installation", repr(addon_id))
            result["persistentInstallAccepted"] = True
            addon_identity(first)
            result["firefoxVersion"] = first.capabilities.get("browserVersion", "")
            apply_balanced(first)
            result["preRestartBalancedAccepted"] = True
            first.quit()
            first = None

            time.sleep(1)
            second = webdriver.Firefox(options=options_for(profile), service=service())
            addon_identity(second)
            result["postRestartIdentityAccepted"] = True
            navigate_extension(second, "dashboard.html")
            WebDriverWait(second, 15).until(
                lambda d: d.find_element("css selector", "#score").text.strip() == "100"
            )
            verify_balanced(snapshot(second), "post-restart")
            result["postRestartBalancedAccepted"] = True
            restore_owned(second)
            after_restore = snapshot(second)
            remaining = [
                name for name, item in after_restore.items()
                if isinstance(item, dict) and item.get("levelOfControl") == "controlled_by_this_extension"
            ]
            require(not remaining, "post-restart restore releases extension-owned settings", repr(remaining))
            result["restoreAccepted"] = True
            result["persistentInstallRestartAccepted"] = all(
                [
                    result["persistentInstallAccepted"],
                    result["preRestartBalancedAccepted"],
                    result["postRestartIdentityAccepted"],
                    result["postRestartBalancedAccepted"],
                    result["restoreAccepted"],
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


if __name__ == "__main__":
    raise SystemExit(main())
