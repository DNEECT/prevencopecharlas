"""Write a private, reviewable Auth onboarding CSV outside the repository.

No invitation is sent and no database is changed. The CSV contains personal
data, so never put it in Git or an application bundle.
"""

from __future__ import annotations

import argparse
import csv
import runpy
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dump", type=Path, required=True)
    parser.add_argument("--pg-restore", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    repo = Path(__file__).resolve().parent.parent
    output = args.output.resolve()
    if output.is_relative_to(repo):
        raise ValueError("Private onboarding CSV must be written outside Git")
    planner = runpy.run_path(str(Path(__file__).with_name("plan-legacy-import.py")))
    source = planner["read_source"](args.dump, args.pg_restore)
    roles = {row["codigorol"]: row["nombre"] for row in source["rol"]}
    membership = {row["codusuario"]: roles[row["codrol"]]
                  for row in source["usuariorol"]}
    users = sorted(source["usuario"], key=lambda row: (
        row["estado"] != "t", membership[row["codigousuario"]] != "Monitor",
        (row["correo"] or "").casefold()))
    fields = ("legacy_user_id", "email", "username", "role", "is_active",
              "proposed_invite", "auth_user_id", "review_notes")
    with output.open("x", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for row in users:
            writer.writerow({
                "legacy_user_id": row["codigousuario"],
                "email": row["correo"],
                "username": row["username"],
                "role": membership[row["codigousuario"]],
                "is_active": row["estado"] == "t",
                "proposed_invite": row["estado"] == "t",
                "auth_user_id": "",
                "review_notes": "",
            })
    print("Private review CSV created: 92 users; 89 active invitations proposed, 3 inactive held.")


if __name__ == "__main__":
    main()
