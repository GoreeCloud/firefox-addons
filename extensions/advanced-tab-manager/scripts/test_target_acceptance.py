#!/usr/bin/env python3
from __future__ import annotations

import tempfile
import unittest
import zipfile
import json
from pathlib import Path

import target_acceptance as ta

SOURCE = "1" * 40


def candidate_xpi(root: Path, version: str = ta.EXPECTED_RELEASE, addon_id: str = ta.EXPECTED_ADDON_ID) -> Path:
    path = root / "candidate.xpi"
    manifest = {
        "manifest_version": 3,
        "name": ta.PRODUCT,
        "version": version,
        "browser_specific_settings": {"gecko": {"id": addon_id}},
    }
    with zipfile.ZipFile(path, "w") as archive:
        archive.writestr("manifest.json", json.dumps(manifest))
    return path


def accepted_record(root: Path) -> dict:
    xpi = candidate_xpi(root)
    record = ta.new_record(
        xpi=xpi,
        source_revision=SOURCE,
        firefox_version="156",
        operating_system="Linux",
        device_class="laptop",
        installation_mode="temporary-unsigned",
        assistive_technology="screen-reader-reviewed",
        reviewed_at="2026-09-27T03:00:00Z",
    )
    for group in ("keyboard_checks", "assistive_technology_checks", "environment_checks"):
        record[group] = {key: True for key in record[group]}
    record["decision"] = "accepted"
    return record


class TargetAcceptanceTests(unittest.TestCase):
    def test_release_ready_record_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            record = accepted_record(Path(tmp))
            result = ta.validate_record(record, expected_source_revision=SOURCE, require_release_ready=True)
            self.assertTrue(result["release_ready"])

    def test_accepted_record_requires_every_keyboard_check(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            record = accepted_record(Path(tmp))
            record["keyboard_checks"]["visible_focus_all_surfaces"] = False
            with self.assertRaises(ta.AcceptanceError):
                ta.validate_record(record)

    def test_accepted_record_requires_every_assistive_technology_check(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            record = accepted_record(Path(tmp))
            record["assistive_technology_checks"]["active_tab_state_announced"] = None
            with self.assertRaises(ta.AcceptanceError):
                ta.validate_record(record)

    def test_accepted_record_requires_every_environment_check(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            record = accepted_record(Path(tmp))
            record["environment_checks"]["forced_colors_readable"] = False
            with self.assertRaises(ta.AcceptanceError):
                ta.validate_record(record)

    def test_accepted_record_rejects_blocker(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            record = accepted_record(Path(tmp))
            record["blockers"] = ["clipping-or-overlap"]
            with self.assertRaises(ta.AcceptanceError):
                ta.validate_record(record)

    def test_unknown_fields_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            record = accepted_record(Path(tmp))
            record["notes"] = "free-form evidence is not permitted"
            with self.assertRaises(ta.AcceptanceError):
                ta.validate_record(record)

    def test_record_rejects_candidate_revision_mismatch(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            record = accepted_record(Path(tmp))
            with self.assertRaises(ta.AcceptanceError):
                ta.validate_record(record, expected_source_revision="2" * 40)

    def test_xpi_identity_is_fail_closed(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            wrong = candidate_xpi(root, addon_id="wrong@goreecloud.com")
            with self.assertRaises(ta.AcceptanceError):
                ta.new_record(
                    xpi=wrong,
                    source_revision=SOURCE,
                    firefox_version="156",
                    operating_system="Linux",
                    device_class="laptop",
                    installation_mode="temporary-unsigned",
                    assistive_technology="screen-reader-reviewed",
                )

    def test_release_ready_provenance_is_privacy_minimized(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            record = accepted_record(Path(tmp))
            provenance = ta.build_provenance(record)
            self.assertEqual(set(provenance), ta.PROVENANCE_KEYS)
            self.assertTrue(provenance["release_ready"])
            self.assertEqual(provenance["decision"], "accepted")
            self.assertNotIn("environment", provenance)
            self.assertNotIn("assistive_technology", provenance)
            self.assertNotIn("keyboard_checks", provenance)

    def test_provenance_rejects_incomplete_target_record(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            xpi = candidate_xpi(root)
            record = ta.new_record(
                xpi=xpi,
                source_revision=SOURCE,
                firefox_version="156",
                operating_system="Linux",
                device_class="laptop",
                installation_mode="temporary-unsigned",
                assistive_technology="screen-reader-reviewed",
                reviewed_at="2026-09-27T03:00:00Z",
            )
            with self.assertRaises(ta.AcceptanceError):
                ta.build_provenance(record)

    def test_provenance_validates_against_full_record(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            record = accepted_record(Path(tmp))
            provenance = ta.build_provenance(record)
            result = ta.validate_provenance(
                provenance,
                expected_source_revision=SOURCE,
                expected_xpi_sha256=record["xpi_sha256"],
                record=record,
            )
            self.assertTrue(result["release_ready"])

    def test_provenance_rejects_record_digest_mismatch(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            record = accepted_record(Path(tmp))
            provenance = ta.build_provenance(record)
            provenance["target_record_sha256"] = "0" * 64
            with self.assertRaises(ta.AcceptanceError):
                ta.validate_provenance(provenance, record=record)

    def test_rejected_decision_requires_known_blocker(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            record = accepted_record(Path(tmp))
            record["decision"] = "rejected"
            record["blockers"] = []
            with self.assertRaises(ta.AcceptanceError):
                ta.validate_record(record)


if __name__ == "__main__":
    unittest.main()
