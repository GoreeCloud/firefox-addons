#!/usr/bin/env python3
"""Real-Firefox release smoke for GoreeCloud Advanced Tab Manager 0.1.13.

The test installs the deterministic unsigned candidate temporarily in a clean
headless Firefox profile, opens the extension's real Manager document, and
exercises release-critical browser/runtime paths through the installed
extension. It uses only controlled localhost pages and writes a privacy-safe
summary without browsing URLs, titles, rule contents, or profile paths.

This is unsigned runtime evidence. Mozilla-signed persistent-install and
full-process restart acceptance remain separate release gates.
"""

from __future__ import annotations

import json
import os
import re
import socket
import sys
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from selenium import webdriver
from selenium.common.exceptions import StaleElementReferenceException
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait

EXPECTED_ADDON_ID = "advanced-tab-manager@goreecloud.com"
EXPECTED_VERSION = "0.1.13"
EXPECTED_ICON_PATH = "icons/advanced-tab-manager.svg"
FIXED_EXTENSION_UUID = "4c974aa1-e177-4e73-a1e5-a0ee28ad4b61"


class FixtureHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args: object) -> None:
        return

    def do_GET(self) -> None:  # noqa: N802
        body = (
            "<!doctype html><html><head><meta charset='utf-8'>"
            f"<title>ATM fixture {self.path}</title></head>"
            f"<body><main><h1>Controlled Advanced Tab Manager fixture</h1><p>{self.path}</p></main></body></html>"
        ).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
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


def wait_until(predicate, timeout: float, message: str) -> None:
    deadline = time.monotonic() + timeout
    last = ""
    while time.monotonic() < deadline:
        try:
            value = predicate()
            if value:
                return
            last = repr(value)
        except Exception as exc:
            last = f"{type(exc).__name__}: {exc}"
        time.sleep(0.1)
    raise AssertionError(f"FAIL {message}: {last}")


def click_fresh(driver: webdriver.Firefox, selector: str, timeout: float = 15) -> None:
    def attempt(current: webdriver.Firefox) -> bool:
        try:
            element = current.find_element("css selector", selector)
            if not element.is_displayed() or not element.is_enabled():
                return False
            element.click()
            return True
        except StaleElementReferenceException:
            return False

    WebDriverWait(driver, timeout).until(attempt)


def navigate_extension(driver: webdriver.Firefox, path: str) -> None:
    target = extension_url(path)
    previous_handles = set(driver.window_handles)
    driver.set_context(driver.CONTEXT_CHROME)
    try:
        opened = driver.execute_script(
            """
            const target = arguments[0];
            if (!window.gBrowser) throw new Error('gBrowser unavailable');
            const tab = window.gBrowser.addTrustedTab(target);
            if (!tab) throw new Error('trusted tab creation failed');
            window.gBrowser.selectedTab = tab;
            return true;
            """,
            target,
        )
        require(opened is True, "trusted Manager tab created")
    finally:
        driver.set_context(driver.CONTEXT_CONTENT)

    wait_until(
        lambda: len(set(driver.window_handles) - previous_handles) == 1,
        15,
        f"WebDriver discovered extension document {path}",
    )
    new_handle = list(set(driver.window_handles) - previous_handles)[0]
    driver.switch_to.window(new_handle)
    wait_until(lambda: driver.current_url == target, 15, f"extension navigation completed for {path}")


def grid_shape(driver: webdriver.Firefox, selector: str) -> tuple[int, int]:
    boxes = driver.execute_script(
        """
        return Array.from(document.querySelectorAll(arguments[0])).map(element => {
          const rect = element.getBoundingClientRect();
          return {x: Math.round(rect.x), y: Math.round(rect.y)};
        });
        """,
        selector,
    )
    require(isinstance(boxes, list) and len(boxes) > 0, f"grid elements exist for {selector}", repr(boxes))
    columns = len({int(box["x"]) for box in boxes})
    rows = len({int(box["y"]) for box in boxes})
    return columns, rows


def tab_context_menu_labels(driver: webdriver.Firefox) -> list[str]:
    driver.set_context(driver.CONTEXT_CHROME)
    try:
        result = driver.execute_async_script(
            """
            const done = arguments[arguments.length - 1];
            const menu = document.getElementById("tabContextMenu");
            const tab = window.gBrowser?.selectedTab;
            let settled = false;
            let timer = null;
            const finish = value => {
              if (settled) return;
              settled = true;
              if (timer !== null) clearTimeout(timer);
              try {
                if (menu?.state === "open" || menu?.state === "showing") menu.hidePopup();
              } catch {}
              done(value);
            };
            if (!menu || !tab) {
              finish({ok: false, error: "tab context menu unavailable"});
              return;
            }
            menu.addEventListener("popupshown", () => {
              const labels = Array.from(menu.querySelectorAll("menuitem, menu"))
                .map(element => element.getAttribute("label") || "")
                .filter(Boolean);
              finish({ok: true, labels});
            }, {once: true});
            timer = setTimeout(() => finish({ok: false, error: "tab context menu did not open"}), 5000);
            try {
              menu.openPopup(tab, "after_start", 0, 0, true, false);
            } catch (error) {
              finish({ok: false, error: String(error)});
            }
            """
        )
    finally:
        driver.set_context(driver.CONTEXT_CONTENT)

    require(isinstance(result, dict) and result.get("ok") is True, "native Firefox tab context menu opened", repr(result))
    labels = result.get("labels")
    require(isinstance(labels, list), "native Firefox tab context menu labels enumerated", repr(result))
    return [str(label) for label in labels]


def selected_tab_label(driver: webdriver.Firefox) -> str:
    driver.set_context(driver.CONTEXT_CHROME)
    try:
        label = driver.execute_script(
            """
            if (!window.gBrowser?.selectedTab) throw new Error("selected Firefox tab unavailable");
            return String(window.gBrowser.selectedTab.label || "");
            """
        )
    finally:
        driver.set_context(driver.CONTEXT_CONTENT)
    return str(label)


