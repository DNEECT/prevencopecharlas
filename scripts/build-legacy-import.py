"""Build a private, transactional SQL rehearsal or import from the reviewed dump.

The generated SQL contains personal data. Keep it outside Git and execute it
only with a trusted postgres connection using psql -v ON_ERROR_STOP=1 -f FILE.
No Auth identities are created and no invitation is sent by this command.
"""

from __future__ import annotations

import argparse
import json
import runpy
import uuid
from pathlib import Path


HERE = Path(__file__).resolve().parent
REPO = HERE.parent
planner = runpy.run_path(str(HERE / "plan-legacy-import.py"))
read_source = planner["read_source"]
read_auth_map = planner["read_auth_map"]
plan = planner["plan"]
REVIEWED_DUMP_SHA256 = planner["REVIEWED_DUMP_SHA256"]
NAMESPACE = uuid.UUID("b8c57637-49c1-4669-99d6-fb8c4353472a")


def quote(value: str | int | bool | None) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int):
        return str(value)
    if "\x00" in value:
        raise ValueError("NUL in source text")
    return "'" + value.replace("'", "''") + "'"


def mapped(value: str | None, auth_map: dict[str, str]) -> str | None:
    return auth_map[value] if value else None


def flag(value: str | None) -> bool:
    if value not in ("t", "f"):
        raise ValueError("Invalid source state")
    return value == "t"


def timestamp(row: dict, column: str) -> str:
    return row[column] or row["fechacreacion"]


def array(values: list[str]) -> str:
    return "ARRAY[" + ", ".join(quote(value) for value in values) + "]::text[]"


def exception_classes(row: dict) -> list[str]:
    return [name for column, name in (
        ("sexo", "blank_sex"), ("organizacion", "blank_organization"),
        ("cargo", "blank_cargo"), ("correo", "blank_correo"),
        ("poblacion", "blank_poblacion"),
    ) if not (row[column] or "").strip()]


def stage_rows(source: dict, auth_map: dict[str, str]) -> dict[str, tuple[tuple[str, ...], list[tuple]]]:
    users = source["usuario"]
    activities = source["registroactividad"]
    profile_columns = ("id", "legacy_user_id", "username", "email", "first_names",
                       "last_names", "document_number", "document_type_legacy_id",
                       "address", "birth_date", "is_active", "created_at",
                       "updated_at", "created_by", "updated_by")
    profiles = [(
        auth_map[row["codigousuario"]], row["codigousuario"], row["username"],
        row["correo"], row["nombres"], row["apellidos"],
        row["numerodocumento"], row["coddocumento"], row["direccion"],
        row["fechanacimiento"], flag(row["estado"]), row["fechacreacion"],
        timestamp(row, "fechaactualizacion"), mapped(row["codusuariocreacion"], auth_map),
        mapped(row["codusuarioactualizacion"], auth_map),
    ) for row in users]
    membership_columns = ("profile_id", "role_id", "is_active", "granted_by")
    memberships = [(
        auth_map[row["codusuario"]], row["codrol"], True, None,
        str(uuid.uuid5(NAMESPACE, f'{row["codusuario"]}:{row["codrol"]}')),
    ) for row in source["usuariorol"]]
    activity_columns = (
        "id", "code", "activity_format_id", "assistant_type_id", "target_audience_id",
        "electoral_process_id", "special_jury_id", "place", "activity_date",
        "activity_time", "observations", "questions", "recommendations",
        "legacy_attendance_path", "legacy_photo_path", "is_active", "created_at",
        "updated_at", "created_by", "updated_by",
    )
    registrations = [(
        row["codigoregistroactivdad"], row["codigo"], row["codformatoactividad"],
        row["codtipoasistente"], row["codpublicoobjetivo"], row["codprocesoelectoral"],
        row["codjuradonacionalespecial"], row["lugar"], row["fecha"], row["hora"],
        row["observaciones"], row["preguntas"], row["recomendaciones"],
        row["adjuntolistaasistentes"], row["adjuntoregistrofotografico"],
        flag(row["estado"]), row["fechacreacion"], timestamp(row, "fechaactualizacion"),
        mapped(row["codusuariocreacion"], auth_map),
        mapped(row["codusuarioactualizacion"], auth_map),
    ) for row in activities]
    participant_columns = (
        "id", "activity_id", "dni", "full_name", "sex", "age", "organization",
        "position", "phone", "email", "population", "legacy_validation_exceptions",
        "is_active", "created_at", "updated_at", "created_by", "updated_by",
    )
    participants = [(
        row["codigoregactparticipante"], row["codregistroactividad"], row["dni"],
        row["nombrescompletos"], row["sexo"],
        int(row["edad"]) if row["edad"] is not None else None,
        row["organizacion"], row["cargo"], row["telefono"], row["correo"],
        row["poblacion"], exception_classes(row), flag(row["estado"]),
        row["fechacreacion"], timestamp(row, "fechaactualizacion"),
        mapped(row["codusuariocreacion"], auth_map),
        mapped(row["codusuarioactualizacion"], auth_map),
    ) for row in source["registroactividadparticipante"]]
    evidence_columns = (
        "id", "activity_id", "kind", "original_name", "legacy_reference",
        "is_available", "is_active", "created_by", "updated_by",
    )
    evidence = []
    for row in activities:
        for column, kind in (("adjuntolistaasistentes", "attendance-list"),
                             ("adjuntoregistrofotografico", "photographic-record")):
            reference = row[column]
            if reference and reference.strip():
                evidence.append((
                    str(uuid.uuid5(NAMESPACE, f'{row["codigoregistroactivdad"]}:{kind}')),
                    row["codigoregistroactivdad"], kind,
                    reference.replace("\\", "/").split("/")[-1], reference,
                    False, flag(row["estado"]), None, None,
                ))
    return {
        "profiles": (profile_columns, profiles),
        "profile_roles": (membership_columns, memberships),
        "activity_registrations": (activity_columns, registrations),
        "activity_participants": (participant_columns, participants),
        "activity_evidence": (evidence_columns, evidence),
    }


