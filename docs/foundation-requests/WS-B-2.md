# WS-B-2: reads of the student screens that 3.7 did not list

- **From:** WS-B (areas home and learn; written by area player), 2026-10-14
- **Status:** closed. Landed by the foundation maintainer on 2026-10-14 (documentation only;
  no code or index change).
- **Frozen files concerned:** `docs/ARCHITECTURE.md` (3.7)

## Problem

3.7 says a repository may issue only the query shapes listed per screen. The WS-B screens
need four reads that 3.7 did not list. Each one is a read by id, or a shape that 3.7 already
lists for another screen, so none needs a new index.

- **Student Home** also reads the definitions of the at most 6 awarded badges by id
  (`getBadge`). `BadgeTile` needs the `Badge`, and a `UserBadge` only has `badgeId` and
  `awardedAt`.
- **Student Learn** also reads the pathway catalog with the published-pathways query of the
  public home (`pathways` where `status == 'published'` order by `order`, `audience`
  filtered in memory). 6.4 makes `/student/learn` "My courses + pathway catalog", and the
  shared Home/Learn row only covered the pathways of enrolled courses.
- **Pathway detail (student)** also reads the learner's enrollments with the Student Learn
  shape (`listEnrollmentsForUser`), for the learner's own progress (6.4).
- **Course detail** also calls `getCourseAccess` (no read for a free course; for a premium
  course, the licence, subscription and class reads of 4.5). When the outline read answers
  `forbidden`, it reads `courses/{id}` through `getPublishedCourse` to recognise a Teacher
  Academy course.

Home's pathways-by-id read was never part of this request: the 3.7 row already says "→
`getAll` courses and pathways".

## Change (landed)

`docs/ARCHITECTURE.md` 3.7: the Student Home / Student Learn row (badge definitions by id;
Learn's published-pathways catalog), the Pathway detail row (the student page's
enrollments), the Course detail row (course access; `getPublishedCourse` on `forbidden`),
and a new "Course access" row that lists the reads of `getCourseAccess`.
