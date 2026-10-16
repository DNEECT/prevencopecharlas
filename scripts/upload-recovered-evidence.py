#!/usr/bin/env python3
"""Upload validated legacy evidence to the private Supabase Storage bucket."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, asdict
from pathlib import Path, PurePosixPath
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


MAX_FILE_SIZE = 20 * 1024 * 1024
MAGIC = {
    "application/pdf": (b"%PDF-",),
    "image/jpeg": (b"\xff\xd8\xff",),
    "image/png": (b"\x89PNG\r\n\x1a\n",),
    "application/vnd.ms-excel": (b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1",),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": (b"PK\x03\x04",),
}


@dataclass(frozen=True)
class UploadResult:
    evidence_id: str
    object_path: str
    status: str
    byte_size: int
    error: str | None


def safe_relative(value: object, field: str) -> PurePosixPath:
    path = PurePosixPath(str(value))
    if path.is_absolute() or ".." in path.parts or not path.parts:
        raise ValueError(f"Unsafe {field}: {value}")
    return path


def load_rows(root: Path) -> list[dict[str, object]]:
    rows = []
    for line in (root / "manifest.jsonl").read_text(encoding="utf-8").splitlines():
        if line.strip():
            row = json.loads(line)
            if row.get("status") == "recovered":
                rows.append(row)
    if not rows:
        raise ValueError("Manifest contains no recovered evidence")
    paths = [str(row["object_path"]) for row in rows]
    if len(paths) != len(set(paths)):
        raise ValueError("Recovered object paths must be unique")
    return rows


def validate_source(root: Path, row: dict[str, object]) -> tuple[Path, bytes]:
    relative = safe_relative(row["local_relative_path"], "local path")
    source = (root / Path(*relative.parts)).resolve()
    if root.resolve() not in source.parents or not source.is_file():
        raise ValueError(f"Missing recovered file for {row['evidence_id']}")
    data = source.read_bytes()
    size = len(data)
    if size != int(row["byte_size"]) or not 0 < size <= MAX_FILE_SIZE:
        raise ValueError(f"Invalid size for {row['evidence_id']}: {size}")
    if hashlib.sha256(data).hexdigest() != row["sha256"]:
        raise ValueError(f"SHA-256 mismatch for {row['evidence_id']}")
    mime = str(row["mime_type"])
    signatures = MAGIC.get(mime)
    if not signatures or not data[:16].startswith(signatures):
        raise ValueError(f"Signature mismatch for {row['evidence_id']}")
    object_path = safe_relative(row["object_path"], "object path")
    if object_path.parts[:2] != (str(row["activity_id"]), str(row["kind"])):
        raise ValueError(f"Object path scope mismatch for {row['evidence_id']}")
    return source, data


def request_headers(key: str, mime: str | None = None) -> dict[str, str]:
    headers = {"Authorization": f"Bearer {key}", "apikey": key}
    if mime:
        headers["Content-Type"] = mime
        headers["x-upsert"] = "false"
    return headers


def upload_one(root: Path, base_url: str, bucket: str, key: str,
               row: dict[str, object], timeout: int) -> UploadResult:
    evidence_id = str(row["evidence_id"])
    object_path = safe_relative(row["object_path"], "object path").as_posix()
    _, data = validate_source(root, row)
    encoded = quote(object_path, safe="/")
    object_url = f"{base_url}/storage/v1/object/{bucket}/{encoded}"
    try:
        with urlopen(Request(object_url, method="HEAD", headers=request_headers(key)),
                     timeout=timeout) as response:
            stored_size = int(response.headers.get("Content-Length", "-1"))
        if stored_size == len(data):
            return UploadResult(evidence_id, object_path, "existing", len(data), None)
        return UploadResult(evidence_id, object_path, "conflict", len(data),
                            f"Existing object has {stored_size} bytes")
    except HTTPError as error:
        if error.code not in {400, 404}:
            return UploadResult(evidence_id, object_path, "failed", len(data),
                                f"HEAD HTTP {error.code}")
    try:
        request = Request(object_url, data=data, method="POST",
                          headers=request_headers(key, str(row["mime_type"])))
        with urlopen(request, timeout=timeout) as response:
            if getattr(response, "status", 200) not in {200, 201}:
                raise ValueError(f"Unexpected upload status {response.status}")
        return UploadResult(evidence_id, object_path, "uploaded", len(data), None)
    except HTTPError as error:
        return UploadResult(evidence_id, object_path, "failed", len(data),
                            f"POST HTTP {error.code}")
    except (URLError, TimeoutError, OSError, ValueError) as error:
        return UploadResult(evidence_id, object_path, "failed", len(data),
                            type(error).__name__)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--recovery-root", required=True, type=Path)
    parser.add_argument("--project-ref", required=True)
    parser.add_argument("--bucket", default="activity-evidence")
    parser.add_argument("--key-env", default="SUPABASE_SERVICE_ROLE_KEY")
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--timeout", type=int, default=60)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    if not 1 <= args.workers <= 8:
        raise ValueError("Workers must be between 1 and 8")
    root = args.recovery_root.resolve()
    rows = load_rows(root)
    for row in rows:
        validate_source(root, row)
    if args.dry_run:
        print(json.dumps({"validated": len(rows), "network_requests": 0}, sort_keys=True))
        return
    key = os.environ.get(args.key_env)
    if not key:
        raise ValueError(f"Missing {args.key_env}")
    base_url = f"https://{args.project_ref}.supabase.co"
    results: list[UploadResult] = []
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = [executor.submit(upload_one, root, base_url, args.bucket, key, row,
                                   args.timeout) for row in rows]
        for completed, future in enumerate(as_completed(futures), 1):
            results.append(future.result())
            if completed % 100 == 0 or completed == len(futures):
                good = sum(result.status in {"uploaded", "existing"} for result in results)
                print(json.dumps({"completed": completed, "verified_in_storage": good,
                                  "remaining": len(futures) - completed}), flush=True)
    statuses: dict[str, int] = {}
    for result in results:
        statuses[result.status] = statuses.get(result.status, 0) + 1
    report = {"objects": len(results), "statuses": statuses,
              "bytes": sum(result.byte_size for result in results),
              "credentials_written": False}
    (root / "upload-summary.json").write_text(
        json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8", newline="\n")
    failures = [asdict(result) for result in results if result.status not in {"uploaded", "existing"}]
    (root / "upload-failures.json").write_text(
        json.dumps(failures, indent=2, sort_keys=True) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps(report, sort_keys=True))
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
