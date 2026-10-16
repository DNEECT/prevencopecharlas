"""Synthetic, local-only import rehearsal; never connects to a hosted project."""

import json
import os
import runpy
import subprocess
import tempfile
import unittest
import uuid
from pathlib import Path
from urllib.parse import urlparse


HERE = Path(__file__).resolve().parent
loader = runpy.run_path(str(HERE / "build-legacy-import.py"))
fixture = runpy.run_path(str(HERE / "test-plan-legacy-import.py"))["fixture"]
DB_URL = os.environ.get("PREVENCOPE_LOCAL_DB_URL")
PSQL = os.environ.get("PREVENCOPE_PSQL", "psql")


def sql(value):
    return loader["quote"](value)


def query(statement):
    result = subprocess.run(
        [PSQL, "-X", "-q", "-t", "-A", "-v", "ON_ERROR_STOP=1", DB_URL,
         "-c", statement], capture_output=True, text=True, check=True,
    )
    return result.stdout.strip()


@unittest.skipUnless(DB_URL, "Set PREVENCOPE_LOCAL_DB_URL for local SQL rehearsal")
class LoaderTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        parsed = urlparse(DB_URL)
        if parsed.hostname not in ("127.0.0.1", "localhost") or parsed.port != 55322:
            raise ValueError("The fixture importer may only use local Supabase port 55322")

    def test_repeatable_import_and_dry_run(self):
        source = fixture()
        user = source["usuario"][0]
        activity = source["registroactividad"][0]
        participant = source["registroactividadparticipante"][0]
        auth_id = str(uuid.uuid4())
        legacy_id = str(uuid.uuid4())
        activity_id = str(uuid.uuid4())
        participant_id = str(uuid.uuid4())
        source_sha = uuid.uuid4().hex * 2
        role_id, format_id, assistant_id, audience_id, process_id, jury_id = query("""
select (select id from public.roles where name = 'Gestor'),
  (select id from public.activity_formats limit 1),
  (select id from public.assistant_types limit 1),
  (select id from public.target_audiences limit 1),
  (select id from public.electoral_processes limit 1),
  (select id from public.special_juries limit 1)
""").split("|")
        user.update({
            "codigousuario": legacy_id, "codusuariocreacion": legacy_id,
            "codusuarioactualizacion": legacy_id, "coddocumento": None,
            "password": "DO_NOT_EXPORT_SECRET_FIXTURE",
            "fechacreacion": "2025-01-01 10:00:00+00",
            "fechaactualizacion": "2025-02-01 10:00:00+00",
        })
        source["rol"][0]["codigorol"] = role_id
        source["usuariorol"][0].update({"codusuario": legacy_id, "codrol": role_id})
        for table, column, value in (
            ("formatoactividad", "codigoformatoactividad", format_id),
            ("juradonacionalespecial", "codigojuradoelectoral", jury_id),
            ("procesoelectoral", "codigoprocesoelectoral", process_id),
            ("publicoobjetivo", "codigopublicoobjetivo", audience_id),
            ("tipoasistentes", "codigotipoasistente", assistant_id),
        ):
            source[table][0][column] = value
        activity.update({
            "codigoregistroactivdad": activity_id, "codigo": "FIX" + auth_id[:12],
            "codusuariocreacion": legacy_id, "codusuarioactualizacion": legacy_id,
            "codformatoactividad": format_id, "codjuradonacionalespecial": jury_id,
            "codprocesoelectoral": process_id, "codpublicoobjetivo": audience_id,
            "codtipoasistente": assistant_id, "adjuntoregistrofotografico": "absent.jpg",
            "fechacreacion": "2025-03-01 10:00:00+00",
            "fechaactualizacion": "2025-03-02 10:00:00+00",
            "observaciones": None, "preguntas": None, "recomendaciones": None,
        })
        participant.update({
            "codigoregactparticipante": participant_id,
            "codregistroactividad": activity_id,
            "codusuariocreacion": legacy_id, "codusuarioactualizacion": legacy_id,
            "fechacreacion": "2025-03-01 10:00:00+00",
            "fechaactualizacion": "2025-03-02 10:00:00+00",
        })
        auth_map = {legacy_id: auth_id}
        query(f"insert into auth.users(id,email) values ({sql(auth_id)}, {sql(user['correo'])})")
        try:
            with tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / "import.sql"
                dry = loader["build_sql"](source, auth_map, source_sha, "dry-run")
                self.assertNotIn("DO_NOT_EXPORT_SECRET_FIXTURE", dry)
                self.assertIn("rollback;", dry)
                user["correo"] = "different@example.invalid"
                path.write_text(loader["build_sql"](source, auth_map, source_sha, "dry-run"),
                                encoding="utf-8")
                with self.assertRaises(subprocess.CalledProcessError):
                    self.run_file(path)
                user["correo"] = "fixture@example.invalid"
                path.write_text(dry, encoding="utf-8")
                first = self.run_file(path)
                self.assertEqual(first["inserts"]["profiles_inserted"], 1)
                self.assertEqual(query(f"select count(*) from public.profiles where id = {sql(auth_id)}"), "0")
                path.write_text(loader["build_sql"](source, auth_map, source_sha, "apply"),
                                encoding="utf-8")
                applied = self.run_file(path)
                repeated = self.run_file(path)
                self.assertEqual(applied["inserts"]["activities_inserted"], 1)
                self.assertEqual(applied["inserts"]["participants_inserted"], 1)
                self.assertEqual(applied["inserts"]["unavailable_evidence_inserted"], 2)
                self.assertTrue(all(value == 0 for value in repeated["inserts"].values()))
                self.assertEqual(query(f"select count(*) from public.activity_evidence where activity_id = {sql(activity_id)}"), "2")
                self.assertEqual(query(f"select count(*) from public.activity_evidence where activity_id = {sql(activity_id)} and is_available"), "0")
                self.assertEqual(query(f"select count(*) from public.activity_participants where activity_id = {sql(activity_id)} and 'blank_sex' = any(legacy_validation_exceptions)"), "1")
                self.assertEqual(query(f"select updated_at::text from public.profiles where id = {sql(auth_id)}"), "2025-02-01 10:00:00+00")
        finally:
            # This fixture uses random keys and never alters hosted data.
            query(f"""
begin;
delete from legacy_import.record_ledger where source_sha256 = {sql(source_sha)};
delete from legacy_import.auth_user_map where legacy_user_id = {sql(legacy_id)};
delete from legacy_import.batches where source_sha256 = {sql(source_sha)};
delete from public.activity_evidence where activity_id = {sql(activity_id)};
delete from public.activity_participants where activity_id = {sql(activity_id)};
delete from public.activity_registrations where id = {sql(activity_id)};
delete from public.profile_roles where profile_id = {sql(auth_id)};
delete from public.profiles where id = {sql(auth_id)};
delete from auth.users where id = {sql(auth_id)};
commit;
""")

    def run_file(self, path):
        result = subprocess.run(
            [PSQL, "-X", "-q", "-t", "-A", "-v", "ON_ERROR_STOP=1", DB_URL,
             "-f", str(path)], capture_output=True, text=True, check=True,
        )
        return json.loads(next(line for line in result.stdout.splitlines()
                               if line.startswith('{')))


if __name__ == "__main__":
    unittest.main()
