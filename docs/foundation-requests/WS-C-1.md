# WS-C-1: reads of the Assessments screens that 3.7 did not list

- **From:** WS-C (Quizzes + assessments; build spec 11.1), 2026-10-15
- **Status:** closed. Landed by the foundation maintainer on 2026-10-15 (documentation only;
  no code, index or rule change). The fallback (drop "All courses" and default to the first
  assigned course) is not needed.
- **Frozen files concerned:** `docs/ARCHITECTURE.md` (3.7)

## Problem

3.7 says a repository may issue only the query shapes listed per screen. The Assessments row
listed one attempt shape (`quizAttempts` where `classId == X` and `courseId == Y` order by
`submittedAt desc`) and "attempt detail by direct get". `/teacher/assessments` and
`/teacher/assessments/[attemptId]` need four more reads:

- **(a) The teacher's classes, for the class picker.** The Teacher Dashboard shape with
  `includeArchived`: `classes` where `teacherUids array-contains uid` and `archived in [false,
  true]` order by `name` (`listClassesForTeacher(…, { includeArchived: true })`; 3.7's closing
  note already says that `includeArchived` runs as `in [false, true]` on the same index).
  Archived classes stay in the picker because attempts are historical snapshots (spec Q6).
- **(b) `getAll` of the selected class's assigned courses** (the course picker) and of any
  other course named on the page (`getCourses`).
- **(c) "All courses":** `quizAttempts` where `classId == X` order by `submittedAt desc`,
  50 per page, without the `courseId` filter. The cursor is the last attempt id of the
  previous page; the earlier cursors travel in the URL. `listAttemptsForClass` already
  implements this shape when `courseId` is omitted, and the composite index
  `quizAttempts: classId ASC, submittedAt DESC` exists (3.8), but 3.7 listed the shape for no
  screen: the Teacher Dashboard's attempt query is an `in` query. "All courses" is the only
  way a teacher sees attempts at courses the class does not assign: under rule 2 of
  `resolveClassContext` (3.4) a pupil who enrols on their own in an unassigned course is still
  supervised by their class, so the attempt carries the class's `classId`.
- **(d) On the attempt page,** direct gets of `quizzes/{quizId}`, `courses/{courseId}` and
  `classes/{classId}` next to `quizAttempts/{id}`.

The course reads of (b) and (d) may add the `enrollments/{uid}_{courseId}` read of the
"Course access" row for a teacher-made course (inside `getCourses` and `getQuiz`); that row
already covers it. Items (a), (b) and (d) are reads that 3.7 already allows on other rows;
listing them on the Assessments row follows the WS-B-2 precedent. None needs a new index.

## Change (landed)

`docs/ARCHITECTURE.md` 3.7, the Assessments row now reads:

> the teacher's classes for the class picker: the Teacher Dashboard query with
> `includeArchived` (`classes` where `teacherUids array-contains uid` and `archived in [false,
> true]` order by `name`; same index); `getAll` of the selected class's assigned courses and of
> any other course named on the page; `quizAttempts` where `classId == X` and `courseId == Y`
> order by `submittedAt desc`, or, for "All courses", where `classId == X` order by
> `submittedAt desc` without the `courseId` filter (paginated, 50; the cursor is the last
> attempt id of the previous page, and the earlier cursors travel in the URL). Attempt
> detail: `quizAttempts/{id}`, `quizzes/{quizId}`, `courses/{courseId}` and `classes/{classId}`
> by direct get. Course reads as in the row "Course access" (`getCourses` / `getQuiz` may read
> `enrollments/{uid}_{courseId}` for a teacher-made course)

Checked: `listAttemptsForClass` (`src/lib/data/quizzes.ts`) builds `where('classId', '==', X)`
then, only with a `courseId`, `where('courseId', '==', Y)`, ordered by `submittedAt desc`;
`firestore.indexes.json` holds both `quizAttempts` indexes; `archivedFilter` in
`src/lib/data/classes.ts` runs `includeArchived` as `in [false, true]`.
