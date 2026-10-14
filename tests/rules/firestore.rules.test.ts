import {
  assertFails,
  assertSucceeds,
  type RulesTestContext,
  type RulesTestEnvironment,
  type TokenOptions,
} from '@firebase/rules-unit-testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type {
  Certificate,
  Challenge,
  Course,
  Enrollment,
  FileRecord,
  LessonProgress,
  License,
  Pathway,
  QuizAttempt,
  SchoolClass,
  Submission,
  Subscription,
} from '@/types';
import {
  ACTOR_NAMES,
  ACTORS,
  contextFor,
  NO_PROFILE_UID,
  PROFILES,
  STALE_CLAIMS,
  startRulesEnvironment,
  type ActorName,
} from './helpers';

type Firestore = ReturnType<RulesTestContext['firestore']>;

// ---------------------------------------------------------------------------------------------
// Fixture: every collection of ARCHITECTURE.md 3.3, with the callers that section 5.1 lets read
// each document. Everyone else among the eight actors must be denied.
// ---------------------------------------------------------------------------------------------

const EVERYONE: readonly ActorName[] = ACTOR_NAMES;
const SIGNED_IN: readonly ActorName[] = ACTOR_NAMES.filter((actor) => actor !== 'anonymous');
const STAFF: readonly ActorName[] = SIGNED_IN.filter(
  (actor) => actor !== 'student' && actor !== 'otherStudent',
);
const SCHOOL_A: readonly ActorName[] = SIGNED_IN.filter((actor) => actor !== 'otherSchoolAdmin');
const NOBODY: readonly ActorName[] = [];

interface Fixture {
  data: Record<string, unknown>;
  readers: readonly ActorName[];
}

const FILE_ID = '3f2b6c1e-8a4d-4e0b-9c57-1d2a7f6b9e10';

type CourseFields = Pick<
  Course,
  'ownerUid' | 'schoolId' | 'isOfficial' | 'status' | 'visibility' | 'audience' | 'accessTier'
>;

const official = (
  fields: Pick<CourseFields, 'status' | 'audience' | 'accessTier'>,
): CourseFields => ({
  ownerUid: 'platform',
  schoolId: null,
  isOfficial: true,
  visibility: 'public',
  ...fields,
});

/** A course card, its content documents and the answer key of its quiz. */
function course(
  courseId: string,
  data: CourseFields,
  readers: { card: readonly ActorName[]; content: readonly ActorName[] },
): Record<string, Fixture> {
  const root = `courses/${courseId}`;
  const content = (fields: Record<string, unknown>): Fixture => ({
    data: fields,
    readers: readers.content,
  });
  return {
    [root]: { data, readers: readers.card },
    [`${root}/modules/m1`]: content({ order: 1, lessonCount: 1 }),
    [`${root}/lessons/m1-l1`]: content({ moduleId: 'm1', order: 1, quizIds: ['quiz-m1'] }),
    [`${root}/lessons/m1-l1/blocks/b1`]: content({ type: 'rich_text', stage: 'learn', order: 1 }),
    [`${root}/quizzes/quiz-m1`]: content({ lessonId: 'm1-l1', passingScorePercent: 70 }),
    [`${root}/quizzes/quiz-m1/private/key`]: {
      data: { answers: { q1: { correctOptionIds: ['true'] } }, explanations: {} },
      readers: NOBODY,
    },
    [`${root}/projects/project-1`]: content({ lessonId: 'm1-l1', kind: 'project' }),
  };
}

