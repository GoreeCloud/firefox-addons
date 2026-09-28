#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = ROOT.parents[1]

tool = (ROOT / "scripts/target_acceptance.py").read_text(encoding="utf-8")
tests = (ROOT / "scripts/test_target_acceptance.py").read_text(encoding="utf-8")
record = (ROOT / "TARGET-ACCEPTANCE-0.1.13.md").read_text(encoding="utf-8")
repository_workflow = (REPOSITORY_ROOT / ".github/workflows/firefox-repository.yml").read_text(encoding="utf-8")
target_workflow = (REPOSITORY_ROOT / ".github/workflows/advanced-tab-manager-target-review.yml").read_text(encoding="utf-8")
signing_workflow = (REPOSITORY_ROOT / ".github/workflows/advanced-tab-manager-mozilla-signing.yml").read_text(encoding="utf-8")
packager = (REPOSITORY_ROOT / "shared/scripts/package_extension.py").read_text(encoding="utf-8")

for required in (
    ROOT / "scripts/target_acceptance.py",
    ROOT / "scripts/test_target_acceptance.py",
    ROOT / "scripts/validate_target_acceptance_source.py",
    ROOT / "TARGET-ACCEPTANCE-0.1.13.md",
    REPOSITORY_ROOT / ".github/workflows/advanced-tab-manager-target-review.yml",
):
    assert required.is_file(), required

for marker in (
    'EXPECTED_RELEASE = "0.1.13"',
    'EXPECTED_ADDON_ID = "advanced-tab-manager@goreecloud.com"',
    'SCHEMA_VERSION = 1',
    'KEYBOARD_CHECKS = (',
    'ASSISTIVE_TECHNOLOGY_CHECKS = (',
    'ENVIRONMENT_CHECKS = (',
    'BLOCKER_CODES = {',
    '_exact_keys(',
    'require_release_ready',
    'decision == "accepted"',
    'all(value is True for value in all_checks)',
    'PROVENANCE_KEYS = {',
    'build_provenance(',
    'validate_provenance(',
    'target_record_sha256',
    'sub.add_parser("provenance"',
    'sub.add_parser("validate-provenance"',
):
    assert marker in tool, f"target acceptance contract missing: {marker}"

for marker in (
    'test_summary_uses_current_release_identity',
    'test_release_ready_record_passes',
    'test_accepted_record_requires_every_keyboard_check',
    'test_accepted_record_requires_every_assistive_technology_check',
    'test_accepted_record_requires_every_environment_check',
    'test_accepted_record_rejects_blocker',
    'test_unknown_fields_are_rejected',
    'test_record_rejects_candidate_revision_mismatch',
    'test_xpi_identity_is_fail_closed',
    'test_release_ready_provenance_is_privacy_minimized',
    'test_provenance_rejects_incomplete_target_record',
    'test_provenance_validates_against_full_record',
    'test_provenance_rejects_record_digest_mismatch',
):
    assert marker in tests, f"target acceptance regression missing: {marker}"

assert "python extensions/advanced-tab-manager/scripts/validate_target_acceptance_source.py" in repository_workflow
assert "python extensions/advanced-tab-manager/scripts/test_target_acceptance.py" in repository_workflow

assert "workflow_dispatch:" in target_workflow
assert "source_revision:" in target_workflow
assert "ref: ${{ inputs.source_revision }}" in target_workflow
assert 'test "$actual" = "$TARGET_SOURCE_REVISION"' in target_workflow
assert "cmp \"$A\" \"$B\"" in target_workflow
assert "firefox_runtime_smoke.py" in target_workflow
assert "stable_security_review.py" in target_workflow
assert "glaze_consumer_qualification.py" in target_workflow
assert "actions/upload-artifact@v4" in target_workflow
assert "AMO_JWT_" not in target_workflow and "web-ext" not in target_workflow

assert "**Human target acceptance: Pending**" in record
assert "complete machine-readable target record remains local" in record.lower()
assert "does not establish human acceptance" in record.lower()
assert "GLAZE UI V1.6 / 1.6.0" in record
assert "privacy-safe signing provenance" in record.lower()

assert "ATM_RELEASE_VERSION: '0.1.12'" in signing_workflow
assert "ATM_RELEASE_SOURCE_REVISION: '43f3010607550d7d4380353b97f85a4dd0186695'" in signing_workflow
assert "ATM_RELEASE_CANDIDATE_SHA256: '3db751f3a2c80d8d339ea0648d00a8ff016840f6587b58e5a61c484bf687588f'" in signing_workflow
assert "ATM_TARGET_RECORD_SHA256: '922e7f0eb1ceb3c9f0bbab23c63bfe72d99556da1661ae1abee17ab1c7ccabde'" in signing_workflow
assert "validate-provenance" in signing_workflow
assert "target-acceptance-provenance-0.1.12.json" in signing_workflow

assert 'EXCLUDE_SUFFIXES = {".md", ".py", ".pyc"}' in packager
assert 'EXCLUDE_PARTS.add("tests")' in packager

print("Advanced Tab Manager target acceptance source contract validated.")
