#!/usr/bin/env python3
"""Unsigned real-Firefox smoke for GoreeCloud ChatGPT Enhancer 0.1.3.

The test installs the exact deterministic candidate temporarily in a clean
headless Firefox profile. A controlled HTTPS fixture is served from localhost
and mapped to chatgpt.com by CI so Firefox exercises the manifest's real
https://chatgpt.com/* content-script boundary without contacting the live
ChatGPT service.

Evidence is privacy-minimized: no fixture message text, prompt text, full URL,
profile path, cookies, credentials, or account data is retained.
"""

from __future__ import annotations

import hashlib
import json
import os
import socket
import ssl
import subprocess
import sys
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import WebDriverWait

EXPECTED_ADDON_ID = "chatgpt-enhancer@goreecloud.com"
EXPECTED_NAME = "GoreeCloud ChatGPT Enhancer"
EXPECTED_VERSION = "0.1.3"
EXPECTED_ICON_PATH = "assets/icon.svg"
FIXED_EXTENSION_UUID = "5cc41b8e-35d6-47a7-8a12-3fa5f67f5727"
FIXTURE_USER_SECRET = "fixture-user-content-must-not-leak"
FIXTURE_ASSISTANT_SECRET = "fixture-assistant-content-must-not-leak"
FIXTURE_PROMPT_SECRET = "fixture-draft-content-must-not-leak"


class FixtureHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args: object) -> None:
        return

    def do_GET(self) -> None:  # noqa: N802
        body = f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Controlled ChatGPT Enhancer Runtime</title>
  <style>
    body {{ font-family: sans-serif; margin: 0; }}
    nav {{ width: 180px; float: left; min-height: 100vh; }}
    main {{ margin-left: 200px; padding: 24px; max-width: 900px; }}
    [data-message-author-role] {{ margin: 18px 0; padding: 8px; }}
    #prompt-textarea {{ width: 600px; height: 90px; }}
  </style>
</head>
<body>
  <div id="app">
    <nav id="fixture-nav">Controlled navigation</nav>
    <main>
      <div data-message-author-role="user">{FIXTURE_USER_SECRET} one</div>
      <div data-message-author-role="assistant">{FIXTURE_ASSISTANT_SECRET} one</div>
      <div data-message-author-role="user">{FIXTURE_USER_SECRET} two</div>
      <div data-message-author-role="assistant">{FIXTURE_ASSISTANT_SECRET} two</div>
      <form id="fixture-form">
        <textarea id="prompt-textarea" name="prompt-textarea" aria-label="Prompt"></textarea>
        <button type="submit">Submit fixture</button>
      </form>
    </main>
  </div>
  <script>
    window.__fixtureSubmitCount = 0;
    document.querySelector("#fixture-form").addEventListener("submit", event => {{
      event.preventDefault();
      window.__fixtureSubmitCount += 1;
    }});
  </script>
