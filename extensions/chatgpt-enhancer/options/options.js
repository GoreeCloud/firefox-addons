(() => {
  "use strict";

  const Settings = globalThis.GoreeChatGPTSettings;
  const status = document.getElementById("status");
  const snippetList = document.getElementById("snippet-list");
  let settings = null;

  function announce(message) {
    status.textContent = message;
    clearTimeout(announce.timer);
    announce.timer = setTimeout(() => {
      status.textContent = "";
    }, 2600);
  }

  function render() {
    for (const input of document.querySelectorAll("[data-setting]")) {
      input.checked = Boolean(settings[input.dataset.setting]);
    }

    for (const input of document.querySelectorAll("[data-number-setting]")) {
      const key = input.dataset.numberSetting;
      input.value = String(settings[key]);
      const output = document.getElementById(`${key}Value`);
      if (output) output.value = String(settings[key]);
    }

    renderSnippets();
  }

  function renderSnippets() {
    snippetList.replaceChildren();
    if (!settings.snippets.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No snippets saved.";
      snippetList.appendChild(empty);
      return;
    }

    for (const snippet of settings.snippets) {
      const item = document.createElement("article");
      item.className = "snippet-item";
      const body = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = snippet.name;
      const text = document.createElement("p");
      text.textContent = snippet.body;
      body.append(name, text);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "icon-button";
      remove.textContent = "Delete";
      remove.setAttribute("aria-label", `Delete snippet ${snippet.name}`);
      remove.addEventListener("click", async () => {
        settings = await Settings.patch({
          snippets: settings.snippets.filter((candidate) => candidate.id !== snippet.id)
        });
        renderSnippets();
        announce("Snippet deleted.");
      });
      item.append(body, remove);
      snippetList.appendChild(item);
    }
  }

  async function load() {
    settings = await Settings.get();
    render();

    for (const input of document.querySelectorAll("[data-setting]")) {
      input.addEventListener("change", async () => {
        settings = await Settings.patch({ [input.dataset.setting]: input.checked });
        render();
        announce("Setting saved.");
      });
    }

    for (const input of document.querySelectorAll("[data-number-setting]")) {
      input.addEventListener("input", () => {
        const output = document.getElementById(`${input.dataset.numberSetting}Value`);
        if (output) output.value = input.value;
      });
      input.addEventListener("change", async () => {
        settings = await Settings.patch({ [input.dataset.numberSetting]: Number(input.value) });
        render();
        announce("Setting saved.");
      });
    }
  }

  document.getElementById("snippet-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("snippet-name");
    const body = document.getElementById("snippet-body");
    const snippet = {
      id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `snippet-${Date.now()}`,
      name: name.value,
      body: body.value
    };
    settings = await Settings.patch({ snippets: [...settings.snippets, snippet] });
    event.currentTarget.reset();
    renderSnippets();
    announce("Snippet added.");
    name.focus();
  });

  document.getElementById("clear-drafts").addEventListener("click", async () => {
    await Settings.clearDrafts();
    announce("Saved drafts cleared.");
  });

  document.getElementById("reset-settings").addEventListener("click", async () => {
    settings = await Settings.reset();
    render();
    announce("Default settings restored.");
  });

  load().catch(() => announce("Settings could not be loaded."));
})();