const FIXTURES: Record<string, Fixture> = {
  // --- Identity and organisation ---
  'users/student-a': {
    data: PROFILES['student-a'],
    readers: ['student', 'schoolAdmin', 'platformAdmin'],
  },
  'users/student-b': {
    data: PROFILES['student-b'],
    readers: ['otherStudent', 'schoolAdmin', 'platformAdmin'],
  },
  'users/teacher-a': {
    data: PROFILES['teacher-a'],
    readers: ['classTeacher', 'schoolAdmin', 'platformAdmin'],
  },
  // No school, so no school admin's scope reaches it.
  'users/solo': { data: PROFILES.solo, readers: ['platformAdmin'] },
  'users/student-a/badges/first-steps': {
    data: { badgeId: 'first-steps', awardedBy: 'system', note: null },
    readers: ['student', 'platformAdmin'],
  },
  'users/student-a/xpLedger/lesson_official-free_m1-l1': {
    data: { amount: 50, reason: 'lesson', refId: 'official-free_m1-l1', courseId: 'official-free' },
    readers: ['student', 'platformAdmin'],
  },
  'schools/school-a': {
    data: {
      name: 'Lycée des Cèdres',
      status: 'active',
      counts: { teachers: 2, students: 3, classes: 2 },
    },
    readers: SCHOOL_A,
  },
  // The class document carries the join code: its own students cannot read it.
  'classes/class-a': {
    data: {
      schoolId: 'school-a',
      name: '6ème A',
      ownerUid: 'teacher-a',
      teacherUids: ['teacher-a', 'disabled-teacher', 'former-teacher'],
      joinCode: 'ABCDEFGH',
      archived: false,
    } satisfies Pick<
      SchoolClass,
      'schoolId' | 'name' | 'ownerUid' | 'teacherUids' | 'joinCode' | 'archived'
    >,
    readers: ['classTeacher', 'schoolAdmin', 'platformAdmin'],
  },
  'classes/class-a/members/student-a': {
    data: { displayName: 'Maya K.', username: 'maya.k', addedByUid: 'teacher-a' },
    readers: ['student', 'classTeacher', 'schoolAdmin', 'platformAdmin'],
  },
  'classes/class-a/members/disabled-student': {
    data: { displayName: 'Jad N.', username: 'jad.n', addedByUid: 'teacher-a' },
    readers: ['classTeacher', 'schoolAdmin', 'platformAdmin'],
  },
  'classes/class-a/assignments/official-premium': {
    data: { courseId: 'official-premium', assignedByUid: 'teacher-a', dueAt: null },
    readers: ['student', 'classTeacher', 'schoolAdmin', 'platformAdmin'],
  },
  'joinCodes/ABCDEFGH': { data: { classId: 'class-a', schoolId: 'school-a' }, readers: NOBODY },

  // --- Content ---
  'pathways/ai-explorer': {
    data: { status: 'published', order: 1 } satisfies Pick<Pathway, 'status' | 'order'>,
    readers: EVERYONE,
  },
  'pathways/ai-innovator': {
    data: { status: 'draft', order: 5 } satisfies Pick<Pathway, 'status' | 'order'>,
    readers: ['platformAdmin'],
  },
  ...course(
    'official-free',
    official({ status: 'published', audience: 'student', accessTier: 'free' }),
    { card: EVERYONE, content: SIGNED_IN },
  ),
  // Premium content needs an enrollment: only student-a has one.
  ...course(
    'official-premium',
    official({ status: 'published', audience: 'student', accessTier: 'premium' }),
    { card: EVERYONE, content: ['student', 'platformAdmin'] },
  ),
  ...course(
    'official-draft',
    official({ status: 'draft', audience: 'student', accessTier: 'free' }),
    {
      card: ['platformAdmin'],
      content: ['platformAdmin'],
    },
  ),
  // Teacher Academy: the card is public, the content is not for students.
  ...course(
    'teacher-academy',
    official({ status: 'published', audience: 'teacher', accessTier: 'free' }),
    { card: EVERYONE, content: STAFF },
  ),
  // Teacher-made, shared with the school. student-a is enrolled. A colleague's access comes
  // from the server only, and the school admin sees the card but not the content.
  ...course(
    'class-course',
    {
      ownerUid: 'teacher-a',
      schoolId: 'school-a',
      isOfficial: false,
      status: 'published',
      visibility: 'school',
      audience: 'student',
      accessTier: 'free',
    },
    {
      card: ['student', 'classTeacher', 'schoolAdmin', 'platformAdmin'],
      content: ['student', 'classTeacher', 'platformAdmin'],
    },
  ),
  // The author's unpublished course: the owner branch alone opens the content, and nobody
  // but the owner, the school admin (card only) and the platform sees that it exists.
  ...course(
    'teacher-draft',
    {
      ownerUid: 'teacher-a',
      schoolId: 'school-a',
      isOfficial: false,
      status: 'draft',
      visibility: 'private',
      audience: 'student',
      accessTier: 'free',
    },
    {
      card: ['classTeacher', 'schoolAdmin', 'platformAdmin'],
      content: ['classTeacher', 'platformAdmin'],
    },
  ),

  // --- Learning records ---
  'enrollments/student-a_official-premium': {
    data: {
      userUid: 'student-a',
      courseId: 'official-premium',
      schoolId: 'school-a',
      classId: 'class-a',
      status: 'active',
    } satisfies Pick<Enrollment, 'userUid' | 'courseId' | 'schoolId' | 'classId' | 'status'>,
    readers: ['student', 'schoolAdmin', 'platformAdmin'],
  },
  // Reflections: not for the school admin.
  'enrollments/student-a_official-premium/lessonProgress/m1-l1': {
    data: {
      userUid: 'student-a',
      courseId: 'official-premium',
      status: 'in_progress',
    } satisfies Pick<LessonProgress, 'userUid' | 'courseId' | 'status'>,
    readers: ['student', 'platformAdmin'],
  },
  'enrollments/student-a_class-course': {
    data: {
      userUid: 'student-a',
      courseId: 'class-course',
      schoolId: 'school-a',
      classId: 'class-a',
      status: 'active',
    } satisfies Pick<Enrollment, 'userUid' | 'courseId' | 'schoolId' | 'classId' | 'status'>,
    readers: ['student', 'schoolAdmin', 'platformAdmin'],
  },
  'enrollments/disabled-student_official-premium': {
    data: {
      userUid: 'disabled-student',
      courseId: 'official-premium',
      schoolId: 'school-a',
      classId: 'class-a',
      status: 'active',
    } satisfies Pick<Enrollment, 'userUid' | 'courseId' | 'schoolId' | 'classId' | 'status'>,
    readers: ['schoolAdmin', 'platformAdmin'],
  },
  // A record without a school is in no school admin's scope.
  'enrollments/solo_official-free': {
    data: {
      userUid: 'solo',
      courseId: 'official-free',
      schoolId: null,
      classId: null,
      status: 'active',
    } satisfies Pick<Enrollment, 'userUid' | 'courseId' | 'schoolId' | 'classId' | 'status'>,
    readers: ['platformAdmin'],
  },
  // `results` is the answer key in disguise: not even the owner reads an attempt directly.
  'quizAttempts/student-a_official-premium_quiz-m1_1': {
    data: {
      userUid: 'student-a',
      courseId: 'official-premium',
      quizId: 'quiz-m1',
      schoolId: 'school-a',
      classId: 'class-a',
      results: { q1: { correct: false, pointsAwarded: 0 } },
    } satisfies Pick<
      QuizAttempt,
      'userUid' | 'courseId' | 'quizId' | 'schoolId' | 'classId' | 'results'
    >,
    readers: ['schoolAdmin', 'platformAdmin'],
  },
  'submissions/student-a_p_official-premium_project-1_1': {
    data: {
      studentUid: 'student-a',
      schoolId: 'school-a',
      classId: 'class-a',
      context: 'project',
      status: 'submitted',
      finalScore: null,
    } satisfies Pick<
      Submission,
      'studentUid' | 'schoolId' | 'classId' | 'context' | 'status' | 'finalScore'
    >,
    readers: ['student', 'schoolAdmin', 'platformAdmin'],
  },
  // A challenge entry: no class reviews it, so the owner, the school and the platform read it.
  'submissions/student-a_c_global-open_1': {
    data: {
      studentUid: 'student-a',
      schoolId: 'school-a',
      classId: null,
      context: 'challenge',
      status: 'submitted',
      finalScore: null,
    } satisfies Pick<
      Submission,
      'studentUid' | 'schoolId' | 'classId' | 'context' | 'status' | 'finalScore'
    >,
    readers: ['student', 'schoolAdmin', 'platformAdmin'],
  },
  // An independent learner's work is in no school admin's scope.
  'submissions/solo_c_global-open_1': {
    data: {
      studentUid: 'solo',
      schoolId: null,
      classId: null,
      context: 'challenge',
      status: 'submitted',
      finalScore: null,
    } satisfies Pick<
      Submission,
      'studentUid' | 'schoolId' | 'classId' | 'context' | 'status' | 'finalScore'
    >,
    readers: ['platformAdmin'],
  },
  'submissions/student-a_p_official-premium_project-1_1/reviews/review-1': {
    data: { reviewerUid: 'teacher-a', decision: 'return', feedback: 'Add your sources.' },
    readers: ['platformAdmin'],
  },
  'submissions/student-a_p_official-premium_project-1_1/aiReviews/ai-review-1': {
    data: { status: 'ready', overallSuggestedScore: 62 },
    readers: ['platformAdmin'],
  },
  [`files/${FILE_ID}`]: {
    data: {
      ownerUid: 'student-a',
      schoolId: 'school-a',
      purpose: 'submission',
      storagePath: `user-uploads/student-a/image/${FILE_ID}/poster.png`,
    } satisfies Pick<FileRecord, 'ownerUid' | 'schoolId' | 'purpose' | 'storagePath'>,
    readers: ['student', 'platformAdmin'],
  },

  // --- Gamification, challenges, billing, hardware ---
  'badges/first-steps': { data: { tier: 'bronze', isActive: true }, readers: SIGNED_IN },
  'hardwarePlatforms/two-wheel-rover': {
    data: { kind: 'robot', capabilities: ['drive', 'distance'], isActive: true },
    readers: SIGNED_IN,
  },
  'certificates/student-a_official-premium': {
    data: {
      userUid: 'student-a',
      courseId: 'official-premium',
      schoolId: 'school-a',
      status: 'issued',
    } satisfies Pick<Certificate, 'userUid' | 'courseId' | 'schoolId' | 'status'>,
    readers: ['student', 'schoolAdmin', 'platformAdmin'],
  },
  'challenges/global-open': {
    data: { status: 'published', scope: 'global', schoolId: null } satisfies Pick<
      Challenge,
      'status' | 'scope' | 'schoolId'
    >,
    readers: SIGNED_IN,
  },
  'challenges/global-draft': {
    data: { status: 'draft', scope: 'global', schoolId: null } satisfies Pick<
      Challenge,
      'status' | 'scope' | 'schoolId'
    >,
    readers: ['platformAdmin'],
  },
  'challenges/school-a-fair': {
    data: { status: 'published', scope: 'school', schoolId: 'school-a' } satisfies Pick<
      Challenge,
      'status' | 'scope' | 'schoolId'
    >,
    readers: SCHOOL_A,
  },
  // Not a shape the server writes. A missing school must not match callers without a school.
  'challenges/school-scope-without-school': {
    data: { status: 'published', scope: 'school', schoolId: null } satisfies Pick<
      Challenge,
      'status' | 'scope' | 'schoolId'
    >,
    readers: ['platformAdmin'],
  },
  'subscriptions/sub-student': {
    data: { ownerType: 'user', ownerId: 'student-a', plan: 'individual_monthly' } satisfies Pick<
      Subscription,
      'ownerType' | 'ownerId' | 'plan'
    >,
    readers: ['student', 'platformAdmin'],
  },
  'subscriptions/sub-school': {
    data: { ownerType: 'school', ownerId: 'school-a', plan: 'school_annual' } satisfies Pick<
      Subscription,
      'ownerType' | 'ownerId' | 'plan'
    >,
    readers: ['schoolAdmin', 'platformAdmin'],
  },
  'licenses/license-a': {
    data: { schoolId: 'school-a', seatsTotal: 120, status: 'active' } satisfies Pick<
      License,
      'schoolId' | 'seatsTotal' | 'status'
    >,
    readers: ['schoolAdmin', 'platformAdmin'],
  },

  // --- Server-only ---
  'aiUsage/student-a_20261002': {
    data: { scope: 'user', uid: 'student-a', tutorMessages: 4 },
    readers: NOBODY,
  },
  'aiUsage/school_school-a_20261002': {
    data: { scope: 'school', schoolId: 'school-a', requests: 12 },
    readers: NOBODY,
  },
  'aiUsage/global_20261002': { data: { scope: 'global', requests: 40 }, readers: NOBODY },
  'uploadUsage/student-a_20261002': {
    data: { uid: 'student-a', fileCount: 1, bytes: 2048 },
    readers: NOBODY,
  },
  'rateLimits/join_class_student-a_2026100208': {
    data: { scope: 'join_class', count: 1 },
    readers: NOBODY,
  },
  'auditLogs/log-1': {
    data: { actorUid: 'platform', action: 'license.upserted', schoolId: 'school-a' },
    readers: NOBODY,
  },
  'meta/migrations': { data: { applied: { '0001_initial': true } }, readers: NOBODY },

  // --- Outside the collection map ---
  'drafts/note-1': { data: { ownerUid: 'student-a' }, readers: NOBODY },
  'users/student-a/notes/note-1': { data: { text: 'mine' }, readers: NOBODY },
  'courses/official-free/quizzes/quiz-m1/hints/h1': { data: { text: 'hint' }, readers: NOBODY },
};

