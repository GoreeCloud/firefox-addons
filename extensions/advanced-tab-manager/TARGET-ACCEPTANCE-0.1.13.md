# GoreeCloud Advanced Tab Manager 0.1.13 — Human Target Acceptance

## Status

**Candidate:** 0.1.13 Development / source candidate  
**Accepted Stable release:** 0.1.12  
**Current Glaze target:** GLAZE UI V1.6 / 1.6.0  
**Human target acceptance: Accepted**  
**Mozilla signing for 0.1.13:** Authorized to proceed through the separate governed signing workflow  
**Stable promotion implied:** No

The owner completed the governed 0.1.13 target review on September 28, 2026 and explicitly reported **all governed checks PASS** for exact runtime source revision `89f93d9fcfd77adbdf9296e0d823a6fe8861b1fe` and deterministic unsigned XPI SHA-256 `837777e35d4eddd1554f488ddb27e5f43dd6ba12b02e2463374fd33b55c39aa5`.

The complete privacy-minimized local record has decision `accepted`, zero blockers, and every governed keyboard, assistive-technology, appearance, reflow, clipping, and Firefox icon-surface check set to true. Its canonical SHA-256 is `e590735ccd3909d164b0e3ad6802a4366ff08e8dcfa35ba8a73121749ac1307c`; repository-visible provenance is stored at `docs/target-acceptance-provenance-0.1.13.json`.

Human target acceptance authorizes the separate 0.1.13 signing path to consume that exact provenance. It does not by itself establish Mozilla signing, Glaze consumer-registry acceptance, or Stable promotion.

## Exact-review boundary

Human review must be bound to one exact 40-character source revision, one deterministic unsigned XPI built from that revision, add-on ID `advanced-tab-manager@goreecloud.com`, candidate version `0.1.13`, and the XPI SHA-256 recorded by `scripts/target_acceptance.py`.

The manual **Advanced Tab Manager Target Review Candidate** workflow builds the requested exact source twice, proves deterministic bytes, runs repository/source tests, real-Firefox runtime smoke, Stable Security Blocker qualification, and GLAZE UI V1.6 source mapping, then retains a review artifact. It does not sign the add-on.

## Governed checks

A release-ready human target record requires every keyboard, assistive-technology, and environment/reflow check defined by `scripts/target_acceptance.py` to be explicitly true with zero blocker codes.

For this candidate, the `firefox_extension_icon_surfaces` check specifically requires verification that:

- Firefox Add-ons Manager shows the approved GoreeCloud Advanced Tab Manager icon rather than Firefox's generic puzzle-piece placeholder;
- the toolbar/action representation uses the same approved product identity;
- the icon remains recognizable and unclipped at the Firefox-rendered small sizes reviewed on the target environment; and
- the observed artwork matches the canonical GoreeCloud branding asset rather than a locally redrawn substitute.

The ordinary sidebar, popup, Manager, rename-dialog, keyboard, assistive-technology, appearance, zoom/reflow, and constrained-layout checks remain release gates because 0.1.13 is a new exact runtime package.

## Branding provenance

Canonical branding authority: `GoreeCloud/branding-assets`  
Canonical asset: `products/advanced-tab-manager/app-icon.svg`  
Canonical Git blob: `2c1865ee3809ae91c3bcb42d2d39275668651ab7`  
Packaged derivative: `extensions/advanced-tab-manager/icons/advanced-tab-manager.svg`

The source candidate must keep the packaged derivative byte-identical to the pinned canonical SVG and must declare it through Firefox manifest `icons` plus `action.default_icon`.

## Evidence privacy boundary

The complete machine-readable target record remains local unless a later governed release process explicitly requires a privacy-safe digest/provenance tuple. The evidence schema excludes browsing URLs, page content, credentials, screenshots, filesystem paths, and free-form notes.

Automated clean-profile Firefox qualification now also queries Firefox `AddonManager` immediately after installing the exact candidate and fails unless Firefox resolves the installed add-on's native icon URL to `icons/advanced-tab-manager.svg`. This verifies Firefox consumed the packaged icon metadata in the controlled runtime environment.

Automated validation does not establish human acceptance and must not be presented as proof that Firefox rendered the corrected icon on the owner's target profile.

For the exact candidate above, owner-visible Firefox 156.0.1/Linux evidence plus the owner's final all-PASS review now establishes the required human target acceptance. Automated evidence remains supporting preflight rather than the basis of that human decision.

## Privacy-safe signing provenance

After every governed check passes, blockers are empty, and the local decision is `accepted`, generate privacy-safe signing provenance with `scripts/target_acceptance.py provenance`. The provenance envelope binds the accepted review to the exact source revision and unsigned XPI digest without publishing private review details.

Accepted provenance has now been generated and validated for this exact candidate. Stable 0.1.12 remains the accepted signed release until the separate 0.1.13 Mozilla-signing, signed-payload parity, persistent-install/restart, post-restart acceptance, Glaze consumer acceptance, and Stable-promotion path completes.
