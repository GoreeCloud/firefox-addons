(() => {
  "use strict";

  const Settings = globalThis.GoreeChatGPTSettings;
  const status = document.getElementById("status");

  function announce(message) {
    status.textContent = message;
    clearTimeout(announce.timer);
    announce.timer = setTimeout(() => {
      status.textContent = "";
    }, 1800);
  }

  async function load() {
    const settings = await Settings.get();
    for (const input of document.querySelectorAll("[data-setting]")) {
      input.checked = Boolean(settings[input.dataset.setting]);
      input.addEventListener("change", async () => {
        const key = input.dataset.setting;
        const next = await Settings.patch({ [key]: input.checked });
        input.checked = Boolean(next[key]);
        announce("Setting saved.");
      });
    }
  }


  load().catch(() => announce("Settings could not be loaded."));
})();