// Profiles that only the "profile decides" tests read; seeded, but outside the eight-actor table.
const OTHER_PROFILES = [
  'teacher-b',
  'admin-a',
  'admin-b',
  'platform',
  'disabled-student',
  'disabled-teacher',
  'disabled-admin',
  'former-teacher',
  'orphan-admin',
  'demoted',
] as const;

const SEED: Record<string, Record<string, unknown>> = {
  ...Object.fromEntries(OTHER_PROFILES.map((uid) => [`users/${uid}`, PROFILES[uid]])),
  ...Object.fromEntries(Object.entries(FIXTURES).map(([path, { data }]) => [path, data])),
};

const CLIENT_WRITE = { writtenByClient: true };

// ---------------------------------------------------------------------------------------------

let env: RulesTestEnvironment;
const db = {} as Record<ActorName, Firestore>;

function firestoreFor(uid: string, claims?: TokenOptions): Firestore {
  return env.authenticatedContext(uid, claims).firestore();
}

beforeAll(async () => {
  env = await startRulesEnvironment();
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const admin = context.firestore();
    const batch = admin.batch();
    for (const [path, data] of Object.entries(SEED)) batch.set(admin.doc(path), data);
    await batch.commit();
  });
  for (const actor of ACTOR_NAMES) db[actor] = contextFor(env, ACTORS[actor]).firestore();
});

