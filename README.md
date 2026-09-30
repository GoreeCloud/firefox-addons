# GoreeCloud Firefox Add-ons

This repository is the canonical monorepo for all GoreeCloud Firefox projects, including add-ons, extensions, themes, plugins, shared tooling, validation, packaging, and release workflows.

Firefox support that is a client, adapter, or platform variant of a broader GoreeCloud application belongs in that application's repository alongside its other supported variants (for example Android, iOS, web, Linux, and Firefox). Such an extension must not be split into its own isolated repository. During migration, an application-owned Firefox extension may temporarily remain represented here, but its permanent source-control authority is the owning application repository.

## Repository role

`GoreeCloud/firefox-addons` is the canonical GoreeCloud Firefox add-ons and Firefox-development monorepo.

The repository provides:

- one discoverable home for GoreeCloud Firefox add-ons, extensions, themes, plugins, and shared browser tooling;
- independent extension identities and release boundaries inside one repository;
- shared Firefox/WebExtension validation and deterministic packaging tooling;
- common Mozilla signing and release-gate guidance;
- consistent privacy, security, compatibility, and provenance records;
- reusable Glaze UI, Wardveil Security, and Privacy Shield patterns where appropriate.

## Canonical layout

```text
extensions/
├── advanced-tab-manager/
├── chatgpt-enhancer/
├── privacy-shield/
├── redirector/
├── source-resync/
└── webspaces/

docs/
├── extension-inventory.json
├── MOZILLA_SIGNING.md
└── repository-policy.md

shared/
└── scripts/
    ├── package_extension.py
    └── validate_repository.py
```

## Current extension inventory

| Extension | Current directory | Firefox add-on ID | Source state | Ownership / disposition |
| --- | --- | --- | --- | --- |
| GoreeCloud Advanced Tab Manager | `extensions/advanced-tab-manager/` | `advanced-tab-manager@goreecloud.com` | **Stable 0.1.13** accepted for Mozilla unlisted/self-distribution | Standalone Firefox product; remains here |
| GoreeCloud ChatGPT Enhancer | `extensions/chatgpt-enhancer/` | `chatgpt-enhancer@goreecloud.com` | **Source candidate 0.1.2**; no accepted Stable release | Standalone Firefox product; remains here |
| GoreeCloud Privacy Shield | `extensions/privacy-shield/` | `privacy-shield@goreecloud.com` | Stable 0.2.0 accepted for Mozilla unlisted/self-distribution | Platform adapter; retained here pending explicit platform-boundary review |
| GoreeCloud Redirector | `extensions/redirector/` | `redirector@goreecloud.com` | Canonical source | Standalone Firefox product; canonical here; isolated legacy repository retired 2026-09-18 after history/provenance preservation |
| GoreeCloud Source Resync | `extensions/source-resync/` | `source-resync@goreecloud.com` | Canonical source | Standalone Firefox product; canonical here; former standalone repository retired 2026-09-18 after history/release preservation |
| GoreeCloud Webspaces | `extensions/webspaces/` | `webspaces@goreecloud.com` | **Stable 0.1.14** accepted for Mozilla unlisted/self-distribution | Standalone Firefox product; remains here |

Machine-readable inventory lives in [`docs/extension-inventory.json`](docs/extension-inventory.json). Inventory schema v2 records each checked-in manifest version and source lifecycle state separately from independently accepted Mozilla-signed Stable versions, preventing a newer source candidate from silently inheriting older release status.

## Validation

Repository-wide source validation:

```bash
python shared/scripts/validate_repository.py
```

The shared validator checks schema-v2 inventory, exact manifest-to-inventory source-version agreement, source-versus-Stable lifecycle separation, Manifest V3 status, GoreeCloud product names, unique Firefox add-on IDs, version syntax, required documentation, and reviewed broad required-host permissions.

GitHub Actions additionally runs maintained extension-specific source suites, JavaScript syntax checks, deterministic unsigned packaging, and archive-integrity verification.

## Packaging

Create a deterministic unsigned XPI candidate with:

```bash
python shared/scripts/package_extension.py <extension-slug>
```

Generated packages are written to `dist/` and are build outputs rather than authoritative source. Packaging success does not imply Mozilla signing or Stable acceptance.

## Mozilla signing

