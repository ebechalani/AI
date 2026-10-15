# WS-B-1: `LessonPlayer` may import `lib/services/learning`

- **From:** WS-B, area player (lesson player), 2026-10-14
- **Status:** closed. Landed by the foundation maintainer on 2026-10-14.
- **Frozen files concerned:** `eslint.config.mjs`, `docs/ARCHITECTURE.md` (7.1),
  `tests/unit/lint-boundaries.test.ts`

## Problem

7.6 and 7.7 fix `LessonPlayer`'s props to `{ courseId, lessonId, lessonBasePath, exitHref }`,
and three route files render it (student, teacher (WS-E) and the `/preview` route). So the
component has to load its own data with `getLessonPlayerData(session, courseId, lessonId)`, as
10.4 and the foundation's stub comment say. The 7.1 boundary rule forbade that import:

```
npx eslint --stdin --stdin-filename src/components/lesson/LessonPlayer.tsx
→ 'components/lesson/LessonPlayer' must not import 'lib/services/learning'
```

There was no way around it inside WS-B's paths. A component cannot reach the service
through `app/**` (forbidden too). A `'use server'` wrapper in `src/actions/learning.ts` would
publish the whole player payload as a POST endpoint that 10.4 does not list.

## Change (landed)

- `eslint.config.mjs`: the boundary `{ from: ['components'], forbid: ['app', 'lib/data',
  'lib/services'] }` has `exceptions: [['components/lesson/LessonPlayer',
  'lib/services/learning']]`.
- `docs/ARCHITECTURE.md` 7.1 (and the matching note in 1.2): "`LessonPlayer` is the one
  component that loads its own data (`getLessonPlayerData`, 7.6) …".
- `tests/unit/lint-boundaries.test.ts` covers the exception and that it stays the only one.

`src/components/lesson/LessonPlayer.tsx` imports `getLessonPlayerData` with no
`eslint-disable` comment.
