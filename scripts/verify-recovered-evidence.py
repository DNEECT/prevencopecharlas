#!/usr/bin/env python3
"""Verify recovered evidence through short-lived Supabase signed URLs."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--recovery-root", required=True, type=Path)
    parser.add_argument("--project-ref", required=True)
    parser.add_argument("--activity-id", required=True)
    parser.add_argument("--bucket", default="activity-evidence")
    parser.add_argument("--key-env", default="SUPABASE_SERVICE_ROLE_KEY")
    args = parser.parse_args()
    key = os.environ.get(args.key_env)
    if not key:
        raise ValueError(f"Missing {args.key_env}")
    root = args.recovery_root.resolve()
    rows = [json.loads(line) for line in (root / "manifest.jsonl").read_text(
        encoding="utf-8").splitlines() if line.strip()]
    selected = [row for row in rows if row.get("status") == "recovered"
                and row.get("activity_id") == args.activity_id]
    if not selected:
        raise ValueError("No recovered evidence matched the requested activity")
    base = f"https://{args.project_ref}.supabase.co"
    headers = {"Authorization": f"Bearer {key}", "apikey": key,
               "Content-Type": "application/json"}
    results = []
    for row in selected:
        encoded = quote(str(row["object_path"]), safe="/")
        request = Request(
            f"{base}/storage/v1/object/sign/{args.bucket}/{encoded}",
            data=b'{"expiresIn":60}', method="POST", headers=headers)
        with urlopen(request, timeout=30) as response:
            signed = json.loads(response.read())
        relative = signed.get("signedURL") or signed.get("signedUrl")
        if not relative:
            raise ValueError("Signing response did not contain a URL")
        url = relative if relative.startswith("https://") else f"{base}/storage/v1{relative}"
        with urlopen(url, timeout=60) as response:
            data = response.read()
        results.append({
            "kind": row["kind"],
            "expected_bytes": int(row["byte_size"]),
            "downloaded_bytes": len(data),
            "hash_matches": hashlib.sha256(data).hexdigest() == row["sha256"],
        })
    print(json.dumps(results, sort_keys=True))
    if not all(result["expected_bytes"] == result["downloaded_bytes"]
               and result["hash_matches"] for result in results):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
