const test = require("node:test");
const assert = require("node:assert/strict");
const H = require("../src/hardening.js");

class FakeSetting {
  constructor(value, levelOfControl = "controllable_by_this_extension") {
    this.value = value;
    this.defaultValue = structuredClone(value);
    this.levelOfControl = levelOfControl;
    this.setCalls = [];
    this.clearCalls = 0;
  }
  async get() { return { value: structuredClone(this.value), levelOfControl: this.levelOfControl }; }
  async set({ value }) {
    if (!H.canControl(this.levelOfControl)) return false;
    this.value = structuredClone(value);
    this.levelOfControl = "controlled_by_this_extension";
    this.setCalls.push(structuredClone(value));
    return true;
  }
  async clear() {
    this.clearCalls += 1;
    this.value = structuredClone(this.defaultValue);
    this.levelOfControl = "controllable_by_this_extension";
    return true;
  }
}

function fakeBrowser() {
  return {
    privacy: {
      network: {
        networkPredictionEnabled: new FakeSetting(true),
        peerConnectionEnabled: new FakeSetting(true)
      },
      websites: {
        hyperlinkAuditingEnabled: new FakeSetting(true),
        trackingProtectionMode: new FakeSetting("private_browsing"),
        cookieConfig: new FakeSetting({ behavior: "allow_all", nonPersistentCookies: false }),
        resistFingerprinting: new FakeSetting(false)
      },
      services: {
        passwordSavingEnabled: new FakeSetting(true)
      }
    },
    browserSettings: {
      webNotificationsDisabled: new FakeSetting(false)
    }
  };
}

test("balanced applies only low-breakage targets", async () => {
  const browser = fakeBrowser();
  const results = await H.applyProfile(browser, "balanced");
  assert.equal(browser.privacy.network.networkPredictionEnabled.value, false);
  assert.equal(browser.privacy.websites.hyperlinkAuditingEnabled.value, false);
  assert.equal(browser.privacy.websites.trackingProtectionMode.value, "always");
  assert.deepEqual(browser.privacy.websites.cookieConfig.value, {
    behavior: "reject_trackers_and_partition_foreign",
    nonPersistentCookies: false
  });
  assert.equal(browser.privacy.websites.resistFingerprinting.value, false);
  assert.equal(browser.browserSettings.webNotificationsDisabled.value, false);
  assert.equal(browser.privacy.network.peerConnectionEnabled.value, true);
  assert.equal(browser.privacy.services.passwordSavingEnabled.value, true);
  assert.equal(results.filter((item) => item.status === "applied").length, 4);
});

test("strict adds RFP and web notification protection", async () => {
  const browser = fakeBrowser();
  await H.applyProfile(browser, "strict");
  assert.equal(browser.privacy.websites.resistFingerprinting.value, true);
  assert.equal(browser.browserSettings.webNotificationsDisabled.value, true);
  assert.equal(browser.privacy.network.peerConnectionEnabled.value, true);
});

test("maximum disables WebRTC and password saving", async () => {
  const browser = fakeBrowser();
  await H.applyProfile(browser, "maximum");
  assert.equal(browser.privacy.network.peerConnectionEnabled.value, false);
  assert.equal(browser.privacy.services.passwordSavingEnabled.value, false);
});

test("settings controlled elsewhere are never overwritten", async () => {
  const browser = fakeBrowser();
  browser.privacy.network.networkPredictionEnabled.levelOfControl = "controlled_by_other_extensions";
  const results = await H.applyProfile(browser, "balanced");
  assert.equal(browser.privacy.network.networkPredictionEnabled.value, true);
  assert.equal(browser.privacy.network.networkPredictionEnabled.setCalls.length, 0);
  assert.equal(results.find((item) => item.id === "networkPredictionEnabled").status, "not-controllable");
});

test("change preview identifies selectable changes, conflicts, and already-compliant targets", async () => {
  const browser = fakeBrowser();
  browser.privacy.network.networkPredictionEnabled.value = false;
  browser.privacy.websites.hyperlinkAuditingEnabled.levelOfControl = "controlled_by_other_extensions";
  const rows = await H.inspectAll(browser, "balanced");
  const plan = H.buildChangePlan(rows);
  assert.equal(plan.find((item) => item.id === "networkPredictionEnabled").status, "already-compliant");
  assert.equal(plan.find((item) => item.id === "hyperlinkAuditingEnabled").status, "conflict");
  assert.equal(plan.find((item) => item.id === "trackingProtectionMode").status, "change");
  assert.equal(plan.find((item) => item.id === "trackingProtectionMode").selectable, true);
  assert.equal(plan.find((item) => item.id === "resistFingerprinting").status, "unchanged");
});

test("per-setting opt-out excludes only reviewed targets and rejects unknown IDs", async () => {
  const browser = fakeBrowser();
  const results = await H.applyProfile(browser, "balanced", {
    excludedSettingIds: ["networkPredictionEnabled", "cookieConfig"]
  });
  assert.equal(browser.privacy.network.networkPredictionEnabled.value, true);
  assert.equal(browser.privacy.websites.hyperlinkAuditingEnabled.value, false);
  assert.deepEqual(browser.privacy.websites.cookieConfig.value, { behavior: "allow_all", nonPersistentCookies: false });
  assert.equal(results.find((item) => item.id === "networkPredictionEnabled").status, "excluded");
  assert.equal(results.find((item) => item.id === "cookieConfig").status, "excluded");
  await assert.rejects(
    () => H.applyProfile(browser, "balanced", { excludedSettingIds: ["not-a-setting"] }),
    /Unknown hardening setting/
  );
});

test("restore clears only values owned by this extension", async () => {
  const browser = fakeBrowser();
  await H.applyProfile(browser, "strict");
  browser.privacy.services.passwordSavingEnabled.levelOfControl = "controlled_by_other_extensions";
  const results = await H.clearManaged(browser);
  assert.equal(results.find((item) => item.id === "passwordSavingEnabled").status, "not-owned");
  assert.equal(browser.privacy.network.networkPredictionEnabled.clearCalls, 1);
  assert.equal(browser.privacy.network.networkPredictionEnabled.value, true);
});

test("score counts only available targets", async () => {
  const browser = fakeBrowser();
  await H.applyProfile(browser, "balanced");
  const rows = await H.inspectAll(browser, "balanced");
  assert.deepEqual(H.score(rows), { matched: 4, total: 4, percent: 100 });
});

test("policy output is native policies.json and profile-aware", () => {
  const balanced = H.policyFor("balanced");
  assert.equal(balanced.policies.DisableTelemetry, true);
  assert.equal(balanced.policies.NetworkPrediction, false);
  assert.equal(balanced.policies.HttpsOnlyMode, "enabled");
  assert.equal(balanced.policies.EnableTrackingProtection.Category, "standard");
  assert.equal(balanced.policies.Preferences, undefined);

  const strict = H.policyFor("strict");
  assert.equal(strict.policies.EnableTrackingProtection.Category, "strict");
  assert.equal(strict.policies.Permissions.Notifications.BlockNewRequests, true);
  assert.equal(strict.policies.Preferences["privacy.resistFingerprinting"].Value, true);

  const maximum = H.policyFor("maximum");
  assert.equal(maximum.policies.Preferences["media.peerconnection.enabled"].Value, false);
  assert.equal(maximum.policies.Preferences["signon.rememberSignons"].Value, false);
});
