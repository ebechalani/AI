# WS-D-1: `project-flow.getFileForDownload` for `GET /api/files/[fileId]`

- **From:** WS-D (Projects + review; build spec 16.1), 2026-10-15
- **Status:** closed. Landed by the foundation maintainer on 2026-10-15, as wanted (additive).
  WS-D builds the route on it directly (spec 4.3); the interim of spec 4.2 (`getFile` plus a
  `?submission=` hint) is not needed.
- **Frozen files concerned:** `src/lib/services/project-flow.ts`, `docs/ARCHITECTURE.md` (6.9,
  10.2, 10.3), `tests/unit/services-project-flow.test.ts`

## Problem

6.9 lets `GET /api/files/[fileId]` serve a file to its owner, to anyone passing
`canViewSubmission` on `file.submissionId` (the reviewing teacher, a school admin of the
school), and, for course media, to anyone `getCourseAccess` lets into the course (or who
passes `canEditCourse`). The route could not do it:

- `data/files.getFile` answers only the owner and platform admins ("services load others as
  system"), and no service loaded a file for another viewer;
- ESLint bans `SYSTEM_ACTOR` in `src/app/**`, so the route cannot read the record as the
  system itself.

Without the service, WS-D's only way out was a contained workaround (spec 4.2): owners
through `getFile`, staff through a `?submission=<id>` hint checked with `getSubmission`, the
path rebuilt with `userUploadPath` from the `FileRef`. Two things stayed out of reach: course
media of teacher-made courses (WS-B's `ImageBlock`, `FileBlock` and `VideoBlock` reach it
through `mediaUrl` with no hint) and bare `/api/files/{id}` URLs (`MediaImage` thumbnails).

## Change (landed)

`src/lib/services/project-flow.ts`:

```ts
/** For GET /api/files/[fileId] (6.9): the record when the actor may download the file; NotFoundError otherwise. */
export async function getFileForDownload(actor: Actor, fileId: string): Promise<FileRecord>;
```

1. `requireSessionActor(actor, 'file.download')` (a `SystemActor` is `ForbiddenError`).
2. An id that does not match `FILE_ID_PATTERN` is `NotFoundError` with no read.
3. `file = await orNullIfMissing(getFile(SYSTEM_ACTOR, fileId))`; null → `NotFoundError`.
4. Allowed: `file.ownerUid === session.uid` or `isPlatformAdmin(actor)`.
5. `purpose: 'submission'` with `submissionId !== null`: allowed when `getSubmission(actor,
   file.submissionId)` succeeds (`canViewSubmission`) **and** the submission still lists the
   file in `attachments` (a removed attachment is refused).
6. `purpose: 'course_media'`: any session when `isPublicMediaPath(file.storagePath)`;
   otherwise the course is read as the system (`getCourse(SYSTEM_ACTOR, courseId)`, a missing
   course refuses) and must pass `canEditCourse(actor, course) || (await
   getCourseAccess(actor, course)).allowed`. `getCourseAccess` applies `canViewCourse` first,
   so a private free course stays private, and a premium course needs a cover.
7. Everything else is the same `NotFoundError` (`files/{fileId} does not exist.`), so the
   route gives away no existence oracle.

`docs/ARCHITECTURE.md`: 6.9 says the route authorizes "through
`project-flow.getFileForDownload(session, fileId)`" and lists the rules above; 10.3 lists the
function and its semantics; the 10.2 comment of `getFile` names it; 3.7 has a "File download"
row (WS-D-2).

`tests/unit/services-project-flow.test.ts`, `describe('getFileForDownload')`, 11 tests over
the mocked repositories (`getFile` answering as the real one does): the owner (read as the
system, no submission read); a platform admin; the reviewing teacher and a school admin of the
school; a classmate, another teacher, a school admin of another school and a stranger
(refused); a removed attachment and a file not yet attached (refused to staff, still served
to the owner); teacher-made course media for an enrolled learner (allowed, `getCourseAccess`
called with the session) and for a stranger, a classmate and another teacher (refused); a
premium course without a cover; the course's editor reaching media uploaded by a platform
admin without `getCourseAccess`, and nobody once the course is deleted; official media for
any session with no course read; malformed ids (no read) and a missing file answered exactly
like a hidden one; the system actor refused.

Checked against the emulator with a read-only script (WS-D spec fixture submission with two
image attachments, file `4e07c566-…`): the owner, the class's teacher and `admin@demo` get the
record; `teacher@demo` (another class), `student@demo` and `schooladmin@demo` (another school)
get `NotFoundError`, as do an unknown UUID and `not-a-file`.
