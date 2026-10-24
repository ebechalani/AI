// The seed runner (ARCHITECTURE.md 11.2, 11.6): idempotent upserts by stable id. Reference data
// comes from the migrations and is only checked here. The runner writes the demo courses of
// scripts/seed/content with their ids and derives every denormalized field with the helpers of
// src/lib/data/course-derive.ts; the demo school, accounts, class, licence, challenges and the
// learners' progress go through the repositories and services, as the application does.
//
//   npm run seed                                            emulators, demo users included
//   npm run seed -- --allow-project <id> [--with-demo-users] [--yes]
//   npm run seed -- --allow-project <id> --overwrite-official-courses [--yes]
//
// A real project gets demo users only with --with-demo-users and SEED_DEMO_PASSWORD (at least
// 16 characters); it never gets the demo platform admin, and its demo class keeps a random,
// disabled join code. A real project whose official courses were seeded before is refused unless
// --overwrite-official-courses is given: they may hold edits made in the app, and new content
// reaches it through scripts/content-release.ts instead (11.7). A first run that failed before
// the courses were all written is not refused, so it can be run again.

import { SYSTEM_ACTOR, type Actor } from '@/lib/auth/actor';
import { syncClaims } from '@/lib/auth/claims';
import { listBadges } from '@/lib/data/badges';
import { listLicensesForSchool, upsertLicense } from '@/lib/data/billing';
import { getChallenge, setChallengeStatus, upsertChallenge } from '@/lib/data/challenges';
import { getClass, updateClass } from '@/lib/data/classes';
import { listPublishedCoursesByPathway } from '@/lib/data/courses';
import { getPublishedPathway } from '@/lib/data/pathways';
import { adjustSchoolCounts, createSchool, getSchool } from '@/lib/data/schools';
import { createUserProfile, getUser, setVerifiedEducator } from '@/lib/data/users';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { collections } from '@/lib/firebase/collections';
import { createdNow, serverTimestamp, updatedNow } from '@/lib/firebase/converters';
import { addStudentToClass, assignCourseToClass, createClass } from '@/lib/services/classroom';
import { countedIn } from '@/lib/services/identity';
import type { Challenge } from '@/types/challenge';
import type { SchoolClass } from '@/types/school';
import type { UserProfile } from '@/types/user';
import {
  COMMON_USAGE,
  connect,
  parseScriptArgs,
  runScript,
  ScriptError,
  sessionOf,
  step,
  targetOptions,
  type ScriptTarget,
} from '../lib/admin';
import { ifFound, upsertDocuments } from '../lib/firestore';
import { SEED_CHALLENGES, SEED_COURSES } from './content';
import { CONTENT_RELEASES } from './content/releases';
import { courseOverwriteRefusal, courseWrites, coursesSeededIn } from './course-writes';
import { seedDemoProgress, type DemoProgressSummary } from './demo-progress';
import {
  DEMO_ACCOUNTS,
  DEMO_CLASS,
  DEMO_CLASS_STUDENTS,
  DEMO_JOIN_CODE,
  DEMO_SCHOOL,
  demoAccount,
  demoLicenseInput,
  resolveDemoPassword,
  type DemoAccount,
  type DemoAccountKey,
} from './demo-users';
import { recordSeededReleases, releaseProblems } from './release';
import type { SeedCourse } from './types';
import { validateSeedContent } from './validate';

const USAGE = `Usage: npm run seed -- [options]

Writes the demo content of scripts/seed/content and, with demo users, the demo school, class,
accounts and their progress (ARCHITECTURE.md 11.6). Run "npm run migrate" first. A real
project whose official courses were seeded before is refused: add new content to it with
"npm run content:release" (11.7).

  --with-demo-users      create the demo accounts on a real project too (needs
                         SEED_DEMO_PASSWORD of at least 16 characters); always on for the emulators
  --overwrite-official-courses
                         on a real project seeded before, write the official courses again,
                         replacing every edit made to them in the app
${COMMON_USAGE}`;

/** How many student courses the demo class gets (11.6). */
const CLASS_COURSE_COUNT = 2;

// --- Bookkeeping -------------------------------------------------------------------------------

// meta/seed remembers the auto-ids the repositories gave the demo school, licence, class and
// challenges, so that a second run finds them instead of creating them again, and, in
// coursesSeededAt, that the official courses were written (the guard of coursesSeededIn).
interface SeedState {
  schoolId: string | null;
  licenseId: string | null;
  classId: string | null;
  challenges: Record<string, string>;
}

