# WS-F-1: the course editor's reads, the reserved `new` id and the teacher's preview

- **From:** WS-F (Course creator; build spec 13.1), 2026-10-16
- **Status:** closed. Landed by the foundation maintainer on 2026-10-16 (documentation only; no
  code, rule or index change).
- **Frozen files concerned:** `docs/ARCHITECTURE.md` (3.7, 6.3, 6.5, 6.7, 11.2)

## Problem

3.7 lets a screen run only the reads it lists, and no row described the course editor. Four of
its reads were in no screen row: `listQuizzes` and `listProjects` (each reads a whole
subcollection, sorted in memory), `hasEnrollments` used as the page's edit gate,
`getQuizWithKey` on a page, and `listHardwarePlatforms` on the editor. The list queries were
already there ("Teacher Courses" and "Admin lists").

The editor also relies on route contracts that 6.x did not write down: the id `new` opens the
editor of a new quiz or project, `?lesson=` adds the new item to a lesson on its first save, a
teacher previews their own course through WS-E's player route (the `/preview` route refuses
teachers), and `/admin/courses` lists official courses while its editor opens any course a
platform admin may edit. Other workstreams link to these URLs, and the teacher's preview
depends on WS-E's route behaviour, which no consumption row of 11.2 recorded.

## Change (landed)

`docs/ARCHITECTURE.md`:

1. **3.7, new row "Course editor (`/teacher/create/**`, `/admin/courses/**`)"**: the list is the
   "Teacher Courses" query (teacher) or the "Admin lists" official-course query plus the whole
   `pathways` collection (platform admin). Every editor page: the course outline (row "Course
   detail") and `enrollments` where `courseId == X` limit 1 (`hasEnrollments`, which starts with
   `loadEditableCourse` and so is also the page's edit check). Course page: the course's
   `quizzes` and `projects` read whole, no filter or order (`listQuizzes` / `listProjects` sort in
   memory); `hardwarePlatforms` read whole (as Student Robotics); for a platform admin on an
   official course, `pathways` read whole. Lesson page: `blocks` order by `order` (as the Lesson
   player), plus `quizzes` and `projects`. Quiz page: `quizzes/{id}` and `private/key` in one
   `getAll` (`getQuizWithKey`). Project page: `projects/{id}`. The reserved id `new` reads no quiz
   or project. Writes read what the 3.6 transactions read; publishing reads `modules` and
   `lessons` inside the `setCourseStatus` transaction (WS-F-2). No new composite index.
2. **6.5**: the quiz and project editor rows say that the id `new` is reserved and opens the
   editor of a new item, and that with `?lesson={lessonId}` the first save also adds it to that
   lesson as a block. A paragraph under the table: a teacher previews their own course read-only
   through `/teacher/courses/[courseId]/lessons/[lessonId]` (`LessonPlayer` answers `readOnly`
   for an owner who is not enrolled, 7.6), and `/preview` is for school and platform admins only.
3. **6.7, Courses row**: "`…/quizzes/new` and `…/projects/new` (with `?lesson=`) as in 6.5. The
   list shows official courses only; the editor opens any course a platform admin may edit
   (`canEditCourse`), a teacher-made one included."
4. **6.3, preview row**: linked from the school's course detail (WS-G-1) and from the platform
   admin's course editor, for official and teacher-made courses; teachers are refused there and
   use the teacher player route.
5. **11.2, consumption row F**: "…; links to `/preview/…` (platform admin) and to
   `/teacher/courses/{courseId}/lessons/{lessonId}` (the teacher's read-only preview of their own
   course: E keeps that route read-only for an owner who is not enrolled) | D, B, E".

No new query shape, so `firestore.indexes.json` and 3.8 are unchanged.
