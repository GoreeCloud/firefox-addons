#!/usr/bin/env python3
"""Real Firefox runtime qualification for GoreeCloud Browser Hardening 0.1.1."""

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
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import WebDriverWait

EXPECTED_ADDON_ID = "firefox-hardening@goreecloud.com"
EXPECTED_VERSION = "0.1.1"
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


def firefox_options(profile: Path) -> Options:
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


def firefox_service() -> Service:
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
    return result


def setting_snapshot(driver: webdriver.Firefox) -> dict:
    result = driver.execute_async_script(
        """
        const done = arguments[arguments.length - 1];
        (async () => {
          const entries = [
            ["networkPredictionEnabled", browser.privacy.network.networkPredictionEnabled],
            ["hyperlinkAuditingEnabled", browser.privacy.websites.hyperlinkAuditingEnabled],
            ["trackingProtectionMode", browser.privacy.websites.trackingProtectionMode],
            ["cookieConfig", browser.privacy.websites.cookieConfig],
            ["resistFingerprinting", browser.privacy.websites.resistFingerprinting],
            ["webNotificationsDisabled", browser.browserSettings.webNotificationsDisabled],
            ["peerConnectionEnabled", browser.privacy.network.peerConnectionEnabled],
            ["passwordSavingEnabled", browser.privacy.services.passwordSavingEnabled]
          ];
          const output = {};
          for (const [name, setting] of entries) {
            try {
              output[name] = await setting.get({});
            } catch (error) {
              output[name] = {error: String(error)};
            }
          }
          done(output);
        })();
        """
    )
    require(isinstance(result, dict), "browser setting snapshot returned")
    return result


def wait_score(driver: webdriver.Firefox, percent: int = 100) -> None:
    try:
        WebDriverWait(driver, 15).until(
            lambda d: d.find_element("css selector", "#score").text.strip() == str(percent)
        )
    except TimeoutException as exc:
        raise AssertionError(
            f"FAIL hardening score reached {percent}: {driver.find_element('css selector', '#score').text!r}"
        ) from exc


def click_profile(driver: webdriver.Firefox, profile: str, confirm: bool = False) -> None:
    driver.find_element("css selector", f'[data-profile="{profile}"]').click()
    WebDriverWait(driver, 15).until(lambda d: d.find_element("css selector", "#previewPanel").is_displayed())
    require(
        driver.find_element("css selector", "#previewBadge").text.strip() == "No changes applied",
        f"{profile} preview is non-mutating",
    )
    driver.find_element("css selector", "#previewApply").click()
    wait_score(driver, 100)
    badge = driver.find_element("css selector", "#selectedBadge").text.strip()
    expected = {"balanced": "Balanced", "strict": "Strict", "maximum": "Maximum"}[profile]
    require(badge.startswith(expected), f"{expected} profile selected", badge)


def assert_value(snapshot: dict, name: str, expected: object) -> None:
    item = snapshot.get(name)
    require(isinstance(item, dict) and "error" not in item, f"{name} API available", repr(item))
    require(item.get("value") == expected, f"{name} target applied", repr(item))


