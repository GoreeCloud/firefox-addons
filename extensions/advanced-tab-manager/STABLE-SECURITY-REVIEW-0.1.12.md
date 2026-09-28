# GoreeCloud Advanced Tab Manager — Stable Security Review 0.1.12

## Status

**Release:** 0.1.12 signed release candidate  
**Firefox add-on ID:** `advanced-tab-manager@goreecloud.com`  
**Security exceptions:** None  
**Stable Security Blockers:** Passed  
**Stable promotion:** Pending separate metadata-only promotion

This review applies the GoreeCloud Stable Release Security Blockers to the exact accepted 0.1.12 runtime candidate.

## Accepted runtime identity

- Source revision: `43f3010607550d7d4380353b97f85a4dd0186695`
- Deterministic unsigned XPI SHA-256: `3db751f3a2c80d8d339ea0648d00a8ff016840f6587b58e5a61c484bf687588f`
- Mozilla-signed XPI SHA-256: `2e54bdf2aa312c9cfe2895fd456f6d088a58eab6d24de80339e996e3e9ae11ba`
- Signing/restart run: `36378135958`

## Permission and execution boundary

The accepted candidate contains exactly:

- `activeTab`
- `alarms`
- `menus`
- `scripting`
- `sessions`
- `storage`
- `tabGroups`
- `tabs`

The candidate retains:

- no host permissions;
- no declarative content scripts;
- no `unlimitedStorage`;
- private browsing disabled;
- no runtime remote code;
- no dynamic code evaluation;
- no automatic permission request path;
- no stored reusable credentials, cookies, tokens, passwords, private keys, or signing material.

The `activeTab` + `scripting` authority is exercised only after the user explicitly invokes **Rename tab title…** from Firefox's native tab context menu on an eligible HTTP(S) tab. The command is filtered away from unsupported Firefox/system pages and the background route independently fails closed.

## Source, history, and package scanning

The qualification gate:

- checked out full Git history;
- scanned relevant Advanced Tab Manager history for recognized credential/private-key patterns;
- scanned current runtime source for remote-code and dynamic-code paths;
- inspected the deterministic XPI archive;
- rejected maintenance-only test/script/workflow/documentation leakage from packaged runtime;
- verified exact manifest version and add-on identity;
- verified the permission boundary above.

No security exception was required.

## Local data and mutation boundaries

Implemented state remains local and schema-validated.

Source-preserving or destructive paths retain the reviewed safeguards:

- stash and snooze persist/verify recovery before source-tab closure;
- snooze deadlines are reconstructed after restart and failed restoration retains recovery state;
- duplicate cleanup requires reviewed keeper selection, confirmation, fresh-state verification, and guarded-tab exclusions;
- rule automation defaults disabled and explicit rule actions remain bounded;
- session-snapshot restore is additive and attempts rollback of newly created windows on failure;
- import validates identity/integrity/schema, previews, confirms, rejects stale revisions, verifies readback, and attempts rollback;
- tab-title rename persistence is rollback-aware if Firefox session metadata cannot be committed;
- tree-branch window moves use fresh-state drift checks, destination verification, and rollback attempts.

## Mozilla-signed artifact acceptance

Governed run `36378135958` verified:

- Mozilla signature metadata;
- exact signed add-on identity and version;
- exact payload inventory apart from signature metadata;
- byte-for-byte non-manifest payload parity;
- governed manifest normalization/parity;
- persistent signed installation;
- full Firefox restart without reinstalling;
- post-restart release-critical runtime behavior.

The verbatim signing evidence is retained at `docs/signing-evidence-0.1.12.json`.

## Stable promotion boundary

All applicable Stable Security Blockers for the exact 0.1.12 runtime candidate have passed. The remaining promotion action is metadata/lifecycle governance only and must not alter packaged runtime bytes.

A final Stable-promotion change must preserve the accepted source/XPI hashes, update canonical lifecycle records, rerun exact-head qualification, and retrigger signed evidence so the canonical record can show `stablePromoted: true`.
