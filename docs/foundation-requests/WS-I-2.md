# WS-I-2: `next dev` writes learners' AI Lab prompts and session ID tokens to its log

- **From:** WS-I (AI Tutor + AI Lab; build spec 0, "Privacy in code"), 2026-10-16
- **Status:** open
- **Frozen files concerned:** `next.config.ts`, `docs/ARCHITECTURE.md` (2, the paragraph on
  `next dev` output before the `src/` tree)

## Problem

Next 16 logs every Server Function call during development, with its arguments
(`node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/logging.md`,
"Server Functions": "Server Function invocations are logged by default during development. You
can disable this by setting `logging.serverFunctions` to `false`."). `next.config.ts` sets no
`logging` option, so the dev server log holds, for example:

```
└─ ƒ runLabToolAction({"prompt":"Write a four-line poem about the moon for a 10-year-old.","toolId":"text"}) in 110ms src/actions/ai.ts
└─ ƒ createSessionAction({"idToken":"eyJhbGciOi…"})
```

That is the learner's own text (the AI Lab prompt; children type free text there, and only
`sanitizeUserText` stands between it and the provider, not between it and the log) and a
Firebase ID token that is valid for an hour. The rule WS-I works under says "Never log prompt
text, reply text, a learner's name, email or uid together with AI content", and 12 ("Monitoring":
"no personal data in logs") says the same for the platform. The same applies to the other
actions that carry learners' text or credentials: `submitWorkAction` (project text and
links), `submitQuizAttemptAction` (answers), `reviewSubmissionAction` (teacher feedback),
`completeSignupAction` and `joinClassSignupAction` (names, emails).

ARCHITECTURE.md 2 already records the behaviour as "development output only". It is not
written in production (`next start` does not log Server Function calls), but a dev log is
easily pasted into an issue, a chat or a CI artefact, and the demo, review and gate runs of
this project use `next dev` with real-looking data. WS-I cannot avoid it from its own code:
Next writes the line itself, around the call, from the serialised arguments.

## Wanted change

1. `next.config.ts`: add to `nextConfig`

   ```ts
   // Server Function arguments carry learners' text and session ID tokens: not in the dev
   // log either (no personal data in logs, ARCHITECTURE.md 8.1 and 12).
   logging: { serverFunctions: false },
   ```

   `LoggingConfig.serverFunctions?: boolean` exists in the installed Next
   (`node_modules/next/dist/server/config-shared.d.ts`). Incoming-request and fetch logging
   are unchanged (they log paths and URLs, not bodies), so a developer still sees each
   `POST /…` and its status.
2. `docs/ARCHITECTURE.md` 2: replace "`next dev` logs every server action call with its
   arguments, the ID token of `createSessionAction` included; that is development output
   only." with a sentence saying that Server Function logging is switched off in
   `next.config.ts` (`logging.serverFunctions: false`) because the arguments carry learners'
   text and session ID tokens (8.1 already keeps children's text out of the SDK's log).

## Workaround in place (WS-I)

None is possible in WS-I's paths: Next logs the arguments outside `runLabToolAction`.
WS-I's own code logs AI failures only through `describeAiFailure()` and never logs prompt or
reply text (`src/lib/ai/**`, `src/app/api/ai/tutor/route.ts`, `src/actions/ai.ts`). The tutor
uses a route handler, not a Server Function, so tutor messages are not in the log; only the
AI Lab prompt is.
