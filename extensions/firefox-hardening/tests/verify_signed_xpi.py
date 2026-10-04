#!/usr/bin/env python3
"""Verify a Mozilla-signed Firefox Hardening XPI against the deterministic candidate."""

from __future__ import annotations

import copy
import hashlib
import json
import shutil
import sys
import zipfile
from pathlib import Path

EXPECTED_ADDON_ID = "firefox-hardening@goreecloud.com"
MANIFEST = "manifest.json"


def normalized_no_data_collection(value: object) -> bool:
    if not isinstance(value, dict):
        return False
    required = value.get("required")
    optional = value.get("optional", [])
    previous = value.get("has_previous_consent", False)
    return (
        set(value) <= {"required", "optional", "has_previous_consent"}
        and required == ["none"]
        and optional == []
        and previous is False
    )


def data_collection(manifest: dict) -> object:
    return (
        manifest.get("browser_specific_settings", {})
        .get("gecko", {})
        .get("data_collection_permissions")
    )


def without_data_collection(manifest: dict) -> dict:
    result = copy.deepcopy(manifest)
    gecko = result.get("browser_specific_settings", {}).get("gecko", {})
    if isinstance(gecko, dict):
        gecko.pop("data_collection_permissions", None)
    return result


def verify_manifest(unsigned_manifest: dict, signed_manifest: dict) -> str:
    unsigned_dcp = data_collection(unsigned_manifest)
    signed_dcp = data_collection(signed_manifest)

    if without_data_collection(unsigned_manifest) != without_data_collection(signed_manifest):
        raise SystemExit(
            "Mozilla-signed manifest changed semantics outside the allowed "
            "data_collection_permissions normalization boundary"
        )

    if unsigned_dcp is None and signed_dcp is None:
        return "json-serialization-only"
    if unsigned_dcp is not None:
        if signed_dcp != unsigned_dcp:
            raise SystemExit("Mozilla-signed manifest changed source data_collection_permissions")
        return "source-declared-data-collection-preserved"
    if not normalized_no_data_collection(signed_dcp):
        raise SystemExit("Mozilla-signed manifest added an unexpected data collection declaration")
    return "amo-materialized-no-data-declaration"


def main() -> int:
    if len(sys.argv) != 4:
        raise SystemExit("usage: verify_signed_xpi.py VERSION UNSIGNED_XPI SIGNED_XPI")

    version = sys.argv[1]
    candidate = Path(sys.argv[2])
    signed_input = Path(sys.argv[3])
    if not candidate.is_file():
        raise SystemExit(f"unsigned candidate does not exist: {candidate}")
    if not signed_input.is_file():
        raise SystemExit(f"signed XPI does not exist: {signed_input}")

    target = Path(f"dist/goreecloud-firefox-hardening-{version}-signed.xpi")
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(signed_input, target)

    with zipfile.ZipFile(candidate) as unsigned_archive, zipfile.ZipFile(target) as signed_archive:
        if unsigned_archive.testzip():
            raise SystemExit("unsigned candidate archive integrity failure")
        if signed_archive.testzip():
            raise SystemExit("signed XPI archive integrity failure")

        unsigned_names = unsigned_archive.namelist()
        signed_names = signed_archive.namelist()
        if MANIFEST not in unsigned_names or MANIFEST not in signed_names:
            raise SystemExit("candidate or signed XPI is missing manifest.json")

        signature_files = sorted(
            name for name in signed_names
            if name.startswith("META-INF/") and not name.endswith("/")
        )
        if not signature_files:
            raise SystemExit("signed XPI does not contain Mozilla signature metadata")

        unsigned_payload = sorted(name for name in unsigned_names if not name.endswith("/"))
        signed_payload = sorted(
            name for name in signed_names
            if not name.startswith("META-INF/") and not name.endswith("/")
        )
        if signed_payload != unsigned_payload:
            raise SystemExit("signed XPI payload inventory differs from deterministic candidate")

        for name in unsigned_payload:
            if name == MANIFEST:
                continue
            if signed_archive.read(name) != unsigned_archive.read(name):
                raise SystemExit(f"signed XPI changed runtime payload bytes for {name}")

        unsigned_manifest = json.loads(unsigned_archive.read(MANIFEST).decode("utf-8"))
        signed_manifest = json.loads(signed_archive.read(MANIFEST).decode("utf-8"))
        manifest_normalization = verify_manifest(unsigned_manifest, signed_manifest)

        addon_id = (
            signed_manifest.get("browser_specific_settings", {})
            .get("gecko", {})
            .get("id")
        )
        if addon_id != EXPECTED_ADDON_ID:
            raise SystemExit(f"signed XPI changed Firefox add-on ID: {addon_id!r}")
        if signed_manifest.get("version") != version:
            raise SystemExit(f"signed XPI changed version: {signed_manifest.get('version')!r}")

    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    Path("dist/signed-sha256.txt").write_text(
        f"{digest}  {target.name}\n", encoding="utf-8"
    )
    parity = {
        "schemaVersion": 1,
        "manifestNormalization": manifest_normalization,
        "nonManifestPayloadByteExact": True,
        "payloadInventoryExact": True,
        "signatureMetadataFiles": signature_files,
        "signedSha256": digest,
    }
    Path("dist/signed-xpi-parity.json").write_text(
        json.dumps(parity, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(parity, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