def main() -> int:
    if len(sys.argv) != 2:
        raise SystemExit("usage: runtime_smoke.py /path/to/goreecloud-firefox-hardening-0.1.0.xpi")

    xpi = Path(sys.argv[1]).resolve()
    require(xpi.is_file(), "unsigned XPI exists", str(xpi))
    candidate_digest = hashlib.sha256(xpi.read_bytes()).hexdigest()

    result: dict[str, object] = {
        "schemaVersion": 1,
        "product": "GoreeCloud Browser Hardening",
        "version": EXPECTED_VERSION,
        "firefoxAddonId": EXPECTED_ADDON_ID,
        "sourceRevision": os.environ.get("FIREFOX_HARDENING_SOURCE_REVISION", os.environ.get("GITHUB_SHA", "")),
        "candidateSha256": candidate_digest,
        "temporaryUnsignedInstall": False,
        "profiles": {},
        "restoreAccepted": False,
        "policyGenerationAccepted": False,
        "policyAuditAccepted": False,
        "compatibilityDiagnosticsAccepted": False,
        "deploymentGuideAccepted": False,
        "popupAccepted": False,
        "runtimeAccepted": False,
    }

    with tempfile.TemporaryDirectory(prefix="firefox-hardening-runtime-") as profile_tmp:
        profile = Path(profile_tmp)
        driver: webdriver.Firefox | None = None
        try:
            driver = webdriver.Firefox(
                options=firefox_options(profile),
                service=firefox_service(),
            )
            addon_id = driver.install_addon(str(xpi), temporary=True)
            require(addon_id == EXPECTED_ADDON_ID, "temporary unsigned installation", repr(addon_id))
            result["temporaryUnsignedInstall"] = True
            identity = addon_identity(driver)
            require(identity.get("version") == EXPECTED_VERSION, "installed version", repr(identity))
            require(identity.get("active") is True, "installed add-on active", repr(identity))
            result["firefoxVersion"] = driver.capabilities.get("browserVersion", "")

            navigate_extension(driver, "dashboard.html")
            WebDriverWait(driver, 15).until(lambda d: d.find_element("css selector", "#settingsBody"))
            require(driver.find_element("css selector", "#onboardingPanel").is_displayed(), "first-use guidance visible")

            click_profile(driver, "balanced")
            balanced = setting_snapshot(driver)
            assert_value(balanced, "networkPredictionEnabled", False)
            assert_value(balanced, "hyperlinkAuditingEnabled", False)
            assert_value(balanced, "trackingProtectionMode", "always")
            assert_value(
                balanced,
                "cookieConfig",
                {"behavior": "reject_trackers_and_partition_foreign", "nonPersistentCookies": False},
            )
            require(not driver.find_element("css selector", "#onboardingPanel").is_displayed(), "first-use guidance completes after reviewed apply")
            result["profiles"]["balanced"] = True

            click_profile(driver, "strict")
            strict = setting_snapshot(driver)
            assert_value(strict, "resistFingerprinting", True)
            assert_value(strict, "webNotificationsDisabled", True)
            assert_value(strict, "peerConnectionEnabled", True)
            result["profiles"]["strict"] = True

            click_profile(driver, "maximum", confirm=True)
            maximum = setting_snapshot(driver)
            assert_value(maximum, "peerConnectionEnabled", False)
            assert_value(maximum, "passwordSavingEnabled", False)
            result["profiles"]["maximum"] = True

            policy_text = driver.find_element("css selector", "#policyOutput").get_attribute("value")
            policy = json.loads(policy_text)
            policies = policy.get("policies", {})
            require(policies.get("DisableTelemetry") is True, "policy disables telemetry")
            require(policies.get("DisableFirefoxStudies") is True, "policy disables studies")
            require(policies.get("HttpsOnlyMode") == "enabled", "policy enables HTTPS-Only Mode")
            prefs = policies.get("Preferences", {})
            require(
                prefs.get("media.peerconnection.enabled", {}).get("Value") is False,
                "Maximum policy disables WebRTC",
            )
            require(
                prefs.get("signon.rememberSignons", {}).get("Value") is False,
                "Maximum policy disables password-saving offers",
            )
            result["policyGenerationAccepted"] = True

            diagnostics_text = driver.find_element("css selector", "#compatibilityList").text
            require("WebRTC" in diagnostics_text, "Maximum compatibility diagnostics include WebRTC impact", diagnostics_text)
            require("password" in diagnostics_text.lower(), "Maximum compatibility diagnostics include password-saving impact", diagnostics_text)
            result["compatibilityDiagnosticsAccepted"] = True

            driver.execute_script(
                "document.querySelector('#policyAuditInput').value = arguments[0]",
                policy_text,
            )
            driver.find_element("css selector", "#auditPolicy").click()
            WebDriverWait(driver, 10).until(
                lambda d: d.find_element("css selector", "#policyAuditSummary").text.strip() == "Matches selected profile"
            )
            result["policyAuditAccepted"] = True

            deployment_text = driver.find_element("css selector", "#deploymentOutput").get_attribute("value")
            require("Linux" in deployment_text and "Target:" in deployment_text, "Linux deployment guide rendered", deployment_text)
            result["deploymentGuideAccepted"] = True

            driver.find_element("css selector", "#restore").click()
            WebDriverWait(driver, 5).until(lambda d: d.switch_to.alert)
            driver.switch_to.alert.accept()
            WebDriverWait(driver, 15).until(
                lambda d: d.find_element("css selector", "#status").text.strip().startswith("Released ")
            )
            restored = setting_snapshot(driver)
            controlled = [
                name
                for name, item in restored.items()
                if isinstance(item, dict) and item.get("levelOfControl") == "controlled_by_this_extension"
            ]
            require(not controlled, "restore released all extension-owned settings", repr(controlled))
            result["restoreAccepted"] = True

            navigate_extension(driver, "popup.html")
            WebDriverWait(driver, 15).until(lambda d: len(d.find_elements("css selector", "[data-profile]")) == 3)
            footer_element = driver.find_element("css selector", "footer")
            footer = str(footer_element.get_attribute("textContent") or "").strip()
            require("no telemetry" in footer.lower(), "popup privacy boundary visible", footer)
            result["popupAccepted"] = True

            result["runtimeAccepted"] = all(
                [
                    result["temporaryUnsignedInstall"],
                    all(result["profiles"].values()),
                    result["restoreAccepted"],
                    result["policyGenerationAccepted"],
                    result["policyAuditAccepted"],
                    result["compatibilityDiagnosticsAccepted"],
                    result["deploymentGuideAccepted"],
                    result["popupAccepted"],
                ]
            )
            require(result["runtimeAccepted"] is True, "real Firefox runtime qualification")
        finally:
            if driver is not None:
                driver.quit()

    output = Path("dist/firefox-hardening-runtime-acceptance.json")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
