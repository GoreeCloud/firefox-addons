(() => {
  "use strict";

  const PRODUCT = "GoreeCloud Redirector";
  const GECKO_ID = "redirector@goreecloud.com";
  const FORMAT_VERSION = 1;
  const MAX_RULES = 200;

  function escapeRegex(value) {
    return value.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
  }

  function parseHttpUrl(value, label) {
    let parsed;
    try {
      parsed = new URL(String(value || "").trim());
    } catch {
      throw new Error(`${label} must be a valid URL.`);
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error(`${label} must use http:// or https://.`);
    }
    if (!parsed.hostname) throw new Error(`${label} must include a hostname.`);
    return parsed;
  }

  function normalizeSource(value) {
    const url = parseHttpUrl(value, "From");
    url.hash = "";
    url.search = "";
    let pathname = url.pathname || "/";
    if (pathname !== "/") pathname = pathname.replace(/\/+$/, "");
    return `${url.origin}${pathname === "/" ? "/" : pathname}`;
  }

  function normalizeDestination(value) {
    return parseHttpUrl(value, "To").toString();
  }

  function permissionOrigin(source) {
    const url = new URL(source);
    return `${url.protocol}//${url.host}/*`;
  }

  function sourceRegex(source) {
    const url = new URL(source);
    let base = `${url.origin}${url.pathname}`;
    if (base.endsWith("/") && url.pathname !== "/") base = base.slice(0, -1);
    if (url.pathname === "/") base = url.origin;
    return `^${escapeRegex(base)}(?:[/?].*)?$`;
  }

  function normalizeRule(rule, index) {
    if (!rule || typeof rule !== "object") throw new Error(`Rule ${index + 1} is invalid.`);
    const name = String(rule.name || "").trim().slice(0, 80);
    if (!name) throw new Error(`Rule ${index + 1} needs a name.`);
    const source = normalizeSource(rule.source);
    const destination = normalizeDestination(rule.destination);
    if (new RegExp(sourceRegex(source)).test(destination)) {
      throw new Error(`Rule “${name}” would redirect back into its own source.`);
    }
    return { name, source, destination, enabled: rule.enabled !== false, permissionOrigin: permissionOrigin(source) };
  }

  function buildExport({ builtinEnabled, rules, exportedAt = new Date().toISOString() }) {
    return {
      formatVersion: FORMAT_VERSION,
      product: PRODUCT,
      geckoId: GECKO_ID,
      exportedAt: String(exportedAt),
      builtinEnabled: Boolean(builtinEnabled),
      rules: (Array.isArray(rules) ? rules : []).slice(0, MAX_RULES).map((rule, index) => {
        const normalized = normalizeRule(rule, index);
        return {
          name: normalized.name,
          source: normalized.source,
          destination: normalized.destination,
          enabled: normalized.enabled
        };
      })
    };
  }

  function parseImport(text) {
    let envelope;
    try {
      envelope = JSON.parse(String(text || ""));
    } catch {
      throw new Error("Redirect backup is not valid JSON.");
    }
    if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) {
      throw new Error("Redirect backup must contain an object.");
    }
    if (envelope.formatVersion !== FORMAT_VERSION || envelope.product !== PRODUCT || envelope.geckoId !== GECKO_ID) {
      throw new Error("Redirect backup belongs to a different product or format version.");
    }
    if (!Array.isArray(envelope.rules) || envelope.rules.length > MAX_RULES) {
      throw new Error(`Redirect backup must contain at most ${MAX_RULES} rules.`);
    }

    const seen = new Set();
    const rules = envelope.rules.map((rule, index) => {
      const normalized = normalizeRule(rule, index);
      if (seen.has(normalized.source)) throw new Error(`Duplicate source in backup: ${normalized.source}`);
      seen.add(normalized.source);
      return normalized;
    });
    return { builtinEnabled: Boolean(envelope.builtinEnabled), rules };
  }

  function preview(url, rules, builtinEnabled) {
    const parsed = parseHttpUrl(url, "Test URL").toString();
    if (builtinEnabled && /^https:\/\/keep\.google\.com(?:[/?].*)?$/i.test(parsed)) {
      return { matched: true, name: "Google Keep → GoreeCloud Memos", destination: "https://memos.goreecloud.com/", builtIn: true };
    }
    for (const rule of Array.isArray(rules) ? rules : []) {
      if (!rule.enabled) continue;
      if (new RegExp(sourceRegex(rule.source)).test(parsed)) {
        return { matched: true, name: rule.name, destination: rule.destination, builtIn: false };
      }
    }
    return { matched: false };
  }

  globalThis.GoreeRedirectorPortability = Object.freeze({
    FORMAT_VERSION,
    MAX_RULES,
    buildExport,
    parseImport,
    preview,
    normalizeSource,
    normalizeDestination,
    permissionOrigin,
    sourceRegex
  });
})();
