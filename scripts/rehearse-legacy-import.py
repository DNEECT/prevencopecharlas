"""Dry-run the reviewed dump against local Supabase with disposable Auth users.

This command refuses non-local database URLs, sends no invitations, prints only
aggregate counts, rolls back business data, and removes its temporary users.
"""

import argparse
import json
import runpy
import subprocess
import uuid
from pathlib import Path
from urllib.parse import urlparse


loader = runpy.run_path(str(Path(__file__).with_name("build-legacy-import.py")))


def psql(executable: Path, db_url: str, sql: str) -> str:
    result = subprocess.run(
        [str(executable), "-X", "-q", "-t", "-A", "-v", "ON_ERROR_STOP=1",
         db_url, "-f", "-"], input=sql, capture_output=True, text=True,
        encoding="utf-8",
    )
    if result.returncode:
        raise RuntimeError("Local SQL rehearsal failed; raw database output suppressed")
    return result.stdout.strip()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dump", type=Path, required=True)
    parser.add_argument("--pg-restore", type=Path, required=True)
    parser.add_argument("--psql", type=Path, required=True)
    parser.add_argument("--db-url", required=True)
    args = parser.parse_args()
    parsed = urlparse(args.db_url)
    if parsed.hostname not in ("127.0.0.1", "localhost") or parsed.port != 55322:
        raise ValueError("Rehearsal requires local Supabase on port 55322")
    source = loader["read_source"](args.dump, args.pg_restore)
    users = source["usuario"]
    namespace = loader["NAMESPACE"]
    auth_map = {row["codigousuario"]:
                str(uuid.uuid5(namespace, "local-rehearsal:" + row["codigousuario"]))
                for row in users}
    quote = loader["quote"]
    ids = ", ".join(quote(value) for value in auth_map.values())
    emails = ", ".join(quote(row["correo"]) for row in users)
    existing = psql(args.psql, args.db_url, f"""
select count(*) from auth.users where id in ({ids}) or lower(email) in
  (select lower(x) from unnest(array[{emails}]) as x);
""")
    if existing != "0":
        raise ValueError("Local Auth identities or emails already exist; rehearsal blocked")
    assessment = loader["plan"](source, auth_map)
    if not assessment["source_ready_after_auth_mapping"]:
        raise ValueError("Source relationships or values failed validation")
    created = False
    try:
        values = ",\n".join(
            "(" + quote(auth_map[row["codigousuario"]]) + ", "
            + quote(row["correo"]) + ")" for row in users
        )
        psql(args.psql, args.db_url,
             "begin; insert into auth.users(id,email) values\n" + values
             + "; commit;")
        created = True
        rehearsal = loader["build_sql"](
            source, auth_map, loader["REVIEWED_DUMP_SHA256"], "dry-run"
        )
        output = psql(args.psql, args.db_url, rehearsal)
        result = json.loads(next(line for line in output.splitlines()
                                 if line.startswith("{")))
        result["historical_validation_exceptions"] = assessment["historical_validation_exceptions"]
        result["unresolved_relationships"] = assessment["relationship_errors"]
        result["target_constraint_errors"] = assessment["target_constraint_errors"]
        result["evidence_parity_complete"] = False
        result["auth_identities_created_permanently"] = 0
        result["invitations_sent"] = 0
        print(json.dumps(result, indent=2))
    finally:
        if created:
            psql(args.psql, args.db_url,
                 f"delete from auth.users where id in ({ids});")


if __name__ == "__main__":
    main()
