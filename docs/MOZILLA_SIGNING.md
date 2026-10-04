# Mozilla Signing and Firefox Release Boundary

## Purpose

This document defines the shared release boundary for GoreeCloud Firefox extensions maintained in this repository.

Source validation and packaging are not equivalent to a Mozilla-signed release. Each extension retains its own version, add-on ID, release record, acceptance evidence, and Stable promotion decision.

## Shared release sequence

1. Validate the exact candidate commit with repository-wide and extension-specific checks.
2. Package the extension from its canonical directory using `shared/scripts/package_extension.py` or an extension-specific equivalent when required.
3. Inspect the resulting archive and confirm that `manifest.json` is at the archive root and that maintenance-only files are excluded unintentionally.
4. Record the exact source commit and candidate artifact digest.
5. Submit the candidate through the approved Mozilla Add-ons signing path for that extension.
6. Never commit Mozilla API credentials, signing secrets, private keys, cookies, session values, or reusable authentication material.
7. Download and preserve the Mozilla-signed XPI through the approved release-record process.
8. Verify signed package identity, version, add-on ID, permissions, payload inventory, and expected runtime files.
9. Install the signed XPI through normal Firefox extension installation.
10. Fully restart Firefox and confirm that the extension remains installed and enabled.
11. Repeat the extension's release-critical runtime acceptance after restart.
12. Record Stable promotion only for the exact accepted extension version.
13. Where lifecycle evidence is machine-generated, repeat the governed evidence path after promotion so final provenance reflects the canonical Stable state without changing signed runtime bytes.

## Credentials

Signing credentials must be supplied at execution time through an approved secret-management path. They must not appear in repository files, pull-request text, CI logs, generated archives, documentation examples, or committed environment files.

## Independent release status

A repository merge may establish accepted canonical source without creating a Stable release. `docs/extension-inventory.json` schema v2 therefore records checked-in `source_version` and `source_state` independently from `accepted_stable_version`.

The manifest version must match `source_version` exactly. `accepted_stable_version` is evidence-backed release metadata and may be null, equal to source version only when that source itself is Stable, or identify an older independently accepted Stable release while newer source continues development. Candidate source never inherits Stable status merely because an older version was accepted.

## Current examples

- **GoreeCloud Download Manager Extension 0.2.12** is Stable for Mozilla unlisted/self-distribution. Governed run `34176105690` accepted source revision `2cc6d3bbe6ec2c63d49bec338bd68f154747be70`, candidate SHA-256 `779425b150921c1969462066a3e79cb345d976d11369a6891b5611c63a3d5537`, signed XPI SHA-256 `4c02a152a258c4f8e76581ece2cb2a41f088463a4464354da0c374dfb2957f25`, compatible native helper 0.2.11/protocol 2, persistent installation, full Firefox process restart without reinstalling, automatic same-job preserved-range recovery, exact final integrity, staging cleanup, and post-restart helper reconnect with zero manual Resume actions. The final lifecycle evidence rerun must derive `stablePromoted: true` from the canonical Stable inventory.
- **GoreeCloud Privacy Shield 0.2.0** is Stable for Mozilla unlisted/self-distribution after its governed signing and signed-runtime/persistent-restart acceptance.
- **GoreeCloud Webspaces 0.1.14** is Stable for Mozilla unlisted/self-distribution. The exact accepted unsigned candidate SHA-256 is `ac605e4781a6dcc605d6c7474989e5f125cee12448580786cfefc4ffd81f3e00`. Mozilla produced the signed XPI with SHA-256 `37a42b44e779b0a5585b622ae5040ffe1b51e15a72099e2c13182ca3c5a18479`. Governed signing/restart run `34735370919` revalidated the exact candidate, retrieved the existing unlisted Mozilla-signed 0.1.14 artifact from AMO, verified archive integrity, version, add-on ID, and Mozilla `META-INF` signature metadata, installed it persistently in Firefox 155.0.1, fully restarted Firefox on the same profile without reinstalling, and verified that the active Webspaces registration plus all six distinct built-in contextual identities persisted after restart. Direct Firefox acceptance already covered Standard fallback/current-identity reconciliation, six-Webspace Isolation Health, provider marks, and Proton routing.
- **GoreeCloud Browser Hardening 0.1.0** remains a source candidate. Real-Firefox unsigned qualification passed in run `37165320162` for exact source `05c73782d9edb072fda3f6872406cb6809099011`, deterministic candidate SHA-256 `82043d51fafed43635b480f7530a5f5c2ea3ef7bd16a7f79fa2eb62ca63a1151`, and Firefox 156.0. Mozilla signing, signed payload parity, persistent installation, full-process restart acceptance, and final Stable promotion remain separate gates.
- **GoreeCloud Redirector** checks in source version 0.2.1 while historical Stable acceptance remains 0.2.0. The newer source version requires its own signing and runtime acceptance before it can replace that Stable release.
- **GoreeCloud Advanced Tab Manager 0.1.13** is the current Stable release for Mozilla unlisted/self-distribution. Governed signing/restart run `36431225028` established the signed candidate for runtime revision `89f93d9fcfd77adbdf9296e0d823a6fe8861b1fe`; final Stable run `36436396986` recovered the same approved unlisted Mozilla version and re-verified deterministic unsigned SHA-256 `837777e35d4eddd1554f488ddb27e5f43dd6ba12b02e2463374fd33b55c39aa5`, Mozilla-signed XPI SHA-256 `6e77c071d32457d197f841059132adb453350a5df2a847229d39f01d98de510c`, persistent installation, and full-restart behavior. The authoritative GLAZE UI V1.6 registry accepts this exact runtime at merge `937d2a31e2ff55ec1c9e4c6688899389a9323642`. Final machine evidence derives `stablePromoted: true` and `glazeConsumerAccepted: true`; Stable 0.1.12 remains rollback provenance.
- **GoreeCloud Advanced Tab Manager 0.1.12** is the previous Stable rollback release for Mozilla unlisted/self-distribution. Governed signing/restart run `36378135958` accepted runtime revision `43f3010607550d7d4380353b97f85a4dd0186695`, deterministic unsigned SHA-256 `3db751f3a2c80d8d339ea0648d00a8ff016840f6587b58e5a61c484bf687588f`, and Mozilla-signed XPI SHA-256 `2e54bdf2aa312c9cfe2895fd456f6d088a58eab6d24de80339e996e3e9ae11ba`. The run revalidated Stable Security Blockers, verified Mozilla signature metadata and governed payload parity, installed the signed XPI persistently, fully restarted Firefox without reinstalling, and passed post-restart release-critical acceptance. GLAZE UI V1.6 consumer acceptance is authoritative at `b5362a2defb9df0bd33e3b8c5b1ba9d14ce81efb`. Stable 0.1.11 remains historical rollback provenance.
- **GoreeCloud Bookmarks** checks in source version 0.1.1 as a source candidate with no accepted Stable version recorded. Its required runtime, signing, restart, and post-restart gates remain outstanding.
- **GoreeCloud Source Resync** checks in source version 1.1.2 as canonical source with no accepted Stable version currently recorded in the shared inventory.

