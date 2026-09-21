# Read-only legacy inventory and reconciliation gates

The source reviewed on 18 September 2026 was the PostgreSQL custom dump in
the PREVENCOPE network share, alongside the Spring Boot source. This document
records counts and relationships, not personal records or the dump itself.
The share was unavailable during the 21 September implementation session;
recheck its contents before an import.

| Item | Read-only finding |
| --- | ---: |
| Source tables | 19 |
| Users | 92 (11 Monitor, 81 Gestor) |
| Activity registrations | 1,637 (1,455 active) |
| Participants | 32,042 |
| Distinct referenced attachment names | 2,632 |

The source role graph has 8 modules, 6 actions, 21 module/action combinations,
12 role/module associations, and 42 role/module/action rows. Monitor has active
LIST/ADD/EDIT/DELETE/APROVE/OBSERVE on `GREGACT`, active LIST/ADD/EDIT/DELETE
on `GFORACT`, `GTIPACT`, and `GUSU`, LIST/ADD on `GPRM`, and LIST on `GTOD`.
Gestor has active LIST/ADD/EDIT/DELETE on `GREGACT`, inactive APROVE/OBSERVE
there, inactive LIST/ADD/EDIT/DELETE on `GFORACT`, `GTIPACT`, and `GUSU`,
inactive LIST/ADD on `GPRM`, and active LIST on `GTOD`. Preserve every disabled
row as disabled on import. Compare all 42 source IDs and flags before seeding
production; the current local SQL fixtures use synthetic IDs and are not a
substitute for the source seed.

Business primary keys for catalogs, formats, juries, registrations, and
participants are UUIDs and should remain unchanged. Map the original user UUID
to `profiles.legacy_user_id` while `profiles.id` is the new `auth.users.id`.
Audit creator/updater references must resolve through that mapping. Source
`juradonacionalespecial.codprocesoelectoral` is an integer, while the process
primary key is a UUID; it is metadata, not a verified foreign key. No
user-to-jury assignment table was found. Do not infer either relationship.

Historical participant exceptions include 53 blank sex values, one blank
organization, 5,248 blank positions, 25,657 blank emails, and 26,494 blank
population values. The import retains blanks and records exception classes;
the transactional API enforces stronger validation only on new writes.
Reconcile active/inactive flags, activity codes, and each format's next counter
against the highest imported code before enabling writes.

The supplied source tree did not contain the 2,632 referenced evidence objects.
In particular, 77 historical photographic references are PDFs, which the new
browser upload policy intentionally rejects. Search the original attachment
volume or a verified backup using the reference inventory; record name, kind,
size, MIME, and checksum for each recovered object. Import those PDFs through
a trusted service role only. Unrecovered references remain unavailable and
must not be displayed as downloadable evidence. Database reconciliation does
not establish evidence parity.
