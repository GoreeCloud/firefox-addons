(() => {
  "use strict";
  const H = globalThis.FirefoxHardeningCore;
  let selectedProfile = "balanced";

  const $ = (selector) => document.querySelector(selector);

  function setBusy(busy) {
    for (const button of document.querySelectorAll("button")) button.disabled = busy;
  }

  function controlLabel(value) {
    return ({
      controllable_by_this_extension: "Available",
      controlled_by_this_extension: "GoreeCloud",
      controlled_by_other_extensions: "Other extension",
      not_controllable: "Locked",
      unsupported: "Unsupported",
      unavailable: "Unavailable"
    })[value] || value || "Unknown";
  }

  function statusClass(row) {
    if (!row.supported && row.target != null) return "status-warn";
    if (row.target == null) return "status-neutral";
    if (row.compliant) return "status-good";
    if (!H.canControl(row.levelOfControl)) return "status-warn";
    return "status-action";
  }

  function statusText(row) {
    if (!row.supported && row.target != null) return "Unavailable";
    if (row.target == null) return "Not changed";
    if (row.compliant) return "Matches";
    if (!H.canControl(row.levelOfControl)) return "Conflict";
    return "Ready to apply";
  }

  function renderRows(rows) {
    const body = $("#settingsBody");
    body.textContent = "";
    for (const row of rows) {
      const tr = document.createElement("tr");
      const title = document.createElement("td");
      const titleStrong = document.createElement("strong");
      titleStrong.textContent = row.label;
      const titleDetails = document.createElement("small");
      titleDetails.textContent = `${row.group} · ${row.description}`;
      title.append(titleStrong, titleDetails);
      const current = document.createElement("td");
      current.textContent = row.supported ? H.formatValue(row.value) : "—";
      const target = document.createElement("td");
      target.textContent = row.target == null ? "Unchanged" : H.formatValue(row.target);
      const control = document.createElement("td");
      control.textContent = controlLabel(row.levelOfControl);
      const state = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = `state-pill ${statusClass(row)}`;
      badge.textContent = statusText(row);
      state.append(badge);
      tr.append(title, current, target, control, state);
      body.append(tr);
    }
  }

  function updateProfilePresentation() {
    const profile = H.PROFILES[selectedProfile];
    $("#selectedBadge").textContent = profile.label;
    $("#profileDescription").textContent = profile.summary;
    $("#policyOutput").value = H.serializePolicy(selectedProfile);
    for (const button of document.querySelectorAll("[data-profile]")) {
      button.dataset.active = String(button.dataset.profile === selectedProfile);
    }
  }

  async function refresh() {
    updateProfilePresentation();
    const rows = await H.inspectAll(browser, selectedProfile);
    renderRows(rows);
    const result = H.score(rows);
    $("#score").textContent = String(result.percent);
    $("#scoreSummary").textContent = `${result.matched} of ${result.total} available profile targets currently match.`;
    const owned = rows.filter((row) => row.levelOfControl === "controlled_by_this_extension").length;
    const conflicts = rows.filter((row) => row.target != null && row.supported && !row.compliant && !H.canControl(row.levelOfControl)).length;
    $("#controlSummary").textContent = conflicts ? `${owned} owned · ${conflicts} conflict(s)` : `${owned} setting(s) currently owned by this extension`;
  }

  async function loadSelectedProfile() {
    try {
      const stored = await browser.storage.local.get("selectedProfile");
      if (H.PROFILES[stored.selectedProfile]) selectedProfile = stored.selectedProfile;
    } catch {}
  }

  async function apply(profileId) {
    const profile = H.PROFILES[profileId];
    if (!profile) return;
    if (profileId === "maximum" && !confirm("Maximum mode can break WebRTC-based calling/conferencing and disables Firefox password-saving prompts. Continue?")) return;
    setBusy(true);
    $("#status").textContent = `Applying ${profile.label}…`;
    try {
      const results = await H.applyProfile(browser, profileId);
      selectedProfile = profileId;
      await browser.storage.local.set({ selectedProfile });
      const applied = results.filter((item) => item.status === "applied").length;
      const conflicts = results.filter((item) => item.status === "not-controllable").length;
      const failures = results.filter((item) => item.status === "failed").length;
      $("#status").textContent = `${profile.label}: ${applied} changed, ${conflicts} conflict(s), ${failures} failure(s).`;
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    if (!confirm("Release all browser settings currently controlled by GoreeCloud Firefox Hardening? Firefox will fall back to the next controlling source or its defaults.")) return;
    setBusy(true);
    $("#status").textContent = "Restoring extension-controlled settings…";
    try {
      const results = await H.clearManaged(browser);
      const cleared = results.filter((item) => item.status === "cleared").length;
      $("#status").textContent = `Released ${cleared} setting(s).`;
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function copyPolicy() {
    await navigator.clipboard.writeText($("#policyOutput").value);
    $("#status").textContent = "Copied generated policies.json to the clipboard.";
  }

  function downloadPolicy() {
    const blob = new Blob([$("#policyOutput").value], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "policies.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    $("#status").textContent = "Saved generated policies.json.";
  }

  document.querySelectorAll("[data-profile]").forEach((button) => button.addEventListener("click", () => apply(button.dataset.profile)));
  $("#rescan").addEventListener("click", refresh);
  $("#restore").addEventListener("click", restore);
  $("#copyPolicy").addEventListener("click", copyPolicy);
  $("#downloadPolicy").addEventListener("click", downloadPolicy);

  (async () => {
    await loadSelectedProfile();
    await refresh();
  })();
})();
