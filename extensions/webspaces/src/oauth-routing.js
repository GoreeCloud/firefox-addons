import { evaluateRouting } from "./routing.js";
import { migrateTab } from "./tab-migration.js";

// Store only a cookie-store ID, callback origin/path and expiration in memory.
// Never persist or log OAuth codes, state, PKCE verifiers, or authorization URLs.
export const OAUTH_HANDOFF_TTL_MS = 12 * 60 * 1000;
const CALLBACK_GRACE_MS = 30 * 1000;
const EXPLICIT_RULE_REASONS = new Set([
  "user-exception",
  "exact-hostname-rule",
  "user-site-assignment",
  "user-subdomain-rule"
]);

function safeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}

export function parseOAuthAuthorization(value) {
  const url = safeUrl(value);
  if (!url) return null;

  const responseTypes = (url.searchParams.get("response_type") ?? "").split(/\s+/);
  if (!responseTypes.includes("code") || !url.searchParams.get("client_id")) return null;
  const callback = safeUrl(url.searchParams.get("redirect_uri"));
  if (!callback || callback.origin === url.origin) return null;

  return { callbackOrigin: callback.origin, callbackPath: callback.pathname };
}

function sameOrigin(value, expectedOrigin) {
  return safeUrl(value)?.origin === expectedOrigin;
}

function explicitRouting(url, config) {
  const result = evaluateRouting(url, config);
  return EXPLICIT_RULE_REASONS.has(result.reason) || result.reason.startsWith("routing-paused");
}

/**
 * Keep a verified OAuth authorization and its callback inside the initiating
 * tab's Firefox cookie store. Do not change ordinary routing, user assignments,
 * or cookies. This state is transient and per-tab; extension restart clears it.
 */
export function createOAuthNavigationGuard() {
  const flows = new Map();

  return {
    shouldInspect(tabId, url) {
      return flows.has(tabId) || parseOAuthAuthorization(url) !== null;
    },

    forget(tabId) {
      flows.delete(tabId);
    },

    async handle({ browserApi, tabId, url, config, onTransition = () => {}, now = Date.now() }) {
      const existing = flows.get(tabId);
      if (existing) {
        if (existing.expiresAt <= now || explicitRouting(url, config)) {
          flows.delete(tabId);
        } else {
          const destination = safeUrl(url);
          if (!destination) {
            flows.delete(tabId);
          } else {
            try {
              const tab = await browserApi.tabs.get(tabId);
              if (tab.cookieStoreId === existing.cookieStoreId) {
                if (destination.origin === existing.callbackOrigin &&
                    destination.pathname === existing.callbackPath) {
                  existing.expiresAt = Math.min(existing.expiresAt, now + CALLBACK_GRACE_MS);
                }
                return true;
              }
            } catch {
              // The tab is gone or inaccessible. Fall through to normal routing.
            }
            flows.delete(tabId);
          }
        }
      }

      const auth = parseOAuthAuthorization(url);
      if (!auth || explicitRouting(url, config)) return false;

      let source;
      try {
        source = await browserApi.tabs.get(tabId);
      } catch {
        return false;
      }

      // Prefer an actual opener, not an unrelated active tab or guessed user
      // account. Only the owner of the exact OAuth callback origin can opt in.
      let origin = null;
      if (Number.isInteger(source.openerTabId)) {
        try {
          const opener = await browserApi.tabs.get(source.openerTabId);
          if (sameOrigin(opener.url, auth.callbackOrigin)) origin = opener;
        } catch {
          // An inaccessible opener must not grant a new container assignment.
        }
      }
      if (!origin && sameOrigin(source.url, auth.callbackOrigin)) {
        origin = source;
      }
      if (!origin?.cookieStoreId) return false;

      const flow = {
        cookieStoreId: origin.cookieStoreId,
        callbackOrigin: auth.callbackOrigin,
        callbackPath: auth.callbackPath,
        expiresAt: now + OAUTH_HANDOFF_TTL_MS
      };

      if (source.cookieStoreId === origin.cookieStoreId) {
        flows.set(tabId, flow);
        return true;
      }

      // Only migrate this single verified OAuth popup; no global cookie sharing.
      try {
        const result = await migrateTab(browserApi, {
          sourceTabId: tabId,
          url,
          targetCookieStoreId: origin.cookieStoreId,
          onTransition
        });
        flows.set(result.tabId, flow);
        return true;
      } catch {
        // A failed migration keeps the original tab; existing routing may decide.
        return false;
      }
    }
  };
}
