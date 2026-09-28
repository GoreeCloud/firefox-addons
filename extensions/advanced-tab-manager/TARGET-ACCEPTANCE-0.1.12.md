# GoreeCloud Advanced Tab Manager 0.1.12 — Human Target Acceptance

## Status

**Candidate:** 0.1.12 Development / source candidate  
**Accepted Stable release:** 0.1.11  
**Current Glaze target:** GLAZE UI V1.6 / 1.6.0  
**Human target acceptance: Pending**  
**Mozilla signing for 0.1.12:** Not authorized by this record  
**Stable promotion implied:** No

This record defines the governed human target-environment review required before the 0.1.12 candidate can claim current-target Glaze consumer acceptance or proceed to a 0.1.12 signing/promotion path. It does not establish human acceptance by itself.

## Exact-review boundary

Human review must be bound to one exact 40-character source revision, one deterministic unsigned XPI built from that revision, the fixed add-on ID `advanced-tab-manager@goreecloud.com`, candidate version `0.1.12`, the XPI SHA-256 recorded by `scripts/target_acceptance.py`, and a recorded Firefox/OS/device/installation/assistive-technology review environment.

The manual **Advanced Tab Manager Target Review Candidate** workflow builds the requested exact source twice, proves deterministic XPI bytes, runs repository/source tests, real-Firefox runtime smoke, Stable Security Blocker qualification, and GLAZE UI V1.6 source mapping, then retains a review artifact. It does not sign the add-on.

## Governed checks

A release-ready human target record requires every check below to be explicitly true and zero blocker codes.

### Keyboard

- sidebar primary navigation;
- native tab-activation button behavior;
- independent tab-row action reachability;
- command-palette open/search/execute/close;
- command-palette focus restoration;
- popup primary action reachability;
- Manager control reachability;
- visible focus across all reviewed surfaces.

### Assistive technology

- sidebar landmarks and labels are announced meaningfully;
- active-tab state is conveyed;
- row actions are distinguishable;
- command-palette dialog/listbox structure is announced;
- Manager status and controls are announced;
- live regions remain restrained rather than producing noisy/repetitive announcements.

### Environment and reflow

- current-target normal-light rendering;
- Forced Colors;
- Reduced Transparency;
- dark appearance;
- Reduced Motion;
- 200% zoom/reflow;
- large-text/reflow;
- constrained/narrow sidebar layout;
- popup clipping/overlap;
- Manager clipping/overlap.

A false or incomplete check prevents an `accepted` decision. A rejected decision must carry an allowed blocker code.

## Evidence privacy boundary

The complete machine-readable target record remains local unless a later governed release process explicitly requires a privacy-safe digest/provenance tuple.

The evidence schema intentionally excludes raw URLs, browsing history, page content, cookies, credentials, screenshots, filesystem paths, and free-form notes. Human review quality cannot be inferred from a record digest alone; the digest can only bind later release evidence to the exact reviewed record.

## Tooling

Create an incomplete local record with `scripts/target_acceptance.py new`, complete only the governed boolean fields and blocker codes, then validate it with `scripts/target_acceptance.py validate --require-release-ready` while supplying the exact source SHA and XPI SHA-256.

The repository test suite validates the evidence schema itself. That automated validation does not substitute for the human keyboard, assistive-technology, appearance, or large-text review.

## Signing boundary

The existing Advanced Tab Manager Mozilla-signing workflow remains deliberately pinned to accepted Stable 0.1.11 while this target acceptance is pending. A future 0.1.12 signing change must be a separate governed source change that binds signing to accepted target-review provenance and the exact reviewed unsigned XPI bytes.

Stable 0.1.11 remains the rollback/production baseline until all 0.1.12 gates pass.

## Tab-title rename acceptance addition

The exact 0.1.12 candidate review must include the new **Rename tab title** workflow without expanding the evidence schema beyond its privacy-minimized booleans:

- invoke **Rename tab title…** from Firefox's native tab context menu on an eligible ordinary HTTP(S) tab;
- verify the dialog is keyboard reachable, has visible focus, readable labels/instructions, and meaningful assistive-technology announcements;
- verify Rename changes the Firefox tab-strip label and same-document site title changes do not immediately overwrite it;
- verify Restore page title returns the current page-provided title;
- verify a Firefox-restricted/non-scriptable page fails closed without claiming success;
- verify the dialog remains usable in normal light, dark appearance, Forced Colors, Reduced Transparency, and the governed large-text/zoom condition;
- verify permission review records the candidate's `activeTab`, `menus`, and `scripting` additions while host permissions remain none.

Automated real-Firefox preflight now covers initial focus, native label/form/live-status semantics, Enter submission, keyboard Restore, keyboard Cancel, and a 200% zoom horizontal-overflow check for the rename dialog. Those checks are regression guards only and must not be copied into the human acceptance record as proof of assistive-technology, visible-focus, or large-text/zoom acceptance.

Any failure maps to the existing keyboard, assistive-technology, appearance/layout, or other-blocker categories rather than adding browsing data to the acceptance record.


## Privacy-safe signing provenance

The complete human target record remains local. After every governed check is true, blockers are empty, and the local decision is `accepted`, generate a minimal release-provenance envelope with:

```bash
python extensions/advanced-tab-manager/scripts/target_acceptance.py provenance path/to/local-target-record.json \
  --output path/to/target-acceptance-provenance.json
```

The envelope contains only the product/version/add-on identity, exact source revision, exact unsigned XPI SHA-256, a canonical SHA-256 of the complete local target record, accepted/release-ready state, and the review timestamp. It intentionally omits browser URLs, browsing content, screenshots, operating-system details, assistive-technology details, and the individual human-review booleans.

Validate the envelope before any future signing-source change with `validate-provenance`. When the complete local record is available, pass it with `--record` so the canonical target-record digest is recomputed and compared. A future 0.1.12 Mozilla-signing change must fail closed unless its source revision and rebuilt unsigned XPI digest exactly match the accepted provenance. Generating provenance does not authorize signing or Stable promotion by itself.