afterAll(async () => {
  await env?.cleanup();
});

async function expectRead(firestore: Firestore, path: string, allowed: boolean): Promise<void> {
  if (!allowed) {
    await assertFails(firestore.doc(path).get());
    return;
  }
  const snapshot = await assertSucceeds(firestore.doc(path).get());
  expect(snapshot.exists).toBe(true);
}

describe('reads, per document and caller', () => {
  for (const [path, { readers }] of Object.entries(FIXTURES)) {
    describe(path, () => {
      for (const actor of ACTOR_NAMES) {
        const allowed = readers.includes(actor);
        it(`${actor}: ${allowed ? 'allowed' : 'denied'}`, async () => {
          await expectRead(db[actor], path, allowed);
        });
      }
    });
  }
});

describe('queries', () => {
  it('lets anyone list the published catalog, and nobody but the platform list drafts', async () => {
    const pathways = db.anonymous.collection('pathways');
    await assertSucceeds(pathways.where('status', '==', 'published').get());
    await assertFails(pathways.get());

    const courses = db.anonymous.collection('courses');
    await assertSucceeds(
      courses.where('status', '==', 'published').where('isOfficial', '==', true).get(),
    );
    await assertFails(courses.where('status', '==', 'published').get());
    await assertFails(db.student.collection('courses').get());
    await assertSucceeds(db.platformAdmin.collection('courses').get());
  });

  it('lets a learner list their own records only', async () => {
    for (const [collection, field] of [
      ['enrollments', 'userUid'],
      ['submissions', 'studentUid'],
      ['certificates', 'userUid'],
    ] as const) {
      const records = db.student.collection(collection);
      await assertSucceeds(records.where(field, '==', 'student-a').get());
      await assertFails(records.where(field, '==', 'student-b').get());
      await assertFails(records.get());
    }
    const entries = db.student.collection('submissions').where('studentUid', '==', 'student-a');
    await assertSucceeds(entries.where('context', '==', 'challenge').get());
    await assertSucceeds(
      entries.where('challengeId', '==', 'global-open').orderBy('attemptNumber', 'desc').get(),
    );
    await assertSucceeds(db.student.collection('users/student-a/badges').get());
    await assertFails(db.otherStudent.collection('users/student-a/badges').get());
    await assertFails(
      db.student.collection('quizAttempts').where('userUid', '==', 'student-a').get(),
    );
  });

  it('lets a teacher list the classes they teach and the roster of each', async () => {
    const taughtBy = (firestore: Firestore, uid: string) =>
      firestore.collection('classes').where('teacherUids', 'array-contains', uid).get();
    await assertSucceeds(taughtBy(db.classTeacher, 'teacher-a'));
    await assertFails(taughtBy(db.otherTeacher, 'teacher-a'));
    await assertFails(taughtBy(db.student, 'teacher-a'));
    await assertFails(
      db.classTeacher.collection('classes').where('schoolId', '==', 'school-a').get(),
    );

    await assertSucceeds(db.classTeacher.collection('classes/class-a/members').get());
    await assertFails(db.otherTeacher.collection('classes/class-a/members').get());
    await assertFails(db.student.collection('classes/class-a/members').get());
    await assertSucceeds(db.student.collection('classes/class-a/assignments').get());
    await assertFails(db.otherStudent.collection('classes/class-a/assignments').get());
  });

  it('keeps a school admin inside their school', async () => {
    for (const [collection, field] of [
      ['users', 'schoolId'],
      ['classes', 'schoolId'],
      ['enrollments', 'schoolId'],
      ['quizAttempts', 'schoolId'],
      ['submissions', 'schoolId'],
      ['certificates', 'schoolId'],
      ['licenses', 'schoolId'],
    ] as const) {
      const inSchoolA = (firestore: Firestore) =>
        firestore.collection(collection).where(field, '==', 'school-a').get();
      await assertSucceeds(inSchoolA(db.schoolAdmin));
      await assertFails(inSchoolA(db.otherSchoolAdmin));
      await assertFails(db.schoolAdmin.collection(collection).get());
    }
  });

  it('lists published challenges that are global or of the caller’s school', async () => {
    const published = (firestore: Firestore) =>
      firestore.collection('challenges').where('status', '==', 'published');
    await assertSucceeds(published(db.student).where('scope', '==', 'global').get());
    await assertSucceeds(published(db.student).where('schoolId', '==', 'school-a').get());
    await assertFails(published(db.otherSchoolAdmin).where('schoolId', '==', 'school-a').get());
    await assertFails(published(db.student).get());
    await assertFails(published(db.anonymous).where('scope', '==', 'global').get());
  });

  it('lists course content for an enrolled learner, never the answer key', async () => {
    const blocks = 'courses/official-premium/lessons/m1-l1/blocks';
    await assertSucceeds(db.student.collection(blocks).get());
    await assertFails(db.otherStudent.collection(blocks).get());
    await assertSucceeds(db.student.collection('courses/official-premium/quizzes').get());

    const keys = 'courses/official-premium/quizzes/quiz-m1/private';
    await assertFails(db.student.collection(keys).get());
    await assertFails(
      db.classTeacher.collection('courses/class-course/quizzes/quiz-m1/private').get(),
    );
    await assertFails(db.platformAdmin.collection(keys).get());
  });

  it('denies collection-group queries, which would bypass the parent checks', async () => {
    for (const group of ['blocks', 'private', 'members', 'lessonProgress', 'badges']) {
      await assertFails(db.platformAdmin.collectionGroup(group).get());
    }
  });
});

