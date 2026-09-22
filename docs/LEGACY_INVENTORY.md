# Read-only legacy inventory and reconciliation gates

The source reviewed on 18 September 2026 was the PostgreSQL custom dump in
the PREVENCOPE network share, alongside the Spring Boot source. A local copy
at `Downloads/JNE/Modulo Charlas/backup.dump` has SHA-256
`388f1f5c054cc4e682261a8fc3b09b23d141c65ec2e9a19232ee9b15b2d67c8a`.
Its table counts match the earlier inventory. This document records counts and
relationships, not personal records or the dump itself. On 21 September 2026,
the network share was reachable again. The shared dump, backend ZIP, frontend
ZIP, and `modelo_charlas` matched the local copies by SHA-256. The shared dump
is dated 27 August 2026. The project owner confirmed this is the final legacy
database snapshot for migration.

| Item | Read-only finding |
| --- | ---: |
| Source tables | 19 |
| Users | 92 (11 Monitor, 81 Gestor) |
| Activity registrations | 1,637 (1,455 active) |
| Participants | 32,042 |
| Distinct referenced attachment names | 2,632 |

The source role graph has 8 modules, 6 actions, 21 module/action combinations,
12 role/module associations, and 42 role/module/action rows (18 inactive).
Monitor has active LIST/ADD/EDIT/DELETE/APROVE/OBSERVE on `GREGACT`, active
LIST/ADD/EDIT/DELETE on `GFORACT`, `GTIPACT`, and `GUSU`, inactive LIST/ADD
on `GPRM`, and active LIST on `GTOD`.
Gestor has active LIST/ADD/EDIT/DELETE on `GREGACT`, inactive APROVE/OBSERVE
there, inactive LIST/ADD/EDIT/DELETE on `GFORACT`, `GTIPACT`, and `GUSU`,
inactive LIST/ADD on `GPRM`, and active LIST on `GTOD`. Preserve every disabled
row as disabled on import. The generated [source seed](../supabase/seed.sql)
preserves the 42 grant UUIDs and flags, and [seed-parity.sql](../supabase/tests/seed-parity.sql)
checks the effective matrix. The single source format has series `ACT009`
and next number 1642; all 1,637 source registration codes are unique and the
highest suffix is 1641. Reconcile this again before enabling hosted writes.

Business primary keys for catalogs, formats, juries, registrations, and
participants are UUIDs and should remain unchanged. Map the original user UUID
to `profiles.legacy_user_id` while `profiles.id` is the new `auth.users.id`.
Audit creator/updater references must resolve through that mapping. Source
`juradonacionalespecial.codprocesoelectoral` is an integer, while the process
primary key is a UUID; it is metadata, not a verified foreign key. No
user-to-jury assignment table was found. Do not infer either relationship.

The reviewed dump has 1 activity type, 7 assistant types, 11 target audiences,
1 electoral process, 61 special juries, and 1 activity format. Its non-sensitive
catalog UUIDs and names are retained in the source seed; source users and
activities are excluded from that file.

Historical participant exceptions include 53 blank sex values, one blank
organization, 5,248 blank positions, 25,657 blank emails, and 26,494 blank
population values. The import retains blanks and records exception classes;
the transactional API enforces stronger validation only on new writes.
Reconcile active/inactive flags, activity codes, and each format's next counter
against the highest imported code before enabling writes.

The repeatable [evidence audit](../scripts/audit-legacy-evidence.py) reconciled
all 2,632 distinct attachment names from the dump by kind and extension-derived
MIME type against all 639 files in the supplied shared Charlas source tree.
None matched: 1,332 attendance lists and 1,300 photographic records remain
unavailable in that tree. The same audit across the broader `08.Agosto`
handoff searched 1,676 files and also found zero filename matches. Of the
attendance references, 1,118 are PDFs, 131
XLSX, 50 JPEG, and 33 PNG. Of the photographic references, 77 are PDFs, 1,138
JPEG, and 85 PNG. These are MIME inferences from filenames, not verified file
content. The only three PNGs in the source tree are frontend logos. The Spring
backend config points uploads to `/var/www/files/ventas/public/images`, an
IONOS host path outside the share. Search that original volume or a verified
backup using the reference inventory; record name, kind, size, actual MIME,
and checksum for each recovered object. The new browser upload policy rejects
photographic PDFs, so import recovered historical PDFs through a trusted
service role only. Unrecovered references remain unavailable and must not be
displayed as downloadable evidence. Database reconciliation does not establish
evidence parity.

The owner confirmed this is the final supplied snapshot and accepted these
2,632 references as unavailable for the migration. This acceptance closes the
object-recovery attempt for the supplied handoff; it does not claim that the
objects existed in Supabase or that evidence parity was achieved. If a verified
IONOS volume or backup appears later, reconcile its bytes, actual MIME type,
size, checksum, activity, and kind before importing it through the controlled
legacy compatibility path.
