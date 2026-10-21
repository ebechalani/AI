# WS-H-1: one repository function, and the admin reads, URLs and audit entries

- **From:** WS-H (Platform admin; build spec 12.1), 2026-10-16
- **Status:** closed. Landed by the foundation maintainer on 2026-10-16.
- **Frozen files concerned:** `src/lib/data/billing.ts`, `scripts/smoke-queries.ts`,
  `tests/unit/data-identity.test.ts`, `tests/integration/platform-admin.test.ts`,
  `docs/ARCHITECTURE.md` (3.7, 6.7, 10.2, 10.4)

## Problem

6.7 puts "Subscriptions and licences (manual entry)" on one page (`/admin/subscriptions`), but
the only licence query in 3.7 is per school: a platform-wide licence list would cost one query
per school on every view (the SPEC-H 6.5 fallback). The admin pages also make reads that 3.7 did
not list (the same kind of request as WS-E-1 and WS-G-1), use URLs and query parameters that 6.7
did not list, and the actions write three audit entries (`school.status_changed`,
`license.upserted`, `subscription.upserted`, all in `AUDIT_ACTIONS`) that no repository or
service writes, and check references the repositories do not check.

## Change (landed)

- **`src/lib/data/billing.ts`**: `listAllLicenses(actor, page?: PageRequest):
  Promise<Page<License>>`: `assertCan(isPlatformAdmin(actor), 'licenses.list')` before any
  Firestore access, then `readPage` over `collections.licenses().orderBy('endsAt', 'desc')`; the
  cursor is the last licence id. One field in one direction, so Firestore's automatic
  single-field index serves it (`endsAt` is not exempted in 3.8); 3.8 and
  `firestore.indexes.json` are unchanged.
- **`scripts/smoke-queries.ts`**: `{ name: 'licenses: all', planned: { run: () =>
  listAllLicenses(system, limit) } }` next to "subscriptions: all".
- **`docs/ARCHITECTURE.md`**:
  - 3.7 "Admin lists": `licenses` order by `endsAt desc` (paged, 50), and the other reads of the
    admin pages and actions: every page of `schools` by `name`; `listSchoolUsers` on
    `/admin/schools/[schoolId]` (`school_admin` included); per-owner user subscriptions; `users/{uid}`
    gets for subscription owners and `?user=` filters; on `/admin/certificates?user=` the Student
    Home enrollment query, per-user certificates and a `getAll` of the courses; official courses,
    pathways and hardware platforms read whole (pickers and action checks); `getChallenge` for the
    editor; the actions' school and user gets, the school's subscriptions and a `getAll` of the
    named courses.
  - 3.7, new row "School subscriptions": `subscriptions` where `ownerType == 'school'` and
    `ownerId == X` order by `currentPeriodEnd desc` (3.7 listed only the `ownerType == 'user'`
    shape, in "Course access"; the existing index serves it and smoke-queries already ran it).
  - 6.7: new rows `/admin/challenges/new`, `/admin/challenges/[challengeId]` (edit and status) and
    `/admin/challenges/[challengeId]/entries`, and the query parameters of the admin pages (`role`,
    `people`, `tab`, `user`, `school`, `status`, and `cursor` / `page` / `trail` on paged lists).
  - 10.2 billing: the `listAllLicenses` signature.
  - 10.4: `setSchoolStatusAction`, `upsertLicenseAction` and `upsertSubscriptionAction` write the
    three audit entries (with their meta) through `data/audit.writeAudit`, best effort (logged, not
    failing, once the change is stored); the upsert actions answer `validation` with
    `input.<field>: ['invalid_choice']` unless the owner exists, a new user subscription's owner is
    a student or teacher, the named courses exist and are official, the linked subscription belongs
    to the school, the licence's `scope.pathwayIds` exist, and the challenge's school and
    `hardwarePlatformIds` exist.

## Tests

- `tests/unit/data-identity.test.ts`: `'billing.listAllLicenses'` in the `adminOnly` matrix: a
  school admin, a teacher and a student get `forbidden` before Firestore is reached. That file
  mocks the Admin SDK, so ordering and cursors are tested against the emulator instead.
- `tests/integration/platform-admin.test.ts` (gate): with licences of two schools,
  `listAllLicenses` returns the latest `endsAt` first across schools (and the seeded licence),
  pages by licence id with `limit 1`, answers `ValidationError { cursor: ['invalid'] }` for an
  unknown cursor and for the id of a document of another collection, and refuses a school admin.
- Checked read-only against the shared Firestore emulator (scratch script, system actor): five
  licences of three schools in `endsAt` order, the cursor of a `limit 1` page, and the refused
  unknown cursor.
