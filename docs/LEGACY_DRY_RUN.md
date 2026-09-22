# Legacy database dry import — 22 September 2026

Source: final reviewed `backup.dump`, SHA-256
`388f1f5c054cc4e682261a8fc3b09b23d141c65ec2e9a19232ee9b15b2d67c8a`.
Destination: disposable local Supabase database, with 92 synthetic Auth IDs
mapped to the source users and matching source emails. No account invitations
were sent. The rehearsal imported inside a transaction and rolled it back;
the local Auth users were removed afterward. A final aggregate query confirmed
zero Auth users, profiles, activities, participants, evidence rows, and import
batches remained.

| Category | Projected inserts | Updates | Skips |
| --- | ---: | ---: | ---: |
| Profiles | 92 | 0 | 0 |
| Role memberships | 92 | 0 | 0 |
| Activities | 1,637 | 0 | 0 |
| Participants | 32,042 | 0 | 0 |
| Unavailable evidence metadata | 2,632 | 0 | 0 |

The source and destination checks found zero unresolved relationships and
zero target constraint errors. The 2,632 evidence references have no verified
objects, so their metadata is unavailable and evidence parity remains
incomplete. Historical participant blanks were preserved and marked: 53 sex,
1 organization, 5,248 position, 25,657 email, and 26,494 population values.
These categories overlap; 30,843 participants have at least one marker.

The local rehearsal is repeatable with `scripts/rehearse-legacy-import.py` and
the reviewed dump. It refuses a non-local database URL. An independent
synthetic fixture in `scripts/test-build-legacy-import.py` applies its batch
twice and confirms the second run inserts zero business or evidence rows.

This result does not authorize a hosted import. The 92 institutional Auth
identities and verified legacy-to-Auth mapping are still absent, so a hosted
destination-aware dry run and production import remain pending. The legacy
password hashes are excluded from import SQL.
