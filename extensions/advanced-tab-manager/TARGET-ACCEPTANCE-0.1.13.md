# GoreeCloud Advanced Tab Manager 0.1.13 — Human Target Acceptance

## Status

**Candidate:** 0.1.13 Development / source candidate  
**Accepted Stable release:** 0.1.12  
**Current Glaze target:** GLAZE UI V1.6 / 1.6.0  
**Human target acceptance: Pending**  
**Mozilla signing for 0.1.13:** Not authorized by this record  
**Stable promotion implied:** No

This record defines the governed human target-environment review required before the 0.1.13 icon-packaging candidate can claim current-target Glaze consumer acceptance or proceed to a 0.1.13 signing/promotion path. It does not establish human acceptance by itself.

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

Automated validation does not establish human acceptance and must not be presented as proof that Firefox rendered the corrected icon on the owner's target profile.

## Privacy-safe signing provenance

After every governed check passes, blockers are empty, and the local decision is `accepted`, generate privacy-safe signing provenance with `scripts/target_acceptance.py provenance`. The provenance envelope binds the accepted review to the exact source revision and unsigned XPI digest without publishing private review details.

Generating provenance does not authorize signing or Stable promotion by itself. Stable 0.1.12 remains the accepted signed release until a separate 0.1.13 Mozilla-signing, signed-payload parity, persistent-install/restart, post-restart acceptance, Glaze consumer acceptance, and Stable-promotion path completes.
