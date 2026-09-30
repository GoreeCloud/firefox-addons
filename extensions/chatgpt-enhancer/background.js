(() => {
  "use strict";

  const WELCOME_PATH = "welcome/welcome.html";

  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason !== "install" || details.temporary) return;

    browser.tabs.create({
      url: browser.runtime.getURL(WELCOME_PATH)
    }).catch(() => {
      // First-run guidance is helpful but must never block extension startup.
    });
  });
})();
