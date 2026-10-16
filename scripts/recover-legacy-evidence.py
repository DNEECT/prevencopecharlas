"""Recover legacy PREVENCOPE evidence through the authenticated legacy proxy.

The reviewed PostgreSQL dump is the source of truth for activity, kind, and
legacy file path. Credentials are read from environment variables or an
interactive prompt and are never written to disk. Recovered files and the
manifest must be stored outside the Git repository.
"""

from __future__ import annotations

import argparse
import getpass
import hashlib
import json
import os
import re
import subprocess
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import asdict, dataclass
from pathlib import Path, PurePosixPath
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


HERE = Path(__file__).resolve().parent
REPO = HERE.parent.resolve()
REVIEWED_DUMP_SHA256 = "388f1f5c054cc4e682261a8fc3b09b23d141c65ec2e9a19232ee9b15b2d67c8a"
EXPECTED_ACTIVITY_COUNT = 1637
EXPECTED_REFERENCE_COUNT = 2632
NAMESPACE = uuid.UUID("b8c57637-49c1-4669-99d6-fb8c4353472a")
PROXY_URL = "https://app-prevencope.vercel.app/api/proxy"
API_BASE = "https://prevencope.actividades.api.fordevs.pe/ne-pre-gestionactividades/v1"
LOGIN_URL = f"{API_BASE}/auth/login"
DOWNLOAD_URL = f"{API_BASE}/files/download"
APPLICATION_NAME = "SGCS"
KIND_COLUMNS = {
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


@dataclass(frozen=True)
class EvidenceReference:
    evidence_id: str
    activity_id: str
    kind: str
    original_name: str
    legacy_reference: str
    extension: str
    object_path: str


@dataclass(frozen=True)
class RecoveryResult:
    evidence_id: str
    activity_id: str
    kind: str
    original_name: str
    legacy_reference: str
    object_path: str
    local_relative_path: str | None
    status: str
    http_status: int | None
    mime_type: str | None
    byte_size: int | None
    sha256: str | None
    error: str | None


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


def basename(reference: str) -> str:
    return reference.replace("\\", "/").rsplit("/", 1)[-1]


def storage_name(name: str, evidence_id: str, extension: str) -> str:
    stem = name[: -len(extension)] if extension else name
    stem = stem.encode("ascii", "ignore").decode("ascii")
    stem = re.sub(r"[^A-Za-z0-9_-]+", "_", stem).strip("_")[:70] or "archivo"
    return f"{evidence_id}-{stem}{extension}"


def parse_references(dump: Path, pg_restore: Path) -> list[EvidenceReference]:
    if hashlib.sha256(dump.read_bytes()).hexdigest() != REVIEWED_DUMP_SHA256:
        raise ValueError("Source dump checksum differs from the final reviewed snapshot")
    result = subprocess.run(
        [str(pg_restore), "--data-only", "--table=registroactividad", "--file=-", str(dump)],
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=True,
    )
    columns: list[str] = []
    references: list[EvidenceReference] = []
    activities = 0
    in_copy = False
    for line in result.stdout.splitlines():
        match = re.fullmatch(r"COPY public\.registroactividad \(([^)]+)\) FROM stdin;", line)
        if match:
            columns = match.group(1).split(", ")
            required = {"codigoregistroactivdad", *KIND_COLUMNS}
            if not required.issubset(columns):
                raise ValueError("Required activity evidence columns are missing")
            in_copy = True
        elif line == r"\." and in_copy:
            in_copy = False
        elif in_copy:
            values = [decode_copy(value) for value in line.split("\t")]
            if len(values) != len(columns):
                raise ValueError("Invalid activity COPY row")
            row = dict(zip(columns, values))
            activities += 1
            activity_id = str(uuid.UUID(str(row["codigoregistroactivdad"])))
            for column, kind in KIND_COLUMNS.items():
                reference = row[column]
                if not reference or not reference.strip():
                    continue
                name = basename(reference)
                extension = Path(name).suffix.casefold()
                if extension not in EXTENSION_MIME:
                    raise ValueError("A legacy reference has an unsupported extension")
                evidence_id = str(uuid.uuid5(NAMESPACE, f"{activity_id}:{kind}"))
                object_path = str(PurePosixPath(
                    activity_id, kind, storage_name(name, evidence_id, extension)
                ))
                references.append(EvidenceReference(
                    evidence_id=evidence_id,
                    activity_id=activity_id,
                    kind=kind,
                    original_name=name,
                    legacy_reference=reference,
                    extension=extension,
                    object_path=object_path,
                ))
    if activities != EXPECTED_ACTIVITY_COUNT:
        raise ValueError(f"Unexpected activity count: {activities}")
    if len(references) != EXPECTED_REFERENCE_COUNT:
        raise ValueError(f"Unexpected evidence reference count: {len(references)}")
    if len({item.legacy_reference for item in references}) != EXPECTED_REFERENCE_COUNT:
        raise ValueError("Legacy evidence paths are not distinct")
    return references


def detected_mime(header: bytes) -> str | None:
    if header.startswith(b"%PDF-"):
        return "application/pdf"
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if header.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if header.startswith(b"PK\x03\x04"):
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    if header.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"):
        return "application/vnd.ms-excel"
    return None


def validate_output_directory(output: Path) -> Path:
    resolved = output.resolve()
    if resolved == REPO or resolved.is_relative_to(REPO):
        raise ValueError("Recovery output must be outside the Git repository")
    resolved.mkdir(parents=True, exist_ok=True)
    return resolved


def parse_login_response(payload: bytes) -> str:
    try:
        parsed = json.loads(payload)
        token = parsed["datos"]["token"]
    except (KeyError, TypeError, json.JSONDecodeError) as error:
        raise ValueError("Legacy login response did not contain a token") from error
    if not isinstance(token, str) or not token.strip():
        raise ValueError("Legacy login returned an empty token")
    return token


class LegacyClient:
    def __init__(self, username: str, password: str, timeout: int = 90):
        self.username = username
        self.password = password
        self.timeout = timeout
        self._token = ""
        self._lock = threading.Lock()

    def login(self, previous_token: str | None = None) -> str:
        with self._lock:
            if self._token and previous_token is not None and self._token != previous_token:
                return self._token
            body = json.dumps({
                "datos": {"usuario": self.username, "contrasenia": self.password}
            }).encode("utf-8")
            request = Request(PROXY_URL, data=body, method="POST", headers={
                "Content-Type": "application/json",
                "X-Original-Url": LOGIN_URL,
                "X-Original-Method": "POST",
                "Transaccion-Id": str(uuid.uuid4()),
                "Nombre-Aplicacion": APPLICATION_NAME,
            })
            with urlopen(request, timeout=self.timeout) as response:
                self._token = parse_login_response(response.read())
            return self._token

    def open_download(self, reference: str, refresh: bool = False):
        token = self.login() if not self._token or refresh else self._token
        query = urlencode({"url": DOWNLOAD_URL, "rutaArchivo": reference})
        request = Request(f"{PROXY_URL}?{query}", method="GET", headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/octet-stream",
            "X-Original-Url": DOWNLOAD_URL,
            "Transaccion-Id": str(uuid.uuid4()),
            "Nombre-Aplicacion": APPLICATION_NAME,
        })
        try:
            return urlopen(request, timeout=self.timeout)
        except HTTPError as error:
            if error.code == 401 and not refresh:
                self.login(previous_token=token)
                return self.open_download(reference, refresh=True)
            raise


