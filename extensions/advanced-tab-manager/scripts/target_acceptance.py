#!/usr/bin/env python3
"""Privacy-minimized human target-acceptance contract for Advanced Tab Manager 0.1.13."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SCHEMA_VERSION = 1
PRODUCT = "GoreeCloud Advanced Tab Manager"
EXPECTED_RELEASE = "0.1.13"
EXPECTED_ADDON_ID = "advanced-tab-manager@goreecloud.com"

DEVICE_CLASSES = {"desktop", "laptop"}
INSTALLATION_MODES = {"temporary-unsigned"}

KEYBOARD_CHECKS = (
    "sidebar_primary_navigation",
    "tab_activation_native_button",
    "tab_row_actions_reachable",
    "command_palette_open_search_execute_close",
    "command_palette_focus_restored",
    "popup_primary_actions_reachable",
    "manager_controls_reachable",
    "visible_focus_all_surfaces",
)

ASSISTIVE_TECHNOLOGY_CHECKS = (
    "sidebar_landmarks_and_labels_announced",
    "active_tab_state_announced",
    "row_actions_distinguishable",
    "command_palette_dialog_listbox_announced",
    "manager_status_and_controls_announced",
    "live_regions_restrained",
)

ENVIRONMENT_CHECKS = (
    "normal_light_current_target_readable",
    "forced_colors_readable",
    "reduced_transparency_readable",
    "dark_appearance_readable",
    "reduced_motion_no_unexpected_motion",
    "zoom_200_reflow_usable",
    "large_text_reflow_usable",
    "narrow_sidebar_usable",
    "popup_no_clipping",
    "manager_no_clipping",
    "firefox_extension_icon_surfaces",
)

BLOCKER_CODES = {
    "keyboard-failure",
    "assistive-technology-failure",
    "forced-colors-failure",
    "reduced-transparency-failure",
    "dark-appearance-failure",
    "reduced-motion-failure",
    "large-text-or-zoom-failure",
    "clipping-or-overlap",
    "runtime-regression",
    "source-provenance-mismatch",
    "other-release-blocker",
}

TOP_LEVEL_KEYS = {
    "schema_version",
    "product",
    "candidate_version",
    "addon_id",
    "source_revision",
    "xpi_sha256",
    "environment",
    "keyboard_checks",
    "assistive_technology_checks",
    "environment_checks",
    "blockers",
    "decision",
}

ENVIRONMENT_KEYS = {
    "firefox_version",
    "operating_system",
    "device_class",
    "installation_mode",
    "assistive_technology",
    "reviewed_at",
}

PROVENANCE_SCHEMA_VERSION = 1
PROVENANCE_KEYS = {
    "schema_version",
    "product",
    "candidate_version",
    "addon_id",
    "source_revision",
    "xpi_sha256",
    "target_record_sha256",
    "decision",
    "release_ready",
    "reviewed_at",
}


class AcceptanceError(ValueError):
    pass


def _exact_keys(value: dict[str, Any], expected: set[str], label: str) -> None:
    actual = set(value)
    if actual != expected:
        missing = sorted(expected - actual)
        extra = sorted(actual - expected)
        raise AcceptanceError(f"{label} keys mismatch; missing={missing}, extra={extra}")


def _require_nonempty_string(value: Any, label: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise AcceptanceError(f"{label} must be a non-empty string")
    return value.strip()


def _require_sha(value: Any, label: str) -> str:
    value = _require_nonempty_string(value, label)
    if re.fullmatch(r"[0-9a-f]{40}", value) is None:
        raise AcceptanceError(f"{label} must be a full lowercase Git SHA")
    return value


def _require_sha256(value: Any, label: str) -> str:
    value = _require_nonempty_string(value, label)
    if re.fullmatch(r"[0-9a-f]{64}", value) is None:
        raise AcceptanceError(f"{label} must be a lowercase SHA-256")
    return value


def _validate_timestamp(value: Any) -> str:
    value = _require_nonempty_string(value, "environment.reviewed_at")
    if not value.endswith("Z"):
        raise AcceptanceError("environment.reviewed_at must be UTC RFC3339 ending in Z")
    try:
        datetime.fromisoformat(value[:-1] + "+00:00")
    except ValueError as exc:
        raise AcceptanceError("environment.reviewed_at must be valid RFC3339") from exc
    return value


def _validate_checks(value: Any, expected: tuple[str, ...], label: str) -> dict[str, bool | None]:
    if not isinstance(value, dict):
        raise AcceptanceError(f"{label} must be an object")
    _exact_keys(value, set(expected), label)
    for key, result in value.items():
        if result is not None and not isinstance(result, bool):
            raise AcceptanceError(f"{label}.{key} must be true, false, or null")
    return value


def _manifest_from_xpi(xpi: Path) -> dict[str, Any]:
    try:
        with zipfile.ZipFile(xpi) as archive:
            manifest = json.loads(archive.read("manifest.json").decode("utf-8"))
    except (OSError, zipfile.BadZipFile, KeyError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise AcceptanceError(f"unable to read candidate XPI manifest: {exc}") from exc
    if manifest.get("version") != EXPECTED_RELEASE:
        raise AcceptanceError(f"candidate XPI version must be {EXPECTED_RELEASE}")
    addon_id = manifest.get("browser_specific_settings", {}).get("gecko", {}).get("id")
    if addon_id != EXPECTED_ADDON_ID:
        raise AcceptanceError(f"candidate XPI add-on ID must be {EXPECTED_ADDON_ID}")
    return manifest


def _xpi_sha256(xpi: Path) -> str:
    digest = hashlib.sha256()
    with xpi.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _canonical_record_sha256(record: dict[str, Any]) -> str:
    payload = json.dumps(record, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def new_record(
    xpi: Path,
    source_revision: str,
    firefox_version: str,
    operating_system: str,
    device_class: str,
    installation_mode: str,
    assistive_technology: str,
    reviewed_at: str | None = None,
) -> dict[str, Any]:
    if not xpi.is_file():
        raise AcceptanceError("candidate XPI does not exist")
    _manifest_from_xpi(xpi)
    source_revision = _require_sha(source_revision, "source_revision")
    firefox_version = _require_nonempty_string(firefox_version, "firefox_version")
    operating_system = _require_nonempty_string(operating_system, "operating_system")
    assistive_technology = _require_nonempty_string(assistive_technology, "assistive_technology")
    if device_class not in DEVICE_CLASSES:
        raise AcceptanceError(f"device_class must be one of {sorted(DEVICE_CLASSES)}")
    if installation_mode not in INSTALLATION_MODES:
        raise AcceptanceError(f"installation_mode must be one of {sorted(INSTALLATION_MODES)}")
    reviewed_at = reviewed_at or datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    _validate_timestamp(reviewed_at)

    return {
        "schema_version": SCHEMA_VERSION,
        "product": PRODUCT,
        "candidate_version": EXPECTED_RELEASE,
        "addon_id": EXPECTED_ADDON_ID,
        "source_revision": source_revision,
        "xpi_sha256": _xpi_sha256(xpi),
        "environment": {
            "firefox_version": firefox_version,
            "operating_system": operating_system,
            "device_class": device_class,
            "installation_mode": installation_mode,
            "assistive_technology": assistive_technology,
            "reviewed_at": reviewed_at,
        },
        "keyboard_checks": {name: None for name in KEYBOARD_CHECKS},
        "assistive_technology_checks": {name: None for name in ASSISTIVE_TECHNOLOGY_CHECKS},
        "environment_checks": {name: None for name in ENVIRONMENT_CHECKS},
        "blockers": [],
        "decision": "incomplete",
    }


def validate_record(
    record: Any,
    expected_source_revision: str | None = None,
    expected_xpi_sha256: str | None = None,
    require_release_ready: bool = False,
) -> dict[str, Any]:
    if not isinstance(record, dict):
        raise AcceptanceError("record must be an object")
    _exact_keys(record, TOP_LEVEL_KEYS, "record")
    if record["schema_version"] != SCHEMA_VERSION:
        raise AcceptanceError(f"schema_version must be {SCHEMA_VERSION}")
    if record["product"] != PRODUCT:
        raise AcceptanceError(f"product must be {PRODUCT}")
    if record["candidate_version"] != EXPECTED_RELEASE:
        raise AcceptanceError(f"candidate_version must be {EXPECTED_RELEASE}")
    if record["addon_id"] != EXPECTED_ADDON_ID:
        raise AcceptanceError(f"addon_id must be {EXPECTED_ADDON_ID}")

    source_revision = _require_sha(record["source_revision"], "source_revision")
    xpi_sha256 = _require_sha256(record["xpi_sha256"], "xpi_sha256")
    if expected_source_revision is not None and source_revision != _require_sha(expected_source_revision, "expected_source_revision"):
        raise AcceptanceError("record source revision does not match expected source revision")
    if expected_xpi_sha256 is not None and xpi_sha256 != _require_sha256(expected_xpi_sha256, "expected_xpi_sha256"):
        raise AcceptanceError("record XPI digest does not match expected XPI digest")

    environment = record["environment"]
    if not isinstance(environment, dict):
        raise AcceptanceError("environment must be an object")
    _exact_keys(environment, ENVIRONMENT_KEYS, "environment")
    for key in ("firefox_version", "operating_system", "assistive_technology"):
        _require_nonempty_string(environment[key], f"environment.{key}")
    if environment["device_class"] not in DEVICE_CLASSES:
        raise AcceptanceError(f"environment.device_class must be one of {sorted(DEVICE_CLASSES)}")
    if environment["installation_mode"] not in INSTALLATION_MODES:
        raise AcceptanceError(f"environment.installation_mode must be one of {sorted(INSTALLATION_MODES)}")
    _validate_timestamp(environment["reviewed_at"])

    keyboard_checks = _validate_checks(record["keyboard_checks"], KEYBOARD_CHECKS, "keyboard_checks")
    assistive_checks = _validate_checks(record["assistive_technology_checks"], ASSISTIVE_TECHNOLOGY_CHECKS, "assistive_technology_checks")
    environment_checks = _validate_checks(record["environment_checks"], ENVIRONMENT_CHECKS, "environment_checks")

    blockers = record["blockers"]
    if not isinstance(blockers, list) or not all(isinstance(item, str) for item in blockers):
        raise AcceptanceError("blockers must be an array of blocker codes")
    if len(blockers) != len(set(blockers)):
        raise AcceptanceError("blockers must not contain duplicates")
    unknown_blockers = sorted(set(blockers) - BLOCKER_CODES)
    if unknown_blockers:
        raise AcceptanceError(f"unknown blocker codes: {unknown_blockers}")

    decision = record["decision"]
    if decision not in {"incomplete", "accepted", "rejected"}:
        raise AcceptanceError("decision must be incomplete, accepted, or rejected")

    all_checks = list(keyboard_checks.values()) + list(assistive_checks.values()) + list(environment_checks.values())
    release_ready = decision == "accepted" and not blockers and all(value is True for value in all_checks)

    if decision == "accepted" and not release_ready:
        raise AcceptanceError("accepted decision requires every governed check true and zero blockers")
    if decision == "rejected" and not blockers:
        raise AcceptanceError("rejected decision requires at least one blocker code")
    if require_release_ready and not release_ready:
        raise AcceptanceError("record is not release-ready target evidence")

    return {
        "source_revision": source_revision,
        "xpi_sha256": xpi_sha256,
        "firefox_version": environment["firefox_version"],
        "operating_system": environment["operating_system"],
        "installation_mode": environment["installation_mode"],
        "decision": decision,
        "release_ready": release_ready,
        "blockers": list(blockers),
    }


def build_provenance(record: dict[str, Any]) -> dict[str, Any]:
    result = validate_record(record, require_release_ready=True)
    return {
        "schema_version": PROVENANCE_SCHEMA_VERSION,
        "product": PRODUCT,
        "candidate_version": EXPECTED_RELEASE,
        "addon_id": EXPECTED_ADDON_ID,
        "source_revision": result["source_revision"],
        "xpi_sha256": result["xpi_sha256"],
        "target_record_sha256": _canonical_record_sha256(record),
        "decision": "accepted",
        "release_ready": True,
        "reviewed_at": _validate_timestamp(record["environment"]["reviewed_at"]),
    }


def validate_provenance(
    provenance: Any,
    expected_source_revision: str | None = None,
    expected_xpi_sha256: str | None = None,
    expected_record_sha256: str | None = None,
    record: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if not isinstance(provenance, dict):
        raise AcceptanceError("provenance must be an object")
    _exact_keys(provenance, PROVENANCE_KEYS, "provenance")
    if provenance["schema_version"] != PROVENANCE_SCHEMA_VERSION:
        raise AcceptanceError(f"provenance schema_version must be {PROVENANCE_SCHEMA_VERSION}")
    if provenance["product"] != PRODUCT:
        raise AcceptanceError(f"provenance product must be {PRODUCT}")
    if provenance["candidate_version"] != EXPECTED_RELEASE:
        raise AcceptanceError(f"provenance candidate_version must be {EXPECTED_RELEASE}")
    if provenance["addon_id"] != EXPECTED_ADDON_ID:
        raise AcceptanceError(f"provenance addon_id must be {EXPECTED_ADDON_ID}")

    source_revision = _require_sha(provenance["source_revision"], "provenance.source_revision")
    xpi_sha256 = _require_sha256(provenance["xpi_sha256"], "provenance.xpi_sha256")
    record_sha256 = _require_sha256(provenance["target_record_sha256"], "provenance.target_record_sha256")
    reviewed_at = _validate_timestamp(provenance["reviewed_at"])

    if provenance["decision"] != "accepted" or provenance["release_ready"] is not True:
        raise AcceptanceError("provenance must represent accepted release-ready target evidence")
    if expected_source_revision is not None and source_revision != _require_sha(expected_source_revision, "expected_source_revision"):
        raise AcceptanceError("provenance source revision does not match expected source revision")
    if expected_xpi_sha256 is not None and xpi_sha256 != _require_sha256(expected_xpi_sha256, "expected_xpi_sha256"):
        raise AcceptanceError("provenance XPI digest does not match expected XPI digest")
    if expected_record_sha256 is not None and record_sha256 != _require_sha256(expected_record_sha256, "expected_record_sha256"):
        raise AcceptanceError("provenance target-record digest does not match expected target-record digest")

    if record is not None:
        validated = validate_record(
            record,
            expected_source_revision=source_revision,
            expected_xpi_sha256=xpi_sha256,
            require_release_ready=True,
        )
        if not validated["release_ready"]:
            raise AcceptanceError("referenced target record is not release-ready")
        if _canonical_record_sha256(record) != record_sha256:
            raise AcceptanceError("provenance target-record digest does not match the supplied target record")

    return {
        "source_revision": source_revision,
        "xpi_sha256": xpi_sha256,
        "target_record_sha256": record_sha256,
        "decision": "accepted",
        "release_ready": True,
        "reviewed_at": reviewed_at,
    }


def _load_record(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise AcceptanceError(f"unable to read record: {exc}") from exc
    if not isinstance(value, dict):
        raise AcceptanceError("record must be an object")
    return value


def _write_record(path: Path, record: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(record, indent=2, sort_keys=False) + "\n", encoding="utf-8")


def _summary(result: dict[str, Any]) -> str:
    return "\n".join(
        [
            f"# {PRODUCT.removeprefix('GoreeCloud ')} {EXPECTED_RELEASE} Target Acceptance Summary",
            "",
            f"- Source revision: `{result['source_revision']}`",
            f"- XPI SHA-256: `{result['xpi_sha256']}`",
            f"- Firefox: `{result['firefox_version']}`",
            f"- Operating system: `{result['operating_system']}`",
            f"- Installation mode: `{result['installation_mode']}`",
            f"- Decision: **{result['decision']}**",
            f"- Release-ready target evidence: **{'yes' if result['release_ready'] else 'no'}**",
            f"- Blockers: `{', '.join(result['blockers']) if result['blockers'] else 'none'}`",
            "",
            "Raw URLs, browsing history, page content, cookies, credentials, screenshots, and free-form notes are intentionally absent from this evidence format.",
            "",
        ]
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    create = sub.add_parser("new", help="create an incomplete target-acceptance template bound to an exact XPI")
    create.add_argument("--xpi", required=True, type=Path)
    create.add_argument("--source-revision", required=True)
    create.add_argument("--firefox-version", required=True)
    create.add_argument("--operating-system", required=True)
    create.add_argument("--device-class", required=True, choices=sorted(DEVICE_CLASSES))
    create.add_argument("--installation-mode", default="temporary-unsigned", choices=sorted(INSTALLATION_MODES))
    create.add_argument("--assistive-technology", required=True)
    create.add_argument("--reviewed-at", default=None)
    create.add_argument("--output", required=True, type=Path)

    validate = sub.add_parser("validate", help="validate a completed or in-progress target-acceptance record")
    validate.add_argument("record", type=Path)
    validate.add_argument("--expected-source-revision", default=None)
    validate.add_argument("--expected-xpi-sha256", default=None)
    validate.add_argument("--require-release-ready", action="store_true")

    summary = sub.add_parser("summary", help="print a privacy-safe summary of a validated target record")
    summary.add_argument("record", type=Path)
    summary.add_argument("--expected-source-revision", default=None)
    summary.add_argument("--expected-xpi-sha256", default=None)
    summary.add_argument("--require-release-ready", action="store_true")

    provenance = sub.add_parser("provenance", help="emit a privacy-safe signing provenance envelope from accepted target evidence")
    provenance.add_argument("record", type=Path)
    provenance.add_argument("--output", required=True, type=Path)

    validate_provenance_parser = sub.add_parser("validate-provenance", help="validate a privacy-safe signing provenance envelope")
    validate_provenance_parser.add_argument("provenance_file", type=Path)
    validate_provenance_parser.add_argument("--record", type=Path, default=None)
    validate_provenance_parser.add_argument("--expected-source-revision", default=None)
    validate_provenance_parser.add_argument("--expected-xpi-sha256", default=None)
    validate_provenance_parser.add_argument("--expected-record-sha256", default=None)

    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        if args.command == "new":
            record = new_record(
                args.xpi,
                args.source_revision,
                args.firefox_version,
                args.operating_system,
                args.device_class,
                args.installation_mode,
                args.assistive_technology,
                args.reviewed_at,
            )
            _write_record(args.output, record)
            print(f"Created incomplete target-acceptance template: {args.output}")
            print("Complete only the governed boolean checks and blocker codes; do not add URLs, screenshots, page content, or free-form notes.")
            return 0

        if args.command == "provenance":
            record = _load_record(args.record)
            provenance = build_provenance(record)
            _write_record(args.output, provenance)
            print(f"Created privacy-safe target-acceptance provenance: {args.output}")
            return 0

        if args.command == "validate-provenance":
            provenance = _load_record(args.provenance_file)
            record = _load_record(args.record) if args.record is not None else None
            result = validate_provenance(
                provenance,
                args.expected_source_revision,
                args.expected_xpi_sha256,
                args.expected_record_sha256,
                record,
            )
            print(json.dumps(result, sort_keys=True))
            return 0

        record = _load_record(args.record)
        result = validate_record(record, args.expected_source_revision, args.expected_xpi_sha256, args.require_release_ready)
        if args.command == "summary":
            sys.stdout.write(_summary(result))
        else:
            print(json.dumps(result, sort_keys=True))
        return 0
    except AcceptanceError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
