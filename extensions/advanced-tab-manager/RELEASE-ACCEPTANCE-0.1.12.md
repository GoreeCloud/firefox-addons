# GoreeCloud Advanced Tab Manager — Release Acceptance 0.1.12

## Status

**Version:** 0.1.12  
**Lifecycle:** Stable  
**Accepted Stable version:** 0.1.12  
**Accepted runtime source revision:** `43f3010607550d7d4380353b97f85a4dd0186695`  
**Accepted unsigned XPI SHA-256:** `3db751f3a2c80d8d339ea0648d00a8ff016840f6587b58e5a61c484bf687588f`  
**Mozilla-signed XPI SHA-256:** `2e54bdf2aa312c9cfe2895fd456f6d088a58eab6d24de80339e996e3e9ae11ba`  
**Signing/restart workflow run:** `36378135958`

0.1.12 is the accepted Stable successor to 0.1.11. It includes the Glaze UI V1.6 presentation refinement, automatic-unload visibility, normalized duplicate review, tree-branch actions, and explicit Firefox tab-title renaming while retaining the product's local-first, no-host-permission privacy boundary.

## Human target acceptance

The owner completed the governed 0.1.12 target review and explicitly reported **all remaining human gates PASS** for the exact accepted runtime source and unsigned XPI above.

The complete human record remains local. Repository provenance is limited to:

- accepted target source revision: `43f3010607550d7d4380353b97f85a4dd0186695`;
- unsigned XPI SHA-256: `3db751f3a2c80d8d339ea0648d00a8ff016840f6587b58e5a61c484bf687588f`;
- local target-record canonical SHA-256: `922e7f0eb1ceb3c9f0bbab23c63bfe72d99556da1661ae1abee17ab1c7ccabde`;
- decision: accepted;
- release-ready: true.

The accepted human scope includes keyboard traversal, assistive-technology review, normal light, dark appearance, Forced Colors, Reduced Transparency, Reduced Motion, 200%/large-text reflow, constrained/narrow layout, popup/Manager clipping review, and the reviewed tab-title rename interaction.

## Security and permission acceptance

The exact unsigned candidate passed Stable Security Blockers with:

- Firefox add-on ID `advanced-tab-manager@goreecloud.com`;
- Manifest V3;
- permissions: `activeTab`, `alarms`, `menus`, `scripting`, `sessions`, `storage`, `tabGroups`, and `tabs`;
- no host permissions;
- no declarative content scripts;
- private browsing disabled;
- no `unlimitedStorage`;
- no runtime remote code;
- no dynamic-code execution;
- no automatic permission-request path;
- no recorded security exception;
- full relevant Git-history secret scan passed;
- packaged-runtime secret/maintenance-leak scans passed.

The new `activeTab`, `menus`, and `scripting` authority is restricted to explicit user-invoked tab-title renaming on eligible HTTP(S) tabs. Restricted Firefox pages fail closed.

## Mozilla signing and signed-XPI parity

Governed workflow run `36378135958` recovered the approved unlisted Mozilla-signed 0.1.12 package and verified:

- Mozilla signature metadata is present;
- signed add-on identity/version is correct;
- non-manifest payload matches the accepted unsigned candidate byte-for-byte;
- payload inventory is exact apart from Mozilla signature metadata;
- governed manifest parity is accepted;
- signed XPI SHA-256 is `2e54bdf2aa312c9cfe2895fd456f6d088a58eab6d24de80339e996e3e9ae11ba`;
- AMO file ID is `5064623`;
- AMO channel is unlisted;
- AMO file status is public.

The verbatim machine evidence from that run is retained at `docs/signing-evidence-0.1.12.json`.

## Persistent signed installation and full restart

The same signing gate installed the signed XPI persistently and completed a full Firefox restart without reinstalling. Post-restart acceptance passed for:

- persistent extension registration;
- Manager model/version identity;
- persisted organizational state;
- tree relationships;
- stash restore;
- snooze restore;
- exact duplicate cleanup;
- fail-closed rule default;
- session snapshot additive restore;
- backup export/preview integrity;
- persistent installation path/registry continuity.

The restart run used Firefox 156.0 against controlled local fixtures.

## GLAZE UI V1.6 consumer boundary

Repository-local V1.6 source mapping is complete and the owner has completed the required rendered, keyboard, assistive-technology, alternate-appearance, large-text/reflow, and constrained-layout human review.

The authoritative GLAZE UI consumer registry records Advanced Tab Manager as `accepted-v1` at target `1.6.0`, exact product reference revision `43f3010607550d7d4380353b97f85a4dd0186695`, with registry acceptance commit `b5362a2defb9df0bd33e3b8c5b1ba9d14ce81efb`. Glaze consumer acceptance remains separate from product lifecycle authority.

## Stable promotion acceptance

All pre-promotion human, security, Glaze, signing, parity, persistent-install, restart, and post-restart gates completed before lifecycle promotion. Canonical inventory records `source_state: stable` and `accepted_stable_version: 0.1.12`. The promotion is metadata/documentation/qualification-harness only and preserves the accepted runtime source revision and XPI hashes above.

The promotion-triggered signing workflow must derive `stablePromoted: true` from canonical inventory and repeat the governed signed/restart evidence path without changing accepted runtime bytes. Stable 0.1.11 remains historical rollback provenance.
