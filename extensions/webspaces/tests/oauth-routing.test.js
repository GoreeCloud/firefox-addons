import test from "node:test";
import assert from "node:assert/strict";
import {
  OAUTH_HANDOFF_TTL_MS,
  createOAuthNavigationGuard,
  parseOAuthAuthorization
} from "../src/oauth-routing.js";

const authorization = "https://todoist.com/oauth/authorize?response_type=code&client_id=librechat&state=secret-state&code_challenge=secret-pkce&redirect_uri=https%3A%2F%2Fai.goreecloud.com%2Fapi%2Fmcp%2Ftodoist%2Foauth%2Fcallback";
const callback = "https://ai.goreecloud.com/api/mcp/todoist/oauth/callback?code=secret-code&state=secret-state";
const origin = { id: 10, cookieStoreId: "firefox-container-goreecloud", url: "https://ai.goreecloud.com/c/new" };
const current = { id: 11, cookieStoreId: "firefox-default", openerTabId: 10, windowId: 1, index: 3, active: true, pinned: false, url: "about:blank" };
const config = { routingEnabled: true, defaultWebspaceId: "standard",
  webspaces: { standard: { id: "standard" } }, userRules: [], exceptions: [] };

function makeBrowser(tabs) {
  const states = new Map(tabs.map(t => [t.id, { ...t }]));
  const calls = [];
  let nextId = 200;
  const api = {
    tabs: {
      async get(id) {
        calls.push(["get", id]);
        if (!states.has(id)) throw new Error("tab missing");
        return { ...states.get(id) };
      },
      async create(properties) {
        const id = nextId++;
        states.set(id, { ...properties, id });
        calls.push(["create", { ...properties }]);
        return { ...states.get(id) };
      },
      async update(id, properties) {
        calls.push(["update", id, { ...properties }]);
        states.set(id, { ...states.get(id), ...properties });
        return { ...states.get(id) };
      },
      async remove(id) {
        calls.push(["remove", id]);
        states.delete(id);
      }
    }
  };
  return { api, calls, states };
}

test("recognizes a secure OAuth code flow without retaining secrets", () => {
  assert.deepEqual(parseOAuthAuthorization(authorization), {
    callbackOrigin: "https://ai.goreecloud.com",
    callbackPath: "/api/mcp/todoist/oauth/callback"
  });
  for (const url of [
    "http://todoist.com/oauth/authorize?client_id=foo&response_type=code&redirect_uri=https://ai.goreecloud.com/callback",
    "https://todoist.com/oauth/authorize?response_type=token&client_id=x&redirect_uri=https://ai.goreecloud.com/callback",
    "https://todoist.com/oauth/authorize?response_type=code&redirect_uri=https://ai.goreecloud.com/callback",
    "https://todoist.com/oauth/authorize?response_type=code&client_id=x&redirect_uri=http://ai.goreecloud.com/callback",
    "https://todoist.com/oauth/authorize?response_type=code&client_id=x&redirect_uri=https://evil.example@ai.goreecloud.com/callback",
    "about:blank"
  ]) {
    assert.equal(parseOAuthAuthorization(url), null, url);
  }
});

test("Todoist authorization opened by GoreeCloud AI keeps originating Firefox container", async () => {
  const guard = createOAuthNavigationGuard();
  const { api, calls, states } = makeBrowser([origin, current]);
  const migrated = [];
  assert.equal(guard.shouldInspect(current.id, authorization), true);
  assert.equal(await guard.handle({ browserApi: api, tabId: current.id, url: authorization,
    config, now: 1000, onTransition: tabId => migrated.push(tabId) }), true);
  const destination = [...states.values()].find(t => t.id !== origin.id);
  assert.equal(destination.cookieStoreId, origin.cookieStoreId);
  assert.equal(destination.url, authorization);
  assert.deepEqual(migrated, [11, 200]);
  assert.equal(calls.some(c => c[0] === "remove" && c[1] === 11), true);

  const intermediate = "https://app.todoist.com/auth/oauth/permission_request";
  assert.equal(guard.shouldInspect(200, intermediate), true);
  assert.equal(await guard.handle({ browserApi: api, tabId: 200,
    url: intermediate, config, now: 3000 }), true);
  assert.equal(await guard.handle({ browserApi: api, tabId: 200,
    url: callback, config, now: 4000 }), true);
  assert.equal(await guard.handle({ browserApi: api, tabId: 200,
    url: "https://ai.goreecloud.com/oauth/success", config, now: 5000 }), true);
  assert.equal(calls.filter(c => c[0] === "create").length, 1);
  guard.forget(200);
  assert.equal(guard.shouldInspect(200, "https://example.org/"), false);
});