def invoke_tab_title_menu(driver: webdriver.Firefox) -> tuple[str, str]:
    source_handle = driver.current_window_handle
    previous_handles = set(driver.window_handles)

    driver.set_context(driver.CONTEXT_CHROME)
    try:
        result = driver.execute_async_script(
            """
            const done = arguments[arguments.length - 1];
            const menu = document.getElementById("tabContextMenu");
            const tab = window.gBrowser?.selectedTab;
            let settled = false;
            let timer = null;
            const finish = value => {
              if (settled) return;
              settled = true;
              if (timer !== null) clearTimeout(timer);
              try {
                if (menu?.state === "open" || menu?.state === "showing") menu.hidePopup();
              } catch {}
              done(value);
            };
            if (!menu || !tab) {
              finish({ok: false, error: "tab context menu unavailable"});
              return;
            }
            menu.addEventListener("popupshown", () => {
              const item = Array.from(menu.querySelectorAll("menuitem"))
                .find(element => element.getAttribute("label") === "Rename tab title…");
              if (!item) {
                finish({ok: false, error: "rename tab menu item unavailable"});
                return;
              }
              try {
                item.click();
                finish({ok: true});
              } catch (error) {
                finish({ok: false, error: String(error)});
              }
            }, {once: true});
            timer = setTimeout(() => finish({ok: false, error: "tab context menu did not open"}), 5000);
            try {
              menu.openPopup(tab, "after_start", 0, 0, true, false);
            } catch (error) {
              finish({ok: false, error: String(error)});
            }
            """
        )
    finally:
        driver.set_context(driver.CONTEXT_CONTENT)

    require(isinstance(result, dict) and result.get("ok") is True, "native Firefox tab rename menu activated", repr(result))

    wait_until(
        lambda: len(set(driver.window_handles) - previous_handles) == 1,
        10,
        "rename dialog window opened from the native Firefox tab menu",
    )
    dialog_handle = list(set(driver.window_handles) - previous_handles)[0]
    driver.switch_to.window(dialog_handle)
    wait_until(
        lambda: driver.current_url.startswith(extension_url("src/tab-title/rename.html?tabId=")),
        10,
        "rename dialog extension document loaded",
    )
    WebDriverWait(driver, 10).until(lambda d: d.find_element("id", "tab-title").is_enabled())
    return source_handle, dialog_handle


def set_firefox_pref(driver: webdriver.Firefox, name: str, value: object | None) -> None:
    driver.set_context(driver.CONTEXT_CHROME)
    try:
        result = driver.execute_script(
            """
            const [name, value] = arguments;
            if (typeof Services === "undefined" || !Services.prefs) {
              return {ok: false, error: "Firefox Services.prefs unavailable in chrome context"};
            }
            if (value === null) {
              if (Services.prefs.prefHasUserValue(name)) Services.prefs.clearUserPref(name);
            } else if (typeof value === "boolean") {
              Services.prefs.setBoolPref(name, value);
            } else if (Number.isInteger(value)) {
              Services.prefs.setIntPref(name, value);
            } else {
              throw new Error("unsupported preference value");
            }
            return {ok: true};
            """,
            name,
            value,
        )
    finally:
        driver.set_context(driver.CONTEXT_CONTENT)
    require(isinstance(result, dict) and result.get("ok") is True, f"Firefox preference updated: {name}", repr(result))


def set_current_document_appearance(
    driver: webdriver.Firefox,
    color_scheme: str = "none",
    forced_colors: str = "none",
) -> None:
    driver.set_context(driver.CONTEXT_CHROME)
    try:
        result = driver.execute_script(
            """
            const [colorScheme, forcedColors] = arguments;
            const browser = window.gBrowser?.selectedBrowser;
            const context = browser?.browsingContext;
            if (!context) return {ok: false, error: "selected Firefox content browsing context unavailable"};
            context.prefersColorSchemeOverride = colorScheme;
            context.forcedColorsOverride = forcedColors;
            return {
              ok: true,
              colorScheme: context.prefersColorSchemeOverride,
              forcedColors: context.forcedColorsOverride
            };
            """,
            color_scheme,
            forced_colors,
        )
    finally:
        driver.set_context(driver.CONTEXT_CONTENT)
    require(isinstance(result, dict) and result.get("ok") is True, "Firefox document appearance override updated", repr(result))


def rename_appearance_state(driver: webdriver.Firefox) -> dict:
    result = driver.execute_script(
        """
        const shell = document.querySelector(".rename-shell");
        const secondary = document.querySelector("#cancel");
        const primary = document.querySelector("#save");
        if (!shell || !secondary || !primary) return {ok: false};
        const shellStyle = getComputedStyle(shell);
        const secondaryStyle = getComputedStyle(secondary);
        const primaryStyle = getComputedStyle(primary);
        return {
          ok: true,
          dark: matchMedia("(prefers-color-scheme: dark)").matches,
          forcedColors: matchMedia("(forced-colors: active)").matches,
          reducedTransparency: matchMedia("(prefers-reduced-transparency: reduce)").matches,
          reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
          shellBackdropFilter: shellStyle.getPropertyValue("backdrop-filter").trim(),
          shellBoxShadow: shellStyle.boxShadow,
          secondaryBoxShadow: secondaryStyle.boxShadow,
          primaryColor: primaryStyle.color,
          primaryBackgroundColor: primaryStyle.backgroundColor,
          primaryText: primary.textContent.trim(),
          animationCount: document.getAnimations().length
        };
        """
    )
    require(isinstance(result, dict) and result.get("ok") is True, "rename dialog appearance state available", repr(result))
    return result


def capture_appearance_screenshot(driver: webdriver.Firefox, name: str) -> str:
    output_dir = Path("dist/advanced-tab-manager-appearance-preflight")
    output_dir.mkdir(parents=True, exist_ok=True)
    output = output_dir / f"{name}.png"
    shell = driver.find_element("css selector", ".rename-shell")
    saved = shell.screenshot(str(output))
    require(saved and output.is_file() and output.stat().st_size > 0, f"appearance screenshot retained: {name}")
    return output.name


def set_current_extension_zoom(driver: webdriver.Firefox, zoom: float) -> float:
    result = driver.execute_async_script(
        """
        const zoom = arguments[0];
        const done = arguments[arguments.length - 1];
        browser.tabs.getCurrent().then(tab => {
          if (!tab?.id) {
            done({ok: false, error: "current extension tab unavailable"});
            return;
          }
          browser.tabs.setZoom(tab.id, zoom).then(
            () => browser.tabs.getZoom(tab.id).then(actual => done({ok: true, actual})),
            error => done({ok: false, error: String(error)})
          );
        }, error => done({ok: false, error: String(error)}));
        """,
        zoom,
    )
    require(isinstance(result, dict) and result.get("ok") is True, "extension document zoom changed", repr(result))
    actual = float(result.get("actual", 0))
    require(abs(actual - zoom) < 0.01, "extension document zoom reached requested factor", repr(result))
    return actual


def horizontal_reflow_metrics(driver: webdriver.Firefox) -> dict:
    result = driver.execute_script(
        """
        const root = document.documentElement;
        const controls = Array.from(document.querySelectorAll("#restore, #cancel, #save")).map(element => {
          const rect = element.getBoundingClientRect();
          return {id: element.id, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height};
        });
        return {
          clientWidth: root.clientWidth,
          scrollWidth: root.scrollWidth,
          clientHeight: root.clientHeight,
          scrollHeight: root.scrollHeight,
          controls
        };
        """
    )
    require(isinstance(result, dict), "rename dialog reflow metrics available", repr(result))
    return result