Stable status is version-specific. Any later source change must independently satisfy the applicable release gates before it can inherit or replace an accepted Stable version.

## Packaging helper

Run:

```bash
python shared/scripts/package_extension.py <extension-slug>
```

Examples:

```bash
python shared/scripts/package_extension.py advanced-tab-manager
python shared/scripts/package_extension.py firefox-hardening
python shared/scripts/package_extension.py bookmarks
python shared/scripts/package_extension.py download-manager
python shared/scripts/package_extension.py redirector
python shared/scripts/package_extension.py source-resync
python shared/scripts/package_extension.py privacy-shield
python shared/scripts/package_extension.py webspaces
```

Generated packages are written beneath `dist/` by default. `dist/` is build output and must not be treated as authoritative source.


## Advanced Tab Manager 0.1.13 Stable boundary

The owner completed the governed 0.1.13 target review on September 28, 2026 and explicitly reported all governed checks PASS for exact runtime revision `89f93d9fcfd77adbdf9296e0d823a6fe8861b1fe` and deterministic unsigned XPI SHA-256 `837777e35d4eddd1554f488ddb27e5f43dd6ba12b02e2463374fd33b55c39aa5`.

The complete local target record remains private. Repository-visible provenance records canonical target-record SHA-256 `e590735ccd3909d164b0e3ad6802a4366ff08e8dcfa35ba8a73121749ac1307c`, decision `accepted`, and `release_ready: true`. The 0.1.13 signing workflow is bound to those exact identifiers and may submit or recover only that exact unlisted Mozilla version.

PR #144 was squash-merged: reviewed head `89f93d9fcfd77adbdf9296e0d823a6fe8861b1fe` is therefore not itself a main-line ancestor. The signing gate treats squash integration `8deabbedb7f89525396e0e94fa2c96d0664814d6` as the main-line integration proof, requires the reviewed source commit to remain resolvable, and independently rebuilds that frozen reviewed source to the accepted XPI SHA-256 before Mozilla submission. This preserves exact-artifact binding without relying on a false ancestry assumption.

The signed-restart harness additionally requires the native Firefox product icon and all declared icon sizes to resolve to the canonical packaged artwork before and after the full Firefox restart. Governed signing/restart runs `36431225028` and `36436396986` passed; the latter is the final Stable lifecycle readback and records `sourceState: stable`, `acceptedStableVersion: 0.1.13`, `stablePromoted: true`, and `glazeConsumerAccepted: true`.


## Advanced Tab Manager 0.1.12 Stable boundary

The governed 0.1.12 human target review is complete for runtime revision `43f3010607550d7d4380353b97f85a4dd0186695` and deterministic unsigned XPI SHA-256 `3db751f3a2c80d8d339ea0648d00a8ff016840f6587b58e5a61c484bf687588f`. The complete privacy-minimized target record remains local; the repository stores only its accepted provenance envelope and canonical record digest.

Governed signing/restart run `36378135958` verified Mozilla-signed package parity, signed SHA-256 `2e54bdf2aa312c9cfe2895fd456f6d088a58eab6d24de80339e996e3e9ae11ba`, persistent installation, full Firefox restart, and post-restart behavior. The authoritative GLAZE UI V1.6 consumer registry accepts the exact runtime revision at commit `b5362a2defb9df0bd33e3b8c5b1ba9d14ce81efb`.

Canonical lifecycle metadata now records `source_state: stable` and `accepted_stable_version: 0.1.12`. The promotion introduces no packaged runtime delta. The signing workflow is retriggered by the promotion so final machine evidence must derive `stablePromoted: true` from canonical Stable inventory while re-verifying the same signed runtime payload.