test("OAuth flow begun in an existing container tab is not migrated", async () => {
  const guard = createOAuthNavigationGuard();
  const { api, calls } = makeBrowser([
    { ...current, cookieStoreId: origin.cookieStoreId, url: origin.url }
  ]);
  const ok = await guard.handle({ browserApi: api, tabId: current.id,
    url: authorization, config, now: 0 });
  assert.equal(ok, true);
  assert.equal(calls.some(c => c[0] === "create"), false);
});

test("does not infer an originating container from an unrelated active tab", async () => {
  const guard = createOAuthNavigationGuard();
  const { api, calls } = makeBrowser([origin, { ...current, openerTabId: undefined }]);
  assert.equal(await guard.handle({ browserApi: api, tabId: current.id,
    url: authorization, config }), false);
  assert.equal(calls.some(c => c[0] === "create"), false);
});

test("rejects a cross-origin opener and preserves normal routing", async () => {
  const guard = createOAuthNavigationGuard();
  const { api } = makeBrowser([{ ...origin, url: "https://evil.example/" }, current]);
  assert.equal(await guard.handle({ browserApi: api, tabId: 11,
    url: authorization, config }), false);
});

test("explicit user routing assignments remain authoritative", async () => {
  const guard = createOAuthNavigationGuard();
  const { api, calls } = makeBrowser([origin, current]);
  const explicit = { ...config, userRules: [{ id: "todoist-assigned", kind: "domain",
    value: "todoist.com", enabled: true, webspaceId: "standard" }] };
  assert.equal(await guard.handle({ browserApi: api, tabId: 11,
    url: authorization, config: explicit }), false);
  assert.equal(calls.some(c => c[0] === "create"), false);
});

test("paused routing never forces an OAuth popup to change stores", async () => {
  const guard = createOAuthNavigationGuard();
  const { api, calls } = makeBrowser([origin, current]);
  assert.equal(await guard.handle({ browserApi: api, tabId: 11,
    url: authorization, config: { ...config, routingEnabled: false } }), false);
  assert.equal(calls.some(c => c[0] === "create"), false);
});

test("OAuth exception expires and ordinary routing resumes", async () => {
  const guard = createOAuthNavigationGuard();
  const { api } = makeBrowser([origin, { ...current, cookieStoreId: origin.cookieStoreId, url: origin.url }]);
  assert.equal(await guard.handle({ browserApi: api, tabId: 11,
    url: authorization, config, now: 1000 }), true);
  assert.equal(await guard.handle({ browserApi: api, tabId: 11,
    url: "https://example.net/", config, now: 1000 + OAUTH_HANDOFF_TTL_MS + 1 }), false);
  assert.equal(guard.shouldInspect(11, "https://example.net/"), false);
});

test("OAuth callback obtains only a short grace window", async () => {
  const guard = createOAuthNavigationGuard();
  const { api } = makeBrowser([origin, { ...current, cookieStoreId: origin.cookieStoreId, url: origin.url }]);
  assert.equal(await guard.handle({ browserApi: api, tabId: 11,
    url: authorization, config, now: 1000 }), true);
  assert.equal(await guard.handle({ browserApi: api, tabId: 11,
    url: callback, config, now: 5000 }), true);
  assert.equal(await guard.handle({ browserApi: api, tabId: 11,
    url: "https://example.net/", config, now: 35_001 }), false);
});

test("non-HTTPS navigation cancels the temporary OAuth exception", async () => {
  const guard = createOAuthNavigationGuard();
  const { api } = makeBrowser([origin, { ...current, cookieStoreId: origin.cookieStoreId, url: origin.url }]);
  assert.equal(await guard.handle({ browserApi: api, tabId: 11,
    url: authorization, config, now: 1000 }), true);
  assert.equal(await guard.handle({ browserApi: api, tabId: 11,
    url: "about:blank", config, now: 2000 }), false);
  assert.equal(guard.shouldInspect(11, "https://example.net"), false);
});
