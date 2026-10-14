# RoboHolic AI — Architecture

Engineering response to [PRODUCT_SPEC.md](PRODUCT_SPEC.md). This document is two things:

1. The Step 1 deliverable from section 28 of the brief (architecture, folder structure, data
   model, roles/permissions, routes, MVP plan).
2. The **build contract**. Implementation is split across parallel workstreams that do not
   talk to each other. Every collection path, field name, route path, file path and exported
   function name below is binding. If something must change, change this document first.

Conventions used in this document:

- "MUST" marks a rule that other workstreams depend on.
- "Future" marks something deliberately left out of the MVP; the design leaves room for it
  but nobody builds it now.
- Code blocks are contracts (shapes and signatures), not implementations.

Contents: 1 System architecture · 2 Folder structure · 3 Firestore data model · 4 Roles and
permissions · 5 Security Rules plan · 6 Routes · 7 Component architecture · 8 AI layer ·
9 Gamification · 10 Shared contracts · 11 Parallel build plan · 12 Gaps in the brief

---

## 1. System architecture

### 1.1 Stack (fixed)

| Concern | Choice |
|---|---|
| Framework | Next.js 16.3.x App Router, React 19, TypeScript `strict` |
| Styling | Tailwind CSS v4 (CSS-first `@theme` in `src/app/globals.css`, no `tailwind.config.*`) |
| i18n | next-intl 4.x, `[locale]` segment, `localePrefix: 'always'` |
| Client SDK | `firebase` 12.x — **Auth and Storage only**. `firebase/firestore` is banned in `src/` by ESLint |
| Server SDK | `firebase-admin` 14.x, used only under `src/lib/**` and `scripts/**` |
| Validation | `zod` for every server action input, route handler body and env parsing |
| Icons | `lucide-react` |
| Backend | Firebase Authentication, Cloud Firestore (Native mode), Cloud Storage, Security Rules. No Cloud Functions |
| Hosting | Vercel (Node.js runtime for everything; no Edge runtime) |
| Package manager | npm |

Allowed additional dependencies (nothing else without amending this document):
`server-only`, `clsx`, `react-markdown` + `remark-gfm` + `rehype-sanitize` (lesson rich text),
`@anthropic-ai/sdk` (the one real AI adapter). Dev: `typescript`, `@types/node`,
`@types/react`, `@types/react-dom`, `tailwindcss`, `@tailwindcss/postcss`,
`firebase-tools`, `tsx`, `vitest`, `@firebase/rules-unit-testing`, `eslint`,
`eslint-config-next`, `prettier`.

Every one of these is installed by F1; no later step edits the dependency lists in
`package.json`. Two are held one major behind the newest release on purpose: `typescript`
at 6.0.x (the `typescript-eslint` bundled in `eslint-config-next` 16.3 supports
`< 6.1`) and `eslint` at 9.x (`eslint-plugin-import`, `-react` and `-jsx-a11y`, also
bundled, do not support ESLint 10 yet). `@types/node` follows the Node 24 runtime.

### 1.2 Layers

```
Browser
  React client components  ── call ──▶ server actions (src/actions/*)
  Firebase Auth client SDK (sign-in, in-memory only)   │
  Firebase Storage client SDK (direct upload)          │
                                                       ▼
Next.js server (Vercel, Node runtime)
  src/proxy.ts            locale routing + optimistic "has session cookie" gate
  app/[locale]/**         server components: requireRole() → repositories/services → render
  src/actions/*           'use server': zod parse → session → service/repository → ActionResult
  app/api/**              two route handlers: AI tutor stream, file download
  src/lib/services/*      use cases that span repositories (complete lesson, grade quiz, review…)
  src/lib/gamification/*  XP, levels, badges, certificates (server-only, internal)
  src/lib/ai/*            provider abstraction, tutor, grading (server-only)
  src/lib/data/*          repositories: the ONLY code that touches Firestore (Admin SDK)
  src/lib/auth/*          session cookie, Actor, authorization helpers
  src/lib/firebase/*      lazy Admin/client SDK initialisation, storage helpers
  src/lib/schemas/*       zod schemas shared by client forms, actions and repositories
  src/lib/limits.ts       shared constants: AI, upload, rate and content limits
                                                       ▼
Firebase
  Authentication · Firestore · Storage · Security Rules (deny-by-default, defense in depth)
```

Dependency direction (MUST, enforced by an import-boundary lint rule):

- `app` / `actions` → `services`, `data` (reads), `schemas`, `types`. They never import
  `gamification/{award,certificates,events}`, `services/identity` or `SYSTEM_ACTOR` (ESLint
  `no-restricted-imports`, sections 1.6 and 9).
- `services` → `data`, `gamification`, `ai`, `auth`, `firebase`. Among services,
  `provisioning` and `classroom` both import `identity`; `provisioning` imports `classroom`;
  no service imports `provisioning`.
- `gamification` → `data`, plus `firebase/collections` for `docIds` (the deterministic
  certificate id).
- `data` → `firebase`, `auth/actor`, `auth/authz`, `schemas`, `limits`, `types`.
- `auth/session.ts` and `auth/claims.ts` are the only files under `auth` that import from
  `data`, and only `data/users` (`loadProfileForSession`). `auth/authz.ts`, `auth/actor.ts`,
  `auth/roles.ts`, `auth/account-policy.ts` import no data.
- `ai` depends on nothing but `env`, `limits` and `types` (it receives plain context objects;
  it never reads Firestore).
- `schemas`, `limits`, `types` import nothing but each other, `zod`, and the two constant
  lists they are derived from: `i18n/config` (`LOCALES`, section 10.1) and `avatars`
  (`AVATAR_IDS`). Those two files import nothing.
- Nothing in `lib` imports from `app`, `actions` or `components`, with one exception: the
  client module `lib/auth/client.ts` calls the server action `getClientAuthTokenAction` from
  `actions/session.ts` (a foundation-owned file).

How the lint rule reads this list (`roboholic/import-boundaries`, defined in
`eslint.config.mjs`; it resolves `@/…` and relative specifiers, so both spellings are
checked, and it covers `import`, `export … from`, `import()` and `import('…')` types):

- The two "nothing but" bullets (`ai`; `schemas`/`limits`/`types`) are closed allow-lists.
  For `schemas`/`limits`/`types` the only package allowed is `zod`.
- Every other bullet is enforced as direction: an import that points up the stack or closes
  a cycle is an error. `lib`/`types` → `app`, `actions`, `components`; `actions` → `app`,
  `components`; any service → `provisioning`; `gamification` → `services`; `data` →
  `services`, `gamification/{award,certificates,events}`, `auth/{session,claims,client}`;
  `auth` → `data` (except `session.ts`/`claims.ts` → `data/users`), `services`,
  `gamification/{award,certificates,events}`; `firebase` → `data`, `services`,
  `gamification/{award,certificates,events}`. Shared leaf modules (`errors`, `env`, `utils`,
  `limits`, `schemas`, `types`, and the files marked "shared" in section 2) may be imported
  from any layer.
- The component rules of section 7.1 are part of the same rule: `components` never import
  `app`, `lib/data` or `lib/services`; `components/ui` imports no other component folder,
  `components/domain` only `ui`, `components/layout` only `ui` and `domain`.

The banned imports (the F1 row of section 11.1) are a separate mechanism with the same
reach: core `no-restricted-imports` reads `import` and `export … from` only, so
`roboholic/banned-dynamic-imports` applies the same lists to `import()` and `import('…')`
types. A dynamic import does not say which names it uses, so in `src/actions`, `src/app` and
`src/components` it may not load `lib/auth/actor` at all (the static ban is on the name
`SYSTEM_ACTOR` alone).

### 1.3 Request flow: server-rendered page

1. `src/proxy.ts` runs next-intl's middleware (locale detection, redirect `/` → `/en`). It
   exports `config = { matcher: '/((?!api|_next|_vercel|.*\\..*).*)' }`, so route handlers
   under `/api`, Next internals and static files are never locale-redirected. For paths under
   `/{locale}/(student|teacher|school|admin|certificates|preview)` it redirects to
   `/{locale}/login?next=<locale-less path>` when the `__session` cookie is absent. This is a
   UX shortcut only; it verifies nothing. `next` is the path alone (`/teacher/classes/abc`):
   the query string of the original request is dropped, so `safeNextPath` only ever has to
   judge a path. A path without a locale prefix (`/student/learn`) is first redirected to its
   prefixed form by next-intl and gated on that second request. The locale is detected from
   the URL prefix, then the `NEXT_LOCALE` cookie (a session cookie next-intl sets when the
   visitor's locale differs from the browser's), then `Accept-Language`, then `en`.
2. The area layout (`app/[locale]/student/layout.tsx` etc.) calls `requireRole(...)`.
3. **Every `page.tsx` under a role area also calls `requireRole(...)` as its first
   statement** (layouts do not re-run on client navigation, so the layout guard alone is not
   sufficient). `requireRole` returns a `Session` or redirects.
4. The page calls repository/service functions, passing the `Session` as the `actor`
   argument. The repository authorizes, queries Firestore with the Admin SDK, converts
   documents to domain types (Timestamps → ISO strings) and returns them.
5. The page renders server components and passes plain serializable props to client
   components. No Firestore types cross the server/client boundary.

The `next` parameter is never trusted. `safeNextPath(next, role)` in `src/lib/auth/roles.ts`
accepts it only when it matches `^/[A-Za-z0-9/._~-]*$` (so no query string, fragment,
percent-encoding, `@`, `:`, backslash, scheme or control character), has no empty, `.` or
`..` segment (no `//`, no trailing slash), and is `roleHome(role)` itself or a path below it,
or a path **below** `/certificates/` or `/preview/` (the bare shared roots have no page and
are refused); anything else becomes `roleHome(role)`. The login page and `establishSession`
both use it, so the login page cannot be turned into an open redirect. `roles.ts` also
exports `STAFF_ROLES` and `isStaffRole(role)`.

All pages that read Firestore are dynamically rendered (they call `cookies()` through
`getSession()`, or export `dynamic = 'force-dynamic'` for the public catalog pages). There is
no data fetching at build time, so `next build` succeeds with no Firebase credentials.
Per-request deduplication uses React `cache()`. There is no cross-request cache in the MVP;
`getCourseOutline` and `listBlocks` are the two functions to wrap first if read volume ever
requires one (section 12).

HTTP status of a missing page: `[locale]/[...rest]/page.tsx` calls `notFound()` with no
`loading.tsx` between it and `[locale]/layout.tsx`, so an unknown URL answers 404 with the
locale's not-found page (there is deliberately no `[locale]/loading.tsx`; every route group
and area has its own). A `notFound()` thrown inside a group or area page streams behind that
group's `loading.tsx` boundary and answers 200 with the not-found body and a `noindex` meta
tag, because Next fixes the status once streaming has started; a real 404 for a missing
resource would need the check in `proxy.ts`, which the MVP does not do.

### 1.4 Request flow: server action

```
client component ──▶ someAction(input)
  runAction(schema, input, handler, { roles })
    1. zod-parse input                      → fail('validation', { fieldErrors })
    2. session = await getSession()         → fail('unauthenticated')
       non-student sessions are re-verified with verifySessionCookie(cookie, true), so a
       password reset or token revocation done on the Firebase side is honoured on every
       staff mutation
    3. role check against options.roles     → fail('forbidden')
    4. handler(data, session, { locale })   → calls services/repositories (which authorize again
                                              at the resource level and throw AppError)
    5. map AppError → ActionResult error code; unknown errors → 'internal' (logged, not leaked)
  ◀── ActionResult<T>   (never throws to the client)
```

- Step 1 runs the schema through `parseInput` (`src/lib/schemas/common.ts`, section 10.1).
  `fieldErrors` is keyed by the dot-joined path of the field (`translations.en.title`,
  `questions.0.options`); a problem with the input as a whole is under `_form`
  (`FORM_ERROR_KEY`). A schema's cross-field rules (`superRefine`) run once every field is
  valid on its own, so one response may not list every problem.
- Step 2 reaches the session through `src/lib/actions/session-source.ts`, the only file in
  `lib/actions` that touches the auth layer: it re-exports `getSession` and
  `assertSessionNotRevoked` from `auth/session.ts` (before F4's hand-over, section 11.1, it
  answers "no session", so every non-anonymous action fails closed). Unit tests of
  `runAction` mock that one module.
- `locale` in step 4 is `await getLocale()` from `next-intl/server` (the locale of the page
  the action was called from). It is never read from the client payload and never from
  `session.locale` (the stored preference can lag behind the URL).
- Step 5 has one exception to "never throws": the control-flow errors that Next.js itself
  throws (`redirect()`, `notFound()`) are passed on with `unstable_rethrow`, since turning
  them into `internal` would break the navigation they stand for. A `ValidationError` thrown
  by a service carries its own `fieldErrors`; a `RateLimitError` carries `retryAfterSeconds`.
- **Refresh convention (MUST)**: actions do not call `revalidatePath` for individual routes
  (they would have to know other workstreams' routes). After a successful action the calling
  client container calls `router.refresh()`. Since every data page is dynamically rendered,
  that is sufficient.
- Server actions are the only mutation path. Next.js checks the `Origin` header on server
  actions, which together with the `SameSite=Lax` cookie is the CSRF defense.
  `POST /api/ai/tutor` performs the same check itself: `Origin` MUST be present and equal to
  the request host, otherwise `403`. `GET /api/files/[fileId]` does **not** check `Origin`
  (browsers do not send it on same-origin navigations, `<img>`, `<video>` or `<a href>`); it
  is a read with no side effects, protected by the `SameSite=Lax` cookie and the resource
  authorization, and it answers with `Cache-Control: private, no-store` and
  `Referrer-Policy: no-referrer`.

### 1.5 Auth and session flow

**Sign-in and session**

- **Sign in** (client): `signInWithIdentifier(identifier, password)` returns a fresh ID
  token → `createSessionAction({ idToken, next })`. The Firebase Auth client is
  initialised with `inMemoryPersistence`: nothing is written to IndexedDB or localStorage, so
  no Firebase client session survives a tab close on a shared classroom computer.
- **`createSessionAction`** is a thin wrapper around
  `services/provisioning.establishSession(idToken, next)`, which runs these checks in this
  order: `verifyIdToken(idToken, true)` (`auth/argument-error`, `auth/id-token-expired`,
  `auth/id-token-revoked`, `auth/user-not-found` → `UnauthenticatedError`;
  `auth/user-disabled` → `ForbiddenError`; any other failure is a server fault and is
  rethrown); rejects with `UnauthenticatedError` if `auth_time` is older than 5 minutes; loads
  `users/{uid}` as the system and rejects if missing (`AppError('profile_missing')`) or
  `status !== 'active'` (`ForbiddenError`); **rejects with `AppError('email_unverified')`
  when the account is an email account (token email absent or not ending in
  `STUDENT_EMAIL_DOMAIN`, see `isUsernameAccountEmail`) and the token's `email_verified` is
  not `true`**; rejects with `UnauthenticatedError` when `auth_time` is earlier than
  `users.sessionsValidAfter` (the cookie would be refused on the next request anyway); calls
  `syncClaims(uid)` if the token's top-level string claims `role` / `schoolId` (absent =
  null) differ from the profile; updates `lastLoginAt`; creates the session cookie
  (`setSessionCookie(idToken, role)`); returns `{ redirectTo: safeNextPath(next, role) }`.
- **Cookie**: `__session`, `httpOnly`, `secure` in production, `sameSite: 'lax'`,
  `path: '/'`. Lifetime depends on the role (`SESSION_LIFETIME` in `auth/session.ts`):
  **students** get a Firebase session cookie valid 12 hours, set as a browser-session cookie
  (no `Max-Age`/`Expires`, so it disappears when the browser closes); **staff** (teacher,
  school admin, platform admin) get 24 hours with a matching `Max-Age`.
- **Every request**: `getSession()` = `verifySessionCookie(cookie)` (signature and expiry,
  local) + one read of `users/{uid}` (React-`cache`d per request; `getSession` is exported as
  a `cache()`-wrapped const). It answers `null` only for a missing or empty cookie, a cookie
  Firebase refuses (`auth/argument-error`, `auth/session-cookie-expired`,
  `auth/session-cookie-revoked`, `auth/user-disabled`, `auth/user-not-found`), a missing
  profile, `status !== 'active'`, or a cookie whose `auth_time` is earlier than
  `users.sessionsValidAfter` (compared as `auth_time * 1000 < Date.parse(sessionsValidAfter)`,
  so a cookie whose `auth_time` equals the stored second is still accepted). Any other failure
  (missing server env, the emulator guard, an unreachable emulator) is thrown, never turned
  into `null`; `assertSessionNotRevoked()` behaves the same way. firebase-admin reports a
  failure to fetch Google's public signing keys as `auth/argument-error`, so during such an
  outage the user appears signed out (fails closed). Role, `schoolId`, `classIds`, `status`
  come from the **profile document**, never from the cookie's embedded claims. A disabled user
  or a changed role therefore takes effect on the next request.
- **Session invalidation**: `services/identity.invalidateSessions(uid)` sets
  `users.sessionsValidAfter = now` (whole seconds) and calls `revokeRefreshTokens(uid)`. It
  is called by: sign-out (all devices of that user), `resetStudentPassword`,
  `changeUserRole`, `setUserStatus(…, 'disabled')`, and `delete-user-data`. A stolen or
  left-behind cookie is therefore dead as soon as the password is reset or the user signs
  out anywhere. Password resets done through Firebase's own email flow revoke refresh tokens
  on the Firebase side; step 2 of `runAction` (revocation-checked verification for staff)
  covers that case for every mutation.
- **Sign out**: client `signOutClient()` + `signOutAction()` →
  `provisioning.endSession(actor)`, which calls `invalidateSessions(uid)` first and clears the
  cookie second (a failed invalidation leaves the cookie, so the user can sign out again).
  `signOutAction` answers `ok(null)` and clears the `__session` cookie even when `runAction`
  finds no valid session (no cookie, expired or revoked): the proxy treats the mere presence
  of the cookie as signed in, so a dead cookie must still be removed, and signing out twice is
  not an error. The student shell always shows the signed-in display name next to a one-click
  sign-out (section 7.5), which does a full page load of `/login` after the action succeeds,
  so nothing of the previous user stays in memory on a shared computer.
- **Custom claims** `{ role, schoolId }` are a cache of the profile, written only by
  `syncClaims`. In the MVP nothing security-relevant depends on their freshness: the Next.js
  server reads the profile, and the Security Rules read the profile document too (section
  5). They are kept in sync for future client-side features.
- **Identity changes**: every write of `users.role`, `users.schoolId` or `users.status` goes
  through one function, `services/identity.applyIdentityChange` (called by
  `provisioning.changeUserRole`, `provisioning.setUserStatus` and by `services/classroom`
  when a student is attached to or detached from a school). It always calls
  `syncClaims(uid)`. A role change and disabling also call `invalidateSessions`; re-enabling
  an account does not (the disable already ended every session and nothing live exists to
  invalidate). A student
  gaining or losing a school through class membership does **not** invalidate sessions
  (nothing the old session could do becomes unsafe, and the join would otherwise sign the
  student out mid-flow).
- **Client auth for uploads**: direct Storage uploads need `request.auth`. Because client
  auth state is in memory only, `ensureClientAuth(options?: { force?: boolean })`
  (`src/lib/auth/client.ts`) runs before every upload: when `auth.currentUser` is null (or
  `force` is set) it calls `getClientAuthTokenAction()` (server: session →
  `createCustomToken(uid)`) and `signInWithCustomToken`. On a Storage `permission-denied`,
  `uploadFile` calls it once with `force: true` and retries; if the server session is gone it
  surfaces `unauthenticated` and the caller sends the user to `/login`. The Firebase Auth
  client is used for nothing else. Every function of `auth/client.ts` fails with an
  `AppError` (`unauthenticated` for wrong credentials, `forbidden` for a disabled account,
  `rate_limited`, `conflict` for an existing email, `validation` with `fieldErrors.email` /
  `fieldErrors.password`, `internal` otherwise); `sendPasswordReset` sends nothing for an
  address in `STUDENT_EMAIL_DOMAIN` and resolves silently on `auth/user-not-found`;
  `signOutClient` never throws.
- **School-provisioned students have no email.** They get a `username`; the Auth account
  uses the synthetic address `{username}@student.roboholic.invalid`
  (`STUDENT_EMAIL_DOMAIN`). The login form accepts "email or username" and appends the
  domain when there is no `@`. `.invalid` is a reserved TLD, so no mail can ever be sent.

**Account creation paths**

1. **Self sign-up** (`/signup`): a student aged 13+ or a teacher, with email. The client
   creates the Auth user, then calls `completeSignupAction`, then `sendVerificationEmail()`
   and shows `/verify-email`. No session exists until the address is verified.
   `provisioning.completeSignup` is **create-only**: in this order it parses the input
   (`signupInputSchema`), consumes the `signup` rate limit, verifies the token
   (`verifyIdToken(idToken, false)`: no revocation check and no 5-minute rule, the browser has
   just created the user), then writes `users/{uid}` with Firestore `create()` and fails with
   `conflict` if the profile exists; it rejects with `forbidden` a token with no email or
   whose email ends in `STUDENT_EMAIL_DOMAIN`; the token's email is trimmed and lower-cased
   before it is stored; the zod schema allows `role: 'student'` only with `ageBand` in
   `13-15 | 16-18 | adult` and forces `ageBand: 'adult'` for `role: 'teacher'`.
   `consentBasis` (`adult` for a teacher or an adult student, else `self_13_plus`),
   `schoolId: null`, `classIds: []`, `verifiedEducator: false`, XP and stats are set by the
   server, never taken from the input; `syncClaims(uid)` runs once the profile exists. The
   Auth user is never deleted on failure (it belongs to the person who signed up; a repeated
   call fails with `conflict` and changes nothing). Self sign-up can only yield `student` or
   `teacher` with `schoolId: null`.
2. **Join with class code** (`/join`, not signed in): the server creates a username account
   in that class (`provisioning.signUpWithJoinCode`).
3. **Staff add students to a class** (bulk, `provisioning.provisionStudents`): same account
   type, initiated by a teacher or school admin; generated credentials are shown once.
4. **A signed-in student joins a class by code** (`classroom.joinClassWithCode`): no account
   is created.
5. **School admin creates a teacher** (email). `provisioning.createTeacher` fails with
   `conflict` when an Auth user with that email already exists (an existing account is never
   adopted). The Auth user is created with email and display name only: no password, and
   `emailVerified` left false (the reset link proves the address; should Firebase not mark it
   verified when the link is used, `establishSession` answers `email_unverified` and the login
   page's verification path recovers). After the action succeeds, the calling client component calls
   `sendPasswordReset(email)` (the Firebase client SDK sends the mail; the Admin SDK cannot),
   and shows a confirmation. With the emulator the link appears in the Auth emulator log.
6. **Platform admin creates a school and its first school admin** (email): same rules and
   the same reset-email step as 5.
7. **The first platform admin**: `npm run admin:bootstrap -- <email>`. If no Auth user has
   that email the script creates one and prints a password-reset link. If one exists it must
   have `emailVerified === true`, otherwise the script refuses; it then revokes the user's
   refresh tokens and sets `sessionsValidAfter`, so a session created before the promotion
   cannot inherit the new role. The script cannot import `services/provisioning` (section
   2), so it promotes with `classes.removeUserFromAllClasses`,
   `identity.applyIdentityChange({ role: 'platform_admin', schoolId: null }, { invalidateSessions: true })`
   and `audit.writeAudit('user.role_changed')`, and refuses a teacher who still owns a
   class. The reset link comes from `getAdminAuth().generatePasswordResetLink`, which on a
   real project needs the Auth email action settings; otherwise the script warns and the
   new admin uses "Forgot password" on the login page.

**Who may create accounts for children** (`studentAccountPolicy` in
`src/lib/auth/account-policy.ts`, applied by paths 2 and 3 and unit-tested):

| Class | Username accounts (paths 2, 3) | Age bands | `consentBasis` (derived on the server) |
|---|---|---|---|
| Belongs to a school with `status: 'active'` | Allowed | Any | `school` |
| No school, owner has `verifiedEducator: true` | Allowed | `13-15`, `16-18`, `adult` only | `self_13_plus` / `adult` |
| No school, owner not verified | **Refused** (`forbidden`) | — | — |

A self-registered teacher therefore cannot create accounts for children, and nobody can
create an under-13 account outside an active school. Until a platform admin sets
`verifiedEducator`, a school-less teacher can still create classes, author courses, take
Teacher Academy courses, and be joined (path 4) by students who already own a verified 13+
account. Path 4 refuses a student whose `schoolId` is set and differs from the class's
`schoolId` (so a school's pupils cannot be pulled into an outside class), and sets the
student's `schoolId` only when it was null and the class has a school. Path 4 applies no
account policy and does not look at the school's `status`: a signed-in student may join a
class of a suspended school and is then attached to it and counted in
`schools.counts.students` (the table above governs account creation only; refusing path 4
for a suspended school would be one `school.status === 'active'` check in
`classroom.resolveJoinCode`, which would also make `lookupJoinCode` answer not-found instead
of `accountCreation: false`).

### 1.6 Where authorization is enforced

| Layer | What it does | Trust level |
|---|---|---|
| `proxy.ts` | Redirects when no cookie | None (UX only) |
| Layout + page `requireRole` | Coarse role gate per area | Real |
| `runAction` `roles` option | Coarse role gate per action (section 10.4 lists the roles of every action) | Real |
| **Repository / service functions** | Resource-level checks through `src/lib/auth/authz.ts` on every call (ownership, class, school) | **Authoritative** |
| Firestore / Storage Security Rules | Deny-by-default; no client writes to Firestore at all | Defense in depth |

Rule (MUST): every exported function in `src/lib/data/*` and `src/lib/services/*` takes
`actor: Actor` as its first parameter and authorizes before reading or writing. The only
exceptions (marked † in section 10) are functions whose name starts with `listPublished` /
`getPublished` (anonymous catalog reads that return only published official content),
`getCertificateByCode` (public verification, returns a redacted shape), and the pre-session
entry points (`establishSession`, `completeSignup`, `lookupJoinCode`, `signUpWithJoinCode`),
which authenticate their caller by ID token or rate-limit it by client key. Internal helpers
that take no actor are called only by services that have already authorized; the lint rule
below keeps them out of request-handling code. They are: everything in `services/identity`
(`applyIdentityChange`, `invalidateSessions` and the pure `countedIn`);
`classroom.resolveClassContext`, `classroom.resolveJoinCode`,
`classroom.studentAccountContext` and the pure `classroom.pickSupervisingClass`;
`project-flow.generateAiReview`; everything in `gamification`; the pure
`access.licenseCovers` / `access.subscriptionCovers`; the private helper modules
`data/internal-identity.ts`, `data/internal-content.ts`, `services/internal-common.ts` and
`services/internal-credentials.ts` (imported only inside their own folder); the pure
projections `quizzes.isAttemptRevealed` / `toStudentAttempt`, `files.toFileRef` /
`toMediaRef` and everything in `data/course-derive.ts`. `data/ai-usage` takes the usage
`subject` and `data/rate-limit` a client key instead of an actor (section 10.2).

System work (gamification, AI review, seed) passes `SYSTEM_ACTOR`. `SYSTEM_ACTOR` passes
every predicate, so it MUST NOT be reachable from request-handling code: an ESLint
`no-restricted-imports` rule forbids importing it in `src/actions/**`, `src/app/**` and
`src/components/**`, and every repository function documented as "system only" starts with
`assertSystem(actor)`.

### 1.7 How AI calls flow

```
Tutor:   TutorPanel (client) ─POST /api/ai/tutor─▶ route handler
           Origin check → getSession() (401 JSON, no redirect) → role in {student, teacher} (403)
           → zod-parse TutorRequest (400)
           → checkAndCountAiUsage(session, 'tutor')   (school switch, per-user limits, token
                                                       cap, school and global budgets; 429)
           → services/tutor-context.buildTutorContext(actor, …)   (authorized reads; no PII)
           → lib/ai/tutor.streamTutorReply(context, messages)     (policy prompt + provider)
           → lib/ai/tutor.guardTutorStream(stream, ageBand)       (buffering + checkOutput; 8.3)
           → NDJSON event stream (toTutorStreamEvent, encodeTutorEvent) → recordAiTokens
Review:  submitWorkAction → services/project-flow.submitWork → after(() => generateAiReview(id))
           → checkAndCountAiUsage(student, 'review')  (not allowed → aiReviewStatus 'skipped')
           → lib/ai/grading.suggestReview(input) → submissions/{id}/aiReviews/{id}
           a review still 'pending' after 2 minutes is re-triggered when the submission is read
           (data/submissions.setAiReviewPending counts each re-trigger; the first run is free)
Lab:     runLabToolAction (students only) → checkAndCountAiUsage(session, 'lab')
           → lib/ai/lab.runLabToolWithReport(toolId, input, ctx)  (result + usage + outcome; 8.5)
```

`lib/ai/index.ts#getAiProvider()` returns the mock provider unless `AI_PROVIDER=anthropic`
and `ANTHROPIC_API_KEY` are set. API keys exist only in server env. Details in section 8.

### 1.8 Environment variables

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_APP_ID` | client | Firebase web config (not secrets) |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` | client | `"true"` connects Auth and Storage clients to the emulators |
| `NEXT_PUBLIC_APP_URL` | client | Canonical origin (certificate verify links) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | client | Address behind the "For Schools" contact button; the button is hidden when unset |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET` | server | Admin SDK service account |
| `FIRESTORE_EMULATOR_HOST`, `FIREBASE_AUTH_EMULATOR_HOST`, `FIREBASE_STORAGE_EMULATOR_HOST` | server | Presence switches the Admin SDK to the emulators (project id `demo-roboholic`) |
| `RATE_LIMIT_SECRET` | server | HMAC key used to hash client IP addresses for rate-limit counters (no raw IP is stored). Required outside the emulator |
| `AI_PROVIDER` | server | `mock` (default) or `anthropic` |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | server | Real adapter; model defaults to `claude-opus-5-5` |
| `AI_DAILY_TOKEN_BUDGET` | server | Optional override of the platform-wide daily AI token budget (section 8.7) |
| `SEED_DEMO_PASSWORD` | scripts | Password for demo accounts created by the seed (section 11.6) |

`src/lib/env.ts` validates lazily (`getServerEnv()` is called inside functions, never at
module top level), so importing any module with no env present does not throw.

```ts
// src/lib/env.ts (shared: no 'server-only', because getPublicEnv() and isEmulator() run in the browser)
export interface FirebaseWebConfig { apiKey: string; authDomain: string; projectId: string; storageBucket: string; appId: string }
export interface PublicEnv {
  firebase: FirebaseWebConfig | null;      // null while any of the five web-config variables is missing
  useEmulators: boolean;                   // NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true'
  appUrl: string;                          // no trailing slash; 'http://localhost:3000' when unset
  contactEmail: string | null;
}
export interface AiEnv { provider: 'mock' | 'anthropic'; anthropicApiKey: string | null; anthropicModel: string; dailyTokenBudget: number }
export interface ServerEnv {
  isEmulator: boolean;
  firebase: { projectId: string; clientEmail: string | null; privateKey: string | null; storageBucket: string };
                                           // emulator: clientEmail and privateKey are null, projectId defaults to
                                           // 'demo-roboholic', storageBucket to `${projectId}.appspot.com`
  rateLimitSecret: string;                 // ≥ 16 characters; a fixed placeholder on the emulator
  ai: AiEnv;
}
export function getPublicEnv(): PublicEnv;               // never fails on an absent variable, only on a malformed one
export function getFirebaseWebConfig(): FirebaseWebConfig;   // throws when the web config is incomplete (client SDK init)
export function getAiEnv(): AiEnv;                       // the AI variables alone: `lib/ai` needs no Firebase credentials
export function getServerEnv(): ServerEnv;               // throws naming the missing or malformed variables, never their values
export function isEmulator(): boolean;                   // works on both sides; validates nothing
```

An empty value (`NAME=`) counts as unset. `FIREBASE_PRIVATE_KEY` may be stored on one line
with literal `\n` and surrounding quotes; `getServerEnv()` restores the line breaks.
`getAiProvider()` reads `getAiEnv()`, so the mock provider works with no Firebase variables.

**Emulator guard (MUST)**: with `FIREBASE_AUTH_EMULATOR_HOST` set, the Admin SDK accepts
unsigned tokens. `getServerEnv()` therefore throws when any `*_EMULATOR_HOST` variable is set
and either the process runs on Vercel (`VERCEL` is set, any environment) or the project id
does not start with `demo-`. A unit test covers both branches (`tests/unit/env.test.ts`).

---

## 2. Folder structure

Repository root:

```
.
├─ docs/                         PRODUCT_SPEC.md, ARCHITECTURE.md
├─ public/                       favicon.ico, icon.svg (foundation); marketing/** (WS-A imagery)
├─ firebase.json                 emulators (auth 9099, firestore 8080, storage 9199, ui 4000) + rules/index paths
├─ .firebaserc                   default project alias: demo-roboholic
├─ firestore.rules
├─ firestore.indexes.json        composite indexes + single-field exemptions (section 3.8)
├─ storage.rules
├─ scripts/
│  ├─ lib/admin.ts               Admin SDK init for scripts (emulator or real project), target selection, option parsing, runScript()
│  ├─ lib/firestore.ts           upsertDocuments() (keeps createdAt), deleteMatching(), deleteTree(), ifFound()
│  ├─ migrate.ts                 runs scripts/migrations/* in order, records in meta/migrations; --rerun applies recorded ones again
│  ├─ migrations/
│  │  └─ 0001_initial.ts         reference data: pathways, badges, hardware platforms (their ONLY source)
│  ├─ seed/
│  │  ├─ index.ts                seed runner (idempotent upserts by stable id); imports ./content
│  │  ├─ types.ts                SeedCourse, SeedModule, SeedLesson, SeedBlock, SeedQuiz, SeedProject, SeedChallenge
│  │  ├─ demo-users.ts           demo school, licence, class and accounts as data; password rules (section 11.6)
│  │  ├─ demo-progress.ts        the learners' progress of 11.6, written through the services as the learners and the teacher
│  │  ├─ validate.ts             pure content checks shared by the runner and tests/unit/seed-content.test.ts (the WS-K rules of 11.2)
│  │  └─ content/                index.ts (barrel: SEED_COURSES, SEED_CHALLENGES) + one file per demo course + challenges.ts
│  ├─ bootstrap-admin.ts         create or promote the first platform_admin (section 1.5, path 7)
│  ├─ delete-user-data.ts        erase one user's account, records and files (section 12)
│  ├─ cleanup-uploads.ts         delete unregistered or unattached Storage objects and expired rate-limit docs
│  ├─ smoke-queries.ts           runs every repository list function against a real project (index check)
│  └─ check-messages.ts          fails when the catalogs of two locales differ (a namespace file or a key present in one only)
├─ tests/
│  ├─ rules/                     firestore.rules.test.ts, storage.rules.test.ts, helpers.ts (PROFILES fixture, ACTORS,
│  │                             startRulesEnvironment, contextFor, seedProfiles; shared by both files)
│  ├─ unit/                      env (env guard, lazy Admin/client init, storage paths, getClientKey), schemas, run-action, utils
│  │                             (F3/F4); authz, account-policy (F4); levels, grading, normalize-answer, translation, badges,
│  │                             gamification-events, learning-helpers, course-derive, data-identity, data-submissions,
│  │                             ai-{safety,mock-provider,tutor,grading,lab}, services-{credentials,identity,access,classroom,
│  │                             provisioning,learning,assessment,project-flow,recognition,tutor-context} over
│  │                             services-fixtures.ts (F5); seed-content (F6); nav-config (F7)
│  └─ integration/               emulator-backed service flows per role (section 11.1): student, teacher, school-admin,
│                                platform-admin, negative-session; support/emulators.ts (reset, migrate + seed as child
│                                processes, Auth-emulator REST sign-in) and support/world.ts (sessions, seed facts, builders)
├─ next.config.ts                next-intl plugin → ./src/lib/i18n/request.ts; images; security headers
├─ postcss.config.mjs, eslint.config.mjs, tsconfig.json, vitest.config.mts
├─ .prettierrc.json, .prettierignore, .gitattributes (LF line endings), .gitignore
├─ AGENTS.md                     written and kept current by `next dev`; points coding agents at node_modules/next/dist/docs
├─ .env.example
├─ package.json                  package name `roboholic-ai` (the folder name is not a valid npm name)
├─ .github/workflows/ci.yml      CI (11.1, F9): job `checks` (lint, typecheck, test, build with no env) and job `emulators`
│                                (test:rules, test:integration on Temurin JDK 21; emulator JARs cached by the lockfile hash)
└─ README.md
```

npm scripts: `dev`, `build`, `start`, `lint`, `typecheck` (`next typegen && tsc --noEmit`),
`format`, `test`, `test:rules`, `test:integration`, `emulators`
(creates `.emulator-data` when it is missing, then `firebase emulators:start --project
demo-roboholic --import .emulator-data --export-on-exit`; firebase-tools refuses an
`--import` directory that does not exist and accepts an empty one),
`migrate`, `seed`, `admin:bootstrap`, `user:delete`, `cleanup:uploads`, `smoke:queries`,
`check-messages`,
`deploy:rules` (`firebase deploy --only firestore:rules,firestore:indexes,storage`).

Test layout (`vitest.config.mts` defines three projects; a test file is `*.test.ts`):
`test` runs project `unit` (`tests/unit/**`); `test:rules` and `test:integration` start the
emulators themselves with `firebase emulators:exec --project demo-roboholic` (Firestore and
Storage for rules; Auth, Firestore and Storage for integration) and run project `rules`
(`tests/rules/**`) or `integration` (`tests/integration/**`). Those two projects run their
files one at a time, because every file shares the one emulator instance.

The integration suite seeds the emulators itself and does not rely on a prior `npm run
seed`: every file's `beforeAll` clears Auth (`DELETE /emulator/v1/projects/{id}/accounts`),
Firestore (the documents endpoint) and Storage (`getAdminBucket().deleteFiles()`, since
`clearStorage()` of `@firebase/rules-unit-testing` removes root-level objects only), then
runs `scripts/migrate.ts` and `scripts/seed/index.ts` as child processes
(`node node_modules/tsx/dist/cli.mjs --conditions=react-server <script>`). It also runs
against emulators started with `npm run emulators` (`support/emulators.ts` defaults the
`*_EMULATOR_HOST` variables to the `firebase.json` ports and `FIREBASE_PROJECT_ID` to
`GCLOUD_PROJECT` or `demo-roboholic`) and then wipes that instance's data.
`@/lib/auth/session` cannot be imported under Vitest as it is (`@/lib/i18n/navigation` pulls
`next-intl/navigation` → `next/navigation`, which Node's ESM resolution rejects as a bare
subpath, and `cookies()` needs a request): `negative-session.test.ts` uses the real module
with `vi.mock('next/headers')` (an in-memory cookie jar), `vi.mock('next-intl/server')` and
`vi.mock('@/lib/i18n/navigation')`; the four other files mock `@/lib/auth/session` as
`tests/unit/services-provisioning.test.ts` does, because `services/provisioning` imports it.

Scripts are run with `tsx --conditions=react-server`, and `vitest.config.mts` aliases
`server-only` to an empty module, so scripts and tests can import `src/lib/**` files that
start with `import 'server-only'`.

Every script loads `<repo>/.env.local` when it exists (or `--env-file <path>`), with
variables already set in the environment winning; without `--allow-project` the three
emulator host variables default to the `firebase.json` ports and `FIREBASE_PROJECT_ID` to
`GCLOUD_PROJECT` or `demo-roboholic`, so the emulator target needs no environment file.
`--allow-project <id>` must equal `FIREBASE_PROJECT_ID`, refuses while any `*_EMULATOR_HOST`
is set, and asks for terminal confirmation unless `--yes`. Every script takes
`--allow-project`, `--env-file`, `--yes` and `--help`; beyond the contract, `migrate` takes
`--rerun`, `cleanup:uploads` `--dry-run` and `--max-age-hours <n>` (default 24),
`user:delete` a `<uid-or-email>` argument and `admin:bootstrap` `<email> --name --locale`.
`src/lib/services/provisioning.ts` is not importable outside Next: it imports
`auth/session`, which pulls `next/navigation`, and under tsx that fails with
"React.createContext is not a function"; the seed and `bootstrap-admin.ts` therefore use the
pieces below it (section 11.6 and 1.5 path 7), and a step added to provisioning's account
creation or role change must be added there too.

Running the emulator-backed suites from a non-interactive shell on Windows: put the JDK on
`PATH` and set `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=%USERPROFILE%\.cache` (without
it the Firestore emulator exits with "Unable to establish loopback connection"); firebase-tools
then prints a harmless "Unexpected rules runtime error: Picked up JAVA_TOOL_OPTIONS" line.
`firebase emulators:exec` may report "Port 8080 is not open" for a few seconds after a
previous run has shut down (TIME_WAIT); retrying works. A tsx script that lives outside the
repository resolves `@/` with `npx tsx --conditions=react-server --tsconfig tsconfig.json
<script>` run from the repository root, with `NODE_PATH` pointing at the repository's
`node_modules`.

A route folder deleted while `next dev` was not running can leave Turbopack's persistent
cache in `.next/dev` pointing at it; the symptom is a FATAL Turbopack panic naming the old
route (`Failed to write app endpoint /[locale]/<old route>/page`) on every request, HMR
failing and pages reloading in a loop (the Stage 0 gate hit it with F7's deleted
`kit-preview` pages). Delete `.next/dev` and start `next dev` again. `npm run build` needs
no environment variables but does need outbound network: `[locale]/layout.tsx` loads Inter
through `next/font/google`, and a production build fails offline with "Failed to fetch
`Inter` from Google Fonts" (`next dev` logs the error and uses the fallback font); switch to
`next/font/local` with a vendored file if offline builds are needed (`font-src 'self'` in
the CSP already allows it). `next dev` logs every server action call with its arguments,
the ID token of `createSessionAction` included; that is development output only.

`src/`:

```
src/
├─ proxy.ts                                  next-intl middleware + cookie-presence gate + matcher
├─ app/
│  ├─ layout.tsx                             pass-through (returns children); default title and favicon metadata
│  ├─ not-found.tsx                          global fallback; renders its own <html lang="en"> and <body>
│  ├─ globals.css                            Tailwind v4 import, @theme tokens
│  ├─ api/
│  │  ├─ ai/tutor/route.ts                   POST, streamed tutor reply
│  │  └─ files/[fileId]/route.ts             GET, authorize → short-lived URL (or stream on the emulator)
│  └─ [locale]/
│     ├─ layout.tsx                          <html lang dir>, fonts, NextIntlClientProvider, ToastProvider
│     ├─ error.tsx · not-found.tsx            no loading.tsx at this level: a Suspense boundary above the catch-all would
│     │                                      stream every unknown URL as 200 (section 1.3)
│     ├─ [...rest]/page.tsx                  calls notFound() → 404 with the locale's not-found page
│     ├─ (public)/                           layout.tsx (PublicShell) · loading.tsx · error.tsx · not-found.tsx
│     │  ├─ page.tsx                         homepage
│     │  ├─ pathways/page.tsx
│     │  ├─ pathways/[pathwayId]/page.tsx
│     │  ├─ verify/[code]/page.tsx
│     │  ├─ privacy/page.tsx · terms/page.tsx
│     ├─ (auth)/                             layout.tsx (AuthShell) · loading.tsx · error.tsx · not-found.tsx
│     │  ├─ login/page.tsx · signup/page.tsx · join/page.tsx
│     │  ├─ forgot-password/page.tsx · verify-email/page.tsx
│     ├─ (shared)/                           layout.tsx (requireSession, minimal chrome) · loading.tsx · error.tsx · not-found.tsx
│     │  ├─ certificates/[certificateId]/page.tsx          printable certificate
│     │  └─ preview/[courseId]/lessons/[lessonId]/page.tsx read-only lesson player for school and platform admins
│     ├─ student/                            layout.tsx (requireRole('student')) · not-found.tsx (bare: notFound() on a player path resolves here)
│     │  ├─ (shell)/                         layout.tsx (AppShell; xp/level from users.getUser) · loading.tsx · error.tsx · not-found.tsx
│     │  │  ├─ page.tsx                      Home
│     │  │  ├─ learn/page.tsx
│     │  │  ├─ learn/pathways/[pathwayId]/page.tsx
│     │  │  ├─ learn/courses/[courseId]/page.tsx
│     │  │  ├─ ai-lab/page.tsx · ai-lab/[toolId]/page.tsx
│     │  │  ├─ robotics/page.tsx
│     │  │  ├─ challenges/page.tsx · challenges/[challengeId]/page.tsx
│     │  │  ├─ projects/page.tsx · projects/[submissionId]/page.tsx
│     │  │  ├─ tutor/page.tsx
│     │  │  ├─ achievements/page.tsx · certificates/page.tsx · settings/page.tsx
│     │  └─ (player)/                        loading.tsx · error.tsx (bare, full page)
│     │     └─ learn/courses/[courseId]/lessons/[lessonId]/page.tsx
│     ├─ teacher/                            layout.tsx (requireRole('teacher')) · not-found.tsx (bare)
│     │  ├─ (shell)/                         layout.tsx (AppShell) · loading.tsx · error.tsx · not-found.tsx
│     │  │  ├─ page.tsx                      Dashboard
│     │  │  ├─ classes/page.tsx · classes/[classId]/page.tsx
│     │  │  ├─ classes/[classId]/students/[studentUid]/page.tsx
│     │  │  ├─ courses/page.tsx · courses/[courseId]/page.tsx
│     │  │  ├─ create/page.tsx · create/[courseId]/page.tsx
│     │  │  ├─ create/[courseId]/lessons/[lessonId]/page.tsx
│     │  │  ├─ create/[courseId]/quizzes/[quizId]/page.tsx
│     │  │  ├─ create/[courseId]/projects/[projectId]/page.tsx
│     │  │  ├─ assessments/page.tsx · assessments/[attemptId]/page.tsx
│     │  │  ├─ projects/page.tsx · projects/[submissionId]/page.tsx
│     │  │  ├─ reports/page.tsx · settings/page.tsx
│     │  └─ (player)/                        loading.tsx · error.tsx (bare, full page)
│     │     └─ courses/[courseId]/lessons/[lessonId]/page.tsx
│     ├─ school/                             layout.tsx (requireRole('school_admin') + AppShell) · loading.tsx · error.tsx · not-found.tsx
│     │  ├─ page.tsx · teachers/page.tsx · students/page.tsx
│     │  ├─ classes/page.tsx · classes/[classId]/page.tsx
│     │  ├─ courses/page.tsx · analytics/page.tsx · certificates/page.tsx
│     │  ├─ licenses/page.tsx · settings/page.tsx
│     └─ admin/                              layout.tsx (requireRole('platform_admin') + AppShell) · loading.tsx · error.tsx · not-found.tsx
│        ├─ page.tsx · schools/page.tsx · schools/[schoolId]/page.tsx · users/page.tsx
│        ├─ subscriptions/page.tsx
│        ├─ courses/page.tsx · courses/[courseId]/page.tsx
│        ├─ courses/[courseId]/lessons/[lessonId]/page.tsx
│        ├─ courses/[courseId]/quizzes/[quizId]/page.tsx
│        ├─ courses/[courseId]/projects/[projectId]/page.tsx
│        ├─ certificates/page.tsx · challenges/page.tsx
├─ actions/                                  'use server' files, one per feature (section 10.4)
│  ├─ session.ts                             foundation-owned: createSessionAction, signOutAction, getClientAuthTokenAction
│  ├─ auth.ts · learning.ts · quiz.ts · projects.ts · review.ts · files.ts
│  ├─ classes.ts · course-editor.ts · certificates.ts · school.ts · admin.ts
│  ├─ ai.ts · settings.ts
├─ lib/
│  ├─ env.ts                                 getServerEnv(), getPublicEnv(), getAiEnv(), getFirebaseWebConfig(), isEmulator(), emulator guard
│  ├─ errors.ts                              AppError + subclasses, isAppError()
│  ├─ limits.ts                              shared: AI_LIMITS, AI_BUDGETS, UPLOAD_QUOTAS, RATE_LIMITS, CONTENT_LIMITS, SUBMISSION_LIMITS,
│  │                                         and the formats schemas share with other modules (section 10.1)
│  ├─ avatars.ts                             shared: AVATAR_IDS, AvatarId, DEFAULT_AVATAR_ID
│  ├─ request-meta.ts                        'server-only' getClientKey(): HMAC of the client IP (x-real-ip, else the first
│  │                                         x-forwarded-for entry, else the shared key 'unknown'); hashClientAddress(address)
│  ├─ utils.ts                               cn(), formatDate(), assertNever()
│  ├─ actions/
│  │  ├─ result.ts                           ok(), fail()
│  │  ├─ run-action.ts                       'server-only' runAction()
│  │  └─ session-source.ts                   'server-only' re-exports getSession, assertSessionNotRevoked from auth/session (section 1.4)
│  ├─ schemas/                               shared zod schemas (no 'server-only'), one file per feature (section 10.1)
│  │  ├─ common.ts                           parseInput(), VALIDATION_KEYS, builders, id and date schemas
│  │  ├─ auth.ts · course.ts · quiz.ts · project.ts · class.ts · school.ts · admin.ts
│  │  ├─ submission.ts · ai.ts · profile.ts · learning.ts · certificate.ts
│  ├─ firebase/
│  │  ├─ admin.ts                            'server-only' getAdminApp/Auth/Db/Bucket (lazy singletons; the named app 'roboholic',
│  │  │                                      kept on globalThis.__roboholicAdmin so they survive module reloads under next dev;
│  │  │                                      Firestore with ignoreUndefinedProperties: true; in emulator mode
│  │  │                                      METADATA_SERVER_DETECTION defaults to 'none'); exported type Bucket
│  │  ├─ client.ts                           getClientApp/Auth/Storage (lazy, emulator-aware, in-memory auth persistence)
│  │  ├─ collections.ts                      'server-only' `collections` (one builder per collection of 3.3), `docIds` (the composite
│  │  │                                      ids of 3.1), quizKeyDoc(), migrationsDoc(), utcDayKey(), utcHourKey()
│  │  ├─ converters.ts                       'server-only' toIso(), toIsoOrNull(), convertTimestamps(), fromSnapshot<T>(snapshot, parents?)
│  │  │                                      (NotFoundError for a missing document), fromSnapshotOrNull(), fromQuery(), toTimestamp(),
│  │  │                                      toTimestampOrNull(), serverTimestamp(), createdNow(), updatedNow()
│  │  ├─ storage-paths.ts                    shared: path builders, UPLOAD_LIMITS, mediaUrl(), sanitizeFileName(), isAllowedContentType(),
│  │  │                                      checkUpload(), uploadContentType(), OCTET_STREAM_EXTENSIONS, STORAGE_EMULATOR_ORIGIN
│  │  ├─ storage-admin.ts                    'server-only' statObject(), clearDownloadTokens() (no effect on the Storage emulator),
│  │  │                                      serveFile() (302 to a signed URL; streams the object on the emulator), deleteObject()
│  │  └─ upload-client.ts                    client: uploadFile() with progress
│  ├─ auth/
│  │  ├─ roles.ts                            shared: ROLES, STAFF_ROLES, roleHome(), safeNextPath(), isStaffRole()
│  │  ├─ capabilities.ts                     shared: Capability, ROLE_CAPABILITIES, hasCapability()
│  │  ├─ username.ts                         shared: STUDENT_EMAIL_DOMAIN, identifierToEmail(), usernameToEmail(),
│  │  │                                      isUsernameAccountEmail(), isValidUsername()
│  │  ├─ account-policy.ts                   shared pure: studentAccountPolicy(), StudentAccountDecision, SELF_SIGNUP_AGE_BANDS
│  │  ├─ actor.ts                            Session, SystemActor, Actor, SYSTEM_ACTOR, isSystem(), assertSystem()
│  │  ├─ session.ts                          'server-only' getSession(), requireSession(), requireRole(), cookie helpers
│  │  ├─ claims.ts                           'server-only' syncClaims()
│  │  ├─ authz.ts                            'server-only' can*/assert* helpers (section 4.4)
│  │  └─ client.ts                           client: signInWithIdentifier(), signUpWithEmail(), signOutClient(),
│  │                                         sendPasswordReset(), sendVerificationEmail(), ensureClientAuth()
│  ├─ data/                                  'server-only' repositories (section 10.2)
│  │  ├─ users.ts · schools.ts · classes.ts · pathways.ts · courses.ts · quizzes.ts
│  │  ├─ enrollments.ts · projects.ts · submissions.ts · files.ts · badges.ts · xp.ts
│  │  ├─ certificates.ts · challenges.ts · billing.ts · hardware.ts · ai-usage.ts
│  │  ├─ analytics.ts · audit.ts · rate-limit.ts
│  │  ├─ internal-identity.ts                private to data/: assertId(), isId(), userDoc(), actorUid(), isActorUid(), isAlreadyExists(),
│  │  │                                      isMissingDocument(), updateExisting(), readProfile(), assertCanViewUser(),
│  │  │                                      clampAiDailyMessageLimit(), PAGE_SIZE, clampLimit(), readPage()
│  │  ├─ internal-content.ts                 private to data/: loadViewableCourse() (ForbiddenError), loadEditableCourse(), paging helpers
│  │  └─ course-derive.ts                    pure helpers shared with the seed: deriveLessonFields(), splitQuizInput(), blockFileIds(),
│  │                                         toBlockFields(), linkedContent(), toQuizInput(), quizDocumentBytes(), lessonProgressOf()
│  ├─ services/                              'server-only' use cases (section 10.3)
│  │  ├─ identity.ts · provisioning.ts · classroom.ts · learning.ts · assessment.ts
│  │  ├─ project-flow.ts · recognition.ts · tutor-context.ts · access.ts
│  │  ├─ internal-common.ts                  private to services/: requireSessionActor(), requireLearnerSession(), learnerAudience(),
│  │  │                                      orNullIfMissing(), own(), requireCourseAccess(), titleSnapshot(), applyEffects(), weightedScore()
│  │  └─ internal-credentials.ts             private to services/, pure: usernameBase(), usernameCandidate(), generatePassword()
│  ├─ learning/
│  │  ├─ quiz-grading.ts                     pure: gradeQuiz(), normalizeAnswer(), types GradableQuiz, QuizGrade
│  │  ├─ stages.ts                           shared: LESSON_STAGES order, groupBlocksByStage(), type StageGroup
│  │  ├─ challenge-phase.ts                  shared pure: getChallengePhase()
│  │  ├─ embed-allowlist.ts                  shared: EMBED_HOSTS, toEmbedUrl(), toVideoEmbedUrl()
│  │  └─ lesson-completion.ts                shared pure: getMissingForCompletion(), isReadyForCompletion(), responseLength() (section 9.4)
│  ├─ gamification/
│  │  ├─ rules.ts                            shared: XP_RULES, MAX_LEVEL (declared here, re-exported by levels.ts)
│  │  ├─ levels.ts                           shared pure: xpForLevel(), levelForXp(), levelProgress(), MAX_LEVEL
│  │  ├─ award.ts                            'server-only' awardXp(), evaluateBadges(), evaluateBadgeTriggers(), awardBadge()   (internal)
│  │  ├─ certificates.ts                     'server-only' maybeIssueCourseCertificate(), issueCertificateFor(),
│  │  │                                      revokeCertificateById(), SYSTEM_ISSUER                             (internal)
│  │  └─ events.ts                           'server-only' onLessonCompleted(), onQuizPassed(), onSubmissionAccepted()
│  ├─ ai/                                    'server-only'
│  │  ├─ types.ts                            AiProvider and request/response types, TutorContext, AiError, NO_USAGE
│  │  ├─ index.ts                            getAiProvider()
│  │  ├─ providers/mock.ts · providers/anthropic.ts   (anthropic.ts is a placeholder until WS-I, section 8.1)
│  │  ├─ tutor.ts                            streamTutorReply(), guardTutorStream(), toTutorStreamEvent(), encodeTutorEvent(),
│  │  │                                      buildTutorRequest(), TUTOR_STREAM_CONTENT_TYPE, TUTOR_REPLACE_KEYS (section 8.3)
│  │  ├─ grading.ts                          suggestReview()
│  │  ├─ lab.ts                              runLabTool(), runLabToolWithReport()
│  │  ├─ lab-tools.ts                        shared (no 'server-only'): LAB_TOOLS registry
│  │  ├─ safety.ts                           sanitizeUserText(), checkOutput(), wrapUntrusted()
│  │  └─ prompts/tutor.ts · prompts/grading.ts · prompts/lab.ts
│  ├─ i18n/
│  │  ├─ config.ts                           LOCALES, DEFAULT_LOCALE, RTL_LOCALES, LOCALE_LABELS (each language named in itself), getDirection()
│  │  ├─ namespaces.ts                       NAMESPACES (ordered list), type Namespace
│  │  ├─ routing.ts                          routing = defineRouting(); narrows next-intl's Locale type to LOCALES
│  │  ├─ navigation.ts                       Link, redirect, usePathname, useRouter, getPathname
│  │  ├─ request.ts                          getRequestConfig(): loads and merges namespace files; a missing file is an empty namespace
│  │  └─ content.ts                          shared pure: pickTranslation(), hasTranslation()
│  └─ navigation/
│     └─ nav-config.ts                       shared: NAV_ITEMS, PROFILE_ITEMS per role, isNavItemActive(), roleHome re-export
├─ messages/
│  ├─ en/<namespace>.json
│  └─ fr/<namespace>.json
├─ types/
│  ├─ index.ts                               barrel
│  ├─ common.ts · user.ts · school.ts · content.ts · quiz.ts · learning.ts · project.ts
│  ├─ gamification.ts · challenge.ts · billing.ts · hardware.ts · analytics.ts · ai.ts · actions.ts
│  └─ inputs.ts                              form and editor input types (section 10.1)
└─ components/
   ├─ ui/                                    primitives (no domain knowledge, no data fetching)
   │  ├─ Button.tsx · IconButton.tsx · Input.tsx · Textarea.tsx · Select.tsx · Checkbox.tsx
   │  ├─ RadioGroup.tsx · Switch.tsx · Label.tsx · FormField.tsx · Card.tsx · Chip.tsx
   │  ├─ Avatar.tsx · Logo.tsx · ProgressBar.tsx · ProgressRing.tsx · Tabs.tsx · Dialog.tsx
   │  ├─ DropdownMenu.tsx · Tooltip.tsx · Toast.tsx · Table.tsx · Pagination.tsx
   │  ├─ Skeleton.tsx · Spinner.tsx · EmptyState.tsx · ErrorState.tsx · Alert.tsx
   │  ├─ Breadcrumbs.tsx · index.ts
   │  └─ tones.ts · control.ts · avatar-art.tsx   private helpers: tone class maps (StatusTone, ChipTone), the shared
   │                                             Input/Textarea/Select classes + describedBy(), the twelve avatar glyphs
   ├─ domain/                                presentational, typed by domain types
   │  ├─ CourseCard.tsx · PathwayCard.tsx · ProgressCard.tsx · XPBadge.tsx · StatCard.tsx
   │  ├─ LessonNavigation.tsx · AIChatPanel.tsx · AIChatMessages.tsx · AIChatComposer.tsx
   │  ├─ ProjectCard.tsx · CertificateCard.tsx · ChallengeCard.tsx · CertifiedBadge.tsx
   │  ├─ BadgeTile.tsx · LevelProgress.tsx · StatusChip.tsx · RichText.tsx · MediaImage.tsx
   │  └─ NamedIcon.tsx · format.ts · index.ts   (NamedIcon, ICON_NAMES; useDateFormat, useDurationFormat, useAgeRangeLabel)
   ├─ layout/
   │  ├─ PublicShell.tsx · PublicHeader.tsx · PublicFooter.tsx · AuthShell.tsx
   │  ├─ AppShell.tsx · SidebarNav.tsx · MobileNav.tsx · TopBar.tsx · UserMenu.tsx
   │  ├─ LocaleSwitcher.tsx · PageHeader.tsx · LessonShell.tsx · tutor-bridge.tsx · index.ts
   │  └─ Drawer.tsx · NavLinks.tsx · SkipLink.tsx · LessonSidePane.tsx · sign-out.tsx   layout-private (section 7.5)
   ├─ lesson/                                lesson player (section 7.6)
   │  ├─ LessonPlayer.tsx · LessonTopBar.tsx · StageStepper.tsx · LessonContent.tsx
   │  ├─ LessonFooter.tsx · LessonCompletePanel.tsx · BlockRenderer.tsx
   │  └─ blocks/registry.ts · blocks/RichTextBlock.tsx · ImageBlock.tsx · VideoBlock.tsx
   │     FileBlock.tsx · QuizBlock.tsx · CodeActivityBlock.tsx · AiActivityBlock.tsx
   │     EmbedBlock.tsx · ReflectionBlock.tsx · ProjectBlock.tsx
   ├─ quiz/ · projects/ · ai/ · course-editor/ · classes/ · school/ · admin/
   ├─ marketing/ · auth/ · student/ · teacher/ · robotics/ · challenges/ · certificates/ · achievements/
   └─ (each of the feature folders above is owned by one workstream; section 11)
```

Route-private components may live in a `_components/` folder next to the `page.tsx` that
uses them. Anything used by more than one route goes in `src/components/<feature>/`.

Conventions (MUST):

- Path alias `@/*` → `src/*`.
- Every file that imports `firebase-admin` starts with `import 'server-only'`.
- `params` and `searchParams` are Promises (Next.js 16): `const { locale } = await params`.
- Tailwind: logical utilities only — `ms-* me-* ps-* pe-* inset-s-* inset-e-* text-start
  text-end border-s border-e rounded-s rounded-e` (Tailwind ≥ 4.2; the older `start-*` /
  `end-*` aliases are deprecated and not used). Physical classes are banned so RTL needs no
  component changes. Mechanism: a `no-restricted-syntax` rule in `eslint.config.mjs` that
  matches string and template literals containing a class token starting with `ml-`, `mr-`,
  `pl-`, `pr-`, `left-`, `right-`, `start-`, `end-`, or equal to `text-left`, `text-right`,
  `rounded-l*`, `rounded-r*`, `border-l*`, `border-r*` (regex on class-token boundaries, so
  variants, `!` and a leading minus are seen through, while `rounded-lg`, `border-red-500`
  and `col-start-2` stay legal; no Tailwind ESLint plugin is added). The rule applies to
  every string in `src/`; a non-class string that trips it takes an `eslint-disable-next-line`
  with the reason.
- No user-visible string literals in components; all text comes from next-intl messages or
  from database translations.
- Internal links use `Link` / `redirect` from `@/lib/i18n/navigation`, never `next/link`.
  Every `href` is a locale-less path (`/student/learn`); the active locale is prefixed for
  the caller. `redirect` and `getPathname` take the locale explicitly (next-intl 4):
  `redirect({ href: '/login', locale })`, with `locale` from `await getLocale()` on the server
  or `useLocale()` on the client; both return the `Locale` union, not `string`. `useRouter()`
  and `usePathname()` are client-only; `router.replace(pathname, { locale })` switches
  language on the current page. `notFound`, `useSearchParams` and `useParams` still come from
  `next/navigation`. A raw `<a href>` to an internal page is a lint error
  (`@next/next/no-html-link-for-pages`); the one sanctioned exception is the home link of
  the global `not-found.tsx`, which has no locale.
- A page that should be prerendered (the public pages) narrows its `locale` param with
  `hasLocale(routing.locales, locale)` and calls `setRequestLocale(locale)` before any other
  next-intl call, as `[locale]/layout.tsx` does; without it next-intl reads the request
  headers and the page becomes dynamic. Pages behind `requireRole` are dynamic anyway and
  need neither.

---

## 3. Firestore data model

### 3.1 Conventions

- Field names are camelCase. Every document has `createdAt` and `updatedAt`
  (`Timestamp`, server time) unless stated otherwise; they are omitted from the shapes below.
  One exception the shapes do not show: the `aiUsage` budget counters (`school_*`,
  `global_*`) and a user counter first touched by `recordAiTokens` are written with
  `set({ merge: true })` and carry `updatedAt` only (they are private to the repository and
  never returned).
- **Ids**: Auth `uid` for users; human-readable slugs for reference data (pathways, badges,
  hardware platforms) and seeded courses; Firestore auto-ids elsewhere; deterministic
  composite ids where a uniqueness or idempotency guarantee is needed: enrollments, quiz
  attempts, submissions, XP ledger entries, user badges, course certificates, usage counters,
  rate-limit buckets, join codes. Documents that must never be overwritten (user profiles,
  quiz attempts, submissions, XP ledger entries, user badges, file records, join codes) are
  written with Firestore `create()`, which fails if the document exists.
- **Module, lesson, block, quiz and project ids are unique only inside their course.** They
  are never used as a key on their own: every ledger id, attempt id, submission id, query
  and function signature that refers to one also carries the `courseId`. Seeded content uses
  short stable ids that are unique within the course (for example `m1`, `m1-l2`, `quiz-m1`,
  `project-1`); the same id may appear in two courses.
- **Id format (MUST).** Every single id (Auth uid, auto-id, slug, seeded id) matches
  `^[A-Za-z0-9-]{1,64}$` (`ID_PATTERN` / `idSchema` in `src/lib/schemas/common.ts`), and
  every action input is checked against it. An id therefore never contains `_`, the
  separator of the composite ids, so a composite id reads in one way only. Seeds, migrations
  and scripts pick ids of that form (`my-first-ai-adventure`, `m1-l2`; never `m1_l2`) and
  never create an Auth user with a custom uid outside it. Composite ids match
  `^[A-Za-z0-9_-]{1,300}$` (`compositeIdSchema`); file ids are UUIDs (`FILE_ID_PATTERN`).
- **No client writes.** Every write is performed by the Admin SDK inside a repository.
- **Counters and denormalized fields** are updated in the same transaction or batch as the
  write that changes them, by the module named in 3.6.
- **Deleting**: learner records (enrollments, progress, attempts, submissions, certificates)
  are not deleted by the application; they carry status fields. Two exceptions exist for
  privacy: an uploaded attachment can be deleted (`project-flow.deleteAttachment`), and
  `scripts/delete-user-data.ts` erases a user completely (section 12). Course structure
  (modules, lessons, blocks, quizzes, projects) can be hard-deleted only while the course has
  zero enrollments; a module additionally only when it holds no lessons (delete or move them
  first; `deleteLesson` cascades to the blocks and clears the `lessonId` links of its quizzes
  and projects); a quiz or project additionally only when no block references it
  (`lessonId === null`). Otherwise the repository throws `ConflictError`.
- **Limits** that keep queries simple and documents far below Firestore's 1 MiB document
  limit (`CONTENT_LIMITS` in `src/lib/limits.ts`, enforced by the zod schemas of 10.1):

  | Limit | Value |
  |---|---|
  | Classes per user (`users.classIds`) | 30 |
  | Students per class | 60 |
  | Teachers per class | 5 |
  | Blocks per lesson | 40 |
  | Questions per quiz; options per question | 50; 8 |
  | Question prompt; option text; explanation (per locale) | 1 000; 300; 1 000 chars |
  | Accepted short answers per question (per locale) | 10 × 200 chars |
  | Serialized quiz document | 700 KB (`saveQuiz` rejects above) |
  | `rich_text.body`; video `transcript` (per locale) | 20 000; 30 000 chars |
  | Reflection / code-activity response per block | 10 000 chars |
  | Attachments per submission | 5 |
  | Attempts per project or challenge (`SUBMISSION_LIMITS.maxAttempts`) | 10 |
  | Languages per document (`translations` keys) | 12 |
  | Author-set `xpReward`: lesson; quiz; project; challenge (`CONTENT_LIMITS.xpRewardMax`) | ≤ 200; 500; 1 000; 2 000 |

  `src/lib/limits.ts` is the only definition of these numbers and of the ones this table
  does not list (the length of every other text field, numeric ranges such as ages and
  minutes, list sizes such as tags and outcomes). Forms read them from there for hints and
  counters instead of repeating a number. The `xpReward` ceilings exist so that a self-made
  course cannot mint levels; the defaults of section 9.1 sit well below them.

- Shapes below use these shared types (defined in `src/types/common.ts`, section 10.1):
  `Localized<T>`, `MediaRef`, `FileRef`, `Locale`, `Role`, `AgeBand`, `LearningArea`,
  `SubmissionType`.

### 3.2 Translations

Translatable text lives **inside the document** in a map keyed by locale, next to a
`defaultLocale` field:

```ts
translations: { en: { title: 'What is AI?', summary: '…' }, fr: { title: "Qu'est-ce que l'IA ?", summary: '…' } }
defaultLocale: 'en'
```

- `Localized<T> = { [locale: string]: T | undefined }`. The key type is `string`, not the UI
  `Locale` union, so a document can hold `ar` content before the UI enables Arabic.
- Resolution is one pure function, usable on server and client:
  `pickTranslation(translations, locale, defaultLocale)` in `src/lib/i18n/content.ts`. It
  resolves **per field**: requested locale → `defaultLocale` → `en` → first locale present.
  A half-translated French entry therefore falls back field by field instead of showing
  blanks. A field counts as blank when it is `undefined`, `null`, an empty or
  whitespace-only string, or an empty array; a field that is blank in every locale keeps its
  first defined value (so an optional `caption: null` stays `null`). A list-valued map
  (`Localized<string[]>`) resolves as one unit: the first non-empty list in the same order.
  With an empty map the result is `{}`. `hasTranslation(translations, locale)` is true when
  the entry of that exact locale has at least one non-blank field (editors use it to mark a
  language as translated).
- Editors must fill every field for `defaultLocale`; other locales are optional.
- Repositories return documents with the full `translations` map; components resolve at
  render time. Nothing is queried or sorted by translated text (ordering uses `order` and
  timestamps), so no per-locale index exists and adding a locale needs no migration.
- Adding Arabic = add `'ar'` to `LOCALES` and `RTL_LOCALES` and `ar: 'العربية'` to
  `LOCALE_LABELS` in `src/lib/i18n/config.ts` (the type of `LOCALE_LABELS` makes the compiler
  ask for it), add `src/messages/ar/*.json`, and write `translations.ar` on content. No
  schema change. Routing, the proxy gate, `<html dir>`, the `Locale` type and
  `check-messages` all read `LOCALES`; `common.locale.names.ar` already exists.
- The brief's `course_translations`, `module_translations`, `lesson_translations` tables
  map to these embedded maps.
- User-generated text (submissions, reflections, feedback, class names) is stored once, as
  written.

### 3.3 Collection map

```
users/{uid}
  ├─ badges/{badgeId}
  └─ xpLedger/{entryId}
schools/{schoolId}
classes/{classId}
  ├─ members/{uid}
  └─ assignments/{courseId}
joinCodes/{code}
pathways/{pathwayId}
courses/{courseId}
  ├─ modules/{moduleId}
  ├─ lessons/{lessonId}
  │    └─ blocks/{blockId}
  ├─ quizzes/{quizId}
  │    └─ private/key                  ← server-only answer key
  └─ projects/{projectId}
enrollments/{uid}_{courseId}
  └─ lessonProgress/{lessonId}
quizAttempts/{uid}_{courseId}_{quizId}_{n}
submissions/{uid}_p_{courseId}_{projectId}_{n}   |   submissions/{uid}_c_{challengeId}_{n}
  ├─ reviews/{reviewId}                ← teacher decisions (history)
  └─ aiReviews/{aiReviewId}            ← AI suggestions (never readable by supervised students)
files/{fileId}
badges/{badgeId}
certificates/{uid}_{courseId}
challenges/{challengeId}
subscriptions/{subscriptionId}
licenses/{licenseId}
hardwarePlatforms/{platformId}
aiUsage/{uid}_{yyyymmdd}   |   aiUsage/school_{schoolId}_{yyyymmdd}   |   aiUsage/global_{yyyymmdd}
uploadUsage/{uid}_{yyyymmdd}
rateLimits/{scope}_{keyHash}_{yyyymmddhh}
auditLogs/{logId}
meta/migrations
meta/seed                                   ← the seed's bookkeeping (section 11.6)
```

### 3.4 Collections

#### Identity and organisation

```ts
// users/{uid}                              id = Firebase Auth uid; created with create(), never upserted
{
  role: Role;                               // 'student' | 'teacher' | 'school_admin' | 'platform_admin'
  schoolId: string | null;                  // null = individual user or platform admin
  displayName: string;                      // 2–40 chars; students: first name + last initial recommended
  username: string | null;                  // username accounts only; ^[a-z0-9._-]{3,30}$; immutable
  email: string | null;                     // null for username accounts
  ageBand: AgeBand;                         // '8-10' | '11-12' | '13-15' | '16-18' | 'adult'; immutable in the MVP
  locale: Locale;                           // preferred language
  avatarId: string;                         // one of AVATAR_IDS (src/lib/avatars.ts); no photo upload
  status: 'active' | 'disabled';
  classIds: string[];                       // student: classes the user is a member of; teacher: classes the user
                                            // teaches; always [] for other roles; ≤ 30. Emptied by data/classes.
                                            // removeUserFromAllClasses before every role change: setIdentity refuses a
                                            // role change (ConflictError) while it is not empty
  consentBasis: 'school' | 'self_13_plus' | 'adult';   // derived on the server (section 1.5), never from input
  provisionedByUid: string | null;          // staff member who created the account, if any
  verifiedEducator: boolean;                // teachers only; set by a platform admin; false for everyone else (setIdentity
                                            // resets it when the role changes to anything but teacher)
  sessionsValidAfter: Timestamp | null;     // session cookies with an earlier auth_time are rejected (section 1.5)
  xpTotal: number;                          // server-only
  level: number;                            // server-only, derived from xpTotal
  stats: {                                  // server-only counters, drive badge rules
    lessonsCompleted: number; quizzesPassed: number; projectsAccepted: number;
    challengesCompleted: number; coursesCompleted: number; badges: number; certificates: number;
  };
  lastLoginAt: Timestamp | null;
}

// users/{uid}/badges/{badgeId}             id = badgeId (idempotent award)
{ badgeId: string; awardedAt: Timestamp; awardedBy: 'system' | string /* uid */; note: string | null }

// users/{uid}/xpLedger/{entryId}           id = `${reason}_${refId}` (idempotent); brief: xp_transactions
{ amount: number; reason: XpReason; refId: string; courseId: string | null; createdAt: Timestamp }
// XpReason = 'lesson' | 'quiz' | 'project' | 'challenge' | 'badge' | 'adjustment'
// refId is course-scoped: `${courseId}_${lessonId}` | `${courseId}_${quizId}` | `${courseId}_${projectId}`
//                         | challengeId | badgeId | auditLogId

// schools/{schoolId}                        auto-id
{
  name: string;
  country: string;                          // ISO 3166-1 alpha-2
  city: string | null;
  defaultLocale: Locale;
  status: 'active' | 'suspended';
  settings: {
    aiEnabled: boolean;                     // one switch for tutor, AI Lab and AI review (section 8.6)
    aiDailyMessageLimit: number | null;     // overrides the student tutor limit; clamped to 1–200 on write and on read
    joinCodesEnabled: boolean;
  };
  counts: { teachers: number; students: number; classes: number };
                                            // denormalized; students = students with status 'active' = "seats used"
  createdByUid: string;
}

// classes/{classId}                         auto-id
{
  schoolId: string | null;                  // null = class of an individual teacher
  name: string;                             // 1–60 chars
  gradeLabel: string | null;                // free text, e.g. "Grade 6", "5ème B"
  ageBand: AgeBand;                         // default age band for provisioned students
  ownerUid: string;                         // a teacher; in a school class, a teacher of that school
  teacherUids: string[];                    // includes ownerUid; ≤ 5; all active teachers with schoolId === class.schoolId
                                            // (a school-less class has exactly [ownerUid])
  joinCode: string;                         // 8 chars from ABCDEFGHJKMNPQRSTUVWXYZ23456789 (31^8 ≈ 8.5 × 10^11)
  joinCodeEnabled: boolean;                 // default false
  joinCodeExpiresAt: Timestamp | null;      // set to now + 24 h whenever the code is enabled (also when it already was)
                                            // or regenerated; null when the code is disabled or the class archived;
                                            // an expired code behaves as disabled
  studentCount: number;                     // denormalized
  assignedCourseIds: string[];              // denormalized from assignments
  archived: boolean;
}

// classes/{classId}/members/{uid}           id = student uid; brief: class_memberships
{ displayName: string; username: string | null; ageBand: AgeBand;      // username and ageBand are immutable copies; all
                                                                       // three come from the profile read inside addMember's
                                                                       // transaction, not from its argument
  addedByUid: string | null /* null = joined by code */; joinedAt: Timestamp }

// classes/{classId}/assignments/{courseId}  id = courseId
{ courseId: string; assignedByUid: string; assignedAt: Timestamp; dueAt: Timestamp | null }

// joinCodes/{code}                          id = the code; guarantees uniqueness, O(1) lookup
{ classId: string; schoolId: string | null }
// Created with create() in the same transaction as the class write (createClass, regenerateJoinCode);
// the previous code's document is deleted in that transaction; archiveClass deletes it.
```

School membership (brief: `school_memberships`) is the pair `users.schoolId` + `users.role`.
A user belongs to at most one school in the MVP. Multi-school membership is future and
would add `schools/{schoolId}/members/{uid}`; nothing else would change.

A student's `schoolId` is set when a school provisions the account, or when a self-registered
student with `schoolId: null` joins a class that belongs to a school (through
`identity.applyIdentityChange`). It is reset to null only when a self-registered
(email) student is removed from their last class in that school; accounts provisioned by a
school stay attached to it.

#### Content

```ts
// pathways/{pathwayId}                      id = slug: ai-explorer | ai-creator | ai-builder | ai-engineer
//                                                    | ai-innovator | ai-robotics | teacher-academy
{
  order: number;
  audience: 'student' | 'teacher';
  kind: 'core' | 'robotics' | 'teacher_academy';
  ageMin: number | null; ageMax: number | null;     // null for teacher-academy; the migration writes 8–18 for ai-robotics
                                                    // (brief section 8 gives no range; it spans every student level): confirm, section 12
  icon: string;                             // lucide icon name
  accent: 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'blue' | 'slate';
  status: 'draft' | 'published';
  publishedCourseCount: number;             // denormalized
  defaultLocale: Locale;
  translations: Localized<{ title: string; tagline: string; description: string; topics: string[] }>;
}

// courses/{courseId}                        auto-id (seeded courses use slugs)
{
  pathwayId: string | null;                 // only official courses may have a pathway; cannot change while published
  order: number;                            // position inside the pathway
  ownerUid: string;                         // author
  schoolId: string | null;                  // author's school at creation; null for official courses
  isOfficial: boolean;                      // true → "RoboHolic Certified" badge; only platform_admin can set
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'school' | 'private';   // official: 'public'. Teacher-made: 'private' (author + assigned classes) or 'school'
  audience: 'student' | 'teacher';
  area: LearningArea;                       // 'ai' | 'generative_ai' | 'coding' | 'robotics' | 'creativity' | 'innovation' | 'responsible_ai'
  tags: string[];                           // lowercase; robotics uses 'vision' | 'sensors' | 'autonomous'
  ageMin: number | null; ageMax: number | null;
  estimatedMinutes: number;
  accessTier: 'free' | 'premium';           // premium needs a licence/subscription (section 4.5)
  certificateEnabled: boolean;
  coverImage: MediaRef | null;
  hardwarePlatformIds: string[];            // optional recommendations
  requiredCapabilities: HardwareCapability[];   // brand-neutral hardware requirement; [] = none
  moduleCount: number; lessonCount: number; // denormalized
  defaultLocale: Locale;
  translations: Localized<{ title: string; summary: string; description: string; outcomes: string[] }>;
  publishedAt: Timestamp | null;
}

// courses/{courseId}/modules/{moduleId}     auto-id
{ order: number; lessonCount: number; defaultLocale: Locale;
  translations: Localized<{ title: string; description: string }> }

// courses/{courseId}/lessons/{lessonId}     auto-id; flat under the course so the outline is two queries
{
  moduleId: string;
  order: number;                            // position inside the module
  estimatedMinutes: number;
  xpReward: number;                         // default 50
  blockCount: number;                       // denormalized
  quizIds: string[];                        // denormalized from quiz blocks
  projectIds: string[];                     // denormalized from project blocks
  reflectionBlockIds: string[];             // denormalized from reflection blocks
  tutorExcerpt: Localized<string>;          // denormalized: the lesson's rich_text bodies, ≤ 2 000 chars per locale (section 8.3)
  defaultLocale: Locale;
  translations: Localized<{ title: string; summary: string }>;
}

// courses/{courseId}/lessons/{lessonId}/blocks/{blockId}     auto-id; brief: lesson_blocks
{
  type: BlockType;        // 'rich_text' | 'image' | 'video' | 'file' | 'quiz' | 'code_activity'
                          // | 'ai_activity' | 'embed' | 'reflection' | 'project'
  stage: LessonStage;     // 'discover' | 'learn' | 'watch' | 'try' | 'ask_ai' | 'build' | 'check' | 'reflect'
  order: number;          // position inside the lesson
  defaultLocale: Locale;
  translations: Localized<BlockText>;       // per type, table below
  data: BlockData;                          // per type, table below
}
```

Block payloads (`BlockText` is the translatable part, `BlockData` the language-neutral part):

| `type` | `translations.<locale>` | `data` |
|---|---|---|
| `rich_text` | `{ heading: string \| null; body: string }` (Markdown; no raw HTML, no images) | `{}` |
| `image` | `{ alt: string; caption: string \| null }` | `{ media: MediaRef }` |
| `video` | `{ title: string; caption: string \| null; transcript: string \| null }` | `{ source: 'youtube' \| 'vimeo' \| 'file'; videoId: string \| null; media: MediaRef \| null; durationSeconds: number \| null }` |
| `file` | `{ label: string; description: string \| null }` | `{ media: MediaRef }` |
| `quiz` | `{ intro: string \| null }` | `{ quizId: string }` |
| `code_activity` | `{ instructions: string; hint: string \| null }` | `{ language: 'python' \| 'javascript' \| 'blocks'; starterCode: string }` |
| `ai_activity` | `{ instructions: string; starterPrompt: string \| null }` | `{ tutorMode: TutorMode; labToolId: string \| null }` |
| `embed` | `{ title: string; caption: string \| null }` | `{ url: string; aspectRatio: '16:9' \| '4:3' \| '1:1' }` (host must be in `EMBED_HOSTS`) |
| `reflection` | `{ prompt: string }` | `{ minLength: number }` |
| `project` | `{ intro: string \| null }` | `{ projectId: string }` |

The brief's lesson flow DISCOVER → LEARN → WATCH → TRY → ASK AI → BUILD → CHECK → REFLECT →
EARN maps to `stage` on each block; EARN is not a block but the completion panel the player
renders after the server confirms completion. The course creator's "Assignment" block is a
`project` block whose project has `kind: 'assignment'`. `project` blocks are not allowed in
courses with `audience: 'teacher'` (teachers do not submit projects; Teacher Academy lessons
use reflection blocks instead). Module, lesson, block, quiz and project documents get
auto-ids when created in the editor and stable ids when seeded (section 3.1).

```ts
// courses/{courseId}/quizzes/{quizId}       auto-id — student-readable part
{
  lessonId: string | null;                  // reverse link, maintained by the block transaction (section 3.6)
  passingScorePercent: number;              // default 70
  maxAttempts: number | null;               // null = unlimited; when exhausted the lesson can still be completed (section 9.4)
  xpReward: number;                         // default 100
  shuffleQuestions: boolean;
  revealAnswers: 'after_pass' | 'after_attempt' | 'never';   // default 'after_pass'
  questionCount: number;
  defaultLocale: Locale;
  translations: Localized<{ title: string; instructions: string | null }>;
  questions: QuizQuestion[];                // brief: quiz_questions + quiz_options, embedded
}
// QuizQuestion = { id: string; type: 'multiple_choice' | 'true_false' | 'multiple_answer' | 'short_answer';
//                  points: number; translations: Localized<{ prompt: string }>; options: QuizOption[] }
// QuizOption   = { id: string; translations: Localized<{ text: string }> }
//   true_false: exactly two options with ids 'true' and 'false'; short_answer: options = []

// courses/{courseId}/quizzes/{quizId}/private/key      fixed id 'key' — NEVER readable by clients
{
  answers: { [questionId: string]: { correctOptionIds: string[]; acceptedAnswers: Localized<string[]> } };
  explanations: { [questionId: string]: Localized<{ text: string }> };
}

// courses/{courseId}/projects/{projectId}   auto-id — project/assignment definition (brief: projects)
{
  lessonId: string | null;                  // reverse link, maintained by the block transaction (section 3.6)
  kind: 'project' | 'assignment';
  allowedSubmissionTypes: SubmissionType[]; // subset of: text image audio video pdf file link code
  rubric: { key: RubricKey; weight: number }[];   // weights sum to 100; default 25 each
  xpReward: number;                         // default 300
  requiredForCertificate: boolean;
  defaultLocale: Locale;
  translations: Localized<{ title: string; brief: string; requirements: string }>;
}
// RubricKey = 'creativity' | 'technicalQuality' | 'understanding' | 'responsibleAi'
```

Grading rules (`src/lib/learning/quiz-grading.ts`):

```ts
export function gradeQuiz(quiz: GradableQuiz, key: QuizAnswerKey, answers: Record<string, QuizAnswer>, locale: string): QuizGrade;
export type GradableQuiz = Pick<Quiz, 'questions' | 'passingScorePercent'> & { defaultLocale: string };
export interface QuizGrade { results: Record<string, QuizQuestionResult>; score: number; maxScore: number; scorePercent: number; passed: boolean }
export function normalizeAnswer(text: string, locale: string): string;
```

`results` has one entry per question of the quiz: an unanswered question is incorrect,
answers to question ids the quiz does not have are ignored, and a question without a key
entry is incorrect. `multiple_choice` and `true_false` are correct when exactly one distinct
option is selected and it is in `correctOptionIds`; `multiple_answer` is all-or-nothing (the
selected set equals a non-empty `correctOptionIds`); `short_answer` is correct when the
normalised answer is non-empty and equals a normalised accepted answer of the attempt's
locale or of the quiz's default locale, each list normalised under its own language on both
sides (the attempt-locale list with the attempt locale, the default-locale list with the
quiz's `defaultLocale`, so an Arabic key answered from the French interface still gets the
Arabic rules). `scorePercent = floor(score × 100 / maxScore)` and `passed = maxScore > 0 &&
scorePercent >= passingScorePercent`, so a quiz with no points never passes.

`normalizeAnswer(text, locale)` is one pure function applied to **both** sides at grading
time (keys are stored as authored), in this order: Unicode NFKC; case fold
(`toUpperCase().toLowerCase()`); NFD; removal of the Combining Diacritical Marks blocks only
(U+0300–036F, U+1AB0–1AFF, U+1DC0–1DFF, U+20D0–20FF, U+FE20–FE2F — marks that spell words in
other scripts, such as Thai tone marks or Hebrew niqqud, stay) and of every format character
(zero-width space and joiners, direction marks, BOM, soft hyphen); the Arabic rules when the
locale is `ar` or starts with `ar-` (case-insensitive): remove tatweel U+0640 and the marks
U+0610–061A, U+064B–065F, U+0670, U+06D6–06DC, U+06DF–06E4, U+06E7, U+06E8, U+06EA–06ED; map
alef with hamza above or below, alef madda and alef wasla to bare alef U+0627, waw-with-hamza
to waw, yeh-with-hamza to yeh and alef maqsura U+0649 to yeh U+064A (teh marbuta and a
standalone hamza are untouched); then NFC, collapse whitespace, trim. So `e` + combining
accent equals `é` equals `e`. It is covered by `tests/unit/normalize-answer.test.ts`; a
future locale whose marks must be stripped needs its own rule like the Arabic one, not only
configuration.

Quiz and project definitions carry a reverse link `lessonId` to the one lesson whose block
references them. A quiz or project can be referenced by at most one block; the link is
maintained by the block transaction (3.6).

#### Learning records

```ts
// enrollments/{uid}_{courseId}              deterministic id
{
  userUid: string; courseId: string;
  schoolId: string | null;                  // school of the supervising class, else the user's school
  classId: string | null;                   // supervising class (resolveClassContext, below); null = unsupervised
  source: 'self' | 'class';
  status: 'active' | 'completed';           // one-way: never goes back from 'completed' to 'active'
  completedLessonIds: string[];             // one read gives the whole course's checkmarks
  completedLessonCount: number; totalLessonCount: number; progressPercent: number;   // 0–100 integer
  lastLessonId: string | null;              // "Continue learning" target
  lastActivityAt: Timestamp;
  startedAt: Timestamp; completedAt: Timestamp | null;   // completedAt is set once, on the first completion
  certificateId: string | null;
  quizSummary: { [quizId: string]: { attempts: number; passed: boolean; bestPercent: number; lastPercent: number } };
  projectSummary: { [projectId: string]: { attempts: number; latestSubmissionId: string; latestStatus: SubmissionStatus } };
}
// quizSummary / projectSummary are the per-learner counters for attempts: they make attempt numbering and
// maxAttempts atomic, let completeLesson run without querying attempts, and let the class report be built
// from enrollment documents alone.

// enrollments/{enrollmentId}/lessonProgress/{lessonId}     id = lessonId; brief: progress
{
  userUid: string; courseId: string;
  status: 'in_progress' | 'completed';
  responses: { [blockId: string]: { text: string; updatedAt: Timestamp } };   // reflection and code_activity blocks; ≤ 10 000 chars each
  xpAwarded: number;
  effectsApplied: boolean;                  // false until onLessonCompleted has finished (section 9.4)
  startedAt: Timestamp; completedAt: Timestamp | null;
}

// quizAttempts/{uid}_{courseId}_{quizId}_{n}     deterministic id, n = attemptNumber; created with create()
{
  userUid: string; courseId: string; quizId: string; lessonId: string | null;
  studentName: string;                      // snapshot of displayName (lists)
  quizTitle: Localized<{ title: string }>;  // snapshot of the quiz title (lists, tutor context)
  schoolId: string | null; classId: string | null;   // snapshot of the enrollment's values at submission time
  attemptNumber: number;                    // 1-based per user + course + quiz
  locale: Locale;
  answers: { [questionId: string]: { selectedOptionIds: string[]; text: string | null } };
  results: { [questionId: string]: { correct: boolean; pointsAwarded: number } };
  score: number; maxScore: number; scorePercent: number; passed: boolean;
  xpAwarded: number;
  effectsApplied: boolean;                  // false until onQuizPassed has finished (always true for failed attempts)
  submittedAt: Timestamp;
}
```

A quiz attempt requires an enrollment. `services/assessment.submitQuizAttempt` grades the
answers and calls `data/quizzes.createAttempt`, which runs one transaction that reads the
enrollment, rejects when `quiz.maxAttempts` is reached, creates the attempt with id
`…_{attempts + 1}` and updates `quizSummary`. Two concurrent submissions cannot both
succeed: the attempt count read before the transaction is compared with the one read inside
it, and a mismatch (like a failing `create()`) is reported as `conflict`; the second
submission is never stored as attempt n + 1. The repository derives `attemptNumber`,
`lessonId`, `quizTitle`, `schoolId`/`classId` (from the enrollment), `xpAwarded`
(`quiz.xpReward` on the first passed attempt, else 0) and `effectsApplied` (`!passed`): every
passed attempt, a repeat pass included, is written `effectsApplied: false`, and
`submitQuizAttempt` runs `onQuizPassed` for **every** passed attempt (idempotent; a repeat
pass answers `xpAwarded: 0` and closes the attempt). The quiz need not be referenced by a
lesson block: an attempt at a quiz whose `lessonId` is null (editor-only content) is
accepted, stores `lessonId: null`, can reveal that quiz's key under `revealAnswers:
'after_attempt'` and earns its XP; refusing it would be one check in `services/assessment`
(`submitWork` already refuses the equivalent for projects).

`results` is the per-question key in disguise (for `true_false` one wrong attempt reveals the
answer). Students therefore receive attempts through a **student projection**: `results` is
`null` unless the quiz's reveal rule is satisfied (`after_attempt`, or `after_pass` and the
attempt passed); score, percent and `passed` are always included. The reveal rule is applied
on single reads only (`getAttempt`, `getLatestAttempt`, the lesson player); in lists
(`listRecentAttemptsForUser`, `listAttemptsForClass`) the owner's own attempts carry
`results: null` unconditionally, to avoid one quiz read per row. Teachers and other staff who
pass `canViewLearnerRecord` get the full attempt. The pure projections
`isAttemptRevealed(attempt, revealAnswers)` and `toStudentAttempt(attempt, revealAnswers)`
are exported by `data/quizzes.ts`.

#### Projects, submissions, reviews

```ts
// submissions/{id}      id = `${uid}_p_${courseId}_${projectId}_${n}` or `${uid}_c_${challengeId}_${n}`,
//                       n = attemptNumber; created with create(); brief: project_submissions AND challenge_submissions
{
  studentUid: string;
  studentName: string;                      // snapshot of displayName
  schoolId: string | null;
  classId: string | null;                   // reviewing class; null = unsupervised (no teacher)
  context: 'project' | 'challenge';
  courseId: string | null; lessonId: string | null; projectId: string | null;   // context 'project'
  challengeId: string | null;                                                    // context 'challenge'
  contextTitle: Localized<{ title: string }>;   // snapshot of the project/challenge title for lists
  attemptNumber: number;                    // 1-based per student + project/challenge; ≤ 10
  previousSubmissionId: string | null;
  title: string;                            // student's own title, ≤ 120
  description: string;                      // student's explanation, ≤ 5 000
  type: SubmissionType;                     // 'text' | 'image' | 'audio' | 'video' | 'pdf' | 'file' | 'link' | 'code'
  content: { text: string | null; linkUrl: string | null; code: string | null; codeLanguage: string | null };
  attachments: FileRef[];                   // ≤ 5; binary payloads live in Storage, metadata in files/{fileId}
  locale: Locale;                           // language the student wrote in
  status: 'submitted' | 'ai_reviewed' | 'approved' | 'returned';
  aiReviewStatus: 'pending' | 'ready' | 'failed' | 'skipped';
  latestAiReviewId: string | null;
  aiRegenerations: number;                  // ≤ 3
  rubric: { key: RubricKey; weight: number }[];   // snapshot at submission time
  finalScore: number | null;                // 0–100, set by the teacher
  finalCriteria: CriteriaScores | null;     // { creativity, technicalQuality, understanding, responsibleAi }: 0–100 each
  finalFeedback: string | null;
  reviewedByUid: string | null; reviewedAt: Timestamp | null;   // reviewedByUid null + status 'returned' = returned by the unsupervised flow
  xpAwarded: number;
  effectsApplied: boolean;                  // false from acceptance until onSubmissionAccepted has finished
  submittedAt: Timestamp;
}

// submissions/{submissionId}/reviews/{reviewId}       auto-id; brief: project_reviews
{
  reviewerUid: string; reviewerName: string;
  decision: 'approve' | 'modify' | 'return';   // approve = accept the AI suggestion as is; modify = teacher's own scores
  criteria: CriteriaScores | null; score: number | null;
  feedback: string;
  aiReviewId: string | null;                // the suggestion the teacher was looking at
  createdAt: Timestamp;
}

// submissions/{submissionId}/aiReviews/{aiReviewId}   auto-id; brief: ai_reviews
{
  status: 'ready' | 'failed';
  provider: string; model: string; promptVersion: string;
  locale: Locale;
  criteria: { [K in RubricKey]: { score: number; comment: string } } | null;   // 0–100 each
  overallSuggestedScore: number | null;     // weighted by the submission's rubric
  writtenFeedback: string | null;
  strengths: string[]; improvements: string[];
  confidence: 'low' | 'medium' | 'high' | null;
  limitations: string[];                    // e.g. "Attached video was not analysed"
  flags: AiReviewFlag[];                    // 'possible_personal_data' | 'unsafe_content' | 'off_topic'
                                            // | 'possible_plagiarism' | 'possible_prompt_injection'
  error: string | null;
  inputTokens: number; outputTokens: number;
  createdAt: Timestamp;
}

// files/{fileId}        id = UUID generated on the client (crypto.randomUUID) before upload; the document is
//                       written with create(), so registering an id that already exists fails with `conflict`
{
  ownerUid: string; schoolId: string | null;
  purpose: 'submission' | 'course_media';
  kind: FileKind;                           // 'image' | 'audio' | 'video' | 'pdf' | 'file'
  storagePath: string;                      // built on the server from the session uid, never accepted from the client:
                                            //   user-uploads/{uid}/{kind}/{fileId}/{fileName}        (submission)
                                            //   course-media/authors/{uid}/{fileId}/{fileName}       (teacher-made course)
                                            //   course-media/official/{fileId}/{fileName}            (official course)
  fileName: string; contentType: string; sizeBytes: number;   // read back from Storage by the server, not trusted from the client
  width: number | null; height: number | null;                // images only; client-measured display hints
  courseId: string | null;                  // course_media: the course the file belongs to
  submissionId: string | null;              // submission: set when attached
  createdAt: Timestamp;
}
```

Submission state machine:

```
                     ┌──────────── supervised (classId != null) ────────────┐
submit ─▶ submitted ─┤  AI review runs → aiReviewStatus: pending → ready    ├─▶ approved   (XP awarded)
                     │  teacher: approve | modify | return                  └─▶ returned   → student resubmits
                     │                                                          (new document, attemptNumber + 1)
                     └── unsupervised (classId == null), when the AI review is ready:
                           acceptable ─▶ ai_reviewed (XP awarded, no score recorded as a grade)
                           not acceptable ─▶ returned (no XP; AI feedback shown; student may resubmit)
                           review failed or skipped ─▶ stays submitted (owner may regenerate, ≤ 3 times)
```

- **One open attempt at a time.** A new submission for the same project or challenge is
  accepted only when there is no previous one or the latest one is `returned`, and only up to
  10 attempts. `approved` and `ai_reviewed` are final. `services/project-flow.submitWork`
  enforces this in the transaction that creates the document (for projects it reads
  `enrollment.projectSummary`; for challenges it reads the latest entry by query inside the
  transaction).
- In the supervised flow the student never sees the AI review; they see the teacher's
  `finalScore`, `finalCriteria` and `finalFeedback`. The teacher always has final authority
  where a teacher exists.
- In the unsupervised flow (an individual learner who is in no class) the AI feedback is
  shown, labelled as AI feedback. The submission is **acceptable** only when the AI review is
  `ready`, carries none of the flags `off_topic`, `unsafe_content`,
  `possible_prompt_injection`, and the submission has non-empty content (text, code, link or
  at least one attachment). No score is recorded as a grade.

`classId` is resolved on the server by `services/classroom.resolveClassContext(uid, courseId)`,
deterministically: (1) among the student's classes whose `assignedCourseIds` contains the
course, the one with the lowest `classId`; (2) otherwise, if the student is in any class, the
lowest `classId` of `users.classIds` (so a pupil who self-enrols in an unassigned course is
still supervised by a teacher); (3) otherwise null. For challenge submissions rule (2)
applies directly. Only users who are in no class at all are unsupervised. Archived classes
the student is still a member of take part in rules (1) and (2) (`archiveClass` keeps the
memberships, so a pupil whose only remaining class is archived stays supervised by it and
its teachers keep that pupil's new work in their review queue; excluding them would be one
`.filter((cls) => !cls.archived)` in `classroom.loadExistingClasses`); classes named in
`users.classIds` that no longer exist are skipped. The pure
`pickSupervisingClass(classes, courseId)` applies the two rules to a list of classes (lowest
id that assigns the course, else lowest id, else null). The same function sets `classId` and
`schoolId` on enrollments (the school is the supervising class's `schoolId`, or the user's
`schoolId` when the class has none or there is no class); quiz attempts copy them from the
enrollment. A teacher's own Teacher Academy enrollment does **not** go through it (for a
teacher profile `classIds` are the classes they teach, so rule 2 would make their own class
the supervising class): it is created with `classId: null` and the teacher's `schoolId`.

`classId`/`schoolId` on an enrollment and on an open (`submitted`) submission are **live**
values, kept current by `services/classroom` (3.6). On a quiz attempt and on a reviewed
submission they are **historical snapshots**: the teacher of the class in which the work was
done keeps access to that record after the student leaves the class.

#### Gamification, challenges, billing, hardware, operations

```ts
// badges/{badgeId}                          id = slug (ai-explorer, prompt-master, …)
{
  order: number; icon: string; tier: 'bronze' | 'silver' | 'gold';
  criteria: BadgeCriteria;                  // section 9.3
  xpBonus: number;                          // default 0
  isActive: boolean;
  defaultLocale: Locale;
  translations: Localized<{ name: string; description: string }>;
}

// certificates/{certificateId}              id = `${userUid}_${courseId}` (one per user per course)
{
  userUid: string;
  recipientName: string;                    // snapshot of displayName
  type: 'course';                           // 'pathway' | 'challenge' are future
  courseId: string; pathwayId: string | null;
  courseTitle: Localized<{ title: string }>;   // snapshot
  isOfficial: boolean;                      // true → carries the RoboHolic Certified mark
  schoolId: string | null; schoolName: string | null;
  issuedBy: 'system' | string /* uid */; issuerName: string;
  verificationCode: string;                 // 'RH-' + 10 random chars [A-Z2-9]; replaced on re-issue (section 9.5)
  status: 'issued' | 'revoked'; revokedReason: string | null;
  issuedAt: Timestamp; revokedAt: Timestamp | null;
}

// challenges/{challengeId}                  auto-id
{
  type: 'weekly' | 'school' | 'roboholic' | 'national' | 'hackathon';
  scope: 'global' | 'school'; schoolId: string | null;      // schoolId set when scope = 'school'
  status: 'draft' | 'published' | 'archived';               // upcoming/open/closed is derived from dates
  area: LearningArea;
  ageMin: number | null; ageMax: number | null;
  startAt: Timestamp; deadlineAt: Timestamp;
  allowedSubmissionTypes: SubmissionType[];
  rubric: { key: RubricKey; weight: number }[];
  xpReward: number;                         // default 500
  coverImage: MediaRef | null;
  hardwarePlatformIds: string[]; requiredCapabilities: HardwareCapability[];
  submissionCount: number;                  // denormalized
  createdByUid: string;
  defaultLocale: Locale;
  translations: Localized<{ title: string; description: string; submissionRequirements: string; prizes: string | null }>;
}

// subscriptions/{subscriptionId}            auto-id
{
  ownerType: 'user' | 'school'; ownerId: string;
  plan: 'individual_monthly' | 'individual_yearly' | 'school_annual' | 'course_purchase' | 'teacher_training';
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
  currentPeriodStart: Timestamp; currentPeriodEnd: Timestamp;
  courseIds: string[];                      // for course_purchase / teacher_training; [] otherwise
  provider: 'manual' | 'stripe';            // MVP: always 'manual'
  providerCustomerId: string | null; providerSubscriptionId: string | null;
  notes: string | null; createdByUid: string;
}

// licenses/{licenseId}                      auto-id
{
  schoolId: string; subscriptionId: string | null;
  name: string;
  seatsTotal: number;                       // seats used is not stored here: it is schools.counts.students (section 4.5)
  scope: { type: 'all_official' } | { type: 'pathways'; pathwayIds: string[] };
  startsAt: Timestamp; endsAt: Timestamp;
  status: 'active' | 'suspended';           // "expired" is derived: now >= endsAt
  createdByUid: string;
}

// hardwarePlatforms/{platformId}            id = slug; brand-neutral by construction
{
  kind: 'robot' | 'microcontroller' | 'sensor_kit' | 'simulator';
  vendor: string | null;                    // free text, display only; no logic depends on it
  capabilities: HardwareCapability[];       // 'drive' | 'camera' | 'distance' | 'line' | 'color' | 'imu'
                                            // | 'microphone' | 'speaker' | 'gripper' | 'display'
  programmingModes: ('blocks' | 'python' | 'javascript' | 'cpp')[];
  connectivity: ('usb' | 'bluetooth' | 'wifi' | 'none')[];
  image: MediaRef | null; isActive: boolean; order: number;
  defaultLocale: Locale;
  translations: Localized<{ name: string; description: string }>;
}

// aiUsage/{uid}_{yyyymmdd}                  deterministic id, UTC date; one counter doc per user per day
{
  scope: 'user'; uid: string; schoolId: string | null; date: string /* 'YYYY-MM-DD' */;
  tutorMessages: number; labRequests: number; reviewRequests: number;
  minuteBucket: string /* 'YYYY-MM-DDTHH:mm' */; minuteCount: number;
  inputTokens: number; outputTokens: number;
  blockedCount: number;                     // requests refused by safety checks
}
// aiUsage/school_{schoolId}_{yyyymmdd} and aiUsage/global_{yyyymmdd}      budget counters (section 8.7)
{ scope: 'school' | 'global'; schoolId: string | null; date: string; requests: number; inputTokens: number; outputTokens: number }
// Written by recordAiTokens / recordAiBlocked with set({ merge: true }): these two, and a user document they create before
// checkAndCountAiUsage ever saw it, carry updatedAt but no createdAt (section 3.1).

// uploadUsage/{uid}_{yyyymmdd}              deterministic id, UTC date; per-user upload quota (section 5.2)
{ uid: string; date: string; fileCount: number; bytes: number }

// rateLimits/{scope}_{keyHash}_{yyyymmddhh} deterministic id; fixed one-hour windows (section 10.2, rate-limit.ts)
{ scope: RateLimitScope; count: number; expiresAt: Timestamp }
// RateLimitScope = 'join_lookup' | 'join_signup' | 'join_class' | 'signup'
// keyHash = HMAC-SHA256(RATE_LIMIT_SECRET, client IP) for anonymous scopes, the uid for 'join_class'.
// No raw IP address is stored. Expired documents are removed by scripts/cleanup-uploads.ts.

// auditLogs/{logId}                         auto-id; append-only; written by data/audit.writeAudit, read only in the console
{
  actorUid: string; actorRole: Role | 'system';   // work done as the SystemActor stores 'system' in both fields
  action: AuditAction;                      // the tuple AUDIT_ACTIONS (data/audit.ts): 'user.role_changed' | 'user.status_changed' | 'user.password_reset'
                                            // | 'user.educator_verified' | 'submission.reviewed' | 'file.deleted'
                                            // | 'certificate.issued' | 'certificate.revoked' | 'license.upserted'
                                            // | 'subscription.upserted' | 'school.status_changed' | 'badge.awarded'
  targetType: string; targetId: string; schoolId: string | null;
  meta: { [key: string]: string | number | boolean | null };   // non-primitive values are dropped by writeAudit
  createdAt: Timestamp;
}

// meta/migrations                           single document
{ applied: { [migrationId: string]: Timestamp } }

// meta/seed                                 single document, written by scripts/seed/index.ts: the auto-ids the repositories
//                                           gave the demo school, licence, class and challenges, so a re-run updates them
//                                           instead of duplicating (section 11.6); denied to clients like the rest of meta/**
{ schoolId: string; licenseId: string; classId: string; challenges: { [seedId: string]: string }; updatedAt: Timestamp }
```

Courses and challenges express hardware needs as **capabilities** (`requiredCapabilities`).
A platform qualifies when its `capabilities` is a superset. `hardwarePlatformIds` is only an
optional list of recommended kits. No brand name appears in any enum, field name or rule.

Challenge phase is derived, not stored: `getChallengePhase(challenge, now)` in
`src/lib/learning/challenge-phase.ts` returns `'upcoming' | 'open' | 'closed'`, so no
scheduled job is needed. In the MVP only platform admins create challenges (including
school-scoped ones). Judging, prizes and leaderboards are future.

AI tutor conversations are **not stored**. The client keeps the visible thread in memory
and sends the last turns with each request; the server stores only the counters in
`aiUsage`.

### 3.5 Entity mapping (brief section 20 → Firestore)

| Brief entity | Lives in |
|---|---|
| users / profiles | `users/{uid}` (+ Firebase Auth account) |
| schools | `schools/{schoolId}` |
| school_memberships | `users.schoolId` + `users.role` |
| classes | `classes/{classId}` |
| class_memberships | `classes/{classId}/members/{uid}` + `users.classIds` |
| (class-course assignment) | `classes/{classId}/assignments/{courseId}` + `classes.assignedCourseIds` |
| pathways | `pathways/{pathwayId}` |
| courses, course_translations | `courses/{courseId}` (`translations` map) |
| modules, module_translations | `courses/{courseId}/modules/{moduleId}` |
| lessons, lesson_translations | `courses/{courseId}/lessons/{lessonId}` |
| lesson_blocks | `courses/{courseId}/lessons/{lessonId}/blocks/{blockId}` |
| enrollments | `enrollments/{uid}_{courseId}` |
| progress | `enrollments/{id}/lessonProgress/{lessonId}` + `enrollments.completedLessonIds` |
| quizzes, quiz_questions, quiz_options | `courses/{courseId}/quizzes/{quizId}` (`questions[]`, `options[]` embedded) + `…/private/key` |
| quiz_attempts | `quizAttempts/{uid}_{courseId}_{quizId}_{n}` (+ `enrollments.quizSummary`) |
| projects | `courses/{courseId}/projects/{projectId}` |
| project_submissions | `submissions/{id}` with `context: 'project'` (+ `enrollments.projectSummary`) |
| project_reviews | `submissions/{id}/reviews/{reviewId}` (latest decision copied onto the submission) |
| ai_reviews | `submissions/{id}/aiReviews/{aiReviewId}` |
| badges | `badges/{badgeId}` |
| user_badges | `users/{uid}/badges/{badgeId}` |
| xp_transactions | `users/{uid}/xpLedger/{entryId}` + `users.xpTotal` |
| certificates | `certificates/{uid}_{courseId}` |
| challenges | `challenges/{challengeId}` |
| challenge_submissions | `submissions/{id}` with `context: 'challenge'` |
| subscriptions | `subscriptions/{subscriptionId}` |
| licenses | `licenses/{licenseId}` |
| (added) hardware platforms | `hardwarePlatforms/{platformId}` |
| (added) file metadata | `files/{fileId}` |
| (added) AI usage and budgets | `aiUsage/{…}` |
| (added) upload quota | `uploadUsage/{uid}_{yyyymmdd}` |
| (added) rate-limit buckets | `rateLimits/{…}` |
| (added) audit trail | `auditLogs/{logId}` |
| (added) join codes | `joinCodes/{code}` |

### 3.6 Denormalized fields and their owners

Every denormalized field has exactly one owner. A field that is copied and intentionally
never updated is listed as a snapshot.

| Field | Source of truth | Kept consistent by |
|---|---|---|
| Auth custom claims `role`, `schoolId` | `users/{uid}` | `auth/claims.syncClaims`, called by `services/identity.applyIdentityChange`, the only writer of `users.role`, `schoolId` and `status` |
| `users.classIds` | `classes/*/members`, `classes.teacherUids` | `data/classes` (`addMember`, `removeMember`, `setTeachers`) in one batch; emptied by `data/classes.removeUserFromAllClasses` (system only; one transaction that deletes the user's member documents with their `studentCount` decrements, removes the uid from every `teacherUids`, archived classes included, and empties `classIds`; `ConflictError` while the user owns a non-archived class), which `provisioning.changeUserRole` calls before the identity change |
| `users.schoolId` of a student | the school that provisioned the account, or the first school class joined | `identity.applyIdentityChange`, called by `services/classroom` (`addStudentToClass` attaches, `removeStudentFromClass` detaches a self-registered student leaving their last class in the school) |
| `users.xpTotal`, `users.level`, `users.stats.{lessonsCompleted, quizzesPassed, projectsAccepted, challengesCompleted, badges}` | `users/{uid}/xpLedger`, `users/{uid}/badges` | `gamification/award.awardXp`, `awardBadge` (transaction) |
| `users.stats.coursesCompleted` | `enrollments.completedAt` | `data/enrollments.applyLessonCompletion`, in the completing transaction, only on the first transition to `completed` |
| `users.stats.certificates` | `certificates` | `gamification/certificates`: +1 on issue and re-issue, −1 on revoke |
| `schools.counts.teachers`, `schools.counts.students` | `users` (`schoolId`, `role`, `status`) | `services/provisioning` when it creates an account, and `services/identity.applyIdentityChange` on attach/detach, role change and status change (disabling a student decrements, re-enabling increments). Both decide the counter with the pure `identity.countedIn(identity)` → `{ schoolId, counter: 'students' \| 'teachers' } \| null`: only active students and teachers with a school are counted; school admins never are |
| `schools.counts.classes` | `classes` | `data/classes.createClass/archiveClass` |
| `classes.studentCount` | `members` | `data/classes.addMember/removeMember` |
| `classes.assignedCourseIds` | `assignments` | `data/classes.setAssignment/removeAssignment` |
| `classes/*/members.displayName` | `users.displayName` | `data/users.updateProfile` (fan-out over `classIds`). `members.username` and `members.ageBand` copy immutable fields and need no fan-out |
| `joinCodes/{code}` | `classes.joinCode` | `data/classes.createClass`, `regenerateJoinCode` (create new + delete old) and `archiveClass` (delete), each in the class transaction |
| `pathways.publishedCourseCount` | `courses` | `data/courses.setCourseStatus`. `updateCourse` rejects a `pathwayId` change while the course is `published` |
| `courses.moduleCount`, `courses.lessonCount`, `modules.lessonCount` | modules, lessons | `data/courses` module/lesson create and delete (transaction) |
| `lessons.blockCount`, `quizIds`, `projectIds`, `reflectionBlockIds`, `tutorExcerpt` | blocks | `data/courses` block create/update/delete/reorder (transaction) |
| `quizzes.lessonId`, `projects.lessonId` | the block that references them | the same block transaction: set on link, cleared on unlink or block delete; rejects a second block referencing an already linked quiz or project |
| `quizzes.questionCount` | `questions[]` | `data/quizzes.saveQuiz` |
| `enrollments.completedLessonIds`, counts, `progressPercent`, `status`, `completedAt` | `lessonProgress` | `data/enrollments.applyLessonCompletion` (transaction) |
| `enrollments.totalLessonCount` | `courses.lessonCount` | refreshed on every `completeLesson`; no fan-out on course edits |
| `enrollments.classId`, `schoolId`, `source` | class membership and assignments | `services/classroom`: `assignCourseToClass` and `addStudentToClass` (used by join and provisioning) create the enrollment or, when one exists with `classId: null`, merge `classId`, `schoolId`, `source: 'class'` through `upsertClassEnrollments` (one call for the whole roster; `assignCourseToClass` writes the assigning class itself, `addStudentToClass` the result of `resolveClassContext` evaluated after the roster change); `removeStudentFromClass` re-resolves every enrollment of that student with `classId == X` (`resolveClassContext`, possibly null) after the detach decision, so the enrollment gets `schoolId: null` when the student left the school |
| `submissions.classId`, `schoolId` while `status == 'submitted'` | same | the same three functions re-point the student's open submissions so pending work always sits in a live review queue: `addStudentToClass` re-points **every** open submission of the student with `classId == null` (challenge entries included, rule 2 of 3.4), each to `resolveClassContext(uid, submission.courseId)` after the roster change; `assignCourseToClass` re-points the members' open submissions of that course with `classId == null` to the assigning class; `removeStudentFromClass` re-resolves those with `classId == X`. Reviewed work is never re-pointed (`setSubmissionClassContext` is a no-op for it) |
| `enrollments.quizSummary` | `quizAttempts` | `data/quizzes.createAttempt`, in the transaction that creates the attempt |
| `enrollments.projectSummary` | `submissions` (`context: 'project'`) | `data/submissions.createSubmission`, `addReview`, `markAiReviewed`, `markAiReturned`, each in the transaction that writes the submission |
| `enrollments.certificateId` | `certificates` | `gamification/certificates`: set on issue, cleared on revoke |
| `submissions.final*`, `status` | latest `reviews` doc | `data/submissions.addReview` (transaction) |
| `submissions.latestAiReviewId`, `aiReviewStatus` | `aiReviews` | `data/submissions.saveAiReview` |
| `lessonProgress.effectsApplied`, `quizAttempts.effectsApplied`, `submissions.effectsApplied` | whether the gamification handler finished | written `false` by the transaction that completes the lesson, records a passed attempt, or accepts a submission; set `true` by the matching `on*` handler (section 9.4) |
| `challenges.submissionCount` | `submissions` | `data/submissions.createSubmission` (a student's first entry only) |
| `aiUsage/school_*`, `aiUsage/global_*` | per-user `aiUsage` docs | `data/ai-usage.recordAiTokens` (`FieldValue.increment`) |
| **Snapshots, intentionally never updated**: `submissions.studentName`, `contextTitle`, `rubric`; `quizAttempts.studentName`, `quizTitle`, `classId`, `schoolId`; `classId`/`schoolId` of reviewed submissions; `certificates.recipientName`, `courseTitle`, `schoolName` | users / quizzes / projects / courses / schools | written once; erased or anonymised only by `scripts/delete-user-data.ts` |

"Seats used" is not stored on licences. It **is** `schools.counts.students` (section 4.5).

### 3.7 Queries per screen

A repository may issue only the query shapes listed here. A new shape is added to this table
and, if it needs one, to 3.8 **before** it is written (the emulator does not enforce
composite indexes, so a missing index only fails in production).

| Screen | Queries (all through repositories) |
|---|---|
| Any authenticated page | `users/{uid}` (session) |
| Public home, `/pathways` | `pathways` where `status == 'published'` order by `order` (7 documents; an `audience` filter is applied in memory) |
| Pathway detail (public and student) | `pathways/{id}`; `courses` where `pathwayId == id` and `status == 'published'` order by `order` |
| Student Home, Student Learn | `enrollments` where `userUid == uid` order by `lastActivityAt desc` (no limit; ≤ a few dozen) → `getAll` courses and pathways. Home slices the first 6 in memory for "Continue Learning" and computes "My Pathways" from the full list. Home also reads: `submissions` where `studentUid == uid` order by `submittedAt desc` limit 3; `users/{uid}/badges` order by `awardedAt desc` limit 6; `certificates` where `userUid == uid` order by `issuedAt desc` limit 3; `challenges` where `status == 'published'` and `scope == 'global'` and `deadlineAt >= now` order by `deadlineAt` limit 3, plus the same with `schoolId == session.schoolId` **only when `session.schoolId` is not null** |
| Course detail | course outline: `courses/{id}`; `modules` order by `order`; `lessons` (all, sorted in memory by module then `order`); `enrollments/{uid}_{courseId}` |
| Lesson player | course outline (as above, `cache`d per request by `services/learning`; the lesson is taken from the outline, not read again); `blocks` order by `order`; `enrollments/{uid}_{courseId}`; `lessonProgress/{lessonId}`; `schools/{schoolId}` (for `tutorEnabled`, only when the learner has a school); for each id in `lesson.quizIds`: quiz doc + latest attempt by direct get `quizAttempts/{uid}_{courseId}_{quizId}_{quizSummary[quizId].attempts}` (only when `attempts > 0`); for each id in `lesson.projectIds`: project doc + latest submission by direct get `submissions/{projectSummary[projectId].latestSubmissionId}` (only when one exists). An unenrolled viewer costs no attempt or submission read |
| Student Projects | `submissions` where `studentUid == uid` order by `submittedAt desc` |
| Student Robotics | `courses` where `area == 'robotics'`, `status == 'published'`, `isOfficial == true` order by `order` (grouped by `tags` in memory); global challenge query filtered to `area == 'robotics'` in memory; `hardwarePlatforms` (the whole collection; `activeOnly` and `order` applied in memory) |
| Student Challenges | the two challenge queries (global; school only when `schoolId` is not null) without the `deadlineAt` filter; own entries with **one** query `submissions` where `studentUid == uid` and `context == 'challenge'` (equality only), `entered` derived in memory. Challenge detail: latest entry `submissions` where `studentUid == uid` and `challengeId == id` order by `attemptNumber desc` limit 1 |
| Achievements | `users/{uid}`; `badges` (the whole collection; `activeOnly` and `order` applied in memory); `users/{uid}/badges`; `xpLedger` order by `createdAt desc` limit 20 |
| Certificates (student) | `certificates` where `userUid == uid` order by `issuedAt desc` |
| Teacher Dashboard | `classes` where `teacherUids array-contains uid` and `archived == false` order by `name`; `submissions` where `classId in classIds` and `status == 'submitted'` order by `submittedAt` limit 5 (+ `count()`); `quizAttempts` where `classId in classIds` order by `submittedAt desc` limit 10 (rows render from the `studentName` and `quizTitle` snapshots; no user or quiz reads). **When `classIds` is empty (every new teacher) these two queries are skipped and return empty** |
| Class detail | `classes/{id}`; `members` order by `displayName`; `assignments`; `getAll` assigned courses |
| Student detail (teacher) | student summary (`users/{uid}`, reduced projection); then, **always filtered by the route's class**: `enrollments` where `classId == X` and `userUid == uid` (equality only); `quizAttempts` where `classId == X` and `userUid == uid` order by `submittedAt desc`; `submissions` where `classId == X` and `studentUid == uid` order by `submittedAt desc`; active `manual` badges and `users/{uid}/badges` for the award control |
| Teacher Courses | published official catalog by pathway; `courses` where `ownerUid == uid` order by `updatedAt desc`; `courses` where `schoolId == X` and `isOfficial == false` order by `updatedAt desc` (`listSchoolCourses`: for a **teacher** actor filtered to `visibility == 'school'` in memory; a school admin on `/school/courses` gets every non-official course of the school that `canViewCourse` allows, section 6.6; skipped when `schoolId` is null) |
| Assessments | `quizAttempts` where `classId == X` and `courseId == Y` order by `submittedAt desc` (paginated, 50); attempt detail by direct get |
| Teacher Projects (queue) | `submissions` where `classId in classIds` and `status == 'submitted'` order by `submittedAt` (skipped when `classIds` is empty); tab "All": `classId == X` order by `submittedAt desc` (paginated) |
| Review screen, student submission detail | `submissions/{id}`; `aiReviews/{latestAiReviewId}` when the viewer may see it; `reviews` order by `createdAt desc` (staff); project or challenge doc |
| Reports | `classes/{id}`; `members`; `getAll(enrollments/{uid}_{courseId})` for each member (≤ 60). All columns come from the enrollment (`progressPercent`, `quizSummary`, `projectSummary`, `certificateId`); **no attempt or submission query** |
| School Dashboard / Analytics | `schools/{id}` (teachers, students, classes and seats used come from `counts`); `count()` on `enrollments` (`schoolId`, `status`), per course (`schoolId`, `courseId`, `status`) for the union of `assignedCourseIds`; `count()` on `certificates` (`schoolId`); `licenses` where `schoolId` order by `endsAt desc` |
| School Teachers / Students | `users` where `schoolId == X` and `role == R` order by `displayName` (paginated, 50) |
| School Classes | `classes` where `schoolId == X` and `archived == false` order by `name` |
| School Certificates | `certificates` where `schoolId == X` order by `issuedAt desc` |
| Admin lists | `schools` order by `name`; `users` where `role == R` order by `createdAt desc`; `courses` where `isOfficial == true` order by `updatedAt desc`; `subscriptions` order by `currentPeriodEnd desc`; `licenses` where `schoolId` order by `endsAt desc`; `certificates` order by `issuedAt desc`; `challenges` order by `deadlineAt desc`; `submissions` where `challengeId == X` order by `submittedAt desc`; `pathways` (the whole collection, 7 documents, sorted by `order` in memory; the course editor's pathway select); unfiltered `count()` aggregations for platform analytics |
| Certificate verification | `certificates` where `verificationCode == code` limit 1 |
| Tutor context (per message) | `courses/{id}`, lesson doc, `pathways/{id}`; `quizAttempts` where `userUid == uid` order by `submittedAt desc` limit 3 (`AI_LIMITS.tutorRecentQuizResults`). No school read (the route's `checkAndCountAiUsage` already applies the school switch and the context carries nothing from the school) and no block or quiz documents (`lessons.tutorExcerpt`, `quizAttempts.quizTitle`) |
| Internal (services) | `enrollments` where `courseId == X` limit 1 (delete guard); `enrollments` where `userUid == uid` and `classId == X` (removal); `submissions` where `studentUid == uid` and `courseId == Y`, or where `studentUid == uid` order by `submittedAt desc` (`listOpenSubmissionsForStudent`, re-pointing; `status == 'submitted'` and the `classId` filter applied in memory); the first three equality only |

Optional filters never change the query shape: `includeArchived: true` is executed as
`where('archived', 'in', [false, true])`, so the same composite index serves both variants.

### 3.8 Composite indexes (`firestore.indexes.json`)

All are collection-scope. Single-field indexes are automatic. Equality-only queries on
several fields need no composite index (Firestore merges the single-field indexes).

| Collection | Fields |
|---|---|
| `users` | `schoolId ASC, role ASC, displayName ASC` |
| `users` | `role ASC, createdAt DESC` |
| `classes` | `teacherUids ARRAY_CONTAINS, archived ASC, name ASC` |
| `classes` | `schoolId ASC, archived ASC, name ASC` |
| `pathways` | `status ASC, order ASC` |
| `courses` | `pathwayId ASC, status ASC, order ASC` |
| `courses` | `ownerUid ASC, updatedAt DESC` |
| `courses` | `schoolId ASC, isOfficial ASC, updatedAt DESC` |
| `courses` | `area ASC, status ASC, isOfficial ASC, order ASC` |
| `courses` | `isOfficial ASC, updatedAt DESC` |
| `enrollments` | `userUid ASC, lastActivityAt DESC` |
| `enrollments` | `schoolId ASC, status ASC` |
| `enrollments` | `schoolId ASC, courseId ASC, status ASC` |
| `quizAttempts` | `userUid ASC, submittedAt DESC` |
| `quizAttempts` | `classId ASC, courseId ASC, submittedAt DESC` |
| `quizAttempts` | `classId ASC, submittedAt DESC` |
| `quizAttempts` | `classId ASC, userUid ASC, submittedAt DESC` |
| `submissions` | `studentUid ASC, submittedAt DESC` |
| `submissions` | `studentUid ASC, challengeId ASC, attemptNumber DESC` |
| `submissions` | `classId ASC, status ASC, submittedAt ASC` |
| `submissions` | `classId ASC, submittedAt DESC` |
| `submissions` | `classId ASC, studentUid ASC, submittedAt DESC` |
| `submissions` | `challengeId ASC, submittedAt DESC` |
| `certificates` | `userUid ASC, issuedAt DESC` |
| `certificates` | `schoolId ASC, issuedAt DESC` |
| `challenges` | `status ASC, scope ASC, deadlineAt ASC` |
| `challenges` | `status ASC, schoolId ASC, deadlineAt ASC` |
| `licenses` | `schoolId ASC, endsAt DESC` |
| `subscriptions` | `ownerType ASC, ownerId ASC, currentPeriodEnd DESC` |

No collection-group queries are used.

**Single-field index exemptions** (`fieldOverrides`, indexing disabled). Large text and map
fields are never queried; exempting them keeps writes cheap and stops their content being
stored a second time in indexes: `translations` (every collection that has it), `questions`
(quizzes), `answers`, `explanations` (quiz `private`), `tutorExcerpt` (lessons), `answers`,
`results`, `quizTitle` (quizAttempts), `responses` (lessonProgress), `quizSummary`,
`projectSummary`, `completedLessonIds` (enrollments), `content`, `description`,
`contextTitle`, `attachments`, `rubric`, `finalFeedback` (submissions), `criteria`,
`writtenFeedback`, `strengths`, `improvements` (aiReviews), `courseTitle` (certificates),
`meta` (auditLogs).

---

## 4. Roles and permissions

### 4.1 Model

- Four roles, exactly one per user: `student`, `teacher`, `school_admin`, `platform_admin`.
- **Source of truth**: `users/{uid}` (`role`, `schoolId`, `classIds`, `status`,
  `verifiedEducator`). Read on every request by `getSession()`.
- **Claims** `{ role, schoolId }` mirror the profile; nothing in the MVP depends on them
  alone (section 1.5).
- **Scopes** used by every check:
  - *Own*: `resource.userUid/studentUid/ownerUid === actor.uid`.
  - *Class*: the actor **is a teacher** and `actor.classIds` contains the resource's
    `classId`. `classIds` means "member of" for a student and "teaches" for a teacher, so
    every class check also tests the role, and `changeUserRole` empties `classIds`. Because
    `classIds` is in the session, class checks cost no extra reads.
  - *School*: `actor.schoolId !== null && actor.schoolId === resource.schoolId`.
  - *All*: `platform_admin` only.
- Hierarchy Platform → School → Teacher → Class → Student is expressed by those scopes, not
  by nested collections. Individual users have `schoolId: null` and never match a school
  scope.
- A teacher's access to a student's records is always **through a class**: per-record checks
  use the record's `classId`, and per-student list functions are filtered by a class the
  teacher teaches. A teacher of class X never sees what the same student did in another
  teacher's class or on their own.
- Never client-writable, and only ever written by the named server module: roles, school
  and status (`services/identity`, called by `services/provisioning` and
  `services/classroom`), XP/levels/badges (`gamification/award`), certificates
  (`gamification/certificates`), quiz scores (`services/assessment`), grades
  (`services/project-flow`), licences and subscriptions (`data/billing`).

### 4.2 Permissions matrix

Legend: **Own** = own records · **Class** = students/classes they teach · **School** =
their school · **All** = everything · — = not allowed.

| Capability (from the brief) | Student | Teacher | School admin | Platform admin |
|---|---|---|---|---|
| Browse published official catalog | Yes (student courses) | Yes | Yes | All |
| Enroll in / learn a course, continue lessons | Own | Own (Teacher Academy courses) | — | — |
| Read-only lesson preview | — | Courses they can view | Courses they can view | All |
| See progress | Own | Class | School | All |
| Take quizzes | Own | Own (Teacher Academy) | — | — |
| Submit projects | Own | — (Teacher Academy courses contain no project blocks) | — | — |
| Delete an uploaded attachment | Own, before review | Class | — | All |
| Use AI Tutor | Yes | Yes (in lessons) | — | — |
| Use AI Lab | Yes | — | — | — |
| Earn XP and badges (awarded by the system) | Own | Own | — | — |
| View / print certificates | Own | Own + Class | School | All |
| View challenges, submit entries | Yes | View | View | All |
| Create and manage classes | — | Own classes | School (creates a class for a teacher of the school) | All |
| Add students to a class, enable join codes | — | Class, subject to the account policy of section 1.5 | School | All |
| Reset a student's password | — | Username accounts in their Class (section 4.4) | Username accounts in School | All |
| Assign courses to classes | — | Class | School | All |
| Review quiz results | Own (answers per the quiz's reveal rule) | Class | School (read) | All |
| Review projects, see AI suggestion | — | Class | School (read, no AI suggestion) | All |
| Approve / modify / return grades, give feedback | — | Class | — | All |
| Issue certificates | — | Class (official courses: completed enrollments only) | — | All |
| Revoke certificates | — | Ones they issued | — | All |
| Create and edit own courses | — | Own | — | All |
| Award manual badges | — | Class | — | All (no UI in the MVP) |
| Manage teachers | — | — | School | All |
| Manage students | — | Class | School | All |
| School analytics, completion rates, course usage | — | — | School | All |
| View licences | — | — | School (read) | All |
| School settings | — | — | School | All |
| Manage schools | — | — | — | All |
| Change roles | — | — | Between `student` and `teacher`, inside School, never their own | All (never their own) |
| Verify educators (`verifiedEducator`) | — | — | — | All |
| Manage subscriptions and licences | — | — | — | All |
| Manage official courses, challenges | — | — | — | All |
| Manage pathways, badge definitions, hardware platforms | — | — | — | Through versioned migration scripts (no UI in the MVP) |
| Platform analytics | — | — | — | All |

### 4.3 Capabilities (UI gating)

`src/lib/auth/capabilities.ts` holds a static map used by components to show or hide
controls. It is never the security boundary.

```ts
export type Capability =
  | 'learn' | 'quiz.take' | 'project.submit' | 'tutor.use' | 'lab.use' | 'challenge.submit'
  | 'class.manage' | 'student.manage' | 'course.assign' | 'progress.view'
  | 'submission.review' | 'certificate.issue' | 'course.author'
  | 'teacher.manage' | 'school.analytics' | 'license.view' | 'school.settings'
  | 'platform.manage';
export const ROLE_CAPABILITIES: Record<Role, readonly Capability[]>;
export function hasCapability(role: Role, capability: Capability): boolean;
```

### 4.4 Authorization helper API (`src/lib/auth/authz.ts`)

```ts
// src/lib/auth/actor.ts
// Session is declared in src/types/user.ts, so that runAction and shared code can name it without importing
// lib/auth; this file re-exports it (`export type { Session } from '@/types/user'`).
export interface Session {
  uid: string; role: Role; schoolId: string | null; classIds: string[];
  displayName: string; locale: Locale; ageBand: AgeBand; avatarId: string;
  verifiedEducator: boolean;
}
export interface SystemActor { system: true; reason: string }
export type Actor = Session | SystemActor;
export const SYSTEM_ACTOR: SystemActor;                 // { system: true, reason: 'system' }; import banned in src/actions, src/app, src/components (ESLint)
export function isSystem(actor: Actor): actor is SystemActor;
export function assertSystem(actor: Actor): asserts actor is SystemActor;   // throws ForbiddenError; first line of every "system only" function

// src/lib/auth/session.ts
export const SESSION_COOKIE_NAME = '__session';
export const SESSION_LIFETIME: { student: { expiresInMs: number; persistent: false }; staff: { expiresInMs: number; persistent: true } };
                                                        // student: 12 h, browser-session cookie; staff: 24 h with Max-Age
export const getSession: () => Promise<Session | null>; // React cache()d const; null for a missing cookie, a cookie Firebase refuses,
                                                        // a missing profile, status !== 'active' or auth_time < users.sessionsValidAfter
                                                        // (section 1.5); any other failure is thrown. Never redirects.
export function assertSessionNotRevoked(): Promise<void>;   // verifySessionCookie(cookie, true); used by runAction for staff
export function requireSession(): Promise<Session>;     // pages only: redirects to /{locale}/login
export function requireRole(...roles: Role[]): Promise<Session>;   // pages only: redirects to login, or to roleHome(role) on mismatch
export function setSessionCookie(idToken: string, role: Role): Promise<void>;
export function clearSessionCookie(): Promise<void>;

// src/lib/auth/roles.ts (shared)
export function roleHome(role: Role): string;
export function safeNextPath(next: string | null | undefined, role: Role): string;   // section 1.3

// src/lib/auth/account-policy.ts (shared, pure)
export const SELF_SIGNUP_AGE_BANDS: readonly AgeBand[];         // ['13-15', '16-18', 'adult']; re-exported from lib/limits (section 10.1)
export function studentAccountPolicy(
  cls: { schoolId: string | null }, ctx: { schoolActive: boolean; ownerVerifiedEducator: boolean }, ageBand: AgeBand,
): { allowed: true; consentBasis: ConsentBasis } | { allowed: false; reason: 'school_inactive' | 'educator_not_verified' | 'under_13_requires_school' };
export type StudentAccountDecision = ReturnType<typeof studentAccountPolicy>;

// src/lib/auth/claims.ts
export function syncClaims(uid: string): Promise<void>; // copies role/schoolId from the profile to custom claims

// src/lib/auth/authz.ts — pure, synchronous predicates. A SystemActor passes every check. Two tiers: the scope tests hasRole,
// inSchool, teachesClass and teachesAnyOf are literal (false for a platform_admin, true for a SystemActor); every can* predicate
// lets a platform_admin through, except canAssignRole on the actor's own account.
export function hasRole(actor: Actor, ...roles: Role[]): boolean;
export function isPlatformAdmin(actor: Actor): boolean;
export function inSchool(actor: Actor, schoolId: string | null): boolean;      // actor.schoolId !== null && actor.schoolId === schoolId
export function teachesClass(actor: Actor, classId: string | null): boolean;   // hasRole(actor, 'teacher') && classIds.includes(classId)
export function teachesAnyOf(actor: Actor, classIds: string[]): boolean;       // teacher whose classIds intersect the given list

export function canViewUser(actor: Actor, target: UserProfile): boolean;
export function canManageUser(actor: Actor, target: UserProfile): boolean;
export function canAssignRole(actor: Actor, target: UserProfile, role: Role, schoolId: string | null): boolean;
export function canViewSchool(actor: Actor, schoolId: string): boolean;
export function canManageSchool(actor: Actor, schoolId: string): boolean;
export function canViewClass(actor: Actor, cls: SchoolClass): boolean;
export function canManageClass(actor: Actor, cls: SchoolClass): boolean;
export function canViewCourse(actor: Actor, course: Course, ctx: { enrolled: boolean }): boolean;
export function canEditCourse(actor: Actor, course: Course): boolean;
export function canViewLearnerRecord(actor: Actor, record: { userUid: string; schoolId: string | null; classId: string | null }): boolean;
export function canViewSubmission(actor: Actor, submission: Submission): boolean;
export function canReviewSubmission(actor: Actor, submission: Submission): boolean;
export function canViewAiReview(actor: Actor, submission: Submission): boolean;
export function canIssueCertificate(actor: Actor, student: UserProfile): boolean;
export function canViewCertificate(actor: Actor, certificate: Certificate): boolean;
export function canViewChallenge(actor: Actor, challenge: Challenge): boolean;

export function assertRole(actor: Actor, ...roles: Role[]): void;          // throws ForbiddenError
export function assertCan(allowed: boolean, what: string): asserts allowed; // throws ForbiddenError(what)
```

Predicate semantics (each `can*` predicate also returns `true` for a `SystemActor` and, unless
noted, for `platform_admin`; the scope tests in the first row are literal and never true for a
`platform_admin`, so a repository that must let a platform admin through uses a `can*`
predicate or `isPlatformAdmin`):

| Predicate | True when |
|---|---|
| `hasRole`, `inSchool`, `teachesClass`, `teachesAnyOf` | literal tests on the actor: `teachesClass` is true when the actor's role is `teacher` **and** `actor.classIds` contains the class (a student never passes, whatever their `classIds`); `teachesAnyOf` when a teacher's `classIds` intersect the list; `inSchool` when `actor.schoolId` is set and equal. None is true for a `platform_admin`; all are true for a `SystemActor` |
| `canViewUser` | self; `school_admin` in the target's school; `teacher` and target is a student in a class the actor teaches (teachers receive the reduced `StudentSummary`, never the full profile) |
| `canManageUser` | `school_admin` in the target's school and target is `teacher` or `student`. `teacher`: target is a student with `username !== null`, in a class the actor teaches, **and** (`target.provisionedByUid === actor.uid` **or** (`actor.schoolId !== null` and `actor.schoolId === target.schoolId`)). A teacher therefore cannot take over a pupil of another school who merely joined their class |
| `canAssignRole` | never for the actor's own account. `platform_admin`: any role. `school_admin`: `canManageUser(target)` and the new role is `student` or `teacher` and the new `schoolId === actor.schoolId`. Nobody else |
| `canViewSchool` / `canManageSchool` | any member of the school / its `school_admin` |
| `canViewClass` | `school_admin` of the class's school; a teacher in `teacherUids`; a student whose `classIds` contains it (the student sees the class name and assignments, never the roster) |
| `canManageClass` | `school_admin` of the class's school; a teacher in `teacherUids`. Required by `listMembers` and every roster function |
| `canViewCourse` | owner; published official course whose `audience` fits the role (students cannot open `audience: 'teacher'`; `ctx.enrolled` is not applied to official courses, so an unpublished or archived official course is visible to platform admins only); teacher-made course: `school_admin` of its school, teachers of its school when `visibility === 'school'`, or `ctx.enrolled` |
| `canEditCourse` | owner of a non-official course with role `teacher`; official courses: `platform_admin` only |
| `canViewLearnerRecord` (enrollments, attempts, progress) | own; teacher who `teachesClass(record.classId)`; `school_admin` `inSchool(record.schoolId)` |
| `canViewSubmission` | own; teacher who `teachesClass(submission.classId)`; `school_admin` in its school |
| `canReviewSubmission` | teacher who `teachesClass(submission.classId)` |
| `canViewAiReview` | `canReviewSubmission`, or the owner when `submission.classId === null` (unsupervised flow) |
| `canIssueCertificate` | teacher who teaches a class the student is in (`teachesAnyOf(student.classIds)`) **and** `student.role === 'student'` (on a teacher profile `classIds` means "teaches", so without the role check a teacher would pass for a co-teacher of the same class); further conditions in section 9.5 |
| `canViewCertificate` | own; `school_admin` in its school. A teacher is not decided by the predicate: `data/certificates.getCertificate` and `listCertificatesForUser` read the holder's profile and let a teacher through when `canViewUser(actor, holder)` holds (one profile read inside the repository) |
| `canViewChallenge` | published and (`scope === 'global'` or `inSchool(challenge.schoolId)`) |

Rules that are not expressible as one predicate, enforced in the named service:

- **Password reset** (`provisioning.resetStudentPassword`): `canManageUser` and
  `target.username !== null`. Email accounts recover through Firebase's reset email only.
- **Disable** (`provisioning.setUserStatus`): `canManageUser`, never one's own account
  (platform admins included), and an actor who is not a platform admin cannot set
  `'disabled'` on a student with `username === null` (a self-registered email student who
  joined one of the school's classes); they remove the student from the class instead.
- **Role change** (`provisioning.changeUserRole`): `canAssignRole`; section 10.3.
- **Class teachers** (`classroom.setClassTeachers`): `canManageClass(actor, cls)` and, for a
  school class, `canManageSchool(actor, cls.schoolId)` too (4.2 gives "Manage teachers" to
  the school, so a co-teacher cannot change the teachers of a school class; the owner of a
  school-less class and platform admins pass); every uid must be an active `teacher` with
  `schoolId === class.schoolId`; a school-less class has exactly its owner.
- **Student class page**: `data/classes.getClass` returns the full `SchoolClass`, `joinCode`
  included, to a student member (`canViewClass` grants members the class name and
  assignments); the student-facing class page must not render `joinCode`,
  `joinCodeEnabled` or `joinCodeExpiresAt`.

Usage pattern inside a repository (MUST):

```ts
export async function getSubmission(actor: Actor, submissionId: string): Promise<Submission> {
  const submission = await load(submissionId);            // throws NotFoundError
  assertCan(canViewSubmission(actor, submission), 'submission.view');
  return submission;
}
```

A failed check on a resource the actor should not know exists throws `NotFoundError`
rather than `ForbiddenError` (no existence oracle) for: users, submissions, certificates,
classes, challenges (a draft or archived challenge, or a school-scoped one of another
school) and files (`getFile` / `getOwnFiles` for a file the actor does not own). A function
whose return type includes `null` answers a hidden resource like a missing one:
`getLatestSubmission` answers `null` to a staff actor (teacher, school admin) both when no
submission exists and when the latest one sits in a class they do not teach or a school they
do not run, keeps `NotFoundError` for any other actor who may not ask about that student (a
classmate), and returns the submission to the owner, the reviewing class's teachers, the
school's admin and platform admins. Everything else answers `ForbiddenError`: in particular a
**course** the actor may not open (`data/internal-content.loadViewableCourse`, behind every
`getCourse`, `getLesson`, `listBlocks`, `getQuiz` and `getProject`) is `forbidden`, not
`not_found`, so pages handle `forbidden` for a hidden course and the services'
`not_visible → NotFoundError` mapping (`internal-common.requireCourseAccess`) is reached only
when the course itself was readable; and `getEnrollment` / `getLatestAttempt` distinguish
"none" (`null`) from "exists but not yours to see" (`ForbiddenError`) for a teacher or school
admin.

`tests/unit/authz.test.ts` covers, at minimum: a student promoted to teacher does not pass
`teachesClass` for the classes they were a member of; a teacher cannot manage a student of
another school; a school admin cannot assign `school_admin`, `platform_admin` or another
school; nobody can change their own role.

### 4.5 Course access and licensing (`src/lib/services/access.ts`)

```ts
export type CourseAccess =
  | { allowed: true; via: 'free' | 'license' | 'subscription' | 'owner' | 'staff_preview' | 'class_assignment' }
  | { allowed: false; reason: 'not_visible' | 'license_required' };
export function getCourseAccess(actor: Actor, course: Course): Promise<CourseAccess>;
```

1. `canViewCourse` must hold, else `not_visible`.
2. The owner and platform admins are always allowed (`owner`, `staff_preview`).
3. `accessTier: 'free'` → allowed, with no further reads. Teacher-made courses are always
   `free`. Staff who are not enrolling get `via: 'staff_preview'` (read-only player);
   teachers enroll for real in `audience: 'teacher'` courses.
4. `accessTier: 'premium'` → allowed when the user's school has a licence with
   `status === 'active'`, `startsAt <= now < endsAt` and a scope covering the course
   (`all_official`, or `pathways` containing `course.pathwayId`), or the user owns a
   subscription with `status in ('trialing','active')`, `now < currentPeriodEnd`, and plan
   `individual_*` (all premium student courses) or `courseIds` containing the course.
   **This applies to staff too**: a teacher or school admin can preview or assign a premium
   course only when their school holds a covering licence (or the teacher owns a covering
   subscription). A self-registered teacher gets no premium content.
5. **Seats are informational in the MVP.** Seats used = `schools.counts.students`; seats
   total = the sum of `seatsTotal` over the school's active, unexpired licences. The school
   and admin licence pages show used / total and a warning when used exceeds total. Adding a
   student is **not** blocked: the commercial rule for an over-limit school is not defined
   yet (section 12), and a hard stop would interrupt a class. `licenses` has no `seatsUsed`
   field.

Answers in detail: a `SystemActor` gets `{ allowed: true, via: 'staff_preview' }`. For a free
course a school admin, and a teacher on a course whose `audience` is not `'teacher'`, get
`'staff_preview'`; a teacher-made course is checked for the actor's enrollment (one read)
only when `canViewCourse` fails without it. `'class_assignment'` is answered for a student
who holds no covering licence or subscription but whose non-archived class has the premium
course assigned (archived classes are ignored here). The pure `licenseCovers(license,
course, now)` and `subscriptionCovers(subscription, course, now)` are exported for tests.
Services turn a refusal into an error with `internal-common.requireCourseAccess`:
`license_required` → `LicenseRequiredError` (action code `license_required`), `not_visible`
→ `NotFoundError` (reachable only when the course was readable, section 4.4).

All seeded demo courses are `free`, so steps 4 and 5 read nothing in the demo and the MVP is
fully usable with no billing data.

---

## 5. Security Rules plan

The Next.js server uses the Admin SDK, which bypasses rules. Rules therefore protect
against a stolen client config, a compromised browser session, or a future feature that
uses the client SDK. They are written deny-by-default, with **no client write anywhere in
Firestore** and narrow reads that mirror section 4. They are tested in `tests/rules/`.

Rules do **not** trust custom claims for role, school or status. An ID token keeps its
claims for up to an hour after a demotion or a disable, while the server acts on the profile
immediately; rules that trusted claims would be wider than the server for that hour. Both
rule files therefore read the caller's profile document.

### 5.1 Firestore (`firestore.rules`)

Helper functions: `signedIn()`, `uid()`, `profile()`
(`get(/databases/$(database)/documents/users/$(request.auth.uid)).data`), `active()`
(`signedIn() && profile().status == 'active'`), `role()` (`profile().role`), `school()`
(`profile().schoolId`), `isPlatformAdmin()` (`active() && role() == 'platform_admin'`),
`isSchoolAdminOf(schoolId)` (`active() && role() == 'school_admin' && schoolId != null &&
school() == schoolId`), `isSelf(userId)`.

Every `match` has `allow write: if false;`. Reads:

| Path | `allow read` when |
|---|---|
| `users/{uid}` | `isSelf(uid)` or `isPlatformAdmin()` or `isSchoolAdminOf(resource.data.schoolId)` |
| `users/{uid}/badges/{id}`, `users/{uid}/xpLedger/{id}` | `isSelf(uid)` or `isPlatformAdmin()` |
| `schools/{schoolId}` | (`active()` and `school() == schoolId`) or `isPlatformAdmin()` |
| `classes/{classId}` | (`active()` and `role() == 'teacher'` and `uid() in resource.data.teacherUids`) or `isSchoolAdminOf(resource.data.schoolId)` or `isPlatformAdmin()` |
| `classes/{classId}/members/{memberUid}` | `isSelf(memberUid)` or the parent-class condition (via `get()`) |
| `classes/{classId}/assignments/{courseId}` | the parent-class condition, or `exists(members/uid())` |
| `joinCodes/{code}` | never |
| `pathways/{id}` | `resource.data.status == 'published'` (public) or `isPlatformAdmin()` |
| `courses/{courseId}` (the catalog card) | (`status == 'published'` and `isOfficial == true`) or `resource.data.ownerUid == uid()` or `isSchoolAdminOf(resource.data.schoolId)` or `isPlatformAdmin()` or `exists(enrollments/{uid()_courseId})` |
| `courses/{courseId}/modules/**`, `lessons/**` (incl. `blocks`), `quizzes/{quizId}`, `projects/**` (the content) | `active()` and, on the parent course (via `get()`): owner, or `isPlatformAdmin()`, or `exists(enrollments/{uid()_courseId})`, or (`status == 'published'` and `isOfficial == true` and `accessTier == 'free'` and (`audience == 'student'` or `role() != 'student'`)). Premium content is never readable without an enrollment, matching `getCourseAccess` |
| `courses/{courseId}/quizzes/{quizId}/private/{doc}` | **never** (answer keys are server-only) |
| `enrollments/{id}` | `resource.data.userUid == uid()` or `isSchoolAdminOf(resource.data.schoolId)` or `isPlatformAdmin()` |
| `enrollments/{id}/lessonProgress/{lessonId}` | `resource.data.userUid == uid()` or `isPlatformAdmin()`. No school-admin branch: the documents hold reflections and carry no `schoolId` |
| `quizAttempts/{id}` | `isSchoolAdminOf(resource.data.schoolId)` or `isPlatformAdmin()`. **Not the owner**: `results` would reveal the answer key; students get the projection of section 3.4 from the server |
| `submissions/{id}` | `resource.data.studentUid == uid()` or `isSchoolAdminOf(resource.data.schoolId)` or `isPlatformAdmin()` |
| `submissions/{id}/reviews/{id}` | `isPlatformAdmin()` (students read the decision from the submission document) |
| `submissions/{id}/aiReviews/{id}` | `isPlatformAdmin()` only |
| `files/{id}` | `resource.data.ownerUid == uid()` or `isPlatformAdmin()` |
| `badges/{id}`, `hardwarePlatforms/{id}` | `signedIn()` |
| `certificates/{id}` | `resource.data.userUid == uid()` or `isSchoolAdminOf(resource.data.schoolId)` or `isPlatformAdmin()` |
| `challenges/{id}` | `active()` and `status == 'published'` and (`scope == 'global'` or `schoolId == school()`), or `isPlatformAdmin()` |
| `subscriptions/{id}` | (`ownerType == 'user'` and `ownerId == uid()`) or (`ownerType == 'school'` and `isSchoolAdminOf(ownerId)`) or `isPlatformAdmin()` |
| `licenses/{id}` | `isSchoolAdminOf(resource.data.schoolId)` or `isPlatformAdmin()` |
| `aiUsage/**`, `uploadUsage/**`, `rateLimits/**`, `auditLogs/**`, `meta/**` | never |
| anything else | never (`match /{document=**} { allow read, write: if false; }`) |

Teacher access to their students' records is deliberately **not** expressed in rules: it
depends on class intersection, which rules cannot check cheaply. Teachers reach that data
only through the server. This is the narrowest safe default; a future realtime feature
that needs it would add a `teacherUids` array to the affected documents first.

### 5.2 Storage (`storage.rules`)

Three prefixes. Everything else is denied. Storage rules read the caller's profile with the
cross-service function `firestore.get(/databases/(default)/documents/users/$(request.auth.uid))`
(`activeProfile()` below = that document exists and has `status == 'active'`). A Firebase
Auth account without an active profile (anyone can create one with the public web config)
can therefore upload nothing. On a real project the cross-service call needs the project's
Cloud Storage service agent
(`service-<project-number>@gcp-sa-firebasestorage.iam.gserviceaccount.com`) to hold
`roles/firebaserules.firestoreServiceAgent`: `firebase deploy` offers to grant it ("Cloud
Storage for Firebase needs an IAM Role to use cross-service rules. Grant the new role?"),
and without it every upload is denied. The emulators need nothing.

| Path | Read | Create | Update / delete |
|---|---|---|---|
| `user-uploads/{uid}/{kind}/{fileId}/{fileName}` (learner work) | **never**. Everyone, the owner included, gets the file from `/api/files/{fileId}` after server authorization, so no permanent download URL can be minted | `request.auth.uid == uid` and `activeProfile()`; `kind` is one of `image`, `audio`, `video`, `pdf`, `file` with that kind's content types and size limit; `fileId.matches('^[0-9a-f-]{36}$')`; `fileName.matches('^[A-Za-z0-9._-]{1,100}$')`; `resource == null` (no overwrite) | never (server only) |
| `course-media/authors/{uid}/{fileId}/{fileName}` (media of teacher-made courses) | **never**. Served through `/api/files/{fileId}` after `getCourseAccess`, so a private course's media is as private as the course | `request.auth.uid == uid` and `activeProfile()` with `role in ['teacher','platform_admin']`; same `fileId`/`fileName` patterns; content type and size of one of the five kinds; `resource == null` | never (server only) |
| `course-media/official/{fileId}/{fileName}` (media of official courses) | public (curriculum media published by RoboHolic; no learner data) | `activeProfile()` with `role == 'platform_admin'`; same patterns and limits; `resource == null` | never (server only) |

Every create in the three rows also requires `!fileName.matches('^[.]+$')` (a name made only
of dots is refused, as `fileNameSchema` and `sanitizeFileName` do) and compares
`request.resource.contentType` exactly (no parameters: a `text/plain; charset=utf-8` upload is
refused; `upload-client.uploadContentType` sends the bare type). The
`application/octet-stream` rule matches the `.sb3` / `.ipynb` extension case-insensitively
(`maze.SB3` is accepted), as `storage-paths.isAllowedContentType` does.

Upload validation limits, enforced three times: client (`UPLOAD_LIMITS` in
`src/lib/firebase/storage-paths.ts`, for UX; `UPLOAD_LIMITS.file.contentTypes` does not list
`application/octet-stream`: the extension rule lives in `isAllowedContentType(kind,
contentType, fileName)`, `checkUpload(kind, { contentType, sizeBytes, fileName })` →
`'file_type_not_allowed' | 'file_too_large' | null` and `uploadContentType(kind, fileName,
declaredType)`), Storage rules (`request.resource.size`, `request.resource.contentType`),
and the server (`project-flow.registerUpload`, which validates the stored object with
`checkUpload`, never with `contentTypes.includes()`).

| Submission type | Stored as | Allowed content types | Max size |
|---|---|---|---|
| `text` | Firestore `content.text` | — | 20 000 characters |
| `code` | Firestore `content.code` | — | 100 000 characters |
| `link` | Firestore `content.linkUrl` | `https:` URLs only, ≤ 2 000 chars | — |
| `image` | Storage, kind `image` | `image/png`, `image/jpeg`, `image/webp`, `image/gif` | 10 MB |
| `audio` | Storage, kind `audio` | `audio/mpeg`, `audio/mp4`, `audio/wav`, `audio/ogg`, `audio/webm` | 25 MB |
| `video` | Storage, kind `video` | `video/mp4`, `video/webm`, `video/quicktime` | 100 MB |
| `pdf` | Storage, kind `pdf` | `application/pdf` | 20 MB |
| `file` | Storage, kind `file` | `application/zip`, `text/plain`, `text/csv`, `application/json`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `…presentationml.presentation`, `…spreadsheetml.sheet`, `application/x.scratch.sb3`, `application/octet-stream` only with extension `.sb3` or `.ipynb` | 25 MB |

**Registration** (`services/project-flow.registerUpload`, called by `registerUploadAction`
after the browser upload finishes) is the server's half of every upload:

0. `assertRole(student, teacher, platform_admin)` (the roles of 10.4; a school admin gets
   `forbidden`); `purpose: 'course_media'` additionally needs role `teacher` or
   `platform_admin`.
1. zod-validate `fileId` (UUID), `kind`, `fileName` (same pattern as the rules; a name made
   only of dots is refused, section 10.1).
2. Build the storage path **from the session uid** (and, for course media, from the course:
   `canEditCourse` must hold; the official prefix is used only when the course is official
   and the actor is a platform admin, so a platform admin's upload for a teacher-made course
   lands under `course-media/authors/{adminUid}`). A platform admin may also register
   official media with `courseId: null` (challenge covers); for anyone else `courseId: null`
   is `forbidden`. A path is never accepted from the client.
3. Read the object's real metadata with the Admin SDK (`statObject`; `not_found` when no
   object exists at the built path); delete the object and fail with `validation`
   (`fieldErrors.file: ['file_type_not_allowed' | 'file_too_large']`) when its content type
   or size does not comply (`checkUpload`).
4. Check and count the per-user daily quota in `uploadUsage` (`UPLOAD_QUOTAS`: students 30
   files and 300 MB per day; staff 100 files and 2 GB); delete the object and fail with
   `rate_limited` (`retryAfterSeconds: null`) when exceeded. This runs before the token
   removal so that an object the quota rejects is deleted without being touched twice.
5. Remove the object's `firebaseStorageDownloadTokens` metadata, so no token URL exists (a
   no-op on the Storage emulator, which keeps tokens outside object metadata; integration
   tests must not assert on it).
6. Write `files/{fileId}` with `create()`; an existing id fails with `conflict` (a file
   record can never be overwritten by re-registering its id; the object is left in place).
   `width`/`height` are stored only for `kind: 'image'`.

Objects that were uploaded but never registered, and registered submission files never
attached to a submission, are deleted after 24 hours by `scripts/cleanup-uploads.ts`
(idempotent; run on a schedule, section 12).

**Deletion**: `project-flow.deleteAttachment` removes, in this order, the `FileRef` on the
submission (`removeAttachment`), the `files` document (`deleteFile`) and the Storage object
(`deleteObject`, skipped when the record was already gone). Allowed for the owner while the
submission is `submitted`, and for staff who pass `canReviewSubmission` (platform admins
included) at any time; any other viewer gets `forbidden`, a submission the actor cannot view
or a `fileId` that is not on the submission `not_found`. The audit entry `file.deleted`
(meta `{ submissionId, studentUid }`) is written only when the actor is not the owner.

Additional rules: at most 5 attachments per submission; file names are sanitised to
`[A-Za-z0-9._-]`, ≤ 100 chars, on the client and checked by the rules and the server; SVG,
HTML and executables are never accepted; downloads are served with
`Content-Disposition: attachment` except images, audio, video and PDF, which may render
inline in sandboxed elements; uploaded HTML is never rendered. Content types are declared by
the browser and can be spoofed, so nothing uploaded is ever executed or embedded as a
document. Malware scanning is future (section 12).

---

## 6. Routes

All pages live under `src/app/[locale]/`. URLs below omit the locale prefix and the route
groups in parentheses. Every folder with a `page.tsx` that fetches data also has
`loading.tsx`; each area has `error.tsx` and `not-found.tsx`. For the student and teacher
areas the three files live in `(shell)/` (so they render inside `AppShell`), `(player)/` has
its own bare full-page `loading.tsx` and `error.tsx`, and `student/not-found.tsx` /
`teacher/not-found.tsx` sit bare at the area root, because `notFound()` on a player path
resolves there; `school/` and `admin/` carry the three at the area root; `[locale]/` itself
has `error.tsx` and `not-found.tsx` but no `loading.tsx` (section 1.3).

### 6.1 Public — group `(public)`, `PublicShell`

| URL | Purpose |
|---|---|
| `/` | Homepage: hero, three entrances, Learning Pathways (from DB), AI + Robotics, Teacher Academy, How It Works, Project-Based Learning, For Schools, Call to Action. Entrance targets: Students → `/signup?role=student`; Teachers → `/signup?role=teacher`; Schools → the "For Schools" section (`/#schools`), whose button is a `mailto:` to `NEXT_PUBLIC_CONTACT_EMAIL` (schools are created by a platform admin; there is no school self sign-up) |
| `/pathways` | All published pathways |
| `/pathways/[pathwayId]` | Pathway detail with its published courses. There is no public course page: each `CourseCard` links to `/login?next=/student/learn/courses/{courseId}` |
| `/verify/[code]` | Certificate verification (redacted: course, issue date, issuer, status; no learner name) |
| `/privacy`, `/terms` | Legal pages (text from messages; owner supplies final copy) |

### 6.2 Auth — group `(auth)`, `AuthShell`

| URL | Purpose |
|---|---|
| `/login` | Email-or-username + password. Signed-in users are redirected to `roleHome(role)`. Honours `next` through `safeNextPath`. On `email_unverified` it sends a verification email and shows `/verify-email` |
| `/signup` | Self sign-up: student 13+ or teacher (email, password, display name, age band). Ends on `/verify-email` |
| `/verify-email` | "Check your inbox" notice with a resend button. The link in the email is handled by Firebase Auth; afterwards the user signs in on `/login` |
| `/join` | Class code → (not signed in) create a username account in that class when the class allows it (section 1.5), or → (signed in as a student) join the class |
| `/forgot-password` | Sends Firebase Auth's built-in reset email (email accounts only; username accounts are told to ask their teacher) |

### 6.3 Shared authenticated — group `(shared)`

| URL | Purpose |
|---|---|
| `/certificates/[certificateId]` | Printable certificate (browser print to PDF). Visible to the holder and to staff allowed by `canViewCertificate` |
| `/preview/[courseId]/lessons/[lessonId]` | Read-only lesson player for school admins and platform admins (`requireRole('school_admin', 'platform_admin')`; `getCourseAccess` must allow). Linked from the school course list and the official course editor |

### 6.4 Student — `/student`, role `student`

Navigation (exactly as the brief): **Home, Learn, AI Lab, Robotics, Challenges, Projects,
AI Tutor**. Profile menu: **Achievements, Certificates, Settings**.

| Nav item | URL | Purpose |
|---|---|---|
| Home | `/student` | Welcome, Continue Learning, My Pathways, Recent Projects, XP, Badges, Certificates, Upcoming Challenges, AI Tutor shortcut |
| Learn | `/student/learn` | My courses + pathway catalog |
| | `/student/learn/pathways/[pathwayId]` | Pathway with courses and own progress |
| | `/student/learn/courses/[courseId]` | Course detail: modules, lessons, enroll / continue |
| | `/student/learn/courses/[courseId]/lessons/[lessonId]` | Lesson player (`(player)` group, `LessonShell`) |
| AI Lab | `/student/ai-lab` | Tool cards |
| | `/student/ai-lab/[toolId]` | Tool workspace (Text AI live; others mock interface) |
| Robotics | `/student/robotics` | AI Robotics Courses, Robot Challenges, Vision / Sensor / Autonomous projects, supported hardware |
| Challenges | `/student/challenges` | Challenge Arena list by phase |
| | `/student/challenges/[challengeId]` | Detail + submit entry |
| Projects | `/student/projects` | My submissions and their status |
| | `/student/projects/[submissionId]` | Submission detail, feedback, resubmit |
| AI Tutor | `/student/tutor` | Full-page Robo AI |
| Achievements | `/student/achievements` | Level, XP history, badges |
| Certificates | `/student/certificates` | My certificates (links to the printable view) |
| Settings | `/student/settings` | Display name, avatar, language, join a class |

### 6.5 Teacher — `/teacher`, role `teacher`

Navigation: **Dashboard, Classes, Courses, Create, Assessments, Projects, Reports**.
User menu: Settings.

| Nav item | URL | Purpose |
|---|---|---|
| Dashboard | `/teacher` | Classes overview, pending reviews, recent quiz results |
| Classes | `/teacher/classes` | List + create class |
| | `/teacher/classes/[classId]` | Roster (shows how each student joined), join code (enable for 24 h, regenerate), add students, assigned courses |
| | `/teacher/classes/[classId]/students/[studentUid]` | One student's progress, attempts and submissions **in this class**; reset password; award a manual badge |
| Courses | `/teacher/courses` | Official catalog, Teacher Academy, school courses, own courses |
| | `/teacher/courses/[courseId]` | Course detail, assign to class, enroll (Teacher Academy), preview |
| | `/teacher/courses/[courseId]/lessons/[lessonId]` | Lesson player: learning in an enrolled Teacher Academy course, read-only preview otherwise (decided by the server, section 7.6) |
| Create | `/teacher/create` | My authored courses + new course |
| | `/teacher/create/[courseId]` | Course editor: details, modules, lessons, publish |
| | `/teacher/create/[courseId]/lessons/[lessonId]` | Lesson block editor |
| | `/teacher/create/[courseId]/quizzes/[quizId]` | Quiz editor |
| | `/teacher/create/[courseId]/projects/[projectId]` | Project / assignment editor |
| Assessments | `/teacher/assessments` | Quiz results by class and course |
| | `/teacher/assessments/[attemptId]` | One attempt, question by question |
| Projects | `/teacher/projects` | Review queue + all submissions |
| | `/teacher/projects/[submissionId]` | Review screen: work, AI suggestion, approve / modify / return, delete an attachment |
| Reports | `/teacher/reports` | Class × course progress grid, issue certificates |
| | `/teacher/settings` | Profile, language, own certificates |

### 6.6 School admin — `/school`, role `school_admin`

Navigation: **Dashboard, Teachers, Students, Classes, Courses, Analytics, Certificates,
Licenses, Settings**.

| Nav item | URL | Purpose |
|---|---|---|
| Dashboard | `/school` | Headline numbers, licence status (seats used / total), recent activity |
| Teachers | `/school/teachers` | List, create (then sends the password-reset email from the browser), disable teachers |
| Students | `/school/students` | List, disable, reset password (username accounts) |
| Classes | `/school/classes` | All classes; create a class for a teacher of the school |
| | `/school/classes/[classId]` | Roster, teachers, assigned courses, add students |
| Courses | `/school/courses` | Official catalog + courses authored in the school, with usage; link to the read-only preview |
| Analytics | `/school/analytics` | Completion rates, course usage, activity |
| Certificates | `/school/certificates` | Certificates issued to the school's users |
| Licenses | `/school/licenses` | Licences, seats used / total, dates (read-only) |
| Settings | `/school/settings` | School profile, default language, AI and join-code switches |

### 6.7 Platform admin — `/admin`, role `platform_admin`

Navigation (not specified by the brief; kept to what the MVP needs): **Dashboard, Schools,
Users, Subscriptions, Courses, Certificates, Challenges**. Pathways, badge definitions and
hardware platforms are reference data edited through migration scripts in the MVP; their
admin pages are future.

| Nav item | URL | Purpose |
|---|---|---|
| Dashboard | `/admin` | Platform analytics (counts) |
| Schools | `/admin/schools`, `/admin/schools/[schoolId]` | Create/suspend schools, school detail with users, licences |
| Users | `/admin/users` | List by role, change role, disable, verify educators |
| Subscriptions | `/admin/subscriptions` | Subscriptions and licences (manual entry) |
| Courses | `/admin/courses`, `/admin/courses/[courseId]`, `…/lessons/[lessonId]`, `…/quizzes/[quizId]`, `…/projects/[projectId]` | Official course authoring (same editor components as `/teacher/create`); link to the read-only preview |
| Certificates | `/admin/certificates` | List, issue, revoke |
| Challenges | `/admin/challenges` | Create and publish challenges, list entries |

### 6.8 Navigation config (`src/lib/navigation/nav-config.ts`)

```ts
export interface NavItem { key: string; href: string; icon: string /* lucide name, one of ICON_NAMES (section 7.4) */ }
export const NAV_ITEMS: Record<Role, NavItem[]>;      // order = display order above
export const PROFILE_ITEMS: Record<Role, NavItem[]>;  // student: achievements, certificates, settings; teacher: settings;
                                                      // school_admin and platform_admin: [] (school Settings is a main item,
                                                      // the platform admin has no settings page)
export function roleHome(role: Role): string;         // re-exported from auth/roles: '/student' | '/teacher' | '/school' | '/admin'
export function isNavItemActive(pathname: string, item: NavItem, role: Role): boolean;
                                                      // pathname locale-less (usePathname()); a role's home item matches its own
                                                      // page only, every other item its page and the pages below it
```

Labels come from the `nav` namespace: `nav.<role>.<key>` with keys
`home, learn, aiLab, robotics, challenges, projects, tutor, achievements, certificates,
settings, dashboard, classes, courses, create, assessments, reports, teachers, students,
analytics, licenses, schools, users, subscriptions`. `tests/unit/nav-config.test.ts` checks
`NAV_ITEMS` and `PROFILE_ITEMS` item for item against the brief's lists and 6.7, that every
`href` lies inside `roleHome(role)`, that every item has `nav.<role>.<key>` in both locales,
and `isNavItemActive`.

### 6.9 Route handlers

| Handler | Contract |
|---|---|
| `POST /api/ai/tutor` | Body `TutorRequest` (section 8.3). `Origin` must be present and equal to the host. Auth with `getSession()` (**not** `requireSession`: a route handler answers JSON, it never redirects). Roles `student`, `teacher` only. Success: `200 application/x-ndjson; charset=utf-8`, one `TutorStreamEvent` per line (section 8.3). Errors: JSON `{ error: { code: ActionErrorCode; retryAfterSeconds?: number } }` with `400 validation`, `401 unauthenticated`, `403 forbidden`, `429 rate_limited` (carries `retryAfterSeconds`) |
| `GET /api/files/[fileId]` | No `Origin` check (section 1.4). Loads `files/{fileId}`; allows the owner; anyone passing `canViewSubmission` on `file.submissionId`; for `purpose: 'course_media'`, anyone for whom `getCourseAccess` allows `file.courseId` (or who passes `canEditCourse`). Responds through `storage-admin.serveFile(storagePath, { inline })`: a `302` to a V4 signed URL valid 10 minutes in production (the object is not read); on the emulator, where URLs cannot be signed, the whole object is streamed by the handler with no `Range` support (seeking in an uploaded video does not work locally) and `serveFile` throws `NotFoundError` for a missing object, which the handler maps to `404`. Headers: `Cache-Control: private, no-store`, `Referrer-Policy: no-referrer`. `404` when the file does not exist or the caller is not allowed |

Everything else is a server action. Session creation and sign-out are server actions
(`createSessionAction`, `signOutAction` in `actions/session.ts`), not route handlers.

---

## 7. Component architecture

### 7.1 Rules

- Server components by default. A file is a client component (`'use client'`) only when it
  needs state, effects, browser APIs or event handlers.
- Three tiers, each importing only from tiers above it in this list:
  `components/ui` (primitives) → `components/domain` (presentational, typed by domain
  types) → feature folders (`components/lesson`, `components/quiz`, …: containers that call
  server actions). `components/layout` sits beside `domain` and imports from `ui` and
  `domain` only.
- Components never import from `src/lib/data`, `src/lib/services` or `firebase-admin`.
  Pages fetch; components render. Forms import their input types from `src/types/inputs.ts`
  and their zod schemas from `src/lib/schemas/*` (both shared, neither is `server-only`).
- After a successful server action, the client container calls `router.refresh()`
  (section 1.4).
- No component exceeds roughly 200 lines; split by responsibility.
- Every list has an `EmptyState`; every async route segment has `loading.tsx` built from
  `Skeleton`; every action failure surfaces as a `Toast` or inline `Alert`.
- Accessibility baseline: semantic landmarks, visible focus ring, labels bound to inputs,
  WCAG AA contrast, full keyboard operation, `prefers-reduced-motion` respected, native
  `<dialog>` for `Dialog`.
- No headless UI library and no positioning library is added. `DropdownMenu` and `Tooltip`
  do not use the top layer or CSS anchor positioning (not available in every school
  browser): each renders its panel as an absolutely positioned child of a
  `position: relative` wrapper around the trigger (`top: 100%` — Tailwind `top-full`, identical
  to `inset-block-start: 100%` in horizontal writing modes — and `inset-inline-end: 0` for
  menus, or `inset-inline-start: 0` with `align: 'start'`; above the trigger for tooltips),
  which works in every browser and in RTL. Neither detects collisions: pick `align` for a
  trigger near a screen edge. `DropdownMenu` closes on Escape, outside click and focus
  leaving it, supports arrow-key navigation, is labelled by its trigger and scrolls when
  long; `Tooltip` shows on hover and on keyboard focus (not on a mouse click) and is linked
  with `aria-describedby`. `Dialog` intercepts Escape (`cancel` is always prevented) and
  routes it to the owner's `onClose`, so the dialog closes only when the owner sets
  `open={false}`. Menus are used only in the top bar and in page headers; table rows
  use inline buttons, so a menu is never clipped by a horizontally scrolling table.
- `cn()` (`src/lib/utils.ts`) joins class names and does not merge Tailwind utilities; two
  utilities for the same property resolve by the generated CSS order, not by their order in
  the class list. A `className` passed to a primitive must not set a property the primitive
  already sets (text colour on `Button`, radius on `Card`, padding on `CardBody`); `Skeleton`
  is the one exception (a `rounded-*` class replaces its default radius). A non-wrapping flex
  row wider than 375 px inside a grid cell widens the whole grid column on phones: such rows
  get `flex-wrap` or `min-w-0`.
- The one place the kit calls a server action: `components/layout/sign-out.tsx` imports
  `signOutAction` from `actions/session.ts` (a foundation-owned file) and loads
  `lib/auth/client` with a dynamic import for the best-effort client sign-out.

### 7.2 Design tokens (`src/app/globals.css`, Tailwind v4 `@theme`)

`--color-brand-{50…900}` (indigo-violet), `--color-accent-{50…900}` (cyan),
`--color-surface`, `--color-surface-muted`, `--color-border`, `--color-ink`,
`--color-ink-muted`, `--color-success`, `--color-warning`, `--color-danger`,
`--radius-card: 1rem`, `--radius-control: 0.625rem`, `--shadow-card`,
`--font-sans` (Inter via `next/font`; an Arabic face is added with the `ar` locale).
Font wiring (MUST): `[locale]/layout.tsx` loads Inter with `variable: '--font-inter'` and
puts that variable class on `<html>`; `--font-sans` is `var(--font-inter, ui-sans-serif)`
followed by the system stack, so documents without the font (the global `not-found.tsx`)
still render in a sans face. Inter comes from `next/font/google` (subsets `latin` and
`latin-ext`): the files are downloaded when the app is built and served from the app's own
origin (`font-src 'self'`), so a build on a machine that has never built before needs
network access to Google Fonts. The same layout sets the document metadata from
`common`: the title is `{ default: appName, template: '%s · ' + appName }` and the
description is `common.description`, so a page exports only its own short title
(`title: t('title')`). `globals.css` also sets the page background and text colour, a
visible `:focus-visible` ring and the `prefers-reduced-motion` reset, and limits Tailwind's
class detection to `src/` (`@import 'tailwindcss' source('..')`), so every file that uses
utilities must live under `src/`. `[locale]/layout.tsx` imports `globals.css`.
Style: generous whitespace, rounded cards, one subtle brand gradient for hero and progress
surfaces, no mascots or cartoon styling. The same components serve all ages; age only
changes copy tone and tutor behaviour.

### 7.3 UI primitives (`src/components/ui`)

`Button` (`variant: 'primary' | 'secondary' | 'ghost' | 'danger'`, `size: 'sm' | 'md' | 'lg'`,
`loading`, `asChild` not supported — use `LinkButton`), `LinkButton`, `IconButton`
(requires `aria-label`), `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`,
`Label`, `FormField` (label + control + hint + error), `Card` (`Card`, `CardHeader`,
`CardBody`, `CardFooter`), `Chip`, `Avatar` (`{ avatarId: string; size? }`: renders one of
the built-in inline-SVG avatars; unknown ids fall back to `DEFAULT_AVATAR_ID`), `Logo`
(inline SVG wordmark), `ProgressBar`, `ProgressRing`, `Tabs`, `Dialog`, `DropdownMenu`,
`Tooltip`, `Toast` (`ToastProvider`, `useToast()`), `Table`, `Pagination`, `Skeleton`,
`Spinner`, `EmptyState` (`icon`, `title`, `description`, `action`), `ErrorState`, `Alert`,
`Breadcrumbs`. `LinkButton` lives in `Button.tsx`. All are exported from
`components/ui/index.ts`, together with `CardTitle` (`{ as?: 'h2' | 'h3' | 'h4' }`),
`buttonClasses({ variant, size, fullWidth, iconOnly })` (for elements that are neither
`Button` nor `LinkButton`), `TableHead`, `TableBody`, `TableRow`, `TableHeaderCell`,
`TableCell`, `BreadcrumbItem`, the tone types `StatusTone` (`'info' | 'success' | 'warning'
| 'danger'`) and `ChipTone` (`'neutral' | 'brand' | 'accent' | 'success' | 'warning' |
'danger'`) and the prop types. Three private helper files sit next to them: `tones.ts` (tone
class maps), `control.ts` (the shared `Input`/`Textarea`/`Select` classes and
`describedBy()`) and `avatar-art.tsx` (the twelve inline-SVG glyphs `Avatar` draws).

Props and behaviour fixed by the delivered kit:

- `Button` / `LinkButton` / `IconButton`: `variant` `'primary' | 'secondary' | 'ghost' |
  'danger'`, `size` `'sm' | 'md' | 'lg'` (minimum heights 36 / 44 / 48 px; labels wrap),
  extra `fullWidth`. `Button`'s `type` defaults to `'button'`, not the HTML default: a form's
  submit button passes `type="submit"`; `loading` disables the button natively and sets
  `aria-busy`. `LinkButton` `href` is a locale-less internal path rendered with the i18n
  `Link`; an http(s) URL opens in a new tab with a screen-reader hint; `mailto:`, `tel:`, `#`
  or `external` render a plain `<a>` (use `external` for `/api/files/…`). `IconButton`
  requires `aria-label` and defaults to `variant: 'ghost'`.
- `FormField { label, hint?, error?, required?, optional?, hideLabel?, id?, className?,
  children }`: `children` is one control element (`Input`, `Textarea`, `Select`), which
  receives `id`, `aria-describedby`, `aria-invalid` and `required` by `cloneElement`, or a
  function `(control) => node` for custom controls; `error` is an already translated string.
  `Input`, `Textarea`, `Select` and `Checkbox` also take `invalid`; `Select` takes `options`
  and `placeholder` (its `className` goes to the wrapper). `Checkbox` and `Switch` take
  `{ label?, description? }` and render their own `<label>`; `Switch` is a native checkbox
  with `role="switch"` and `labelPosition` `'start' | 'end'`. `RadioGroup { legend,
  hideLegend?, name, options: { value, label, description?, disabled? }[], value?,
  defaultValue?, onValueChange?, orientation?, variant?: 'plain' | 'card', hint?, error?,
  required?, disabled? }` (the `card` variant suits quiz answers and shows the focus ring
  around the whole row).
- `Avatar { avatarId: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; label? }` (24 / 32 /
  40 / 56 / 80 px, default `'md'`); without `label` the avatar is `aria-hidden` (decorative
  next to a printed name). `Logo { variant?: 'full' | 'mark', height?, tone?: 'default' |
  'inverse', label? }` reads no message catalog, so the global `not-found.tsx` can use it.
- `Dialog { open, onClose, title, description?, children?, footer?, size?: 'sm' | 'md' |
  'lg', dismissible? }` is controlled: the owner sets `open={false}` in `onClose`. Initial
  focus goes to the element marked `data-autofocus`, else the first focusable; children are
  mounted only while open; a non-dismissible dialog the browser force-closes is shown again.
  A modal dialog covers the toast region, so failures inside an open dialog are reported with
  an inline `Alert`.
- `DropdownMenu { trigger, 'aria-label'?, items, align?: 'start' | 'end', triggerClassName?,
  className? }` with items `{ label, icon?, href?, onSelect?, tone?: 'default' | 'danger',
  disabled?, selected? } | { type: 'separator' } | { type: 'heading', label }`; an item with
  `href` is an i18n `Link`; `selected` (true or false) makes it a `menuitemradio` with a tick
  (`LocaleSwitcher`). `Tooltip { content, children: one focusable element, side?: 'top' |
  'bottom', align?: 'center' | 'start' | 'end' }`.
- `Tabs { tabs: { value, label, content, disabled? }[], 'aria-label', value?, defaultValue?,
  onValueChange? }`: all panels stay mounted (content may be server-rendered); the tab list
  hides its scrollbar and scrolls a clicked tab into view. `Pagination { previousHref?,
  nextHref?, onPrevious?, onNext?, page?, totalPages? }` is previous/next only, matching
  `Page<T>.nextCursor`; a null or absent target disables the control. `Breadcrumbs { items:
  { label, href? }[] }`.
- `Toast`: `const { toast, dismiss } = useToast()`; `toast({ title, description?, tone?:
  StatusTone, durationMs? })` returns an id; default duration 5 s (8 s for `danger`), `0`
  keeps it until dismissed; toasts appear at the top on phones and bottom-end from `sm` up,
  at most 4 visible. `useToast()` throws without a `ToastProvider`.
- `Card { as?, tone?: 'default' | 'muted' | 'brand', interactive? }` (`brand` is the one
  subtle gradient); `Chip { tone?: ChipTone, size?, icon? }`; `Alert { tone?, title?,
  children?, action?, live?: 'assertive' | 'polite' | 'off' }` (`live: 'off'` for static
  text); `ProgressBar { value, label?, showValue?, size? }`; `ProgressRing { value, size?,
  strokeWidth?, label?, children? }`; `Skeleton { className?, lines? }` is `aria-hidden`, so a
  `loading.tsx` also renders a `Spinner` or a status line; `Table` requires `caption` and
  scrolls horizontally in its own focusable region.
- `EmptyState { icon?: ReactNode; title?; description?; action?; variant?: 'framed' |
  'plain' }`: `icon` is an icon element (`<Trophy />`), not a name; `title` falls back to
  `errors.empty.title`, and the default description is shown only with the default title.
- Built-in text: `EmptyState` and `ErrorState` read the `errors` namespace
  (`errors.empty.{title, description}`, `errors.page.{title, description, retry}`),
  `Breadcrumbs` reads `nav.shell.breadcrumbs`; everything else comes from `common`
  (`a11y.*`, `labels.optional`, `labels.loading`, `units.percent`, `pagination.*`).
- Only `Tabs`, `Dialog`, `DropdownMenu`, `Tooltip` and `Toast` are `'use client'`; every
  other primitive works in server components. Props that are functions (`ErrorState`
  `onRetry`, `Pagination` `onPrevious`/`onNext`, `RadioGroup` `onValueChange`, menu items
  with `onSelect`) need a client parent.

Static assets: the avatar set and the logo are inline SVG components (no image requests);
`src/lib/avatars.ts` exports `AVATAR_IDS` (the list the settings avatar picker shows and
`updateProfileAction` validates against), the union `AvatarId` and `DEFAULT_AVATAR_ID`
(`'robot'`). The twelve ids are objects, not faces, so one set suits a child and a teacher:
`robot`, `rocket`, `planet`, `star`, `bolt`, `atom`, `bulb`, `gear`, `chip`, `compass`,
`satellite`, `puzzle`. `Avatar` draws one SVG per id. `public/` holds the
favicon; homepage imagery lives in `public/marketing/**` (WS-A).

### 7.4 Domain components (`src/components/domain`)

The ten named in the brief, plus the helpers below (`CertifiedBadge`, `BadgeTile`,
`LevelProgress`, `StatusChip`, `RichText`, `MediaImage`, `NamedIcon`) and three formatting
hooks. All resolve translated text themselves with
`useLocale()` + `pickTranslation`. All `href` props are locale-less paths for the i18n
`Link`.

```ts
CourseCard        { course: Course; href: string; progressPercent?: number }            // shows CertifiedBadge when course.isOfficial
PathwayCard       { pathway: Pathway; href: string; progress?: { completed: number; total: number } }
ProgressCard      { title: string; subtitle?: string; percent: number; href?: string; ctaLabel?: string }
XPBadge           { xp: number; level: number; size?: 'sm' | 'md' | 'lg' }
StatCard          { label: string; value: string | number; icon?: IconName; hint?: string; tone?: 'default' | 'brand' | 'success' | 'warning' }   // numbers grouped for the locale
LessonNavigation  { modules: Module[]; lessons: Lesson[]; currentLessonId: string; completedLessonIds: string[]; lessonBasePath: string }
AIChatPanel       { messages: ChatMessage[]; mode: TutorMode; modes: TutorMode[]; streamingText: string | null; pending: boolean;
                    disabledReason?: string | null; remainingToday?: number | null; draft?: ChatDraft | null; className?: string;
                    onModeChange: (mode: TutorMode) => void; onSend: (text: string) => void }      // client; ChatDraft = { text: string; nonce: number }
ProjectCard       { submission: Submission; href: string; showStudent?: boolean }
CertificateCard   { certificate: Certificate; href: string }
ChallengeCard     { challenge: Challenge; href: string; now: IsoDateString; entered?: boolean }
CertifiedBadge    { size?: 'sm' | 'md' }                                                 // "RoboHolic Certified"
BadgeTile         { badge: Badge; earnedAt?: IsoDateString | null }
LevelProgress     { xp: number }                                                         // uses levelProgress()
StatusChip        { status: StatusChipStatus }   // SubmissionStatus | CourseStatus | ChallengePhase | 'completed' | 'in_progress'
                                                 // | 'active' | 'disabled' | 'suspended' | 'issued' | 'revoked' | 'expired'
RichText          { markdown: string; size?: 'sm' | 'md'; className?: string }           // react-markdown + remark-gfm + rehype-sanitize
MediaImage        { media: MediaRef; alt: string; sizes?: string; priority?: boolean; className?: string; frame?: '16:9' | '4:3' | '1:1' }
NamedIcon         { name: string } & LucideProps                                         // with ICON_NAMES and IconName
```

Every card takes an optional `className`. `CourseCard`, `PathwayCard`, `ProjectCard`,
`ChallengeCard` and `CertificateCard` make the whole card clickable through an `::after`
overlay on the title link, so no second interactive control goes inside them.
`CertificateCard` resolves `certificate.courseTitle` with `pickTranslation(…, locale, 'en')`
(a certificate has no `defaultLocale`); `ChallengeCard` derives the phase with
`getChallengePhase(challenge, now)`, `now` passed from the server render. Lucide icon names
in data (`pathways.icon`, `badges.icon`, nav items, lab tools) are resolved by `NamedIcon`
from `ICON_NAMES`, a fixed list of about 95 icons rather than lucide's full export (keeps
the library out of the client bundle); an unknown name draws the `Shapes` fallback,
kebab-case names are accepted, and seed or migration data must use names from `ICON_NAMES`
(add an icon there when new data needs one). `format.ts` exports three hooks:
`useDateFormat()` (`formatDate` in next-intl's time zone, so server and client print the
same day), `useDurationFormat()` ("45 min", "2 h", "1 h 30 min" from `common.units.*`) and
`useAgeRangeLabel()` (`domain.course.ages` / `agesFrom` / `agesUpTo`, or null).

`AIChatPanel` is split into `AIChatPanel.tsx` (the mode radio group of chips),
`AIChatMessages.tsx` (finished messages in a `role="log"` live region; the streaming reply
is `aria-hidden` until done) and `AIChatComposer.tsx` (input capped at
`AI_LIMITS.tutorRequest.userMessageChars`; Enter sends, Shift+Enter breaks the line) to stay
under the 200-line rule. `draft` puts text into the input for the learner to edit and send
and focuses the composer with the caret at the end; the same text twice is two drafts
because of the `nonce`. The focus is deferred one frame so that, on narrow screens,
`LessonShell`'s slide-over first records the opener and focuses its close button; Escape
then returns focus to the block's button. The panel fills its parent's height, so its parent
needs a definite height (the lesson pane has one; the full-page tutor uses something like
`h-[calc(100dvh-…)]`). `disabledReason` is an already translated string (for example
`tutor.limitReached`) and `remainingToday` comes from the stream's `done` event.

`RichText` renders Markdown (GFM) with no raw HTML and **no `img` element** (images go through
the `image` block, so a lesson author cannot make a child's browser call a third-party host).
Only `http:`, `https:`, `mailto:` and same-page fragment (`#…`, as GFM footnotes produce)
hrefs survive sanitising; every other href (relative paths, `javascript:`, `data:`) is dropped
and the text stays. http(s) links render with `target="_blank"`, `rel="noopener noreferrer"`
and the screen-reader hint `domain.richText.externalLink`; `mailto:` links keep the `rel` but
open in the same tab; fragments are plain in-page links. Markdown headings are shifted down
(`#`/`##` → `h3`, `###` → `h4`, deeper → `h5`) because the page owns `h1` and the block its
own heading, so an author's `# Title` becomes an `h3` inside the block; `size: 'sm'` is for
chat bubbles.

`MediaImage` is the only way an uploaded image is rendered (`ImageBlock`, `CourseCard`
covers, challenge covers, hardware images). It wraps `next/image` and takes its URL from
`mediaUrl(media)` (section 10.1): official media is a public Storage URL and is optimised by
Next.js; everything else is `/api/files/{fileId}` and is rendered `unoptimized` (the
optimiser has no session cookie). The rule is `unoptimized = !src.startsWith('https://')`,
which covers `/api/files/…` and the http emulator origin, so on the emulator every image is
`unoptimized` and no local-IP exception is needed in `next.config.ts`. With `frame` the image
is cropped to fill a box of that ratio (card covers use `frame="16:9"`); without it an image
with known dimensions renders at its intrinsic size and one whose `media.width`/`height` are
null sits uncropped (`object-contain`) in a 16:9 box with `fill`. `priority` is forwarded as
`next/image`'s `preload` (Next 16 deprecates `priority`). Pass `alt=""` when the image is
decorative next to a title, and a `sizes` that matches the grid (cards use
`(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw`).

### 7.5 Layout shells (`src/components/layout`)

| Component | Role |
|---|---|
| `PublicShell` `{ mySpaceHref?: string \| null; children }` (`PublicHeader` with the same `mySpaceHref`, `PublicFooter`) | Marketing pages; header has `Logo`, pathways link, `LocaleSwitcher`, Log in, Get started. When the visitor is signed in the public layout passes `roleHome(role)` and one "Go to my space" button (`nav.public.mySpace`) replaces Log in / Get started |
| `AuthShell` `{ children }` | Centered card on a gradient background, `LocaleSwitcher` |
| `AppShell` `{ role: Role; user: ShellUser; persistLocale?: PersistLocale \| null; children }` with `ShellUser = { displayName: string; avatarId: string; xp?: number; level?: number }` (exported from `TopBar.tsx` and the index) | Authenticated areas: `SidebarNav` (desktop), `MobileNav` (bottom bar for students, drawer for staff), `TopBar` `{ role; user; persistLocale? }` (exported too) with `XPBadge` (students, who therefore need `xp` and `level`; the student `(shell)/layout.tsx` reads them from `users.getUser(session, session.uid)`, as the `Session` carries neither), `LocaleSwitcher`, `UserMenu`. For students the `TopBar` always shows the signed-in display name (truncated on phones; staff names hide below `md`) with a visible one-click **Sign out** button (shared classroom computers). The area layouts pass `persistLocale={updateProfileAction}`. Must sit under `ToastProvider` (sign-out failures are toasts) |
| `SidebarNav`, `MobileNav` | Render `NAV_ITEMS[role]`; active state from `usePathname()` + `isNavItemActive`. `MobileNav` for students is a bottom bar with the first four items (Home, Learn, AI Lab, Robotics) plus a "More" button (`nav.shell.more`) that opens a bottom sheet with Challenges, Projects, AI Tutor and the three `PROFILE_ITEMS` (the brief's seven items do not fit a 375 px bar); staff get a menu button in the `TopBar` that opens a start-side drawer with `NAV_ITEMS` then `PROFILE_ITEMS` |
| `UserMenu` `{ role; user: { displayName; avatarId } }` | A "Signed in as {name}" heading (`nav.shell.signedInAs`), `PROFILE_ITEMS[role]` and Sign out (a separator always precedes Sign out, also for roles with no profile items) |
| `LocaleSwitcher` `{ persist?: PersistLocale \| null; align?: 'start' \| 'end'; compact?: boolean }` with `PersistLocale = (patch: { locale: Locale }) => Promise<unknown>` | Lists `LOCALES`; switches with the i18n router keeping the current path; calls `persist({ locale })` when given one. `src/actions/settings.ts` does not exist before F8 and components may not create it, so the switcher cannot import `updateProfileAction`: `AppShell` carries `persistLocale` down to it through `TopBar`; without it the page still switches language, the preference is just not saved |
| `PageHeader` `{ title; description?; actions?; breadcrumbs? }` | Standard page title row |
| `LessonShell` `{ top; nav; children; aside?; footer? }` (client component; its slots are server-rendered nodes) | Three-pane player frame. From Tailwind `xl` (80rem = 1280 px): nav 280 px, content fluid, aside 360 px. Below: the outline is a start-side slide-over opened by a button in the top bar (`nav.lesson.openOutline`), the aside an end-side slide-over opened by a floating "Ask Robo AI" button (`nav.lesson.askTutor`); while one is open the page is `inert`, Escape closes it and focus returns to the opener; following an outline link closes the outline. `aside={null}` (tutor disabled) removes the pane and the floating button. Wraps all its slots in `TutorBridgeProvider` and binds the slide-over to the bridge; on wide screens it resets the bridge's `isOpen` to false so the pane does not slide in later when the window is narrowed. The `top` slot sits in a flex row next to the outline button (keep it one flex row with `min-w-0` on the title); the `footer` slot is centred in a `max-w-3xl` box (three full-width buttons wrap to two rows at 375 px, so make the previous/next controls compact on phones) |
| `tutor-bridge.tsx` | The channel between lesson blocks and the tutor panel (below) |
| `Drawer.tsx`, `NavLinks.tsx`, `SkipLink.tsx`, `LessonSidePane.tsx`, `sign-out.tsx` | Layout-private: a native modal `<dialog>` drawer (Escape, backdrop, close button, scroll lock); the vertical link list with active state; "Skip to content" → `#main-content` (every shell's `<main>` has `id="main-content"`, so pages must not add another `<main>`); one pane of `LessonShell`; `useSignOut()` and `SignOutButton { variant?, size?, compact?, className? }` (both exported from the index), which call `signOutAction`, do the best-effort client sign-out, then a full page load of `/login` (not `router.push`) so nothing of the previous user stays in memory on a shared computer, and show a danger toast (`errors.<code>`, or `errors.offline`) on failure |

```ts
// src/components/layout/tutor-bridge.tsx — client; fully implemented by the foundation (not a stub)
export interface TutorOpenRequest { mode: TutorMode; starterPrompt: string | null; nonce: number }
export function TutorBridgeProvider(props: { children: React.ReactNode }): React.ReactElement;
export function useTutorBridge(): {
  open(opts: { mode: TutorMode; starterPrompt?: string | null }): void;   // AiActivityBlock calls this
  request: TutorOpenRequest | null;                 // TutorPanel applies mode + starter prompt whenever nonce changes
  isOpen: boolean; setOpen(open: boolean): void;    // LessonShell binds its slide-over to these
};
```

`open()` stores a new `request` and sets `isOpen` to true. On wide screens the aside is
always visible, so only the request matters; on narrow screens `LessonShell` opens the
slide-over. Outside a provider (the full-page tutor) `useTutorBridge()` returns a no-op
bridge, so `TutorPanel` works in both places.

### 7.6 Lesson player

`LessonPlayer` is a server component used by exactly three thin route files: the student
player, the teacher player, and the shared read-only preview (`/preview/…`).

```ts
// src/components/lesson/LessonPlayer.tsx
LessonPlayer { courseId: string; lessonId: string; lessonBasePath: string; exitHref: string }
```

There is no `mode` prop. Whether the player is interactive is decided on the server by
`getLessonPlayerData` and returned as `readOnly`: a **student** learns when enrolled
(read-only otherwise); a **teacher** learns only in a course with `audience: 'teacher'` in
which they are enrolled, and gets the read-only preview of every other course they can
access; **school admins and platform admins** always get the read-only preview. Read-only
means: no enrollment is created, quizzes and submission forms are disabled, nothing is
saved, "Complete lesson" is hidden.

```
LessonPlayer (server)        data = await getLessonPlayerData(session, courseId, lessonId)
└─ LessonShell
   ├─ top    : LessonTopBar      course title · ProgressBar (enrollment.progressPercent) · StageStepper · exit link
   ├─ nav    : LessonNavigation  modules/lessons, checkmarks from enrollment.completedLessonIds
   ├─ main   : LessonContent     blocks grouped by stage (groupBlocksByStage) → BlockRenderer per block
   ├─ aside  : TutorPanel        (components/ai) wraps AIChatPanel; not rendered when data.tutorEnabled is false
   └─ footer : LessonFooter      Previous Lesson · Complete lesson (calls completeLessonAction) · Next Lesson
LessonCompletePanel (client)     the EARN stage: XP gained, level-up, new badges, certificate link
```

`data.tutorEnabled` is false when the school has `aiEnabled: false`, when the viewer's role
may not use the tutor (school admin, platform admin), or in read-only mode.

`StageStepper` shows only the stages that have blocks in this lesson, in the fixed order
`discover, learn, watch, try, ask_ai, build, check, reflect`, then `earn`.

Block renderer registry (`src/components/lesson/blocks/registry.ts`):

```ts
export interface LessonRuntime {
  courseId: string; lessonId: string; readOnly: boolean; tutorEnabled: boolean;
  responses: Record<string /* blockId */, string>;
  quizzes: Record<string, Quiz>; latestAttempts: Record<string, QuizAttempt | null>;   // student projection (3.4)
  attemptsRemaining: Record<string, number | null>;
  projects: Record<string, Project>; latestSubmissions: Record<string, Submission | null>;
}
export interface BlockRendererProps<T extends BlockType = BlockType> {
  block: LessonBlockOf<T>;
  runtime: LessonRuntime;
}
export const BLOCK_RENDERERS: { [T in BlockType]: React.ComponentType<BlockRendererProps<T>> };
```

| Block type | Renderer | Behaviour |
|---|---|---|
| `rich_text` | `RichTextBlock` | `RichText` |
| `image` | `ImageBlock` | `MediaImage`, alt + caption |
| `video` | `VideoBlock` | `youtube-nocookie.com` / Vimeo iframe, or `<video src={mediaUrl(media)}>` for uploaded files; transcript disclosure |
| `file` | `FileBlock` | Download link (`mediaUrl(media)`) with type and size |
| `quiz` | `QuizBlock` → `QuizRunner` | One question per step, submit → `submitQuizAttemptAction`, result view, retry while attempts remain |
| `code_activity` | `CodeActivityBlock` | Monospace editor (`Textarea`), saves with `saveBlockResponseAction`. Code execution is future |
| `ai_activity` | `AiActivityBlock` | Instructions + button that calls `useTutorBridge().open({ mode: data.tutorMode, starterPrompt })`; hidden when the tutor is not enabled |
| `embed` | `EmbedBlock` | Sandboxed iframe; URL must pass `toEmbedUrl()` |
| `reflection` | `ReflectionBlock` | Textarea with `minLength`, saves with `saveBlockResponseAction` |
| `project` | `ProjectBlock` → `SubmissionForm` | Brief, requirements, latest submission status, submit / resubmit (only when there is no submission or the latest is `returned`) |

`BlockRenderer` looks the component up by `block.type`; an unknown type renders nothing and
logs once. Adding a block type = extend `BlockType`, `BlockTextMap`, `BlockDataMap`, add one
renderer file, one registry line and one editor form.

### 7.7 Cross-workstream components (fixed props)

These are imported across workstream boundaries. The foundation creates each file as a
stub with exactly these props; the owning workstream fills it in. The stubs are typed
constants (`export const QuizRunner: ComponentType<QuizRunnerProps> = function QuizRunner() { … }`,
with the props interface exported next to it), so the contract sits in the type without an
unused parameter that `@typescript-eslint/no-unused-vars` would flag; owners replace them
with ordinary function components.

```ts
components/lesson/LessonPlayer.tsx            LessonPlayer   (props above)
components/quiz/QuizRunner.tsx                QuizRunner     { courseId: string; quiz: Quiz; latestAttempt: QuizAttempt | null; attemptsRemaining: number | null; readOnly: boolean }
components/projects/SubmissionForm.tsx        SubmissionForm { target: SubmissionTarget; allowedTypes: SubmissionType[]; previousSubmissionId?: string | null }
components/projects/FileUpload.tsx            FileUpload     { purpose: 'submission' | 'course_media'; kinds: FileKind[]; courseId?: string | null; official?: boolean;
                                                               onUploaded: (result: { file: FileRef; media: MediaRef | null }) => void }
components/ai/TutorPanel.tsx                  TutorPanel     { courseId?: string; lessonId?: string; defaultMode?: TutorMode; variant: 'panel' | 'page' }
components/certificates/CertificateDocument.tsx   CertificateDocument { certificate: Certificate; verifyUrl: string }
components/certificates/IssueCertificateButton.tsx IssueCertificateButton { studentUid: string; courseId: string; existingCertificateId: string | null }
components/classes/JoinClassForm.tsx          JoinClassForm  { redirectTo?: string }
components/lesson/blocks/*.tsx                BlockRendererProps<T>
```

`FileUpload` (WS-D) is the one upload control: it calls `uploadFile()` then
`registerUploadAction` and reports the registered file. `SubmissionForm` uses it for
attachments; the course editors (WS-F) use it for block media and cover images.
`TutorPanel` receives a starter prompt only through the tutor bridge.

---

## 8. AI layer (`src/lib/ai`, server-only)

### 8.1 Provider interface

```ts
// src/lib/ai/types.ts
export type AiProviderId = 'mock' | 'anthropic';
export type AiPurpose = 'tutor' | 'review' | 'lab';
export interface AiMessage { role: 'user' | 'assistant'; content: string }
export interface AiUsage { inputTokens: number; outputTokens: number }
export type AiStopReason = 'end' | 'max_tokens' | 'refusal' | 'error';

export interface AiTextRequest {
  purpose: AiPurpose;
  system: string;
  messages: AiMessage[];
  maxOutputTokens: number;
  signal?: AbortSignal;
}
export interface AiTextResult { text: string; usage: AiUsage; stopReason: AiStopReason; model: string }
export type AiStreamEvent =
  | { type: 'text'; text: string }
  | { type: 'done'; usage: AiUsage; stopReason: AiStopReason; model: string };
export interface AiObjectRequest<T> extends AiTextRequest { schema: z.ZodType<T>; schemaName: string }
export interface AiObjectResult<T> { object: T; usage: AiUsage; stopReason: AiStopReason; model: string }

export interface AiProvider {
  readonly id: AiProviderId;
  generateText(request: AiTextRequest): Promise<AiTextResult>;
  streamText(request: AiTextRequest): AsyncIterable<AiStreamEvent>;
  generateObject<T>(request: AiObjectRequest<T>): Promise<AiObjectResult<T>>;
}

export class AiError extends Error {           // how a failed call is reported (8.4); the message never contains prompt or reply text
  reason: 'provider_error' | 'incomplete' | 'refused' | 'invalid_output' | 'blocked';
  usage: AiUsage;                              // tokens the failed call consumed (NO_USAGE when none)
}
export const NO_USAGE: AiUsage;

// src/lib/ai/index.ts
export function getAiProvider(): AiProvider;   // mock unless AI_PROVIDER=anthropic and ANTHROPIC_API_KEY is set
```

The interface deliberately has no vendor concepts (no sampling parameters, tools, or
model names). Adding provider B = one file in `providers/` and one branch in
`getAiProvider()`.

- **Mock provider** (default): deterministic, no network. `streamText` yields a canned,
  mode-aware reply in the requested locale in small chunks (a follow-up reply once the
  transcript holds a tutor turn; a hint-and-question reply to a direct answer request on
  graded work; French with no-break spaces before `: ; ? !`, addressing the reader as `tu`
  for every age band, adults included); `generateObject` returns a fixed, schema-valid object
  derived from the input length, so the whole product (tutor, grading, lab) works with no
  credentials. It knows only `schemaName: 'ai_review'` (`GRADING_SCHEMA_NAME`); any other
  name rejects with `AiError('invalid_output')`. It reads mode and locale from the policy
  header line every system prompt starts with (`ROBOHOLIC-POLICY purpose=<p> version=<v> …`,
  `safety.policyHeader`; `checkOutput` refuses any output containing that marker). It falls
  back to English for any locale other than `fr`.
- **Anthropic adapter** (WS-I; in the foundation `providers/anthropic.ts` is a placeholder
  whose `createAnthropicProvider({ apiKey, model }): AiProvider` rejects every call with
  `AiError('provider_error')`, so `AI_PROVIDER=anthropic` with a key set makes every tutor,
  lab and review call fail loudly — a review is stored as `failed` — rather than serve mock
  output): official `@anthropic-ai/sdk`; model from `ANTHROPIC_MODEL`
  (default `claude-opus-5-5`); `streamText` uses the SDK's streaming helper;
  `generateObject` uses structured outputs with the zod schema (not forced tool use) and
  validates the result again with zod; `purpose` selects the effort level explicitly (`low`
  for `tutor` and `lab`, `medium` for `review`); a `refusal` stop reason maps to
  `stopReason: 'refusal'` and is shown to the learner as a neutral "I can't help with that
  here" message. The implementer follows the SDK's current documentation for request shapes
  rather than this document.
- **Output caps**: `maxOutputTokens` in our interface is a **visible-length target**
  (`AI_LIMITS`: tutor 700, lab 700, review 1 500 tokens), enforced by the prompt and by
  `checkOutput`. It is not passed to the provider as its hard cap: on the default model
  reasoning cannot be switched off and reasoning tokens count against the provider's output
  cap, so a 700-token cap would cut replies mid-sentence. The adapter sets the provider cap
  with headroom (8 000 for `tutor` and `lab`, 16 000 for `review`). A response that still
  ends with `stopReason: 'max_tokens'` is handled as incomplete: for `review` it is recorded
  as a **failed** AI review (a partial object is never saved); for `tutor` and `lab` the text
  received so far is shown with a "reply was cut short" note.

### 8.2 Tutor modes

`TutorMode = 'explain' | 'hint' | 'quiz_me' | 'give_example' | 'challenge_me' | 'check_my_work'`

| Mode | Behaviour encoded in the system prompt |
|---|---|
| `explain` | Explain the concept at the learner's age level, short, with one analogy; end with a check question |
| `hint` | One step-sized hint, never the full solution; escalate only if asked again |
| `quiz_me` | Ask one question at a time about the lesson, wait, then give feedback |
| `give_example` | A concrete, age-appropriate example tied to the lesson topic |
| `challenge_me` | A slightly harder extension task; no solution unless requested after an attempt |
| `check_my_work` | Feedback on pasted work: what is good, what to improve, guiding questions; no grade, no rewritten final answer |

Policy common to all modes (in `prompts/tutor.ts`, versioned by `TUTOR_PROMPT_VERSION`):
guide, do not hand over answers to quizzes, assignments or projects (when
`hasGradedWork` is true, respond to direct answer requests with a hint and a question);
adapt vocabulary and length to `ageBand`; reply in `locale`; stay on AI, coding, robotics
and the current lesson; never ask for or repeat personal information; no medical, legal or
relationship advice — redirect to a trusted adult; say so when unsure.

### 8.3 Tutor request, context and stream

```ts
// src/types/ai.ts (shared) — request body of POST /api/ai/tutor; zod: tutorRequestSchema in src/lib/schemas/ai.ts
export interface TutorTurn { role: 'user' | 'assistant'; content: string }
export interface TutorRequest {
  mode: TutorMode;
  courseId: string | null; lessonId: string | null;
  messages: TutorTurn[];          // 1–10 entries, strictly alternating user/assistant, the last one 'user'
  locale: Locale;
}
// one JSON object per line of the response body
export type TutorStreamEvent =
  | { type: 'text'; text: string }                              // append to the reply
  | { type: 'replace'; messageKey: string }                     // discard everything shown for this reply; show tutor.<messageKey>
  | { type: 'done'; remainingToday: number; cutShort: boolean };

// built on the server by services/tutor-context.buildTutorContext (src/lib/ai/types.ts)
export interface TutorContext {
  mode: TutorMode;
  ageBand: AgeBand; locale: Locale;
  hasGradedWork: boolean;         // the lesson contains a quiz or a project
  reference: {                    // course-authored text = untrusted input (see below)
    pathwayTitle: string | null; courseTitle: string | null; lessonTitle: string | null;
    lessonSummary: string | null;
    lessonExcerpt: string | null; // lessons.tutorExcerpt, ≤ 2 000 chars; null unless the course is official
  };
  recentQuizResults: { quizTitle: string; scorePercent: number; passed: boolean }[];   // ≤ 3
}

// src/lib/ai/tutor.ts
export async function* streamTutorReply(context: TutorContext, messages: TutorTurn[], options?: { signal?: AbortSignal }): AsyncGenerator<AiStreamEvent, void, void>;
  // lazy: throws nothing synchronously; a bad AI_PROVIDER value or a provider failure surfaces while iterating and becomes the
  // neutral "unavailable" reply; a question that is empty after sanitising does not throw; a whitespace-only reply counts as empty
export type GuardedTutorEvent =
  | { type: 'text'; text: string }
  | { type: 'replace'; messageKey: 'cannotHelp' | 'unavailable' }    // TUTOR_REPLACE_KEYS
  | { type: 'done'; outcome: 'ok' | 'cut_short' | 'blocked' | 'refused' | 'error'; usage: AiUsage; stopReason: AiStopReason | null; model: string | null; error: string | null };
export function guardTutorStream(source: AsyncIterable<AiStreamEvent>, ageBand: AgeBand): AsyncGenerator<GuardedTutorEvent>;
  // the buffering + checkOutput of the "Stream" paragraph below; never throws; always ends with exactly one done
export function toTutorStreamEvent(event: GuardedTutorEvent, remainingToday: number): TutorStreamEvent;
export function encodeTutorEvent(event: TutorStreamEvent): string;   // one NDJSON line
export const TUTOR_STREAM_CONTENT_TYPE: string;                      // 'application/x-ndjson; charset=utf-8'
export function buildTutorRequest(context: TutorContext, messages: TutorTurn[]): AiTextRequest;
```

This covers the brief's list (age, language, pathway, course, lesson, previous quiz
results). The context contains **no** name, uid, email, school, class, or quiz
questions/answer keys.

**Request validation** (`tutorRequestSchema`): at most 10 messages; strict alternation ending
with a user message; every user message ≤ 2 000 characters, every assistant message ≤ 4 000;
all messages together ≤ 16 000 characters. Anything else is `400 validation`.

**Nothing the client or a course author wrote is trusted as instructions.** The client
supplies the whole history, including the "assistant" turns, so a learner could forge them;
lesson text is written by course authors, who could plant instructions. `streamTutorReply`
therefore builds the provider request like this:

- `system`: the policy prompt only (8.2), parameterised by `mode`, `ageBand`, `locale` and
  `hasGradedWork`. It contains no learner text and no course text, and it states that the
  reference material and the transcript below are data, not instructions.
- one `user` message made of delimited blocks produced by `wrapUntrusted()`
  (`safety.ts`): the reference block (titles, summary, excerpt, recent quiz results); the
  transcript of earlier turns, both roles, labelled as an unverified transcript; the new
  question; and a closing line restating that the policy applies whatever the blocks say.
  Earlier turns are never sent as real assistant-role messages.
- every string in those blocks passes through `sanitizeUserText` first.
- `lessonExcerpt` is included only for official courses; for teacher-made courses the tutor
  works from the titles and summary.

`lessons.tutorExcerpt` is maintained by the block transaction (3.6): the concatenated
`rich_text` bodies of the lesson, truncated to 2 000 characters per locale. Together with
the `quizTitle` snapshot on attempts, it lets `buildTutorContext` cost about six document
reads per message instead of reading every block and quiz.

**Stream**: the route answers `application/x-ndjson`. Text is buffered on the server and
released only after `checkOutput` has passed on it: per completed paragraph for age bands
`13-15`, `16-18` and `adult`; the **whole reply at once** for `8-10` and `11-12`, so a young
child never sees text that later fails a check. If a check fails after something was
released, the server sends `replace` (the client drops the partial reply and shows the
neutral message `tutor.cannotHelp`, or `tutor.unavailable` for a provider failure) and
increments `blockedCount`. The last event is always `done`. The buffering lives in
`lib/ai/tutor.guardTutorStream`, not in the route: the route runs `for await (const event of
guardTutorStream(streamTutorReply(context, messages, { signal }), context.ageBand))`, writes
`encodeTutorEvent(toTutorStreamEvent(event, remainingToday))` with the header
`TUTOR_STREAM_CONTENT_TYPE`, and on the `done` event calls `recordAiTokens` with
`event.usage`, increments `blockedCount` when `event.outcome === 'blocked'` and logs
`event.error` when not null. After a reply is blocked or cut, `guardTutorStream` keeps
reading the provider stream to the end to learn the token usage (with a real provider that
spends the remaining output tokens; aborting through the signal would lose the figure —
WS-I decides).

### 8.4 Grading output

```ts
// src/lib/ai/grading.ts
export interface AiReviewInput {
  locale: Locale; ageBand: AgeBand;
  projectTitle: string; projectBrief: string; requirements: string;
  rubric: { key: RubricKey; weight: number }[];
  submission: {
    title: string; description: string; type: SubmissionType;
    text: string | null; code: string | null; codeLanguage: string | null;
    linkHost: string | null;                                 // hostname only, never the full URL
    attachments: { kind: FileKind; sizeBytes: number }[];    // kind and size only; never file names
    truncated: boolean;                                      // true when text or code exceeded the review budget
  };
}
// AiReviewFlag (src/types/project.ts) = 'possible_personal_data' | 'unsafe_content' | 'off_topic' | 'possible_plagiarism' | 'possible_prompt_injection'
export interface AiReviewOutput {
  criteria: Record<RubricKey, { score: number; comment: string }>;   // Creativity, Technical Quality, Understanding, Responsible AI: 0–100
  overallSuggestedScore: number;   // computed by our code: round(Σ score × weight / 100); never taken from the model
  writtenFeedback: string;         // addressed to the student, in `locale`, age-appropriate, 80–200 words
  strengths: string[];             // ≤ 3
  improvements: string[];          // ≤ 3
  confidence: 'low' | 'medium' | 'high';
  limitations: string[];
  flags: AiReviewFlag[];
  provider: string; model: string; promptVersion: string; usage: AiUsage;
}
export function suggestReview(input: AiReviewInput): Promise<AiReviewOutput>;
  // fails by throwing AiError (8.1): stopReason max_tokens → 'incomplete', refusal → 'refused', a banned pattern in the output
  // → 'blocked', a schema mismatch or over-long text → 'invalid_output', anything else 'provider_error'; `usage` carries the
  // tokens the failed call consumed. services/project-flow stores a 'failed' review with error = reason, records the usage and
  // increments blockedCount when reason === 'blocked'.
```

What leaves the server (built by `services/project-flow.generateAiReview`):

- The student's title, description, text and code, each passed through `sanitizeUserText`
  and cut to a fixed budget (`AI_LIMITS.reviewInput`: description 2 000, text 8 000, code
  12 000 characters). When anything was cut, `truncated` is true and the output's
  `limitations` says that only the first part was reviewed.
- For a link, only its hostname. For attachments, only kind and size. File names and full
  URLs routinely contain a child's name or school and are never sent.
- Binary attachments (image, audio, video, PDF, file) are **not** sent; the output lists
  that in `limitations`. `confidence` is `'low'` whenever the submission has neither text nor
  code (attachment-only, link-only and description-only submissions alike) and is capped at
  `'medium'` when the input was truncated. Multimodal review is future.
- `suggestReview` re-applies `sanitizeUserText` and the `AI_LIMITS.reviewInput` budget
  itself and reduces `linkHost` to a hostname even when a caller passes a full URL, in
  addition to what `services/project-flow` does. The flags `possible_personal_data` (a
  redaction marker is present in the sanitised input) and `possible_prompt_injection`
  (heuristic) are added by our code and merged with the model's flags. On the mock provider
  an ordinary text submission gets no flag and confidence `'medium'` (under 200 characters
  of text plus code) or `'high'`, so `approve` is possible in the integration suite; text
  with an email or a phone number gets `possible_personal_data`, which blocks `approve`.

Prompt-injection defence (`prompts/grading.ts`, versioned by `GRADING_PROMPT_VERSION`): the
student's content is placed in delimited blocks that the system prompt declares to be
untrusted work to evaluate, never instructions; text that addresses the grader or asks for a
score sets the flag `possible_prompt_injection`.

The AI review is a suggestion stored in `aiReviews`; only
`services/project-flow.reviewSubmission`, called by a teacher, writes a grade. A teacher can
`approve` (take the AI scores as the grade) only when the review is `ready`, has **no flag**
and its confidence is not `low`; otherwise the review screen offers `modify` and `return`
only, so a flagged or low-confidence suggestion can never become a grade in one click.

### 8.5 AI Lab

```ts
// src/lib/ai/lab-tools.ts (shared)
// LabToolId and the tuple LAB_TOOL_IDS are declared in src/types/ai.ts (the block and lab schemas validate against
// the list, and schemas may not import lib/ai); this file re-exports both.
export type LabToolId = 'text' | 'image' | 'video' | 'voice' | 'vision' | 'chatbot-builder' | 'ml-lab' | 'agent-builder';
export interface LabTool { id: LabToolId; icon: string; status: 'live' | 'mock' | 'coming_soon' }
export const LAB_TOOLS: LabTool[];
// src/lib/ai/lab.ts
export type LabToolResult = { kind: 'text'; text: string } | { kind: 'mock'; messageKey: string };
export function runLabTool(toolId: LabToolId, input: { prompt: string }, ctx: { ageBand: AgeBand; locale: Locale }): Promise<LabToolResult>;
export function runLabToolWithReport(toolId: LabToolId, input: { prompt: string }, ctx: { ageBand: AgeBand; locale: Locale }):
  Promise<{ result: LabToolResult; outcome: 'ok' | 'cut_short' | 'blocked' | 'refused' | 'canned'; usage: AiUsage }>;
  // runLabToolAction uses this one: `usage` goes to recordAiTokens, 'blocked' increments blockedCount, 'canned' means no
  // provider call was made (usage is zero). runLabTool returns `.result`.
```

`text` is `live` (through the provider, so mocked by default). `image`, `video`, `voice`,
`vision`, `chatbot-builder` are `mock` (real interface, canned result, clearly labelled).
`ml-lab` and `agent-builder` are `coming_soon` cards. Tool names and descriptions come from
the `aiLab` message namespace (`aiLab.tools.<id>.title|description`); the mock tools' canned
results are `aiLab.tools.<id>.mockResult` and the two coming-soon cards show
`aiLab.comingSoon`. A blocked or refused text reply comes back as `{ kind: 'text', text }`
holding a neutral sentence in the learner's locale (`LAB_NOTICES` in `prompts/lab.ts`),
because the text result carries no message key. `lab-tools.ts` also exports `getLabTool(id)`
and `LabToolStatus`. Tools are product features, not curriculum content, so the registry is
code.

### 8.6 Safety boundaries

1. Keys only in server env; the browser never calls a provider.
2. Only authenticated, active users with a role the feature allows: tutor for `student` and
   `teacher`, AI Lab for `student`; every other role gets `403`. Email accounts are verified
   before any session exists (section 1.5), so every AI caller has a verified email or is a
   school-provisioned account.
3. The school switch `settings.aiEnabled` covers **all three** AI features. It is enforced
   inside `checkAndCountAiUsage` (which has the caller's `schoolId`), so the tutor, the AI Lab
   and AI review all honour it: with the switch off the tutor and the lab answer `403`, and a
   submission's `aiReviewStatus` becomes `skipped`.
4. Input: length caps; `sanitizeUserText` redacts emails, phone numbers and URLs with
   credentials on every string before anything leaves the server; history capped at 10
   turns and 16 000 characters; review input cut to a fixed budget (8.4).
5. No personal data in prompts (8.3, 8.4). Free text the learner types is the only
   uncontrolled input, and it is redacted per item 4.
6. Learner text, client-supplied history and course-authored text are untrusted data: they
   are delimited, sent in the user role and never placed in the system prompt (8.3, 8.4).
7. Policy system prompt (8.2) plus the provider's own safety systems.
8. Output: `checkOutput` (length, banned-pattern list) runs **before** text is shown. Tutor
   replies are buffered and released only after the check (8.3); lab and review output is
   checked as a whole. On failure the learner sees a neutral message and `blockedCount` is
   incremented.
9. Nothing is stored except counters (`aiUsage`) and AI reviews.
10. The UI labels every AI output as AI-generated; the tutor panel shows a short
    "Robo AI can make mistakes" note.
11. AI never writes grades, XP, badges or certificates. A flagged or low-confidence AI
    review cannot be approved as a grade (8.4).

```ts
// src/lib/ai/safety.ts
export function sanitizeUserText(text: string): string;
export function checkOutput(text: string, purpose: AiPurpose): { ok: true } | { ok: false; reason: 'banned_pattern' | 'too_long' };
  // the length limit is AI_LIMITS.maxOutputTokens[purpose] × 5 characters
export function wrapUntrusted(name: string, content: string): string;   // name matches /^[a-z][a-z_]*$/; the content is sanitised
                                                                        // again and forged delimiters are removed
// policyHeader(): the `ROBOHOLIC-POLICY purpose=<p> version=<v> …` first line of every system prompt (8.1)
```

`sanitizeUserText` redacts emails, URLs with credentials and phone numbers; the phone rule
is deliberately broad (a run of 8 to 15 digits in prose or code, such as `x = 100000000`,
is redacted and raises `possible_personal_data` on a review, which prevents one-click
approve), with year ranges, ISO and day-month-year dates, decimals and IPv4 addresses
exempt. `checkOutput`'s list refuses any reply containing a URL or an email address, so a
real model that puts a link inside a code example has the whole reply replaced by the
neutral message; WS-I tunes the list. `prompts/{tutor,grading,lab}.ts` hold
`Record<Locale, …>` tables (language names, limitation texts, lab notices): adding a locale
to `LOCALES` is a compile error there until entries are added. The regexes in `safety.ts`
are written with escapes, never with literal invisible characters (the editing tools on the
development machine turn `\u`-style escapes into the literal character; files there are
checked for non-ASCII characters after editing).

### 8.7 Rate limiting and budgets

`data/ai-usage.checkAndCountAiUsage(subject, kind)` is called before **every** provider
call, with `kind` = `'tutor' | 'lab' | 'review'` and `subject` = the user the call is made
for (the session user; for `review`, the student who submitted). It runs one transaction on
`aiUsage/{uid}_{yyyymmdd}` and reads the school and global budget counters. It refuses, in
this order: role not allowed for the kind (`forbidden`); school has `aiEnabled: false`
(`forbidden`); per-minute or per-day request limit reached; the user's daily token cap
reached; the school's or the platform's daily token budget exhausted (all `rate_limited`).
The school document and the school and global budget counters are read outside the
transaction; only `aiUsage/{uid}_{yyyymmdd}` is read and written transactionally, so parallel
AI calls do not serialise on the global document. A school document that does not exist
counts as `disabled`. `retryAfterSeconds` is the time to the next minute (per-minute limit)
or to the next UTC day (per-day limit, token cap, budget). The repository exports the types
`AiUsageKind`, `AiUsageSubject` and `AiUsageDecision`.

| Limit (`AI_LIMITS`, `src/lib/limits.ts`) | Student | Teacher |
|---|---|---|
| Tutor messages per UTC day | 60, or `schools.settings.aiDailyMessageLimit` clamped to 1–200 | 150 |
| Tutor messages per minute | 6 | 10 |
| Lab requests per day | 30 | — |
| AI reviews per day (submissions that get an AI review; beyond that `aiReviewStatus: 'skipped'`) | 5 | — |
| AI review regenerations per submission | 3 (own unsupervised submission) | 3 |
| Tokens per user per UTC day (input + output, all kinds) | 200 000 | 400 000 |
| Visible-length target, tutor and lab reply | 700 tokens | 700 tokens |
| Visible-length target, review | 1 500 tokens | — |

| Budget (`AI_BUDGETS`) | Value |
|---|---|
| Tokens per school per UTC day (`aiUsage/school_{schoolId}_{yyyymmdd}`) | 3 000 000 |
| Tokens platform-wide per UTC day (`aiUsage/global_{yyyymmdd}`) | 10 000 000, overridable with `AI_DAILY_TOKEN_BUDGET` |

Request limits are counted before the call; token counters are updated after it by
`recordAiTokens` (user, school and global documents), so the token caps and budgets stop the
**next** call once a ceiling is crossed. The budgets bound total spend no matter how many
accounts exist. School admins and platform admins have no AI features and therefore no row.

Exceeding a limit returns `429 rate_limited` with `retryAfterSeconds` (route handler:
`{ error: { code, retryAfterSeconds } }`; server action: `ActionResult` error with
`retryAfterSeconds`); the panel shows a friendly message. The tutor's remaining daily count
travels in the stream's `done` event.

---

## 9. Gamification (server-side only)

All of this runs in `src/lib/gamification/*` with `SYSTEM_ACTOR`. The functions in
`award.ts`, `certificates.ts` and `events.ts` take **no actor and perform no
authorization**; they are internal. An ESLint `no-restricted-imports` rule forbids importing
them (and `SYSTEM_ACTOR`, and `services/identity`) from `src/actions/**`, `src/app/**` and
`src/components/**`. Request-handling code reaches gamification only through services that
authorize first: `services/learning`, `services/assessment`, `services/project-flow` (system
events) and `services/recognition` (the three human-initiated operations: issue a
certificate, revoke a certificate, award a manual badge). No server action accepts an XP
amount or a score as input.

### 9.1 XP rules

| Event | Amount (default, `XP_RULES`) | Source of the actual amount | Ledger id (course-scoped) | Awarded when |
|---|---|---|---|---|
| Lesson completed | 50 | `lesson.xpReward` | `lesson_{courseId}_{lessonId}` | `completeLesson` succeeds (first time) |
| Quiz passed | 100 | `quiz.xpReward` | `quiz_{courseId}_{quizId}` | first attempt with `passed === true` |
| Project accepted | 300 | `project.xpReward` | `project_{courseId}_{projectId}` | teacher approves, or an unsupervised submission is accepted (`ai_reviewed`, section 3.4) |
| Challenge entry accepted | 500 | `challenge.xpReward` | `challenge_{challengeId}` | same rule as projects |
| Badge bonus | 0 | `badge.xpBonus` | `badge_{badgeId}` | badge awarded |
| Manual adjustment | any | platform admin | `adjustment_{auditLogId}` | future UI; function exists |

`XP_RULES` (`rules.ts`) is `{ lesson: 50, quiz: 100, project: 300, challenge: 500, badge: 0 }`;
the manual adjustment has no entry (its amount is always explicit). `MAX_LEVEL = 50` is
declared in `rules.ts` and re-exported by `levels.ts`.

Lesson, quiz and project ids are unique only inside a course, so the ledger id always
includes the `courseId`; two courses that both contain `quiz-1` award XP independently.

`awardXp(uid, { reason, refId, amount, courseId })` runs one transaction: create
`users/{uid}/xpLedger/{reason}_{refId}` **if it does not exist** (otherwise return
`awarded: false`), increment `users.xpTotal`, recompute `users.level`, increment the
matching `users.stats` counter (`lesson → lessonsCompleted`, `quiz → quizzesPassed`,
`project → projectsAccepted`, `challenge → challengesCompleted`). Deterministic ids make
every award idempotent: repeating a lesson, retaking a passed quiz or resubmitting an
approved project never grants XP twice, and a handler can safely be run again after a crash
(9.4).

### 9.2 Levels (`levels.ts`, pure, shared with the UI)

```ts
export const MAX_LEVEL = 50;
export function xpForLevel(level: number): number;   // total XP needed to reach `level`: 100 × level × (level − 1)
export function levelForXp(xp: number): number;      // min(MAX_LEVEL, floor((1 + sqrt(1 + xp / 25)) / 2))
export function levelProgress(xp: number): { level: number; currentLevelXp: number; nextLevelXp: number; percent: number };
```

Level 1 = 0 XP, 2 = 200, 3 = 600, 4 = 1 200, 5 = 2 000, 10 = 9 000. One demo course (4
lessons, 2 quizzes, 1 project = 700 XP) takes a new learner to level 3. In `levelProgress`,
`currentLevelXp` and `nextLevelXp` are the XP totals at which the current and the next level
start (`xpForLevel(level)`, `xpForLevel(level + 1)`) and `percent` is 0–100 rounded down; at
`MAX_LEVEL` `nextLevelXp` equals `currentLevelXp` and `percent` is 100. `xpForLevel` floors
its argument and treats anything below 1 (or non-finite) as level 1; `levelForXp` answers 1
for a non-positive or NaN total.

### 9.3 Badges

```ts
export type BadgeCriteria =
  | { type: 'stat_threshold'; stat: 'lessonsCompleted' | 'quizzesPassed' | 'projectsAccepted' | 'challengesCompleted' | 'coursesCompleted'; threshold: number }
  | { type: 'course_completed'; courseId: string }
  | { type: 'pathway_completed'; pathwayId: string }   // every published official course of the pathway has a completed enrollment
  | { type: 'manual' };                                 // awarded by a teacher (to their students) or a platform admin

export type BadgeTrigger =
  | { type: 'stat'; stat: 'lessonsCompleted' | 'quizzesPassed' | 'projectsAccepted' | 'challengesCompleted'; value: number }
  | { type: 'course_completed'; courseId: string; pathwayId: string | null; coursesCompleted: number };
```

`evaluateBadges(uid, trigger)` evaluates **only the criteria the trigger can affect**, so an
ordinary XP event costs two small reads (active badges, the user's badges) and no enrollment
queries:

- trigger `stat`: `stat_threshold` badges for that stat, compared with `trigger.value` (the
  value returned by the `awardXp` transaction; nothing is re-read).
- trigger `course_completed`: `course_completed` badges for that course;
  `stat_threshold: coursesCompleted` badges; and `pathway_completed` badges for
  `trigger.pathwayId` only (one courses query plus one `getAll` of the user's enrollments in
  that pathway).

`evaluateBadges(uid, trigger)` is `evaluateBadgeTriggers(uid, [trigger])`, which takes
several triggers at once. The `pathway_completed` check is one
`listPublishedCoursesByPathway` query plus one `getEnrollment` per course in parallel (no
repository reads one user's enrollments for several courses); a pathway with no published
course awards nothing, and a pathway badge is evaluated only when a course of that pathway
is completed (a course added to a pathway later is required of new holders only; earlier
holders keep the badge). It calls `awardBadge` for each badge newly satisfied: the XP bonus
(ledger id `badge_{badgeId}`, only when `xpBonus > 0`) is applied **before**
`users/{uid}/badges/{badgeId}` is created, so an interrupted award is completed by the next
evaluation instead of losing the bonus; then the badge document is created if absent and
`stats.badges` incremented; `awarded` is the `created` flag of that write. `awardBadge`
checks only that the badge exists (`NotFoundError`); `isActive` and `criteria.type` are the
caller's checks (`evaluateBadges` reads only active badges and ignores criteria types it
does not know; `recognition.awardManualBadge` checks both). The XP granted as a badge bonus
does **not** trigger another evaluation. Seeded badges:

| Badge id | Criteria |
|---|---|
| `ai-explorer` | `pathway_completed: ai-explorer` |
| `prompt-master` | `course_completed: build-with-generative-ai` |
| `data-detective` | `stat_threshold: quizzesPassed ≥ 5` |
| `vision-builder` | `stat_threshold: projectsAccepted ≥ 3` |
| `responsible-ai-champion` | `manual` |
| `robotics-engineer` | `pathway_completed: ai-robotics` |
| `ai-innovator` | `pathway_completed: ai-innovator` |

Manual badges are awarded through `services/recognition.awardManualBadge(actor, …)`, which
requires: the badge exists, `isActive`, and has `criteria.type === 'manual'`; and the actor
is a platform admin, or a teacher who teaches a class the target student is in. It writes an
audit entry (`badge.awarded`). The teacher's control is on the student detail page
(section 6.5).

"Achievements" in the brief is the page that shows level, XP history, stats and badges; it
is not a separate entity.

### 9.4 Lesson and course completion

`services/learning.completeLesson(actor, courseId, lessonId)` verifies on the server, from
the enrollment and the lesson's progress document (no attempt or submission queries):

- the user is enrolled;
- every quiz in `lesson.quizIds` is **passed, or its attempts are exhausted**
  (`quizSummary[quizId].passed`, or `quiz.maxAttempts !== null` and
  `quizSummary[quizId].attempts >= quiz.maxAttempts`). A learner who used every attempt can
  move on; they simply never get that quiz's XP;
- every project in `lesson.projectIds` has at least one submission
  (`projectSummary[projectId].attempts >= 1`; acceptance is not required to move on);
- every block in `lesson.reflectionBlockIds` has a saved response of at least `minLength`
  (measured by trimmed length; `minLength: 0` needs no saved response).

The rule is the pure `getMissingForCompletion(state)` in
`src/lib/learning/lesson-completion.ts` (`state = { lesson, blocks, quizzes: Record<quizId,
Pick<Quiz, 'maxAttempts'>>, enrollment, responses }`) with `isReadyForCompletion(missing)`
and `responseLength(text)`; the lesson player can call it on `LessonPlayerData` to show the
same list. `completeLesson` requires an enrollment (`not_found` without one) and a learner of
the course (`forbidden` for a teacher previewing a student course); on the not-ready path it
answers `{ completed: false, missing, enrollment, gamification: null }` and writes nothing
(it reads the quiz definitions of unsettled quizzes for `maxAttempts`, and the blocks only
when the lesson has reflections; no attempt or submission query).

Then `data/enrollments.applyLessonCompletion` runs **one transaction** that marks
`lessonProgress` completed with `effectsApplied: false` and updates the enrollment
(`completedLessonIds`, counts, `progressPercent`). When all lessons are done **and
`completedAt` is null**, the same transaction sets `status: 'completed'`, `completedAt`, and
increments `users.stats.coursesCompleted`. An enrollment never goes back to `active`: if
lessons are added to the course later, `progressPercent` is recomputed on the next
completion but the course is not "completed" a second time and the counter is not
incremented again.

After the transaction, `onLessonCompleted` awards the lesson XP, evaluates badges, attempts
certificate issuance and finally sets `effectsApplied: true`. The services run every
gamification handler through `internal-common.applyEffects`: a handler that throws is logged
and answered as `gamification: null` (with `completed: true`); the flag stays false and the
next read repairs it. The "already completed" path re-runs `onLessonCompleted` only when the
stored `effectsApplied` is false, with `courseCompleted` as `applyLessonCompletion` reports
it (true only when that lesson completed the course, so certificate issuance can be
retried).

**Recovery (MUST).** The state transaction and the gamification handler are two steps; a
crash or timeout between them must not lose XP or a certificate. Every handler is idempotent
(deterministic ledger and certificate ids), and three documents carry `effectsApplied`:

| Document | Set to `false` by | Handler that sets `true` | Re-invoked when `false` by |
|---|---|---|---|
| `lessonProgress` | `applyLessonCompletion` | `onLessonCompleted` | `completeLesson` (the "already completed" path, which otherwise only returns the current state) and `getLessonPlayerData` (for the enrolled learner only; a read-only viewer never triggers a handler) |
| `quizAttempts` (every passed attempt, repeat passes included; failed ones are written `true`) | `createAttempt` | `onQuizPassed` (run by `submitQuizAttempt` on every pass) | `getLessonPlayerData` (latest attempt of each quiz in the lesson; learner only) |
| `submissions` (written `true` at creation) | `addReview` with approve/modify, `markAiReviewed` | `onSubmissionAccepted` | `project-flow.getSubmissionForViewer` |

AI review has the same shape (`after(() => generateAiReview(id))` can die with the
function instance). `getSubmissionForViewer` re-triggers `generateAiReview` when it loads a
submission whose `aiReviewStatus` is `pending` and whose `submittedAt` is more than two
minutes old (`AI_LIMITS.reviewRetriggerAfterMs`): it calls `setAiReviewPending` (each
automatic re-trigger counts as a regeneration; at the limit the repository marks the review
`failed` and nothing runs) and then `generateAiReview` **inline**, before re-reading the
submission, so that page load waits for the provider (moving the call to `after()` in the
page would keep the semantics with less latency). After three regenerations the status is
`failed`. The owner of an **unsupervised** submission whose review is `failed` or `skipped`
can call `regenerateAiReviewAction` themselves (same limit of three), so an individual
learner is never stuck without feedback.

### 9.5 Certificates

- **Automatic**: `maybeIssueCourseCertificate(uid, courseId)` is called after a course's
  last lesson completes and after a submission is accepted. It issues when
  `course.certificateEnabled`, the enrollment is `completed`, and every project with
  `requiredForCertificate` **that a lesson links to** (`project.lessonId !== null`; an
  unlinked project can never be submitted and would block every certificate of the course)
  has `projectSummary[projectId].latestStatus` in `approved` or `ai_reviewed`. It returns the
  certificate only when this call issued it or finished an interrupted issue
  (`enrollment.certificateId` still null), and `null` when the learner already holds it (so
  `GamificationOutcome.certificate` is non-null only in the event that issued it; read
  `enrollment.certificateId` for "has a certificate"). It **never re-issues a revoked
  certificate** (it reads `certificates/{uid}_{courseId}` first): a later accepted submission
  must not silently undo a teacher's revocation; only `issueCertificateFor` re-issues.
- **Manual**: `services/recognition.issueCertificate(actor, { studentUid, courseId })` for
  teachers (`canIssueCertificate` and the course is assigned to a class they teach that the
  student is in) and platform admins. The student is read as the system and withheld as
  `not_found` unless `canIssueCertificate` holds; the course is read **as the actor**, so a
  teacher cannot issue for a colleague's `private` course even when it is assigned to a
  shared class (reading it as the system after the class check would lift that); it always
  requires an enrollment (`not_found`), for a teacher a shared class whose
  `assignedCourseIds` contains the course (`forbidden`) and `course.certificateEnabled`
  (`conflict`). For an **official** course a teacher can issue only when the enrollment is
  `completed` (`conflict` otherwise; the teacher's discretion covers the required-project
  condition, not the course itself), so a self-registered teacher cannot mint "RoboHolic
  Certified" certificates for work that was not done. For a teacher-made course, issuance is
  at the teacher's discretion. Platform admins are not restricted. The issuer is
  `{ uid: session.uid, name: session.displayName }`; automatic certificates carry
  `SYSTEM_ISSUER = { uid: 'system', name: 'RoboHolic AI' }`. Snapshots: `schoolId` = the
  enrollment's `schoolId`, `schoolName` = that school's name (null when `schoolId` is null or
  the school document is missing, so an independent learner's certificate has both null);
  `courseTitle` = `{ title }` of every locale of `course.translations`; `recipientName` =
  `users.displayName`. `issueCertificateFor` itself checks neither `certificateEnabled` nor
  completion (the service decides) and throws `NotFoundError` without an enrollment.
- **Idempotent, and re-issuable**: the document id is `${uid}_${courseId}`.
  `data/certificates.createCertificate` runs a transaction: no document → create; an
  `issued` document → return it unchanged (`created: false`); a `revoked` document →
  overwrite it as `issued` with a new `verificationCode`, `issuedAt` and issuer and cleared
  revocation fields (audit-logged). A certificate revoked by mistake, or earned properly
  later, can therefore be issued again; the old code stops verifying.
- `verificationCode` is `'RH-'` + 10 random characters from `[A-Z2-9]` (34^10 ≈ 2 × 10^15
  values). No uniqueness check is made; a collision is negligible at any realistic volume.
- `isOfficial` is copied from the course: only official courses render the RoboHolic
  Certified mark; teacher-made courses render the school name.
- Certificates are HTML pages printed to PDF by the browser. Server-side PDF generation is
  future.
- **Revocation** (`services/recognition.revokeCertificate`: the teacher who issued it
  (`certificate.issuedBy === session.uid`) or a platform admin; `certificateId` and `reason`
  are parsed with `revokeCertificateInputSchema`; a certificate the actor cannot view is
  `not_found`) sets `status: 'revoked'`, decrements `users.stats.certificates` and clears
  `enrollments.certificateId` when it still points at that certificate; the verify page then
  reports it as revoked. Revoking an already revoked certificate is a no-op without an audit
  entry. `revokeCertificateById(certificateId, reason, revokedByUid)` accepts the actor's uid
  but does not store it (3.4 has no field for it); the audit entry `certificate.revoked`
  (meta `{ studentUid, courseId, reason }`) records who revoked.

### 9.6 API

```ts
// gamification/award.ts — internal: no actor, no authorization; never imported outside src/lib
export function awardXp(uid: string, entry: { reason: XpReason; refId: string; amount: number; courseId: string | null }):
  Promise<{ awarded: boolean; xpTotal: number; level: number; leveledUp: boolean; stat: { name: string; value: number } | null }>;
export function evaluateBadges(uid: string, trigger: BadgeTrigger): Promise<Badge[]>;   // newly awarded badges
export function evaluateBadgeTriggers(uid: string, triggers: readonly BadgeTrigger[]): Promise<Badge[]>;   // several triggers at once
export function awardBadge(uid: string, badgeId: string, awardedBy: 'system' | string, note?: string): Promise<{ awarded: boolean }>;

// gamification/certificates.ts — internal
export function maybeIssueCourseCertificate(uid: string, courseId: string): Promise<Certificate | null>;
export function issueCertificateFor(uid: string, courseId: string, issuer: { uid: string | 'system'; name: string }): Promise<Certificate>;
export function revokeCertificateById(certificateId: string, reason: string, revokedByUid: string): Promise<void>;   // revokedByUid is not stored (9.5)
export const SYSTEM_ISSUER: { uid: 'system'; name: 'RoboHolic AI' };

// gamification/events.ts — internal; the only entry points the system services call; each sets effectsApplied when done
export function onLessonCompleted(uid: string, ctx: { courseId: string; lessonId: string; xpReward: number; courseCompleted: boolean }): Promise<GamificationOutcome>;
export function onQuizPassed(uid: string, ctx: { attemptId: string; courseId: string; quizId: string; xpReward: number }): Promise<GamificationOutcome>;
export function onSubmissionAccepted(uid: string, ctx: { submissionId: string; context: 'project' | 'challenge'; refId: string; courseId: string | null; xpReward: number }): Promise<GamificationOutcome>;
  // refId is the projectId or challengeId; the ledger refId becomes `${courseId}_${projectId}` for a project (courseId null throws)
  // and the challengeId for a challenge (ledger courseId null). Writes submissions.xpAwarded = xpReward (also when the ledger entry
  // already existed, from an interrupted run) and, for a project, tries maybeIssueCourseCertificate.
// GamificationOutcome semantics: xpAwarded = the event's reward when the ledger entry was new, else 0, plus the xpBonus of every
// badge awarded by this call; xpTotal and level are re-read from the profile when a bonus was granted; leveledUp is true when the
// level rose anywhere in the event; newBadges are full Badge documents; certificate is non-null only in the event that issued it.
// Handlers throw on failure and leave effectsApplied false; services never call mark*EffectsApplied after them.

// services/recognition.ts — the authorized entry points for people (section 10.3)
export function issueCertificate(actor: Actor, input: { studentUid: string; courseId: string }): Promise<Certificate>;
export function revokeCertificate(actor: Actor, certificateId: string, reason: string): Promise<void>;
export function awardManualBadge(actor: Actor, input: { studentUid: string; badgeId: string; note: string | null }): Promise<{ awarded: boolean }>;
```

---

## 10. Shared contracts

### 10.1 Domain types, input types and schemas (`src/types`, `src/lib/schemas`)

Derivation rule: each domain type is the document shape from section 3.4 with (a) `id:
string` added, (b) every `Timestamp` replaced by `IsoDateString`, (c) for subcollection
documents, the parent ids added (`courseId` on `Module`, `Lesson`, `Quiz`, `Project`;
`courseId` + `lessonId` on `LessonBlock`; `classId` on `ClassMember` and
`ClassAssignment`; `submissionId` on `TeacherReview` and `AiReview`; `uid` on `UserBadge`
and `XpEntry`; none on `LessonProgress`, whose `userUid` and `courseId` already name the
enrollment). Field names are identical to section 3.4. Every document type extends
`Timestamped` (`createdAt`, `updatedAt`), except the four whose shape in 3.4 writes
`createdAt` out and which have no `updatedAt`: `XpEntry`, `TeacherReview`, `AiReview`,
`FileRecord` (the first three are never written again; on a file record only `submissionId`
changes, when the file is attached). `QuizAnswerKey` is the one type outside the rule: it is
the bare shape of 3.4, with no `id`, parent ids or timestamps, because the key has a fixed
id and is only ever returned next to its `Quiz` (`getQuizWithKey`). A field documented as
`'system' | string` (`awardedBy`, `issuedBy`) is typed `string`. The operational
collections (`aiUsage`, `uploadUsage`, `rateLimits`, `auditLogs`, `joinCodes`, `meta`) have
no shared type: no repository function returns them, so their document shapes stay private
to the repository that owns them.

| File | Exports |
|---|---|
| `common.ts` | `Locale`, `Localized<T>`, `IsoDateString`, `Role`, `AgeBand`, `LearningArea`, `SubmissionType`, `FileKind`, `MediaRef`, `FileRef`, `FileRecord`, `Page<T>`, `PageRequest` |
| `user.ts` | `UserProfile`, `UserStats`, `UserStatus`, `ConsentBasis`, `StudentSummary` |
| `school.ts` | `School`, `SchoolSettings`, `SchoolClass`, `ClassMember`, `ClassAssignment` |
| `content.ts` | `Pathway`, `Course`, `CourseStatus`, `Module`, `Lesson`, `BlockType`, `LessonStage`, `BlockTextMap`, `BlockDataMap`, `LessonBlock`, `LessonBlockOf<T>`, `CourseOutline` |
| `quiz.ts` | `Quiz`, `QuizQuestion`, `QuizOption`, `QuestionType`, `QuizAnswerKey`, `QuizAnswer`, `QuizAttempt`, `QuizAttemptResult` |
| `learning.ts` | `Enrollment`, `QuizSummaryEntry`, `ProjectSummaryEntry`, `LessonProgress`, `LessonPlayerData`, `LessonCompletionResult` |
| `project.ts` | `Project`, `RubricKey`, `RubricWeight`, `CriteriaScores`, `Submission`, `SubmissionStatus`, `SubmissionTarget`, `ReviewDecision`, `TeacherReview`, `AiReview`, `AiReviewFlag` |
| `gamification.ts` | `Badge`, `BadgeCriteria`, `BadgeTrigger`, `UserBadge`, `XpEntry`, `XpReason`, `Certificate`, `PublicCertificate`, `GamificationOutcome` |
| `challenge.ts` | `Challenge`, `ChallengeType`, `ChallengePhase` |
| `billing.ts` | `Subscription`, `License`, `LicenseScope` |
| `hardware.ts` | `HardwarePlatform`, `HardwareCapability` |
| `analytics.ts` | `SchoolStats`, `CourseUsageRow`, `PlatformStats`, `ClassReport` |
| `ai.ts` | `TutorMode`, `TutorTurn`, `TutorRequest`, `TutorStreamEvent`, `ChatMessage` |
| `actions.ts` | `ActionResult<T>`, `ActionErrorCode` |
| `inputs.ts` | Everything a form or editor sends to an action: `SignupInput`, `JoinSignupInput`, `ProfilePatch`, `ClassInput`, `SchoolInput`, `CourseInput`, `ModuleInput`, `LessonInput`, `BlockInput`, `BlockInputDataMap`, `QuizInput`, `QuizQuestionInput`, `ProjectInput`, `SubmitWorkInput`, `ReviewInput`, `RegisterUploadInput`, `ChallengeInput`, `LicenseInput`, `SubscriptionInput` |

**Value lists (MUST).** `src/types` exports values as well as types: every string union that
a schema, a select or a loop needs at run time is derived from a `const` tuple exported next
to it (`export const ROLES = [...] as const; export type Role = (typeof ROLES)[number]`), so
each list exists once. The tuples: `ROLES`, `AGE_BANDS`, `LEARNING_AREAS`,
`SUBMISSION_TYPES`, `FILE_KINDS`, `AUDIENCES` (`common.ts`); `USER_STATUSES` (`user.ts`);
`SCHOOL_STATUSES` (`school.ts`); `COURSE_STATUSES`, `ACCESS_TIERS`, `BLOCK_TYPES`,
`LESSON_STAGES`, `VIDEO_SOURCES`, `CODE_LANGUAGES`, `EMBED_ASPECT_RATIOS` (`content.ts`);
`QUESTION_TYPES`, `REVEAL_ANSWERS` (`quiz.ts`); `RUBRIC_KEYS`, `PROJECT_KINDS`,
`SUBMISSION_STATUSES`, `REVIEW_DECISIONS`, `AI_REVIEW_FLAGS`, `AI_CONFIDENCES`
(`project.ts`); `CHALLENGE_TYPES`, `CHALLENGE_STATUSES`, `CHALLENGE_SCOPES`
(`challenge.ts`); `SUBSCRIPTION_PLANS`, `SUBSCRIPTION_STATUSES`,
`SUBSCRIPTION_OWNER_TYPES`, `LICENSE_STATUSES` (`billing.ts`); `HARDWARE_CAPABILITIES`
(`hardware.ts`); `TUTOR_MODES`, `LAB_TOOL_IDS` (`ai.ts`); `ACTION_ERROR_CODES`
(`actions.ts`). `AI_REVIEW_FLAGS` and `AI_CONFIDENCES` serve the zod schema that
`ai/grading.ts` hands to `generateObject` (`ai` imports `types`, never `schemas`: section
1.2).

The files also export the named parts of the shapes above, for props and helper signatures:
`Timestamped`, `Audience`, `FilePurpose` (`common.ts`); `Session` (`user.ts`);
`SchoolStatus`, `SchoolCounts` (`school.ts`); `PathwayKind`, `PathwayAccent`,
`CourseVisibility`, `AccessTier`, `VideoSource`, `CodeLanguage`, `EmbedAspectRatio`
(`content.ts`); `RevealAnswers`, `QuizQuestionResult` (`quiz.ts`); `BlockResponse`
(`learning.ts`); `ProjectKind`, `AiReviewStatus`, `AiConfidence`, `SubmissionContent`
(`project.ts`); `BadgeTier`, `CertificateStatus` (`gamification.ts`); `ChallengeStatus`,
`ChallengeScope` (`challenge.ts`); `SubscriptionPlan`, `SubscriptionStatus`,
`SubscriptionOwnerType`, `LicenseStatus` (`billing.ts`); `HardwareKind`, `ProgrammingMode`,
`HardwareConnectivity` (`hardware.ts`); `ClassReportRow` (`analytics.ts`); `LabToolId`
(`ai.ts`); `ActionError` (`actions.ts`). Everything is re-exported by the barrel
`@/types`.

**One definition, re-exported (MUST).** `types`, `schemas` and `limits` may import only each
other (section 1.2), yet the schemas validate against lists and formats that this document
places in modules of other layers. Each of those is declared once, in `src/types` or
`src/lib/limits.ts`, and the module named elsewhere in this document **re-exports it and
never declares it again**:

| Name | Declared in | Re-exported by |
|---|---|---|
| `Session` | `types/user.ts` | `auth/actor.ts` |
| `ROLES` | `types/common.ts` | `auth/roles.ts` |
| `LESSON_STAGES` | `types/content.ts` | `learning/stages.ts` |
| `LAB_TOOL_IDS`, `LabToolId` | `types/ai.ts` | `ai/lab-tools.ts` |
| `SELF_SIGNUP_AGE_BANDS` | `lib/limits.ts` | `auth/account-policy.ts` |
| `USERNAME_PATTERN` (`^[a-z0-9._-]{3,30}$`) | `lib/limits.ts` | used by `isValidUsername()` in `auth/username.ts` |
| `FILE_ID_PATTERN`, `FILE_NAME_PATTERN` | `lib/limits.ts` | `firebase/storage-paths.ts` |
| `EMBED_HOSTS` | `lib/limits.ts` | `learning/embed-allowlist.ts` |
| `JOIN_CODE` (`{ length: 8, alphabet, ttlHours: 24 }`) | `lib/limits.ts` | used by `data/classes` to generate and expire codes |
| `RateLimitScope` (`keyof typeof RATE_LIMITS`) | `lib/limits.ts` | used by `data/rate-limit.ts` |

`RATE_LIMITS` (requests per one-hour window): `join_lookup` 300, `join_signup` 150 and
`signup` 20 per client IP hash, `join_class` 10 per signed-in user. The anonymous values are
high on purpose: a whole school usually shares one address, and several classes must be able
to join within the same hour; the 8-character codes and their 24-hour life carry the
guessing defence.

**Where inputs and schemas live (MUST).** `src/types/inputs.ts` and `src/lib/schemas/*` are
shared modules with no `server-only` import, so client forms, server actions and
repositories all import the same definitions. Each input type `X` has a zod schema named
`<camelCase X>Schema` (for example `courseInputSchema`) in the schema file of its feature:
`auth.ts` (signup, join, session), `profile.ts`, `class.ts` (classes, roster, join, manual
badge), `school.ts`, `course.ts` (course, module, lesson, block), `learning.ts` (enrol, lesson
progress, block responses), `quiz.ts`, `project.ts`, `submission.ts` (submit, review,
upload), `certificate.ts` (issue, revoke), `ai.ts` (tutor request, lab), `admin.ts`
(challenge, licence, subscription, role change), on top of `common.ts` (builders, ids,
dates, `parseInput`). There is no barrel: a caller imports from the feature file. The
schemas enforce `CONTENT_LIMITS` (section 3.1). Repositories never define
client-facing input types. Server-internal record types (`NewUserProfile`, `NewClass`, `NewEnrollment`,
`NewQuizAttempt`, `NewSubmission`, `NewReview`, `NewAiReview`, `NewCertificate`, `NewFile`)
are built by services, never by clients, and are exported from the repository module that
consumes them.

Types not fully determined by section 3.4:

```ts
// common.ts
export type Locale = (typeof LOCALES)[number];                    // 'en' | 'fr' today
export type Localized<T> = { [locale: string]: T | undefined };
export type IsoDateString = string;
export type Role = 'student' | 'teacher' | 'school_admin' | 'platform_admin';
export type AgeBand = '8-10' | '11-12' | '13-15' | '16-18' | 'adult';
export type LearningArea = 'ai' | 'generative_ai' | 'coding' | 'robotics' | 'creativity' | 'innovation' | 'responsible_ai';
export type SubmissionType = 'text' | 'image' | 'audio' | 'video' | 'pdf' | 'file' | 'link' | 'code';
export type FileKind = 'image' | 'audio' | 'video' | 'pdf' | 'file';
export interface MediaRef { fileId: string; storagePath: string; fileName: string; contentType: string; sizeBytes: number; width: number | null; height: number | null }
export interface FileRef  { fileId: string; kind: FileKind; fileName: string; contentType: string; sizeBytes: number }
export interface Page<T> { items: T[]; nextCursor: string | null }       // nextCursor = the id of the page's last document; null on the last page
export interface PageRequest { limit?: number; cursor?: string | null }   // cursor = that id, re-read with a direct get and used as startAfter so the
                                                                          // query keeps its index; an unknown cursor (or one outside the paged list)
                                                                          // fails with ValidationError { cursor: ['invalid'] }; limit is clamped to
                                                                          // 1–100, default 50 (listReviewQueue: default 200, max 500)

// user.ts
export interface StudentSummary {          // what a teacher receives about a student: no email, consentBasis, lastLoginAt
  uid: string; displayName: string; username: string | null; ageBand: AgeBand; avatarId: string;
  status: UserStatus; xpTotal: number; level: number; canResetPassword: boolean;
}

// content.ts
export type LessonBlockOf<T extends BlockType> = {
  id: string; courseId: string; lessonId: string; type: T; stage: LessonStage; order: number;
  defaultLocale: Locale; translations: Localized<BlockTextMap[T]>; data: BlockDataMap[T];
  createdAt: IsoDateString; updatedAt: IsoDateString;
};
export type LessonBlock = { [T in BlockType]: LessonBlockOf<T> }[BlockType];
export interface CourseOutline { course: Course; modules: Module[]; lessons: Lesson[] }   // both sorted

// quiz.ts
export interface QuizAnswer { selectedOptionIds: string[]; text: string | null }
// QuizAttempt.results is `Record<…> | null`: null in the student projection until the reveal rule is met (section 3.4)
export interface QuizAttemptResult {
  attempt: QuizAttempt;                                     // student projection
  correctOptionIds: Record<string, string[]> | null;        // per quiz.revealAnswers
  explanations: Record<string, string> | null;              // resolved to the attempt's locale; same reveal rule
  attemptsRemaining: number | null;                         // max(0, maxAttempts − attemptNumber), or null when unlimited
  gamification: GamificationOutcome | null;                 // non-null on every pass, with xpAwarded 0 on a repeat pass (3.4):
}                                                           // the UI tests xpAwarded > 0 before celebrating

// learning.ts
export interface LessonPlayerData {
  course: Course; modules: Module[]; lessons: Lesson[];
  lesson: Lesson;                                           // taken from the outline, not read again
  blocks: LessonBlock[];
  enrollment: Enrollment | null; progress: LessonProgress | null;
  quizzes: Record<string, Quiz>; latestAttempts: Record<string, QuizAttempt | null>;   // student projection
  attemptsRemaining: Record<string, number | null>;
  projects: Record<string, Project>; latestSubmissions: Record<string, Submission | null>;
  previousLessonId: string | null; nextLessonId: string | null;
  readOnly: boolean;                                        // decided by the server (section 7.6)
  tutorEnabled: boolean;
}
export interface LessonCompletionResult {
  completed: boolean;
  missing: { quizIds: string[]; projectIds: string[]; reflectionBlockIds: string[] };   // non-empty when completed is false; the shape
                                                                                        // getMissingForCompletion() computes (9.4)
  enrollment: Enrollment;
  gamification: GamificationOutcome | null;
}

// project.ts
export type CriteriaScores = Record<RubricKey, number>;
export type AiReviewFlag = 'possible_personal_data' | 'unsafe_content' | 'off_topic' | 'possible_plagiarism' | 'possible_prompt_injection';
export type SubmissionTarget =
  | { context: 'project'; courseId: string; projectId: string }
  | { context: 'challenge'; challengeId: string };

// gamification.ts
export interface GamificationOutcome {
  xpAwarded: number; xpTotal: number; level: number; leveledUp: boolean;
  newBadges: Badge[]; certificate: Certificate | null;
}
export interface PublicCertificate {       // what /verify/[code] may show
  verificationCode: string; status: 'issued' | 'revoked';
  courseTitle: Localized<{ title: string }>; isOfficial: boolean;
  issuerName: string; schoolName: string | null; issuedAt: IsoDateString;
}

// challenge.ts
export type ChallengePhase = 'upcoming' | 'open' | 'closed';

// ai.ts — TutorTurn, TutorRequest, TutorStreamEvent: section 8.3
export interface ChatMessage { id: string; role: 'user' | 'assistant'; content: string }

// actions.ts
export type ActionErrorCode =
  | 'validation' | 'unauthenticated' | 'forbidden' | 'not_found' | 'conflict'
  | 'rate_limited' | 'license_required' | 'profile_missing' | 'email_unverified'
  | 'not_implemented' | 'internal';
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ActionErrorCode; fieldErrors?: Record<string, string[]>; retryAfterSeconds?: number } };
```

Input types written out (the rest of `inputs.ts` follows the action payloads of 10.4 field
for field):

```ts
// inputs.ts
export interface SignupInput { displayName: string; role: 'student' | 'teacher'; ageBand: AgeBand; locale: Locale; acceptedTerms: true }
  // schema: role 'student' → ageBand in SELF_SIGNUP_AGE_BANDS; role 'teacher' → ageBand must be 'adult'
export interface JoinSignupInput { joinCode: string; displayName: string; username: string; password: string; ageBand: AgeBand; locale: Locale; acceptedTerms: true }
export interface ClassInput { name: string; gradeLabel: string | null; ageBand: AgeBand; ownerUid?: string }
  // ownerUid: required for a school admin (an active teacher of their school); ignored for a teacher (always themselves)

export interface CourseInput {
  defaultLocale: Locale;
  translations: Localized<{ title: string; summary: string; description: string; outcomes: string[] }>;
  audience: 'student' | 'teacher'; area: LearningArea; tags: string[];
  ageMin: number | null; ageMax: number | null; estimatedMinutes: number;
  visibility: 'private' | 'school';             // teacher-made courses; official courses are always 'public'
  certificateEnabled: boolean;
  coverImageFileId: string | null;              // a registered course_media file of this course; null on create (upload needs the courseId)
  hardwarePlatformIds: string[]; requiredCapabilities: HardwareCapability[];
  // platform admin only; the schema used for teachers strips these and the repository forces
  // isOfficial: false, pathwayId: null, accessTier: 'free' for non-admin actors:
  isOfficial?: boolean; pathwayId?: string | null; order?: number; accessTier?: 'free' | 'premium';
}
export interface ModuleInput { defaultLocale: Locale; translations: Localized<{ title: string; description: string }> }
export interface LessonInput { defaultLocale: Locale; translations: Localized<{ title: string; summary: string }>; estimatedMinutes: number; xpReward: number }

// One member per block type. `data` is BlockDataMap[T], except that blocks carrying media send the file id
// of a registered course_media file instead of a MediaRef (the server builds the MediaRef):
//   image: { fileId: string }     file: { fileId: string }
//   video: { source: 'youtube' | 'vimeo' | 'file'; videoId: string | null; fileId: string | null; durationSeconds: number | null }
export type BlockInput = { [T in BlockType]: {
  type: T; stage: LessonStage; defaultLocale: Locale;
  translations: Localized<BlockTextMap[T]>; data: BlockInputDataMap[T];
} }[BlockType];

export interface QuizQuestionInput {
  id: string | null;                            // null = new question; the server assigns ids
  type: QuestionType; points: number;
  translations: Localized<{ prompt: string }>;
  options: { id: string | null; translations: Localized<{ text: string }> }[];   // [] for short_answer; true_false: ids 'true' and 'false'
  correctOptionIndexes: number[];               // indexes into `options` (new options have no id yet); [] for short_answer
  acceptedAnswers: Localized<string[]>;         // short_answer only; {} otherwise
  explanation: Localized<{ text: string }>;     // may be {}
}
export interface QuizInput {                    // carries the answer key; only ever sent by an author to saveQuizAction
  defaultLocale: Locale;
  translations: Localized<{ title: string; instructions: string | null }>;
  passingScorePercent: number; maxAttempts: number | null; xpReward: number;
  shuffleQuestions: boolean; revealAnswers: 'after_pass' | 'after_attempt' | 'never';
  questions: QuizQuestionInput[];
}
export interface ProjectInput {
  kind: 'project' | 'assignment'; defaultLocale: Locale;
  translations: Localized<{ title: string; brief: string; requirements: string }>;
  allowedSubmissionTypes: SubmissionType[];
  rubric: RubricWeight[];                       // weights sum to 100
  xpReward: number; requiredForCertificate: boolean;
}
```

Input types that section 10.4 names but does not spell out:

```ts
export interface ProfilePatch { displayName?: string; locale?: Locale; avatarId?: string }   // avatarId: one of AVATAR_IDS
export interface SchoolInput { name: string; country: string; city: string | null; defaultLocale: Locale }
  // name 2–120 chars; country is upper-cased; a new school starts 'active' with settings chosen by the server
export interface SchoolPatch { name?: string; country?: string; city?: string | null; defaultLocale?: Locale; settings?: SchoolSettings }
  // the patch of data/schools.updateSchool; `settings` is replaced as a whole
export type UpdateSchoolSettingsInput = Omit<SchoolPatch, 'country'>;
export interface SubscriptionInput {
  ownerType: 'user' | 'school'; ownerId: string; plan: SubscriptionPlan; status: SubscriptionStatus;
  currentPeriodStart: IsoDateString; currentPeriodEnd: IsoDateString; courseIds: string[]; notes: string | null;
}   // provider 'manual' and the provider ids are set by the server
export interface LicenseInput {
  schoolId: string; subscriptionId: string | null; name: string; seatsTotal: number; scope: LicenseScope;
  startsAt: IsoDateString; endsAt: IsoDateString; status: LicenseStatus;
}
export interface ChallengeInput {
  type: ChallengeType; scope: ChallengeScope; schoolId: string | null; area: LearningArea;
  ageMin: number | null; ageMax: number | null; startAt: IsoDateString; deadlineAt: IsoDateString;
  allowedSubmissionTypes: SubmissionType[]; rubric: RubricWeight[]; xpReward: number;
  coverImageFileId: string | null;              // an official course_media file registered with courseId null
  hardwarePlatformIds: string[]; requiredCapabilities: HardwareCapability[];
  defaultLocale: Locale;
  translations: Localized<{ title: string; description: string; submissionRequirements: string; prizes: string | null }>;
}   // no status: a new challenge is 'draft' and only setChallengeStatusAction changes it
```

Every action payload of 10.4 has a named input type in `inputs.ts` and, by the naming rule
above, a schema (`UpdateClassInput` → `updateClassInputSchema`):

| Schema file | Action → input type |
|---|---|
| `auth.ts` | `createSessionAction` → `CreateSessionInput`; sign-up form → `SignupInput`; `completeSignupAction` → `CompleteSignupInput`; `lookupJoinCodeAction` → `LookupJoinCodeInput`; `joinClassSignupAction` → `JoinSignupInput`. Field schemas for forms: `displayNameSchema`, `accountEmailSchema`, `usernameSchema`, `passwordSchema` (8–128 characters), `joinCodeSchema`, `ageBandSchema` |
| `common.ts` | `getClientAuthTokenAction`, `signOutAction` → no payload: `noInputSchema` |
| `profile.ts` | `updateProfileAction` → `ProfilePatch` (`profilePatchSchema`) |
| `learning.ts` | `enrollInCourseAction` → `EnrollInCourseInput`; `startLessonAction`, `completeLessonAction`, `deleteLessonAction` → `LessonRefInput`; `saveBlockResponseAction` → `SaveBlockResponseInput` |
| `quiz.ts` | `submitQuizAttemptAction` → `SubmitQuizAttemptInput` (answers: `quizAnswerSchema`); `saveQuizAction` → `SaveQuizInput` (`input`: `QuizInput`, `quizInputSchema`; one question: `quizQuestionInputSchema`); `deleteQuizAction` → `QuizRefInput` |
| `project.ts` | `saveProjectAction` → `SaveProjectInput` (`input`: `ProjectInput`); `deleteProjectAction` → `ProjectRefInput`. Shared with challenges: `rubricSchema`, `allowedSubmissionTypesSchema` |
| `submission.ts` | `registerUploadAction` → `RegisterUploadInput`; `deleteAttachmentAction` → `DeleteAttachmentInput`; `submitWorkAction` → `SubmitWorkInput`; `reviewSubmissionAction` → `ReviewInput`; `regenerateAiReviewAction` → `RegenerateAiReviewInput`. Also `fileNameSchema` |
| `class.ts` | `createClassAction` → `ClassInput`; `updateClassAction` → `UpdateClassInput`; `archiveClassAction`, `regenerateJoinCodeAction` → `ClassRefInput`; `addStudentsAction` → `AddStudentsInput`; `removeStudentAction` → `RemoveStudentInput`; `resetStudentPasswordAction` → `ResetStudentPasswordInput`; `assignCourseAction` → `AssignCourseInput`; `unassignCourseAction` → `UnassignCourseInput`; `joinClassAction` → `JoinClassInput`; `awardBadgeAction` → `AwardBadgeInput` |
| `course.ts` | `createCourseAction` → `CourseInput`; `updateCourseAction` → `UpdateCourseInput`; `setCourseStatusAction` → `SetCourseStatusInput`; `createModuleAction` → `CreateModuleInput`; `updateModuleAction` → `UpdateModuleInput`; `deleteModuleAction` → `ModuleRefInput`; `reorderModulesAction` → `ReorderModulesInput`; `createLessonAction` → `CreateLessonInput`; `updateLessonAction` → `UpdateLessonInput`; `reorderLessonsAction` → `ReorderLessonsInput`; `createBlockAction` → `CreateBlockInput`; `updateBlockAction` → `UpdateBlockInput`; `deleteBlockAction` → `BlockRefInput`; `reorderBlocksAction` → `ReorderBlocksInput`. `ModuleInput`, `LessonInput` and `BlockInput` have their own schemas for the editors |
| `certificate.ts` | `issueCertificateAction` → `IssueCertificateInput`; `revokeCertificateAction` → `RevokeCertificateInput` |
| `school.ts` | `createTeacherAction` → `CreateTeacherInput`; `setSchoolUserStatusAction` and `setUserStatusAction` → `SetUserStatusInput`; `updateSchoolSettingsAction` → `UpdateSchoolSettingsInput`; `setClassTeachersAction` → `SetClassTeachersInput`. Also `schoolInputSchema`, `schoolPatchSchema`, `schoolSettingsSchema` |
| `admin.ts` | `createSchoolAction` → `CreateSchoolInput`; `updateSchoolAction` → `UpdateSchoolInput`; `setSchoolStatusAction` → `SetSchoolStatusInput`; `setUserRoleAction` → `SetUserRoleInput`; `setVerifiedEducatorAction` → `SetVerifiedEducatorInput`; `upsertSubscriptionAction` → `UpsertSubscriptionInput`; `upsertLicenseAction` → `UpsertLicenseInput`; `upsertChallengeAction` → `UpsertChallengeInput`; `setChallengeStatusAction` → `SetChallengeStatusInput` |
| `ai.ts` | `runLabToolAction` → `RunLabToolInput`; `POST /api/ai/tutor` → `TutorRequest` (`tutorRequestSchema`) |

Rules the schemas enforce beyond field types and `CONTENT_LIMITS`, so no form or service
has to repeat them:

- **Normalisation**: text is trimmed, except code, saved block responses and tutor turns
  (indentation matters). Emails and usernames are lower-cased, join codes upper-cased with
  spaces and dashes removed, tags lower-cased, country codes upper-cased. Unknown keys are
  dropped, so a payload can never smuggle in `storagePath`, a score or an XP amount.
- **Translated content**: the listed fields must be non-blank in `translations[defaultLocale]`
  (message `default_locale_required` on that field); other locales may be partial; a locale
  key is any well-formed language tag, not only `LOCALES`. A patch (`Partial<…Input>`) must
  carry `translations` and `defaultLocale` together or not at all.
- **Courses**: `courseInputSchema` and `updateCourseInputSchema` accept the four
  platform-admin fields. The `course-editor` actions serve both roles with them and call
  `stripAdminCourseFields(data)` when the session is not a platform admin
  (`teacherCourseInputSchema` is the same input with those fields already dropped).
- **Blocks**: `video` uses `videoId` (11-character YouTube id or numeric Vimeo id) for
  `youtube`/`vimeo` and `fileId` for `file`, never both; `embed.url` is an https URL on
  `EMBED_HOSTS` with no port and no credentials (`isEmbeddableUrl`, exported by
  `schemas/course.ts`); `quiz` and `project` blocks need no text.
- **Quizzes**: 1–50 questions; `multiple_choice` and `true_false` have exactly one correct
  option, `multiple_answer` at least one; other types need at least two options;
  `short_answer` has no options and at least one accepted answer in the default locale.
- **Rubrics**: one entry per criterion at most, weights sum to 100.
- **Submissions**: the content named by `type` must be present (text, code, an https link,
  or at least one file for the uploaded kinds). **Reviews**: `criteria` is required for
  `modify` and must be null otherwise; feedback is never blank.
- **Uploads**: `fileNameSchema` is `FILE_NAME_PATTERN` minus the names made only of dots
  (`.`, `..`), which the pattern and the Storage rules let through: the server builds the
  storage path from the name, so such an upload cannot be registered.
- **Tutor requests**: section 8.3, plus: a `lessonId` needs its `courseId`, and no user turn
  is blank.
- **Admin**: `setUserRole` needs a `schoolId` for `school_admin` and none for
  `platform_admin`; a subscription's `courseIds` is non-empty exactly for `course_purchase`
  and `teacher_training`, `individual_*` plans belong to a user and `school_annual` to a
  school; period, licence and challenge dates are ordered; a `school`-scoped challenge names
  its school and a `global` one does not; a `pathways` licence scope lists at least one
  pathway. `settings.aiDailyMessageLimit` outside 1–200 is rejected in a form; the
  repository still clamps, for callers that do not come through a schema.
- **Unions**: a schema validates a union with `oneOf(<its tuple>)`. The three unions written
  inline in a type (`SignupInput.role`, `CourseInput.visibility`, `TutorTurn.role`) have no
  tuple; their schemas use `unionOf<Union>()([...])`, which fails the build when the list
  and the union differ.

`saveQuiz` splits a `QuizInput` into the student-readable quiz document and `private/key`
(`correctOptionIds`, `acceptedAnswers`, `explanations`) in one batch. The quiz editor loads
an existing quiz through `getQuizWithKey` and maps it back to a `QuizInput` in the page.

Shared helpers:

```ts
// src/lib/errors.ts (shared) — `message` is for server logs only and never reaches the browser
export class AppError extends Error { constructor(public code: ActionErrorCode, message?: string) }
export class UnauthenticatedError / ForbiddenError / NotFoundError / ConflictError / LicenseRequiredError extends AppError   // constructor(message?)
export class ValidationError extends AppError { constructor(message?: string, public fieldErrors?: Record<string, string[]>) }
export class RateLimitError extends AppError { constructor(public retryAfterSeconds: number | null, message?: string) }
export function isAppError(error: unknown): error is AppError;

// src/lib/actions/result.ts (shared)
export function ok<T>(data: T): ActionResult<T>;
export function fail(code: ActionErrorCode, extra?: { fieldErrors?: Record<string, string[]>; retryAfterSeconds?: number }): ActionResult<never>;

// src/lib/actions/run-action.ts ('server-only') — two overloads, so the handler's `session` is typed by the option
export interface ActionContext { locale: Locale }
export function runAction<I, O>(
  schema: z.ZodType<I>, input: unknown,
  handler: (data: I, session: Session, ctx: ActionContext) => Promise<O>,
  options: { roles: readonly Role[] },
): Promise<ActionResult<O>>;
export function runAction<I, O>(
  schema: z.ZodType<I>, input: unknown,
  handler: (data: I, session: null, ctx: ActionContext) => Promise<O>,   // auth actions only; no session is resolved
  options: { allowAnonymous: true },
): Promise<ActionResult<O>>;
// `I` is the schema's output type (after trimming and other transforms). An action without a payload passes
// `noInputSchema` and `undefined`.

// src/lib/schemas/common.ts (shared)
export const VALIDATION_KEYS: readonly [...];    // the keys of the `validation` namespace (10.5)
export type ValidationKey = (typeof VALIDATION_KEYS)[number];
export function isValidationKey(value: string): value is ValidationKey;
export const FORM_ERROR_KEY = '_form';           // fieldErrors key for a problem with the input as a whole
export type ParsedInput<T> = { success: true; data: T } | { success: false; fieldErrors: Record<string, string[]> };
export function parseInput<T>(schema: z.ZodType<T>, input: unknown): ParsedInput<T>;   // the one way to run a schema
export function toFieldErrors(error: z.ZodError): Record<string, string[]>;
export const noInputSchema: z.ZodUndefined;
export const ID_PATTERN: RegExp; export const COMPOSITE_ID_PATTERN: RegExp;             // section 3.1
export const idSchema, compositeIdSchema, fileIdSchema, idOrNullSchema, isoDateSchema, localeSchema;
// builders used by the feature files: text(), requiredText(), int(), bool(), oneOf(), unionOf(), obj(), list(), uniqueList(),
// localized(), emailSchema(), httpsUrlSchema(), whenPresent(), requireDefaultLocale(), checkTranslationsPatch(),
// checkAgeRange(), checkDateOrder(), addMissingDefaultLocale()

// src/lib/i18n/content.ts (section 3.2; the parameter type is the shape of Localized<T>, written out
// so the module imports nothing)
export function pickTranslation<T extends object>(translations: Localized<T>, locale: string, defaultLocale: string): T;
export function hasTranslation<T extends object>(translations: Localized<T>, locale: string): boolean;

// src/lib/learning (shared pure helpers; gradeQuiz / normalizeAnswer are in section 3.4, getMissingForCompletion in 9.4)
export interface StageGroup<B> { stage: LessonStage; blocks: B[] }
export function groupBlocksByStage<B extends { stage: LessonStage; order: number }>(blocks: readonly B[]): StageGroup<B>[];
                                                 // only the stages that have blocks, in LESSON_STAGES order, blocks sorted by order
                                                 // (also the StageStepper list of 7.6)
export function getChallengePhase(challenge: Pick<Challenge, 'startAt' | 'deadlineAt'>, now: Date | IsoDateString): ChallengePhase;
                                                 // 'upcoming' before startAt, 'open' from startAt, 'closed' from deadlineAt on; dates only,
                                                 // status is not looked at
export function toEmbedUrl(url: string): string | null;              // the normalised href, or null; the same rule as schemas/course.isEmbeddableUrl
                                                                     // without importing it (a unit test keeps the two equal); EmbedBlock renders nothing on null
export function toVideoEmbedUrl(source: 'youtube' | 'vimeo', videoId: string): string | null;   // for VideoBlock

// src/lib/firebase/storage-paths.ts (shared)
export const UPLOAD_LIMITS: Record<FileKind, { maxBytes: number; contentTypes: string[]; extensions: string[] }>;
                                                 // extensions are lower-case with the dot (ready for an input's accept attribute);
                                                 // `file`.contentTypes does not list application/octet-stream (5.2)
export const OCTET_STREAM_EXTENSIONS: readonly string[];              // ['.sb3', '.ipynb']
export const STORAGE_EMULATOR_ORIGIN = 'http://127.0.0.1:9199';
export const FILE_ID_PATTERN: RegExp;            // ^[0-9a-f-]{36}$
export const FILE_NAME_PATTERN: RegExp;          // ^[A-Za-z0-9._-]{1,100}$
export function userUploadPath(uid: string, kind: FileKind, fileId: string, fileName: string): string;
export function authorMediaPath(uid: string, fileId: string, fileName: string): string;
export function officialMediaPath(fileId: string, fileName: string): string;
                                                 // the builders throw on a uid, file id, file name or kind that fails its pattern, and on a dot-only name
export function isPublicMediaPath(storagePath: string): boolean;     // true only under course-media/official/
export function mediaUrl(media: Pick<MediaRef, 'fileId' | 'storagePath'>): string;
                                                 // public Storage URL for official media, `/api/files/${fileId}` for everything else
                                                 // (official media too while the five NEXT_PUBLIC_FIREBASE_* variables are not all set)
export function sanitizeFileName(name: string): string;              // never yields a dot-only name
export type UploadProblem = 'file_type_not_allowed' | 'file_too_large';
export function isAllowedContentType(kind: FileKind, contentType: string, fileName: string): boolean;   // the octet-stream rule of 5.2
export function checkUpload(kind: FileKind, file: { contentType: string; sizeBytes: number; fileName: string }): UploadProblem | null;
export function uploadContentType(kind: FileKind, fileName: string, declaredType: string): string | null;
                                                 // the type to store: decided by the extension when it is a known one for the kind (browsers
                                                 // disagree on .zip, .ipynb …), else the browser's declared type; null when not allowed

// src/lib/firebase/upload-client.ts (client)
export function uploadFile(args: {
  file: File; kind: FileKind; onProgress?: (percent: number) => void;
} & ({ purpose: 'submission' } | { purpose: 'course_media'; courseId: string | null; official: boolean })):
  Promise<{ fileId: string; fileName: string; width: number | null; height: number | null }>;
  // calls ensureClientAuth() first; retries once with { force: true } after a Storage permission-denied; the stored content
  // type comes from uploadContentType(); refused before any network call with ValidationError (fieldErrors.file) when the
  // file fails checkUpload; every failure is an AppError (validation, unauthenticated, forbidden, internal). Returns the
  // sanitised fileName, which the caller (FileUpload) passes unchanged to registerUploadAction

// src/lib/auth/client.ts (client)
export function signInWithIdentifier(identifier: string, password: string): Promise<{ idToken: string }>;
export function signUpWithEmail(email: string, password: string): Promise<{ idToken: string }>;
export function sendVerificationEmail(): Promise<void>;       // for the user currently signed in on the client
export function sendPasswordReset(email: string): Promise<void>;
export function ensureClientAuth(options?: { force?: boolean }): Promise<void>;
                                                              // section 1.5; `force` signs in again even when a client user exists;
                                                              // throws AppError('unauthenticated') when the server session is gone
export function signOutClient(): Promise<void>;
```

Error messages shown to users are looked up by code in the `errors` namespace
(`errors.<code>`); servers never send free-text error messages to the client.

The same holds for `fieldErrors` (MUST): each string is a **key of the `validation`
namespace** (listed in 10.5), not text. Every zod schema in `src/lib/schemas` therefore sets
the message of each check to one of those keys (`z.string({ error: 'required' }).min(2,
'display_name_length')`), and `runAction` passes the messages through unchanged. A form
renders `t(key)` from `useTranslations('validation')` when `t.has(key)` is true and
`t('invalid')` otherwise, so a message that is not a known key (zod's built-in English text)
never reaches the screen. Keys carry no parameters; a limit that the user should know is
shown as a field hint by the form's own namespace.

Two mechanisms keep this true. `parseInput(schema, input)` runs the schema with a fallback
error map that gives every issue no schema labelled its key (`required` for a missing value,
`too_long`, `invalid_choice`, …), so it never yields zod's English text; `runAction` uses
it, and **forms validate with `parseInput` too, never with a bare `schema.safeParse()`**, so
client and server produce the same `fieldErrors`. And `VALIDATION_KEYS` is the typed list of
the namespace: a unit test fails when it and the two `validation.json` files differ, so
adding a key means adding it to the list and to both locales.

Services add field errors beyond the schemas, always with existing `VALIDATION_KEYS`:
`username: ['duplicate']` (`signUpWithJoinCode`), `ownerUid: ['required' | 'invalid_choice']`
(`createClass`), `teacherUids: ['required' | 'too_many' | 'invalid_choice']`
(`setClassTeachers`), `role: ['invalid_choice']`, `schoolId: ['required' | 'invalid']`
(`changeUserRole`), `status: ['invalid_choice']` (`setUserStatus`), `school.<field>`,
`adminDisplayName`, `adminEmail` (`createSchoolWithAdmin`), `file: ['file_type_not_allowed' |
'file_too_large']` (`registerUpload`), `type: ['invalid_choice']` (`submitWork`), `criteria:
['required']` (`reviewSubmission`), `cursor: ['invalid']` (paging).

### 10.2 Repository functions (`src/lib/data`)

Every function takes `actor: Actor` first (exceptions flagged †) and returns domain types.
Functions that find nothing throw `NotFoundError` unless the return type includes `null`.
"system only" means the function starts with `assertSystem(actor)`; it is reachable only
from services and gamification.

```ts
// users.ts
loadProfileForSession(uid): Promise<UserProfile | null>                    // † used only by auth/session and auth/claims
getUser(actor, uid): Promise<UserProfile>                                  // self, school admin of the user's school, platform admin; a teacher
                                                                           // gets NotFoundError even for a pupil of their class (classroom.
                                                                           // getStudentForTeacher reads the profile as the system)
listSchoolUsers(actor, schoolId, role: Role, page?: PageRequest): Promise<Page<UserProfile>>
listUsersByRole(actor, role: Role, page?: PageRequest): Promise<Page<UserProfile>>
createUserProfile(actor, uid, input: NewUserProfile): Promise<UserProfile>     // system only; Firestore create(), ConflictError if the profile exists;
  // NewUserProfile = { role, schoolId, displayName, username, email, ageBand, locale, consentBasis, provisionedByUid, avatarId? };
  // role is validated against ROLES and avatarId (default DEFAULT_AVATAR_ID) against AVATAR_IDS (ValidationError before any write)
updateProfile(actor, uid, patch: ProfilePatch): Promise<UserProfile>          // displayName, locale, avatarId (must be in AVATAR_IDS)
setIdentity(actor, uid, patch: { role?: Role; schoolId?: string | null; status?: UserStatus }): Promise<void>   // system only; used by services/identity;
  // ConflictError on a role change while users.classIds is not empty (removeUserFromAllClasses first); a role change to anything
  // but teacher also sets verifiedEducator: false
setVerifiedEducator(actor, uid, verified: boolean): Promise<void>             // platform admin; ConflictError when the target is not a teacher
setSessionsValidAfter(actor, uid, at: Date): Promise<void>                    // system only; stores whole seconds rounded down (section 1.5)
touchLastLogin(actor, uid): Promise<void>                                     // system only

// schools.ts
getSchool(actor, schoolId): Promise<School>
listSchools(actor, page?: PageRequest): Promise<Page<School>>
createSchool(actor, input: SchoolInput): Promise<School>
updateSchool(actor, schoolId, patch: Partial<Pick<School, 'name' | 'country' | 'city' | 'defaultLocale' | 'settings'>>): Promise<School>
                                                                               // clamps settings.aiDailyMessageLimit to 1–200 (null = platform default);
                                                                               // `settings` is replaced as a whole; `country` may be changed by a platform
                                                                               // admin only (a school admin sending it gets ForbiddenError)
setSchoolStatus(actor, schoolId, status: School['status']): Promise<void>
adjustSchoolCounts(actor, schoolId, delta: Partial<School['counts']>): Promise<void>   // system only

// classes.ts
getClass(actor, classId): Promise<SchoolClass>
listClassesForTeacher(actor, teacherUid, opts?: { includeArchived?: boolean }): Promise<SchoolClass[]>
                                                                               // assertRole(teacher, school_admin, platform_admin), then filtered with
                                                                               // canManageClass: a school admin sees the teacher's classes of their own
                                                                               // school, a teacher the classes they (co-)teach
listClassesForSchool(actor, schoolId, opts?: { includeArchived?: boolean }): Promise<SchoolClass[]>
findClassByJoinCode(actor, code): Promise<SchoolClass | null>                 // system only; null for an archived class or a code that is not the
                                                                               // class's current one; the caller checks enabled/expiry
createClass(actor, input: NewClass): Promise<SchoolClass>                     // system only (classroom.createClass validates the owner); class + joinCodes doc
updateClass(actor, classId, patch: { name?: string; gradeLabel?: string | null; ageBand?: AgeBand; joinCodeEnabled?: boolean }): Promise<SchoolClass>
                                                                               // joinCodeEnabled: true sets joinCodeExpiresAt = now + 24 h (also when the
                                                                               // code was already enabled); false sets it to null; ConflictError on an
                                                                               // archived class. schools.settings.joinCodesEnabled is not checked here
                                                                               // (the join path enforces it, 10.3)
archiveClass(actor, classId): Promise<void>                                   // also deletes the joinCodes doc, sets joinCodeEnabled false and
                                                                               // joinCodeExpiresAt null, decrements schools.counts.classes; memberships stay
regenerateJoinCode(actor, classId): Promise<string>                           // new code + delete old code, one transaction; resets the 24 h expiry;
                                                                               // ConflictError on an archived class
setTeachers(actor, classId, teacherUids: string[]): Promise<void>             // system only (classroom.setClassTeachers validates); ConflictError when the
                                                                               // list omits the owner, exceeds 5, names a non-teacher, or a teacher would
                                                                               // exceed 30 classes
listMembers(actor, classId): Promise<ClassMember[]>                           // canManageClass (never students)
addMember(actor, classId, student: UserProfile, addedByUid: string | null): Promise<void>   // system only; idempotent; the roster entry copies
                                                                               // displayName/username/ageBand from the profile read inside the transaction;
                                                                               // ConflictError when the profile is not a student, the class holds 60
                                                                               // students, or the student is in 30 classes
removeMember(actor, classId, studentUid): Promise<void>                       // system only
removeUserFromAllClasses(actor, uid): Promise<void>                           // system only; one transaction: deletes the user's members documents (with the
                                                                               // studentCount decrements), removes the uid from every teacherUids (archived
                                                                               // classes included), empties users.classIds; ConflictError while the user owns
                                                                               // a non-archived class. Called by provisioning.changeUserRole (3.6)
listAssignments(actor, classId): Promise<ClassAssignment[]>
setAssignment(actor, classId, courseId, dueAt: IsoDateString | null): Promise<void>
removeAssignment(actor, classId, courseId): Promise<void>

// pathways.ts — pathways are written only by migration scripts in the MVP
listPublishedPathways(): Promise<Pathway[]>                                    // † ordered; callers filter by audience in memory
getPublishedPathway(pathwayId): Promise<Pathway | null>                        // †
listPathways(actor): Promise<Pathway[]>                                        // platform admin: includes drafts (course editor select); the whole
                                                                               // collection, sorted by `order` in memory (3.7)

// courses.ts
listPublishedCoursesByPathway(pathwayId): Promise<Course[]>                    // †
listPublishedCoursesByArea(area: LearningArea): Promise<Course[]>              // †
getPublishedCourse(courseId): Promise<Course | null>                           // †
getCourse(actor, courseId): Promise<Course>
getCourses(actor, courseIds: string[]): Promise<Course[]>                      // silently drops ones the actor cannot view
getCourseOutline(actor, courseId): Promise<CourseOutline>
listCoursesByOwner(actor, ownerUid): Promise<Course[]>
listSchoolCourses(actor, schoolId): Promise<Course[]>                          // teacher: only visibility 'school'; school admin, platform admin, system:
                                                                               // every non-official course of the school that canViewCourse allows (3.7)
listOfficialCourses(actor): Promise<Course[]>
createCourse(actor, input: CourseInput): Promise<Course>
updateCourse(actor, courseId, patch: Partial<CourseInput>): Promise<Course>   // ConflictError on a pathwayId or isOfficial change while published, and on
                                                                               // switching audience to 'teacher' while any lesson has projectIds
setCourseStatus(actor, courseId, status: CourseStatus): Promise<Course>
createModule(actor, courseId, input: ModuleInput): Promise<Module>
updateModule(actor, courseId, moduleId, patch: Partial<ModuleInput>): Promise<Module>
deleteModule(actor, courseId, moduleId): Promise<void>                        // ConflictError unless the module holds no lessons (3.1); no cascade
reorderModules(actor, courseId, orderedIds: string[]): Promise<void>
getLesson(actor, courseId, lessonId): Promise<Lesson>
createLesson(actor, courseId, moduleId, input: LessonInput): Promise<Lesson>
updateLesson(actor, courseId, lessonId, patch: Partial<LessonInput>): Promise<Lesson>
deleteLesson(actor, courseId, lessonId): Promise<void>
reorderLessons(actor, courseId, moduleId, orderedIds: string[]): Promise<void>
listBlocks(actor, courseId, lessonId): Promise<LessonBlock[]>
createBlock(actor, courseId, lessonId, input: BlockInput): Promise<LessonBlock>
updateBlock(actor, courseId, lessonId, blockId, input: BlockInput): Promise<LessonBlock>   // full replacement of one block
deleteBlock(actor, courseId, lessonId, blockId): Promise<void>
reorderBlocks(actor, courseId, lessonId, orderedIds: string[]): Promise<void>
// Block writes run one transaction that also maintains lessons.blockCount/quizIds/projectIds/reflectionBlockIds/
// tutorExcerpt and quizzes.lessonId / projects.lessonId, resolves `fileId`s to MediaRefs (files of this course only),
// rejects a second block referencing an already linked quiz or project (a quiz/project document without a lessonId
// field counts as unlinked), and rejects (ConflictError) a `project` block in a course with audience 'teacher'. Deletes
// obey the rule of section 3.1; deleteLesson cascades to its blocks and clears the lessonId links of its quizzes/projects.

// quizzes.ts
getQuiz(actor, courseId, quizId): Promise<Quiz>                                        // never includes the key
getQuizWithKey(actor, courseId, quizId): Promise<{ quiz: Quiz; key: QuizAnswerKey }>   // canEditCourse or system only
listQuizzes(actor, courseId): Promise<Quiz[]>
saveQuiz(actor, courseId, quizId: string | null, input: QuizInput): Promise<Quiz>      // quiz + private/key in one batch; rejects > 700 KB
deleteQuiz(actor, courseId, quizId): Promise<void>                                     // ConflictError if linked (lessonId) or the course has enrollments
createAttempt(actor, input: NewQuizAttempt): Promise<QuizAttempt>
  // system only. One transaction: read the enrollment, enforce quiz.maxAttempts against quizSummary[quizId].attempts,
  // create quizAttempts/{uid}_{courseId}_{quizId}_{n} with create(), update quizSummary. The repository computes n.
getAttempt(actor, attemptId): Promise<QuizAttempt>                                     // student projection for the owner
getLatestAttempt(actor, userUid, courseId, quizId): Promise<QuizAttempt | null>        // direct get by deterministic id; null when none, ForbiddenError when
                                                                                       // it exists but the actor may not see it (4.4)
listRecentAttemptsForUser(actor, userUid, opts: { limit: number; classId?: string }): Promise<QuizAttempt[]>   // the owner's rows carry results: null (3.4)
listAttemptsForClass(actor, classId, opts?: { courseId?: string; page?: PageRequest }): Promise<Page<QuizAttempt>>
listAttemptsForClasses(actor, classIds: string[], limit: number): Promise<QuizAttempt[]>
markAttemptEffectsApplied(actor, attemptId): Promise<void>                             // system only
isAttemptRevealed(attempt: QuizAttempt, revealAnswers: RevealAnswers): boolean         // pure projections (3.4), no actor
toStudentAttempt(attempt: QuizAttempt, revealAnswers: RevealAnswers): QuizAttempt

// enrollments.ts
getEnrollment(actor, userUid, courseId): Promise<Enrollment | null>                    // null when none; ForbiddenError when it exists but canViewLearnerRecord fails
listEnrollmentsForUser(actor, userUid, opts?: { classId?: string }): Promise<Enrollment[]>
getEnrollmentsForUsers(actor, userUids: string[], courseId): Promise<Record<string, Enrollment | null>>   // ForbiddenError as a whole when one found
                                                                                       // enrollment fails canViewLearnerRecord (getClassReport reads them directly)
hasEnrollments(actor, courseId): Promise<boolean>                                      // delete guard
createEnrollment(actor, input: NewEnrollment): Promise<Enrollment>                     // system only; idempotent (returns the existing one)
upsertClassEnrollments(actor, inputs: NewEnrollment[]): Promise<void>
  // system only; batched. Creates missing enrollments; for an existing one with classId null, merges classId, schoolId, source 'class'
setEnrollmentClassContext(actor, userUid, courseId, ctx: { classId: string | null; schoolId: string | null }): Promise<void>   // system only
listEnrollmentsForUserInClass(actor, userUid, classId): Promise<Enrollment[]>          // system only (removal)
getLessonProgress(actor, userUid, courseId, lessonId): Promise<LessonProgress | null>
markLessonStarted(actor, userUid, courseId, lessonId): Promise<void>                   // the learner themselves (actor.uid === userUid) or the system; a platform
                                                                                       // admin is refused (4.2: learning is Own only); NotFoundError when not
                                                                                       // enrolled or the lesson does not exist
saveBlockResponse(actor, userUid, courseId, lessonId, blockId, text: string): Promise<void>   // ≤ 10 000 chars; same actor rule as markLessonStarted
applyLessonCompletion(actor, userUid, courseId, lessonId, totalLessonCount: number):
  Promise<{ alreadyCompleted: boolean; effectsApplied: boolean; courseCompleted: boolean; enrollment: Enrollment }>   // section 9.4; learner or system;
  // on the already-completed path courseCompleted is true only when that lesson completed the course
markLessonEffectsApplied(actor, userUid, courseId, lessonId): Promise<void>            // system only
setEnrollmentCertificate(actor, userUid, courseId, certificateId: string | null): Promise<void>   // system only

// projects.ts
getProject(actor, courseId, projectId): Promise<Project>
listProjects(actor, courseId): Promise<Project[]>
saveProject(actor, courseId, projectId: string | null, input: ProjectInput): Promise<Project>
deleteProject(actor, courseId, projectId): Promise<void>                               // ConflictError if linked (lessonId) or the course has enrollments

// submissions.ts
getSubmission(actor, submissionId): Promise<Submission>
listSubmissionsForStudent(actor, studentUid, opts?: { limit?: number; classId?: string; context?: 'project' | 'challenge' }): Promise<Submission[]>
getLatestSubmission(actor, studentUid, target: { courseId: string; projectId: string } | { challengeId: string }): Promise<Submission | null>
                                                                                       // null when none, and for a staff actor also when the latest one is not
                                                                                       // theirs to see (4.4); NotFoundError for a classmate
listReviewQueue(actor, classIds: string[], opts?: { limit?: number }): Promise<Submission[]>
countReviewQueue(actor, classIds: string[]): Promise<number>
listSubmissionsForClass(actor, classId, page?: PageRequest): Promise<Page<Submission>>
listSubmissionsForChallenge(actor, challengeId, page?: PageRequest): Promise<Page<Submission>>
createSubmission(actor, input: NewSubmission): Promise<Submission>
  // system only. One transaction: enforce "no previous attempt, or the latest is returned" and the 10-attempt cap
  // (project: enrollment.projectSummary; challenge: latest entry by query), create the document with its
  // deterministic id via create(), update projectSummary or challenges.submissionCount (a student's first entry only), and
  // attach the files (sets files/{fileId}.submissionId after checking ownerUid, purpose 'submission' and submissionId null,
  // so services need not call attachFilesToSubmission). NewSubmission.previousSubmissionId null is accepted whatever is
  // stored; a non-null value naming an attempt other than the stored latest one is ConflictError; the document always
  // records the latest attempt found in the transaction.
addReview(actor, submissionId, input: NewReview): Promise<Submission>                  // review + final* + status + projectSummary + effectsApplied, one transaction
listReviews(actor, submissionId): Promise<TeacherReview[]>
getAiReview(actor, submissionId, aiReviewId): Promise<AiReview>                        // canViewAiReview
saveAiReview(actor, submissionId, review: NewAiReview): Promise<AiReview>              // system only
setAiReviewPending(actor, submissionId): Promise<void>                                 // system only; increments aiRegenerations; at AI_LIMITS.review.maxRegenerations
                                                                                       // (3) throws ConflictError and,
                                                                                       // if the review was still 'pending', writes aiReviewStatus 'failed' (9.4)
setAiReviewSkipped(actor, submissionId): Promise<void>                                 // system only
markAiReviewed(actor, submissionId): Promise<Submission>                               // system only; unsupervised acceptance
markAiReturned(actor, submissionId): Promise<Submission>                               // system only; unsupervised return
markSubmissionEffectsApplied(actor, submissionId, xpAwarded: number): Promise<void>    // system only
setSubmissionClassContext(actor, submissionId, ctx: { classId: string | null; schoolId: string | null }): Promise<void>   // system only
listOpenSubmissionsForStudent(actor, studentUid, filter: { courseId?: string; classId?: string | null }): Promise<Submission[]>   // system only (re-pointing)
removeAttachment(actor, submissionId, fileId): Promise<void>                           // system only

// files.ts
registerFile(actor, input: NewFile): Promise<FileRecord>                               // system only; create(), ConflictError if files/{fileId} exists
checkAndCountUpload(actor, sizeBytes: number): Promise<{ allowed: boolean }>           // uploadUsage transaction (UPLOAD_QUOTAS); ForbiddenError for a SystemActor
                                                                                       // (a quota belongs to a session user); allowed: false counts nothing
getFile(actor, fileId): Promise<FileRecord>                                            // owner or platform admin, else NotFoundError (4.4); services load others as system
getOwnFiles(actor, fileIds: string[]): Promise<FileRecord[]>                           // in the order of fileIds; NotFoundError if any is not owned by the actor
getCourseMediaFiles(actor, courseId, fileIds: string[]): Promise<FileRecord[]>         // canEditCourse; throws if any file is not media of that course
attachFilesToSubmission(actor, fileIds: string[], submissionId): Promise<void>         // system only
deleteFile(actor, fileId): Promise<void>                                               // system only
toFileRef(file: FileRecord): FileRef
toMediaRef(file: FileRecord): MediaRef

// badges.ts — badge definitions are written only by migration scripts in the MVP
listBadges(actor, opts?: { activeOnly?: boolean }): Promise<Badge[]>                   // reference data readable by every signed-in user: the actor is taken but
getBadge(actor, badgeId): Promise<Badge>                                               // no predicate applied; the whole collection, activeOnly and order in memory
listUserBadges(actor, uid, opts?: { limit?: number }): Promise<UserBadge[]>
createUserBadge(actor, uid, badgeId, awardedBy: 'system' | string, note: string | null): Promise<{ created: boolean }>   // system only

// xp.ts
listXpEntries(actor, uid, limit: number): Promise<XpEntry[]>
applyXpEntry(actor, uid, entry: { reason: XpReason; refId: string; amount: number; courseId: string | null }):
  Promise<{ created: boolean; xpTotal: number; level: number; previousLevel: number; stat: { name: string; value: number } | null }>   // system only

// certificates.ts
getCertificate(actor, certificateId): Promise<Certificate>                             // canViewCertificate, or a teacher for whom canViewUser(actor, holder) holds
                                                                                       // (one profile read inside); otherwise NotFoundError
getCertificateByCode(code): Promise<PublicCertificate | null>                          // †
listCertificatesForUser(actor, uid, opts?: { limit?: number }): Promise<Certificate[]>  // holder, teacher via canViewUser, platform admin; a school admin gets the
                                                                                       // query filtered with canViewCertificate; anyone else NotFoundError
listCertificatesForSchool(actor, schoolId, page?: PageRequest): Promise<Page<Certificate>>
listAllCertificates(actor, page?: PageRequest): Promise<Page<Certificate>>
createCertificate(actor, input: NewCertificate): Promise<{ certificate: Certificate; created: boolean }>
  // system only; transaction: create, or return an issued one, or re-issue a revoked one (section 9.5); maintains stats.certificates
setCertificateRevoked(actor, certificateId, reason: string): Promise<void>            // system only; also decrements stats.certificates

// challenges.ts
getChallenge(actor, challengeId): Promise<Challenge>                                   // NotFoundError for a draft or archived challenge or one of another school (4.4)
listChallengesForUser(actor, opts?: { upcomingOrOpenOnly?: boolean; limit?: number }): Promise<Challenge[]>
                                                                                       // global + (only when actor.schoolId is not null) the actor's school
listAllChallenges(actor): Promise<Challenge[]>
upsertChallenge(actor, challengeId: string | null, input: ChallengeInput): Promise<Challenge>
setChallengeStatus(actor, challengeId, status: Challenge['status']): Promise<void>

// billing.ts
listLicensesForSchool(actor, schoolId): Promise<License[]>
upsertLicense(actor, licenseId: string | null, input: LicenseInput): Promise<License>
listSubscriptions(actor, page?: PageRequest): Promise<Page<Subscription>>
listSubscriptionsForOwner(actor, ownerType: 'user' | 'school', ownerId): Promise<Subscription[]>
upsertSubscription(actor, subscriptionId: string | null, input: SubscriptionInput): Promise<Subscription>

// hardware.ts — hardware platforms are written only by migration scripts in the MVP
listHardwarePlatforms(actor, opts?: { activeOnly?: boolean }): Promise<HardwarePlatform[]>   // no predicate (reference data); whole collection,
                                                                                       // activeOnly and order in memory

// ai-usage.ts — `subject` is the user the AI call is made for (a Session satisfies it)
checkAndCountAiUsage(subject: { uid: string; role: Role; schoolId: string | null }, kind: 'tutor' | 'lab' | 'review'):
  Promise<{ allowed: boolean; reason: 'ok' | 'role' | 'disabled' | 'limit' | 'budget'; remainingToday: number; retryAfterSeconds: number | null }>
recordAiTokens(subject, usage: AiUsage): Promise<void>                                 // user, school and global counters (set({ merge: true }), 3.1)
recordAiBlocked(subject): Promise<void>
// exported types: AiUsageKind, AiUsageSubject, AiUsageDecision; the school document and the budget counters are read outside the
// transaction (8.7)

// rate-limit.ts
consumeRateLimit(scope: RateLimitScope, key: string): Promise<{ allowed: boolean; retryAfterSeconds: number | null }>   // † RATE_LIMITS[scope] per hour

// analytics.ts
getSchoolStats(actor, schoolId): Promise<SchoolStats>
getSchoolCourseUsage(actor, schoolId): Promise<CourseUsageRow[]>
getClassReport(actor, classId, courseId): Promise<ClassReport>
getPlatformStats(actor): Promise<PlatformStats>

// audit.ts
writeAudit(actor, entry: { action: AuditAction; targetType: string; targetId: string; schoolId: string | null; meta?: Record<string, string | number | boolean | null> }): Promise<void>
```

`AuditAction` and the tuple `AUDIT_ACTIONS` are exported from `audit.ts`; a `SystemActor` is
recorded as `actorUid: 'system'`, `actorRole: 'system'` (3.4), so services pass the person who
asked whenever there is one. There is no audit-log reader in the MVP (no page shows it;
entries are inspected in the Firebase console).

How authorization and query edge cases are executed (MUST, so every workstream gets the same
behaviour):

- **Per-user lists** (`listEnrollmentsForUser`, `listRecentAttemptsForUser`,
  `listSubmissionsForStudent`): for the user themselves, no extra filter. For a **teacher**
  actor `opts.classId` is required, must pass `teachesClass`, and is pushed into the query
  (`classId == X`), so only records of that class are read. For a school admin, results are
  filtered with `canViewLearnerRecord` / `canViewSubmission`. Platform admins see all.
- **Empty `classIds`**: `listReviewQueue`, `countReviewQueue` and `listAttemptsForClasses`
  return an empty result without querying when `classIds.length === 0` (an `in []` query
  throws), and reject any `classId` the actor does not teach (a platform admin passes the
  class checks, as in `listRecentAttemptsForUser`).
- **Paging** (`internal-identity.readPage`, `internal-content`): the cursor rule of 10.1;
  page sizes default 50, max 100; `listReviewQueue` default 200, max 500.
- **`includeArchived`** is executed as `where('archived', 'in', [false, true])`; `audience`
  on pathways is filtered in memory.
- **`getClassReport`** authorizes at class level: `canManageClass(cls)` and the course is in
  `cls.assignedCourseIds`. It then reads the members and `getAll` of their enrollments for
  that course and builds every column from the enrollment, whatever `enrollment.classId`
  says (a student who is in two classes that both assign the course shows up correctly in
  both reports).
- **`getSchoolStats`** takes teachers, students, classes and seats used from
  `schools.counts`; it issues `count()` only for enrollments and certificates.
- Student-facing attempt reads (`getAttempt`, `getLatestAttempt`, the player data) return
  the student projection of section 3.4.

```ts
// analytics.ts result shapes (src/types/analytics.ts)
export interface SchoolStats { teachers: number; students: number; classes: number; enrollments: number; completedEnrollments: number;
  completionRatePercent: number; certificates: number; seatsTotal: number; seatsUsed: number }   // seatsUsed = schools.counts.students
export interface CourseUsageRow { courseId: string; course: Course; enrollments: number; completed: number; completionRatePercent: number }
export interface ClassReport { cls: SchoolClass; course: Course; rows: { student: ClassMember & { uid: string }; enrollment: Enrollment | null;
  quizAveragePercent: number | null;     // mean of quizSummary[*].bestPercent
  submissionsApproved: number;           // projectSummary entries with latestStatus 'approved' or 'ai_reviewed'
  submissionsPending: number;            // projectSummary entries with latestStatus 'submitted'
  certificateId: string | null }[] }
export interface PlatformStats { schools: number; users: Record<Role, number>; officialCourses: number; enrollments: number;
  completedEnrollments: number; submissions: number; certificates: number }
```

### 10.3 Services (`src/lib/services`)

```ts
// identity.ts — internal (import banned from actions/app/components): the ONLY writer of users.role, schoolId, status
applyIdentityChange(uid, change: { role?: Role; schoolId?: string | null; status?: UserStatus }, opts: { invalidateSessions: boolean }): Promise<void>
  // checks that a new schoolId exists, then data/users.setIdentity, then invalidateSessions when asked, then the schools.counts
  // moves computed by countedIn(), then syncClaims(uid)
invalidateSessions(uid): Promise<void>                    // users.sessionsValidAfter = now (whole seconds) + revokeRefreshTokens(uid);
                                                          // auth/user-not-found tolerated
countedIn(identity: { role: Role; schoolId: string | null; status: UserStatus }): { schoolId: string; counter: 'students' | 'teachers' } | null   // pure (3.6)

// provisioning.ts
establishSession(idToken: string, next: string | null): Promise<{ redirectTo: string }>     // † section 1.5; sets the cookie
endSession(actor): Promise<void>                                                           // invalidateSessions first, then clearSessionCookie (1.5); ForbiddenError for a SystemActor
issueClientAuthToken(actor): Promise<{ customToken: string }>                              // createCustomToken(actor.uid), for ensureClientAuth; ForbiddenError for a SystemActor
completeSignup(idToken: string, input: SignupInput, ctx: { clientKey: string }): Promise<UserProfile>   // † verifies the token; create-only; rate limit 'signup'
signUpWithJoinCode(input: JoinSignupInput, ctx: { clientKey: string }): Promise<{ username: string }>              // † rate limit 'join_signup'
provisionStudents(actor, classId, students: { displayName: string; ageBand?: AgeBand }[]): Promise<{ uid: string; displayName: string; username: string; password: string }[]>
resetStudentPassword(actor, studentUid): Promise<{ username: string; password: string }>   // + invalidateSessions + audit
createTeacher(actor, input: { displayName: string; email: string; schoolId: string }): Promise<UserProfile>
createSchoolWithAdmin(actor, input: { school: SchoolInput; adminDisplayName: string; adminEmail: string }): Promise<{ school: School; admin: UserProfile }>
changeUserRole(actor, uid, role: Role, schoolId: string | null): Promise<void>
setUserStatus(actor, uid, status: UserStatus): Promise<void>                               // profile + Auth disabled flag + counts + audit
setVerifiedEducator(actor, uid, verified: boolean): Promise<void>                          // platform admin; target must be a teacher; audit

// classroom.ts
resolveClassContext(uid: string, courseId: string | null): Promise<{ classId: string | null; schoolId: string | null }>   // internal helper; section 3.4
pickSupervisingClass(classes: readonly SchoolClass[], courseId: string | null): SchoolClass | null   // pure: the rules of 3.4 applied to a list
resolveJoinCode(joinCode: string): Promise<JoinCodeTarget>                           // internal: normalises with joinCodeSchema; one and the same NotFoundError
  // for a malformed, unknown, disabled or expired code and for a code of a school whose settings.joinCodesEnabled is false;
  // JoinCodeTarget = { cls: SchoolClass; school: School | null } (the school read as the system)
studentAccountContext(target: JoinCodeTarget): Promise<{ schoolActive: boolean; ownerVerifiedEducator: boolean }>   // internal: the ctx of
  // studentAccountPolicy; the owner profile is read only for a school-less class and vouches only when role teacher, status
  // active and verifiedEducator (a disabled owner does not)
createClass(actor, input: ClassInput): Promise<SchoolClass>
setClassTeachers(actor, classId, teacherUids: string[]): Promise<void>
lookupJoinCode(joinCode: string, ctx: { clientKey: string }): Promise<{ className: string; accountCreation: boolean; under13Allowed: boolean }>   // † rate limit 'join_lookup'
addStudentToClass(actor, classId, student: UserProfile, addedByUid: string | null): Promise<void>
  // system only; used by joinClassWithCode and by provisioning: member doc, users.classIds, school attach when needed,
  // class enrollments for every assigned course, re-pointing of open unsupervised submissions
joinClassWithCode(actor, joinCode: string): Promise<SchoolClass>                    // signed-in student; rate limit 'join_class' keyed by uid
removeStudentFromClass(actor, classId, studentUid): Promise<void>
assignCourseToClass(actor, classId, courseId, dueAt: IsoDateString | null): Promise<void>
unassignCourseFromClass(actor, classId, courseId): Promise<void>                    // keeps existing enrollments
getStudentForTeacher(actor, classId, studentUid): Promise<StudentSummary>

// learning.ts
enrollSelf(actor, courseId): Promise<Enrollment>
getLessonPlayerData(actor, courseId, lessonId): Promise<LessonPlayerData>
startLesson(actor, courseId, lessonId): Promise<void>
saveResponse(actor, courseId, lessonId, blockId, text: string): Promise<void>
completeLesson(actor, courseId, lessonId): Promise<LessonCompletionResult>

// assessment.ts
submitQuizAttempt(actor, input: { courseId: string; quizId: string; answers: Record<string, QuizAnswer>; locale: Locale }): Promise<QuizAttemptResult>

// project-flow.ts
registerUpload(actor, input: RegisterUploadInput): Promise<{ file: FileRef; media: MediaRef | null }>   // section 5.2
submitWork(actor, input: SubmitWorkInput & { locale: Locale }): Promise<Submission>
deleteAttachment(actor, submissionId: string, fileId: string): Promise<void>
getSubmissionForViewer(actor, submissionId): Promise<{ submission: Submission; aiReview: AiReview | null; reviews: TeacherReview[] }>
  // authorizes, repairs effectsApplied, re-triggers a stale pending AI review (section 9.4); aiReview only if canViewAiReview
generateAiReview(submissionId: string): Promise<void>                               // system; never throws (records failure or 'skipped')
regenerateAiReview(actor, submissionId): Promise<void>
reviewSubmission(actor, input: ReviewInput): Promise<{ submission: Submission; gamification: GamificationOutcome | null }>

// recognition.ts
issueCertificate(actor, input: { studentUid: string; courseId: string }): Promise<Certificate>
revokeCertificate(actor, certificateId: string, reason: string): Promise<void>
awardManualBadge(actor, input: { studentUid: string; badgeId: string; note: string | null }): Promise<{ awarded: boolean }>

// tutor-context.ts
buildTutorContext(actor, request: Pick<TutorRequest, 'mode' | 'courseId' | 'lessonId' | 'locale'>): Promise<TutorContext>

// access.ts
getCourseAccess(actor, course: Course): Promise<CourseAccess>
licenseCovers(license: License, course: Course, now: Date): boolean                    // pure (4.5)
subscriptionCovers(subscription: Subscription, course: Course, now: Date): boolean     // pure
```

Semantics that the signatures do not show:

- **Hidden course**: every service that reads a course answers `forbidden` for a course the
  actor may not open (the repository throws, section 4.4); `not_found` is answered for a
  missing enrollment, a hidden user, class, submission, certificate, challenge or file.
- **`completeSignup`**: section 1.5, path 1. Create-only; server-derived `consentBasis`.
- **`signUpWithJoinCode`**: parse (`joinSignupInputSchema`) → `consumeRateLimit('join_signup',
  clientKey)` → `resolveJoinCode` (one `NotFoundError` for every bad code, including a code of
  a school whose `settings.joinCodesEnabled` is false) → `studentAccountPolicy` with
  `studentAccountContext` (`ForbiddenError` naming the reason) → capacity (`ConflictError`
  when the class is archived or `studentCount + 1 > 60`) → Auth user → profile
  (`provisionedByUid: null`) → `schools.counts` → `syncClaims` →
  `addStudentToClass(SYSTEM_ACTOR, …)`. A username whose address already exists is
  `ValidationError { username: ['duplicate'] }` (a form-field error). When the profile write
  fails the Auth user just created is deleted again; once the profile exists, a failing
  counter or claim write is reported but the account stands.
- **`provisionStudents`**: input re-parsed with `addStudentsInputSchema` (1–60 students).
  `studentAccountPolicy` for every requested band (default `cls.ageBand`) and the capacity
  check (`ConflictError` when archived, or `studentCount + n > 60`) run before any write;
  `schools.settings.joinCodesEnabled` is **not** consulted (it governs the join path only).
  New accounts get `locale` = `school.defaultLocale` (the staff member's session locale for a
  school-less class), `provisionedByUid` = the actor, `consentBasis` from the policy.
  Usernames come from `usernameBase(displayName)` (`internal-credentials.ts`: ASCII letters
  and digits, lower-cased, words joined by `.`, at most 26 characters, `student` for a name
  with no usable characters, padded with `1` to 3 characters); on
  `auth/email-already-exists` the next `usernameCandidate(base, attempt)` (the base plus 2,
  3 or 4 random digits) is tried, 8 attempts, then `ConflictError`. Passwords are
  `generatePassword()`: `xxxx-xxxx-xxxx` over the join-code alphabet lower-cased (a–h, j, k,
  m, n, p–z, 2–9). Accounts are created one after another and the batch is **not atomic**:
  when the n-th account fails (Auth or Firestore outage) the first n − 1 exist but the call
  throws and their passwords were never shown; the staff member recovers each with
  `resetStudentPassword` (returning partial results would need a signature change).
- **`joinClassWithCode`**: `resolveJoinCode` (same checks; no account policy and no school
  status check, section 1.5); `ConflictError` when the student's `schoolId` is set and
  differs from the class's `schoolId`; attaches the student to the school only when their
  `schoolId` was null and the class has one, through `applyIdentityChange` **without**
  invalidating sessions.
- **`lookupJoinCode`** answers "not found" identically for malformed, unknown, disabled and
  expired codes and for a code of a school with `joinCodesEnabled: false`. Result:
  `accountCreation = studentAccountPolicy(cls, ctx, 'adult').allowed`, `under13Allowed =
  studentAccountPolicy(cls, ctx, '8-10').allowed`; a class of a suspended school still
  answers its name with both false.
- **`addStudentToClass`** (system only): `addMember`, school attach through
  `applyIdentityChange` without invalidation, `upsertClassEnrollments` for every assigned
  course, then the re-pointing of every open unsupervised submission of the student (3.6).
- **`removeStudentFromClass`**: `NotFoundError` when the class is not visible to the actor or
  the student is not on its roster (no existence oracle); `removeMember`; "self-registered"
  is `username === null` (an email account), so a username account provisioned by a
  school-less verified teacher who later joined a school class stays attached; the detach
  decision reads the student's remaining classes once; the class's enrollments and open
  submissions are re-resolved after the detach (3.6).
- **`assignCourseToClass`**: requires `getCourseAccess(actor, course).allowed`
  (`not_visible` → `NotFoundError`, `license_required` → `LicenseRequiredError`: a premium
  course cannot be assigned without a covering licence) and `course.audience === 'student'`
  (`ConflictError` for a Teacher Academy course); writes the assignment,
  `upsertClassEnrollments` for the roster with `{ classId, schoolId: cls.schoolId }` and
  source `'class'`, and re-points the members' open unsupervised submissions of that course
  to the class itself.
- **`createClass`**: `assertRole(teacher, school_admin, platform_admin)` (a `SystemActor` is
  refused); the input is re-parsed with `classInputSchema`. A teacher owns the class with
  `schoolId` = their own (null for an independent teacher; an `ownerUid` they send is
  ignored). A school admin or a platform admin must send `ownerUid`: missing →
  `ValidationError { ownerUid: ['required'] }`; a user the admin cannot read (another school)
  → `NotFoundError`; not an active teacher → `ValidationError { ownerUid: ['invalid_choice'] }`;
  `schoolId` = the owner's school.
- **`setClassTeachers`**: the authorization of 4.4; empty list → `ValidationError {
  teacherUids: ['required'] }`, more than 5 → `{ teacherUids: ['too_many'] }`, owner missing
  → `ConflictError`, a school-less class with anyone but the owner → `ConflictError`, a uid
  that is not an active teacher of the class's school (or does not exist) → `ValidationError
  { teacherUids: ['invalid_choice'] }`; duplicates are collapsed before
  `data/classes.setTeachers`, whose 30-classes-per-teacher cap surfaces as `conflict` (not a
  field error).
- **`getStudentForTeacher`**: `getClass(actor, classId)`, `canManageClass`, the member
  document must exist, then the profile is read as the system; `StudentSummary` with
  `canResetPassword = username !== null && canManageUser(actor, profile)`.
- **`createTeacher`**: `canManageSchool(actor, input.schoolId)` (the school's admin or a
  platform admin); input re-parsed with `createTeacherInputSchema`; the school is read as
  the actor (`NotFoundError`). `createUser` with email and display name only (no password,
  `emailVerified` left false, section 1.5); `auth/email-already-exists` → `ConflictError`
  without a pre-read. Profile: role `teacher`, `ageBand: 'adult'`, `locale` =
  `school.defaultLocale`, `consentBasis: 'adult'`, `provisionedByUid` = the actor;
  `schools.counts.teachers + 1`; `syncClaims`.
- **`createSchoolWithAdmin`**: `isPlatformAdmin` required; the school input is parsed with
  `schoolInputSchema` and its field errors keyed `school.<field>` (form-level under
  `school`), the admin fields with `createTeacherInputSchema` keyed `adminDisplayName` /
  `adminEmail`. `getUserByEmail` is checked **before** `createSchool`, so an existing address
  (`ConflictError`) never leaves a school without an admin (a concurrent creation of that
  address between the check and `createUser` would; negligible, and recoverable with
  `changeUserRole`). The admin profile has `locale` = `school.defaultLocale` and
  `provisionedByUid` = the actor; school admins are not counted in `schools.counts`. The
  new Auth user has no usable password; the caller's browser then sends the reset email
  (section 1.5).
- **`changeUserRole`**: `ValidationError` for a role outside `ROLES` (`{ role:
  ['invalid_choice'] }`), `school_admin` with `schoolId` null (`{ schoolId: ['required'] }`),
  `platform_admin` with a school (`{ schoolId: ['invalid'] }`); an unknown school →
  `NotFoundError`; `canViewUser` false → `NotFoundError`; `canAssignRole` false →
  `ForbiddenError`. When role and `schoolId` equal the stored ones the call is a no-op (no
  class removal, no invalidation, no audit). Otherwise `classes.removeUserFromAllClasses`
  (`ConflictError` while the user owns a non-archived class: archive it first) then
  `applyIdentityChange` with session invalidation; audit `user.role_changed` with meta
  `{ role, previousRole, previousSchoolId }`. A `SystemActor` may call it (the audit entry
  records `'system'`).
- **`setUserStatus`**: `ValidationError` for a status outside `USER_STATUSES`; one's own
  account → `ForbiddenError` (platform admins included); `canViewUser` false →
  `NotFoundError`; `canManageUser` false → `ForbiddenError`; the 4.4 rule (no `'disabled'` on
  a `username === null` student unless platform admin). Same status → no-op. Order:
  `applyIdentityChange` (invalidation for `'disabled'` only), then Auth `updateUser({
  disabled })`, then audit `user.status_changed` with meta `{ status, previousStatus }`.
- **`resetStudentPassword`**: `SystemActor` → `ForbiddenError`; `canViewUser` false →
  `NotFoundError`; `canManageUser` false or `username === null` → `ForbiddenError`. Writes
  the Auth password (`generatePassword()`, shown once), then `invalidateSessions`, then audit
  `user.password_reset`.
- **`setVerifiedEducator`**: the target is read first as the actor (`NotFoundError` for an
  unknown uid); the repository refuses a non-teacher with `ConflictError`; audit meta
  `{ verified }`.
- **`enrollSelf`**: the actor must be a student or teacher (`ForbiddenError` for school and
  platform admins and the system) and `course.audience` must equal the role's audience
  (`ForbiddenError`); `course.status !== 'published'` → `ConflictError` (3.1: an enrollment
  freezes the course structure; a teacher who can see a colleague's draft `school` course
  cannot enrol until it is published); `getCourseAccess` must allow (`requireCourseAccess`);
  a student's enrollment takes `classId`/`schoolId` from `resolveClassContext`, a teacher's
  Teacher Academy enrollment is `{ classId: null, schoolId: session.schoolId }` (3.4);
  `totalLessonCount = course.lessonCount`, source `'self'`; idempotent (`createEnrollment`
  returns an existing enrollment unchanged).
- **`getLessonPlayerData`**: `readOnly = !(enrollment exists && learnerAudience(role) ===
  course.audience)`; the repair of a completed lesson's or a passed attempt's pending effects
  runs only for a learner; `tutorEnabled = learner && schools/{schoolId}.settings.aiEnabled`
  (true for a user without a school; false when the school document is missing). The course
  outline is read through React `cache()` (3.7).
- **`startLesson` / `saveResponse`**: gate on the enrollment (and, for `saveResponse`, on the
  block being a `reflection` or `code_activity`; `not_found` otherwise) but not on
  `getCourseAccess`, so a learner whose premium cover lapsed can still write their own lesson
  progress while `getLessonPlayerData` answers `license_required`; nothing not theirs is
  touched. `conflict` when the response slot is full, `validation` when the text is too long.
- **`completeLesson`**: section 9.4.
- **`submitQuizAttempt`**: input re-parsed with `submitQuizAttemptInputSchema`
  (`ValidationError` with its field errors); `NotFoundError` without an enrollment;
  `ForbiddenError` when `course.audience` differs from the role's; access as in `enrollSelf`;
  the key is read with `getQuizWithKey(SYSTEM_ACTOR)`; answers to question ids the quiz does
  not have are dropped before grading (`gradeQuiz`, 3.4); `createAttempt` (atomic numbering
  and `maxAttempts`; `conflict` when no attempt is left or on a concurrent attempt);
  `onQuizPassed` on **every** passed attempt, so `QuizAttemptResult.gamification` is non-null
  with `xpAwarded: 0` on a repeat pass (the UI tests `xpAwarded > 0` before celebrating);
  `correctOptionIds` and `explanations` are returned only when `isAttemptRevealed(attempt,
  quiz.revealAnswers)`; `attemptsRemaining = max(0, maxAttempts − attemptNumber)` or null;
  returns the student projection.
- **`registerUpload`**: section 5.2.
- **`submitWork`**: `assertRole(student)` (teachers never submit). Project path:
  `NotFoundError` without an enrollment, access as above, `ConflictError` when
  `project.lessonId` is null (a project no lesson shows cannot be reached by a learner).
  Challenge path: `getChallenge` (`NotFoundError` for a draft or other-school challenge),
  `ConflictError` unless `getChallengePhase` is `open`. A type outside
  `allowedSubmissionTypes` → `ValidationError { type: ['invalid_choice'] }`; files are read
  with `getOwnFiles` (a file of someone else is `NotFoundError`), and a file with purpose
  `course_media` or an existing `submissionId` → `ConflictError` before the transaction
  (`createSubmission` re-checks inside it); `classId`/`schoolId` from
  `resolveClassContext(uid, courseId or null)` (a challenge entry of a pupil in any class is
  supervised by their lowest class); `lessonId = project.lessonId`; `contextTitle` is the
  `{ title }` snapshot of the project's or challenge's translations; the rubric is copied
  from the definition; `locale` from the input. One open attempt at a time and at most 10
  (section 3.4). The action then runs `after(() => generateAiReview(submission.id))`.
- **`deleteAttachment`**: section 5.2.
- **`generateAiReview`** (system, never throws): returns without doing anything unless
  `status === 'submitted'` and `aiReviewStatus === 'pending'`; reads the student profile as
  the system for the usage subject and `ageBand`; every `checkAndCountAiUsage` refusal (role,
  disabled, limit, budget) → `setAiReviewSkipped`; `suggestReview` success → a `'ready'`
  review; `AiError` → a `'failed'` review with `error: reason`, `provider =
  getAiProvider().id`, model `'unknown'`, the error's usage as tokens, and `recordAiBlocked`
  when `reason === 'blocked'`; `recordAiTokens` runs **after** `saveAiReview` for ready and
  failed reviews alike (a failed save leaves the provider call uncounted and the review
  pending for a later re-trigger; recording first would risk double counting). The
  unsupervised closing (`markAiReviewed` / `markAiReturned` per 3.4's acceptability rule)
  runs only when `classId` is null and the review is `'ready'`; a `ConflictError` from the
  repository (a class adopted the submission meanwhile) is swallowed; any other failure is
  logged and leaves the status `'pending'` for the 9.4 re-trigger.
- **`regenerateAiReview`**: `ConflictError` when the submission is not `'submitted'`; the
  owner of an unsupervised submission may regenerate only while `aiReviewStatus` is
  `'failed'` or `'skipped'` (9.4), else `ConflictError`; a teacher who passes
  `canReviewSubmission` or a platform admin at any time (a supervised owner or a school admin
  is `forbidden`); the limit of 3 comes from `setAiReviewPending`; the review then runs
  inline, so the call returns after the new suggestion is stored.
- **`getSubmissionForViewer`**: `SystemActor` refused; `reviews` are listed only for staff
  (teacher, school admin, platform admin) who are not the owner, `aiReview` only when
  `canViewAiReview`; the 9.4 re-trigger and the `effectsApplied` repair (a submission in
  status `approved` or `ai_reviewed` with `effectsApplied` false first gets
  `onSubmissionAccepted`, the reward read from the project or challenge as the system) run
  before the submission is re-read. The page reads the project or challenge document itself
  (3.7).
- **`reviewSubmission`** decision semantics: input re-parsed with `reviewInputSchema`;
  `approve` copies the AI suggestion's criteria and overall score, and is accepted only when
  the AI review is `ready`, has no flag, its confidence is not `low` and `criteria` and
  `overallSuggestedScore` are non-null (`ConflictError` otherwise, as for a failed or absent
  review); `modify` uses the teacher's `criteria` (`ValidationError { criteria:
  ['required'] }` without them) and computes the score with the submission's rubric weights
  (`weightedScore`: round(Σ score × weight / 100), clamped 0–100, unlisted criteria weigh
  nothing); `return` records feedback only, sets status `returned`, awards nothing. In all
  three the teacher's `feedback` is what the student sees and `NewReview.aiReviewId =
  submission.latestAiReviewId`. Audit `submission.reviewed` (meta `{ decision, score,
  studentUid }`) is written before the gamification handler; for approve/modify the handler
  runs through `applyEffects` and the submission is re-read when it succeeded, else the
  reviewed submission is answered with `gamification: null`.
- **`issueCertificate` / `revokeCertificate`**: section 9.5. **`awardManualBadge`**: input
  parsed with `awardBadgeInputSchema`; the badge must exist (`NotFoundError`), be `isActive`
  and have `criteria.type === 'manual'` (`ConflictError`); a teacher may award only to a
  profile with role `student` in a class they teach (`teachesAnyOf`), a platform admin to any
  profile; the target is withheld as `NotFoundError`; audit `badge.awarded` (meta `{ badgeId,
  note }`) only when `awarded` is true.
- **`buildTutorContext`**: roles other than student/teacher and the system → `ForbiddenError`;
  a course the actor may not open → `forbidden` (the course read, 4.4), a premium course
  without cover → `LicenseRequiredError`; with `courseId` null the reference is all null and
  only the recent results are built; `lessonExcerpt` comes from `lessons.tutorExcerpt`
  resolved locale → course default → `en` → any, cut to `CONTENT_LIMITS.tutorExcerptChars`,
  and only when `course.isOfficial`; `recentQuizResults = listRecentAttemptsForUser(actor,
  uid, { limit: AI_LIMITS.tutorRecentQuizResults })` with `quizTitle =
  pickTranslation(attempt.quizTitle, locale, locale).title`; `hasGradedWork =
  lesson.quizIds.length > 0 || lesson.projectIds.length > 0`. The school document is not
  read (3.7).

### 10.4 Server actions (`src/actions`)

All return `Promise<ActionResult<T>>` and are implemented with `runAction`. Names end in
`Action`. The **Roles** column is the exact `roles` option each action passes to
`runAction`; resource-level checks happen in the service. `anon` = `allowAnonymous`. Roles:
S = `student`, T = `teacher`, A = `school_admin`, P = `platform_admin`. Locale-dependent
actions take the locale from `runAction`'s `ctx.locale`, never from the payload.

```
// session.ts (foundation; fully implemented in Stage 0 — thin wrappers around services/provisioning)
createSessionAction({ idToken, next? }) → { redirectTo: string }                                   anon
getClientAuthTokenAction() → { customToken: string }                                               S T A P
signOutAction() → null                                                                             S T A P   // ok(null) and clears the cookie even without a valid session (1.5)

// auth.ts (WS-A)
completeSignupAction({ idToken } & SignupInput) → { redirectTo: string }   // '/verify-email'       anon
lookupJoinCodeAction({ joinCode }) → { className: string; accountCreation: boolean; under13Allowed: boolean }   anon
joinClassSignupAction(JoinSignupInput) → { username: string }                                      anon

// learning.ts (WS-B)
enrollInCourseAction({ courseId }) → { enrollmentId: string; firstLessonId: string | null }        S T
startLessonAction({ courseId, lessonId }) → null                                                   S T
saveBlockResponseAction({ courseId, lessonId, blockId, text }) → null                              S T
completeLessonAction({ courseId, lessonId }) → LessonCompletionResult                              S T

// quiz.ts (WS-C)
submitQuizAttemptAction({ courseId, quizId, answers }) → QuizAttemptResult                         S T

// files.ts (WS-D)
registerUploadAction(RegisterUploadInput) → { file: FileRef; media: MediaRef | null }              S T P
  // RegisterUploadInput = { fileId, kind, fileName, width?, height? } & ({ purpose: 'submission' } | { purpose: 'course_media'; courseId: string | null })
  // courseId null = official media without a course (platform admin only: challenge covers); media is set for course_media
deleteAttachmentAction({ submissionId, fileId }) → null                                            S T P

// projects.ts (WS-D)
submitWorkAction(SubmitWorkInput) → { submissionId: string }                                       S
  // SubmitWorkInput = { target, title, description, type, content, fileIds, previousSubmissionId }

// review.ts (WS-D)
reviewSubmissionAction(ReviewInput) → { status: SubmissionStatus }                                 T P
  // ReviewInput = { submissionId, decision, criteria, feedback }
regenerateAiReviewAction({ submissionId }) → null                                                  S T P

// classes.ts (WS-E)
createClassAction(ClassInput) → { classId: string }                                                T A
updateClassAction({ classId, name?, gradeLabel?, ageBand?, joinCodeEnabled? }) → null              T A P
archiveClassAction({ classId }) → null                                                             T A P
regenerateJoinCodeAction({ classId }) → { joinCode: string }                                       T A P
addStudentsAction({ classId, students: { displayName, ageBand? }[] }) → { credentials: { displayName: string; username: string; password: string }[] }   T A P
removeStudentAction({ classId, studentUid }) → null                                                T A P
resetStudentPasswordAction({ studentUid }) → { username: string; password: string }                T A P
assignCourseAction({ classId, courseId, dueAt }) → null                                            T A P
unassignCourseAction({ classId, courseId }) → null                                                 T A P
joinClassAction({ joinCode }) → { classId: string; className: string }                             S
awardBadgeAction({ studentUid, badgeId, note }) → { awarded: boolean }                             T P

// course-editor.ts (WS-F) — every action                                                          T P
createCourseAction(CourseInput) → { courseId: string }
updateCourseAction({ courseId, patch }) → null
setCourseStatusAction({ courseId, status }) → null
createModuleAction({ courseId, input }) → { moduleId: string }
updateModuleAction({ courseId, moduleId, patch }) → null
deleteModuleAction({ courseId, moduleId }) → null
reorderModulesAction({ courseId, orderedIds }) → null
createLessonAction({ courseId, moduleId, input }) → { lessonId: string }
updateLessonAction({ courseId, lessonId, patch }) → null
deleteLessonAction({ courseId, lessonId }) → null
reorderLessonsAction({ courseId, moduleId, orderedIds }) → null
createBlockAction({ courseId, lessonId, input }) → { blockId: string }
updateBlockAction({ courseId, lessonId, blockId, input }) → null
deleteBlockAction({ courseId, lessonId, blockId }) → null
reorderBlocksAction({ courseId, lessonId, orderedIds }) → null
saveQuizAction({ courseId, quizId, input }) → { quizId: string }
deleteQuizAction({ courseId, quizId }) → null
saveProjectAction({ courseId, projectId, input }) → { projectId: string }
deleteProjectAction({ courseId, projectId }) → null

// certificates.ts (WS-J)
issueCertificateAction({ studentUid, courseId }) → { certificateId: string }                       T P
revokeCertificateAction({ certificateId, reason }) → null                                          T P

// school.ts (WS-G) — every action                                                                 A
createTeacherAction({ displayName, email }) → { uid: string; email: string }   // the client then calls sendPasswordReset(email)
setSchoolUserStatusAction({ uid, status }) → null
updateSchoolSettingsAction({ name?, city?, defaultLocale?, settings? }) → null
setClassTeachersAction({ classId, teacherUids }) → null

// admin.ts (WS-H) — every action                                                                  P
createSchoolAction({ school, adminDisplayName, adminEmail }) → { schoolId: string; adminEmail: string }   // then sendPasswordReset(adminEmail)
updateSchoolAction({ schoolId, patch }) → null
setSchoolStatusAction({ schoolId, status }) → null
setUserRoleAction({ uid, role, schoolId }) → null
setUserStatusAction({ uid, status }) → null
setVerifiedEducatorAction({ uid, verified }) → null
upsertSubscriptionAction({ subscriptionId, input }) → { subscriptionId: string }
upsertLicenseAction({ licenseId, input }) → { licenseId: string }
upsertChallengeAction({ challengeId, input }) → { challengeId: string }
setChallengeStatusAction({ challengeId, status }) → null

// ai.ts (WS-I)
runLabToolAction({ toolId, prompt }) → { kind: 'text'; text: string } | { kind: 'mock'; messageKey: string }   S

// settings.ts (WS-J)
updateProfileAction(ProfilePatch) → null                                                           S T A P
```

An action's role list is part of the contract: a workstream may call another workstream's
action from its own pages (section 11.2 lists every such call), so the owner must implement
exactly the roles shown here.

How the workstream actions call the services (the error codes each form must handle are in
10.3):

- `completeSignupAction` → `completeSignup(data.idToken, data, { clientKey: await
  getClientKey() })` then `ok({ redirectTo: '/verify-email' })`; `lookupJoinCodeAction` →
  `lookupJoinCode(data.joinCode, { clientKey })`; `joinClassSignupAction` →
  `signUpWithJoinCode(data, { clientKey })`. Codes: `rate_limited` (`retryAfterSeconds`),
  `not_found` (any bad code), `forbidden` (account policy or a `STUDENT_EMAIL_DOMAIN` token),
  `conflict` (class full, profile exists), `validation` with `fieldErrors.username
  ['duplicate']`.
- `enrollInCourseAction` → `enrollSelf(session, courseId)` then `getCourseOutline(session,
  courseId)` for `firstLessonId` (`lessons[0]?.id ?? null`); `startLessonAction` →
  `startLesson`; `saveBlockResponseAction` → `saveResponse`; `completeLessonAction` →
  `completeLesson` returned as is. `LessonPlayer` calls `getLessonPlayerData(session,
  courseId, lessonId)`; `readOnly` and `tutorEnabled` are final.
- `submitQuizAttemptAction` → `submitQuizAttempt(session, { courseId, quizId, answers,
  locale: ctx.locale })` returned as is; the XP toast is shown only when
  `gamification.xpAwarded > 0`.
- `registerUploadAction` → `registerUpload(session, data)` (the file name must be the
  sanitised one `uploadFile` returned); `deleteAttachmentAction` → `deleteAttachment`;
  `submitWorkAction` → `const submission = await submitWork(session, { ...data, locale:
  ctx.locale }); after(() => generateAiReview(submission.id)); return ok({ submissionId:
  submission.id })`; `reviewSubmissionAction` → `const { submission } = await
  reviewSubmission(session, data); return ok({ status: submission.status })`;
  `regenerateAiReviewAction` → `regenerateAiReview(session, submissionId)`. The review and
  submission detail pages call `getSubmissionForViewer`.
- `createClassAction` → `createClass(session, data)` → `{ classId: cls.id }`;
  `addStudentsAction` → `provisionStudents(session, classId, students)` → `{ credentials }`
  (passwords are shown once and never stored); `removeStudentAction` →
  `removeStudentFromClass`; `resetStudentPasswordAction` → `resetStudentPassword(session,
  studentUid)`; `assignCourseAction` → `assignCourseToClass(session, classId, courseId,
  dueAt)` (expect `license_required`, and `conflict` for a teacher course);
  `unassignCourseAction` → `unassignCourseFromClass`; `joinClassAction` → `const cls = await
  joinClassWithCode(session, joinCode)` → `{ classId: cls.id, className: cls.name }`
  (`conflict` = pupil of another school); `awardBadgeAction` → `awardManualBadge(session,
  data)`. The teacher's student page calls `getStudentForTeacher(session, classId,
  studentUid)`.
- `createTeacherAction` → `createTeacher(session, { displayName, email, schoolId:
  session.schoolId })` → `{ uid: profile.id, email: profile.email }`, then the browser calls
  `sendPasswordReset(email)`; `setSchoolUserStatusAction` → `setUserStatus(session, uid,
  status)` (a school admin gets `forbidden` for a self-registered student: offer removal from
  the class instead); `setClassTeachersAction` → `setClassTeachers(session, classId,
  teacherUids)` (`fieldErrors.teacherUids` on a bad uid).
- `createSchoolAction` → `createSchoolWithAdmin(session, data)` → `{ schoolId: school.id,
  adminEmail: admin.email }`, then `sendPasswordReset(adminEmail)`; `setUserRoleAction` →
  `changeUserRole(session, uid, role, schoolId)` (`conflict` = the user owns a class that is
  not archived); `setUserStatusAction` → `setUserStatus`; `setVerifiedEducatorAction` →
  `setVerifiedEducator`.
- `issueCertificateAction` → `const certificate = await issueCertificate(session, data);
  return ok({ certificateId: certificate.id })`; `revokeCertificateAction` →
  `revokeCertificate(session, certificateId, reason)`.
- `runLabToolAction` → `runLabToolWithReport` (8.5). The tutor route calls
  `buildTutorContext` inside a try/catch that maps `AppError` codes to JSON (a hidden course
  answers `403 forbidden`; 6.9 lists only validation, unauthenticated, forbidden and
  rate_limited), then `guardTutorStream(streamTutorReply(…))` (8.3).

### 10.5 Message namespaces (`src/messages/<locale>/<namespace>.json`)

`src/lib/i18n/namespaces.ts` exports the ordered list; `request.ts` imports every file for
the active locale and returns `{ [namespace]: contents }`. Components use
`useTranslations('<namespace>')`. One owner per file, so parallel workstreams never edit
the same JSON.

| Namespace | Contents | Owner |
|---|---|---|
| `common` | Buttons, generic labels, dates, pagination, locale names | Foundation |
| `nav` | Navigation labels for all roles | Foundation |
| `errors` | `errors.<ActionErrorCode>`, generic error/empty/not-found copy | Foundation |
| `validation` | Form validation messages | Foundation |
| `domain` | Text inside `components/domain` (status chips, "RoboHolic Certified", XP, level) | Foundation |
| `home` | Public homepage, pathways pages | WS-A |
| `auth` | Login, signup, verify email, join, forgot password | WS-A |
| `legal` | Privacy and terms placeholders | WS-A |
| `student` | Student Home | WS-B |
| `learn` | Learn, pathway, course detail | WS-B |
| `lesson` | Lesson player, stages, block chrome, completion panel | WS-B |
| `quiz` | Quiz runner and results | WS-C |
| `assessments` | Teacher assessments pages | WS-C |
| `projects` | Student projects, submission form | WS-D |
| `review` | Teacher review queue and review screen | WS-D |
| `teacher` | Teacher dashboard, courses, settings | WS-E |
| `classes` | Classes, roster, credentials sheet, join form | WS-E |
| `reports` | Teacher reports | WS-E |
| `courseEditor` | Course, lesson, block, quiz, project editors | WS-F |
| `school` | All school admin pages | WS-G |
| `admin` | All platform admin pages | WS-H |
| `tutor` | Tutor panel, modes, limits, disclaimers; `cannotHelp` and `unavailable` (the `replace` events of 8.3) | WS-I |
| `aiLab` | AI Lab dashboard and tools; `tools.<id>.{title, description, mockResult}` and `comingSoon` (8.5) | WS-I |
| `robotics` | Robotics page | WS-J |
| `challenges` | Challenge Arena | WS-J |
| `achievements` | Achievements page | WS-J |
| `certificates` | Certificate list, document, verify page, issue button | WS-J |
| `settings` | Student settings | WS-J |

English is the source catalog. `npm run lint` includes a script (`scripts/check-messages.ts`)
that fails when the catalogs differ in either direction: a namespace file or a key that
exists in `en` but not in `fr`, or in `fr` but not in `en`, and a file whose name is not in
`NAMESPACES` (it would never be loaded). A namespace is therefore always added to both
locales in the same change.

`request.ts` treats a namespace file that does not exist as an empty namespace, so the app
runs while workstreams are still writing theirs; a missing key then renders as
`namespace.key` and is logged by next-intl. `NextIntlClientProvider` in `[locale]/layout.tsx`
passes the whole catalog of the active locale to client components, so `useTranslations`
works in server and client components alike.

Message conventions (MUST):

- Values are ICU messages. Plurals use `{count, plural, one {# lesson} other {# lessons}}`;
  numbers that need grouping use `{xp, number}`. Arguments named `date` are strings the
  caller has already formatted. Key names never contain a dot.
- Apostrophes are the typographic `’`, never `'` (in ICU a straight apostrophe before `{`
  starts an escape). French uses a no-break space, written ` ` in the JSON so it stays
  visible, before `: ; ? ! %` and between a number and its unit.
- French copy shared by all ages and roles (the foundation namespaces) uses `vous` or an
  impersonal form. A workstream may use `tu` in student-only namespaces.

Foundation namespaces as delivered by F2 (`…` = one key per value of the named type):

| Namespace | Keys |
|---|---|
| `common` | `appName`, `tagline`, `description`; `actions.{save, saveChanges, cancel, close, confirm, delete, remove, edit, create, add, back, next, previous, continue, start, finish, done, submit, send, retry, refresh, search, filter, clear, reset, select, apply, view, viewAll, open, preview, download, upload, print, copy, publish, unpublish, archive, enable, disable, showMore, showLess, learnMore}`; `labels.{loading, saving, yes, no, or, all, none, other, new, optional, required, name, email, title, description, status, role, date, details, actions, total, notAvailable}`; `feedback.{saved, created, deleted, sent, copied}`; `confirm.{title, irreversible}`; `pagination.{label, previous, next, page{page}, pageOf{page,total}, loadMore, results{count}}`; `locale.{label, switch, names.{en, fr, ar}}` (language names in the current language; a switcher lists `LOCALE_LABELS`); `dates.{today, yesterday, tomorrow, justNow, never, range{start,end}}`; `units.{minutes{count}, minutesShort{count}, hours{count}, hoursShort{count}, hoursMinutesShort{hours,minutes}, percent{value}, kilobytes{value}, megabytes{value}}`; `a11y.{skipToContent, closeDialog, dismiss, notifications, requiredField, opensInNewTab, progress{percent}}`; `login.{title, description, identifier, password, submit, forgotPassword}` (temporary: F8's login form; WS-A's `auth` namespace supersedes it and removes these keys) |
| `nav` | `student.…`, `teacher.…`, `school_admin.…`, `platform_admin.…` (the nav and profile keys of section 6.8, per `Role`); `public.{home, pathways, login, getStarted, mySpace, privacy, terms, footerNavigation, copyright{year}}`; `shell.{mainNavigation, homeLink, openMenu, closeMenu, more, userMenu, signedInAs{name}, signOut, breadcrumbs}`; `lesson.{openOutline, closeOutline, askTutor, closeTutor, exit}` (`LessonShell` chrome); `pages.{verifyCertificate, verifyEmail, joinClass, forgotPassword, certificate, lesson}` (titles of pages that are not nav items; `pages.lesson` also titles the `LessonPlayer` stub) |
| `errors` | One key per `ActionErrorCode` (`validation` … `internal`); `retry.{seconds{seconds}, minutes{minutes}, tomorrow}` (appended to `rate_limited` when `retryAfterSeconds` is known); `page.{title, description, retry, home}` (`error.tsx`); `notFound.{title, description, home}`; `empty.{title, description}` (default `EmptyState` copy); `offline` |
| `validation` | `required`, `invalid`, `too_short`, `too_long`, `too_small`, `too_big`, `too_few`, `too_many`, `duplicate`, `invalid_choice`, `invalid_email`, `invalid_url`, `invalid_number`, `invalid_integer`, `invalid_date`, `date_order`, `age_range`, `password_too_short`, `passwords_mismatch`, `username_invalid`, `display_name_length`, `join_code_invalid`, `terms_required`, `age_band_not_allowed`, `weights_sum`, `correct_option_required`, `default_locale_required`, `content_required`, `file_too_large`, `file_type_not_allowed`, `file_name_invalid`, `too_many_files`, `embed_not_allowed`, `video_id_invalid`. These are the only values a zod schema may use as a message (section 10.1); the same list is `VALIDATION_KEYS` in `src/lib/schemas/common.ts` |
| `domain` | Shared vocabulary, one key per value: `roles.…` (`Role`), `ageBands.…` (`AgeBand`), `areas.…` (`LearningArea`), `submissionTypes.…` (`SubmissionType`), `rubric.…` (`RubricKey`), `stages.…` (`LessonStage` + `earn`), `tutorModes.…` (`TutorMode`), `status.…` (every `StatusChip` value, plus `active, disabled, suspended, issued, revoked, expired`). Component text: `certified.{label, description}`; `xp.{unit, amount{xp}, summary{level,xp}}`; `level.{label{level}, progress, toNext{xp,level}, max}`; `course.{lessons{count}, modules{count}, ages{min,max}, agesFrom{min}, agesUpTo{max}, forTeachers, premium, progress{percent}}`; `pathway.{courses{count}, progress{completed,total}}`; `lessonNav.{label, current, completed, notCompleted, moduleProgress{completed,total}}`; `chat.{assistantName, userName, conversation, empty, modeLabel, inputLabel, placeholder, send, thinking, remainingToday{count}, disclaimer}`; `project.{kinds.{project, challenge}, attempt{number}, submittedOn{date}, by{name}, score{score}}`; `certificate.{issuedOn{date}, issuedBy{name}, code{code}, view}`; `challenge.{types.…, opensOn{date}, dueOn{date}, closedOn{date}, entered, reward{xp}}`; `badge.{tiers.{bronze, silver, gold}, earnedOn{date}, locked}`; `richText.externalLink` |

Workstreams read these keys freely (for example `useTranslations('domain')` for a stage or a
rubric label) instead of repeating shared vocabulary in their own namespace. Until the
freeze, F7 and F8 add the keys their components and layouts turn out to need to these five
files, in both locales; afterwards only the foundation maintainer does.

---

## 11. Parallel build plan

Three stages. Stage 0 produces everything that more than one workstream touches, and proves
it works before anything is frozen. Stage 1 workstreams run in parallel and own disjoint
files. Stage 2 is one owner again.

### 11.1 Stage 0 — Foundation

F1–F3 are sequential. After F3 the foundation splits into two tracks that can run in
parallel (two people, or one after the other): the **server track** (F4 → F5 → F6) and the
**UI track** (F7), which needs only F1–F3. F8 joins them.

| Step | Deliverable | Files |
|---|---|---|
| F1 Scaffold | Next.js 16 app, TS strict, Tailwind v4 tokens, Prettier, Vitest (`server-only` aliased to an empty module), npm scripts, `.env.example`, `firebase.json`, `.firebaserc`, `public/` (favicon). ESLint: banned imports (`firebase/firestore` in `src/`; `firebase-admin` outside `src/lib` and `scripts`; `next/link` outside `lib/i18n`; `SYSTEM_ACTOR`, `@/lib/gamification/{award,certificates,events}` and `@/lib/services/identity` in `src/actions`, `src/app`, `src/components`), the import-boundary rule of 1.2, and the physical-direction class rule of section 2. `next.config.ts`: images and security headers (below) | root config, `src/app/layout.tsx`, `src/app/not-found.tsx`, `globals.css` |
| F2 i18n | Locale config, routing, navigation, request config, `proxy.ts` with its matcher, `[locale]/layout.tsx` (without `ToastProvider`, which does not exist before F7), foundation namespaces in `en` and `fr` (keys in 10.5), `scripts/check-messages.ts`. Two one-line hand-overs from F1, done: the `lint` script is `eslint . && npm run check-messages`, and the `existsSync` early return in `next.config.ts` is gone, so a missing request config fails loudly. A **temporary** `src/app/[locale]/page.tsx` (app name and tagline) gives the locale segment a route until the homepage exists; F8 deletes it | `src/lib/i18n/**`, `src/proxy.ts`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx` (temporary), `src/messages/*/{common,nav,errors,validation,domain}.json`, `scripts/check-messages.ts`, the two lines named on the left, the SWC cache line of `next.config.ts` (below) |
| F3 Contracts | All domain types, input types, zod schemas (messages are `validation` keys, section 10.1; a key that is missing is added in both locales), limits, avatars list, errors, `ActionResult`, `runAction`, env with the emulator guard; unit tests for the env guard, the schemas and their message keys, `runAction` and the utils. `runAction` needs `getSession` and `assertSessionNotRevoked`, which do not exist before F4: it imports them from `src/lib/actions/session-source.ts`, which until then answers "no session", so every non-anonymous action fails closed with `unauthenticated` | `src/types/**`, `src/lib/schemas/**`, `src/lib/limits.ts`, `src/lib/avatars.ts`, `src/lib/errors.ts`, `src/lib/actions/**`, `src/lib/env.ts`, `src/lib/utils.ts`, additions to `src/messages/*/validation.json`, `tests/unit/{env,schemas,run-action,utils}.test.ts` |
| F4 Firebase + auth (server track) | Lazy Admin/client init (in-memory client auth), storage helpers, session cookie with role lifetimes and `sessionsValidAfter`, claims, authz, account policy, `ensureClientAuth`, the three session actions; unit tests. One hand-over from F3: replace the body of `src/lib/actions/session-source.ts` with `export { assertSessionNotRevoked, getSession } from '@/lib/auth/session';` (the file says so). The names in the re-export table of 10.1 are imported from `@/types` and `@/lib/limits`, not declared again | `src/lib/firebase/**`, `src/lib/auth/**`, `src/lib/request-meta.ts`, `src/actions/session.ts`, `src/lib/actions/session-source.ts` (the hand-over), `tests/unit/{authz,account-policy}.test.ts`, additions to `tests/unit/env.test.ts` (Admin and client initialisation, storage paths, `getClientKey`; `session.ts`, `claims.ts`, `actions/session.ts`, `auth/client.ts` and `upload-client.ts` have no kept unit test and were verified with temporary mocked tests and an emulator run) |
| F5 Server core (server track) | Every repository (10.2), pure learning helpers, gamification, services (10.3), AI types + mock provider + first versions of `tutor.ts`, `grading.ts`, `lab.ts`, `safety.ts`. `learning/stages.ts`, `learning/embed-allowlist.ts` and `ai/lab-tools.ts` re-export the lists of 10.1 | `src/lib/data/**`, `src/lib/learning/**`, `src/lib/gamification/**`, `src/lib/services/**`, `src/lib/ai/**`, `tests/unit/**` (new files; the F3 and F4 tests stay) |
| F6 Rules, data tooling, integration tests (server track) | `firestore.rules`, `storage.rules`, `firestore.indexes.json` (indexes + exemptions), rules tests; `migrate.ts`, `0001_initial.ts`; seed runner, `seed/types.ts`, demo users, and `seed/content/index.ts` with **one** complete demo course (`my-first-ai-adventure`, final id; WS-K later extends this folder); `bootstrap-admin.ts`, `delete-user-data.ts`, `cleanup-uploads.ts`, `smoke-queries.ts` (plus `lib/firestore.ts`, `seed/validate.ts`, `seed/demo-progress.ts`, `seed/content/challenges.ts` and `tests/unit/seed-content.test.ts`, section 2); the **integration suite** below | root rules files, `tests/rules/**`, `tests/integration/**`, `scripts/**` |
| F7 UI kit (UI track) | `components/ui` (incl. `Avatar`, `Logo`), `components/domain` (incl. `MediaImage`, `RichText`), `components/layout` (incl. the fully implemented `tutor-bridge.tsx`), nav config. Text comes from the foundation namespaces (10.5); keys that turn out to be missing are added there, in both locales | `src/components/{ui,domain,layout}/**`, `src/lib/navigation/**`, `tests/unit/nav-config.test.ts`, additions to `src/messages/*/{common,nav,errors,domain}.json` (no automated DOM test exists for the components: Vitest runs in node and the frozen `package.json` has no DOM library; they were verified in headless Chrome at 375, 768 and 1366 px in `en` and `fr`) |
| F8 Skeleton | Area layouts with guards, `loading/error/not-found` per area, a **stub `page.tsx` for every route in section 6** (`PageHeader` + `EmptyState`), stub files for every cross-workstream component (7.7) and every workstream-owned `src/actions/*.ts` (correct signatures and `roles`; the handler throws `new AppError('not_implemented')`, which `runAction` maps to `fail('not_implemented')` after its own gates, so an anonymous caller gets `unauthenticated`, a wrong role `forbidden` and bad input `validation`), `blocks/registry.ts` wired to stubs, a temporary minimal login form. Two hand-overs from F2: wrap the children of `[locale]/layout.tsx` in `ToastProvider` (inside `NextIntlClientProvider`), and **delete the temporary `src/app/[locale]/page.tsx`** when adding `(public)/page.tsx` (both resolve to `/{locale}`, so the build fails while the two coexist) | layouts and stubs under `src/app/**`, `src/actions/**`, stub components, additions to the foundation namespaces |
| F9 Docs + CI | README (setup, emulators, seed, deploy, env), CI running `lint`, `typecheck`, `test`, `test:rules`, `test:integration` (emulators) and `build` with no env: `.github/workflows/ci.yml`, on push to `main` and on pull requests, job `checks` (lint, typecheck, test, build) and job `emulators` (test:rules, test:integration with Temurin JDK 21 and `~/.cache/firebase/emulators` cached by the lockfile hash) in parallel; the build step relies on the runner's network access to Google Fonts (section 2) | `README.md`, `.github/workflows/ci.yml` |

`next.config.ts` (F1), written out because it is frozen and several workstreams depend on it:

- `images.remotePatterns`: `{ protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/v0/b/**' }`.
  Nothing else: non-official media and all emulator media are rendered `unoptimized` by
  `MediaImage` (section 7.4), so `images.dangerouslyAllowLocalIP` is not needed.
- Headers on every response: `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera,
  microphone, geolocation off), and this Content-Security-Policy (a static header, so
  `script-src` uses `'unsafe-inline'`; a nonce cannot be set from `next.config` headers):

  ```
  default-src 'self';
  script-src 'self' 'unsafe-inline'            (+ 'unsafe-eval' in development only);
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  img-src 'self' data: blob: https://firebasestorage.googleapis.com https://storage.googleapis.com;
  media-src 'self' blob: https://firebasestorage.googleapis.com https://storage.googleapis.com;
  connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com
              https://firebasestorage.googleapis.com;
  frame-src https://www.youtube-nocookie.com https://player.vimeo.com;
  object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
  ```

  In development, `img-src`, `media-src` and `connect-src` also allow the emulator origins
  (`http://127.0.0.1:9099`, `http://127.0.0.1:9199`, `http://localhost:*`).

  `frame-src` is `EMBED_HOSTS`. `next.config.ts` is written before
  `src/lib/learning/embed-allowlist.ts` exists (F5), so it carries its own copy of the list:
  `EMBED_HOSTS` MUST be exactly `['www.youtube-nocookie.com', 'player.vimeo.com']`, and a
  host is added to both files together or the browser blocks the frame.
- The default export is an async function that wraps the config with
  `createNextIntlPlugin('./src/lib/i18n/request.ts')`. The plugin is imported dynamically,
  after `SWC_NATIVE_BINDING_CACHE` has been defaulted, **on Windows only**, to
  `~/.cache/swc` (`os.homedir()`, outside the repository). The plugin loads `@swc/core`,
  whose native addon unpacks itself into a per-user cache and on Windows refuses (a) a cache
  directory that another principal may replace, which is the case for its default
  `%LOCALAPPDATA%\swc` on machines where a sandboxed app holds rights on `AppData`, and (b)
  a cache file that has a second hard link, which is the case for a cache inside the
  project whenever the checkout sits in a folder that a sync client backs up (Google Drive
  for desktop hard-links every file waiting for upload into `.tmp.driveupload`). The
  development machine has both conditions (the repository is under `Documents`, which Drive
  backs up), so F1's first choice, `<project>/.swc`, worked only until Drive picked the
  file up. Without the override every `next` command fails there with
  `ERR_SWC_NATIVE_CACHE`. SWC falls back to its default cache when the custom path is
  unusable, and other platforms keep the default, so other machines are unaffected. An
  explicit `SWC_NATIVE_BINDING_CACHE` in the environment wins.

**Integration suite (`tests/integration`, Vitest against the emulators with seed data).** It
drives the services directly (no browser) through the four role flows of 11.3 step 3, so
every service has been executed before it is frozen:

- *Student*: `enrollSelf` → `startLesson` → `saveResponse` → `submitQuizAttempt` (fail, then
  pass; `maxAttempts` on a course the suite authors itself, since the seed quizzes have `maxAttempts: null`; two concurrent submissions create one attempt) → `registerUpload` →
  `submitWork` (second open attempt refused) → `generateAiReview` on the mock provider →
  `completeLesson` → XP ledger, stats, badge and certificate. Recovery: with
  `effectsApplied: false` forced, a re-read repairs XP and certificate.
- *Teacher*: `createClass` → `provisionStudents` and `signUpWithJoinCode` across the account
  policy table (school class, verified educator, unverified educator, under-13) →
  `joinClassWithCode` (other-school conflict) → `assignCourseToClass` (existing self
  enrollment is adopted; the re-pointing of open work is a safeguard, since
  `addStudentToClass` already re-pointed every open unsupervised submission at join time,
  3.4) → `reviewSubmission` (approve gating,
  modify, return, resubmit) → `issueCertificate` / `revokeCertificate` / re-issue →
  `awardManualBadge` → `removeStudentFromClass`.
- *School admin*: `createTeacher` (conflict on an existing email) → `changeUserRole`
  (allowed and refused targets; `classIds` emptied) → `setUserStatus` → `getSchoolStats`,
  `getClassReport`.
- *Platform admin*: `createSchoolWithAdmin` → `upsertLicense` → `getCourseAccess` on a
  premium course with and without a licence → `setVerifiedEducator` → `upsertChallenge` and
  a challenge entry.
- *Negative and session cases*: a teacher of class X cannot read the same student's records
  from class Y; the student projection hides `results`; a cookie issued before
  `sessionsValidAfter` is rejected; a profile cannot be created twice.

Facts for writing the suite: `provisionStudents`, `signUpWithJoinCode`, `createTeacher` and
`createSchoolWithAdmin` need the Auth emulator (`createUser`); `registerUpload` needs the
Storage emulator (`statObject` reads the object) and the suite must not assert that
`clearDownloadTokens` removed `firebaseStorageDownloadTokens` (the emulator ignores it); the
rules suite and this one share the emulator instance in sequence, so the suite does its own
`clearFirestore()` in `beforeAll`; email accounts created with `emailVerified: true` pass
`establishSession`'s `email_unverified` rule; on the mock provider a plain text submission
can be approved, text with an email cannot (8.4: `possible_personal_data` blocks the
teacher's approve), while in the unsupervised flow only a prompt-injection, off-topic or
unsafe flag returns the work and an address only flags it, so an independent learner's text
with an email is accepted as `ai_reviewed`; recovery is exercised by setting
`lessonProgress` / `quizAttempt` / `submission` `effectsApplied` to false by hand and
re-reading through `getLessonPlayerData` / `getSubmissionForViewer`; ledger ids are
`lesson_{courseId}_{lessonId}`, `quiz_{courseId}_{quizId}`, `project_{courseId}_{projectId}`,
`challenge_{challengeId}`, `badge_{badgeId}`; two concurrent `createAttempt` calls yield one
attempt and one `conflict`; `markAiReviewed` is idempotent and refuses supervised work;
`challenges.submissionCount` counts a student's first entry only; the suite authors the
courses it needs (premium, teacher-audience, limited attempts) through the content
repositories (`support/world.ts` `buildOfficialCourse`); `sessionsValidAfter` and the Auth
emulator's `tokensValidAfterTime` have a one-second grain, so a test that invalidates twice
waits for the next second (`nextSecond()`); anonymous entry points are called with the fixed
rate-limit key `integration-client`, whose hourly counters never accumulate because
Firestore is cleared per file; each student in a file submits at most five works a day
(`AI_LIMITS.review.perDay`), or `generateAiReview` marks the review skipped. The unit tests under
`tests/unit/services-*` mirror these flows over mocked repositories (the mocks keep the real
authz predicates, so the no-oracle rules are exercised without Firestore) and are a map of
the expected error classes; no emulator-backed test runs the services end to end before this
suite exists.

Exit criteria: `npm run build` passes with no environment variables; `typecheck`, `lint`,
`test`, `test:rules` and `test:integration` pass; with emulators and seed, each demo role
can sign in through the temporary login form and click through every navigation item to a
stub page. (Met by the Stage 0 gate: the build needs outbound network for Google Fonts,
section 2; the click-through was driven in headless Chrome for the five demo sign-ins of
11.6, every nav and profile item in `en` and `fr` at 1366 and 375 px, plus the language
switch, sign-out, the `next=` landing and the wrong-role redirect.)

**Freeze and foundation maintainer.** After Stage 0 these paths are frozen for workstreams:
`src/types/**`, `src/lib/**` (except `src/lib/ai/**`, which passes to WS-I),
`src/components/{ui,domain,layout}/**`, `src/proxy.ts`, `src/actions/session.ts`, area
`layout.tsx` files, foundation message namespaces, root config, rules, `tests/**`,
`scripts/**` (except `scripts/seed/content/**`, which passes to WS-K).

The foundation owner stays on during Stage 1 as **foundation maintainer** and is the only
person who edits frozen paths. A workstream that finds a bug in a frozen function, or needs
an addition, does not patch it and does not wait for Stage 2: it files a request as a new
file `docs/foundation-requests/<WS>-<n>.md` (the function, the failing case or the signature
wanted) and, if blocked, continues on other pages. The maintainer answers within one working
day with a bug fix or an **additive** change (new optional field, new function, new export),
adds an integration test for every bug, and the workstreams pick it up by rebasing. A change
that would break an existing contract requires amending this document first.

### 11.2 Stage 1 — Feature workstreams (parallel, disjoint ownership)

Paths are relative to `src/` unless they start with `public/` or `scripts/`; `L` =
`app/[locale]`. "Owns" means: the only workstream allowed to create or edit those files.
Stub pages and stub components inside an owned path are replaced by the owner.

| WS | Scope | Owns |
|---|---|---|
| **A** Public site + auth | Homepage, pathway pages, legal, login, signup, verify-email, join, forgot password | `L/(public)/{page.tsx,pathways/**,privacy/**,terms/**}`, `L/(auth)/**` (pages), `actions/auth.ts`, `components/marketing/**`, `components/auth/**`, `public/marketing/**`, messages `home`, `auth`, `legal` |
| **B** Student home + learning | Student Home, Learn, pathway, course detail, lesson player and generic blocks, the shared read-only preview route | `L/student/(shell)/page.tsx`, `L/student/(shell)/learn/**`, `L/student/(player)/**`, `L/(shared)/preview/**`, `components/lesson/**` except `blocks/QuizBlock.tsx`, `blocks/ProjectBlock.tsx`, `blocks/AiActivityBlock.tsx`, `components/student/**`, `actions/learning.ts`, messages `student`, `learn`, `lesson` |
| **C** Quizzes + assessments | Quiz runner, quiz block, teacher assessments | `components/quiz/**`, `components/lesson/blocks/QuizBlock.tsx`, `actions/quiz.ts`, `L/teacher/(shell)/assessments/**`, messages `quiz`, `assessments` |
| **D** Projects + review | Submission form, the `FileUpload` control, attachment deletion, student projects, teacher review queue and review screen, file download route | `L/student/(shell)/projects/**`, `L/teacher/(shell)/projects/**`, `components/projects/**`, `components/lesson/blocks/ProjectBlock.tsx`, `actions/projects.ts`, `actions/review.ts`, `actions/files.ts`, `app/api/files/**`, messages `projects`, `review` |
| **E** Teacher workspace | Dashboard, classes, roster, credentials, join codes, student detail (reset password, award badge), course catalog and assignment, reports, teacher player route | `L/teacher/(shell)/{page.tsx,classes/**,courses/**,reports/**,settings/**}`, `L/teacher/(player)/**`, `components/classes/**`, `components/teacher/**`, `actions/classes.ts`, messages `teacher`, `classes`, `reports` |
| **F** Course creator | Course, module, lesson, block, quiz and project editors for teachers and platform admins | `L/teacher/(shell)/create/**`, `L/admin/courses/**`, `components/course-editor/**`, `actions/course-editor.ts`, messages `courseEditor` |
| **G** School admin | All school pages | `L/school/**` except `layout.tsx`, `components/school/**`, `actions/school.ts`, messages `school` |
| **H** Platform admin | Admin dashboard, schools, users (role, status, educator verification), subscriptions/licences, certificates, challenges | `L/admin/**` except `layout.tsx` and `courses/**`, `components/admin/**`, `actions/admin.ts`, messages `admin` |
| **I** AI Tutor + AI Lab | Anthropic adapter, prompts, safety, tutor route and panel, tutor page, AI Lab, AI activity block | `lib/ai/**`, `app/api/ai/**`, `L/student/(shell)/tutor/**`, `L/student/(shell)/ai-lab/**`, `components/ai/**`, `components/lesson/blocks/AiActivityBlock.tsx`, `actions/ai.ts`, messages `tutor`, `aiLab` |
| **J** Robotics, challenges, achievements, certificates, settings | Robotics page, Challenge Arena, achievements, certificate list/document/verification, student settings (incl. avatar picker) | `L/student/(shell)/{robotics,challenges,achievements,certificates,settings}/**`, `L/(shared)/certificates/**`, `L/(public)/verify/**`, `components/{robotics,challenges,achievements,certificates}/**`, `actions/certificates.ts`, `actions/settings.ts`, messages `robotics`, `challenges`, `achievements`, `certificates`, `settings` |
| **K** Seed content | The five demo courses of brief section 22 and sample challenges, in `en` and `fr`, as data that satisfies `scripts/seed/types.ts` | `scripts/seed/content/**` |

**WS-K contract.** The runner (`scripts/seed/index.ts`, frozen) imports exactly two names
from the barrel `scripts/seed/content/index.ts`: `SEED_COURSES: SeedCourse[]` and
`SEED_CHALLENGES: SeedChallenge[]`. The foundation ships the barrel with one course file
(`my-first-ai-adventure.ts`) and `challenges.ts` (11.6 needs two challenges from the seed);
WS-K may rewrite both and adds the other four course files. Pathways, badges and hardware
platforms are **not** in this folder; they come from `scripts/migrations/0001_initial.ts`
only. The runner validates the whole folder with `scripts/seed/validate.ts` before writing
anything, and `tests/unit/seed-content.test.ts` runs the same checks under `npm test`.

```ts
// scripts/seed/types.ts — ids are stable and unique within the course; array order = `order`
export interface SeedCourse {
  id: string;                                   // course slug = document id (section 11.6)
  course: Omit<CourseInput, 'coverImageFileId'> & { isOfficial: true; pathwayId: string; order: number; accessTier: 'free' };
                                                // the type still asks for `visibility`; the runner ignores it and writes 'public'
  modules: SeedModule[];
  quizzes: SeedQuiz[];                          // referenced from quiz blocks by id
  projects: SeedProject[];                      // referenced from project blocks by id
}
export interface SeedModule { id: string; input: ModuleInput; lessons: SeedLesson[] }
export interface SeedLesson { id: string; input: LessonInput; blocks: SeedBlock[] }
export type SeedBlock = { id: string } & BlockInput;
export interface SeedQuiz { id: string; input: QuizInput }          // includes the answer key
export interface SeedProject { id: string; input: ProjectInput }
export interface SeedChallenge { id: string; input: ChallengeInput }
```

Content rules for WS-K, as `scripts/seed/validate.ts` enforces them: ids match `ID_PATTERN`
and are unique per scope (blocks per lesson); each course has ≥ 2 modules × ≥ 2 lessons and
every lesson has blocks; blocks cover every lesson stage across the course; a quiz block in
every module; every quiz and project is referenced by exactly one block; at least one
project per student course and none in the Teacher Academy course, which needs a reflection
block instead (teachers do not submit projects, and `project` blocks are rejected in
`audience: 'teacher'` courses); seed content contains no uploaded files (`coverImage` is
null, `image` and `file` blocks and `source: 'file'` videos are not used, videos reference
YouTube or Vimeo ids; the foundation course carries the placeholder ids `RoboHolic01..03`,
which the player shows as unavailable, for WS-K to replace with curated videos); every
document has `en` and `fr` text (quiz questions, options and short-answer accepted answers
included; `CONTENT_LOCALES = ['en', 'fr']` in `validate.ts`, regardless of `LOCALES`); quiz
documents stay under `CONTENT_LIMITS.quizDocumentBytes`. `SeedBlock` objects go straight to
`blockInputSchema` and `toBlockFields` (the id is stripped). The runner writes the documents
with these ids and derives the denormalized fields (`quizIds`, `tutorExcerpt`, `lessonId`
links, counts, `private/key`) with the same pure helpers the repositories use
(`src/lib/data/course-derive.ts`): quiz and project documents carry `lessonId` explicitly
(the lesson whose block references them, else null, which is what the block transaction of
3.6 maintains; with null `submitWork` would refuse the project and
`maybeIssueCourseCertificate` ignore it), lessons the fields of
`deriveLessonFields(blocks)`, courses `moduleCount` / `lessonCount` / `publishedAt`,
`splitQuizInput(input, newId)` builds the quiz document and `private/key`, and block
documents store `toBlockFields(input, media)` plus `order` and timestamps. Reference
documents (pathways, badges, hardware platforms) carry `createdAt` / `updatedAt` as
Timestamps and exactly the 3.4 fields (the repositories cast without checking), badge
`criteria` exactly in the `BadgeCriteria` shapes, and every `icon` a name from `ICON_NAMES`
(section 7.4). Users are created through `users.createUserProfile` (never a raw `set`),
schools through `schools.createSchool`, classes through `classes.createClass` (it creates
the `joinCodes` document and the owner's `classIds`).

Cross-workstream consumption (all through the fixed contracts of 7.7 and 10.4, available as
stubs from day one):

| Consumer | Uses | From |
|---|---|---|
| B | `QuizBlock`, `ProjectBlock`, `AiActivityBlock`, `TutorPanel` (via registry and `LessonPlayer`) | C, D, I |
| E | `LessonPlayer` on the teacher player route, which brings `enrollInCourseAction`, `startLessonAction`, `saveBlockResponseAction`, `completeLessonAction` and `submitQuizAttemptAction` with it (their roles include `teacher`); `IssueCertificateButton` on Reports | B, C, J |
| J | `SubmissionForm` (challenge entry), `JoinClassForm` (settings) | D, E |
| A | `JoinClassForm` (signed-in branch of `/join`) | E |
| F | `FileUpload` (block media, cover image), which calls `registerUploadAction` (roles include `teacher`, `platform_admin`); link to `/preview/…` | D, B |
| G | Class management on the school pages calls WS-E's actions directly: `createClassAction`, `updateClassAction`, `archiveClassAction`, `regenerateJoinCodeAction`, `addStudentsAction`, `removeStudentAction`, `resetStudentPasswordAction`, `assignCourseAction`, `unassignCourseAction` (their roles include `school_admin`); link to `/preview/…` | E, B |
| H | `IssueCertificateButton`, `issueCertificateAction`, `revokeCertificateAction` on `/admin/certificates` (roles include `platform_admin`) | J |
| G, H | `sendPasswordReset()` from `lib/auth/client.ts` after `createTeacherAction` / `createSchoolAction` | Foundation |
| D (and through it F, J) | `uploadFile()`, `ensureClientAuth()`, `getClientAuthTokenAction` | Foundation |
| I | `useTutorBridge()` in `TutorPanel` and `AiActivityBlock` | Foundation |
| C, D, G, H | read-only display of each other's data through repositories only | — |

Definition of done for every workstream: no edits outside owned paths (plus its own
`docs/foundation-requests/<WS>-*.md` files); `typecheck` and
`lint` pass; all text in `en` and `fr`; loading, empty and error states present; usable at
375 px width and by keyboard; verified against the emulator with seed data; every page
starts with `requireRole`; every action uses `runAction` with a zod schema from
`src/lib/schemas` and the roles of 10.4; client containers call `router.refresh()` after a
successful action; no open foundation request.

### 11.3 Stage 2 — Integration (one owner)

1. Merge workstreams (no conflicts expected: ownership is disjoint); confirm no stub
   (`not_implemented`) remains and every foundation request is closed.
2. Replace the temporary login form; remove leftover stubs.
3. Full seed with WS-K content; run the end-to-end path per role by hand: student (enrol →
   lesson → quiz → project → XP → certificate), teacher (class → add students → assign →
   review → issue certificate), school admin (teachers, analytics, licences), platform
   admin (school, licence, official course edit, challenge).
4. `test:rules`, `test:integration`, `check-messages`, accessibility and mobile pass, AI on
   mock and on the real adapter.
5. Production checklist: create the Firebase project (region, plan); deploy rules and
   indexes (granting the Storage rules permission to read Firestore when `firebase deploy`
   asks for it); run `migrate`; **run `npm run smoke:queries` against the real project** (it
   calls every repository list function once; the emulator does not enforce composite
   indexes, so this is the only check that catches a missing one); bootstrap the admin; set
   Vercel env (including `RATE_LIMIT_SECRET`, and no `*_EMULATOR_HOST`); schedule
   `cleanup:uploads`; smoke test.

### 11.4 Brief section 21 (MVP items) → owners

| # | MVP item | Built in |
|---|---|---|
| 1 | Authentication | F4, WS-A |
| 2 | Role-based access | F4 (authz), F5 (repositories), F6 (rules), F8 (guards) |
| 3 | Student dashboard | WS-B |
| 4 | Teacher dashboard | WS-E |
| 5 | School admin dashboard | WS-G |
| 6 | Pathways | F5, F6 (migration data); WS-A (public), WS-B (student) |
| 7 | Course listing | WS-B, WS-E, WS-G |
| 8 | Course detail | WS-B, WS-E |
| 9 | Modules | WS-B (outline), WS-F (editing) |
| 10 | Lesson player | WS-B, with blocks from WS-C, WS-D, WS-I |
| 11 | Progress tracking | F5 (`services/learning`), WS-B (UI), WS-E (reports) |
| 12 | Quizzes | F5 (`services/assessment`, grading), WS-C |
| 13 | Project submission | F5 (`services/project-flow`), WS-D |
| 14 | Teacher project review | WS-D |
| 15 | AI grading placeholder/system | F5 (mock + flow), WS-I (real adapter, prompts), WS-D (UI) |
| 16 | AI Tutor interface | WS-I |
| 17 | AI Lab interface | WS-I |
| 18 | Robotics section | WS-J, content from WS-K, hardware catalog from F6 |
| 19 | Certificates | F5 (`gamification/certificates`, `services/recognition`), WS-J, WS-E (issue), WS-G and WS-H (lists) |
| 20 | English/French switching | F2, every workstream's namespaces, WS-K content |

### 11.5 Brief section 28 (order of work) → stages

| Step | Brief | Here |
|---|---|---|
| 1 | Architecture, schema, roles, routes, plan | This document |
| 2 | Next.js, TypeScript, Tailwind, backend, i18n | F1–F6 |
| 3 | Public homepage and authentication | WS-A |
| 4 | Role-based dashboards | F7, F8 (shells, guards), WS-B, WS-E, WS-G, WS-H |
| 5 | Course/module/lesson system | F5, WS-B, WS-F |
| 6 | Quiz and progress tracking | F5, WS-C, WS-B |
| 7 | Project submissions and teacher review | F5, WS-D |
| 8 | AI Tutor and AI Lab interfaces | WS-I |
| 9 | Robotics and challenges sections | WS-J |
| 10 | Seed demo data | F6 (runner + one course, moved early so every workstream develops against real documents), WS-K (full content), Stage 2 (final run) |

The one reordering versus the brief: seed tooling moves from step 10 to the foundation,
because parallel UI work and the integration suite need data.

### 11.6 Demo data created by the seed

Emulator by default; on a real project only with `--allow-project <id>`, and demo users
only with `--with-demo-users`.

- Reference data (from the migration, not the seed): the seven pathways of brief section 8;
  the seven badges of section 9.3; hardware `simulator`, `generic-camera-rover`,
  `generic-sensor-kit`.
- Courses (ids): `my-first-ai-adventure` (AI Explorer, 8–10), `build-with-generative-ai`
  (AI Creator, 11–14), `from-ai-user-to-ai-developer` (AI Builder, 15–18),
  `ai-essentials-for-educators` (Teacher Academy), `ai-robotics-foundations` (AI Robotics).
  All official, published, `free`, `certificateEnabled`; `ownerUid` is the demo platform
  admin's uid on the emulators and `'system'` on a real project (where that admin is never
  created), `schoolId` null, `visibility: 'public'`, `status: 'published'` with
  `publishedAt` set once.
- School "Demo Academy" with one licence (`all_official`, 100 seats, active for a year);
  class "Grade 6 A" with the first two student-audience courses of `SEED_COURSES` assigned
  (one until WS-K adds the others). `meta/seed` remembers the auto-ids the repositories gave
  the school, licence, class and challenges, so a re-run updates instead of duplicating
  (second run: 0 created, no duplicate attempts or submissions).
- Accounts: `admin@demo.roboholic.test`, `schooladmin@demo.roboholic.test`,
  `teacher@demo.roboholic.test`, `student@demo.roboholic.test` (individual), and class
  students `lea.demo`, `omar.demo`, `maya.demo` (username accounts, written through the
  repositories rather than `provisionStudents`; `usernameBase('Lea Demo')` yields the same
  `lea.demo`). Scripts cannot import `services/provisioning.ts` (section 2), so the seed
  creates every account the way its `writeProfile` does: the Auth user (fixed uids
  `demo-admin`, `demo-school-admin`, `demo-teacher`, `demo-student`, `demo-lea`, `demo-omar`,
  `demo-maya`; an Auth account that already holds the address keeps its own uid), then
  `users.createUserProfile`, `schools.adjustSchoolCounts` through
  `services/identity.countedIn`, and `claims.syncClaims`. Email accounts are created with
  `emailVerified: true`, which satisfies `establishSession`'s `email_unverified` rule;
  `teacher@demo` has `verifiedEducator: true`.
- Progress (`scripts/seed/demo-progress.ts`, through the services as the learners and the
  teacher): `lea.demo` completes all four lessons, passes both quizzes first time and
  submits the project, which the teacher accepts with decision `modify` (criteria
  90/85/95/100), giving the automatic certificate, the `ai-explorer` pathway badge and the
  manual badge `responsible-ai-champion` awarded by the teacher (850 XP + 150 bonus = 1000,
  level 3); `omar.demo` (locale `fr`) completes lessons 1–2 with `quiz-m1` failed then
  passed, starts lesson 3 and has the project submitted with a ready mock AI review (the one
  submission awaiting review); `maya.demo` starts lesson 1 with a reflection saved;
  `student@demo` self-enrols, completes lesson 1 and fails `quiz-m1` once. The seed summary
  prints the certificate's verification code and the awaiting-review submission id.
- Join code: no repository function sets a chosen code, so the seed sets `RBHDEM23` with one
  raw transaction that mirrors `data/classes.regenerateJoinCode` (create
  `joinCodes/RBHDEM23`, delete the old code's document, update `classes.joinCode`), then
  enables it through `data/classes.updateClass`, so the 24-hour expiry restarts on every
  seed run. This is the only write on repository-owned documents that bypasses a
  repository; a `data/classes.setJoinCode(actor, classId, code)` function would remove it.
- Two challenges: one open weekly challenge, one upcoming robotics challenge.

| | Emulator | Real project (`--allow-project`) |
|---|---|---|
| Demo platform admin | created | **never created** (use `admin:bootstrap`) |
| Password of demo accounts | `SEED_DEMO_PASSWORD`, or the default `demo-password` (`DEFAULT_DEMO_PASSWORD` in `scripts/seed/demo-users.ts`); the seed summary names the source | `SEED_DEMO_PASSWORD` is required with `--with-demo-users` and must be ≥ 16 characters; the seed refuses otherwise |
| Demo class join code | fixed `RBHDEM23`, enabled | random, `joinCodeEnabled: false` |

---

## 12. What the brief does not cover

Each row is something the owner should know about, with the default this architecture
uses. Work proceeds on the defaults; rows marked **Decide** are the ones where a different
answer would materially change the product or its cost, per the working agreement.

| Topic | Why it matters | Default chosen | Owner |
|---|---|---|---|
| Child-privacy law | Users are 8–18. COPPA (US, under 13), GDPR Article 8 (EU, consent age 13–16 by country), the UK Children's Code and local laws in each market impose consent, minimisation and transparency duties | An under-13 account can exist **only inside an active school**, which is the consenting party; self sign-up is limited to 13+ and teachers, with a verified email; a teacher without a school cannot create accounts for children until verified, and never for under-13s (section 1.5); no birth date, photo, address or phone is collected; no public profiles | **Decide**: legal review per launch market; school data-processing agreement; final privacy policy and terms (placeholders ship) |
| Educator verification | Anyone can sign up as a "teacher". Staff powers over children must not follow from a self-declared role | Self-registered teachers start unverified: they can learn (Teacher Academy), author courses and run classes that 13+ students with their own accounts choose to join; they cannot create student accounts and get no premium content. A platform admin sets `verifiedEducator` by hand | **Decide**: what evidence makes an individual teacher "verified", and who checks it |
| Parental consent and parent accounts | The brief mentions individual students/parents but defines no parent role | No parent role; no individual accounts under 13 | **Decide** when B2C for under-13s becomes a goal (needs verifiable parental consent) |
| Age assurance | Age band is self-declared or set by the teacher | No verification | Accept for MVP |
| School onboarding | The homepage has a Schools entrance, but nothing in the brief says how a school gets an account | Schools are created by a platform admin; the Schools entrance leads to a contact address (`NEXT_PUBLIC_CONTACT_EMAIL`) | **Decide** whether schools should self-register (needs a vetting step) |
| Moderation of student uploads | Minors can upload images, audio, video and files; no automatic scanning for malware or inappropriate content exists | Uploads are visible only to the student, their teachers, their school admin and platform admins; never to peers or the public, and never through a permanent URL; type/size allow-lists and daily quotas; nothing uploaded is executed or rendered as a document; the student (before review) and the teacher can delete an attachment | Add malware/content scanning before large-scale use |
| "Show your project" | The product principle ends with showing projects, but section 27 forbids public student exposure | No gallery in the MVP; work is shown to the teacher only | **Decide** whether a moderated class- or school-level showcase is wanted |
| AI output safety | A tutor talking to children needs boundaries and oversight | Policy prompt, input redaction, untrusted-input framing, output checked before display, rate limits and budgets, AI labelled as AI, mock by default (section 8.6) | Review prompts with an educator before enabling the real provider |
| AI conversation logging | Safeguarding teams often want transcripts; privacy argues against keeping them | Not stored; only counters and blocked-request counts | **Decide**: if transcripts are required, add a retention-limited log visible to school admins |
| AI provider terms | Providers have conditions for services used by minors and their own data-retention defaults | No personal data is sent; adapter is swappable | Confirm the chosen provider's terms and retention settings before go-live |
| AI cost | Real model calls cost money per token; grading runs on submissions | Mock unless configured; default real model `claude-opus-5-5`, overridable with `ANTHROPIC_MODEL`; per-user request and token limits, 5 AI reviews per student per day, and daily token budgets per school and platform-wide (section 8.7) | **Decide** model tier and the budget values |
| Firebase plan | The design targets the free Spark plan, but Firebase currently requires the pay-as-you-go Blaze plan to provision a Cloud Storage bucket on new projects (verify when creating the project). Spark also caps Firestore at roughly 50k reads and 20k writes per day; one lesson view costs a few dozen reads, so Spark covers a demo, not a school pilot | Everything except file uploads works on Spark; no Cloud Functions are used. No cross-request cache in the MVP (it would add an invalidation contract to every course write); `getCourseOutline` and `listBlocks` are the first candidates if read volume matters | **Decide**: move to Blaze with a budget alert before any pilot |
| Firestore region | Chosen at project creation, cannot be changed, affects data residency | `eur3` (Europe multi-region) | **Decide** before creating the production project |
| Backups and recovery | No automatic backups on the free plan | None in MVP; seed and migrations are re-runnable | Enable point-in-time recovery and scheduled backups on Blaze before real student data |
| Data deletion and export | Erasure and access requests (GDPR), school offboarding; real pupils' media is stored from the first pilot | `scripts/delete-user-data.ts` (`npm run user:delete -- <uid-or-email>`) ships with the foundation: it removes the Auth user, profile, memberships, enrollments and progress, attempts, submissions with their reviews and AI reviews, `files` records and the `user-uploads/{uid}/` objects, the user's `aiUsage` and `uploadUsage` documents, and decrements `challenges.submissionCount` once per challenge entered; the only anonymised snapshot is `certificates.recipientName` ('Deleted user'; the certificate stays verifiable). Left in place: teacher-made courses the user owns and their `course_media` files, and `reviewerName` on reviews the user wrote. It refuses while the user owns a non-archived class. Attachments can be deleted in the app. Accounts can be disabled. No self-service export | Build a school export before production in regulated markets |
| Scheduled maintenance | Orphaned uploads and expired rate-limit documents must be removed, and the MVP has no Cloud Functions | `npm run cleanup:uploads` is idempotent and run by hand or from a scheduled CI job | Choose the scheduler (CI cron or Vercel Cron) at deployment |
| Payments | Five business models are listed, no payment flow | No payment integration; platform admins enter subscriptions and licences by hand; schema has provider fields for Stripe later | Later phase |
| Licence enforcement | What happens at seat limit or expiry | `premium` courses need a covering licence or subscription (for staff too); expiry derived from dates; **seats are shown (used / total) but not enforced**; all demo content is `free`; no grace periods or concurrent-session limits | **Decide** the commercial rule for an over-limit school with the first paying school |
| Email | Invitations, notifications and receipts need a mail service | Only Firebase Auth's built-in emails: address verification at sign-up and password reset. Students join by class code or teacher-created username; staff-created teachers get a reset email (triggered from the creating admin's browser) to set their password. No notification emails | Add a transactional provider later |
| Password recovery for username accounts | Students without email cannot self-recover | Teacher or school admin resets and receives a new generated password (shown once); the reset signs the account out everywhere | Accept |
| School SSO | Many schools expect Google or Microsoft sign-in | Email/username + password only | Add providers in Firebase Auth later; no schema change needed |
| Notifications | No in-app, email or push notifications are specified | None; dashboards show queues and statuses | Later phase |
| Accessibility | Required for school procurement in many places | WCAG 2.1 AA as the build baseline (section 7.1); transcript field on video blocks; not externally audited | Audit before selling to public schools |
| Analytics and tracking | Third-party trackers on a children's service create consent obligations | No third-party analytics, ads or tracking cookies; lesson text cannot embed third-party images; product metrics come from Firestore counts; the session cookie is strictly necessary | Keep unless a cookieless tool is chosen |
| Abuse and rate limiting | Join-code guessing, sign-up spam, scraping, upload and AI abuse | Server-side rate limits (hashed client IP, per hour) on join-code lookup, join sign-up and sign-up; join codes are 8 characters, off by default and expire 24 hours after being enabled; upload quotas; AI limits and budgets; Firebase Auth throttles sign-in. A student who joins by code is in the class immediately; the roster shows how each student joined and the teacher can remove them | **Decide** whether code joins should wait for teacher approval. Add App Check and a WAF rule before public launch |
| Sessions on shared devices | School computers are shared | Students: 12-hour session in a browser-session cookie, no Firebase client state kept on the device, visible one-click sign-out that ends the session everywhere. Staff: 24 hours | Accept |
| Content versioning | Editing a published course changes it for enrolled learners | Edits are live; structure cannot be deleted once learners are enrolled; progress percent recalculates on next completion | Draft-of-published is future |
| Code execution | "Coding activity" implies running code | Code is written and saved, not executed | In-browser execution (e.g. Pyodide) is future |
| AI Lab tools | Image, video and voice generation for minors needs its own safety review and budget | Only Text AI calls the provider; the rest are labelled mock interfaces | Later phase |
| Search | Firestore has no full-text search | Lists are scoped, ordered and paginated; no search box across content | Add a search service later |
| Age ranges in the brief | Section 8 gives AI Creator ≈ 10–12 and AI Builder ≈ 12–14; section 22's demo courses for those pathways say 11–14 and 15–18 | Pathways carry section 8's ranges; each course carries its own range (section 22's values for the demo courses); ages are guidance, never an access gate; the brief gives no range for AI Robotics, so the migration writes 8–18 (null would also do) | Confirm intended ranges, AI Robotics included |
| Role edge cases | Individual teachers, teachers in two schools, school admins who also teach or learn, a student in two classes that assign the same course | One role and at most one school per user; individual teachers can run classes with `schoolId: null` under the limits above; school admins do not teach or take courses in the MVP; a student's work in a course has one supervising class (chosen deterministically), though every class report shows their progress | Multi-role and multi-school are future |
| Platform admin scope | The brief lists pathways, badges and certificates among the things a platform admin manages, but no platform admin dashboard is in the MVP list | Admin pages for schools, users, licences/subscriptions, official courses, certificates and challenges (section 6.7). Pathways, badge definitions and hardware platforms are edited through versioned migration scripts | Add those admin pages when reference data starts changing often |
| Certificates | Format, legal name, verification | HTML page printed to PDF; shows display name; public verification page shows course, date, issuer and status but not the learner's name | Accept |
| Time zones | Deadlines and daily limits | Stored in UTC, displayed in the browser's time zone; AI and upload limits reset at 00:00 UTC | Accept |
| Monitoring | Errors and uptime | Vercel logs only; no personal data in logs; audit entries are read in the Firebase console | Add error tracking before launch |
| Testing | Not mentioned in the brief | Unit tests (schemas and their message keys, runAction, env guard and Firebase initialisation, authz, account policy, grading and answer normalisation, levels, badges and gamification events, learning helpers, course derivation, the AI layer on the mock provider, every service over mocked repositories, nav config, translation fallback); Security Rules tests on the emulators; an emulator-backed integration suite over the services (section 11.1); manual end-to-end script in Stage 2. No DOM test runs the components (node-only Vitest, no DOM library in the frozen `package.json`); they are checked by hand in a browser | Automated browser end-to-end and component tests later |
| Mobile apps and offline | Brief asks for responsive web only | Responsive web, no offline mode | Later phase |

Decisions to confirm, in order of impact: (1) under-13 individual accounts and parent
consent, (2) how individual teachers are verified, and whether schools may self-register,
(3) AI transcript retention, (4) Firebase plan and region, (5) real AI model and budgets,
(6) the seat-limit rule for licences, (7) whether class-code joins need teacher approval,
(8) whether any form of project showcase is in scope.
