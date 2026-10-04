(() => {
  "use strict";

  const C = globalThis.PrivacyShieldCore;

  const PROFILE_KEYS = Object.freeze([
    "stripTrackingParams",
    "cleanLinks",
    "bypassRedirects",
    "disablePing",
    "stripETags",
    "blockAds",
    "blockTrackers",
    "blockMalware",
    "blockMiners",
    "blockPopups",
    "blockAnnoyances",
    "cosmeticFiltering",
    "localResources",
    "blockThirdPartyScripts",
    "blockThirdPartyFrames",
    "blockMedia"
  ]);

  const PROFILES = Object.freeze({
    standard: Object.freeze({
      label: "Standard",
      description: "Use your normal Privacy Shield settings for this site.",
      values: null
    }),
    strict: Object.freeze({
      label: "Strict",
      description: "Add third-party script and frame blocking while keeping normal privacy protections enabled.",
      values: Object.freeze({
        stripTrackingParams: true,
        cleanLinks: true,
        bypassRedirects: true,
        disablePing: true,
        stripETags: true,
        blockAds: true,
        blockTrackers: true,
        blockMalware: true,
        blockMiners: true,
        blockPopups: true,
        blockAnnoyances: false,
        cosmeticFiltering: true,
        localResources: true,
        blockThirdPartyScripts: true,
        blockThirdPartyFrames: true,
        blockMedia: false
      })
    }),
    lockdown: Object.freeze({
      label: "Lockdown",
      description: "Enable the strongest built-in site protections, including third-party script/frame blocking, media blocking, cosmetic filtering, and reviewed annoyance controls. Use when breakage is acceptable.",
      values: Object.freeze({
        stripTrackingParams: true,
        cleanLinks: true,
        bypassRedirects: true,
        disablePing: true,
        stripETags: true,
        blockAds: true,
        blockTrackers: true,
        blockMalware: true,
        blockMiners: true,
        blockPopups: true,
        blockAnnoyances: true,
        cosmeticFiltering: true,
        localResources: true,
        blockThirdPartyScripts: true,
        blockThirdPartyFrames: true,
        blockMedia: true
      })
    }),
    compatible: Object.freeze({
      label: "Compatible",
      description: "Keep tracker, malware, URL, ping, and ETag protections while reducing page-altering behavior.",
      values: Object.freeze({
        stripTrackingParams: true,
        cleanLinks: true,
        bypassRedirects: true,
        disablePing: true,
        stripETags: true,
        blockAds: true,
        blockTrackers: true,
        blockMalware: true,
        blockMiners: true,
        blockPopups: true,
        blockAnnoyances: false,
        cosmeticFiltering: false,
        localResources: false,
        blockThirdPartyScripts: false,
        blockThirdPartyFrames: false,
        blockMedia: false
      })
    })
  });

  function normalizeHost(hostname) {
    return C?.normalizeHostname ? C.normalizeHostname(hostname) : String(hostname || "").trim().toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  }

  function profileFor(settings, hostname) {
    const host = normalizeHost(hostname);
    const override = settings?.siteOverrides?.[host];
    if (!override) return "standard";
    if (!PROFILE_KEYS.some((key) => Object.prototype.hasOwnProperty.call(override, key))) return "standard";
    for (const name of ["lockdown", "strict", "compatible"]) {
      const values = PROFILES[name].values;
      if (PROFILE_KEYS.every((key) => override[key] === values[key])) return name;
    }
    return "custom";
  }

  function applyProfile(settings, hostname, profileName) {
    const host = normalizeHost(hostname);
    if (!host || !(profileName in PROFILES)) return settings;
    const next = { ...(settings || {}) };
    const siteOverrides = { ...(next.siteOverrides || {}) };
    const previous = { ...(siteOverrides[host] || {}) };
    const enabledWasExplicit = Object.prototype.hasOwnProperty.call(previous, "enabled");
    const enabled = previous.enabled;

    for (const key of PROFILE_KEYS) delete previous[key];
    const values = PROFILES[profileName].values;
    if (values) Object.assign(previous, values);
    if (enabledWasExplicit) previous.enabled = enabled;

    if (Object.keys(previous).length) siteOverrides[host] = previous;
    else delete siteOverrides[host];
    next.siteOverrides = siteOverrides;
    return next;
  }

  function resetSite(settings, hostname) {
    const host = normalizeHost(hostname);
    if (!host) return settings;
    const next = { ...(settings || {}) };
    const siteOverrides = { ...(next.siteOverrides || {}) };
    delete siteOverrides[host];
    next.siteOverrides = siteOverrides;
    return next;
  }

  globalThis.PrivacyShieldSiteProfiles = Object.freeze({
    PROFILE_KEYS,
    PROFILES,
    profileFor,
    applyProfile,
    resetSite
  });
})();