function seedStateDoc() {
  return collections.meta().doc('seed');
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

async function readState(): Promise<SeedState> {
  const data = (await seedStateDoc().get()).data() ?? {};
  const challenges: Record<string, string> = {};
  const stored: unknown = data.challenges;
  if (typeof stored === 'object' && stored !== null) {
    for (const [seedId, docId] of Object.entries(stored)) {
      if (typeof docId === 'string') challenges[seedId] = docId;
    }
  }
  return {
    schoolId: stringOrNull(data.schoolId),
    licenseId: stringOrNull(data.licenseId),
    classId: stringOrNull(data.classId),
    challenges,
  };
}

async function saveState(patch: Partial<SeedState>): Promise<void> {
  await seedStateDoc().set({ ...patch, updatedAt: serverTimestamp() }, { merge: true });
}

// --- Reference data ----------------------------------------------------------------------------

async function assertReferenceData(courses: readonly SeedCourse[]): Promise<void> {
  const pathwayIds = [...new Set(courses.map((course) => course.course.pathwayId))];
  for (const pathwayId of pathwayIds) {
    if ((await getPublishedPathway(pathwayId)) === null) {
      throw new ScriptError(
        `pathways/${pathwayId} does not exist or is not published: run "npm run migrate" first.`,
      );
    }
  }
  if ((await listBadges(SYSTEM_ACTOR)).length === 0) {
    throw new ScriptError('No badge is defined: run "npm run migrate" first.');
  }
}

// --- Accounts ----------------------------------------------------------------------------------

type Profiles = Partial<Record<DemoAccountKey, UserProfile>>;

function authErrorCode(error: unknown): string | null {
  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
    ? error.code
    : null;
}

/** The Auth account, created or brought up to date; the uid the address already has wins. */
async function ensureAuthUser(account: DemoAccount, password: string): Promise<string> {
  const auth = getAdminAuth();
  let existingUid: string | null = null;
  try {
    existingUid = (await auth.getUserByEmail(account.email)).uid;
  } catch (error) {
    if (authErrorCode(error) !== 'auth/user-not-found') throw error;
  }
  const fields = { displayName: account.displayName, password, emailVerified: true };
  if (existingUid !== null) {
    await auth.updateUser(existingUid, { ...fields, disabled: false });
    return existingUid;
  }
  const created = await auth.createUser({ uid: account.uid, email: account.email, ...fields });
  return created.uid;
}

/** The profile, created through the repository with its school counter and claims when new. */
async function ensureProfile(
  uid: string,
  account: DemoAccount,
  schoolId: string | null,
  provisionedByUid: string | null,
): Promise<UserProfile> {
  const existing = await ifFound(getUser(SYSTEM_ACTOR, uid));
  if (existing !== null) {
    if (existing.role !== account.role) {
      throw new ScriptError(
        `users/${uid} (${account.email}) exists with role ${existing.role}; the seed does not change roles.`,
      );
    }
    return existing;
  }
  const profile = await createUserProfile(SYSTEM_ACTOR, uid, {
    role: account.role,
    schoolId: account.inSchool ? schoolId : null,
    displayName: account.displayName,
    username: account.username,
    email: account.username === null ? account.email : null,
    ageBand: account.ageBand,
    locale: account.locale,
    consentBasis: account.consentBasis,
    provisionedByUid,
    avatarId: account.avatarId,
  });
  const counted = countedIn(profile);
  if (counted !== null) {
    await adjustSchoolCounts(SYSTEM_ACTOR, counted.schoolId, { [counted.counter]: 1 });
  }
  await syncClaims(uid);
  console.log(`   created ${account.role} ${account.username ?? account.email}`);
  return profile;
}

async function ensureAccount(
  key: DemoAccountKey,
  password: string,
  schoolId: string | null,
  provisionedByUid: string | null,
): Promise<UserProfile> {
  const account = demoAccount(key);
  const uid = await ensureAuthUser(account, password);
  return ensureProfile(uid, account, schoolId, provisionedByUid);
}

async function ensureSchool(adminActor: Actor, state: SeedState): Promise<string> {
  const existing =
    state.schoolId === null ? null : await ifFound(getSchool(SYSTEM_ACTOR, state.schoolId));
  if (existing !== null) return existing.id;
  const school = await createSchool(adminActor, DEMO_SCHOOL);
  await saveState({ schoolId: school.id });
  console.log(`   created school "${school.name}" (${school.id})`);
  return school.id;
}

async function ensureLicense(adminActor: Actor, schoolId: string, state: SeedState) {
  const known = (await listLicensesForSchool(SYSTEM_ACTOR, schoolId)).some(
    (license) => license.id === state.licenseId,
  );
  const license = await upsertLicense(
    adminActor,
    known ? state.licenseId : null,
    demoLicenseInput(schoolId, new Date()),
  );
  if (!known) await saveState({ licenseId: license.id });
  console.log(`   licence "${license.name}" valid until ${license.endsAt.slice(0, 10)}`);
  return license;
}

/**
 * The demo school, its licence and the seven accounts of 11.6 (six on a real project, which
 * never gets the demo platform admin). Platform-admin work is done as the demo admin when
 * there is one, else as the system.
 */
async function ensureDemoWorld(
  target: ScriptTarget,
  password: string,
  state: SeedState,
): Promise<{ profiles: Profiles; schoolId: string }> {
  const profiles: Profiles = {};
  if (target.mode === 'emulator')
    profiles.admin = await ensureAccount('admin', password, null, null);
  const adminActor: Actor = profiles.admin === undefined ? SYSTEM_ACTOR : sessionOf(profiles.admin);
  const adminUid = profiles.admin?.id ?? null;

  const schoolId = await ensureSchool(adminActor, state);
  profiles.schoolAdmin = await ensureAccount('schoolAdmin', password, schoolId, adminUid);
  profiles.teacher = await ensureAccount('teacher', password, schoolId, adminUid);
  if (!profiles.teacher.verifiedEducator) {
    await setVerifiedEducator(adminActor, profiles.teacher.id, true);
  }
  await ensureLicense(adminActor, schoolId, state);

  profiles.student = await ensureAccount('student', password, null, null);
  for (const key of DEMO_CLASS_STUDENTS) {
    profiles[key] = await ensureAccount(key, password, schoolId, profiles.teacher.id);
  }
  return { profiles, schoolId };
}

// --- Courses -----------------------------------------------------------------------------------

/** Documents of the course that the content file no longer names are reported, never deleted. */
async function warnAboutStaleDocuments(seed: SeedCourse): Promise<void> {
  const stale: string[] = [];
  const check = async (path: string, refs: Promise<{ id: string }[]>, known: readonly string[]) => {
    for (const ref of await refs) if (!known.includes(ref.id)) stale.push(`${path}/${ref.id}`);
  };
  const lessons = seed.modules.flatMap((module) => module.lessons);
  await check(
    'modules',
    collections.modules(seed.id).listDocuments(),
    seed.modules.map((module) => module.id),
  );
  await check(
    'lessons',
    collections.lessons(seed.id).listDocuments(),
    lessons.map((lesson) => lesson.id),
  );
  for (const lesson of lessons) {
    await check(
      `lessons/${lesson.id}/blocks`,
      collections.blocks(seed.id, lesson.id).listDocuments(),
      lesson.blocks.map((block) => block.id),
    );
  }
  await check(
    'quizzes',
    collections.quizzes(seed.id).listDocuments(),
    seed.quizzes.map((quiz) => quiz.id),
  );
  await check(
    'projects',
    collections.projects(seed.id).listDocuments(),
    seed.projects.map((project) => project.id),
  );
  if (stale.length > 0) {
    console.warn(
      `   WARNING: courses/${seed.id} holds documents the content no longer names (left in place): ${stale.join(', ')}`,
    );
  }
}

async function writeCourses(courses: readonly SeedCourse[], ownerUid: string): Promise<void> {
  for (const seed of courses) {
    const { created, updated } = await upsertDocuments(courseWrites(seed, ownerUid));
    console.log(`   courses/${seed.id}: ${created} documents created, ${updated} updated`);
    await warnAboutStaleDocuments(seed);
  }
  // What setCourseStatus maintains for a course published through the repository (3.6).
  for (const pathwayId of new Set(courses.map((course) => course.course.pathwayId))) {
    const publishedCourseCount = (await listPublishedCoursesByPathway(pathwayId)).length;
    await collections
      .pathways()
      .doc(pathwayId)
      .update({ publishedCourseCount, ...updatedNow() });
  }
}

// --- Class -------------------------------------------------------------------------------------

/**
 * Gives the class the fixed demo code (11.6), exactly as data/classes.regenerateJoinCode moves
 * a class to a new code: the joinCodes document of the new code, the old one deleted, the
 * class updated, in one transaction. No repository function sets a chosen code.
 */
async function ensureJoinCode(cls: SchoolClass, code: string): Promise<void> {
  if (cls.joinCode === code) return;
  const classRef = collections.classes().doc(cls.id);
  const codeRef = collections.joinCodes().doc(code);
  await getAdminDb().runTransaction(async (tx) => {
    const [taken, current] = await tx.getAll(codeRef, classRef);
    const holder: unknown = taken.get('classId');
    if (taken.exists && holder !== cls.id) {
      throw new ScriptError(`Join code ${code} belongs to classes/${String(holder)}.`);
    }
    const previous: unknown = current.get('joinCode');
    if (!taken.exists) {
      tx.create(codeRef, { classId: cls.id, schoolId: cls.schoolId, ...createdNow() });
    }
    if (typeof previous === 'string' && previous !== code) {
      tx.delete(collections.joinCodes().doc(previous));
    }
    tx.update(classRef, { joinCode: code, ...updatedNow() });
  });
  console.log(`   join code set to ${code}`);
}

async function ensureClass(
  target: ScriptTarget,
  profiles: Profiles,
  state: SeedState,
): Promise<SchoolClass> {
  const teacher = profiles.teacher;
  if (teacher === undefined) throw new ScriptError('The demo teacher is missing.');
  let teacherSession = sessionOf(await getUser(SYSTEM_ACTOR, teacher.id));

  let cls = state.classId === null ? null : await ifFound(getClass(SYSTEM_ACTOR, state.classId));
  if (cls === null) {
    cls = await createClass(teacherSession, DEMO_CLASS);
    await saveState({ classId: cls.id });
    console.log(`   created class "${cls.name}" (${cls.id})`);
  }
  if (target.mode === 'emulator') {
    await ensureJoinCode(cls, DEMO_JOIN_CODE);
    // Enabling the code starts its 24 hours again, also when it was already enabled.
    cls = await updateClass(teacherSession, cls.id, { joinCodeEnabled: true });
  }

  for (const key of DEMO_CLASS_STUDENTS) {
    const student = profiles[key];
    if (student === undefined) throw new ScriptError(`The demo student ${key} is missing.`);
    await addStudentToClass(SYSTEM_ACTOR, cls.id, student, teacher.id);
  }
  teacherSession = sessionOf(await getUser(SYSTEM_ACTOR, teacher.id));

  const assigned = SEED_COURSES.filter((course) => course.course.audience === 'student').slice(
    0,
    CLASS_COURSE_COUNT,
  );
  for (const course of assigned) {
    await assignCourseToClass(teacherSession, cls.id, course.id, null);
  }
  cls = await getClass(SYSTEM_ACTOR, cls.id);
  console.log(
    `   class "${cls.name}": ${cls.studentCount} students, ${cls.assignedCourseIds.length} courses assigned`,
  );
  return cls;
}

// --- Challenges --------------------------------------------------------------------------------

async function ensureChallenges(state: SeedState): Promise<Challenge[]> {
  const challenges: Challenge[] = [];
  for (const seed of SEED_CHALLENGES) {
    const knownId = Object.hasOwn(state.challenges, seed.id) ? state.challenges[seed.id]! : null;
    const known = knownId === null ? null : await ifFound(getChallenge(SYSTEM_ACTOR, knownId));
    const challenge = await upsertChallenge(SYSTEM_ACTOR, known?.id ?? null, seed.input);
    if (challenge.status !== 'published') {
      await setChallengeStatus(SYSTEM_ACTOR, challenge.id, 'published');
    }
    if (known === null) {
      state.challenges[seed.id] = challenge.id;
      await saveState({ challenges: { ...state.challenges } });
    }
    challenges.push(await getChallenge(SYSTEM_ACTOR, challenge.id));
    console.log(`   challenge ${seed.id} -> challenges/${challenge.id}`);
  }
  return challenges;
}

// --- Summary -----------------------------------------------------------------------------------

function printSummary(
  target: ScriptTarget,
  profiles: Profiles | null,
  passwordSource: string | null,
  cls: SchoolClass | null,
  progress: DemoProgressSummary | null,
): void {
  step('Summary');
  console.log(`   courses: ${SEED_COURSES.map((course) => course.id).join(', ')}`);
  if (profiles === null) {
    console.log('   demo users: not created (pass --with-demo-users on a real project)');
    return;
  }
  console.log(`   password of every demo account: from ${passwordSource}`);
  for (const account of DEMO_ACCOUNTS) {
    const profile = profiles[account.key];
    if (profile === undefined) continue;
    const identifier = account.username ?? account.email;
    console.log(`   ${account.role.padEnd(14)} ${identifier.padEnd(32)} uid ${profile.id}`);
  }
  if (cls !== null) {
    const code =
      target.mode === 'emulator'
        ? `${cls.joinCode} (enabled until ${cls.joinCodeExpiresAt ?? 'never'})`
        : 'random, disabled';
    console.log(`   class "${cls.name}" (${cls.id}): join code ${code}`);
  }
  if (progress?.certificate) {
    console.log(
      `   certificate ${progress.certificate.id}: code ${progress.certificate.verificationCode}`,
    );
  }
  if (progress?.awaitingReview) {
    console.log(`   awaiting review: submissions/${progress.awaitingReview.id}`);
  }
}

// --- Main --------------------------------------------------------------------------------------

async function main(): Promise<void> {
  const { values } = parseScriptArgs(
    {
      'with-demo-users': { type: 'boolean', default: false },
      'overwrite-official-courses': { type: 'boolean', default: false },
    },
    USAGE,
  );
  const target = await connect(targetOptions(values));
  const withDemoUsers = target.mode === 'emulator' || values['with-demo-users'] === true;

  step('Content');
  // The releases too: the seed records them once the courses are written (recordSeededReleases).
  const problems = [
    ...validateSeedContent(SEED_COURSES, SEED_CHALLENGES),
    ...releaseProblems(CONTENT_RELEASES, SEED_COURSES),
  ];
  if (problems.length > 0) {
    throw new ScriptError(`The seed content is not valid:\n  ${problems.join('\n  ')}`);
  }
  console.log(`   ${SEED_COURSES.length} course(s), ${SEED_CHALLENGES.length} challenge(s) valid`);
  await assertReferenceData(SEED_COURSES);
  // Before anything is written: a refused run leaves the project exactly as it was.
  const refusal = courseOverwriteRefusal(
    target.mode,
    coursesSeededIn((await seedStateDoc().get()).data()),
    values['overwrite-official-courses'] === true,
  );
  if (refusal !== null) throw new ScriptError(refusal);

  let password: { password: string; source: string } | null = null;
  if (withDemoUsers) {
    try {
      password = resolveDemoPassword(target.mode, process.env.SEED_DEMO_PASSWORD);
    } catch (error) {
      throw new ScriptError(error instanceof Error ? error.message : String(error));
    }
  }

  const state = await readState();
  let profiles: Profiles | null = null;
  if (password !== null) {
    step('Demo school and accounts');
    profiles = (await ensureDemoWorld(target, password.password, state)).profiles;
  }

  step('Courses');
  await writeCourses(SEED_COURSES, profiles?.admin?.id ?? 'system');
  await recordSeededReleases(CONTENT_RELEASES, SEED_COURSES);
  // Only now: a run that failed before this line can be run again (coursesSeededIn).
  await seedStateDoc().set(
    { coursesSeededAt: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true },
  );

  let cls: SchoolClass | null = null;
  if (profiles !== null) {
    step('Demo class');
    cls = await ensureClass(target, profiles, state);
  }

  step('Challenges');
  await ensureChallenges(state);

  let progress: DemoProgressSummary | null = null;
  const studentCourse = SEED_COURSES.find((course) => course.course.audience === 'student');
  if (profiles !== null && studentCourse !== undefined) {
    step('Demo progress');
    const uid = (key: DemoAccountKey) => {
      const profile = profiles?.[key];
      if (profile === undefined) throw new ScriptError(`The demo account ${key} is missing.`);
      return profile.id;
    };
    progress = await seedDemoProgress(studentCourse, {
      lea: uid('lea'),
      omar: uid('omar'),
      maya: uid('maya'),
      student: uid('student'),
      teacher: uid('teacher'),
    });
  }

  printSummary(target, profiles, password?.source ?? null, cls, progress);
}

runScript(main);
