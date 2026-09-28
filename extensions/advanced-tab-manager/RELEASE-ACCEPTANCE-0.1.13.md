# GoreeCloud Advanced Tab Manager — Release Acceptance 0.1.13

## Status

**Version:** 0.1.13  
**Lifecycle:** Stable promotion state  
**Accepted Stable version:** 0.1.13  
**Accepted runtime source revision:** `89f93d9fcfd77adbdf9296e0d823a6fe8861b1fe`  
**Accepted unsigned XPI SHA-256:** `837777e35d4eddd1554f488ddb27e5f43dd6ba12b02e2463374fd33b55c39aa5`  
**Mozilla-signed XPI SHA-256:** `6e77c071d32457d197f841059132adb453350a5df2a847229d39f01d98de510c`  
**Initial signing/restart workflow run:** `36431225028`  
**GLAZE UI V1.6 consumer acceptance:** `937d2a31e2ff55ec1c9e4c6688899389a9323642`

0.1.13 is the accepted Stable successor to 0.1.12. Its bounded runtime change corrects Firefox-native extension product identity by packaging the canonical GoreeCloud Advanced Tab Manager artwork through manifest `icons` and `action.default_icon`. It does not expand the accepted permission, privacy, storage, remote-dependency, or browser-mutation boundaries of Stable 0.1.12.

## Human target acceptance

The owner completed the governed 0.1.13 target review and explicitly reported **all governed checks PASS** for the exact accepted runtime source and unsigned XPI above.

The complete human record remains local. Repository provenance is limited to:

- accepted target source revision: `89f93d9fcfd77adbdf9296e0d823a6fe8861b1fe`;
- unsigned XPI SHA-256: `837777e35d4eddd1554f488ddb27e5f43dd6ba12b02e2463374fd33b55c39aa5`;
- local target-record canonical SHA-256: `e590735ccd3909d164b0e3ad6802a4366ff08e8dcfa35ba8a73121749ac1307c`;
- decision: accepted;
- release-ready: true.

The accepted human scope includes keyboard traversal, assistive-technology review, normal light, dark appearance, Forced Colors, Reduced Transparency, Reduced Motion, 200%/large-text reflow, constrained/narrow layout, popup/Manager clipping review, and Firefox Add-ons Manager / toolbar icon-surface confirmation.

## Branding and packaging acceptance

The packaged product icon is `extensions/advanced-tab-manager/icons/advanced-tab-manager.svg`, byte-identical to canonical branding Git blob `2c1865ee3809ae91c3bcb42d2d39275668651ab7` from `GoreeCloud/branding-assets/products/advanced-tab-manager/app-icon.svg`.

The accepted manifest declares that artwork for logical sizes 16, 32, 48, 64, 96, and 128 and uses the same artwork for `action.default_icon`. Clean-profile Firefox 156.0.1 runtime qualification queried Firefox AddonManager and verified that Firefox itself resolved the installed extension's native icon metadata to the canonical packaged artwork for every declared size.

## Security and permission acceptance

The exact unsigned candidate passed Stable Security Blockers. The permission boundary remains `activeTab`, `alarms`, `menus`, `scripting`, `sessions`, `storage`, `tabGroups`, and `tabs`.

There are no host permissions, no declarative content scripts, no private-browsing authority, no `unlimitedStorage`, no telemetry path, no runtime remote-code dependency, and no automatic permission-request path.

## Mozilla signing and signed-XPI parity

Governed workflow run `36431225028` submitted the exact accepted 0.1.13 candidate to Mozilla's unlisted signing channel and completed successfully. The run verified Mozilla signature metadata, exact add-on identity/version, non-manifest byte parity, governed manifest parity, and signed XPI SHA-256 `6e77c071d32457d197f841059132adb453350a5df2a847229d39f01d98de510c`.

The verbatim initial machine evidence is retained at `docs/signing-evidence-0.1.13.json`. Stable promotion changes only lifecycle/documentation/qualification authority; it does not rebuild or mutate the accepted runtime bytes.

## Persistent signed installation and full restart

The same signing gate installed the Mozilla-signed 0.1.13 XPI persistently and completed a full Firefox restart without reinstalling. Post-restart acceptance passed for persistent extension registration, native Firefox product icon resolution before and after restart, Manager model/version identity, persisted organizational state, tree relationships, stash restore, snooze restore, duplicate cleanup, fail-closed rule defaults, session snapshot additive restore, and backup preview integrity.

## GLAZE UI V1.6 consumer acceptance

The 0.1.13 owner review completed the product-specific rendered, keyboard, assistive-technology, alternate-appearance, large-text/reflow, constrained-layout, and native icon-surface checks for the exact accepted runtime.

The authoritative `GoreeCloud/glaze-ui` registry accepted that exact runtime as `accepted-v1` at merge `937d2a31e2ff55ec1c9e4c6688899389a9323642`. The registry binds unsigned XPI SHA-256 `837777e35d4eddd1554f488ddb27e5f43dd6ba12b02e2463374fd33b55c39aa5`, Mozilla-signed XPI SHA-256 `6e77c071d32457d197f841059132adb453350a5df2a847229d39f01d98de510c`, and signing/restart run `36431225028`. Glaze retains `productionEligible: false` because product lifecycle authority is separate.

## Stable promotion acceptance

All pre-promotion human, security, Mozilla-signing, signed-payload parity, persistent-install/full-restart, and Glaze consumer-acceptance gates completed before lifecycle promotion.

Canonical inventory records `source_state: stable` and `accepted_stable_version: 0.1.13`. The promotion introduces no packaged runtime delta and preserves the accepted runtime revision and XPI digests above. Stable 0.1.12 remains rollback provenance.

The promotion changes the signing workflow so its post-promotion run evaluates current authoritative Glaze acceptance and current lifecycle metadata while rebuilding and signing only the frozen accepted runtime source. Task closure requires that promotion-triggered run to complete successfully and derive both `stablePromoted: true` and `glazeConsumerAccepted: true` without changing accepted runtime bytes.