def stage_sql(table: str, columns: tuple[str, ...], rows: list[tuple]) -> list[str]:
    output = [f"create temp table stage_{table} (like public.{table} including defaults) on commit drop;"]
    if table == "profile_roles":
        output.append("alter table stage_profile_roles add column import_id uuid;")
    if not rows:
        return output
    for start in range(0, len(rows), 200):
        batch = rows[start:start + 200]
        rendered = []
        for row in batch:
            cells = [array(cell) if isinstance(cell, list) else quote(cell) for cell in row]
            rendered.append("(" + ", ".join(cells) + ")")
        names = columns + (("import_id",) if table == "profile_roles" else ())
        output.append(f"insert into stage_{table} ({', '.join(names)}) values\n  "
                      + ",\n  ".join(rendered) + ";")
    return output


def build_sql(source: dict, auth_map: dict[str, str], source_sha: str,
              mode: str) -> str:
    if mode not in ("dry-run", "apply") or len(source_sha) != 64:
        raise ValueError("Invalid import mode")
    assessment = plan(source, auth_map)
    if not assessment["source_ready_after_auth_mapping"]:
        raise ValueError("Source validation or Auth mapping incomplete; run planner")
    stages = stage_rows(source, auth_map)
    out = [
        "\\set ON_ERROR_STOP on",
        "begin;",
        "set constraints all deferred;",
        "set local search_path = pg_catalog, public;",
        "-- Private temporary staging disappears at COMMIT or ROLLBACK.",
    ]
    for table, (columns, rows) in stages.items():
        out.extend(stage_sql(table, columns, rows))
    out.append("""
do $$
begin
  if exists (
    select 1 from stage_profiles s left join auth.users a on a.id = s.id
    where a.id is null or lower(btrim(a.email)) <> lower(btrim(s.email))
  ) then raise exception 'Auth identity or email mismatch; import blocked'; end if;
  if exists (
    select 1 from stage_profiles s join public.profiles p
      on p.id = s.id or p.legacy_user_id = s.legacy_user_id
    where p.id <> s.id or p.legacy_user_id is distinct from s.legacy_user_id
  ) then raise exception 'Profile identity conflict; import blocked'; end if;
  if exists (
    select 1 from stage_profiles s join legacy_import.auth_user_map m
      on m.legacy_user_id = s.legacy_user_id or m.auth_user_id = s.id
    where m.legacy_user_id <> s.legacy_user_id or m.auth_user_id <> s.id
  ) then raise exception 'Auth mapping conflict; import blocked'; end if;
  if exists (
    select 1 from stage_profile_roles s left join public.roles r on r.id = s.role_id
    where r.id is null
  ) then raise exception 'Seeded role missing; import blocked'; end if;
  if exists (
    select 1 from stage_activity_registrations s
    left join public.activity_formats f on f.id = s.activity_format_id
    left join public.assistant_types at on at.id = s.assistant_type_id
    left join public.target_audiences ta on ta.id = s.target_audience_id
    left join public.electoral_processes ep on ep.id = s.electoral_process_id
    left join public.special_juries j on j.id = s.special_jury_id
    where f.id is null or at.id is null or ta.id is null or ep.id is null or j.id is null
  ) then raise exception 'Seeded activity catalog missing; import blocked'; end if;
end $$;

-- Conflicting existing business data is never silently overwritten.
""")
    for table in stages:
        key = ("p.profile_id = s.profile_id and p.role_id = s.role_id"
               if table == "profile_roles" else "p.id = s.id")
        compare = ("to_jsonb(p) - array['created_at','updated_at']"
                   if table == "profile_roles" else
                   "to_jsonb(p) - array['created_at','updated_at']"
                   if table == "activity_evidence" else "to_jsonb(p)")
        stage_compare = ("to_jsonb(s) - array['created_at','updated_at','import_id']"
                         if table == "profile_roles" else
                         "to_jsonb(s) - array['created_at','updated_at']"
                         if table == "activity_evidence" else "to_jsonb(s)")
        out.append(f"do $$ begin if exists (select 1 from stage_{table} s "
                   f"join public.{table} p on {key} where {compare} is distinct from "
                   f"{stage_compare}) then raise exception 'Existing {table} differs; import blocked'; "
                   "end if; end $$;")
    out.append(f"""
create temp table import_batch as
select gen_random_uuid() id;
insert into legacy_import.batches(id, source_sha256, source_label, source_counts)
select id, {quote(source_sha)}, 'reviewed-final-snapshot',
  jsonb_build_object('users', (select count(*) from stage_profiles),
    'activities', (select count(*) from stage_activity_registrations),
    'participants', (select count(*) from stage_activity_participants))
from import_batch;
insert into legacy_import.auth_user_map(legacy_user_id, auth_user_id, batch_id)
select s.legacy_user_id, s.id, b.id from stage_profiles s cross join import_batch b
where true
on conflict (legacy_user_id) do nothing;
""")
    for table, (columns, _) in stages.items():
        key = "profile_id, role_id" if table == "profile_roles" else "id"
        insert_columns = ", ".join(columns)
        out.append(f"create temp table inserted_{table} (import_id uuid) on commit drop;")
        if table == "profile_roles":
            out.append(f"""
with added as (
  insert into public.profile_roles ({insert_columns})
  select {insert_columns} from stage_profile_roles
  where true
  on conflict ({key}) do nothing
  returning profile_id, role_id
)
insert into inserted_profile_roles
select s.import_id from stage_profile_roles s join added a
  on a.profile_id = s.profile_id and a.role_id = s.role_id;
""")
        else:
            out.append(f"""
with added as (
  insert into public.{table} ({insert_columns})
  select {insert_columns} from stage_{table}
  where true
  on conflict ({key}) do nothing
  returning id
)
insert into inserted_{table} select id from added;
""")
        source_table = {
            "profiles": "usuario", "profile_roles": "usuariorol",
            "activity_registrations": "registroactividad",
            "activity_participants": "registroactividadparticipante",
            "activity_evidence": "evidence",
        }[table]
        source_id = ("s.legacy_user_id" if table == "profiles" else
                     "s.import_id" if table == "profile_roles" else "s.id")
        destination_id = ("s.profile_id" if table == "profiles" else
                          "s.import_id" if table == "profile_roles" else "s.id")
        if table == "profiles":
            destination_id = "s.id"
        exceptions = ("s.legacy_validation_exceptions" if table == "activity_participants"
                      else "array['missing_object']::text[]" if table == "activity_evidence"
                      else "array[]::text[]")
        out.append(f"""
insert into legacy_import.record_ledger
  (source_table, source_id, destination_table, destination_id,
   source_sha256, last_batch_id, outcome, exception_classes)
select {quote(source_table)}, {source_id}, {quote(table)}, {destination_id},
  {quote(source_sha)}, b.id,
  case when i.import_id is null then 'skipped' else 'inserted' end,
  {exceptions}
from stage_{table} s cross join import_batch b
left join inserted_{table} i on i.import_id =
  {('s.import_id' if table == 'profile_roles' else 's.id')}
where true
on conflict (source_table, source_id) do update set
  source_sha256 = excluded.source_sha256,
  last_batch_id = excluded.last_batch_id,
  outcome = excluded.outcome,
  exception_classes = excluded.exception_classes,
  reconciled_at = now();
""")
    out.append("""
update legacy_import.batches set state = 'applied', completed_at = now(),
  result_counts = jsonb_build_object(
    'profiles_inserted', (select count(*) from inserted_profiles),
    'memberships_inserted', (select count(*) from inserted_profile_roles),
    'activities_inserted', (select count(*) from inserted_activity_registrations),
    'participants_inserted', (select count(*) from inserted_activity_participants),
    'unavailable_evidence_inserted', (select count(*) from inserted_activity_evidence))
where id = (select id from import_batch);
select jsonb_build_object(
  'mode', 'MODE_PLACEHOLDER',
  'profiles', (select count(*) from stage_profiles),
  'activities', (select count(*) from stage_activity_registrations),
  'participants', (select count(*) from stage_activity_participants),
  'unavailable_evidence', (select count(*) from stage_activity_evidence),
  'inserts', (select result_counts from legacy_import.batches
              where id = (select id from import_batch)),
  'updates', 0,
  'skips', jsonb_build_object(
    'profiles', (select count(*) from stage_profiles) - (select count(*) from inserted_profiles),
    'memberships', (select count(*) from stage_profile_roles) - (select count(*) from inserted_profile_roles),
    'activities', (select count(*) from stage_activity_registrations) - (select count(*) from inserted_activity_registrations),
    'participants', (select count(*) from stage_activity_participants) - (select count(*) from inserted_activity_participants),
    'evidence', (select count(*) from stage_activity_evidence) - (select count(*) from inserted_activity_evidence)),
  'missing_objects', (select count(*) from stage_activity_evidence where not is_available),
  'historical_exceptions', (select count(*) from stage_activity_participants
                            where cardinality(legacy_validation_exceptions) > 0)
)::text as reconciliation;
""".replace("MODE_PLACEHOLDER", mode))
    out.append("rollback;" if mode == "dry-run" else "commit;")
    return "\n".join(out) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dump", required=True, type=Path)
    parser.add_argument("--pg-restore", required=True, type=Path)
    parser.add_argument("--auth-map", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--mode", choices=("dry-run", "apply"), default="dry-run")
    args = parser.parse_args()
    output = args.output.resolve()
    if output.is_relative_to(REPO):
        raise ValueError("Private SQL output must be outside the repository")
    if not output.parent.is_dir() or output.exists():
        raise ValueError("Output parent must exist and output must not already exist")
    source = read_source(args.dump, args.pg_restore)
    ids = {row["codigousuario"] for row in source["usuario"]}
    auth_map = read_auth_map(args.auth_map, ids)
    sql = build_sql(source, auth_map, REVIEWED_DUMP_SHA256, args.mode)
    output.write_text(sql, encoding="utf-8", newline="\n")
    print(json.dumps({"mode": args.mode, "private_sql_created": True,
                      "auth_identities_created": 0, "invitations_sent": 0,
                      "database_changed": False}))


if __name__ == "__main__":
    main()
