export const TAB_TITLE_MENU_ID = "atm-rename-tab-title";
export const TAB_TITLE_SESSION_KEY = "goreecloud.advancedTabManager.customTitle";
export const MAX_CUSTOM_TAB_TITLE_LENGTH = 160;

export function isTabTitleRenameEligible(tab) {
  if (!tab || !Number.isInteger(tab.id) || tab.incognito) return false;
  try {
    const protocol = new URL(tab.url || "").protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function applyTabTitleOverride(customTitle, fallbackTitle, maxLength = MAX_CUSTOM_TAB_TITLE_LENGTH) {
  const stateKey = "__goreecloudAdvancedTabManagerTabTitleOverride";
  const previous = globalThis[stateKey];
  const originalPageTitle = typeof previous?.pageTitle === "string"
    ? previous.pageTitle
    : String(document.title || fallbackTitle || "");
  const requestedTitle = String(customTitle || "").trim();

  if (requestedTitle.length > maxLength) {
    return { ok: false, reason: "title-too-long", maxLength };
  }

  if (previous?.observer) previous.observer.disconnect();

  if (!requestedTitle) {
    document.title = originalPageTitle;
    delete globalThis[stateKey];
    return { ok: true, title: "", restoredTitle: originalPageTitle };
  }

  const target = document.head || document.querySelector("head");
  if (!target) return { ok: false, reason: "document-head-unavailable" };

  const state = {
    title: requestedTitle,
    pageTitle: originalPageTitle,
    observer: null
  };

  const reapply = () => {
    if (document.title !== state.title) document.title = state.title;
  };

  state.observer = new MutationObserver(() => {
    if (document.title === state.title) return;
    state.pageTitle = String(document.title || state.pageTitle || "");
    reapply();
  });

  globalThis[stateKey] = state;
  reapply();
  state.observer.observe(target, {
    childList: true,
    subtree: true,
    characterData: true
  });

  return { ok: true, title: requestedTitle };
}

export function createTabTitleRenaming({ browser, broadcastChange = () => {} }) {
  async function readRenameState(tabId) {
    if (!Number.isInteger(tabId)) return { ok: false, reason: "invalid-tab" };

    let tab;
    try {
      tab = await browser.tabs.get(tabId);
    } catch {
      return { ok: false, reason: "tab-not-found" };
    }

    let customTitle = "";
    try {
      customTitle = String(await browser.sessions.getTabValue(tabId, TAB_TITLE_SESSION_KEY) || "");
    } catch {
      return { ok: false, reason: "session-metadata-read-failed" };
    }

    return {
      ok: true,
      eligible: isTabTitleRenameEligible(tab),
      tabId,
      pageTitle: String(tab.title || ""),
      customTitle,
      maxLength: MAX_CUSTOM_TAB_TITLE_LENGTH
    };
  }

  async function readSavedTitle(tabId) {
    try {
      return String(await browser.sessions.getTabValue(tabId, TAB_TITLE_SESSION_KEY) || "");
    } catch {
      return null;
    }
  }

  async function restoreSessionTitle(tabId, previousTitle) {
    const expected = String(previousTitle || "");
    const observed = await readSavedTitle(tabId);
    if (observed === expected) return true;

    try {
      if (expected) {
        await browser.sessions.setTabValue(tabId, TAB_TITLE_SESSION_KEY, expected);
      } else {
        await browser.sessions.removeTabValue(tabId, TAB_TITLE_SESSION_KEY);
      }
    } catch {
      // Verification below remains authoritative because a rejected API call may
      // still race with browser persistence.
    }

    return (await readSavedTitle(tabId)) === expected;
  }

  async function restorePageTitleOverride(tabId, state) {
    try {
      const execution = await browser.scripting.executeScript({
        target: { tabId },
        func: applyTabTitleOverride,
        args: [state.customTitle, state.pageTitle, MAX_CUSTOM_TAB_TITLE_LENGTH]
      });
      return Boolean(execution?.[0]?.result?.ok);
    } catch {
      return false;
    }
  }

  async function applyRename(tabId, requestedTitle) {
    const state = await readRenameState(tabId);
    if (!state.ok) return state;
    if (!state.eligible) return { ok: false, reason: "page-not-scriptable" };

    const title = String(requestedTitle || "").trim();
    if (title.length > MAX_CUSTOM_TAB_TITLE_LENGTH) {
      return { ok: false, reason: "title-too-long", maxLength: MAX_CUSTOM_TAB_TITLE_LENGTH };
    }

    let execution;
    try {
      execution = await browser.scripting.executeScript({
        target: { tabId },
        func: applyTabTitleOverride,
        args: [title, state.pageTitle, MAX_CUSTOM_TAB_TITLE_LENGTH]
      });
    } catch {
      return { ok: false, reason: "page-not-scriptable" };
    }

    const result = execution?.[0]?.result;
    if (!result?.ok) {
      return {
        ok: false,
        reason: result?.reason || "title-update-failed",
        maxLength: result?.maxLength
      };
    }

    try {
      if (title) {
        await browser.sessions.setTabValue(tabId, TAB_TITLE_SESSION_KEY, title);
      } else {
        await browser.sessions.removeTabValue(tabId, TAB_TITLE_SESSION_KEY);
      }
    } catch {
      const metadataRollbackApplied = await restoreSessionTitle(tabId, state.customTitle);
      const pageRollbackApplied = await restorePageTitleOverride(tabId, state);
      return {
        ok: false,
        reason: "session-metadata-write-failed",
        rollbackApplied: metadataRollbackApplied && pageRollbackApplied,
        metadataRollbackApplied,
        pageRollbackApplied
      };
    }

    broadcastChange(title ? "tab-title-renamed" : "tab-title-restored");
    return {
      ok: true,
      title,
      restored: !title
    };
  }

  async function openRenameDialog(tab) {
    if (!isTabTitleRenameEligible(tab)) return { ok: false, reason: "page-not-scriptable" };
    const url = browser.runtime.getURL(`src/tab-title/rename.html?tabId=${encodeURIComponent(tab.id)}`);
    await browser.windows.create({
      url,
      type: "popup",
      width: 440,
      height: 410
    });
    return { ok: true };
  }

  function installMenu() {
    return new Promise((resolve) => {
      browser.menus.create({
        id: TAB_TITLE_MENU_ID,
        title: "Rename tab title…",
        contexts: ["tab"],
        documentUrlPatterns: ["http://*/*", "https://*/*"]
      }, () => {
        const lastError = browser.runtime?.lastError;
        if (lastError) {
          const message = String(lastError.message || lastError);
          if (/already exists|duplicate/i.test(message)) {
            resolve({ ok: true, id: TAB_TITLE_MENU_ID, existing: true });
            return;
          }
          resolve({ ok: false, reason: "menu-create-failed", message });
          return;
        }
        resolve({ ok: true, id: TAB_TITLE_MENU_ID, existing: false });
      });
    });
  }

  async function handleMenuClick(info, tab) {
    if (info?.menuItemId !== TAB_TITLE_MENU_ID) return { ok: false, reason: "ignored" };
    return openRenameDialog(tab);
  }

  function register() {
    if (!browser.menus?.create || !browser.menus?.onClicked?.addListener) {
      return { ok: false, reason: "menus-api-unavailable" };
    }
    if (!browser.runtime?.onInstalled?.addListener) {
      return { ok: false, reason: "runtime-install-event-unavailable" };
    }

    browser.runtime.onInstalled.addListener(() => {
      void installMenu().then((result) => {
        if (!result.ok) {
          console.warn("Advanced Tab Manager could not install the tab-title menu", result);
        }
      }).catch((error) => {
        console.warn("Advanced Tab Manager could not install the tab-title menu", error);
      });
    });

    browser.menus.onClicked.addListener((info, tab) => {
      handleMenuClick(info, tab).catch((error) => {
        console.warn("Advanced Tab Manager could not open the tab-title rename dialog", error);
      });
    });

    return { ok: true };
  }

  return {
    applyRename,
    handleMenuClick,
    installMenu,
    openRenameDialog,
    readRenameState,
    register
  };
}
