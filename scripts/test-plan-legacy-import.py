"""Small fixture tests for the aggregate-only import planner."""

import csv
import runpy
import tempfile
import unittest
from pathlib import Path


planner = runpy.run_path(str(Path(__file__).with_name("plan-legacy-import.py")))
plan = planner["plan"]
read_auth_map = planner["read_auth_map"]


def fixture():
    user = "00000000-0000-0000-0000-000000000001"
    role = "00000000-0000-0000-0000-000000000002"
    activity = "00000000-0000-0000-0000-000000000003"
    participant = "00000000-0000-0000-0000-000000000004"
    catalog = "00000000-0000-0000-0000-000000000005"
    return {
        "usuario": [{"codigousuario": user, "estado": "t", "username": "fixture",
                     "correo": "fixture@example.invalid", "nombres": "Fixture",
                     "apellidos": "User", "direccion": None,
                     "numerodocumento": "12345678", "fechanacimiento": None,
                     "codusuariocreacion": None, "codusuarioactualizacion": None}],
        "rol": [{"codigorol": role}],
        "usuariorol": [{"codusuario": user, "codrol": role}],
        "formatoactividad": [{"codigoformatoactividad": catalog}],
        "juradonacionalespecial": [{"codigojuradoelectoral": catalog}],
        "procesoelectoral": [{"codigoprocesoelectoral": catalog}],
        "publicoobjetivo": [{"codigopublicoobjetivo": catalog}],
        "tipoasistentes": [{"codigotipoasistente": catalog}],
        "registroactividad": [{
            "codigoregistroactivdad": activity, "estado": "f", "codigo": "ACT0090001",
            "fecha": "2026-01-01", "hora": "08:30", "lugar": "Fixture room",
            "codusuariocreacion": user, "codusuarioactualizacion": None,
            "codformatoactividad": catalog, "codjuradonacionalespecial": catalog,
            "codprocesoelectoral": catalog, "codpublicoobjetivo": catalog,
            "codtipoasistente": catalog, "adjuntolistaasistentes": "missing.pdf",
            "adjuntoregistrofotografico": None,
        }],
        "registroactividadparticipante": [{
            "codigoregactparticipante": participant, "estado": "t",
            "codregistroactividad": activity, "codusuariocreacion": user,
            "codusuarioactualizacion": None, "dni": "12345678",
            "nombrescompletos": "Fixture Person", "sexo": None, "edad": "30",
            "organizacion": None, "cargo": None, "correo": None,
            "poblacion": None, "telefono": None,
        }],
    }


class PlannerTests(unittest.TestCase):
    def test_counts_and_historical_blanks_do_not_block_source(self):
        source = fixture()
        legacy_id = source["usuario"][0]["codigousuario"]
        result = plan(source, {legacy_id: "00000000-0000-0000-0000-000000000006"})
        self.assertEqual(result["relationship_errors"], {})
        self.assertEqual(result["target_constraint_errors"], {})
        self.assertEqual(result["historical_validation_exceptions"]["blank_sex"], 1)
        self.assertEqual(result["source_state"]["inactive_activities"], 1)
        self.assertEqual(result["unavailable_evidence_references"], 1)
        self.assertTrue(result["source_ready_after_auth_mapping"])
        self.assertFalse(result["ready_for_database_import"])

    def test_unknown_catalog_and_overlong_value_block_source(self):
        source = fixture()
        source["registroactividad"][0]["codprocesoelectoral"] = "unknown"
        source["registroactividadparticipante"][0]["telefono"] = "x" * 21
        result = plan(source, {})
        self.assertEqual(result["relationship_errors"]["activity_codprocesoelectoral"], 1)
        self.assertEqual(result["target_constraint_errors"]["participant_telefono_length"], 1)
        self.assertFalse(result["source_ready_after_auth_mapping"])

    def test_auth_map_rejects_duplicate_destination(self):
        first = "00000000-0000-0000-0000-000000000001"
        second = "00000000-0000-0000-0000-000000000002"
        target = "00000000-0000-0000-0000-000000000003"
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "map.csv"
            with path.open("w", newline="", encoding="utf-8") as handle:
                writer = csv.writer(handle)
                writer.writerow(("legacy_user_id", "auth_user_id"))
                writer.writerow((first, target))
                writer.writerow((second, target))
            with self.assertRaisesRegex(ValueError, "unknown or duplicate UUIDs"):
                read_auth_map(path, {first, second})


if __name__ == "__main__":
    unittest.main()
