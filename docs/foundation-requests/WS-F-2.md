# WS-F-2: publishing needs content, checked by the server

- **From:** WS-F (Course creator; build spec 13.2), 2026-10-16
- **Status:** closed. Landed by the foundation maintainer on 2026-10-16.
- **Frozen files concerned:** `src/lib/learning/publish-readiness.ts` (new),
  `src/lib/data/courses.ts` (`setCourseStatus`), `tests/unit/publish-readiness.test.ts` (new),
  `tests/integration/teacher.test.ts`, `docs/ARCHITECTURE.md` (2, 3.4, 10.1, 10.2)

## Problem

`setCourseStatus` let any status follow any other, so an empty course (no module, a module
without lessons, a lesson without blocks) could be published and then assigned. The brief asks
for publishing with clear errors that list what is missing. A check in the editor's browser
alone is not a check: any direct call of `setCourseStatusAction` bypasses it. The editor's
readiness list and the repository must apply the same rule, and shared lib code is the only
module both may import.

## Change (landed)

- **`src/lib/learning/publish-readiness.ts`** (shared, pure, imports only `@/types`):

  ```ts
  export type PublishProblem =
    | { kind: 'no_modules' }
    | { kind: 'empty_module'; moduleId: string }
    | { kind: 'empty_lesson'; lessonId: string };
  export interface PublishOutline {
    modules: readonly Pick<Module, 'id' | 'order'>[];
    lessons: readonly Pick<Lesson, 'id' | 'moduleId' | 'order' | 'blockCount'>[];
  }
  export function getPublishProblems(outline: PublishOutline): PublishProblem[];
  ```

  `[]` when the course is ready; `no_modules` alone when it has no module; otherwise module by
  module (by `order`): a module without lessons gives `empty_module`, else each of its lessons
  (by `order`) with `blockCount` 0 gives `empty_lesson`. A lesson whose module is not in the
  outline is not looked at; the inputs are not changed. (`PublishOutline` is the parameter type
  of the requested signature, exported under a name.)
- **`src/lib/data/courses.ts`, `setCourseStatus`**: inside the existing transaction, after the
  same-status early return (so re-publishing a published course stays a no-op) and before any
  write, publishing reads `collections.modules(courseId)` and `collections.lessons(courseId)`
  whole and throws `ValidationError('The course is not ready to publish.', { status:
  ['content_required'] })` when `getPublishProblems` is not empty. Moving to `draft` or
  `archived` asks nothing of the content. The seed does not call `setCourseStatus`, and the
  integration builder `buildOfficialCourse` publishes a complete course (module, lesson, blocks),
  so neither is affected.
- **Docs**: section 2 lists `learning/publish-readiness.ts` as shared pure code; 3.4 (the course
  `status` comment); 10.1 has the signature with the other `src/lib/learning` helpers; 10.2's
  `setCourseStatus` comment: "`ValidationError { status: [content_required] }` when publishing a
  course `getPublishProblems` rejects (modules and lessons read in the transaction);
  re-publishing a published course is a no-op". WS-F-1 adds the reads to 3.7.

## Tests

- `tests/unit/publish-readiness.test.ts`: `getPublishProblems` (no module, with or without stray
  lessons; an empty module; empty lessons; a ready course; the order of the problems with modules
  and lessons given out of order; a lesson of an unknown module) and the guard over an
  in-memory Firestore that knows direct gets, whole-collection reads and a transaction that
  records its reads and refuses a read after a write: an empty course, an empty module and a
  lesson without blocks are refused with `status: ['content_required']` and nothing written; a
  complete course is published and counted in its pathway; re-publishing is a no-op without
  reading the content; `archived` and `draft` need none.
- `tests/integration/teacher.test.ts` (gate): a teacher's course is refused while it has no
  module, then a module without lessons, then a lesson without blocks, and is published once the
  lesson has a block; publishing again keeps `publishedAt`; archiving works.
- Checked against the shared Firestore emulator (scratch script, system actor, a scratch course
  deleted afterwards): the same four refusals and the publication.
