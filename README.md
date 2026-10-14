# RoboHolic AI

RoboHolic AI is an AI-education platform for students, teachers and schools. It teaches
artificial intelligence through practical, project-based learning: learning pathways for ages
8 to 18 (AI Explorer, AI Creator, AI Builder, AI Engineer, AI Innovator, AI Robotics) plus a
Teacher Academy for professional development. Each course is a sequence of modules and
lessons that follow one flow (discover, learn, watch, try, ask AI, build, check, reflect,
earn), with quizzes, project submissions reviewed by a teacher with AI-suggested grading, an
AI Tutor, an AI Lab, XP, badges and certificates. Classes, licences and school analytics make
it a multi-tenant SaaS product; English and French are supported from the start.

The product principle: learn, try, build, get feedback, improve, show your project.

- [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md): the owner's brief (scope and intent).
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): the build contract. Every collection, route,
  file and exported function is specified there; read the relevant section before changing
  code.
- [AGENTS.md](AGENTS.md): house rules for coding agents (this Next.js version differs from
  older ones; read `node_modules/next/dist/docs/`).

## Stack

| Concern    | Choice                                                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Framework  | Next.js 16 App Router, React 19, TypeScript `strict`                                                                                    |
| Styling    | Tailwind CSS v4 (`@theme` tokens in `src/app/globals.css`), `lucide-react` icons                                                        |
| i18n       | next-intl 4, `[locale]` segment (`/en`, `/fr`), message catalogs in `src/messages`                                                      |
| Backend    | Firebase Authentication, Cloud Firestore, Cloud Storage, Security Rules. No Cloud Functions                                             |
| Server SDK | `firebase-admin`, only under `src/lib/**` and `scripts/**` (the browser uses `firebase` for Auth and Storage only; no client Firestore) |
| Validation | `zod` for every server action input, route handler body and environment variable                                                        |
| AI         | A provider interface with a mock provider (default) and an Anthropic adapter (`@anthropic-ai/sdk`)                                      |
| Hosting    | Vercel, Node.js runtime for everything                                                                                                  |
| Tooling    | npm, ESLint 9, Prettier, Vitest, `firebase-tools` (local dependency), `tsx` for scripts                                                 |

## Prerequisites

- **Node.js 24** and the npm that ships with it (`package.json` requires Node 22.12 or newer;
  CI runs 24).
- **JDK 21** (for example Eclipse Temurin) for the Firebase emulators. Needed by
  `npm run emulators`, `npm run test:rules` and `npm run test:integration`; nothing else uses
  Java.
- The Firebase CLI is the `firebase-tools` devDependency: run it as `npx firebase ...`. No
  global install is needed, and no Firebase account is needed until you deploy.

## Setup

```sh
npm ci
cp .env.example .env.local        # PowerShell: Copy-Item .env.example .env.local
```

`.env.example` is written for the emulators: the Firebase web config values are placeholders,
`NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` points the browser SDK at the emulators, and the
three `*_EMULATOR_HOST` variables point the Admin SDK at them. Nothing in it is needed for
`npm run build`. Every `.env*` file except the example is git-ignored. The full variable list
with its meaning is in section 1.8 of the architecture document.

## Running the emulators

```sh
npm run emulators
```

This creates the `.emulator-data` folder when it is missing (firebase-tools refuses an
`--import` directory that does not exist) and runs `firebase emulators:start --project
demo-roboholic --import .emulator-data --export-on-exit`: Auth on port 9099, Firestore on
8080, Storage on 9199 and the Emulator UI on <http://localhost:4000> (`firebase.json`). The
data is exported to `.emulator-data` (git-ignored) when you stop the emulators with Ctrl+C
and imported again on the next start, so migrating and seeding is a one-time job per
machine. The project id `demo-roboholic` is
a Firebase "demo" project: nothing talks to a real project and no login is needed.

For a one-off command against fresh emulators, `firebase emulators:exec` starts and stops
them around it:

```sh
npx firebase emulators:exec --project demo-roboholic "npm run migrate && npm run seed"
```

