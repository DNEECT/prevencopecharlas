#!/usr/bin/env python3
"""Validate recovered evidence and prepare a Storage tree plus transactional SQL."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import uuid
from pathlib import Path, PurePosixPath


MAX_FILE_SIZE = 20 * 1024 * 1024
MAGIC = {
    "application/pdf": (b"%PDF-",),
    "image/jpeg": (b"\xff\xd8\xff",),
    "image/png": (b"\x89PNG\r\n\x1a\n",),
    "application/vnd.ms-excel": (b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1",),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": (b"PK\x03\x04",),
}


def load_recovered(manifest: Path) -> list[dict[str, object]]:
    rows = []
    for number, line in enumerate(manifest.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        row = json.loads(line)
        if row.get("status") == "recovered":
            rows.append(row)
        elif row.get("status") not in {"unavailable", "invalid_content"}:
            raise ValueError(f"Unknown status on manifest line {number}")
    ids = [str(row["evidence_id"]) for row in rows]
    paths = [str(row["object_path"]) for row in rows]
    if len(ids) != len(set(ids)) or len(paths) != len(set(paths)):
        raise ValueError("Recovered evidence IDs and object paths must be unique")
    return rows


def safe_relative(value: object, field: str) -> PurePosixPath:
    path = PurePosixPath(str(value))
    if path.is_absolute() or ".." in path.parts or not path.parts:
        raise ValueError(f"Unsafe {field}: {value}")
    return path


def validate_file(root: Path, row: dict[str, object]) -> Path:
    relative = safe_relative(row["local_relative_path"], "local path")
    source = (root / Path(*relative.parts)).resolve()
    if root.resolve() not in source.parents or not source.is_file():
        raise ValueError(f"Missing recovered file for {row['evidence_id']}")
    size = source.stat().st_size
    if size != int(row["byte_size"]) or not 0 < size <= MAX_FILE_SIZE:
        raise ValueError(f"Invalid size for {row['evidence_id']}: {size}")
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    if digest != row["sha256"]:
        raise ValueError(f"SHA-256 mismatch for {row['evidence_id']}")
    mime = str(row["mime_type"])
    signatures = MAGIC.get(mime)
    if not signatures or not source.read_bytes()[:16].startswith(signatures):
        raise ValueError(f"Signature mismatch for {row['evidence_id']}")
    object_path = safe_relative(row["object_path"], "object path")
    expected_prefix = (str(row["activity_id"]), str(row["kind"]))
    if object_path.parts[:2] != expected_prefix:
        raise ValueError(f"Object path scope mismatch for {row['evidence_id']}")
    return source


def stage_files(root: Path, stage: Path, rows: list[dict[str, object]]) -> None:
    stage.mkdir(parents=True, exist_ok=True)
    for row in rows:
        source = validate_file(root, row)
        object_path = safe_relative(row["object_path"], "object path")
        target = stage.joinpath(*object_path.parts)
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists():
            if target.stat().st_size != source.stat().st_size:
                raise ValueError(f"Conflicting staged file: {object_path}")
            continue
        try:
            os.link(source, target)
        except OSError:
            shutil.copy2(source, target)


def write_sql(path: Path, rows: list[dict[str, object]]) -> None:
    payload = [{key: row[key] for key in (
        "evidence_id", "activity_id", "kind", "legacy_reference", "object_path",
        "original_name", "mime_type", "byte_size"
    )} for row in rows]
    encoded = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    tag = f"evidence_{uuid.uuid4().hex}"
    expected = len(rows)
    sql = f"""begin;
create temp table recovered_evidence (
  evidence_id uuid primary key, activity_id uuid not null,
  kind text not null check (kind in ('attendance-list', 'photographic-record')),
  legacy_reference text not null, object_path text not null unique,
  original_name text not null, mime_type text not null, byte_size bigint not null
) on commit drop;

insert into recovered_evidence
select * from jsonb_to_recordset(${tag}${encoded}${tag}$::jsonb) as x(
  evidence_id uuid, activity_id uuid, kind text, legacy_reference text,
  object_path text, original_name text, mime_type text, byte_size bigint
);

do $verify$
declare matched_rows bigint; stored_rows bigint;
begin
  if (select count(*) from recovered_evidence) <> {expected} then
    raise exception 'Manifest row count mismatch';
  end if;
  select count(*) into matched_rows
  from public.activity_evidence ae join recovered_evidence r
    on ae.id=r.evidence_id and ae.activity_id=r.activity_id and ae.kind=r.kind
   and ae.legacy_reference=r.legacy_reference
  where not ae.is_available and ae.object_path is null;
  if matched_rows <> {expected} then
    raise exception 'Only % of % unavailable metadata rows matched', matched_rows, {expected};
  end if;
  select count(*) into stored_rows
  from recovered_evidence r join storage.objects o
    on o.bucket_id='activity-evidence' and o.name=r.object_path
   and (o.metadata->>'size')::bigint=r.byte_size;
  if stored_rows <> {expected} then
    raise exception 'Only % of % Storage objects matched', stored_rows, {expected};
  end if;
end
$verify$;

update public.activity_evidence ae
set object_path=r.object_path, original_name=r.original_name, mime_type=r.mime_type,
    byte_size=r.byte_size, is_available=true
from recovered_evidence r
where ae.id=r.evidence_id;

do $verify$
begin
  if (select count(*) from public.activity_evidence ae join recovered_evidence r on r.evidence_id=ae.id
      where ae.is_available and ae.object_path=r.object_path and ae.byte_size=r.byte_size) <> {expected} then
    raise exception 'Post-update evidence verification failed';
  end if;
end
$verify$;
commit;

select json_build_object(
  'recovered_rows', count(*),
  'recovered_bytes', coalesce(sum(byte_size), 0),
  'available_total', (select count(*) from public.activity_evidence where is_available),
  'unavailable_total', (select count(*) from public.activity_evidence where not is_available),
  'storage_total', (select count(*) from storage.objects where bucket_id='activity-evidence')
) as evidence_reconciliation
from public.activity_evidence
where is_available;
"""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(sql, encoding="utf-8", newline="\n")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--recovery-root", required=True, type=Path)
    parser.add_argument("--stage", type=Path,
                        help="Optional exact-path staging tree for CLI-based uploads")
    parser.add_argument("--sql", required=True, type=Path)
    args = parser.parse_args()
    root = args.recovery_root.resolve()
    rows = load_recovered(root / "manifest.jsonl")
    if not rows:
        raise ValueError("Manifest contains no recovered evidence")
    stage = args.stage.resolve() if args.stage else None
    if stage:
        stage_files(root, stage, rows)
    write_sql(args.sql.resolve(), rows)
    print(json.dumps({"recovered": len(rows), "stage": str(stage) if stage else None,
                      "sql": str(args.sql.resolve())}, sort_keys=True))


if __name__ == "__main__":
    main()