See [`docs/MOZILLA_SIGNING.md`](docs/MOZILLA_SIGNING.md). Each extension keeps an independent release state. A source merge or unsigned package must never be described as Stable solely because repository validation passes.

### GoreeCloud Advanced Tab Manager 0.1.13

Advanced Tab Manager 0.1.13 is the current Stable release for Mozilla unlisted/self-distribution. The accepted runtime revision is `89f93d9fcfd77adbdf9296e0d823a6fe8861b1fe`; deterministic unsigned XPI SHA-256 is `837777e35d4eddd1554f488ddb27e5f43dd6ba12b02e2463374fd33b55c39aa5`; Mozilla-signed XPI SHA-256 is `6e77c071d32457d197f841059132adb453350a5df2a847229d39f01d98de510c`.

Governed signing/restart run `36431225028` established the signed candidate. Final Stable signing/restart run `36436396986` then recovered the same Mozilla-signed XPI, re-verified payload parity, persistent installation, native Firefox icon identity before and after a full restart, and post-restart release-critical behavior against canonical Stable metadata. GLAZE UI V1.6 consumer acceptance for this exact runtime is authoritative in `GoreeCloud/glaze-ui` at registry merge `937d2a31e2ff55ec1c9e4c6688899389a9323642`. Final machine evidence derives `stablePromoted: true` and `glazeConsumerAccepted: true`; 0.1.12 remains rollback provenance.

### GoreeCloud Download Manager Extension 0.2.12

Download Manager 0.2.12 is the accepted Stable release for Mozilla unlisted/self-distribution. Governed signing/restart run `34176105690` accepted source revision `2cc6d3bbe6ec2c63d49bec338bd68f154747be70`, candidate SHA-256 `779425b150921c1969462066a3e79cb345d976d11369a6891b5611c63a3d5537`, signed XPI SHA-256 `4c02a152a258c4f8e76581ece2cb2a41f088463a4464354da0c374dfb2957f25`, compatible native helper 0.2.11/protocol 2, persistent installation, full Firefox process restart without reinstalling, automatic same-job preserved-range recovery, exact final integrity, staging cleanup, and post-restart helper reconnect with zero manual Resume actions.

0.2.11 was intentionally not promoted despite passing runtime recovery because its already-signed Settings page still labeled itself a source candidate. 0.2.12 corrected that packaged release-quality issue using a lifecycle-neutral version label and repeated the full governed signed gate.

### GoreeCloud Privacy Shield 0.2.0

Privacy Shield 0.2.0 remains the accepted Stable Privacy Shield Firefox release for Mozilla unlisted/self-distribution after exact-payload signing, signed-artifact runtime verification, persistent installation, full same-profile Firefox restart acceptance, and governed target-environment acceptance.

### GoreeCloud Webspaces 0.1.14

Webspaces 0.1.14 is the accepted Stable release for Mozilla unlisted/self-distribution. It includes the runtime-accepted Standard fallback, six-Webspace isolation, provider identity marks, Proton routing, and current-Webspace reconciliation with lifecycle-neutral packaged UI.

The accepted deterministic unsigned XPI SHA-256 is `ac605e4781a6dcc605d6c7474989e5f125cee12448580786cfefc4ffd81f3e00`. The Mozilla-signed XPI SHA-256 is `37a42b44e779b0a5585b622ae5040ffe1b51e15a72099e2c13182ca3c5a18479`. Governed signing/restart run `34735370919` verified the existing unlisted Mozilla-signed 0.1.14 artifact, persistent installation, a full Firefox 155.0.1 restart on the same profile without reinstalling Webspaces, the active extension registration after restart, and persistence of all six distinct built-in Firefox contextual identities.

## Maintenance rule

A GoreeCloud Firefox add-on, extension, theme, plugin, or other Firefox-specific project that is owned by this monorepo is not fully centralized until its active source, documentation, validation, package workflow, release instructions, required licensing/attribution, and relevant release history are represented here. After migration acceptance, its isolated legacy repository must be retired; long-term provenance belongs in canonical records or approved archives rather than a permanent standalone extension repository.

An application-owned Firefox client is not permanently centralized here. Its authoritative source must converge on the owning application repository, where Firefox is maintained as one supported platform variant alongside the application's other clients. Transitional copies must be clearly identified and removed from authority after migration acceptance.

See [`docs/repository-policy.md`](docs/repository-policy.md) for repository governance and migration rules.
