(() => {
  "use strict";

  const Settings = globalThis.GoreeChatGPTSettings;
  const status = document.getElementById("status");
  const snippetList = document.getElementById("snippet-list");
  const snippetFilter = document.getElementById("snippet-filter");
  const importFile = document.getElementById("import-file");
  const MAX_IMPORT_BYTES = 1024 * 1024;
  let settings = null;

  function announce(message) {
    status.textContent = message;
    clearTimeout(announce.timer);
    announce.timer = setTimeout(() => {
      status.textContent = "";
    }, 3200);
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
    const query = snippetFilter.value.trim().toLowerCase();
    const matches = settings.snippets.filter((snippet) =>
      !query || `${snippet.name} ${snippet.body}`.toLowerCase().includes(query)
    );

    snippetList.replaceChildren();
    if (!settings.snippets.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No snippets saved.";
      snippetList.appendChild(empty);
      return;
    }
    if (!matches.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No snippets match this search.";
      snippetList.appendChild(empty);
      return;
    }

    for (const snippet of matches) {
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

  function exportSettings() {
    const envelope = Settings.buildSettingsExport(settings);
    const blob = new Blob(
      [JSON.stringify(envelope, null, 2) + "\n"],
      { type: "application/json;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "goreecloud-chatgpt-enhancer-settings.json";
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce("Settings backup download started. Drafts were not included.");
  }

  async function importSettings(file) {
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      throw new Error("Settings file is larger than the 1 MiB import limit.");
    }

    const imported = Settings.parseSettingsImport(await file.text());
    const confirmed = confirm(
      `Replace current presentation settings and prompt snippets with this backup?\n\n` +
      `Snippets in backup: ${imported.snippets.length}\n` +
      "Saved prompt drafts are not changed."
    );
    if (!confirmed) {
      announce("Import cancelled.");
      return;
    }

    settings = await Settings.set(imported);
    snippetFilter.value = "";
    render();
    announce("Settings imported. Saved drafts were unchanged.");
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

  snippetFilter.addEventListener("input", renderSnippets);

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
    snippetFilter.value = "";
    renderSnippets();
    announce("Snippet added.");
    name.focus();
  });

  document.getElementById("export-settings").addEventListener("click", exportSettings);

  document.getElementById("import-settings").addEventListener("click", () => {
    importFile.value = "";
    importFile.click();
  });

  importFile.addEventListener("change", async () => {
    try {
      await importSettings(importFile.files?.[0]);
    } catch (error) {
      announce(error instanceof Error ? error.message : "Settings import failed.");
    } finally {
      importFile.value = "";
    }
  });

  document.getElementById("clear-drafts").addEventListener("click", async () => {
    await Settings.clearDrafts();
    announce("Saved drafts cleared.");
  });

  document.getElementById("reset-settings").addEventListener("click", async () => {
    settings = await Settings.reset();
    snippetFilter.value = "";
    render();
    announce("Default settings restored.");
  });

  load().catch(() => announce("Settings could not be loaded."));
})();
