"""Plan a legacy import from the reviewed dump without exposing personal rows.

This command does not write to any database. Its JSON output contains only
aggregate counts. An optional CSV proposes legacy-to-Supabase Auth UUID
mapping; the IDs and emails must be checked against the destination before
import. Keep that mapping outside Git along with the source dump.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import subprocess
import uuid
from collections import Counter
from datetime import date, time
from pathlib import Path


REVIEWED_DUMP_SHA256 = "388f1f5c054cc4e682261a8fc3b09b23d141c65ec2e9a19232ee9b15b2d67c8a"
SOURCE_TABLES = (
    "usuario", "usuariorol", "rol", "tipoactividad", "tipoasistentes",
    "publicoobjetivo", "procesoelectoral", "juradonacionalespecial",
    "formatoactividad", "registroactividad", "registroactividadparticipante",
)
EXPECTED_COUNTS = {"usuario": 92, "usuariorol": 92,
                   "registroactividad": 1637, "registroactividadparticipante": 32042}


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


def read_source(dump: Path, pg_restore: Path) -> dict[str, list[dict[str, str | None]]]:
    if hashlib.sha256(dump.read_bytes()).hexdigest() != REVIEWED_DUMP_SHA256:
        raise ValueError("Source dump checksum differs from final reviewed snapshot")
    command = [str(pg_restore), "--data-only", "--file=-"]
    command.extend(f"--table={name}" for name in SOURCE_TABLES)
    command.append(str(dump))
    output = subprocess.run(command, capture_output=True, text=True,
                            encoding="utf-8", check=True).stdout
    tables: dict[str, list[dict[str, str | None]]] = {}
    current: str | None = None
    columns: list[str] = []
    for line in output.splitlines():
        match = re.fullmatch(r"COPY public\.([a-z_]+) \(([^)]+)\) FROM stdin;", line)
        if match:
            current = match.group(1)
            if current not in SOURCE_TABLES or current in tables:
                raise ValueError("Unexpected or repeated COPY table")
            columns = match.group(2).split(", ")
            tables[current] = []
        elif line == r"\." and current is not None:
            current = None
        elif current is not None:
            values = [decode_copy(value) for value in line.split("\t")]
            if len(values) != len(columns):
                raise ValueError("Invalid COPY row")
            tables[current].append(dict(zip(columns, values)))
    if set(tables) != set(SOURCE_TABLES):
        raise ValueError("Required source table missing")
    for name, expected in EXPECTED_COUNTS.items():
        if len(tables[name]) != expected:
            raise ValueError(f"Unexpected {name} row count")
    return tables


def read_auth_map(path: Path | None, valid_legacy_ids: set[str]) -> dict[str, str]:
    if path is None:
        return {}
    mapped: dict[str, str] = {}
    auth_ids: set[str] = set()
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != ["legacy_user_id", "auth_user_id"]:
            raise ValueError("Auth map must have legacy_user_id,auth_user_id columns")
        for row in reader:
            try:
                legacy_id = str(uuid.UUID(row["legacy_user_id"]))
                auth_id = str(uuid.UUID(row["auth_user_id"]))
            except (TypeError, ValueError):
                raise ValueError("Auth map contains an invalid UUID") from None
            if legacy_id not in valid_legacy_ids or legacy_id in mapped or auth_id in auth_ids:
                raise ValueError("Auth map contains unknown or duplicate UUIDs")
            mapped[legacy_id] = auth_id
            auth_ids.add(auth_id)
    return mapped


def present(value: str | None) -> bool:
    return bool(value and value.strip())


def check_lengths(rows: list[dict[str, str | None]], limits: dict[str, int],
                  prefix: str, invalid: Counter[str]) -> None:
    for column, limit in limits.items():
        count = sum(len(row[column] or "") > limit for row in rows)
        if count:
            invalid[f"{prefix}_{column}_length"] += count


def check_unique_ids(rows: list[dict[str, str | None]], column: str,
                     label: str, invalid: Counter[str]) -> None:
    values = [row[column] for row in rows]
    invalid[f"{label}_missing_id"] += sum(not value for value in values)
    invalid[f"{label}_duplicate_id"] += sum(
        count - 1 for value, count in Counter(values).items()
        if value and count > 1
    )


def valid_date(value: str | None) -> bool:
    try:
        date.fromisoformat(value or "")
        return True
    except ValueError:
        return False


def valid_time(value: str | None) -> bool:
    try:
        time.fromisoformat(value or "")
        return True
    except ValueError:
        return False


def plan(tables: dict[str, list[dict[str, str | None]]], auth_map: dict[str, str]) -> dict:
    users = tables["usuario"]
    activities = tables["registroactividad"]
    participants = tables["registroactividadparticipante"]
    user_ids = {row["codigousuario"] for row in users}
    role_ids = {row["codigorol"] for row in tables["rol"]}
    activity_ids = {row["codigoregistroactivdad"] for row in activities}
    catalogs = {
        "codformatoactividad": {row["codigoformatoactividad"] for row in tables["formatoactividad"]},
        "codjuradonacionalespecial": {row["codigojuradoelectoral"] for row in tables["juradonacionalespecial"]},
        "codprocesoelectoral": {row["codigoprocesoelectoral"] for row in tables["procesoelectoral"]},
        "codpublicoobjetivo": {row["codigopublicoobjetivo"] for row in tables["publicoobjetivo"]},
        "codtipoasistente": {row["codigotipoasistente"] for row in tables["tipoasistentes"]},
    }
    unresolved: Counter[str] = Counter()
    invalid: Counter[str] = Counter()
    historical: Counter[str] = Counter()

    for rows, column, label in (
        (users, "codigousuario", "user"),
        (activities, "codigoregistroactivdad", "activity"),
        (participants, "codigoregactparticipante", "participant"),
    ):
        check_unique_ids(rows, column, label, invalid)
        invalid[f"{label}_state"] += sum(row["estado"] not in ("t", "f") for row in rows)

    check_lengths(users, {"username": 20, "correo": 100, "nombres": 100,
                          "apellidos": 100, "numerodocumento": 50,
                          "direccion": 100}, "user", invalid)
    check_lengths(activities, {"codigo": 50, "adjuntolistaasistentes": 500,
                               "adjuntoregistrofotografico": 500}, "activity", invalid)
    check_lengths(participants, {"dni": 8, "nombrescompletos": 200,
                                 "sexo": 10, "organizacion": 50, "cargo": 50,
                                 "telefono": 20, "correo": 100,
                                 "poblacion": 100}, "participant", invalid)

    for row in users:
        if row["codusuariocreacion"] and row["codusuariocreacion"] not in user_ids:
            unresolved["user_created_by"] += 1
        if row["codusuarioactualizacion"] and row["codusuarioactualizacion"] not in user_ids:
            unresolved["user_updated_by"] += 1
        if not present(row["username"]) or not present(row["correo"]):
            invalid["user_required_text"] += 1
        if row["fechanacimiento"] and not valid_date(row["fechanacimiento"]):
            invalid["user_birth_date"] += 1
    emails = [(row["correo"] or "").strip().casefold() for row in users]
    email_counts = Counter(emails)
    invalid["user_email"] = sum(not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email)
                                for email in emails)
    invalid["duplicate_user_email"] = sum(n - 1 for email, n in email_counts.items()
                                          if email and n > 1)
    usernames = [(row["username"] or "").casefold() for row in users]
    invalid["duplicate_username"] = sum(
        count - 1 for username, count in Counter(usernames).items()
        if username and count > 1
    )

    for row in tables["usuariorol"]:
        if row["codusuario"] not in user_ids:
            unresolved["role_user"] += 1
        if row["codrol"] not in role_ids:
            unresolved["role_id"] += 1
    memberships = [(row["codusuario"], row["codrol"]) for row in tables["usuariorol"]]
    invalid["duplicate_membership"] += sum(
        count - 1 for count in Counter(memberships).values() if count > 1
    )

    for row in activities:
        for column, ids in catalogs.items():
            if row[column] not in ids:
                unresolved[f"activity_{column}"] += 1
        if row["codusuariocreacion"] not in user_ids:
            unresolved["activity_created_by"] += 1
        if row["codusuarioactualizacion"] and row["codusuarioactualizacion"] not in user_ids:
            unresolved["activity_updated_by"] += 1
        if not present(row["codigo"]) or not present(row["lugar"]):
            invalid["activity_required_text"] += 1
        if not valid_date(row["fecha"]):
            invalid["activity_date"] += 1
        if not valid_time(row["hora"]):
            invalid["activity_time"] += 1
    codes = [(row["codigo"] or "").casefold() for row in activities]
    invalid["duplicate_activity_code"] = sum(n - 1 for n in Counter(codes).values() if n > 1)

    for row in participants:
        if row["codregistroactividad"] not in activity_ids:
            unresolved["participant_activity"] += 1
        if row["codusuariocreacion"] and row["codusuariocreacion"] not in user_ids:
            unresolved["participant_created_by"] += 1
        if row["codusuarioactualizacion"] and row["codusuarioactualizacion"] not in user_ids:
            unresolved["participant_updated_by"] += 1
        if not present(row["sexo"]):
            historical["blank_sex"] += 1
        if not present(row["organizacion"]):
            historical["blank_organization"] += 1
        for column in ("cargo", "correo", "poblacion"):
            if not present(row[column]):
                historical[f"blank_{column}"] += 1
        if not present(row["dni"]) or len(row["dni"] or "") > 8:
            invalid["participant_dni"] += 1
        if not present(row["nombrescompletos"]) or len(row["nombrescompletos"] or "") > 200:
            invalid["participant_name"] += 1
        if row["edad"] is not None:
            try:
                int(row["edad"])
            except ValueError:
                invalid["participant_age"] += 1

    evidence = sum(present(row[column]) for row in activities for column in
                   ("adjuntolistaasistentes", "adjuntoregistrofotografico"))
    unmapped = len(user_ids - set(auth_map))
    blocking = sum(unresolved.values()) + sum(invalid.values()) + unmapped
    return {
        "source_sha256": REVIEWED_DUMP_SHA256,
        "source_counts": {name: len(tables[name]) for name in
                          ("usuario", "usuariorol", "registroactividad",
                           "registroactividadparticipante")},
        "source_state": {
            "active_users": sum(row["estado"] == "t" for row in users),
            "inactive_users": sum(row["estado"] == "f" for row in users),
            "active_activities": sum(row["estado"] == "t" for row in activities),
            "inactive_activities": sum(row["estado"] == "f" for row in activities),
        },
        "auth": {"mapped_in_csv": len(auth_map), "unmapped": unmapped,
                 "identities_to_verify": len(users),
                 "destination_identity_check_completed": False},
        "relationship_errors": dict(sorted((k, v) for k, v in unresolved.items() if v)),
        "target_constraint_errors": dict(sorted((k, v) for k, v in invalid.items() if v)),
        "historical_validation_exceptions": dict(sorted(historical.items())),
        "unavailable_evidence_references": evidence,
        "projected_inserts_after_auth_mapping": {
            "profiles": len(users), "profile_roles": len(tables["usuariorol"]),
            "activity_registrations": len(activities),
            "activity_participants": len(participants),
            "activity_evidence_unavailable": evidence,
        },
        "source_ready_after_auth_mapping": blocking == 0,
        "ready_for_database_import": False,
        "note": "Auth identity and destination-row checks remain required. Projected counts assume an empty destination; no database was changed.",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dump", type=Path, required=True)
    parser.add_argument("--pg-restore", type=Path, required=True)
    parser.add_argument("--auth-map", type=Path,
                        help="Private CSV with legacy_user_id,auth_user_id columns")
    args = parser.parse_args()
    tables = read_source(args.dump, args.pg_restore)
    user_ids = {row["codigousuario"] for row in tables["usuario"]}
    result = plan(tables, read_auth_map(args.auth_map, user_ids))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
