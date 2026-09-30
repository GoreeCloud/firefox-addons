(() => {
  "use strict";

  const SETTINGS_KEY = "gcce.settings.v1";
  const DRAFTS_KEY = "gcce.drafts.v1";
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

  function normalize(input = {}) {
    const source = input && typeof input === "object" ? input : {};
    const snippets = Array.isArray(source.snippets)
      ? source.snippets.slice(0, MAX_SNIPPETS).map(normalizeSnippet).filter(Boolean)
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
    DEFAULTS,
    get,
    set,
    patch,
    reset,
    saveDraft,
    getDraft,
    clearDrafts,
    normalize
  });
})();
