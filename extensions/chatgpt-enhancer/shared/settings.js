(() => {
  "use strict";

  const SETTINGS_KEY = "gcce.settings.v1";
  const DRAFTS_KEY = "gcce.drafts.v1";
  const PRODUCT_NAME = "GoreeCloud ChatGPT Enhancer";
  const GECKO_ID = "chatgpt-enhancer@goreecloud.com";
  const PORTABILITY_FORMAT_VERSION = 1;
  const MAX_DRAFTS = 20;
  const MAX_DRAFT_LENGTH = 20000;
  const MAX_SNIPPETS = 50;
  const MAX_SNIPPET_NAME = 80;
  const MAX_SNIPPET_BODY = 8000;

  const DEFAULTS = Object.freeze({
    focusMode: false,
    wideMode: true,
    compactMode: false,
    codeWrap: true,
    showFloatingButton: true,
    draftRecovery: false,
    contentWidth: 1040,
    fontScale: 100,
    snippets: [
      {
        id: "explain-clearly",
        name: "Explain clearly",
        body: "Explain this clearly and practically. Define unfamiliar terms, use a concrete example, and separate facts from assumptions."
      },
      {
        id: "review-rigorously",
        name: "Review rigorously",
        body: "Review this critically. Identify correctness issues, hidden assumptions, edge cases, security or privacy concerns, and concrete improvements."
      },
      {
        id: "turn-into-plan",
        name: "Turn into a plan",
        body: "Turn this into an actionable plan with the smallest useful next steps, dependencies, verification checks, and a clear definition of done."
      }
    ]
  });

  function clampNumber(value, minimum, maximum, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(maximum, Math.max(minimum, Math.round(number)));
  }

  function normalizeSnippet(snippet, index = 0) {
    if (!snippet || typeof snippet !== "object") return null;
    const name = String(snippet.name || "").trim().slice(0, MAX_SNIPPET_NAME);
    const body = String(snippet.body || "").trim().slice(0, MAX_SNIPPET_BODY);
    if (!name || !body) return null;
    const rawId = String(snippet.id || `snippet-${index + 1}`);
    const id = rawId.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 96) || `snippet-${index + 1}`;
    return { id, name, body };
  }

  function uniqueSnippetIds(snippets) {
    const used = new Set();
    return snippets.map((snippet, index) => {
      let id = snippet.id || `snippet-${index + 1}`;
      if (!used.has(id)) {
        used.add(id);
        return snippet;
      }

      const base = id.slice(0, 88) || "snippet";
      let suffix = 2;
      while (used.has(`${base}-${suffix}`)) suffix += 1;
      id = `${base}-${suffix}`;
      used.add(id);
      return { ...snippet, id };
    });
  }

  function normalize(input = {}) {
    const source = input && typeof input === "object" ? input : {};
    const snippets = Array.isArray(source.snippets)
      ? uniqueSnippetIds(source.snippets.slice(0, MAX_SNIPPETS).map(normalizeSnippet).filter(Boolean))
      : DEFAULTS.snippets.map((item) => ({ ...item }));

    return {
      focusMode: Boolean(source.focusMode ?? DEFAULTS.focusMode),
      wideMode: Boolean(source.wideMode ?? DEFAULTS.wideMode),
      compactMode: Boolean(source.compactMode ?? DEFAULTS.compactMode),
      codeWrap: Boolean(source.codeWrap ?? DEFAULTS.codeWrap),
      showFloatingButton: Boolean(source.showFloatingButton ?? DEFAULTS.showFloatingButton),
      draftRecovery: Boolean(source.draftRecovery ?? DEFAULTS.draftRecovery),
      contentWidth: clampNumber(source.contentWidth, 720, 1440, DEFAULTS.contentWidth),
      fontScale: clampNumber(source.fontScale, 85, 130, DEFAULTS.fontScale),
      snippets
    };
  }

  function buildSettingsExport(input, exportedAt = new Date().toISOString()) {
    return {
      formatVersion: PORTABILITY_FORMAT_VERSION,
      product: PRODUCT_NAME,
      geckoId: GECKO_ID,
      exportedAt: String(exportedAt),
      settings: normalize(input)
    };
  }

  function parseSettingsImport(text) {
    let envelope;
    try {
      envelope = JSON.parse(String(text || ""));
    } catch (_) {
      throw new Error("Settings file is not valid JSON.");
    }

    if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) {
      throw new Error("Settings file must contain an object.");
    }
    if (envelope.formatVersion !== PORTABILITY_FORMAT_VERSION) {
      throw new Error("Unsupported settings file format.");
    }
    if (envelope.product !== PRODUCT_NAME || envelope.geckoId !== GECKO_ID) {
      throw new Error("Settings file belongs to a different extension.");
    }
    if (!envelope.settings || typeof envelope.settings !== "object" || Array.isArray(envelope.settings)) {
      throw new Error("Settings file does not contain settings.");
    }

    return normalize(envelope.settings);
  }

  async function get() {
    const stored = await browser.storage.local.get(SETTINGS_KEY);
    return normalize(stored[SETTINGS_KEY]);
  }

  async function set(settings) {
    const normalized = normalize(settings);
    await browser.storage.local.set({ [SETTINGS_KEY]: normalized });
    return normalized;
  }

  async function patch(changes) {
    const current = await get();
    return set({ ...current, ...changes });
  }

  async function reset() {
    const defaults = normalize(DEFAULTS);
    await browser.storage.local.set({ [SETTINGS_KEY]: defaults });
    return defaults;
  }

  function draftKey(pathname) {
    return String(pathname || "/").slice(0, 512);
  }

  async function saveDraft(pathname, text) {
    const key = draftKey(pathname);
    const value = String(text || "").slice(0, MAX_DRAFT_LENGTH);
    const result = await browser.storage.local.get(DRAFTS_KEY);
    const existing = result[DRAFTS_KEY] && typeof result[DRAFTS_KEY] === "object"
      ? result[DRAFTS_KEY]
      : {};
    const next = { ...existing };

    if (value.trim()) {
      next[key] = { text: value, updatedAt: Date.now() };
    } else {
      delete next[key];
    }

    const ordered = Object.entries(next)
      .sort((a, b) => (b[1]?.updatedAt || 0) - (a[1]?.updatedAt || 0))
      .slice(0, MAX_DRAFTS);

    await browser.storage.local.set({ [DRAFTS_KEY]: Object.fromEntries(ordered) });
  }

  async function getDraft(pathname) {
    const key = draftKey(pathname);
    const result = await browser.storage.local.get(DRAFTS_KEY);
    const record = result[DRAFTS_KEY]?.[key];
    return typeof record?.text === "string" ? record.text : "";
  }

  async function clearDrafts() {
    await browser.storage.local.remove(DRAFTS_KEY);
  }

  globalThis.GoreeChatGPTSettings = Object.freeze({
    SETTINGS_KEY,
    DRAFTS_KEY,
    PRODUCT_NAME,
    GECKO_ID,
    PORTABILITY_FORMAT_VERSION,
    DEFAULTS,
    get,
    set,
    patch,
    reset,
    saveDraft,
    getDraft,
    clearDrafts,
    normalize,
    buildSettingsExport,
    parseSettingsImport
  });
})();
