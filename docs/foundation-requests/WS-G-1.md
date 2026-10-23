# WS-G-1: reads of the school screens and two URLs that 3.7 and 6.6 did not list

- **From:** WS-G (School admin; build spec 12.1), 2026-10-16
- **Status:** closed. Landed by the foundation maintainer on 2026-10-16 (documentation only; no
  code, schema, rule or index change).
- **Frozen files concerned:** `docs/ARCHITECTURE.md` (3.7, 6.6)

## Problem

3.7 lets a screen run only the reads it lists. The school screens need reads that reuse shapes
and indexes 3.7 and 3.8 already have (`includeArchived` runs as `archived in [false, true]` on
the same index), or direct gets, but that their rows did not name; five screens had no row at
all. WS-E-1 set the precedent for this kind of request.

Two pages had no URL in 6.6. The read-only preview needs a lesson id, which only a course
outline gives, and reading every outline on the course list would cost three reads per course;
so a course detail page holds the outline. Loading the assignable catalog on the class page
would add about nine queries to every view of it (the reason WS-E-1 gave teachers their own
assign page); so assigning has its own page.

## Change (landed)

`docs/ARCHITECTURE.md` 3.7, existing rows:

1. **School Dashboard / Analytics**: the per-course counts (`getSchoolCourseUsage`) first read
   the School Classes query (`archived == false`) and a `getAll` of the assigned courses (what
   the code already does); the dashboard also reads the School Certificates query with `limit 5`
   (recent activity); the analytics page also reads the School Classes query (its classes
   table).
2. **School Teachers / Students**: Teachers also reads the School Classes query (active: the
   classes each teacher teaches); Students reads it with `includeArchived` (same index) to name
   each pupil's classes, archived ones marked.
3. **School Classes**: the list page runs it with `includeArchived` (archived classes in a
   disclosure), reads the School Teachers query with `role == 'teacher'`, every page of 100
   (teacher names, the owner picker of "New class"), and `schools/{id}` by id (the join-code
   switch, so that no class card says "open" while it is off).
4. **School Certificates**: paginated, 50; the cursor is the last certificate id.

New rows: **School class detail** (`/school/classes/[classId]`: the "Class detail" reads plus
the School Teachers query, all pages of 100); **School assign**
(`/school/classes/[classId]/assign`: `classes/{id}`, then, only for a class that is not
archived, the published-pathway query, the Pathway detail course query for each student pathway
with `publishedCourseCount > 0`, and `listSchoolCourses` filtered in memory to audience
`student`, status `published` and, for teacher-made courses, visibility `school`); **School
Courses** (`/school/courses`: the pathway query, the course query per pathway (both audiences),
`listSchoolCourses`, the `getSchoolCourseUsage` reads, and the School Teachers query only when
the school has a teacher-made course); **School course detail** (`/school/courses/[courseId]`:
course outline and course access, plus, for audience `student` only, the `getSchoolCourseUsage`
reads and the School Classes query); **School Licenses** (`schools/{id}` and the licence query,
plus the published-pathway query only when a licence has a `pathways` scope); **School
Settings** (`schools/{id}`).

`docs/ARCHITECTURE.md` 6.6: new rows `/school/classes/[classId]/assign` ("Assign a course to the
class: the official student catalog and the published student courses shared in the school,
with an optional due date") and `/school/courses/[courseId]` ("Course detail: facts, a lesson
outline linking to the read-only preview (`/preview/…`, 6.3), use in the school (enrolled,
completed, classes)"); the Courses row says each course opens its detail page.

Every read is an existing shape or a direct get, so 3.8 and `firestore.indexes.json` are
unchanged.
