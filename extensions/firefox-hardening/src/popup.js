(() => {
  "use strict";
  const H = globalThis.FirefoxHardeningCore;
  let selectedProfile = "balanced";
  let excludedSettingIds = [];

  const $ = (selector) => document.querySelector(selector);

  async function loadSelectedProfile() {
    try {
      const stored = await browser.storage.local.get(["selectedProfile", "hardeningExcludedSettingIds"]);
      if (H.PROFILES[stored.selectedProfile]) selectedProfile = stored.selectedProfile;
      excludedSettingIds = [...H.normalizeExcludedSettingIds(stored.hardeningExcludedSettingIds || [])].sort();
    } catch {}
  }

  function setBusy(busy) {
    for (const button of document.querySelectorAll("button")) button.disabled = busy;
  }

  function updateProfileText() {
    const profile = H.PROFILES[selectedProfile];
    $("#profileLabel").textContent = profile.label;
    $("#profileHelp").textContent = profile.summary;
    for (const button of document.querySelectorAll("[data-profile]")) {
      button.dataset.active = String(button.dataset.profile === selectedProfile);
    }
  }

  async function refresh() {
    updateProfileText();
    const rows = await H.inspectAll(browser, selectedProfile);
    const result = H.score(rows, excludedSettingIds);
    $("#score").textContent = String(result.percent);
    $("#scoreRing").style.setProperty("--score", `${result.percent * 3.6}deg`);
    const blocked = rows.filter((row) => row.target != null && row.supported && !row.compliant && !H.canControl(row.levelOfControl)).length;
    $("#scoreText").textContent = blocked
      ? `${result.matched}/${result.total} targets match; ${blocked} controlled elsewhere.`
      : `${result.matched}/${result.total} available targets match.`;
  }

  async function chooseProfile(profileId) {
    const profile = H.PROFILES[profileId];
    if (!profile) return;
    setBusy(true);
    $("#status").textContent = `Opening ${profile.label} review…`;
    try {
      await browser.storage.local.set({ pendingProfilePreview: profileId });
      await browser.runtime.openOptionsPage();
      $("#status").textContent = "Review opened. No Firefox setting changed from the popup.";
    } catch (error) {
      $("#status").textContent = `Could not open review: ${error.message || error}`;
    } finally {
      setBusy(false);
    }
  }

  document.querySelectorAll("[data-profile]").forEach((button) => {
    button.addEventListener("click", () => chooseProfile(button.dataset.profile));
  });
  $("#rescan").addEventListener("click", refresh);
  $("#openDashboard").addEventListener("click", () => browser.runtime.openOptionsPage());

  (async () => {
    await loadSelectedProfile();
    await refresh();
  })();
})();
