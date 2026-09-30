(() => {
  "use strict";

  if (globalThis.__goreeChatGPTEnhancerLoaded) return;
  globalThis.__goreeChatGPTEnhancerLoaded = true;

  const Settings = globalThis.GoreeChatGPTSettings;
  const ROOT = document.documentElement;
  const AUTHOR_SELECTOR = "[data-message-author-role]";
  const USER_SELECTOR = '[data-message-author-role="user"]';
  const ASSISTANT_SELECTOR = '[data-message-author-role="assistant"]';
  let settings = null;
  let overlay = null;
  let commandInput = null;
  let commandList = null;
  let panel = null;
  let floatingButton = null;
  let lastFocused = null;
  let draftTimer = null;

  const COMMANDS = [
    ["focus-composer", "Focus prompt composer", "Alt+Shift+P"],
    ["search", "Search this conversation", "Local only"],
    ["outline", "Open conversation outline", "User prompts"],
    ["copy-last", "Copy last response", "Markdown-friendly text"],
    ["copy-all", "Copy conversation as Markdown", "Local clipboard"],
    ["download", "Download conversation as Markdown", "Local file"],
    ["snippets", "Insert saved prompt snippet", "Searchable local library"],
    ["diagnostics", "Check integration health", "Privacy-safe local diagnostics"],
    ["restore-draft", "Restore saved draft", "Opt-in only"],
    ["toggle-focus", "Toggle focus mode", "Hide side chrome"],
    ["toggle-wide", "Toggle wide conversation", "More reading width"],
    ["toggle-compact", "Toggle compact spacing", "Reduce vertical space"],
    ["toggle-wrap", "Toggle code wrapping", "Avoid horizontal scroll"],
    ["previous-user", "Previous user prompt", "Navigate"],
    ["next-user", "Next user prompt", "Navigate"],
    ["top", "Jump to conversation top", "Navigate"],
    ["bottom", "Jump to conversation bottom", "Navigate"]
  ];

  function messageNodes() {
    return [...document.querySelectorAll(AUTHOR_SELECTOR)];
  }

  function userNodes() {
    return [...document.querySelectorAll(USER_SELECTOR)];
  }

  function assistantNodes() {
    return [...document.querySelectorAll(ASSISTANT_SELECTOR)];
  }

  function cleanText(node) {
    if (!node) return "";
    return String(node.innerText || node.textContent || "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function findComposer() {
    const selectors = [
      "#prompt-textarea",
      'textarea[name="prompt-textarea"]',
      "textarea",
      '[contenteditable="true"][role="textbox"]',
      '[contenteditable="true"]'
    ];
    for (const selector of selectors) {
      const candidate = document.querySelector(selector);
      if (candidate && candidate.getClientRects().length) return candidate;
    }
    return null;
  }

  function composerText(composer = findComposer()) {
    if (!composer) return "";
    if ("value" in composer && typeof composer.value === "string") return composer.value;
    return String(composer.innerText || composer.textContent || "");
  }

  function setComposerText(text, append = false) {
    const composer = findComposer();
    if (!composer) {
      toast("Prompt composer is not available on this page.");
      return false;
    }
    const current = composerText(composer);
    const next = append && current.trim() ? `${current.trim()}\n\n${text}` : text;
    composer.focus();

    if ("value" in composer && typeof composer.value === "string") {
      composer.value = next;
      composer.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      composer.textContent = next;
      composer.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: next
      }));
    }
    return true;
  }

  function conversationMarkdown() {
    const parts = messageNodes()
      .map((node) => {
        const role = node.getAttribute("data-message-author-role");
        const text = cleanText(node);
        if (!text) return null;
        const heading = role === "user" ? "You" : role === "assistant" ? "ChatGPT" : "Message";
        return `## ${heading}\n\n${text}`;
      })
      .filter(Boolean);

    const title = document.title.replace(/\s*[-–—]\s*ChatGPT\s*$/i, "").trim() || "ChatGPT conversation";
    return `# ${title}\n\nSource: ${location.href}\n\n${parts.join("\n\n---\n\n")}\n`;
  }

  async function writeClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const helper = document.createElement("textarea");
      helper.value = text;
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      const copied = document.execCommand("copy");
      helper.remove();
      return copied;
    }
  }

  function safeFilename() {
    const base = document.title.replace(/\s*[-–—]\s*ChatGPT\s*$/i, "").trim() || "chatgpt-conversation";
    const safe = base
      .normalize("NFKC")
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 100);
    return `${safe || "chatgpt-conversation"}.md`;
  }

  function downloadMarkdown() {
    const blob = new Blob([conversationMarkdown()], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = safeFilename();
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Conversation Markdown download started.");
  }

  function toast(message) {
    let node = document.getElementById("gcce-toast");
    if (!node) {
      node = document.createElement("div");
      node.id = "gcce-toast";
      node.setAttribute("role", "status");
      node.setAttribute("aria-live", "polite");
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.classList.add("gcce-toast-visible");
    clearTimeout(node.__timer);
    node.__timer = setTimeout(() => node.classList.remove("gcce-toast-visible"), 2400);
  }

  function applySettings(next) {
    settings = next;
    ROOT.classList.toggle("gcce-focus", settings.focusMode);
    ROOT.classList.toggle("gcce-wide", settings.wideMode);
    ROOT.classList.toggle("gcce-compact", settings.compactMode);
    ROOT.classList.toggle("gcce-code-wrap", settings.codeWrap);
    ROOT.style.setProperty("--gcce-content-width", `${settings.contentWidth}px`);
    ROOT.style.setProperty("--gcce-font-scale", String(settings.fontScale / 100));
    ensureFloatingButton();
  }

  async function toggleSetting(key, label) {
    const next = await Settings.patch({ [key]: !settings[key] });
    applySettings(next);
    toast(`${label} ${next[key] ? "on" : "off"}.`);
  }

  function ensureFloatingButton() {
    if (!settings?.showFloatingButton) {
      floatingButton?.remove();
      floatingButton = null;
      return;
    }
    if (floatingButton?.isConnected) return;
    floatingButton = document.createElement("button");
    floatingButton.type = "button";
    floatingButton.id = "gcce-launcher";
    floatingButton.setAttribute("aria-label", "Open GoreeCloud ChatGPT Enhancer");
    floatingButton.title = "ChatGPT Enhancer (Alt+Shift+G)";
    floatingButton.textContent = "G";
    floatingButton.addEventListener("click", openCommandCenter);
    document.body.appendChild(floatingButton);
  }

  function createDialog() {
    if (overlay?.isConnected) return;
    overlay = document.createElement("div");
    overlay.id = "gcce-overlay";
    overlay.innerHTML = `
      <section id="gcce-dialog" role="dialog" aria-modal="true" aria-labelledby="gcce-title">
        <header class="gcce-dialog-header">
          <div>
            <strong id="gcce-title">ChatGPT Enhancer</strong>
            <span>Local command center</span>
          </div>
          <button type="button" class="gcce-icon-button" data-gcce-close aria-label="Close command center">×</button>
        </header>
        <div class="gcce-command-search">
          <label class="gcce-sr-only" for="gcce-command-input">Find a command</label>
          <input id="gcce-command-input" type="search" autocomplete="off" placeholder="Find a command…" />
        </div>
        <div id="gcce-panel" class="gcce-panel" hidden></div>
        <div id="gcce-command-list" class="gcce-command-list" role="listbox" aria-label="Enhancer commands"></div>
        <footer class="gcce-dialog-footer"><kbd>Esc</kbd> close · <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>G</kbd> toggle</footer>
      </section>
    `;
    overlay.addEventListener("mousedown", (event) => {
      if (event.target === overlay) closeCommandCenter();
    });
    overlay.querySelector("[data-gcce-close]").addEventListener("click", closeCommandCenter);
    commandInput = overlay.querySelector("#gcce-command-input");
    commandList = overlay.querySelector("#gcce-command-list");
    panel = overlay.querySelector("#gcce-panel");
    commandInput.addEventListener("input", renderCommands);
    commandInput.addEventListener("keydown", (event) => {
      const buttons = [...commandList.querySelectorAll(".gcce-command")];
      if (!buttons.length) return;

      if (event.key === "Enter") {
        event.preventDefault();
        buttons[0].click();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        buttons[0].focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        buttons.at(-1).focus();
      }
    });
    commandList.addEventListener("keydown", (event) => {
      const current = event.target.closest?.(".gcce-command");
      if (!current) return;
      const buttons = [...commandList.querySelectorAll(".gcce-command")];
      const index = buttons.indexOf(current);
      let next = null;

      if (event.key === "ArrowDown") next = buttons[(index + 1) % buttons.length];
      else if (event.key === "ArrowUp") next = buttons[(index - 1 + buttons.length) % buttons.length];
      else if (event.key === "Home") next = buttons[0];
      else if (event.key === "End") next = buttons.at(-1);
      else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        current.click();
        return;
      }

      if (next) {
        event.preventDefault();
        next.focus();
      }
    });
    commandList.addEventListener("focusin", (event) => {
      for (const button of commandList.querySelectorAll(".gcce-command")) {
        button.setAttribute("aria-selected", button === event.target ? "true" : "false");
      }
    });
    document.body.appendChild(overlay);
  }

  function renderCommands() {
    const query = commandInput.value.trim().toLowerCase();
    const matches = COMMANDS.filter(([, title, detail]) =>
      !query || `${title} ${detail}`.toLowerCase().includes(query)
    );
    commandList.replaceChildren();
    panel.hidden = true;
    commandList.hidden = false;

    for (const [id, title, detail] of matches) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gcce-command";
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", "false");
      const titleNode = document.createElement("span");
      titleNode.textContent = title;
      const detailNode = document.createElement("small");
      detailNode.textContent = detail;
      button.append(titleNode, detailNode);
      button.addEventListener("click", () => runCommand(id));
      commandList.appendChild(button);
    }

    if (!matches.length) {
      const empty = document.createElement("div");
      empty.className = "gcce-empty";
      empty.textContent = "No matching commands.";
      commandList.appendChild(empty);
    }
  }

  function openCommandCenter() {
    lastFocused = document.activeElement;
    createDialog();
    overlay.hidden = false;
    commandInput.value = "";
    renderCommands();
    requestAnimationFrame(() => commandInput.focus());
  }

  function closeCommandCenter() {
    if (!overlay) return;
    overlay.hidden = true;
    if (lastFocused instanceof HTMLElement && lastFocused.isConnected) lastFocused.focus();
  }

  function showPanel(title, render) {
    commandList.hidden = true;
    panel.hidden = false;
    panel.replaceChildren();
    const top = document.createElement("div");
    top.className = "gcce-panel-header";
    const back = document.createElement("button");
    back.type = "button";
    back.textContent = "← Commands";
    back.addEventListener("click", () => {
      panel.hidden = true;
      commandList.hidden = false;
      commandInput.focus();
    });
    const heading = document.createElement("strong");
    heading.textContent = title;
    top.append(back, heading);
    panel.appendChild(top);
    render(panel);
  }

  function showConversationSearch() {
    showPanel("Search conversation", (host) => {
      const input = document.createElement("input");
      input.type = "search";
      input.placeholder = "Search visible conversation text…";
      input.setAttribute("aria-label", "Search current conversation");
      const results = document.createElement("div");
      results.className = "gcce-results";
      const update = () => {
        const query = input.value.trim().toLowerCase();
        results.replaceChildren();
        const nodes = messageNodes();
        const matches = query
          ? nodes.filter((node) => cleanText(node).toLowerCase().includes(query)).slice(0, 80)
          : [];
        if (!query) {
          results.textContent = "Type to search the messages currently loaded on this page.";
          return;
        }
        if (!matches.length) {
          results.textContent = "No matches in currently loaded messages.";
          return;
        }
        for (const node of matches) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "gcce-result";
          const role = node.getAttribute("data-message-author-role") === "user" ? "You" : "ChatGPT";
          button.textContent = `${role}: ${cleanText(node).replace(/\s+/g, " ").slice(0, 180)}`;
          button.addEventListener("click", () => {
            closeCommandCenter();
            node.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
            highlight(node);
          });
          results.appendChild(button);
        }
      };
      input.addEventListener("input", update);
      host.append(input, results);
      input.focus();
      update();
    });
  }

  function showOutline() {
    showPanel("Conversation outline", (host) => {
      const results = document.createElement("div");
      results.className = "gcce-results";
      const nodes = userNodes();
      if (!nodes.length) {
        results.textContent = "No user prompts are currently loaded.";
      }
      nodes.forEach((node, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "gcce-result";
        const preview = cleanText(node).replace(/\s+/g, " ").slice(0, 180);
        button.textContent = `${index + 1}. ${preview || "Prompt"}`;
        button.addEventListener("click", () => {
          closeCommandCenter();
          node.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
          highlight(node);
        });
        results.appendChild(button);
      });
      host.appendChild(results);
    });
  }

  function showSnippets() {
    showPanel("Prompt snippets", (host) => {
      const input = document.createElement("input");
      input.type = "search";
      input.placeholder = "Search snippet names and text…";
      input.setAttribute("aria-label", "Search prompt snippets");

      const results = document.createElement("div");
      results.className = "gcce-results";

      const render = () => {
        const query = input.value.trim().toLowerCase();
        const matches = settings.snippets.filter((snippet) =>
          !query || `${snippet.name} ${snippet.body}`.toLowerCase().includes(query)
        );
        results.replaceChildren();

        if (!settings.snippets.length) {
          results.textContent = "No snippets saved. Add them from the extension Settings page.";
          return;
        }
        if (!matches.length) {
          results.textContent = "No snippets match this search.";
          return;
        }

        matches.forEach((snippet) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "gcce-result gcce-snippet";
          const title = document.createElement("strong");
          title.textContent = snippet.name;
          const preview = document.createElement("span");
          preview.textContent = snippet.body.slice(0, 180);
          button.append(title, preview);
          button.addEventListener("click", () => {
            if (setComposerText(snippet.body, true)) {
              closeCommandCenter();
              toast(`Inserted “${snippet.name}”.`);
            }
          });
          results.appendChild(button);
        });
      };

      input.addEventListener("input", render);
      host.append(input, results);
      input.focus();
      render();
    });
  }

  function integrationSnapshot() {
    const messages = messageNodes();
    const users = userNodes();
    const assistants = assistantNodes();
    const directComposer = document.querySelector("#prompt-textarea");
    const composer = findComposer();
    return {
      product: "GoreeCloud ChatGPT Enhancer",
      version: browser.runtime.getManifest().version,
      origin: location.origin,
      semanticMessageRolesDetected: messages.length > 0,
      messageCount: messages.length,
      userMessageCount: users.length,
      assistantMessageCount: assistants.length,
      promptTextareaDetected: Boolean(directComposer),
      composerDetected: Boolean(composer),
      composerFallbackInUse: Boolean(composer && !directComposer)
    };
  }

  function showDiagnostics() {
    showPanel("Integration health", (host) => {
      const snapshot = integrationSnapshot();
      const summary = document.createElement("div");
      summary.className = "gcce-diagnostics";

      const status = document.createElement("p");
      const healthy = snapshot.composerDetected && (
        snapshot.semanticMessageRolesDetected || snapshot.messageCount === 0
      );
      status.className = healthy ? "gcce-health-good" : "gcce-health-warning";
      status.textContent = healthy
        ? "Core ChatGPT integration points are available."
        : "One or more expected ChatGPT integration points are unavailable.";

      const note = document.createElement("p");
      note.textContent = "This snapshot contains counts and selector availability only. It does not include conversation text, URLs beyond the site origin, prompt text, cookies, or account data.";

      const list = document.createElement("dl");
      for (const [label, value] of [
        ["Extension version", snapshot.version],
        ["Site origin", snapshot.origin],
        ["Loaded messages", snapshot.messageCount],
        ["Loaded user prompts", snapshot.userMessageCount],
        ["Loaded assistant responses", snapshot.assistantMessageCount],
        ["Semantic message roles", snapshot.semanticMessageRolesDetected ? "available" : "not detected"],
        ["Prompt composer", snapshot.composerDetected ? "available" : "not detected"],
        ["Primary prompt selector", snapshot.promptTextareaDetected ? "available" : "not detected"],
        ["Fallback composer selector", snapshot.composerFallbackInUse ? "in use" : "not in use"]
      ]) {
        const dt = document.createElement("dt");
        dt.textContent = label;
        const dd = document.createElement("dd");
        dd.textContent = String(value);
        list.append(dt, dd);
      }

      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "gcce-result";
      copy.textContent = "Copy privacy-safe diagnostic snapshot";
      copy.addEventListener("click", async () => {
        const copied = await writeClipboard(JSON.stringify(snapshot, null, 2));
        toast(copied ? "Diagnostic snapshot copied." : "Clipboard copy was blocked.");
      });

      summary.append(status, note, list, copy);
      host.appendChild(summary);
    });
  }

  function reducedMotion() {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function highlight(node) {
    node.classList.add("gcce-highlight");
    setTimeout(() => node.classList.remove("gcce-highlight"), 1400);
  }

  function navigateUser(direction) {
    const nodes = userNodes();
    if (!nodes.length) return toast("No user prompts are currently loaded.");
    const center = innerHeight / 2;
    const positions = nodes.map((node) => ({ node, top: node.getBoundingClientRect().top }));
    let target;
    if (direction < 0) {
      target = [...positions].reverse().find((item) => item.top < center - 40) || positions[0];
    } else {
      target = positions.find((item) => item.top > center + 40) || positions[positions.length - 1];
    }
    target.node.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
    highlight(target.node);
  }

  async function runCommand(id) {
    switch (id) {
      case "focus-composer": {
        closeCommandCenter();
        const composer = findComposer();
        if (composer) composer.focus();
        else toast("Prompt composer is not available.");
        break;
      }
      case "search":
        showConversationSearch();
        break;
      case "outline":
        showOutline();
        break;
      case "copy-last": {
        const text = cleanText(assistantNodes().at(-1));
        if (!text) return toast("No assistant response is currently loaded.");
        toast((await writeClipboard(text)) ? "Last response copied." : "Clipboard copy was blocked.");
        closeCommandCenter();
        break;
      }
      case "copy-all":
        toast((await writeClipboard(conversationMarkdown())) ? "Conversation copied as Markdown." : "Clipboard copy was blocked.");
        closeCommandCenter();
        break;
      case "download":
        downloadMarkdown();
        closeCommandCenter();
        break;
      case "snippets":
        showSnippets();
        break;
      case "diagnostics":
        showDiagnostics();
        break;
      case "restore-draft": {
        if (!settings.draftRecovery) return toast("Draft recovery is off. Enable it in extension settings.");
        const draft = await Settings.getDraft(location.pathname);
        if (!draft) return toast("No saved draft exists for this conversation.");
        if (setComposerText(draft, false)) {
          closeCommandCenter();
          toast("Saved draft restored.");
        }
        break;
      }
      case "toggle-focus":
        await toggleSetting("focusMode", "Focus mode");
        closeCommandCenter();
        break;
      case "toggle-wide":
        await toggleSetting("wideMode", "Wide mode");
        closeCommandCenter();
        break;
      case "toggle-compact":
        await toggleSetting("compactMode", "Compact mode");
        closeCommandCenter();
        break;
      case "toggle-wrap":
        await toggleSetting("codeWrap", "Code wrapping");
        closeCommandCenter();
        break;
      case "previous-user":
        closeCommandCenter();
        navigateUser(-1);
        break;
      case "next-user":
        closeCommandCenter();
        navigateUser(1);
        break;
      case "top":
        closeCommandCenter();
        scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" });
        break;
      case "bottom":
        closeCommandCenter();
        scrollTo({ top: document.documentElement.scrollHeight, behavior: reducedMotion() ? "auto" : "smooth" });
        break;
    }
  }

  function isComposerTarget(target) {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest("#prompt-textarea, textarea, [contenteditable='true'][role='textbox'], [contenteditable='true']"));
  }

  function onDraftInput(event) {
    if (!settings?.draftRecovery || !isComposerTarget(event.target)) return;
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      const composer = findComposer();
      if (composer) Settings.saveDraft(location.pathname, composerText(composer)).catch(() => {});
    }, 600);
  }

  document.addEventListener("keydown", (event) => {
    if (event.altKey && event.shiftKey && event.code === "KeyG") {
      event.preventDefault();
      if (overlay && !overlay.hidden) closeCommandCenter();
      else openCommandCenter();
      return;
    }
    if (event.altKey && event.shiftKey && event.code === "KeyP") {
      event.preventDefault();
      const composer = findComposer();
      if (composer) composer.focus();
      return;
    }
    if (event.key === "Escape" && overlay && !overlay.hidden) {
      event.preventDefault();
      closeCommandCenter();
    }
  }, true);

  document.addEventListener("input", onDraftInput, true);

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[Settings.SETTINGS_KEY]) return;
    applySettings(Settings.normalize(changes[Settings.SETTINGS_KEY].newValue));
  });

  Settings.get()
    .then(async (loaded) => {
      const settings = loaded.contentWidth === 1040
        ? await Settings.patch({ contentWidth: 1440 })
        : loaded;
      applySettings(settings);
    })
    .catch(() => applySettings(Settings.normalize({ ...Settings.DEFAULTS, contentWidth: 1440 })));
})();
