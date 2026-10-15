# WS-B-5: "1 of 1 courses completed" — the pathway progress message has no plural

- **From:** WS-B, area home (Student Home), 2026-10-15; extended by area learn, 2026-10-15
- **Status:** open. Nothing is blocked; the English text is just ungrammatical.
- **Frozen files concerned:** `src/messages/en/domain.json`

## Problem

`PathwayCard` (My pathways on the Student Home, and the pathway catalog on `/student/learn`)
renders `domain.pathway.progress` with `{ completed, total }`. The English source has no
plural:

```json
"progress": "{completed} of {total} courses completed"
```

So a pathway with one course reads "1 of 1 courses completed" or "0 of 1 courses completed".
The French message already uses ICU plural and is correct ("1 cours terminé sur 1").

## Failing case (checked in Chromium, emulator seed)

- `lea.demo`, `/en/student`, My pathways: "AI Explorer … 1 of 1 courses completed".
- `student@demo.roboholic.test` or a freshly enrolled student, `/en/student`: "0 of 1 courses
  completed".
- The same accounts on `/en/student/learn`, Explore pathways, AI Explorer card: "1 of 1 courses
  completed" (lea) and "0 of 1 courses completed" (student@demo).

`domain.lessonNav.moduleProgress` has the same gap: `"{completed} of {total} lessons
completed"`. No seeded module has a single lesson, so nothing shows it yet, but
`LessonNavigation` (the player's outline) would read "0 of 1 lessons completed" for one.

## Wanted change

`src/messages/en/domain.json`, `pathway.progress`:

```json
"progress": "{completed} of {total, plural, one {# course} other {# courses}} completed"
```

and `lessonNav.moduleProgress`:

```json
"moduleProgress": "{completed} of {total, plural, one {# lesson} other {# lessons}} completed"
```

They read "1 of 1 course completed", "0 of 1 course completed", "2 of 3 courses completed".
The keys and the arguments stay the same, so `check-messages`, the French catalog and the
callers need no change.

## Workaround in place (WS-B, area learn)

The pages WS-B owns no longer use the two domain messages. The student pathway page
(`PathwayOverview`) renders `learn.pathway.progress`, and the course page's module headers
(`CourseOutlineList`) render `learn.course.progress.lessons`, both with the plural above (en)
and the same French text as `domain`. They can stay once this lands. `PathwayCard` is a
domain component, so the catalog on `/student/learn` and My pathways on the Home still need
this request.
