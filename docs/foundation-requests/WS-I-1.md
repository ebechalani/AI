# WS-I-1: the AI Tutor and AI Lab contract as WS-I builds it

- **From:** WS-I (AI Tutor + AI Lab, area core; build spec 6.1), 2026-10-15
- **Status:** closed. Landed by the foundation maintainer on 2026-10-15 (documentation only;
  no code, type, schema, index or catalog change).
- **Frozen files concerned:** `docs/ARCHITECTURE.md` (1.7, 3.7, 6.9, 8.1, 8.3, 8.6, 8.7, 10.4)

## Problem

Every function, constant and component WS-I needs exists. The document, however, did not
describe six things the way WS-I builds them:

1. **3.7 listed no reads for the two new screens.** 3.7 lets a repository issue only the
   shapes listed for each screen. `/student/tutor` and `/student/ai-lab(/[toolId])` reuse
   existing shapes (a direct school get, the Student Learn enrolment query, `getAll`
   courses), so those shapes had to be listed for these screens too.
2. **1.7 sent every `runLabToolAction` call through `checkAndCountAiUsage`.** 8.7 counts
   provider calls only, and the canned lab tools (status `mock` and `coming_soon`) make none.
   Counted, the demo tools would use up a child's 30 live Text AI tries a day.
3. **6.9 listed only 400, 401, 403 and 429 for `POST /api/ai/tutor`.** The handler needs a
   defined answer for a Firestore or session fault and a documented body cap.
4. **8.3 had drifted from the foundation code.** `GuardedTutorEvent['done']` was listed with
   `stopReason: AiStopReason | null`, `model: string | null`, `error: string | null`; the code
   has `AiStopReason`, `string` (`'unknown'` when the provider never reported) and `unknown`.
   `buildTutorRequest` takes an optional `signal` third parameter. 8.3 also left an open point
   to WS-I: keep reading after a blocked or cut reply, or abort.
5. **8.1 told the implementer to follow the SDK's documentation** without recording the
   chosen request shape, its limits or why the review deadline is what it is, so the
   integration gate's check of the real adapter was not reproducible.
6. **8.6 said the output list "refuses any reply containing a URL"**, which WS-I's tuning
   ("WS-I tunes the list") makes inexact.

## Change (landed)

`docs/ARCHITECTURE.md`:

- **3.7**, two new rows. "Student AI Tutor (`/student/tutor`)": `schools/{schoolId}` for the
  AI switch, only when the learner has a school; when the switch is on, also the Student Learn
  enrolment query (`enrollments` where `userUid == uid` order by `lastActivityAt desc`) →
  `getAll` courses, for the course selector; each message then costs the reads of the row
  "Tutor context". "AI Lab (`/student/ai-lab`, `/student/ai-lab/[toolId]`)":
  `schools/{schoolId}`, only with a school; `runLabToolAction` reads, for the live tool, what
  `checkAndCountAiUsage` reads (8.7), and for the canned tools `schools/{schoolId}` only.
- **1.7 (Lab line) and 10.4 (`runLabToolAction`)**: canned lab tools make no provider call,
  so `runLabToolAction` does not call `checkAndCountAiUsage` for them and they do not count
  against the 30 lab requests a day; the school switch is checked with `getSchool` instead
  (`settings.aiEnabled` off or the school missing → `forbidden`), so 8.6.3 still holds. 8.6.3
  and the 8.7 table say the same in one clause each.
- **6.9 (`POST /api/ai/tutor`)**: an unexpected server fault answers `500 { error: { code:
  'internal' } }`; a `429` also carries a `Retry-After` header with the same seconds; a body
  over 128 KiB, whether declared in `content-length` or counted while reading, answers
  `400 validation`; a course hidden from the caller answers `403 forbidden`, as 10.4 already
  said. The 10.4 note about the route's codes now points to 6.9 instead of repeating a list.
- **8.3**: `GuardedTutorEvent['done']` as implemented (`stopReason: AiStopReason`, `model:
  string`, `error: unknown`, with a comment on `NO_USAGE` and `'unknown'`);
  `buildTutorRequest(context, messages, signal?)`. Decision on the open point: the guard keeps
  reading after a blocked or cut reply (accurate usage; bounded by the provider cap at `low`
  effort); the provider call is aborted only when the client disconnects or the deadline
  passes, and the usage known by then is recorded.
- **8.1 (Anthropic adapter)**: the request shape. No `thinking` field; an explicit
  `output_config.effort` (`low` for tutor and lab, `medium` for review); the system prompt as
  one block with an ephemeral `cache_control`; the server-side refusal fallback (`betas:
  ['server-side-fallback-2026-07-01']`, `fallbacks: 'default'`) for the models that support
  it. `betaZodOutputFormat` sends enums and numeric bounds only as descriptions, so the zod
  re-validation is what enforces them. `ANTHROPIC_MODEL` must name a model that accepts
  `output_config.effort` (older models answer 400 on every call). The client is built with the
  key only (`authToken: null`) and `logLevel: 'warn'`. Whole-call deadlines: 50 s for tutor
  and lab, 100 s for review, which stays below the 2-minute review re-trigger.
- **8.6 (output list)**: the WS-I tuning. `http(s)://localhost` and `http(s)://127.0.0.1` are
  exempt from the URL ban for the scheme, host and port only, and the path is still checked;
  two groups are added (proposals to meet in person, requests for photos of the learner); no
  secrecy patterns are added.

Checked against the code at the time of landing: `src/lib/ai/tutor.ts` (`GuardedTutorEvent`,
`buildTutorRequest(context, messages, signal?)`, `guardTutorStream`'s `final` defaults
`NO_USAGE` / `'error'` / `'unknown'`), `src/lib/ai/lab.ts` (`'canned'` outcome with zero
usage), `src/lib/data/ai-usage.ts` (`checkAndCountAiUsage` refusal order of 8.7) and
`AI_LIMITS.reviewRetriggerAfterMs` (2 minutes, `src/lib/limits.ts`). The adapter, the safety
tuning and the route are WS-I's code (`lib/ai/**`, `app/api/ai/**`); their unit tests are
WS-I's.
