# WS-D-2: reads of the project screens that 3.7 did not list

- **From:** WS-D (Projects + review; build spec 16.2), 2026-10-15
- **Status:** closed. Landed by the foundation maintainer on 2026-10-15 (documentation only;
  no code or index change).
- **Frozen files concerned:** `docs/ARCHITECTURE.md` (3.7)

## Problem

3.7 lets a repository issue only the query shapes listed for each screen. Three reads of
WS-D's screens were not listed. Each reuses an indexed shape or is a read by id, so none needs
a new index.

1. **Teacher Projects** also reads the teacher's classes, for the class names and the picker
   of the tab "All": the Teacher Dashboard query with `includeArchived` (`classes` where
   `teacherUids array-contains uid` and `archived in [false, true]` order by `name`), on the
   same index (`archivedFilter` in `src/lib/data/classes.ts` already runs `includeArchived`
   as `in [false, true]`).
2. **Student submission detail**, for a `returned` submission only, also reads the latest
   attempt through `getLatestSubmission`, to decide whether a new version may be sent:
   `enrollments/{uid}_{courseId}` and `submissions/{latestSubmissionId}` by id for a project,
   or the Challenge detail query for a challenge entry.
3. **File download** (`GET /api/files/[fileId]`) had no row: `files/{fileId}`, then
   `submissions/{submissionId}`, or `courses/{courseId}` plus the Course access reads, all
   direct gets.

## Change (landed)

`docs/ARCHITECTURE.md` 3.7:

- Row "Teacher Projects (queue)": starts with "the teacher's classes, for the class names and
  the picker of the tab "All": the Teacher Dashboard query with `includeArchived` (`classes`
  where `teacherUids array-contains uid` and `archived in [false, true]` order by `name`; same
  index)".
- Row "Review screen, student submission detail": adds "The student page, for a `returned`
  submission only, also reads the latest attempt with `getLatestSubmission` to decide whether
  a new version may be sent: `enrollments/{uid}_{courseId}` and
  `submissions/{latestSubmissionId}` by id (project), or the Challenge detail query
  (challenge)".
- New row "File download (`GET /api/files/[fileId]`, `project-flow.getFileForDownload`)":
  "`files/{fileId}`; then, unless the caller owns the file or is a platform admin:
  `submissions/{submissionId}` (submission files), or `courses/{courseId}` plus the reads of
  the row "Course access" (media of a teacher-made course; none for official media). Direct
  gets only".

The interim reads of spec 4.2 (`files/{fileId}` for the owner, else the `submissions/{id}`
named by a `?submission=` hint) are not listed: WS-D-1 landed in the same round, so the route
uses `getFileForDownload` from the start.
