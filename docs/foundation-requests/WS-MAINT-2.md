# WS-MAINT-2: the mock tutor continues another mode's script after a mode switch

- **From:** the C/I/D gate, 2026-10-16
- **Status:** closed. Landed by the foundation maintainer on 2026-10-16.
- **Frozen files concerned:** `src/lib/ai/providers/mock.ts`, `tests/unit/ai-mock-provider.test.ts`

## Problem

The mock provider (`AI_PROVIDER=mock`, the provider of every demo and review run) picked its
`first` or `next` tutor script from whether the transcript held any earlier tutor turn, in any
mode. A learner who asked a question in "Explain" and then switched to "Quiz me" got the quiz's
follow-up ("Thank you for your answer…") instead of its first question. The real provider is not
affected: the mode reaches the model in the system prompt.

## Change (landed)

- `src/lib/ai/providers/mock.ts`: `continuesMode(transcript, mode)` replaces
  `hasEarlierTutorTurn`. The tutor turns of the transcript are rebuilt (a turn spans several
  paragraphs), and each is matched to the script that wrote it by its body (compared with
  `normalizeForMatching` and without spaces, so the learner's device and `sanitizeUserText` do not
  defeat the match). The newest turn written by a mode's script decides: the same mode continues
  (`next`), another mode starts this one (`first`). A graded-work reply is skipped, and a turn the
  mock did not write (a hand-written transcript, a real model's turn) counts as this mode's, which
  keeps the earlier behaviour for those.
- `tests/unit/ai-mock-provider.test.ts`: two new cases. "Explain" then "Quiz me" asks the first
  question, the quiz then goes on ("Thank you for your answer"), and going back to "Explain" starts
  it again; and, in `en` and `fr`, every mode after a turn of every other mode gives exactly its
  opening reply (30 pairs per locale). The existing cases are unchanged and pass.

Checked in Chromium as student@demo on `/en/student/tutor`: "What is a model?" in Explain, then
Quiz me: "Let’s practise this topic, one question at a time. Question: an AI model was trained
only on photos taken in daylight…"; the next answer gets "Thank you for your answer. A strong
answer explains…".
