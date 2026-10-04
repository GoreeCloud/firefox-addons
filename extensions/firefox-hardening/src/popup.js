(() => {
  "use strict";
  const H = globalThis.FirefoxHardeningCore;
  let selectedProfile = "balanced";

  const $ = (selector) => document.querySelector(selector);

  async function loadSelectedProfile() {
    try {
      const stored = await browser.storage.local.get("selectedProfile");
      if (H.PROFILES[stored.selectedProfile]) selectedProfile = stored.selectedProfile;
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
    const result = H.score(rows);
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
    if (profileId === "maximum" && !confirm("Maximum mode can break video calls and disables Firefox password-saving prompts. Apply it anyway?")) return;
    setBusy(true);
    $("#status").textContent = `Applying ${profile.label}…`;
    try {
      const results = await H.applyProfile(browser, profileId);
      selectedProfile = profileId;
      await browser.storage.local.set({ selectedProfile });
      const changed = results.filter((item) => item.status === "applied").length;
      const blocked = results.filter((item) => item.status === "not-controllable").length;
      $("#status").textContent = blocked
        ? `${changed} changed; ${blocked} setting(s) are controlled elsewhere.`
        : `${profile.label} applied. ${changed} setting(s) changed.`;
      await refresh();
    } catch (error) {
      $("#status").textContent = `Could not apply profile: ${error.message || error}`;
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