def extension_message(driver: webdriver.Firefox, message: dict) -> object:
    result = driver.execute_async_script(
        """
        const message = arguments[0];
        const done = arguments[arguments.length - 1];
        browser.runtime.sendMessage(message).then(
          value => done({ok: true, value}),
          error => done({ok: false, error: String(error)})
        );
        """,
        message,
    )
    require(isinstance(result, dict) and result.get("ok") is True, "extension message completed", repr(result))
    return result.get("value")


def create_tab(driver: webdriver.Firefox, url: str, active: bool = False) -> int:
    result = driver.execute_async_script(
        """
        const [url, active] = arguments;
        const done = arguments[arguments.length - 1];
        browser.tabs.create({url, active}).then(
          tab => done({ok: true, id: tab.id}),
          error => done({ok: false, error: String(error)})
        );
        """,
        url,
        active,
    )
    require(result.get("ok") is True and isinstance(result.get("id"), int), "controlled Firefox tab created", repr(result))
    return int(result["id"])


def remove_windows(driver: webdriver.Firefox, window_ids: list[int]) -> None:
    result = driver.execute_async_script(
        """
        const ids = arguments[0];
        const done = arguments[arguments.length - 1];
        Promise.all(ids.map(id => browser.windows.remove(id).catch(() => null))).then(() => done(true));
        """,
        window_ids,
    )
    require(result is True, "created restore windows cleaned up")


def normal_window_ids(driver: webdriver.Firefox) -> list[int]:
    result = driver.execute_async_script(
        """
        const done = arguments[arguments.length - 1];
        browser.windows.getAll({windowTypes: ['normal']}).then(
          windows => done(windows.map(window => window.id)),
          error => done({error: String(error)})
        );
        """
    )
    require(isinstance(result, list), "normal Firefox windows enumerated", repr(result))
    return [int(value) for value in result]


def flatten(snapshot: dict) -> list[dict]:
    return [tab for window in snapshot.get("windows", []) for tab in window.get("tabs", [])]



def wait_for_snapshot_url_count(driver: webdriver.Firefox, url: str, count: int, timeout: float = 10) -> list[dict]:
    deadline = time.monotonic() + timeout
    last_count = -1
    while time.monotonic() < deadline:
        result = driver.execute_async_script(
            """
            const done = arguments[arguments.length - 1];
            browser.runtime.sendMessage({type: "atm:get-snapshot"}).then(
              value => done({ok: true, value}),
              error => done({ok: false, error: String(error)})
            );
            """
        )
        if isinstance(result, dict) and result.get("ok") is True:
            snapshot = result.get("value") or {}
            matches = [tab for tab in flatten(snapshot) if tab.get("url") == url]
            last_count = len(matches)
            if last_count == count:
                return matches
        time.sleep(0.1)
    raise AssertionError(f"FAIL live Firefox snapshot reached {count} tabs for controlled URL: observed {last_count}")


