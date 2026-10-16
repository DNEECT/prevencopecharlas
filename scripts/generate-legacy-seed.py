"""Generate only non-sensitive Supabase seed rows from the reviewed PG dump.

The dump stays outside Git. This script selects an explicit allowlist; it never
exports users, registrations, participants, paths, or password material.
"""

from __future__ import annotations

import argparse
import hashlib
import re
import subprocess
from pathlib import Path


REVIEWED_DUMP_SHA256 = "388f1f5c054cc4e682261a8fc3b09b23d141c65ec2e9a19232ee9b15b2d67c8a"
SOURCE_TABLES = (
    "rol",
    "accion",
    "modulo",
    "moduloaccion",
    "rolmodulo",
    "moduloaccionrol",
    "tipoactividad",
    "tipoasistentes",
    "publicoobjetivo",
    "procesoelectoral",
    "juradonacionalespecial",
    "formatoactividad",
)
EXPECTED_COUNTS = {
    "rol": 2,
    "accion": 6,
    "modulo": 8,
    "moduloaccion": 21,
    "rolmodulo": 12,
    "moduloaccionrol": 42,
    "tipoactividad": 1,
    "tipoasistentes": 7,
    "publicoobjetivo": 11,
    "procesoelectoral": 1,
    "juradonacionalespecial": 61,
    "formatoactividad": 1,
}


def decode_copy(value: str) -> str | None:
    if value == r"\N":
        return None
    result: list[str] = []
    escapes = {"b": "\b", "f": "\f", "n": "\n", "r": "\r", "t": "\t", "v": "\v", "\\": "\\"}
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
        elif code == "x" and re.match(r"[0-9a-fA-F]{2}", value[index + 1 :]):
            result.append(chr(int(value[index + 1 : index + 3], 16)))
            index += 3
        else:
            raise ValueError(f"Unsupported COPY escape: {code}")
    return "".join(result)


def read_source(dump: Path, pg_restore: Path) -> dict[str, list[dict[str, str | None]]]:
    digest = hashlib.sha256(dump.read_bytes()).hexdigest()
    if digest != REVIEWED_DUMP_SHA256:
        raise ValueError("Source dump checksum differs from the reviewed inventory")
    command = [str(pg_restore), "--data-only", "--file=-"]
    command.extend(f"--table={name}" for name in SOURCE_TABLES)
    command.append(str(dump))
    result = subprocess.run(command, capture_output=True, text=True, encoding="utf-8", check=True)
    tables: dict[str, list[dict[str, str | None]]] = {}
    current: str | None = None
    columns: list[str] = []
    for line in result.stdout.splitlines():
        match = re.fullmatch(r"COPY public\.([a-z_]+) \(([^)]+)\) FROM stdin;", line)
        if match:
            current = match.group(1)
            if current not in SOURCE_TABLES or current in tables:
                raise ValueError(f"Unexpected COPY table: {current}")
            columns = match.group(2).split(", ")
            tables[current] = []
        elif line == r"\." and current is not None:
            current = None
            columns = []
        elif current is not None:
            values = [decode_copy(value) for value in line.split("\t")]
            if len(values) != len(columns):
                raise ValueError(f"Invalid COPY row in {current}")
            tables[current].append(dict(zip(columns, values)))
    if set(tables) != set(EXPECTED_COUNTS):
        raise ValueError(f"Missing seed tables: {set(EXPECTED_COUNTS) - set(tables)}")
    for name, expected in EXPECTED_COUNTS.items():
        if len(tables[name]) != expected:
            raise ValueError(f"Unexpected {name} count: {len(tables[name])}, expected {expected}")
    return tables


def sql_value(value: str | None, kind: str = "text") -> str:
    if value is None:
        return "NULL"
    if kind == "bool":
        if value not in ("t", "f"):
            raise ValueError(f"Invalid boolean: {value}")
        return "true" if value == "t" else "false"
    if kind == "int":
        if not re.fullmatch(r"-?[0-9]+", value):
            raise ValueError(f"Invalid integer: {value}")
        return value
    if kind == "uuid" and not re.fullmatch(r"[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}", value):
        raise ValueError(f"Invalid UUID: {value}")
    if "\x00" in value:
        raise ValueError("NUL is not supported in SQL text")
    return "'" + value.replace("'", "''") + "'"


def sorted_modules(rows: list[dict[str, str | None]]) -> list[dict[str, str | None]]:
    by_id = {row["codigomodulo"]: row for row in rows}
    result: list[dict[str, str | None]] = []
    visiting: set[str | None] = set()
    visited: set[str | None] = set()

    def visit(identifier: str | None) -> None:
        if identifier in visiting:
            raise ValueError("Source module hierarchy has a cycle")
        if identifier in visited:
            return
        if identifier not in by_id:
            raise ValueError("Source module parent is missing")
        visiting.add(identifier)
        parent = by_id[identifier]["codpadre"]
        if parent is not None:
            visit(parent)
        visiting.remove(identifier)
        visited.add(identifier)
        result.append(by_id[identifier])

    for row in rows:
        visit(row["codigomodulo"])
    return result


def insert(table: str, columns: tuple[str, ...], rows: list[tuple[str, ...]]) -> str:
    if not rows:
        return ""
    values = ",\n".join("  (" + ", ".join(row) + ")" for row in rows)
    return (
        f"insert into public.{table} ({', '.join(columns)}) values\n"
        + values
        + "\non conflict (id) do nothing;\n"
    )


