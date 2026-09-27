export function createTabResidencyPolicy({ browser }) {
  async function protectTab(tab) {
    if (!Number.isInteger(tab?.id) || tab.incognito) {
      return { ok: true, changed: false, skipped: true, tabId: tab?.id ?? null };
    }
    if (tab.autoDiscardable === false) {
      return { ok: true, changed: false, skipped: false, tabId: tab.id };
    }

    await browser.tabs.update(tab.id, { autoDiscardable: false });
    const verified = await browser.tabs.get(tab.id);
    if (verified.autoDiscardable !== false) {
      return { ok: false, changed: false, skipped: false, tabId: tab.id, reason: "verification-failed" };
    }
    return { ok: true, changed: true, skipped: false, tabId: tab.id };
  }

  async function protectTabById(tabId) {
    return protectTab(await browser.tabs.get(tabId));
  }

  async function protectAllOpenTabs() {
    const tabs = await browser.tabs.query({});
    const results = await Promise.all(tabs.map(async (tab) => {
      try {
        return await protectTab(tab);
      } catch (error) {
        return {
          ok: false,
          changed: false,
          skipped: false,
          tabId: Number.isInteger(tab?.id) ? tab.id : null,
          reason: String(error?.message || error)
        };
      }
    }));
    const failures = results.filter((result) => !result.ok);
    return {
      ok: failures.length === 0,
      inspected: results.length,
      changed: results.filter((result) => result.changed).length,
      skipped: results.filter((result) => result.skipped).length,
      failures
    };
  }

  return { protectAllOpenTabs, protectTab, protectTabById };
}
