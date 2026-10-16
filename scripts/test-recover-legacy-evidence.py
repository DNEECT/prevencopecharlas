"""Tests for the controlled legacy evidence recovery tool."""

import json
import runpy
import tempfile
import unittest
from pathlib import Path


module = runpy.run_path(str(Path(__file__).with_name("recover-legacy-evidence.py")))
detected_mime = module["detected_mime"]
parse_login_response = module["parse_login_response"]
storage_name = module["storage_name"]
validate_output_directory = module["validate_output_directory"]
REPO = module["REPO"]


class RecoveryTests(unittest.TestCase):
    def test_detects_supported_file_signatures(self):
        self.assertEqual(detected_mime(b"%PDF-1.7"), "application/pdf")
        self.assertEqual(detected_mime(b"\xff\xd8\xff\xe0"), "image/jpeg")
        self.assertEqual(detected_mime(b"\x89PNG\r\n\x1a\n"), "image/png")
        self.assertEqual(
            detected_mime(b"PK\x03\x04"),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        self.assertIsNone(detected_mime(b"<html>not a file"))

    def test_login_response_requires_nonempty_token(self):
        self.assertEqual(parse_login_response(json.dumps({"datos": {"token": "abc"}}).encode()), "abc")
        with self.assertRaisesRegex(ValueError, "token"):
            parse_login_response(json.dumps({"datos": {}}).encode())

    def test_storage_name_is_bounded_and_path_safe(self):
        name = storage_name("Informe final: JEE/Pasco 2026.pdf", "evidence-id", ".pdf")
        self.assertEqual(name, "evidence-id-Informe_final_JEE_Pasco_2026.pdf")
        self.assertLessEqual(len(name), len("evidence-id-") + 70 + len(".pdf"))

    def test_output_inside_repository_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "outside"):
            validate_output_directory(REPO / "private-recovery")
        with tempfile.TemporaryDirectory() as directory:
            self.assertTrue(validate_output_directory(Path(directory)).is_dir())


if __name__ == "__main__":
    unittest.main()