def main() -> int:
    if len(sys.argv) != 2:
        raise SystemExit("usage: firefox_runtime_smoke.py /path/to/goreecloud-advanced-tab-manager.xpi")

    xpi = Path(sys.argv[1]).resolve()
    require(xpi.is_file(), "unsigned candidate XPI exists", str(xpi))

    passes: list[str] = []
    server = ThreadingHTTPServer(("127.0.0.1", 0), FixtureHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f"http://127.0.0.1:{server.server_address[1]}"

    with tempfile.TemporaryDirectory(prefix="goreecloud-atm-runtime-") as tmp:
        profile = Path(tmp) / "profile"
        profile.mkdir()
        driver: webdriver.Firefox | None = None
        try:
            driver = webdriver.Firefox(options=firefox_options(profile), service=firefox_service())
            addon_id = driver.install_addon(str(xpi), temporary=True)
            require(addon_id == EXPECTED_ADDON_ID, "temporary candidate installation", str(addon_id))
            passes.append("temporary-install")

            addon_identity = firefox_addon_identity(driver)
            icon_suffix = f"/{EXPECTED_ICON_PATH}"
            require(addon_identity.get("id") == EXPECTED_ADDON_ID, "Firefox AddonManager retains exact add-on ID", repr(addon_identity))
            require(addon_identity.get("name") == "GoreeCloud Advanced Tab Manager", "Firefox AddonManager retains product name", repr(addon_identity))
            require(addon_identity.get("version") == EXPECTED_VERSION, "Firefox AddonManager retains exact candidate version", repr(addon_identity))
            require(str(addon_identity.get("iconURL", "")).endswith(icon_suffix), "Firefox AddonManager resolves canonical packaged product icon", repr(addon_identity))
            native_icons = addon_identity.get("icons")
            expected_icon_sizes = {"16", "32", "48", "64", "96", "128"}
            require(
                isinstance(native_icons, dict)
                and set(native_icons) == expected_icon_sizes
                and all(str(value).endswith(icon_suffix) for value in native_icons.values()),
                "Firefox AddonManager resolves every declared icon size to canonical packaged artwork",
                repr(addon_identity),
            )
            passes.append("native-firefox-addon-icon")

            rename_source_handle = driver.current_window_handle
            rename_url = f"{base}/rename-runtime"
            driver.get(rename_url)
            WebDriverWait(driver, 10).until(lambda d: d.title == "ATM fixture /rename-runtime")
            original_fixture_title = driver.title

            wait_until(
                lambda: "Rename tab title…" in tab_context_menu_labels(driver),
                10,
                "native Firefox tab context menu exposes Rename tab title… on eligible HTTP(S) tabs",
            )
            require(
                "Rename tab title…" in tab_context_menu_labels(driver),
                "native Firefox tab context menu exposes Rename tab title… on eligible HTTP(S) tabs",
            )
            passes.append("tab-title-context-menu")

            set_firefox_pref(driver, "layout.css.prefers-reduced-transparency.enabled", True)
            source_handle, dialog_handle = invoke_tab_title_menu(driver)
            require(source_handle == rename_source_handle and dialog_handle is not None, "rename dialog targets the selected ordinary web tab")
            require(
                driver.find_element("id", "page-title").text.strip() == f"Current page title: {original_fixture_title}",
                "rename dialog reports the current controlled page title",
            )
            require(
                driver.switch_to.active_element.get_attribute("id") == "tab-title",
                "rename dialog moves initial keyboard focus to the custom title field",
            )
            rename_semantics = driver.execute_script(
                """
                const main = document.querySelector("main");
                const heading = document.querySelector("#rename-heading");
                const label = document.querySelector('label[for="tab-title"]');
                const input = document.querySelector("#tab-title");
                const status = document.querySelector("#status");
                return Boolean(
                  main?.getAttribute("aria-labelledby") === "rename-heading"
                  && heading?.textContent.trim() === "Rename tab title"
                  && label?.textContent.trim() === "Custom tab title"
                  && input?.required
                  && input?.maxLength === 160
                  && status?.getAttribute("role") === "status"
                  && status?.getAttribute("aria-live") === "polite"
                );
                """
            )
            require(rename_semantics is True, "rename dialog exposes bounded native form and polite status semantics")

            normal_reflow = horizontal_reflow_metrics(driver)
            require(
                normal_reflow["scrollWidth"] <= normal_reflow["clientWidth"] + 1,
                "rename dialog has no horizontal overflow at default Firefox zoom",
                repr(normal_reflow),
            )
            require(
                normal_reflow["scrollHeight"] <= normal_reflow["clientHeight"] + 1,
                "rename dialog fits its configured popup height at default Firefox zoom",
                repr(normal_reflow),
            )
            require(
                all(
                    control["top"] >= -1 and control["bottom"] <= normal_reflow["clientHeight"] + 1
                    for control in normal_reflow["controls"]
                ),
                "rename dialog actions remain visible without vertical scrolling at default Firefox zoom",
                repr(normal_reflow),
            )

            appearance_baseline = rename_appearance_state(driver)
            appearance_screenshots = [capture_appearance_screenshot(driver, "rename-normal-light")]

            set_current_document_appearance(driver, "dark", "none")
            wait_until(
                lambda: rename_appearance_state(driver)["dark"],
                5,
                "rename dialog enters Firefox dark color-scheme override",
            )
            dark_reflow = horizontal_reflow_metrics(driver)
            require(
                dark_reflow["scrollWidth"] <= dark_reflow["clientWidth"] + 1,
                "rename dialog has no horizontal overflow in dark appearance preflight",
                repr(dark_reflow),
            )
            appearance_screenshots.append(capture_appearance_screenshot(driver, "rename-dark"))
            set_current_document_appearance(driver, "none", "none")
            wait_until(
                lambda: rename_appearance_state(driver)["dark"] == appearance_baseline["dark"],
                5,
                "rename dialog returns to the baseline Firefox color scheme",
            )

            set_current_document_appearance(driver, "none", "active")
            wait_until(
                lambda: rename_appearance_state(driver)["forcedColors"],
                5,
                "rename dialog enters Firefox Forced Colors override",
            )
            forced_state = rename_appearance_state(driver)
            require(
                forced_state["shellBackdropFilter"] in {"", "none"}
                and forced_state["shellBoxShadow"] == "none",
                "rename dialog disables translucent material effects in Forced Colors",
                repr(forced_state),
            )
            require(forced_state["primaryText"] == "Rename", "Forced Colors keeps the Rename action label")
            require(forced_state["primaryColor"] != forced_state["primaryBackgroundColor"], "Forced Colors keeps distinct action text and surface colors", repr(forced_state))
            forced_reflow = horizontal_reflow_metrics(driver)
            require(
                forced_reflow["scrollWidth"] <= forced_reflow["clientWidth"] + 1,
                "rename dialog has no horizontal overflow in Forced Colors preflight",
                repr(forced_reflow),
            )
            appearance_screenshots.append(capture_appearance_screenshot(driver, "rename-forced-colors"))
            set_current_document_appearance(driver, "none", "none")
            wait_until(
                lambda: rename_appearance_state(driver)["forcedColors"] == appearance_baseline["forcedColors"],
                5,
                "rename dialog returns to the baseline Firefox Forced Colors state",
            )

            set_firefox_pref(driver, "ui.prefersReducedTransparency", 1)
            wait_until(
                lambda: rename_appearance_state(driver)["reducedTransparency"] and rename_appearance_state(driver)["shellBackdropFilter"] in {"", "none"},
                5,
                "rename dialog applies Reduced Transparency preference",
            )
            transparency_state = rename_appearance_state(driver)
            require(
                transparency_state["shellBackdropFilter"] in {"", "none"}
                and transparency_state["shellBoxShadow"] == "none"
                and transparency_state["secondaryBoxShadow"] == "none",
                "rename dialog removes material transparency and secondary shadows when transparency is reduced",
                repr(transparency_state),
            )
            appearance_screenshots.append(capture_appearance_screenshot(driver, "rename-reduced-transparency"))
            set_firefox_pref(driver, "ui.prefersReducedTransparency", None)

            set_firefox_pref(driver, "ui.prefersReducedMotion", 1)
            wait_until(
                lambda: rename_appearance_state(driver)["reducedMotion"],
                5,
                "rename dialog enters Reduced Motion preference",
            )
            motion_state = rename_appearance_state(driver)
            require(
                motion_state["animationCount"] == 0,
                "rename dialog has no active animation under Reduced Motion",
                repr(motion_state),
            )
            appearance_screenshots.append(capture_appearance_screenshot(driver, "rename-reduced-motion"))
            set_firefox_pref(driver, "ui.prefersReducedMotion", None)
            set_firefox_pref(driver, "layout.css.prefers-reduced-transparency.enabled", None)
            passes.append("tab-title-appearance-preflight")

            set_current_extension_zoom(driver, 2.0)
            WebDriverWait(driver, 5).until(
                lambda d: horizontal_reflow_metrics(d)["clientWidth"] > 0
            )
            reflow = horizontal_reflow_metrics(driver)
            require(
                reflow["scrollWidth"] <= reflow["clientWidth"] + 1,
                "rename dialog has no horizontal overflow at 200% Firefox zoom",
                repr(reflow),
            )
            require(
                all(
                    control["left"] >= -1 and control["right"] <= reflow["clientWidth"] + 1
                    for control in reflow["controls"]
                ),
                "rename dialog actions remain within the viewport at 200% Firefox zoom",
                repr(reflow),
            )
            appearance_screenshots.append(capture_appearance_screenshot(driver, "rename-zoom-200"))
            set_current_extension_zoom(driver, 1.0)
            passes.append("tab-title-reflow-preflight")

            title_input = driver.find_element("id", "tab-title")
            title_input.clear()
            title_input.send_keys("Runtime custom title", Keys.ENTER)
            wait_until(lambda: dialog_handle not in driver.window_handles, 10, "Enter submits rename and closes the dialog")
            driver.switch_to.window(rename_source_handle)
            wait_until(lambda: selected_tab_label(driver) == "Runtime custom title", 10, "Firefox tab strip reflects the custom title")
            require(driver.title == "Runtime custom title", "controlled page document title reflects the custom title")

            driver.execute_script('document.title = "ATM runtime site rewrite";')
            wait_until(
                lambda: selected_tab_label(driver) == "Runtime custom title" and driver.title == "Runtime custom title",
                10,
                "same-document site title changes do not overwrite the custom label",
            )

            driver.refresh()
            WebDriverWait(driver, 10).until(lambda d: d.title == original_fixture_title)
            wait_until(lambda: selected_tab_label(driver) == original_fixture_title, 10, "reload restores the page-provided title")

            _, reapply_dialog = invoke_tab_title_menu(driver)
            require(reapply_dialog is not None, "rename dialog reopens after reload")
            require(
                driver.find_element("id", "tab-title").get_attribute("value") == "Runtime custom title",
                "saved local custom title remains available for explicit reapplication after reload",
            )
            require(
                driver.find_element("id", "page-title").text.strip() == f"Current page title: {original_fixture_title}",
                "rename dialog distinguishes saved custom label from the reloaded page title",
            )
            driver.find_element("id", "save").click()
            wait_until(lambda: reapply_dialog not in driver.window_handles, 10, "reapply dialog closes after rename")
            driver.switch_to.window(rename_source_handle)
            wait_until(lambda: selected_tab_label(driver) == "Runtime custom title", 10, "saved custom title reapplies after explicit user action")

            driver.execute_script('document.title = "ATM runtime restored title";')
            wait_until(lambda: driver.title == "Runtime custom title", 10, "observer retains custom title while remembering latest site title")
            _, restore_dialog = invoke_tab_title_menu(driver)
            require(restore_dialog is not None, "rename dialog opens for restore")
            wait_until(
                lambda: driver.switch_to.active_element.get_attribute("id") == "tab-title",
                5,
                "restore dialog returns initial focus to the custom title field",
            )
            driver.switch_to.active_element.send_keys(Keys.TAB)
            require(
                driver.switch_to.active_element.get_attribute("id") == "restore",
                "Restore page title is the next keyboard-reachable action after the title field",
            )
            driver.switch_to.active_element.send_keys(Keys.ENTER)
            wait_until(lambda: restore_dialog not in driver.window_handles, 10, "keyboard restore closes the rename dialog")
            driver.switch_to.window(rename_source_handle)
            wait_until(
                lambda: selected_tab_label(driver) == "ATM runtime restored title" and driver.title == "ATM runtime restored title",
                10,
                "Restore page title returns the latest site-provided title",
            )

            _, cancel_dialog = invoke_tab_title_menu(driver)
            require(cancel_dialog is not None, "rename dialog opens for keyboard cancellation")
            wait_until(
                lambda: driver.switch_to.active_element.get_attribute("id") == "tab-title",
                5,
                "cancel dialog begins at the title field",
            )
            driver.switch_to.active_element.send_keys(Keys.TAB)
            driver.switch_to.active_element.send_keys(Keys.TAB)
            require(
                driver.switch_to.active_element.get_attribute("id") == "cancel",
                "Cancel is keyboard reachable in native tab order",
            )
            driver.switch_to.active_element.send_keys(Keys.ENTER)
            wait_until(lambda: cancel_dialog not in driver.window_handles, 10, "keyboard Cancel closes the rename dialog")
            driver.switch_to.window(rename_source_handle)
            require(
                selected_tab_label(driver) == "ATM runtime restored title",
                "keyboard cancellation leaves the restored tab title unchanged",
            )
            passes.append("tab-title-keyboard-accessibility")

            driver.get("about:blank")
            wait_until(lambda: driver.current_url == "about:blank", 10, "restricted Firefox page loaded for fail-closed rename check")
            require(
                "Rename tab title…" not in tab_context_menu_labels(driver),
                "restricted Firefox pages do not expose the inapplicable rename command",
            )
            passes.append("tab-title-rename-restore-reload-restricted")

            navigate_extension(driver, "src/manager/manager.html")
            WebDriverWait(driver, 15).until(
                lambda d: d.find_element("id", "count-snapshot-retention").text.strip() == "10"
            )
            disclosure = driver.find_element("css selector", ".technical-disclosure > summary")
            disclosure.click()
            WebDriverWait(driver, 5).until(
                lambda d: d.find_element("css selector", ".technical-disclosure").get_attribute("open") is not None
            )
            require(
                driver.find_element("id", "source-version").text.strip() == EXPECTED_VERSION,
                "Manager technical disclosure renders source version after user expansion",
            )
            require(driver.find_element("id", "create-snapshot").is_enabled(), "Manager snapshot control is interactive")
            require(driver.find_element("id", "export-backup").is_enabled(), "Manager backup export control is interactive")
            require(
                driver.find_element("id", "snapshot-retention").get_attribute("value") == "10",
                "Manager renders configured snapshot retention",
            )
            require(
                "No local session snapshots yet." in driver.find_element("id", "snapshot-list").text,
                "Manager renders no-snapshot empty state",
            )
            require(
                driver.find_element("id", "count-snapshot-retention").text.strip() == "10",
                "Manager Saved workspace renders snapshot limit",
            )
            require(
                driver.find_element("id", "residency-status").text.strip() == "On"
                and "eligible tabs reject Firefox automatic discard" in driver.find_element("id", "residency-detail").text,
                "Manager renders default automatic-unload protection truth",
            )
            require(
                driver.find_element("id", "content-scripts").text.strip() == "None",
                "Manager renders zero content scripts as None",
            )
            require(
                grid_shape(driver, ".overview-panel:first-child .metrics > div") == (3, 2),
                "Manager Live browser metrics render as 3x2",
            )
            require(
                grid_shape(driver, ".saved-metrics > div") == (3, 2),
                "Manager Saved workspace metrics render as 3x2",
            )
            passes.append("manager-render")

            manager_handle = driver.current_window_handle

            navigate_extension(driver, "src/sidebar/sidebar.html")
            WebDriverWait(driver, 15).until(
                lambda d: len(d.find_elements("css selector", ".tab-activate")) >= 1
            )
            sidebar_semantics = driver.execute_script(
                """
                const rows = Array.from(document.querySelectorAll(".tab-row"));
                return rows.length > 0 && rows.every(row => {
                  const activation = row.querySelector(":scope > .tab-activate");
                  const actions = row.querySelector(":scope > .actions");
                  return row.getAttribute("role") === null
                    && activation?.tagName === "BUTTON"
                    && actions instanceof HTMLElement
                    && Array.from(actions.querySelectorAll(":scope > button")).every(button => button.tagName === "BUTTON");
                });
                """
            )
            require(sidebar_semantics is True, "sidebar tab activation uses native sibling-button semantics")
            command_button = driver.find_element("id", "open-command-palette")
            require(command_button.get_attribute("aria-label") == "Open command palette", "command trigger has accessible name")
            require(
                command_button.get_attribute("aria-keyshortcuts") == "Control+K Meta+K",
                "command trigger exposes keyboard shortcuts",
            )
            command_button.click()
            WebDriverWait(driver, 5).until(
                lambda d: d.find_element("id", "command-palette").get_attribute("hidden") is None
            )
            require(
                driver.switch_to.active_element.get_attribute("id") == "command-query",
                "command palette moves focus to command search",
            )
            driver.switch_to.active_element.send_keys(Keys.ESCAPE)
            WebDriverWait(driver, 5).until(
                lambda d: d.find_element("id", "command-palette").get_attribute("hidden") is not None
            )
            require(
                driver.switch_to.active_element.get_attribute("id") == "open-command-palette",
                "command palette restores focus to trigger",
            )
            passes.append("sidebar-accessibility")

            navigate_extension(driver, "src/popup/popup.html")
            WebDriverWait(driver, 15).until(
                lambda d: d.find_element("id", "metric-tabs").text.strip() not in {"", "—"}
            )
            require(grid_shape(driver, ".metrics > div") == (2, 2), "popup metrics render as 2x2")
            require(
                "Automatic unload protection on" in driver.find_element("id", "residency-status").text,
                "popup exposes default automatic-unload protection",
            )
            require(driver.find_element("id", "save-window").is_enabled(), "popup primary Save action is interactive")
            passes.append("popup-layout")

            driver.switch_to.window(manager_handle)

            manager = extension_message(driver, {"type": "atm:get-manager-state"})
            require(isinstance(manager, dict) and manager.get("ok") is True, "Manager background model available", repr(manager))
            require(manager["model"]["source"]["version"] == EXPECTED_VERSION, "Manager source version is exact candidate")
            require(manager["model"]["permissions"]["hosts"] == [], "Manager confirms no host permissions")
            require(
                manager["model"]["residency"]["fullyProtected"] is True,
                "Manager model reports all eligible tabs protected from Firefox automatic discard",
            )
            passes.append("manager-model")

            residency = driver.execute_async_script(
                """
                const done = arguments[arguments.length - 1];
                browser.tabs.query({}).then(
                  tabs => done(tabs.filter(tab => !tab.incognito).map(tab => ({
                    id: tab.id,
                    autoDiscardable: tab.autoDiscardable,
                    discarded: tab.discarded
                  }))),
                  error => done({error: String(error)})
                );
                """
            )
            require(
                isinstance(residency, list) and len(residency) > 0
                and all(tab.get("autoDiscardable") is False for tab in residency),
                "all currently open non-private tabs reject Firefox automatic discard by default",
                repr(residency),
            )
            passes.append("tab-residency-default")

            parent_id = create_tab(driver, f"{base}/tree-parent")
            child_id = create_tab(driver, f"{base}/tree-child")
            tree = extension_message(driver, {"type": "atm:set-tree-parent", "tabId": child_id, "parentTabId": parent_id})
            require(isinstance(tree, dict) and tree.get("ok") is True, "tree relationship persisted", repr(tree))
            snapshot = extension_message(driver, {"type": "atm:get-snapshot"})
            by_id = {tab["id"]: tab for tab in flatten(snapshot)}
            require(bool(by_id[child_id].get("treeParentLogicalId")), "tree relationship reconstructs from live Firefox state")
            passes.append("tree")

            move_root_url = f"{base}/tree-move-root"
            move_child_url = f"{base}/tree-move-child"
            move_leaf_url = f"{base}/tree-move-leaf"
            move_root = create_tab(driver, move_root_url)
            move_child = create_tab(driver, move_child_url)
            move_leaf = create_tab(driver, move_leaf_url)
            require(
                extension_message(driver, {"type": "atm:set-tree-parent", "tabId": move_child, "parentTabId": move_root}).get("ok") is True,
                "tree move child relationship persisted",
            )
            require(
                extension_message(driver, {"type": "atm:set-tree-parent", "tabId": move_leaf, "parentTabId": move_child}).get("ok") is True,
                "tree move leaf relationship persisted",
            )
            branch_move = extension_message(driver, {"type": "atm:move-tree-branch-new-window", "tabId": move_root})
            require(
                branch_move.get("ok") is True and branch_move.get("moved") == 3 and isinstance(branch_move.get("windowId"), int),
                "guarded tree branch moved to a new Firefox window",
                repr(branch_move),
            )
            moved_snapshot = extension_message(driver, {"type": "atm:get-snapshot"})
            moved_tabs = [tab for tab in flatten(moved_snapshot) if tab.get("url") in {move_root_url, move_child_url, move_leaf_url}]
            require(
                len(moved_tabs) == 3 and {tab.get("windowId") for tab in moved_tabs} == {branch_move["windowId"]},
                "tree branch move keeps every controlled member in one destination window",
                repr(moved_tabs),
            )
            moved_by_url = {tab.get("url"): tab for tab in moved_tabs}
            require(
                moved_by_url[move_child_url].get("treeParentLogicalId") == moved_by_url[move_root_url].get("logicalId")
                and moved_by_url[move_leaf_url].get("treeParentLogicalId") == moved_by_url[move_child_url].get("logicalId"),
                "tree branch move preserves durable parent-child relationships",
                repr(moved_tabs),
            )
            remove_windows(driver, [branch_move["windowId"]])

            branch_root_url = f"{base}/tree-branch-root"
            branch_child_url = f"{base}/tree-branch-child"
            branch_leaf_url = f"{base}/tree-branch-leaf"
            branch_root = create_tab(driver, branch_root_url)
            branch_child = create_tab(driver, branch_child_url)
            branch_leaf = create_tab(driver, branch_leaf_url)
            require(
                extension_message(driver, {"type": "atm:set-tree-parent", "tabId": branch_child, "parentTabId": branch_root}).get("ok") is True,
                "tree branch child relationship persisted",
            )
            require(
                extension_message(driver, {"type": "atm:set-tree-parent", "tabId": branch_leaf, "parentTabId": branch_child}).get("ok") is True,
                "tree branch leaf relationship persisted",
            )
            branch_discard = extension_message(driver, {"type": "atm:discard-tree-branch", "tabId": branch_root})
            require(
                branch_discard.get("ok") is True and branch_discard.get("discarded") == 3,
                "guarded tree branch discard completed",
                repr(branch_discard),
            )
            discarded_snapshot = extension_message(driver, {"type": "atm:get-snapshot"})
            discarded_by_id = {tab["id"]: tab for tab in flatten(discarded_snapshot)}
            require(
                all(discarded_by_id.get(tab_id, {}).get("discarded") is True for tab_id in [branch_root, branch_child, branch_leaf]),
                "tree branch discard unloads every controlled branch member",
                repr(discarded_by_id),
            )
            branch_close = extension_message(driver, {"type": "atm:close-tree-branch", "tabId": branch_root})
            require(
                branch_close.get("ok") is True and branch_close.get("closed") == 3,
                "guarded tree branch close completed",
                repr(branch_close),
            )
            closed_snapshot = extension_message(driver, {"type": "atm:get-snapshot"})
            require(
                all(tab.get("url") not in {branch_root_url, branch_child_url, branch_leaf_url} for tab in flatten(closed_snapshot)),
                "tree branch close removes every controlled branch member",
            )
            passes.append("tree-branch-actions")

            tab_set = extension_message(driver, {"type": "atm:save-focused-window-tab-set", "name": "Runtime acceptance"})
            require(isinstance(tab_set, dict) and tab_set.get("ok") is True and tab_set.get("itemCount", 0) >= 2,
                    "Tab Set capture persisted restorable tabs", repr(tab_set))
            passes.append("tab-set")

            stash_source = create_tab(driver, f"{base}/stash")
            stashed = extension_message(driver, {"type": "atm:stash-tab", "tabId": stash_source})
            require(isinstance(stashed, dict) and stashed.get("ok") is True, "stash persist-then-close completed", repr(stashed))
            restored_stash = extension_message(
                driver,
                {"type": "atm:restore-stashed-item", "stashedItemId": stashed["stashedItemId"]},
            )
            require(isinstance(restored_stash, dict) and restored_stash.get("ok") is True, "stashed tab restored", repr(restored_stash))
            passes.append("stash-restore")

            snooze_url = f"{base}/snooze"
            snooze_source = create_tab(driver, snooze_url)
            navigate_extension(driver, "src/sidebar/sidebar.html")
            snooze_button = WebDriverWait(driver, 15).until(
                lambda d: d.find_element("css selector", f'button[data-action="snooze"][data-tab-id="{snooze_source}"]')
            )
            snooze_button.click()
            WebDriverWait(driver, 5).until(
                lambda d: d.find_element("id", "snooze-dialog").get_attribute("open") is not None
            )
            driver.execute_script(
                """
                const input = document.querySelector("#snooze-deadline");
                const target = new Date(Date.now() + 10 * 60 * 1000);
                const local = new Date(target.getTime() - target.getTimezoneOffset() * 60_000);
                input.value = local.toISOString().slice(0, 16);
                """
            )
            driver.find_element("id", "snooze-submit").click()
            WebDriverWait(driver, 10).until(
                lambda d: d.find_element("id", "snooze-dialog").get_attribute("open") is None
            )
            snooze_state = extension_message(driver, {"type": "atm:get-snooze-state"})
            snoozed_items = [item for item in snooze_state.get("state", {}).get("items", []) if item.get("url") == snooze_url]
            require(
                snooze_state.get("ok") is True and len(snoozed_items) == 1
                and snoozed_items[0].get("wakeAt", 0) > int(time.time() * 1000),
                "arbitrary local date/time snooze persisted and scheduled through the sidebar",
                repr(snooze_state),
            )
            restored_snooze = extension_message(
                driver,
                {"type": "atm:restore-snoozed-item", "snoozedItemId": snoozed_items[0]["id"]},
            )
            require(restored_snooze.get("ok") is True, "custom-snoozed tab restored", repr(restored_snooze))

            next_week_url = f"{base}/snooze-next-week"
            next_week_source = create_tab(driver, next_week_url)
            navigate_extension(driver, "src/sidebar/sidebar.html")
            click_fresh(
                driver,
                f'button[data-action="snooze"][data-tab-id="{next_week_source}"]',
            )
            WebDriverWait(driver, 5).until(
                lambda d: d.find_element("id", "snooze-dialog").get_attribute("open") is not None
            )
            preset_buttons = driver.find_elements("css selector", "button[data-snooze-preset]")
            require(len(preset_buttons) == 4, "snooze dialog exposes four bounded presets", str(len(preset_buttons)))
            later_today = driver.find_element("css selector", 'button[data-snooze-preset="later-today"]')
            if later_today.is_enabled():
                later_today.click()
                later_value = driver.find_element("id", "snooze-deadline").get_attribute("value")
                later_same_day = driver.execute_script(
                    """
                    const target = new Date(arguments[0]);
                    const now = new Date();
                    return Number.isFinite(target.getTime())
                      && target.getTime() > now.getTime()
                      && target.getFullYear() === now.getFullYear()
                      && target.getMonth() === now.getMonth()
                      && target.getDate() === now.getDate();
                    """,
                    later_value,
                )
                require(later_same_day is True, "Later today preset stays on the current local calendar day", later_value)
            driver.find_element("css selector", 'button[data-snooze-preset="next-week"]').click()
            preset_value = driver.find_element("id", "snooze-deadline").get_attribute("value")
            preset_timestamp = driver.execute_script(
                "return new Date(arguments[0]).getTime();",
                preset_value,
            )
            now_ms = int(time.time() * 1000)
            require(
                now_ms + 6 * 24 * 60 * 60 * 1000 < preset_timestamp < now_ms + 8 * 24 * 60 * 60 * 1000,
                "next-week snooze preset resolves roughly seven days ahead",
                str(preset_timestamp),
            )
            driver.find_element("id", "snooze-submit").click()
            WebDriverWait(driver, 10).until(
                lambda d: d.find_element("id", "snooze-dialog").get_attribute("open") is None
            )
            next_week_state = extension_message(driver, {"type": "atm:get-snooze-state"})
            next_week_items = [item for item in next_week_state.get("state", {}).get("items", []) if item.get("url") == next_week_url]
            require(len(next_week_items) == 1, "next-week snooze persisted", repr(next_week_state))
            cancelled = extension_message(
                driver,
                {"type": "atm:cancel-snoozed-item", "snoozedItemId": next_week_items[0]["id"]},
            )
            require(cancelled.get("ok") is True, "next-week snooze cancellation succeeded", repr(cancelled))
            after_cancel = extension_message(driver, {"type": "atm:get-snooze-state"})
            require(
                all(item.get("url") != next_week_url for item in after_cancel.get("state", {}).get("items", [])),
                "cancelled snooze recovery record removed",
                repr(after_cancel),
            )
            cancel_snapshot = extension_message(driver, {"type": "atm:get-snapshot"})
            require(
                all(tab.get("url") != next_week_url for tab in flatten(cancel_snapshot)),
                "cancelling a snooze does not reopen the tab",
            )
            passes.append("snooze-next-week-cancel")

            route_source = create_tab(driver, f"{base}/snooze-route")
            routed = extension_message(
                driver,
                {"type": "atm:snooze-tab", "tabId": route_source, "wakeAt": int(time.time() * 1000) + 600_000},
            )
            require(isinstance(routed, dict) and routed.get("ok") is True, "direct snooze route remains functional", repr(routed))
            routed_restore = extension_message(
                driver,
                {"type": "atm:restore-snoozed-item", "snoozedItemId": routed["snoozedItemId"]},
            )
            require(routed_restore.get("ok") is True, "direct-route snoozed tab restored", repr(routed_restore))
            passes.append("snooze-custom-time-restore")

            duplicate_url = f"{base}/duplicate"
            create_tab(driver, duplicate_url)
            create_tab(driver, duplicate_url)
            duplicates = wait_for_snapshot_url_count(driver, duplicate_url, 2)
            require(len(duplicates) == 2, "duplicate fixture contains two tabs", str(len(duplicates)))
            cleanup = extension_message(
                driver,
                {"type": "atm:cleanup-exact-duplicates", "url": duplicate_url, "keepTabId": duplicates[0]["id"]},
            )
            require(isinstance(cleanup, dict) and cleanup.get("ok") is True, "reviewed exact-URL duplicate cleanup completed", repr(cleanup))
            after_cleanup = extension_message(driver, {"type": "atm:get-snapshot"})
            require(sum(1 for tab in flatten(after_cleanup) if tab.get("url") == duplicate_url) == 1,
                    "duplicate cleanup retained exactly one controlled tab")
            passes.append("duplicate-cleanup")

            normalized_url_one = f"{base}/duplicate-normalized?id=7&utm_source=mail"
            normalized_url_two = f"{base}/duplicate-normalized?id=7&fbclid=abc"
            create_tab(driver, normalized_url_one)
            create_tab(driver, normalized_url_two)
            normalized_one = wait_for_snapshot_url_count(driver, normalized_url_one, 1)
            normalized_two = wait_for_snapshot_url_count(driver, normalized_url_two, 1)
            require(
                len(normalized_one) == 1 and len(normalized_two) == 1,
                "tracking-normalized duplicate fixtures reconcile into live Firefox state",
            )
            normalized_cleanup = extension_message(
                driver,
                {
                    "type": "atm:cleanup-duplicates",
                    "mode": "tracking-normalized",
                    "matchKey": f"{base}/duplicate-normalized?id=7",
                    "keepTabId": normalized_two[0]["id"],
                },
            )
            require(
                isinstance(normalized_cleanup, dict)
                and normalized_cleanup.get("ok") is True
                and normalized_cleanup.get("closed") == 1,
                "tracking-normalized duplicate cleanup completed after fresh-state reconstruction",
                repr(normalized_cleanup),
            )
            normalized_after = extension_message(driver, {"type": "atm:get-snapshot"})
            require(
                sum(
                    1
                    for tab in flatten(normalized_after)
                    if tab.get("url") in {normalized_url_one, normalized_url_two}
                ) == 1,
                "tracking-normalized cleanup retained exactly one reviewed controlled tab",
            )
            passes.append("duplicate-tracking-normalized-cleanup")

            rule_state = extension_message(driver, {"type": "atm:get-rule-state"})
            require(rule_state.get("ok") is True and rule_state["state"].get("enabled") is False,
                    "rule engine remains fail-closed disabled by default")
            passes.append("rule-default")

            session = extension_message(driver, {"type": "atm:create-session-snapshot"})
            require(isinstance(session, dict) and session.get("ok") is True and session.get("tabCount", 0) >= 1,
                    "local session snapshot captured", repr(session))
            manager_after_snapshot = extension_message(driver, {"type": "atm:get-manager-state"})
            require(manager_after_snapshot["model"]["counts"]["sessionSnapshots"] >= 1,
                    "Manager reports retained snapshot count")
            require(all(set(item) == {"id", "createdAt", "windows", "tabs"} for item in manager_after_snapshot["model"]["snapshots"]["items"]),
                    "Manager exposes only privacy-minimized snapshot metadata")

            before_windows = set(normal_window_ids(driver))
            session_restore = extension_message(
                driver,
                {"type": "atm:restore-session-snapshot", "sessionSnapshotId": session["sessionSnapshotId"]},
            )
            require(session_restore.get("ok") is True and session_restore.get("restoredWindowCount", 0) >= 1,
                    "session snapshot restored additively", repr(session_restore))
            after_windows = set(normal_window_ids(driver))
            created_windows = sorted(after_windows - before_windows)
            require(len(created_windows) == session_restore["restoredWindowCount"],
                    "restore created only the reported new windows", repr(created_windows))
            remove_windows(driver, created_windows)
            passes.append("session-snapshot-restore")

            exported = extension_message(driver, {"type": "atm:export-backup"})
            require(exported.get("ok") is True and isinstance(exported.get("bundle"), dict),
                    "local backup export completed", repr(exported))
            preview = extension_message(driver, {"type": "atm:preview-import", "bundle": exported["bundle"]})
            require(preview.get("ok") is True and preview["preview"]["integrityVerified"] is True,
                    "backup preview revalidates exported integrity", repr(preview))
            require(preview["preview"]["importedCounts"]["sessionSnapshots"] >= 1,
                    "backup preview includes retained snapshot count")
            passes.append("backup-preview")

            source_revision = os.environ.get("ATM_SOURCE_REVISION", "")
            require(re.fullmatch(r"[0-9a-f]{40}", source_revision) is not None, "runtime evidence is bound to an exact source revision")
            report = {
                "schemaVersion": 1,
                "product": "GoreeCloud Advanced Tab Manager",
                "sourceVersion": EXPECTED_VERSION,
                "sourceRevision": source_revision,
                "firefoxVersion": str(driver.capabilities.get("browserVersion", "unknown")),
                "installation": "temporary-unsigned-runtime-smoke",
                "controlledLocalFixtureOnly": True,
                "passedChecks": passes,
                "appearancePreflightScreenshots": appearance_screenshots,
                "nativeFirefoxIconResolved": True,
                "signedPersistentRestartAccepted": False,
            }
            out = Path("dist/advanced-tab-manager-firefox-runtime.json")
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
            print(json.dumps(report, indent=2, sort_keys=True))
        finally:
            if driver is not None:
                driver.quit()
            server.shutdown()
            server.server_close()

    require(len(passes) == 23, "all release-critical unsigned runtime checks passed", str(passes))
    print("Advanced Tab Manager unsigned real-Firefox runtime acceptance passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
