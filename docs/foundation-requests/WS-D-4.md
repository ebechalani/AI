# WS-D-4: "Approve" must grade with the suggestion the teacher saw

- **From:** WS-D (Projects + review; fix round after review), 2026-10-16
- **Status:** closed. Landed by the foundation maintainer on 2026-10-16, with `aiReviewId` optional
  (see "Change (landed)").
- **Frozen files concerned:** `src/types/inputs.ts` (`ReviewInput`),
  `src/lib/schemas/submission.ts` (`reviewInputSchema`), `src/lib/services/project-flow.ts`
  (`reviewSubmission`), `docs/ARCHITECTURE.md` (8.4 "`reviewSubmission` decision semantics",
  10.4 `reviewSubmissionAction`), `tests/unit/` (the `reviewSubmission` and schema tests)

## Problem

An `approve` copies the AI suggestion's criteria and overall score into the grade. The
service takes the suggestion that is newest when it handles the request, not the one the
teacher was looking at:

- `ReviewInput` and `reviewInputSchema` (`src/lib/schemas/submission.ts`, "Review") carry
  `submissionId`, `decision`, `criteria` and `feedback` only: nothing names a suggestion.
- `reviewSubmission` (`src/lib/services/project-flow.ts`, "Teacher review") reads
  `submission.latestAiReviewId` at decision time, approves that review, and records it as
  `NewReview.aiReviewId`.

Every teacher of a class may ask for a new suggestion (`regenerateAiReview`, up to
`AI_LIMITS.review.maxRegenerations`), and a class can have several teachers. So when a
co-teacher asks for a new suggestion while this teacher has the review screen open, "Approve"
records the new suggestion's score, while the form still says "Grade if you approve: {score}"
with the old one (`ReviewForm` reads `aiReview.overallSuggestedScore` from its own render).
The grade the student gets is not the one the teacher approved. It also contradicts
`TeacherReview.aiReviewId`, documented as "the suggestion the teacher was looking at".

WS-D cannot close the gap alone: the action's input is fixed by 10.4, and the schema strips
any field it does not list.

## Change wanted

1. `src/types/inputs.ts`, `ReviewInput`: add

   ```ts
   /** The AI suggestion shown to the teacher when they decided; null when none was shown. */
   aiReviewId: string | null;
   ```

2. `src/lib/schemas/submission.ts`, `reviewInputSchema`: add `aiReviewId: idSchema.nullable()`
   (AI review ids are Firestore auto-ids, so `ID_PATTERN`).

3. `src/lib/services/project-flow.ts`, `reviewSubmission`: for `approve`, throw
   `ConflictError` when `parsed.data.aiReviewId !== submission.latestAiReviewId` (before the
   suggestion is read). `modify` and `return` keep today's behaviour (the teacher's own scores,
   or feedback only, do not depend on which suggestion is newest), and `NewReview.aiReviewId`
   stays `submission.latestAiReviewId` for them.

4. `docs/ARCHITECTURE.md`: 10.4 `ReviewInput = { submissionId, decision, criteria, feedback,
   aiReviewId }`; 8.4 "`reviewSubmission` decision semantics": "`approve` ... is accepted only
   when `input.aiReviewId` is the submission's `latestAiReviewId` and that AI review is
   `ready`, ...".

5. Tests: the schema accepts `aiReviewId` null or an id and refuses a malformed one; an
   `approve` naming an older suggestion is a `ConflictError` and writes no review.

## WS-D follow-up once landed

`review-model.toReviewInput` gets `aiReviewId` and `use-review-submission` sends
`aiReview?.id ?? null` (the suggestion the form shows). The UI already handles `conflict`:
the panel shows "This work has changed: another teacher may have reviewed it, or the AI
suggestion changed." and the page is read again, so the teacher sees the new suggestion
before approving it. `tests/unit/ws-d-review.test.ts` and `tests/unit/actions-review.test.ts`
add the field to their inputs.

## Until then

The window is small (a co-teacher must regenerate while the page is open), and the form
itself now follows a new suggestion that arrives through a refresh of the page (it is seeded
again from it unless the teacher has changed the decision or the scores), so a teacher who
asked for the suggestion or pressed Check again approves what they see.

## Change (landed)

Landed by the foundation maintainer on 2026-10-16.

- `src/types/inputs.ts`: `ReviewInput.aiReviewId?: string | null` ("the AI suggestion shown to the
  teacher when they decided; null when none was shown"). It is **optional** rather than required:
  the emulator integration suite (`tests/integration/teacher.test.ts`) and any other caller of
  `reviewSubmission` keep working unchanged, and an input without it approves the latest suggestion
  as before. The review screen always sends it.
- `src/lib/schemas/submission.ts`: `aiReviewId: idSchema.nullable().optional()` (AI reviews have
  Firestore auto-ids); a malformed id is `{ aiReviewId: ['invalid'] }`.
- `src/lib/services/project-flow.ts`, `reviewSubmission`: for `approve`, when the input carries
  `aiReviewId` (an id or null) and it is not `submission.latestAiReviewId`, a `ConflictError` before
  any suggestion is read, so nothing is written. `modify` and `return` ignore it, and
  `NewReview.aiReviewId` stays `submission.latestAiReviewId` for all three.
- WS-D's review screen (`src/components/projects/`): `review-model.toReviewInput` takes and sends
  `aiReviewId`; `use-review-submission` takes `aiReviewId` (the suggestion the form shows) and sends
  it; `ReviewForm` passes `aiReview?.id ?? null`. A `conflict` already showed "This work has
  changed: another teacher may have reviewed it, or the AI suggestion changed." and refreshed the
  page, and the form seeds itself again from a new suggestion (unless the teacher changed the
  decision or the scores), so the teacher sees the new "Grade if you approve" before approving it.
- Tests: `tests/unit/schemas.test.ts` (null, an id, omitted; malformed ids refused),
  `tests/unit/services-project-flow.test.ts` (an approve naming an older suggestion, or null while
  one exists, is a `ConflictError` with no AI review read, no review and no audit written; naming the
  latest approves it; `modify` and `return` do not depend on it), `tests/unit/actions-review.test.ts`
  (the id reaches the service; a malformed one is a validation error),
  `tests/unit/ws-d-review.test.ts` (`toReviewInput` sends the id, and null).
- `docs/ARCHITECTURE.md`: the decision semantics are in 10.3 (the bullet "`reviewSubmission`
  decision semantics"; 8.4 has none) and 10.4 (`ReviewInput = { submissionId, decision, criteria,
  feedback, aiReviewId? }`).

Checked in Chromium as teacher@demo on Omar's seeded submission (approve allowed): the action's
request body is `{"submissionId":"demo-omar_p_my-first-ai-adventure_project-1_1","decision":"approve",
"criteria":null,"feedback":"…","aiReviewId":"q4XChK972fSu4wO56qhE"}`, the id the page shows. With
the id replaced by a stale one in flight, the server answered `conflict` and the panel showed the
conflict notice above the form; the submission is still `submitted` with the same
`latestAiReviewId` and no review (seeded state untouched; the browser never sent a real approve).