def recover_one(client: LegacyClient, item: EvidenceReference, output: Path,
                attempts: int) -> RecoveryResult:
    relative = Path("objects", item.activity_id, item.kind, f"{item.evidence_id}{item.extension}")
    target = output / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.is_file() and target.stat().st_size:
        data_head = target.read_bytes()[:16]
        mime = detected_mime(data_head)
        if mime == EXTENSION_MIME[item.extension]:
            digest = hashlib.sha256(target.read_bytes()).hexdigest()
            return RecoveryResult(
                item.evidence_id, item.activity_id, item.kind, item.original_name,
                item.legacy_reference, item.object_path, relative.as_posix(), "recovered",
                200, mime, target.stat().st_size, digest, None,
            )
        target.unlink()

    last_error = "download failed"
    last_status: int | None = None
    for attempt in range(1, attempts + 1):
        partial = target.with_suffix(target.suffix + ".part")
        try:
            with client.open_download(item.legacy_reference) as response, partial.open("wb") as handle:
                last_status = getattr(response, "status", 200)
                digest = hashlib.sha256()
                header = b""
                byte_size = 0
                while True:
                    chunk = response.read(1024 * 1024)
                    if not chunk:
                        break
                    if len(header) < 16:
                        header += chunk[: 16 - len(header)]
                    digest.update(chunk)
                    handle.write(chunk)
                    byte_size += len(chunk)
            mime = detected_mime(header)
            expected = EXTENSION_MIME[item.extension]
            if byte_size <= 0 or mime != expected:
                partial.unlink(missing_ok=True)
                return RecoveryResult(
                    item.evidence_id, item.activity_id, item.kind, item.original_name,
                    item.legacy_reference, item.object_path, None, "invalid_content",
                    last_status, mime, byte_size, None,
                    f"Expected {expected}; detected {mime or 'unknown'}",
                )
            partial.replace(target)
            return RecoveryResult(
                item.evidence_id, item.activity_id, item.kind, item.original_name,
                item.legacy_reference, item.object_path, relative.as_posix(), "recovered",
                last_status, mime, byte_size, digest.hexdigest(), None,
            )
        except HTTPError as error:
            partial.unlink(missing_ok=True)
            last_status = error.code
            last_error = f"HTTP {error.code}"
            if error.code < 500 and error.code != 429:
                break
        except (URLError, TimeoutError, OSError) as error:
            partial.unlink(missing_ok=True)
            last_error = type(error).__name__
        if attempt < attempts:
            time.sleep(min(2 ** (attempt - 1), 8))
    return RecoveryResult(
        item.evidence_id, item.activity_id, item.kind, item.original_name,
        item.legacy_reference, item.object_path, None, "unavailable", last_status,
        None, None, None, last_error,
    )


