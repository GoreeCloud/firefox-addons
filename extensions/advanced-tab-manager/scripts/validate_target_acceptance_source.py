#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = ROOT.parents[1]

tool = (ROOT / "scripts/target_acceptance.py").read_text(encoding="utf-8")
tests = (ROOT / "scripts/test_target_acceptance.py").read_text(encoding="utf-8")
record = (ROOT / "TARGET-ACCEPTANCE-0.1.12.md").read_text(encoding="utf-8")
repository_workflow = (REPOSITORY_ROOT / ".github/workflows/firefox-repository.yml").read_text(encoding="utf-8")
target_workflow = (REPOSITORY_ROOT / ".github/workflows/advanced-tab-manager-target-review.yml").read_text(encoding="utf-8")
signing_workflow = (REPOSITORY_ROOT / ".github/workflows/advanced-tab-manager-mozilla-signing.yml").read_text(encoding="utf-8")
packager = (REPOSITORY_ROOT / "shared/scripts/package_extension.py").read_text(encoding="utf-8")

for required in (
    ROOT / "scripts/target_acceptance.py",
    ROOT / "scripts/test_target_acceptance.py",
    ROOT / "scripts/validate_target_acceptance_source.py",
    ROOT / "TARGET-ACCEPTANCE-0.1.12.md",
    REPOSITORY_ROOT / ".github/workflows/advanced-tab-manager-target-review.yml",
):
    assert required.is_file(), required

for marker in (
    'EXPECTED_RELEASE = "0.1.12"',
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
):
    assert marker in tool, f"target acceptance contract missing: {marker}"

for marker in (
    'test_release_ready_record_passes',
    'test_accepted_record_requires_every_keyboard_check',
    'test_accepted_record_requires_every_assistive_technology_check',
    'test_accepted_record_requires_every_environment_check',
    'test_accepted_record_rejects_blocker',
    'test_unknown_fields_are_rejected',
    'test_record_rejects_candidate_revision_mismatch',
    'test_xpi_identity_is_fail_closed',
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

assert "Human target acceptance: **Pending**" in record
assert "complete machine-readable target record remains local" in record.lower()
assert "does not establish human acceptance" in record.lower()
assert "GLAZE UI V1.6 / 1.6.0" in record

assert "ATM_RELEASE_VERSION: '0.1.11'" in signing_workflow
assert "ATM_RELEASE_CANDIDATE_SHA256: '9c0f44926ac1d2f213fd07f82dd18fa11bd54ceebc6cd871898fe82b962a5b02'" in signing_workflow

assert 'EXCLUDE_SUFFIXES = {".md", ".py", ".pyc"}' in packager
assert 'EXCLUDE_PARTS.add("tests")' in packager

print("Advanced Tab Manager target acceptance source contract validated.")