describe('the profile document decides, not the token', () => {
  const expectReads = async (firestore: Firestore, expected: Record<string, boolean>) => {
    for (const [path, allowed] of Object.entries(expected)) {
      await expectRead(firestore, path, allowed);
    }
  };

  it('ignores role and school claims that the profile no longer backs', async () => {
    await expectReads(firestoreFor('demoted', STALE_CLAIMS), {
      'users/student-a': false,
      'schools/school-a': false,
      'licenses/license-a': false,
      'pathways/ai-innovator': false,
      'courses/official-draft': false,
      'courses/official-premium/lessons/m1-l1': false,
      'quizAttempts/student-a_official-premium_quiz-m1_1': false,
      'challenges/school-a-fair': false,
      // What the profile says the caller is now: an active student.
      'users/demoted': true,
      'courses/official-free/lessons/m1-l1': true,
    });
  });

  it('gives claims without any profile nothing beyond the public catalog', async () => {
    await expectReads(firestoreFor(NO_PROFILE_UID, STALE_CLAIMS), {
      'users/student-a': false,
      'schools/school-a': false,
      'courses/official-free/lessons/m1-l1': false,
      'challenges/global-open': false,
      'licenses/license-a': false,
      'pathways/ai-explorer': true,
      'courses/official-free': true,
      'badges/first-steps': true,
    });
    await assertFails(firestoreFor(NO_PROFILE_UID).collection('users').get());
  });

  it('stops a disabled platform admin at once', async () => {
    await expectReads(firestoreFor('disabled-admin'), {
      'users/student-a': false,
      'schools/school-a': false,
      'pathways/ai-innovator': false,
      'courses/official-draft': false,
      'courses/official-free/lessons/m1-l1': false,
      'challenges/global-open': false,
      'submissions/student-a_p_official-premium_project-1_1/aiReviews/ai-review-1': false,
      'users/disabled-admin': true,
      'pathways/ai-explorer': true,
    });
  });

  it('stops a disabled teacher and a disabled student, enrolled or not', async () => {
    await expectReads(firestoreFor('disabled-teacher'), {
      'classes/class-a': false,
      'classes/class-a/members/student-a': false,
      'courses/teacher-academy/lessons/m1-l1': false,
      'schools/school-a': false,
    });
    await expectReads(firestoreFor('disabled-student'), {
      'courses/official-premium/lessons/m1-l1': false,
      'courses/official-free/lessons/m1-l1': false,
      'schools/school-a': false,
      'challenges/school-a-fair': false,
      // Section 5.1 keeps a learner's own records readable; only the content needs `active()`.
      'enrollments/disabled-student_official-premium': true,
      'classes/class-a/members/disabled-student': true,
    });
  });

  it('tests the role on every class check, whatever the class document lists', async () => {
    const formerTeacher = firestoreFor('former-teacher');
    await expectReads(formerTeacher, {
      'classes/class-a': false,
      'classes/class-a/members/student-a': false,
      'classes/class-a/assignments/official-premium': false,
    });
    await assertFails(
      formerTeacher
        .collection('classes')
        .where('teacherUids', 'array-contains', 'former-teacher')
        .get(),
    );
  });

  it('gives a school admin whose profile names no school no school-less records', async () => {
    const orphanAdmin = firestoreFor('orphan-admin');
    await expectReads(orphanAdmin, {
      'users/solo': false,
      'enrollments/solo_official-free': false,
      'challenges/school-scope-without-school': false,
      'schools/school-a': false,
      'licenses/license-a': false,
    });
    await assertFails(orphanAdmin.collection('users').where('schoolId', '==', null).get());
  });

  it('treats a learner without a school as outside every school', async () => {
    await expectReads(firestoreFor('solo'), {
      'schools/school-a': false,
      'challenges/school-a-fair': false,
      'challenges/school-scope-without-school': false,
      'challenges/global-open': true,
      'enrollments/solo_official-free': true,
      'courses/official-free/lessons/m1-l1': true,
      'courses/official-premium/lessons/m1-l1': false,
    });
  });
});

