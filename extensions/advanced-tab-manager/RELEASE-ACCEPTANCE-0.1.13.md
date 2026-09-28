# GoreeCloud Advanced Tab Manager — Release Acceptance 0.1.13

## Status

**Version:** 0.1.13  
**Lifecycle:** Signed release candidate; GLAZE UI V1.6 consumer-registry refresh and Stable promotion pending  
**Accepted Stable version before promotion:** 0.1.12  
**Accepted runtime source revision:** `89f93d9fcfd77adbdf9296e0d823a6fe8861b1fe`  
**Accepted unsigned XPI SHA-256:** `837777e35d4eddd1554f488ddb27e5f43dd6ba12b02e2463374fd33b55c39aa5`  
**Mozilla-signed XPI SHA-256:** `6e77c071d32457d197f841059132adb453350a5df2a847229d39f01d98de510c`  
**Signing/restart workflow run:** `36431225028`

0.1.13 is the reviewed successor candidate to accepted Stable 0.1.12. Its bounded runtime change corrects Firefox-native extension product identity by packaging the canonical GoreeCloud Advanced Tab Manager artwork through manifest `icons` and `action.default_icon`. It does not expand the accepted permission, privacy, storage, remote-dependency, or browser-mutation boundaries of Stable 0.1.12.

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

The accepted manifest declares that artwork for logical sizes 16, 32, 48, 64, 96, and 128 and uses the same artwork for `action.default_icon`.

Clean-profile Firefox 156.0.1 runtime qualification queried Firefox AddonManager and verified that Firefox itself resolved the installed extension's native icon metadata to the canonical packaged artwork for every declared size.

## Security and permission acceptance

The exact unsigned candidate passed Stable Security Blockers. The permission boundary remains:

- `activeTab`;
- `alarms`;
- `menus`;
- `scripting`;
- `sessions`;
- `storage`;
- `tabGroups`;
- `tabs`.

There are no host permissions, no declarative content scripts, no private-browsing authority, no `unlimitedStorage`, no telemetry path, no runtime remote-code dependency, and no automatic permission-request path.

## Mozilla signing and signed-XPI parity

Governed workflow run `36431225028` submitted the exact accepted 0.1.13 candidate to Mozilla's unlisted signing channel and completed successfully.

The run verified:

- Mozilla signature metadata is present;
- signed add-on identity/version is correct;
- non-manifest payload matches the accepted unsigned candidate byte-for-byte;
- payload inventory is exact apart from Mozilla signature metadata;
- governed manifest parity is accepted;
- signed XPI SHA-256 is `6e77c071d32457d197f841059132adb453350a5df2a847229d39f01d98de510c`;
- signing source is `new-submission`.

The verbatim machine evidence from that run is retained at `docs/signing-evidence-0.1.13.json`.

## Persistent signed installation and full restart

The same signing gate installed the Mozilla-signed 0.1.13 XPI persistently and completed a full Firefox restart without reinstalling.

Post-restart acceptance passed for:

- persistent extension registration;
- native Firefox product icon resolution before restart;
- persistent installation path/registry continuity;
- native Firefox product icon resolution after restart;
- Manager model/version identity;
- persisted organizational state;
- tree relationships;
- stash restore;
- snooze restore;
- exact duplicate cleanup;
- fail-closed rule default;
- session snapshot additive restore;
- backup export/preview integrity.

This directly verifies that the icon correction survives persistent installation and a full Firefox restart rather than existing only in temporary-install metadata.

## GLAZE UI V1.6 consumer boundary

The 0.1.13 owner review completed the product-specific rendered, keyboard, assistive-technology, alternate-appearance, large-text/reflow, constrained-layout, and native icon-surface checks for the exact accepted candidate.

The repository-local Glaze source mapping therefore has the required human evidence plus signed-runtime/restart evidence. The remaining shared Glaze step is to refresh the authoritative `GoreeCloud/glaze-ui` consumer acceptance record from Stable 0.1.12 to this exact 0.1.13 runtime revision. Until that shared registry update is merged and verified, local machine evidence must remain fail-closed with `status: adoption-required` / `consumerRegistryAccepted: false`.

## Stable promotion rule

0.1.13 may be promoted only after authoritative Glaze consumer-registry acceptance is updated to this exact runtime revision. Stable promotion must remain a separate lifecycle/documentation/qualification change that:

1. updates canonical extension inventory to `source_state: stable`;
2. sets `accepted_stable_version: 0.1.13`;
3. records authoritative GLAZE UI V1.6 consumer acceptance for this exact runtime revision;
4. introduces no packaged runtime delta from the accepted signed 0.1.13 payload;
5. reruns repository/release qualification at the exact promotion head;
6. retriggers the signing/restart workflow so final evidence derives `stablePromoted: true` and `glazeConsumerAccepted: true` while preserving the same accepted runtime bytes.

Until that promotion is merged and verified, 0.1.12 remains the canonical Stable lifecycle state.
