# WS-E-1: reads of the teacher screens and one URL that 3.7 and 6.5 did not list

- **From:** WS-E (Teacher workspace; build spec 12.1), 2026-10-16
- **Status:** closed. Landed by the foundation maintainer on 2026-10-16 (documentation only; no
  code or index change).
- **Frozen files concerned:** `docs/ARCHITECTURE.md` (3.7, 6.5)

## Problem

3.7 lets a repository run only the query shapes it lists for a screen. The teacher screens need
reads it did not list: the class picker and class names, the school's join-code switch and status
for the account-policy hint, course titles on the pupil page, the assignable catalog, Teacher
Academy progress, and the settings email and certificates. Every one of them reuses a 3.8 index
(`archivedFilter` in `src/lib/data/classes.ts` runs `includeArchived` as `archived in [false,
true]` on the same index) or is a direct get, so 3.7 only needs to say so.

The class page also needs an "assign (due date)" control. Loading the assignable catalog on the
class page itself would add about nine queries to every view of it, so assigning lives on its own
page, `/teacher/classes/[classId]/assign`, inside WS-E's `classes/**` folder; the 6.5 route table
did not list it.

## Change (landed)

`docs/ARCHITECTURE.md` 3.7:

1. **Teacher Dashboard**: the class query runs with `includeArchived` (`archived in [false, true]`,
   same index); active classes are filtered in memory, and archived ones name the rows of the two
   lists and separate the onboarding state (no class at all) from "no active class". `classIds` is
   `session.classIds`, archived classes included (the same ids the Teacher Projects queue uses).
2. **New row "Teacher Classes (`/teacher/classes`)"**: the Teacher Dashboard class query with
   `includeArchived`, split into active and archived in memory.
3. **Class detail**: adds `schools/{schoolId}` by id when the class has a school (the school's
   join-code switch and the account-policy hint of the add-students card).
4. **New row "Assign a course (`/teacher/classes/[classId]/assign`)"**: `classes/{id}`; then, only
   for a class that is not archived, the reads of the row "Teacher Courses" without the teacher's
   enrollments, filtered in memory to `audience == 'student'` and `status == 'published'`.
5. **Student detail (teacher)**: adds `classes/{id}` by id; spells out that the student summary
   (`getStudentForTeacher`) reads `classes/{id}`, then the class's `members` order by
   `displayName` for the membership check, then `users/{uid}`; the attempts query runs with
   `limit 50` and the submissions query has no limit; adds the `getAll` of the courses named by
   the enrollments and attempts (`getCourses`; a teacher-made course may cost
   `enrollments/{uid}_{courseId}`, as in "Course access") and the whole `badges` collection (as on
   Achievements), with active `manual` badges filtered in memory.
6. **Teacher Courses**: "published official catalog by pathway" is the Public home pathway query,
   then the Pathway detail course query for each pathway whose `publishedCourseCount > 0`,
   `teacher-academy` included (both audiences); adds the teacher's own enrollments (the Student
   Learn shape) for Teacher Academy progress.
7. **New row "Teacher course detail (`/teacher/courses/[courseId]`)"**: the course outline; course
   access; `enrollments/{uid}_{courseId}` for `audience == 'teacher'`; the Teacher Dashboard class
   query (`archived == false`) for `audience == 'student'` (the assign panel).
8. **Reports**: adds the class picker (the Teacher Dashboard query with `includeArchived`) and a
   `getAll` of the selected class's assigned courses (the course picker).
9. **New row "Teacher Settings"**: `users/{uid}` via `getUser` (for the email address) and
   `certificates` where `userUid == uid` order by `issuedAt desc` (the "Certificates (student)"
   shape).

`docs/ARCHITECTURE.md` 6.5, Teacher routes, under Classes: new row
`/teacher/classes/[classId]/assign`, "Assign a course to the class: the catalog of assignable
courses (official, school, own) with an optional due date".

No new query shape, so `firestore.indexes.json` and 3.8 are unchanged.
