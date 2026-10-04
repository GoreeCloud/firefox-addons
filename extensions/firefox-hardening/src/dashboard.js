(() => {
  "use strict";
  const H = globalThis.FirefoxHardeningCore;
  let selectedProfile = "balanced";
  let excludedSettingIds = [];
  let previewProfileId = null;
  let previewPlan = [];

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
    if (row.target != null && excludedSettingIds.includes(row.id)) return "status-neutral";
    if (!row.supported && row.target != null) return "status-warn";
    if (row.target == null) return "status-neutral";
    if (row.compliant) return "status-good";
    if (!H.canControl(row.levelOfControl)) return "status-warn";
    return "status-action";
  }

  function statusText(row) {
    if (row.target != null && excludedSettingIds.includes(row.id)) return "Opted out";
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
    const optOutCount = excludedSettingIds.length;
    $("#selectedBadge").textContent = optOutCount
      ? `${profile.label} · ${optOutCount} opt-out${optOutCount === 1 ? "" : "s"}`
      : profile.label;
    $("#profileDescription").textContent = profile.summary;
    $("#policyOutput").value = H.serializePolicy(selectedProfile, excludedSettingIds);
    renderCompatibility();
    renderDeploymentGuide();
    if ($("#policyAuditInput")?.value.trim()) auditPolicy(true);
    for (const button of document.querySelectorAll("[data-profile]")) {
      button.dataset.active = String(button.dataset.profile === selectedProfile);
    }
  }

  function renderCompatibility() {
    const list = $("#compatibilityList");
    if (!list) return;
    const diagnostics = H.compatibilityDiagnostics(selectedProfile, excludedSettingIds);
    list.textContent = "";
    $("#compatibilityBadge").textContent = diagnostics.length
      ? `${diagnostics.length} warning${diagnostics.length === 1 ? "" : "s"}`
      : "No elevated warnings";

    if (!diagnostics.length) {
      const empty = document.createElement("p");
      empty.className = "muted small-text";
      empty.textContent = "The selected profile has no elevated compatibility warnings beyond its documented baseline.";
      list.append(empty);
      return;
    }

    for (const item of diagnostics) {
      const article = document.createElement("article");
      article.className = `diagnostic-card severity-${item.severity}`;
      const heading = document.createElement("div");
      heading.className = "diagnostic-heading";
      const title = document.createElement("strong");
      title.textContent = item.title;
      const badge = document.createElement("span");
      badge.className = "state-pill status-warn";
      badge.textContent = item.severity === "high" ? "High impact" : "Review";
      heading.append(title, badge);
      const detail = document.createElement("p");
      detail.className = "muted small-text";
      detail.textContent = item.detail;
      article.append(heading, detail);
      list.append(article);
    }
  }

  function renderDeploymentGuide() {
    const output = $("#deploymentOutput");
    const platform = $("#deploymentPlatform");
    if (!output || !platform) return;
    output.value = H.deploymentGuide(platform.value, selectedProfile, excludedSettingIds);
  }

  function renderPolicyDiff(entries) {
    const list = $("#policyDiffList");
    list.textContent = "";
    const summary = H.summarizePolicyDiff(entries);
    $("#policyAuditSummary").textContent = summary.differences
      ? `${summary.differences} difference${summary.differences === 1 ? "" : "s"}`
      : "Matches selected profile";

    const differences = entries.filter((entry) => entry.status !== "match");
    if (!differences.length) {
      const exact = document.createElement("p");
      exact.className = "muted small-text";
      exact.textContent = `All ${summary.match} compared policy values match the selected profile.`;
      list.append(exact);
      return;
    }

    for (const entry of differences) {
      const row = document.createElement("article");
      row.className = `policy-diff-row diff-${entry.status}`;
      const heading = document.createElement("div");
      heading.className = "diagnostic-heading";
      const path = document.createElement("strong");
      path.textContent = entry.path;
      const status = document.createElement("span");
      status.className = "state-pill status-warn";
      status.textContent = ({
        different: "Different",
        missing: "Missing",
        extra: "Extra"
      })[entry.status] || entry.status;
      heading.append(path, status);

      const values = document.createElement("small");
      values.className = "policy-diff-values";
      values.textContent = `Expected: ${H.formatValue(entry.expected)} · Existing: ${H.formatValue(entry.imported)}`;
      row.append(heading, values);
      list.append(row);
    }
  }

  function auditPolicy(quiet = false) {
    const input = $("#policyAuditInput");
    if (!input?.value.trim()) {
      $("#policyAuditSummary").textContent = "No policy loaded";
      $("#policyDiffList").textContent = "";
      if (!quiet) $("#status").textContent = "Paste a policies.json document before auditing.";
      return;
    }
    try {
      const entries = H.policyDiff(selectedProfile, input.value, excludedSettingIds);
      renderPolicyDiff(entries);
      if (!quiet) {
        const summary = H.summarizePolicyDiff(entries);
        $("#status").textContent = summary.differences
          ? `Policy audit found ${summary.differences} difference(s). Nothing was applied.`
          : "Existing policy matches the selected profile. Nothing was applied.";
      }
    } catch (error) {
      $("#policyAuditSummary").textContent = "Invalid policy";
      $("#policyDiffList").textContent = "";
      if (!quiet) $("#status").textContent = `Could not audit policy: ${error.message || error}`;
    }
  }

  async function loadPolicyFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      $("#policyAuditInput").value = await file.text();
      auditPolicy(false);
    } catch (error) {
      $("#policyAuditSummary").textContent = "Could not read file";
      $("#status").textContent = `Could not read policy file: ${error.message || error}`;
    }
  }

  function clearPolicyAudit() {
    $("#policyAuditInput").value = "";
    $("#policyFile").value = "";
    $("#policyDiffList").textContent = "";
    $("#policyAuditSummary").textContent = "No policy loaded";
    $("#status").textContent = "Policy audit cleared.";
  }

  async function copyDeployment() {
    await navigator.clipboard.writeText($("#deploymentOutput").value);
    $("#status").textContent = "Copied the platform deployment guide.";
  }

  async function refresh() {
    updateProfilePresentation();
    const rows = await H.inspectAll(browser, selectedProfile);
    renderRows(rows);
    const result = H.score(rows, excludedSettingIds);
    $("#score").textContent = String(result.percent);
    const optOutText = excludedSettingIds.length
      ? ` · ${excludedSettingIds.length} saved opt-out${excludedSettingIds.length === 1 ? "" : "s"}`
      : "";
    $("#scoreSummary").textContent = `${result.matched} of ${result.total} selected profile targets currently match${optOutText}.`;
    const owned = rows.filter((row) => row.levelOfControl === "controlled_by_this_extension").length;
    const conflicts = rows.filter((row) => row.target != null && row.supported && !row.compliant && !H.canControl(row.levelOfControl)).length;
    $("#controlSummary").textContent = conflicts ? `${owned} owned · ${conflicts} conflict(s)` : `${owned} setting(s) currently owned by this extension`;
  }

  async function loadState() {
    try {
      const stored = await browser.storage.local.get([
        "selectedProfile",
        "hardeningExcludedSettingIds",
        "pendingProfilePreview",
        "hardeningOnboardingComplete"
      ]);
      if (H.PROFILES[stored.selectedProfile]) selectedProfile = stored.selectedProfile;
      excludedSettingIds = [...H.normalizeExcludedSettingIds(stored.hardeningExcludedSettingIds || [])].sort();
      $("#onboardingPanel").hidden = stored.hardeningOnboardingComplete === true;
      if (H.PROFILES[stored.pendingProfilePreview]) previewProfileId = stored.pendingProfilePreview;
      if (previewProfileId) await browser.storage.local.remove("pendingProfilePreview");
    } catch {
      $("#onboardingPanel").hidden = false;
    }
  }

  function previewStatusText(item) {
    return ({
      change: "Will change",
      conflict: "Controlled elsewhere",
      unsupported: "Unavailable in this Firefox",
      "already-compliant": "Already matches",
      unchanged: "Not part of this profile"
    })[item.status] || item.status;
  }

  function renderPreview() {
    const panel = $("#previewPanel");
    const list = $("#previewList");
    const profile = H.PROFILES[previewProfileId];
    list.textContent = "";
    const targets = previewPlan.filter((item) => item.target != null);
    const changes = targets.filter((item) => item.status === "change").length;
    const conflicts = targets.filter((item) => item.status === "conflict").length;
    $("#previewTitle").textContent = `Review ${profile.label}`;
    $("#previewBadge").textContent = "No changes applied";
    $("#previewSummary").textContent = `${changes} setting(s) can change now · ${conflicts} conflict(s). Uncheck any setting you do not want Browser Hardening to manage.`;
    $("#previewRisk").textContent = profile.risk === "high"
      ? "Maximum can break WebRTC calling/conferencing and disable Firefox password-saving offers."
      : profile.summary;

    for (const item of targets) {
      const row = document.createElement("label");
      row.className = "review-row";
      const check = document.createElement("input");
      check.type = "checkbox";
      check.dataset.settingId = item.id;
      check.disabled = !item.selectable;
      check.checked = item.selectedByDefault;
      const copy = document.createElement("span");
      copy.className = "review-copy";
      const heading = document.createElement("strong");
      heading.textContent = item.label;
      const details = document.createElement("small");
      details.textContent = `${H.formatValue(item.current)} → ${H.formatValue(item.target)} · ${previewStatusText(item)}`;
      copy.append(heading, details);
      row.append(check, copy);
      list.append(row);
    }
    panel.hidden = false;
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function startPreview(profileId) {
    const profile = H.PROFILES[profileId];
    if (!profile) return;
    setBusy(true);
    $("#status").textContent = `Preparing ${profile.label} review…`;
    try {
      previewProfileId = profileId;
      const rows = await H.inspectAll(browser, profileId);
      previewPlan = H.buildChangePlan(rows, excludedSettingIds);
      renderPreview();
      $("#status").textContent = "Review ready. No Firefox setting has changed.";
    } catch (error) {
      $("#status").textContent = `Could not prepare review: ${error.message || error}`;
    } finally {
      setBusy(false);
    }
  }

  function cancelPreview() {
    previewProfileId = null;
    previewPlan = [];
    $("#previewPanel").hidden = true;
    $("#status").textContent = "Review canceled. No Firefox setting changed.";
  }

  async function applyPreview() {
    if (!previewProfileId) return;
    const profile = H.PROFILES[previewProfileId];
    const nextExcluded = new Set(excludedSettingIds);
    for (const item of previewPlan) {
      if (!item.selectable) continue;
      const checkbox = document.querySelector(`#previewList input[data-setting-id="${item.id}"]`);
      if (checkbox?.checked) nextExcluded.delete(item.id);
      else nextExcluded.add(item.id);
    }

    setBusy(true);
    $("#status").textContent = `Applying reviewed ${profile.label} changes…`;
    try {
      const exclusions = [...nextExcluded].sort();
      const results = await H.applyProfile(browser, previewProfileId, { excludedSettingIds: exclusions });
      selectedProfile = previewProfileId;
      excludedSettingIds = exclusions;
      await browser.storage.local.set({
        selectedProfile,
        hardeningExcludedSettingIds: excludedSettingIds,
        hardeningOnboardingComplete: true
      });
      const applied = results.filter((item) => item.status === "applied").length;
      const conflicts = results.filter((item) => item.status === "not-controllable").length;
      const failures = results.filter((item) => item.status === "failed").length;
      const excluded = results.filter((item) => item.status === "excluded").length;
      previewProfileId = null;
      previewPlan = [];
      $("#previewPanel").hidden = true;
      $("#onboardingPanel").hidden = true;
      $("#status").textContent = `${profile.label}: ${applied} changed, ${excluded} opted out, ${conflicts} conflict(s), ${failures} failure(s).`;
      await refresh();
    } catch (error) {
      $("#status").textContent = `Could not apply reviewed profile: ${error.message || error}`;
    } finally {
      setBusy(false);
    }
  }

  async function finishOnboarding() {
    await browser.storage.local.set({ hardeningOnboardingComplete: true });
    $("#onboardingPanel").hidden = true;
    $("#status").textContent = "First-use guidance dismissed. Profiles still require review before application.";
  }

  async function restore() {
    if (!confirm("Release all browser settings currently controlled by GoreeCloud Browser Hardening? Firefox will fall back to the next controlling source or its defaults.")) return;
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

  document.querySelectorAll("[data-profile]").forEach((button) => button.addEventListener("click", () => startPreview(button.dataset.profile)));
  $("#rescan").addEventListener("click", refresh);
  $("#restore").addEventListener("click", restore);
  $("#copyPolicy").addEventListener("click", copyPolicy);
  $("#downloadPolicy").addEventListener("click", downloadPolicy);
  $("#auditPolicy").addEventListener("click", () => auditPolicy(false));
  $("#policyFile").addEventListener("change", loadPolicyFile);
  $("#clearPolicyAudit").addEventListener("click", clearPolicyAudit);
  $("#deploymentPlatform").addEventListener("change", renderDeploymentGuide);
  $("#copyDeployment").addEventListener("click", copyDeployment);
  $("#previewApply").addEventListener("click", applyPreview);
  $("#previewCancel").addEventListener("click", cancelPreview);
  $("#onboardingReview").addEventListener("click", () => startPreview("balanced"));
  $("#onboardingDismiss").addEventListener("click", finishOnboarding);

  (async () => {
    await loadState();
    await refresh();
    if (previewProfileId) await startPreview(previewProfileId);
  })();
})();