describe('writes', () => {
  describe('every document, every caller: update, replace, delete and create are denied', () => {
    for (const path of Object.keys(FIXTURES)) {
      it(path, async () => {
        await Promise.all(
          ACTOR_NAMES.flatMap((actor) => {
            const ref = db[actor].doc(path);
            return [
              assertFails(ref.update(CLIENT_WRITE)),
              assertFails(ref.set(CLIENT_WRITE)),
              assertFails(ref.delete()),
              assertFails(ref.parent.doc(`created-by-${actor}`).set(CLIENT_WRITE)),
            ];
          }),
        );
      });
    }
  });

  it('denies the writes that would raise the caller’s own access', async () => {
    const admin = PROFILES.platform;
    const attempts: Promise<unknown>[] = [
      // An Auth account made with the public web config gives itself a profile.
      firestoreFor(NO_PROFILE_UID).doc(`users/${NO_PROFILE_UID}`).set(admin),
      db.student.doc('users/student-a').update({ role: 'platform_admin' }),
      db.student.doc('users/student-a').update({ xpTotal: 99_999, level: 50 }),
      db.student.doc('users/student-a/xpLedger/adjustment_gift').set({ amount: 5_000 }),
      db.student.doc('users/student-a/badges/prompt-master').set({ badgeId: 'prompt-master' }),
      // An enrollment document is what opens premium content, a member document the assignments.
      db.otherStudent.doc('enrollments/student-b_official-premium').set({ userUid: 'student-b' }),
      db.otherStudent.doc('classes/class-a/members/student-b').set({ displayName: 'Omar H.' }),
      db.student.doc('quizAttempts/student-a_official-premium_quiz-m1_2').set({ passed: true }),
      db.student
        .doc('submissions/student-a_p_official-premium_project-1_1')
        .update({ status: 'approved', finalScore: 100 }),
      db.student.doc('certificates/student-a_official-free').set({ userUid: 'student-a' }),
      db.student.doc(`files/${FILE_ID}`).update({ storagePath: 'course-media/official/x/y.png' }),
      db.classTeacher.doc('classes/class-a').update({ teacherUids: ['teacher-a', 'teacher-b'] }),
      db.classTeacher.doc('joinCodes/ZZZZ2222').set({ classId: 'class-a', schoolId: 'school-a' }),
      db.classTeacher.doc('users/teacher-a').update({ verifiedEducator: true }),
      db.classTeacher
        .doc('courses/class-course')
        .update({ isOfficial: true, visibility: 'public' }),
      db.classTeacher
        .doc('courses/class-course/quizzes/quiz-m1/private/key')
        .set({ answers: {}, explanations: {} }),
      db.schoolAdmin.doc('licenses/license-a').update({ seatsTotal: 100_000 }),
      db.schoolAdmin.doc('schools/school-a').update({ 'settings.aiDailyMessageLimit': 200 }),
      db.schoolAdmin.doc('users/admin-a').update({ role: 'platform_admin', schoolId: null }),
      db.platformAdmin.doc('auditLogs/log-1').delete(),
      db.platformAdmin.doc('meta/migrations').set({ applied: {} }),
    ];
    await Promise.all(attempts.map((attempt) => assertFails(attempt)));
  });

  it('left every document as the server wrote it', async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      const admin = context.firestore();
      for (const [path, data] of Object.entries(SEED)) {
        const snapshot = await admin.doc(path).get();
        expect(snapshot.data(), path).toEqual(data);
      }
      const created = await Promise.all(
        Object.keys(FIXTURES).flatMap((path) =>
          ACTOR_NAMES.map((actor) => admin.doc(path).parent.doc(`created-by-${actor}`).get()),
        ),
      );
      expect(created.filter((snapshot) => snapshot.exists).map((s) => s.ref.path)).toEqual([]);
      expect((await admin.doc(`users/${NO_PROFILE_UID}`).get()).exists).toBe(false);
    });
  });
});
