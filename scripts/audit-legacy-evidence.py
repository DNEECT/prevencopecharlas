"""Audit legacy evidence references without exposing filenames or personal rows.

The source dump is read-only. Only aggregate counts are printed; no source
payload, attachment name, or directory listing is written into the repository.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
from collections import Counter, defaultdict
from pathlib import Path


REVIEWED_DUMP_SHA256 = "388f1f5c054cc4e682261a8fc3b09b23d141c65ec2e9a19232ee9b15b2d67c8a"
SOURCE_COLUMNS = {
    "adjuntolistaasistentes": "attendance-list",
    "adjuntoregistrofotografico": "photographic-record",
}
EXTENSION_MIME = {
    ".pdf": "application/pdf",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}


def decode_copy(value: str) -> str | None:
    if value == r"\N":
        return None
    escapes = {"b": "\b", "f": "\f", "n": "\n", "r": "\r", "t": "\t", "v": "\v", "\\": "\\"}
    result: list[str] = []
    index = 0
    while index < len(value):
        if value[index] != "\\":
            result.append(value[index])
            index += 1
            continue
        index += 1
        if index >= len(value):
            raise ValueError("Invalid trailing COPY escape")
        code = value[index]
        if code in escapes:
            result.append(escapes[code])
            index += 1
        elif code in "01234567":
            match = re.match(r"[0-7]{1,3}", value[index:])
            assert match is not None
            result.append(chr(int(match.group(), 8)))
            index += len(match.group())
        else:
            raise ValueError("Unsupported COPY escape")
    return "".join(result)


def references(dump: Path, pg_restore: Path) -> list[tuple[str, str]]:
    digest = hashlib.sha256(dump.read_bytes()).hexdigest()
    if digest != REVIEWED_DUMP_SHA256:
        raise ValueError("Source dump checksum differs from reviewed inventory")
    result = subprocess.run(
        [str(pg_restore), "--data-only", "--table=registroactividad", "--file=-", str(dump)],
        capture_output=True, text=True, encoding="utf-8", check=True,
    )
    columns: list[str] = []
    found: list[tuple[str, str]] = []
    rows = 0
    in_copy = False
    for line in result.stdout.splitlines():
        match = re.fullmatch(r"COPY public\.registroactividad \(([^)]+)\) FROM stdin;", line)
        if match:
            if in_copy:
                raise ValueError("Duplicate activity COPY block")
            columns = match.group(1).split(", ")
            if not set(SOURCE_COLUMNS).issubset(columns):
                raise ValueError("Attachment columns missing from dump")
            in_copy = True
        elif line == r"\." and in_copy:
            in_copy = False
        elif in_copy:
            values = [decode_copy(value) for value in line.split("\t")]
            if len(values) != len(columns):
                raise ValueError("Invalid activity COPY row")
            row = dict(zip(columns, values))
            rows += 1
            for column, kind in SOURCE_COLUMNS.items():
                name = row[column]
                if name is not None and name.strip():
                    found.append((kind, name))
    if rows != 1637:
        raise ValueError(f"Unexpected activity count: {rows}")
    return found


def filename(value: str) -> str:
    return value.replace("\\", "/").rsplit("/", 1)[-1].casefold()


def audit(found: list[tuple[str, str]], root: Path) -> dict[str, object]:
    if not root.is_dir():
        raise ValueError("Evidence root is not an accessible directory")
    candidates: dict[str, list[Path]] = defaultdict(list)
    scanned = 0
    def fail(error: OSError) -> None:
        raise error

    # os.walk sees every file on the institutional UNC share; pathlib.rglob
    # silently skipped some nested source directories in this environment.
    for directory, _, files in os.walk(root, onerror=fail):
        for name in files:
            item = Path(directory) / name
            scanned += 1
            candidates[item.name.casefold()].append(item)
    kinds: dict[str, Counter[str]] = defaultdict(Counter)
    mime_counts: dict[str, Counter[str]] = defaultdict(Counter)
    for kind, source_name in found:
        basename = filename(source_name)
        matches = candidates.get(basename, [])
        status = "missing" if not matches else "ambiguous" if len(matches) > 1 else "candidate"
        kinds[kind][status] += 1
        mime_counts[kind][EXTENSION_MIME.get(Path(basename).suffix, "unknown")] += 1
    return {
        "source_sha256": REVIEWED_DUMP_SHA256,
        "activity_count": 1637,
        "reference_count": len(found),
        "distinct_reference_names": len({name.casefold() for _, name in found}),
        "files_scanned": scanned,
        "by_kind": {kind: dict(sorted(counts.items())) for kind, counts in sorted(kinds.items())},
        "mime_inferred_from_extension": {
            kind: dict(sorted(counts.items())) for kind, counts in sorted(mime_counts.items())
        },
        "availability_rule": "A filename match is only a candidate; verify bytes and provenance before import.",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dump", type=Path, required=True)
    parser.add_argument("--pg-restore", type=Path, required=True)
    parser.add_argument("--evidence-root", type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(audit(references(args.dump, args.pg_restore), args.evidence_root), indent=2))


if __name__ == "__main__":
    main()