def write_reports(output: Path, results: list[RecoveryResult]) -> dict[str, object]:
    ordered = sorted(results, key=lambda item: (item.activity_id, item.kind))
    manifest = output / "manifest.jsonl"
    with manifest.open("w", encoding="utf-8", newline="\n") as handle:
        for result in ordered:
            handle.write(json.dumps(asdict(result), ensure_ascii=False, sort_keys=True) + "\n")
    statuses: dict[str, int] = {}
    total_bytes = 0
    for result in ordered:
        statuses[result.status] = statuses.get(result.status, 0) + 1
        total_bytes += result.byte_size or 0
    summary = {
        "references": len(ordered),
        "statuses": statuses,
        "recovered_bytes": total_bytes,
        "evidence_parity_complete": statuses.get("recovered", 0) == EXPECTED_REFERENCE_COUNT,
        "credentials_written": False,
        "database_changed": False,
        "supabase_storage_changed": False,
    }
    (output / "summary.json").write_text(
        json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8", newline="\n"
    )
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dump", required=True, type=Path)
    parser.add_argument("--pg-restore", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--username", default=os.environ.get("PREVENCOPE_LEGACY_USERNAME"))
    parser.add_argument("--password-env", default="PREVENCOPE_LEGACY_PASSWORD")
    parser.add_argument("--workers", type=int, default=2)
    parser.add_argument("--attempts", type=int, default=3)
    parser.add_argument("--timeout", type=int, default=30,
                        help="Per-request timeout in seconds (default: 30)")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    if not 1 <= args.workers <= 4:
        raise ValueError("Workers must be between 1 and 4")
    if not 1 <= args.attempts <= 5:
        raise ValueError("Attempts must be between 1 and 5")
    if not 5 <= args.timeout <= 300:
        raise ValueError("Timeout must be between 5 and 300 seconds")
    output = validate_output_directory(args.output)
    references = parse_references(args.dump, args.pg_restore)
    selected = references[: args.limit] if args.limit is not None else references
    if args.dry_run:
        print(json.dumps({
            "mode": "dry-run",
            "references": len(references),
            "selected": len(selected),
            "output_outside_repository": True,
            "credentials_requested": False,
            "network_requests": 0,
        }, sort_keys=True))
        return
    username = args.username or input("Usuario legado: ").strip()
    password = os.environ.get(args.password_env) or getpass.getpass("Contraseña legado: ")
    if not username or not password:
        raise ValueError("Legacy username and password are required")
    client = LegacyClient(username, password, timeout=args.timeout)
    client.login()
    results: list[RecoveryResult] = []
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(recover_one, client, item, output, args.attempts): item
            for item in selected
        }
        completed = 0
        for future in as_completed(futures):
            results.append(future.result())
            completed += 1
            if completed % 100 == 0 or completed == len(selected):
                recovered = sum(item.status == "recovered" for item in results)
                print(json.dumps({"completed": completed, "recovered": recovered,
                                  "remaining": len(selected) - completed}), flush=True)
    summary = write_reports(output, results)
    print(json.dumps(summary, sort_keys=True))


if __name__ == "__main__":
    main()