</body>
</html>""".encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def require(condition: bool, name: str, detail: str = "") -> None:
    if not condition:
        suffix = f": {detail}" if detail else ""
        raise AssertionError(f"FAIL {name}{suffix}")
    print(f"PASS {name}")


def free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def create_certificate(directory: Path) -> tuple[Path, Path]:
    cert = directory / "fixture-cert.pem"
    key = directory / "fixture-key.pem"
    subprocess.run(
        [
            "openssl",
            "req",
            "-x509",
            "-newkey",
            "rsa:2048",
            "-nodes",
            "-keyout",
            str(key),
            "-out",
            str(cert),
            "-days",
            "1",
            "-subj",
            "/CN=chatgpt.com",
            "-addext",
            "subjectAltName=DNS:chatgpt.com",
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    require(cert.is_file() and key.is_file(), "controlled TLS certificate created")
    return cert, key


def start_fixture(directory: Path) -> tuple[ThreadingHTTPServer, threading.Thread, int]:
    cert, key = create_certificate(directory)
    server = ThreadingHTTPServer(("127.0.0.1", 0), FixtureHandler)
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(certfile=cert, keyfile=key)
    server.socket = context.wrap_socket(server.socket, server_side=True)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, thread, int(server.server_address[1])


def firefox_options(profile: Path) -> Options:
    options = Options()
    options.add_argument("-headless")
    options.add_argument("--profile")
    options.add_argument(str(profile))
    options.add_argument("--marionette-port")
    options.add_argument(str(free_port()))
    options.accept_insecure_certs = True
    options.set_preference("browser.shell.checkDefaultBrowser", False)
    options.set_preference("browser.startup.page", 0)
    options.set_preference("datareporting.policy.dataSubmissionEnabled", False)
    options.set_preference("toolkit.telemetry.reportingpolicy.firstRun", False)
    options.set_preference("network.trr.mode", 5)
    options.set_preference("network.proxy.type", 0)
    options.set_preference("network.dns.disableIPv6", True)
    options.set_preference(
        "extensions.webextensions.uuids",
        json.dumps({EXPECTED_ADDON_ID: FIXED_EXTENSION_UUID}, separators=(",", ":")),
    )
    return options


def firefox_service() -> Service:
    return Service(service_args=["--allow-system-access"])


def firefox_addon_identity(driver: webdriver.Firefox) -> dict:
    driver.set_context(driver.CONTEXT_CHROME)
    try:
        result = driver.execute_async_script(
            """
            const addonId = arguments[0];
            const done = arguments[arguments.length - 1];
            (async () => {
              try {
                const {AddonManager} = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
                const addon = await AddonManager.getAddonByID(addonId);
                if (!addon) {
                  done({ok: false, error: "installed add-on unavailable"});
                  return;
                }
                done({
                  ok: true,
                  id: addon.id,
                  name: addon.name,
                  version: addon.version,
                  iconURL: addon.iconURL || "",
                  icons: addon.icons || {}
                });
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


def click_command(driver: webdriver.Firefox, title: str) -> None:
    clicked = driver.execute_script(
        """
        const title = arguments[0];
        const button = Array.from(document.querySelectorAll(".gcce-command"))
          .find(candidate => candidate.querySelector("span")?.textContent.trim() === title);
        if (!button) return false;
        button.click();
        return true;
        """,
        title,
    )
    require(clicked is True, f"command available: {title}")


def open_command_center(driver: webdriver.Firefox) -> None:
    launcher = WebDriverWait(driver, 15).until(lambda d: d.find_element("id", "gcce-launcher"))
    launcher.click()
    WebDriverWait(driver, 10).until(
        lambda d: d.find_element("id", "gcce-overlay").get_attribute("hidden") is None
    )
    require(
        driver.find_element("id", "gcce-dialog").get_attribute("role") == "dialog",
        "command center exposes dialog semantics",
    )


def close_command_center(driver: webdriver.Firefox) -> None:
    ActionChains(driver).send_keys(Keys.ESCAPE).perform()
    WebDriverWait(driver, 10).until(
        lambda d: d.find_element("id", "gcce-overlay").get_attribute("hidden") is not None
    )


def main() -> int:
    if len(sys.argv) != 2:
        raise SystemExit("usage: firefox_runtime_smoke.py /path/to/goreecloud-chatgpt-enhancer.xpi")

    xpi = Path(sys.argv[1]).resolve()
    require(xpi.is_file(), "unsigned candidate XPI exists", str(xpi))
    candidate_sha256 = sha256_file(xpi)

    output_dir = Path("dist")
    output_dir.mkdir(exist_ok=True)
    evidence_path = output_dir / "chatgpt-enhancer-firefox-runtime.json"
    screenshot_path = output_dir / "chatgpt-enhancer-controlled-runtime.png"

    passes: list[str] = []
    driver: webdriver.Firefox | None = None

    with tempfile.TemporaryDirectory(prefix="goreecloud-chatgpt-enhancer-runtime-") as tmp:
        temp = Path(tmp)
        profile = temp / "profile"
        profile.mkdir()
        server, thread, port = start_fixture(temp)
        try:
            driver = webdriver.Firefox(options=firefox_options(profile), service=firefox_service())
            addon_id = driver.install_addon(str(xpi), temporary=True)
            require(addon_id == EXPECTED_ADDON_ID, "temporary candidate installation", str(addon_id))
            passes.append("temporary-install")

            identity = firefox_addon_identity(driver)
            icon_suffix = f"/{EXPECTED_ICON_PATH}"
            require(identity.get("id") == EXPECTED_ADDON_ID, "exact add-on ID retained", repr(identity))
            require(identity.get("name") == EXPECTED_NAME, "exact product name retained", repr(identity))
            require(identity.get("version") == EXPECTED_VERSION, "exact candidate version retained", repr(identity))
            require(str(identity.get("iconURL", "")).endswith(icon_suffix), "canonical packaged icon resolves", repr(identity))
            passes.append("addon-identity")

            popup_url = f"moz-extension://{FIXED_EXTENSION_UUID}/popup/popup.html"
            options_url = f"moz-extension://{FIXED_EXTENSION_UUID}/options/options.html"
            driver.get(popup_url)
            WebDriverWait(driver, 10).until(lambda d: d.title == "GoreeCloud ChatGPT Enhancer")
            popup_handle = driver.current_window_handle
            existing_handles = set(driver.window_handles)
            driver.find_element("id", "open-settings").click()
            WebDriverWait(driver, 10).until(lambda d: len(set(d.window_handles) - existing_handles) == 1)
            settings_handle = next(iter(set(driver.window_handles) - existing_handles))
            driver.switch_to.window(settings_handle)
            WebDriverWait(driver, 10).until(lambda d: d.current_url == options_url)
            require(driver.title == "ChatGPT Enhancer Settings", "popup Settings control opens packaged options page")
            passes.append("popup-settings-navigation")
            driver.close()
            driver.switch_to.window(popup_handle)

            target = f"https://chatgpt.com:{port}/controlled-runtime"
            driver.get(target)
            WebDriverWait(driver, 15).until(lambda d: d.title == "Controlled ChatGPT Enhancer Runtime")
            WebDriverWait(driver, 15).until(lambda d: d.find_element("id", "gcce-launcher").is_displayed())
            require(driver.find_element("id", "gcce-launcher").get_attribute("aria-label") == "Open GoreeCloud ChatGPT Enhancer", "launcher semantics")
            require("gcce-wide" in driver.find_element("tag name", "html").get_attribute("class").split(), "default wide mode applied")
            require(
                driver.execute_script("return getComputedStyle(document.documentElement).getPropertyValue('--gcce-content-width').trim()") == "1440px",
                "default content width is 1440px",
            )
            require("gcce-code-wrap" in driver.find_element("tag name", "html").get_attribute("class").split(), "default code wrapping applied")
            passes.append("content-script-injection")

            open_command_center(driver)
            require(driver.switch_to.active_element.get_attribute("id") == "gcce-command-input", "command center receives initial keyboard focus")
            ActionChains(driver).send_keys(Keys.ARROW_DOWN).perform()
            require("gcce-command" in driver.switch_to.active_element.get_attribute("class").split(), "ArrowDown enters command options")
            ActionChains(driver).send_keys(Keys.END).perform()
            require("Jump to conversation bottom" in driver.switch_to.active_element.text, "End moves to final command")
            ActionChains(driver).send_keys(Keys.HOME).perform()
            require("Focus prompt composer" in driver.switch_to.active_element.text, "Home moves to first command")
            ActionChains(driver).send_keys(Keys.ARROW_UP).perform()
            require("Jump to conversation bottom" in driver.switch_to.active_element.text, "ArrowUp wraps from first to final command")
            command_layout = driver.execute_script(
                """
                const list = document.querySelector("#gcce-command-list");
                const footer = document.querySelector(".gcce-dialog-footer");
                const active = document.activeElement;
                const listRect = list.getBoundingClientRect();
                const footerRect = footer.getBoundingClientRect();
                const activeRect = active.getBoundingClientRect();
                return {
                  listTop: listRect.top,
                  listBottom: listRect.bottom,
                  footerTop: footerRect.top,
                  activeTop: activeRect.top,
                  activeBottom: activeRect.bottom
                };
                """
            )
            require(
                command_layout["listBottom"] <= command_layout["footerTop"] + 1,
                "command scroll region stays above footer",
                repr(command_layout),
            )
            require(
                command_layout["activeTop"] >= command_layout["listTop"] - 1
                and command_layout["activeBottom"] <= command_layout["listBottom"] + 1,
                "keyboard-focused command remains fully visible",
                repr(command_layout),
            )
            passes.append("command-keyboard-navigation")
            close_command_center(driver)

            open_command_center(driver)
            click_command(driver, "Check integration health")
            WebDriverWait(driver, 10).until(lambda d: d.find_element("css selector", ".gcce-diagnostics").is_displayed())
            diagnostic_text = driver.find_element("css selector", ".gcce-diagnostics").text
            require("Core ChatGPT integration points are available." in diagnostic_text, "integration health reports available core selectors")
            require("Loaded messages" in diagnostic_text and "4" in diagnostic_text, "integration health reports controlled message count")
            require("Prompt composer" in diagnostic_text and "available" in diagnostic_text, "integration health reports composer availability")
            for secret in (FIXTURE_USER_SECRET, FIXTURE_ASSISTANT_SECRET, FIXTURE_PROMPT_SECRET):
                require(secret not in diagnostic_text, "diagnostic surface excludes controlled private fixture content")
            passes.append("privacy-safe-diagnostics")

            driver.find_element("css selector", ".gcce-panel-header button").click()
            click_command(driver, "Insert saved prompt snippet")
            snippet_search = WebDriverWait(driver, 10).until(lambda d: d.find_element("css selector", "#gcce-panel input[type='search']"))
            snippet_search.send_keys("Explain clearly")
            snippet_button = WebDriverWait(driver, 10).until(lambda d: d.find_element("css selector", ".gcce-snippet"))
            snippet_button.click()
            composer = driver.find_element("id", "prompt-textarea")
            require("Explain this clearly and practically." in composer.get_attribute("value"), "default snippet inserted into composer")
            require(driver.execute_script("return window.__fixtureSubmitCount") == 0, "snippet insertion does not submit prompt")
            passes.append("snippet-insertion-no-submit")

            open_command_center(driver)
            click_command(driver, "Toggle compact spacing")
            WebDriverWait(driver, 10).until(
                lambda d: "gcce-compact" in d.find_element("tag name", "html").get_attribute("class").split()
            )
            require("gcce-compact" in driver.find_element("tag name", "html").get_attribute("class").split(), "compact mode enables")
            open_command_center(driver)
            click_command(driver, "Toggle compact spacing")
            WebDriverWait(driver, 10).until(
                lambda d: "gcce-compact" not in d.find_element("tag name", "html").get_attribute("class").split()
            )
            require("gcce-compact" not in driver.find_element("tag name", "html").get_attribute("class").split(), "compact mode reverses")
            passes.append("presentation-toggle-reversible")

            open_command_center(driver)
            click_command(driver, "Toggle focus mode")
            WebDriverWait(driver, 10).until(
                lambda d: d.execute_script("return getComputedStyle(document.querySelector('nav')).display") == "none"
            )
            require(driver.execute_script("return getComputedStyle(document.querySelector('nav')).display") == "none", "focus mode hides controlled side navigation")
            open_command_center(driver)
            click_command(driver, "Toggle focus mode")
            WebDriverWait(driver, 10).until(
                lambda d: d.execute_script("return getComputedStyle(document.querySelector('nav')).display") != "none"
            )
            require(driver.execute_script("return getComputedStyle(document.querySelector('nav')).display") != "none", "focus mode restores controlled side navigation")
            passes.append("focus-toggle-reversible")

            ActionChains(driver).key_down(Keys.ALT).key_down(Keys.SHIFT).send_keys("g").key_up(Keys.SHIFT).key_up(Keys.ALT).perform()
            WebDriverWait(driver, 10).until(lambda d: d.find_element("id", "gcce-overlay").get_attribute("hidden") is None)
            passes.append("keyboard-command-center")
            close_command_center(driver)

            composer.click()
            driver.execute_script("document.querySelector('#prompt-textarea').blur()")
            ActionChains(driver).key_down(Keys.ALT).key_down(Keys.SHIFT).send_keys("p").key_up(Keys.SHIFT).key_up(Keys.ALT).perform()
            WebDriverWait(driver, 10).until(lambda d: d.switch_to.active_element.get_attribute("id") == "prompt-textarea")
            passes.append("keyboard-composer-focus")

            saved = driver.save_screenshot(str(screenshot_path))
            require(saved and screenshot_path.is_file() and screenshot_path.stat().st_size > 0, "controlled runtime screenshot retained")

            evidence = {
                "schemaVersion": 1,
                "product": EXPECTED_NAME,
                "version": EXPECTED_VERSION,
                "sourceRevision": os.environ.get("GCCE_SOURCE_REVISION", ""),
                "candidateSha256": candidate_sha256,
                "firefoxVersion": str(driver.capabilities.get("browserVersion", "")),
                "temporaryInstall": True,
                "controlledLocalFixtureOnly": True,
                "manifestChatGPTMatchExercised": True,
                "liveChatGPTContacted": False,
                "messageCountObserved": 4,
                "privacy": {
                    "conversationTextRetained": False,
                    "promptTextRetained": False,
                    "fullConversationUrlRetained": False,
                    "profilePathRetained": False,
                    "cookiesOrCredentialsRetained": False,
                },
                "passes": passes,
            }
            evidence_path.write_text(json.dumps(evidence, indent=2, sort_keys=True) + "\n", encoding="utf-8")
            require(evidence_path.is_file(), "privacy-safe runtime evidence retained")
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=5)
            if driver is not None:
                driver.quit()

    require(len(passes) == 11, "all runtime smoke groups passed", repr(passes))
    print(f"Validated real-Firefox unsigned ChatGPT Enhancer runtime with {len(passes)} privacy-safe pass groups.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