def build_seed(source: dict[str, list[dict[str, str | None]]]) -> str:
    output = [
        "-- Reviewed non-sensitive seed from backup.dump (SHA-256 " + REVIEWED_DUMP_SHA256 + ").\n"
        "-- Source UUIDs and inactive grants are retained. User and activity rows are excluded.\n"
        "-- Repeated execution does not overwrite administrative changes.\n"
    ]
    roles = source["rol"]
    if {row["nombre"] for row in roles} != {"Monitor", "Gestor"}:
        raise ValueError("Unexpected source roles")
    output.append(insert("roles", ("id", "name", "description", "is_active"), [
        (sql_value(row["codigorol"], "uuid"), sql_value(row["nombre"]),
         sql_value(row["descripcion"]), sql_value(row["estado"], "bool"))
        for row in roles
    ]))
    output.append(insert("actions", ("id", "abbreviation", "description", "is_active"), [
        (sql_value(row["codigoaccion"], "uuid"), sql_value(row["abreviatura"]),
         sql_value(row["descripcion"]), sql_value(row["estado"], "bool"))
        for row in source["accion"]
    ]))
    output.append(insert("modules", ("id", "parent_id", "abbreviation", "name", "route", "icon", "sort_order", "is_functional", "is_active"), [
        (sql_value(row["codigomodulo"], "uuid"), sql_value(row["codpadre"], "uuid"),
         sql_value(row["abreviatura"]), sql_value(row["nombre"]), sql_value(row["ruta"]),
         sql_value(row["icono"]), sql_value(row["orden"], "int"),
         sql_value(row["esfuncional"], "bool"), sql_value(row["estado"], "bool"))
        for row in sorted_modules(source["modulo"])
    ]))
    module_actions = {row["codigomoduloaccion"]: row for row in source["moduloaccion"]}
    role_modules = {row["codigorolmodulo"]: row for row in source["rolmodulo"]}
    output.append(insert("module_actions", ("id", "module_id", "action_id", "is_active"), [
        (sql_value(row["codigomoduloaccion"], "uuid"), sql_value(row["codmodulo"], "uuid"),
         sql_value(row["codaccion"], "uuid"), sql_value(row["estado"], "bool"))
        for row in source["moduloaccion"]
    ]))
    output.append(insert("role_modules", ("id", "role_id", "module_id", "is_active"), [
        (sql_value(row["codigorolmodulo"], "uuid"), sql_value(row["codrol"], "uuid"),
         sql_value(row["codmodulo"], "uuid"), sql_value(row["estado"], "bool"))
        for row in source["rolmodulo"]
    ]))
    grants: list[tuple[str, ...]] = []
    for row in source["moduloaccionrol"]:
        role_module = role_modules[row["codrolmodulo"]]
        module_action = module_actions[row["codmoduloaccion"]]
        if role_module["codmodulo"] != module_action["codmodulo"]:
            raise ValueError("A source grant connects different modules")
        grants.append((sql_value(row["codigomoduloaccionrolmodulo"], "uuid"),
                       sql_value(role_module["codmodulo"], "uuid"),
                       sql_value(row["codrolmodulo"], "uuid"),
                       sql_value(row["codmoduloaccion"], "uuid"),
                       sql_value(row["estado"], "bool")))
    output.append(insert("role_module_actions", ("id", "module_id", "role_module_id", "module_action_id", "is_active"), grants))
    for source_name, target, source_id in (
        ("tipoactividad", "activity_types", "codigotipoactividad"),
        ("tipoasistentes", "assistant_types", "codigotipoasistente"),
        ("publicoobjetivo", "target_audiences", "codigopublicoobjetivo"),
        ("procesoelectoral", "electoral_processes", "codigoprocesoelectoral"),
    ):
        output.append(insert(target, ("id", "name", "description", "is_active"), [
            (sql_value(row[source_id], "uuid"), sql_value(row["nombre"]),
             sql_value(row["descripcion"]), sql_value(row["estado"], "bool"))
            for row in source[source_name]
        ]))
    output.append(insert("activity_formats", ("id", "activity_type_id", "topic", "series", "next_number", "is_active"), [
        (sql_value(row["codigoformatoactividad"], "uuid"),
         sql_value(row["codtipoactividad"], "uuid"), sql_value(row["tema"]),
         sql_value(row["serie"]), sql_value(row["numeracion"], "int"),
         sql_value(row["estado"], "bool"))
        for row in source["formatoactividad"]
    ]))
    # Names, identifiers, and administrative geography are public lookup data;
    # source phone numbers, addresses, status notes, and creator IDs stay out.
    output.append(insert("special_juries", ("id", "jury_code", "jury_name", "source_process_code", "department", "province", "ubigeo", "initials", "is_active"), [
        (sql_value(row["codigojuradoelectoral"], "uuid"),
         sql_value(row["codjuradoelectoral"], "int"), sql_value(row["juradoelectoral"]),
         sql_value(row["codprocesoelectoral"], "int"),
         sql_value(row["departamento"]), sql_value(row["provincia"]),
         sql_value(row["ubigeo"]), sql_value(row["siglas"]),
         sql_value(row["estado"], "bool"))
        for row in source["juradonacionalespecial"]
    ]))
    return "\n".join(output)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dump", type=Path, required=True)
    parser.add_argument("--pg-restore", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    source = read_source(args.dump, args.pg_restore)
    seed = build_seed(source)
    args.output.write_text(seed, encoding="utf-8", newline="\n")
    print("Generated reviewed seed: 42 grants, 8 modules, 2 roles, and lookup catalogs")


if __name__ == "__main__":
    main()
