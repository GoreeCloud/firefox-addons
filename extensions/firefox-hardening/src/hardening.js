(() => {
  "use strict";

  const PROFILE_ORDER = ["balanced", "strict", "maximum"];
  const CONTROL_LEVELS = new Set(["controllable_by_this_extension", "controlled_by_this_extension"]);

  const PROFILES = Object.freeze({
    balanced: Object.freeze({
      id: "balanced",
      label: "Balanced",
      summary: "Strong baseline privacy with low expected site breakage.",
      risk: "low"
    }),
    strict: Object.freeze({
      id: "strict",
      label: "Strict",
      summary: "Adds anti-fingerprinting and blocks new web-notification prompts.",
      risk: "medium"
    }),
    maximum: Object.freeze({
      id: "maximum",
      label: "Maximum",
      summary: "Adds disruptive controls such as disabling WebRTC and Firefox password saving.",
      risk: "high"
    })
  });

  const SETTINGS = Object.freeze([
    Object.freeze({
      id: "networkPredictionEnabled",
      label: "Network prediction",
      group: "Network",
      path: ["privacy", "network", "networkPredictionEnabled"],
      description: "Stops speculative DNS, prefetch, prerender, and preconnection behavior exposed through Firefox's privacy API.",
      targets: Object.freeze({ balanced: false, strict: false, maximum: false })
    }),
    Object.freeze({
      id: "hyperlinkAuditingEnabled",
      label: "Hyperlink auditing",
      group: "Websites",
      path: ["privacy", "websites", "hyperlinkAuditingEnabled"],
      description: "Disables ping-attribute auditing requests.",
      targets: Object.freeze({ balanced: false, strict: false, maximum: false })
    }),
    Object.freeze({
      id: "trackingProtectionMode",
      label: "Tracking protection",
      group: "Websites",
      path: ["privacy", "websites", "trackingProtectionMode"],
      description: "Keeps Firefox tracking protection enabled in normal and private windows.",
      targets: Object.freeze({ balanced: "always", strict: "always", maximum: "always" })
    }),
    Object.freeze({
      id: "cookieConfig",
      label: "Cookie partitioning",
      group: "Websites",
      path: ["privacy", "websites", "cookieConfig"],
      description: "Rejects known tracking cookies and partitions other third-party cookies.",
      targets: Object.freeze({
        balanced: Object.freeze({ behavior: "reject_trackers_and_partition_foreign", nonPersistentCookies: false }),
        strict: Object.freeze({ behavior: "reject_trackers_and_partition_foreign", nonPersistentCookies: false }),
        maximum: Object.freeze({ behavior: "reject_trackers_and_partition_foreign", nonPersistentCookies: false })
      })
    }),
    Object.freeze({
      id: "resistFingerprinting",
      label: "Resist fingerprinting",
      group: "Fingerprinting",
      path: ["privacy", "websites", "resistFingerprinting"],
      description: "Normalizes fingerprintable browser/device characteristics. This can change site behavior and presentation.",
      targets: Object.freeze({ balanced: null, strict: true, maximum: true })
    }),
    Object.freeze({
      id: "webNotificationsDisabled",
      label: "New web notifications",
      group: "Permissions",
      path: ["browserSettings", "webNotificationsDisabled"],
      description: "Changes the global notification default to deny while preserving explicit per-site exceptions.",
      targets: Object.freeze({ balanced: null, strict: true, maximum: true })
    }),
    Object.freeze({
      id: "peerConnectionEnabled",
      label: "WebRTC peer connections",
      group: "Network",
      path: ["privacy", "network", "peerConnectionEnabled"],
      description: "Maximum mode disables RTCPeerConnection. Video calling, conferencing, and peer-to-peer web apps can stop working.",
      targets: Object.freeze({ balanced: null, strict: null, maximum: false })
    }),
    Object.freeze({
      id: "passwordSavingEnabled",
      label: "Firefox password saving",
      group: "Services",
      path: ["privacy", "services", "passwordSavingEnabled"],
      description: "Maximum mode disables offers to save passwords in Firefox. Existing saved logins are not deleted.",
      targets: Object.freeze({ balanced: null, strict: null, maximum: false })
    })
  ]);

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function deepEqual(a, b) {
    if (a === b) return true;
    try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
  }

  function resolvePath(root, path) {
    let current = root;
    for (const part of path) {
      if (current == null || !(part in current)) return null;
      current = current[part];
    }
    return current && typeof current.get === "function" ? current : null;
  }

  function targetFor(setting, profileId) {
    if (!PROFILES[profileId]) throw new Error(`Unknown hardening profile: ${profileId}`);
    return Object.prototype.hasOwnProperty.call(setting.targets, profileId) ? clone(setting.targets[profileId]) : null;
  }

  function canControl(levelOfControl) {
    return CONTROL_LEVELS.has(levelOfControl);
  }

  function normalizeExcludedSettingIds(value) {
    const input = value instanceof Set ? [...value] : Array.isArray(value) ? value : [];
    const known = new Set(SETTINGS.map((setting) => setting.id));
    return new Set(input.filter((id) => typeof id === "string" && known.has(id)));
  }

  async function inspectSetting(browserApi, setting, profileId) {
    const api = resolvePath(browserApi, setting.path);
    const target = targetFor(setting, profileId);
    if (!api) {
      return { ...setting, target, supported: false, value: null, levelOfControl: "unsupported", compliant: target == null };
    }
    try {
      const result = await api.get({});
      return {
        ...setting,
        target,
        supported: true,
        value: clone(result.value),
        levelOfControl: result.levelOfControl || "unknown",
        compliant: target == null ? true : deepEqual(result.value, target)
      };
    } catch (error) {
      return {
        ...setting,
        target,
        supported: false,
        value: null,
        levelOfControl: "unavailable",
        compliant: target == null,
        error: String(error?.message || error)
      };
    }
  }

  async function inspectAll(browserApi, profileId = "balanced") {
    const rows = [];
    for (const setting of SETTINGS) rows.push(await inspectSetting(browserApi, setting, profileId));
    return rows;
  }

  function buildChangePlan(rows, excludedSettingIds = []) {
    const excluded = normalizeExcludedSettingIds(excludedSettingIds);
    return (Array.isArray(rows) ? rows : []).map((row) => {
      let status = "change";
      if (row.target == null) status = "unchanged";
      else if (!row.supported) status = "unsupported";
      else if (row.compliant) status = "already-compliant";
      else if (!canControl(row.levelOfControl)) status = "conflict";
      const selectable = row.target != null && row.supported && canControl(row.levelOfControl);
      return {
        id: row.id,
        label: row.label,
        group: row.group,
        description: row.description,
        current: clone(row.value),
        target: clone(row.target),
        levelOfControl: row.levelOfControl,
        status,
        selectable,
        selectedByDefault: selectable && !excluded.has(row.id)
      };
    });
  }

  function score(rows, excludedSettingIds = []) {
    const excluded = normalizeExcludedSettingIds(excludedSettingIds);
    const targeted = rows.filter((row) => row.target != null && row.supported && !excluded.has(row.id));
    if (!targeted.length) return { matched: 0, total: 0, percent: 0 };
    const matched = targeted.filter((row) => row.compliant).length;
    return { matched, total: targeted.length, percent: Math.round((matched / targeted.length) * 100) };
  }

  async function applyProfile(browserApi, profileId, options = {}) {
    if (!PROFILES[profileId]) throw new Error(`Unknown hardening profile: ${profileId}`);
    const excluded = normalizeExcludedSettingIds(options.excludedSettingIds);
    const results = [];
    for (const setting of SETTINGS) {
      const target = targetFor(setting, profileId);
      if (target == null) {
        results.push({ id: setting.id, status: "unchanged" });
        continue;
      }
      if (excluded.has(setting.id)) {
        results.push({ id: setting.id, status: "excluded" });
        continue;
      }
      const api = resolvePath(browserApi, setting.path);
      if (!api) {
        results.push({ id: setting.id, status: "unsupported" });
        continue;
      }
      try {
        const current = await api.get({});
        if (deepEqual(current.value, target)) {
          results.push({ id: setting.id, status: "already-compliant", levelOfControl: current.levelOfControl });
          continue;
        }
        if (!canControl(current.levelOfControl)) {
          results.push({ id: setting.id, status: "not-controllable", levelOfControl: current.levelOfControl });
          continue;
        }
        const changed = await api.set({ value: clone(target) });
        results.push({ id: setting.id, status: changed === false ? "failed" : "applied" });
      } catch (error) {
        results.push({ id: setting.id, status: "failed", error: String(error?.message || error) });
      }
    }
    return results;
  }

  async function clearManaged(browserApi) {
    const results = [];
    for (const setting of SETTINGS) {
      const api = resolvePath(browserApi, setting.path);
      if (!api || typeof api.clear !== "function") {
        results.push({ id: setting.id, status: "unsupported" });
        continue;
      }
      try {
        const current = await api.get({});
        if (current.levelOfControl !== "controlled_by_this_extension") {
          results.push({ id: setting.id, status: "not-owned", levelOfControl: current.levelOfControl });
          continue;
        }
        const cleared = await api.clear({});
        results.push({ id: setting.id, status: cleared === false ? "failed" : "cleared" });
      } catch (error) {
        results.push({ id: setting.id, status: "failed", error: String(error?.message || error) });
      }
    }
    return results;
  }

  function policyFor(profileId, excludedSettingIds = []) {
    if (!PROFILES[profileId]) throw new Error(`Unknown hardening profile: ${profileId}`);
    const strict = profileId !== "balanced";
    const maximum = profileId === "maximum";
    const excluded = normalizeExcludedSettingIds(excludedSettingIds);
    const policies = {
      DisableFirefoxStudies: true,
      DisableTelemetry: true,
      HttpsOnlyMode: "enabled"
    };

    if (!excluded.has("networkPredictionEnabled")) policies.NetworkPrediction = false;
    if (!excluded.has("cookieConfig")) {
      policies.Cookies = {
        Behavior: "reject-tracker-and-partition-foreign",
        BehaviorPrivateBrowsing: "reject-tracker-and-partition-foreign",
        Locked: false
      };
    }
    if (!excluded.has("trackingProtectionMode")) {
      policies.EnableTrackingProtection = {
        Value: true,
        Locked: false,
        Cryptomining: true,
        Fingerprinting: true,
        EmailTracking: true,
        Category: strict ? "strict" : "standard"
      };
    }
    if (strict && !excluded.has("webNotificationsDisabled")) {
      policies.Permissions = {
        Notifications: {
          BlockNewRequests: true,
          Locked: false
        }
      };
    }

    const preferences = {};
    if (strict && !excluded.has("resistFingerprinting")) {
      preferences["privacy.resistFingerprinting"] = { Value: true, Status: "default" };
    }
    if (maximum && !excluded.has("peerConnectionEnabled")) {
      preferences["media.peerconnection.enabled"] = { Value: false, Status: "default" };
    }
    if (maximum && !excluded.has("passwordSavingEnabled")) {
      preferences["signon.rememberSignons"] = { Value: false, Status: "default" };
    }
    if (Object.keys(preferences).length) policies.Preferences = preferences;

    return { policies };
  }

  function serializePolicy(profileId, excludedSettingIds = []) {
    return `${JSON.stringify(policyFor(profileId, excludedSettingIds), null, 2)}\n`;
  }

  function formatValue(value) {
    if (value == null) return "—";
    if (typeof value === "boolean") return value ? "On" : "Off";
    if (typeof value === "string") return value.replaceAll("_", " ");
    if (typeof value === "object" && value.behavior) return value.behavior.replaceAll("_", " ");
    try { return JSON.stringify(value); } catch { return String(value); }
  }

  const api = Object.freeze({
    PROFILE_ORDER,
    PROFILES,
    SETTINGS,
    applyProfile,
    buildChangePlan,
    canControl,
    clearManaged,
    deepEqual,
    formatValue,
    inspectAll,
    inspectSetting,
    normalizeExcludedSettingIds,
    policyFor,
    resolvePath,
    score,
    serializePolicy,
    targetFor
  });

  globalThis.FirefoxHardeningCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