On Windows, see [Windows notes](#windows-notes) for the Java variables the emulators need.

## Reference data and demo content

With the emulators running, in a second terminal:

```sh
npm run migrate
npm run seed
```

- `npm run migrate` applies `scripts/migrations/NNNN_*.ts` in order and records each one in
  `meta/migrations`; a recorded migration is skipped unless you pass `-- --rerun`.
  `0001_initial` writes the reference data: the seven learning pathways, the seven badge
  definitions and the hardware platforms. Migrations are the only source of this data.
- `npm run seed` upserts the demo content by stable id, so it can be run again at any time:
  the demo courses, the school "Demo Academy" with one licence, the class "Grade 6 A" with
  the first two student courses of the seed assigned (one until the other demo courses are
  written), two challenges, and the demo accounts below with some progress, one submitted
  project awaiting review and one issued certificate. The summary it prints ends with the
  certificate's verification code and the id of the submission awaiting review. On the emulators the demo
  accounts are created and the class join code is the fixed `RBHDEM23`.

Every script under `scripts/` talks to the emulators unless `--allow-project <id>` names a
real project (see [Deploying](#deploying)). They all accept `--env-file <path>` (default:
`.env.local` when it exists; variables already set in the environment win), `--yes` (skip the
confirmation a real project asks for) and `--help`. Pass script flags after `--`, for example
`npm run migrate -- --rerun`. For the emulator target the scripts set the emulator hosts and
the project id themselves, so they work without a `.env.local`.

## Demo accounts and signing in

All demo accounts share one password: on the emulators it is `demo-password`
(`DEFAULT_DEMO_PASSWORD` in `scripts/seed/demo-users.ts`) unless `SEED_DEMO_PASSWORD` was set
when the seed ran.

| Account                              | Role                            | Signs in with |
| ------------------------------------ | ------------------------------- | ------------- |
| `admin@demo.roboholic.test`          | Platform admin (emulators only) | email         |
| `schooladmin@demo.roboholic.test`    | School admin of Demo Academy    | email         |
| `teacher@demo.roboholic.test`        | Teacher of Grade 6 A            | email         |
| `student@demo.roboholic.test`        | Individual student (no school)  | email         |
| `lea.demo`, `omar.demo`, `maya.demo` | Pupils of Grade 6 A             | username      |

Sign in at <http://localhost:3000/en/login> (or `/fr/login`) with the email or username and
the password. After sign-in each role lands on its own area: `/student`, `/teacher`, `/school`
or `/admin` (always behind the locale prefix, so `/en/student`).

**Pupil usernames.** Students that a school or teacher creates have no email address. They
get a username derived from their display name ("Lea Demo" becomes `lea.demo`; accents are
dropped, words are joined with a dot, and a random digit suffix is added when the name is
taken) and a generated password that is shown once to the staff member who created the
account. Behind the scenes the Firebase Auth account uses the synthetic address
`{username}@student.roboholic.invalid`; the login form appends that domain when the
identifier has no `@`, so typing `lea.demo` is enough. `.invalid` is a reserved top-level
domain, so no mail can ever be sent to these accounts; a teacher or school admin resets a
pupil's password in the app and receives a new generated one.

Other ways in, all working on the emulators: a student can join Grade 6 A at `/en/join` with
the code `RBHDEM23` (an account is created when the student has none), and a 13+ student or a
teacher can self-register at `/en/signup`. The emulators send no email: address-verification
and password-reset links are printed in the terminal that runs the Auth emulator. The demo
email accounts are created already verified.

## Running the app

```sh
npm run dev                       # http://localhost:3000 redirects to /en
```

The public pages work without any environment; signing in needs `.env.local` and the
emulators (or a real project). The AI features run on the mock provider unless you configure
a real one (see [AI provider](#ai-provider)).

A production build and server:

```sh
npm run build                     # needs no environment variables
npm run start                     # needs the same variables as `dev`
```

`npm run build` downloads the Inter font from Google Fonts and self-hosts it, so it needs
network access; `next dev` falls back to a system font with a warning when the download fails,
`next build` fails.

## Checks and test suites

| Command                    | What it runs                                                                                                                                       | Needs                  |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `npm run lint`             | `eslint .`, then `scripts/check-messages.ts` (fails when the `en` and `fr` catalogs differ by a namespace file or a key)                           | nothing                |
| `npm run typecheck`        | `next typegen && tsc --noEmit` (writes `.next/types`; do not run it while `next dev` or `next build` is using `.next`)                             | nothing                |
| `npm test`                 | Vitest project `unit`: `tests/unit/**` (node only, no Firebase, mocked repositories)                                                               | nothing                |
| `npm run test:rules`       | Starts the Firestore and Storage emulators with `firebase emulators:exec` and runs Vitest project `rules`: `tests/rules/**` against the rule files | JDK 21                 |
| `npm run test:integration` | Starts the Auth, Firestore and Storage emulators and runs Vitest project `integration`: `tests/integration/**`, the service flows of each role     | JDK 21                 |
| `npm run build`            | Production build with no environment                                                                                                               | network (Google Fonts) |
| `npm run format`           | `prettier --write .`                                                                                                                               | nothing                |

The two emulator suites start their own emulators on the ports of `firebase.json`, so stop
`npm run emulators` before running them. Their files run one at a time because every file
shares the one emulator instance; the integration suite clears Firestore in `beforeAll`.
Scripts and tests import `src/lib/**` modules that begin with `import 'server-only'`:
scripts run with `tsx --conditions=react-server`, and `vitest.config.mts` aliases
`server-only` to an empty module.

## Deploying

### 1. Create the Firebase project

Section 12 of the architecture document lists the decisions this depends on. Defaults:

- **Plan**: Firebase currently requires the pay-as-you-go **Blaze** plan to provision a
  Cloud Storage bucket on a new project (verify this when creating the project), and the
  Spark plan caps Firestore at roughly 50k reads and 20k writes per day, which covers a demo
  but not a school pilot. Move to Blaze with a budget alert before any pilot. No Cloud
  Functions are used.
- **Firestore**: Native mode, location **`eur3`** (Europe multi-region). The location is chosen
  at creation and cannot be changed afterwards.
- **Storage**: create the default bucket. Uploads go straight from the browser to Storage
  and are checked by `storage.rules`.
- **Authentication**: enable the Email/Password provider. That is the only sign-in method.
- **Web app**: register one to get the five `NEXT_PUBLIC_FIREBASE_*` values.
- **Service account**: Project settings > Service accounts > generate a private key. It gives
  `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` (keep the quotes and the `\n` escapes when
  pasting it on one line); `FIREBASE_PROJECT_ID` and `FIREBASE_STORAGE_BUCKET` come from the
  project.

Put these in an environment file for the real project, for example
`.env.production.local` (git-ignored): copy `.env.example`, fill in the values, set
`NEXT_PUBLIC_USE_FIREBASE_EMULATORS` to anything but `true`, remove the three
`*_EMULATOR_HOST` lines, and set `RATE_LIMIT_SECRET` (the example file shows how to generate
one).

### 2. Rules and indexes

```sh
npx firebase login
npm run deploy:rules -- --project <id>
```

`deploy:rules` is `firebase deploy --only firestore:rules,firestore:indexes,storage`: the
Firestore rules, the composite indexes and single-field exemptions of
`firestore.indexes.json`, and the Storage rules. `.firebaserc` only has the emulator alias
`demo-roboholic`, so pass `--project <id>` (or add an alias with `npx firebase use --add`).

The Storage rules read the caller's profile document with the cross-service function
`firestore.get(...)`. On the first deploy the CLI asks "Cloud Storage for Firebase needs an
IAM Role to use cross-service rules. Grant the new role?": answer yes. It grants
`roles/firebaserules.firestoreServiceAgent` to the project's Storage service agent
(`service-<project-number>@gcp-sa-firebasestorage.iam.gserviceaccount.com`); you can also grant
it in the Google Cloud IAM page. Without it every upload is denied.

Composite indexes take a few minutes to build after the deploy.

### 3. Data

```sh
npm run migrate -- --allow-project <id> --env-file .env.production.local
npm run smoke:queries -- --allow-project <id> --env-file .env.production.local
```

`migrate` writes the reference data. `smoke:queries` runs every repository list function
against the project, so a missing or still-building index fails here rather than on a page.

The demo courses are optional on a real project:
`npm run seed -- --allow-project <id> --env-file ...` seeds the courses and challenges only.
Add `--with-demo-users` for the demo school and accounts; it then requires
`SEED_DEMO_PASSWORD` of 16 characters or more, never creates the demo platform admin, and
gives the demo class a random, disabled join code.

A run against a real project refuses to start while any emulator variable is set, requires
`FIREBASE_PROJECT_ID` to equal the `--allow-project` id, and asks for confirmation on the
terminal (`--yes` skips it, for example in CI).

### 4. The first platform admin

```sh
npm run admin:bootstrap -- <email> --allow-project <id> --env-file .env.production.local
```

If no Auth user has that email, the script creates one and prints a password-reset link. If
one exists it must have a verified email; the script then promotes it and revokes its
existing sessions. Every later school, school admin and teacher is created in the app by a
platform admin or a school admin.

### 5. Vercel

Import the repository (framework Next.js, build command `npm run build`). Everything runs on
the Node.js runtime; no Edge runtime. Environment variables:

| Variable                                                                                                                                                                    | Notes                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_APP_ID` | Web config of the registered web app (not secrets)                      |
| `NEXT_PUBLIC_APP_URL`                                                                                                                                                       | The deployed origin, used in certificate verification links             |
| `NEXT_PUBLIC_CONTACT_EMAIL`                                                                                                                                                 | Optional; the "For Schools" contact button is hidden when unset         |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET`                                                                           | Admin SDK service account                                               |
| `RATE_LIMIT_SECRET`                                                                                                                                                         | Required; 16+ characters; hashes client IPs for the rate-limit counters |
| `AI_PROVIDER`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `AI_DAILY_TOKEN_BUDGET`                                                                                              | See [AI provider](#ai-provider); leave `AI_PROVIDER` unset for the mock |

Never set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` or any `*_EMULATOR_HOST` variable on Vercel:
with an emulator host set the Admin SDK would accept unsigned tokens, so `getServerEnv()`
throws when one is present on Vercel or with a project id that does not start with `demo-`.

### 6. Maintenance scripts

- `npm run cleanup:uploads -- --allow-project <id>` deletes Storage objects that were never
  registered or attached and expired rate-limit documents. It is idempotent; the MVP has no
  scheduler, so run it by hand or from a scheduled CI job. `--dry-run` only reports and
  `--max-age-hours <n>` changes the minimum age (default 24 hours).
- `npm run user:delete -- <uid-or-email> --allow-project <id>` erases one user: the Auth
  account, profile, memberships, enrollments, progress, attempts, submissions, files and
  Storage objects, and anonymises the name on the user's certificates, which stay verifiable.
  It refuses while the user still owns a class that is not archived.

Both work against the emulators without `--allow-project`.

## Folder layout

```
docs/                     PRODUCT_SPEC.md, ARCHITECTURE.md
public/                   favicon, icon, marketing imagery
scripts/                  migrate, migrations/, seed/, bootstrap-admin, delete-user-data,
                          cleanup-uploads, smoke-queries, check-messages; lib/ shared by all
tests/unit                node-only unit tests (Vitest project `unit`)
tests/rules               Security Rules tests on the emulators (project `rules`)
tests/integration         service flows per role on the emulators (project `integration`)
src/proxy.ts              next-intl middleware and the session-cookie presence gate
src/app/[locale]/         (public), (auth), (shared), student/, teacher/, school/, admin/
src/app/api/              route handlers: streamed AI tutor, authorized file download
src/actions/              'use server' files, one per feature
src/lib/                  env, errors, limits, schemas (zod), firebase (admin + client init,
                          storage paths), auth (session cookie, authz, usernames), data
                          (Firestore repositories), services (use cases), learning,
                          gamification, ai (provider interface, mock + Anthropic, prompts,
                          safety), i18n, navigation
src/components/           ui (primitives), domain, layout (shells), lesson (player and block
                          renderers), one folder per feature
src/messages/{en,fr}/     one JSON file per namespace; `check-messages` keeps them in sync
src/types/                domain, input and action types
firestore.rules, storage.rules, firestore.indexes.json, firebase.json, .firebaserc
```

Rules the code follows everywhere (section 2 of the architecture document): the `@/*` alias
maps to `src/*`; every file that imports `firebase-admin` starts with `import 'server-only'`;
`firebase/firestore` is banned in `src/` (the browser never reads Firestore); all user-visible
text comes from the message catalogs or from database translations; internal links use the
`Link` and `redirect` of `@/lib/i18n/navigation`, never `next/link`; Tailwind classes are
logical (`ms-*`, `pe-*`, `text-start`), never physical, so right-to-left locales need no
component changes. ESLint enforces the import and class rules; the message catalogs are
checked by `scripts/check-messages.ts`.

## AI provider

`AI_PROVIDER` selects the adapter behind `src/lib/ai`:

- `mock` (the default, also when the variable is unset): deterministic answers, no network,
  no key. The demo, the tests and the integration suite run on it.
- `anthropic`: the real adapter, which needs `ANTHROPIC_API_KEY`; `ANTHROPIC_MODEL` defaults
  to `claude-opus-5-5`. `src/lib/ai/providers/anthropic.ts` is a placeholder until the AI
  workstream lands it: every call fails loudly rather than serving mock answers as if they
  were real.

The AI Tutor, the grading suggestions shown to teachers and the Text tool of the AI Lab go
through the provider; the other AI Lab tools are labelled mock interfaces in this release.
Whatever the provider, the safety layer applies: a policy prompt, input redaction, output
checks before display, per-user request and token limits, 5 AI reviews per student per day,
and daily token budgets per school and platform-wide (`AI_DAILY_TOKEN_BUDGET` overrides the
platform-wide one). The AI usage counters live in Firestore; no conversation transcripts are
stored.

## Windows notes

- **Java for the emulators.** In PowerShell, before `npm run emulators`, `test:rules` or
  `test:integration`:

  ```powershell
  $env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot'   # your JDK 21
  $env:Path = "$env:JAVA_HOME\bin;$env:Path"
  $env:JAVA_TOOL_OPTIONS = "-Djdk.net.unixdomain.tmpdir=$env:USERPROFILE\.cache"
  ```

  Without `JAVA_TOOL_OPTIONS` the Firestore emulator exits with "Unable to establish loopback
  connection" from a non-interactive shell. With it, the CLI prints a harmless
  "Unexpected rules runtime error: Picked up JAVA_TOOL_OPTIONS" line.

- **"Port 8080 is not open"** right after a previous emulator run has stopped is the socket
  in TIME_WAIT; retry after a few seconds. If it persists, someone else is running the
  emulators on this machine.

- **SWC cache.** `next.config.ts` defaults `SWC_NATIVE_BINDING_CACHE` to `~/.cache/swc` on
  Windows. The SWC native addon refuses its default cache (`%LOCALAPPDATA%\swc`) on machines
  where a sandboxed app holds rights on AppData, and refuses a cache inside the project when a
  sync client such as Google Drive hard-links files waiting for upload; either case makes every
  `next` command fail with `ERR_SWC_NATIVE_CACHE`. Set the variable yourself to use another
  location.

- **Google Drive.** When the checkout sits in a synced folder, Drive briefly locks files it is
  uploading; a file operation or build step that fails with `EBUSY` or `EPERM` usually succeeds
  when retried a few seconds later. Keep `node_modules`, `.next` and `.emulator-data` out of
  the sync set if the client allows it.

- Line endings are forced to LF by `.gitattributes`, which is also Prettier's default.

## Continuous integration

`.github/workflows/ci.yml` runs on every push to `main` and every pull request, on
`ubuntu-latest` with Node 24 and `npm ci` (npm cache enabled), in two parallel jobs:

- **checks**: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. The build runs
  with no environment variables, which the app must support (no `.env*` file is committed).
- **emulators**: `npm run test:rules` and `npm run test:integration` with Temurin JDK 21
  (`actions/setup-java`). The emulator binaries that `firebase-tools` downloads are cached
  under `~/.cache/firebase/emulators`, keyed by `package-lock.json`, so a firebase-tools
  upgrade refreshes them.

No secrets are needed: the emulator suites use the demo project id and the build fetches
nothing but the Inter font from Google Fonts. A runner without outbound network therefore
fails the build step with "Failed to fetch `Inter` from Google Fonts"; on such a runner, either
allow `fonts.googleapis.com` and `fonts.gstatic.com`, or switch `src/app/[locale]/layout.tsx`
from `next/font/google` to `next/font/local` with a vendored font file (see
`node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md`).
