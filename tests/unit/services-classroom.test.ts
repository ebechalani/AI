import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isSystem, SYSTEM_ACTOR, type Actor } from '@/lib/auth/actor';
import { canManageClass, canViewClass } from '@/lib/auth/authz';
import {
  addMember,
  createClass as createClassRecord,
  findClassByJoinCode,
  getClass,
  listMembers,
  removeAssignment,
  removeMember,
  setAssignment,
  setTeachers,
} from '@/lib/data/classes';
import { getCourse, getCourses } from '@/lib/data/courses';
import {
  listEnrollmentsForUserInClass,
  setEnrollmentClassContext,
  upsertClassEnrollments,
} from '@/lib/data/enrollments';
import { consumeRateLimit } from '@/lib/data/rate-limit';
import { getSchool } from '@/lib/data/schools';
import { listOpenSubmissionsForStudent, setSubmissionClassContext } from '@/lib/data/submissions';
import { getUser } from '@/lib/data/users';
import {
  ConflictError,
  ForbiddenError,
  LicenseRequiredError,
  NotFoundError,
  RateLimitError,
} from '@/lib/errors';
import { getCourseAccess } from '@/lib/services/access';
import {
  addStudentToClass,
  assignCourseToClass,
  createClass,
  getStudentForTeacher,
  joinClassWithCode,
  lookupJoinCode,
  pickSupervisingClass,
  removeStudentFromClass,
  resolveClassContext,
  setClassTeachers,
  unassignCourseFromClass,
} from '@/lib/services/classroom';
import { applyIdentityChange } from '@/lib/services/identity';
import type {
  ClassMember,
  Course,
  Enrollment,
  Role,
  School,
  SchoolClass,
  Session,
  Submission,
  UserProfile,
} from '@/types';

// services/classroom over an in-memory stand-in for the repositories, which keep their
// authorization answers (a class the actor cannot see is not found). What is observed: the
// class-context rules of 3.4, the join-code checks, who may create a class or name its
// teachers, and the live classId/schoolId maintenance of 3.6. The repositories themselves
// run against the emulator in tests/integration.

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(() => {
    throw new Error('Firestore was reached.');
  }),
}));
vi.mock('@/lib/data/classes', () => ({
  addMember: vi.fn(),
  createClass: vi.fn(),
  findClassByJoinCode: vi.fn(),
  getClass: vi.fn(),
  listMembers: vi.fn(),
  removeAssignment: vi.fn(),
  removeMember: vi.fn(),
  setAssignment: vi.fn(),
  setTeachers: vi.fn(),
}));
vi.mock('@/lib/data/courses', () => ({ getCourse: vi.fn(), getCourses: vi.fn() }));
vi.mock('@/lib/data/enrollments', () => ({
  listEnrollmentsForUserInClass: vi.fn(),
  setEnrollmentClassContext: vi.fn(),
  upsertClassEnrollments: vi.fn(),
}));
vi.mock('@/lib/data/rate-limit', () => ({ consumeRateLimit: vi.fn() }));
vi.mock('@/lib/data/schools', () => ({ getSchool: vi.fn() }));
vi.mock('@/lib/data/submissions', () => ({
  listOpenSubmissionsForStudent: vi.fn(),
  setSubmissionClassContext: vi.fn(),
}));
vi.mock('@/lib/data/users', () => ({ getUser: vi.fn() }));
vi.mock('@/lib/services/identity', () => ({ applyIdentityChange: vi.fn() }));
vi.mock('@/lib/services/access', () => ({ getCourseAccess: vi.fn() }));

const NOW = '2026-10-02T08:00:00.000Z';
const future = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();
const past = () => new Date(Date.now() - 60 * 1000).toISOString();

function session(
  role: Role,
  uid: string,
  schoolId: string | null = null,
  classIds: string[] = [],
): Session {
  return {
    uid,
    role,
    schoolId,
    classIds,
    displayName: uid,
    locale: 'en',
    ageBand: 'adult',
    avatarId: 'robot',
    verifiedEducator: false,
  };
}

function profile(fields: Partial<UserProfile> & { id: string }): UserProfile {
  return {
    role: 'student',
    schoolId: null,
    displayName: fields.id,
    username: null,
    email: `${fields.id}@example.com`,
    ageBand: '11-12',
    locale: 'en',
    avatarId: 'robot',
    status: 'active',
    classIds: [],
    consentBasis: 'self_13_plus',
    provisionedByUid: null,
    verifiedEducator: false,
    sessionsValidAfter: null,
    xpTotal: 120,
    level: 1,
    stats: {
      lessonsCompleted: 0,
      quizzesPassed: 0,
      projectsAccepted: 0,
      challengesCompleted: 0,
      coursesCompleted: 0,
      badges: 0,
      certificates: 0,
    },
    lastLoginAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

function schoolClass(fields: Partial<SchoolClass> & { id: string }): SchoolClass {
  return {
    schoolId: 'school-a',
    name: `Class ${fields.id}`,
    gradeLabel: null,
    ageBand: '11-12',
    ownerUid: 'teacher-1',
    teacherUids: ['teacher-1'],
    joinCode: 'ABCDEFGH',
    joinCodeEnabled: false,
    joinCodeExpiresAt: null,
    studentCount: 0,
    assignedCourseIds: [],
    archived: false,
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

function school(fields: Partial<School> & { id: string }): School {
  return {
    name: fields.id,
    country: 'LB',
    city: null,
    defaultLocale: 'fr',
    status: 'active',
    settings: { aiEnabled: true, aiDailyMessageLimit: null, joinCodesEnabled: true },
    counts: { teachers: 1, students: 0, classes: 1 },
    createdByUid: 'admin-1',
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

function course(fields: Partial<Course> & { id: string }): Course {
  return {
    pathwayId: null,
    order: 0,
    ownerUid: 'admin-1',
    schoolId: null,
    isOfficial: true,
    status: 'published',
    visibility: 'public',
    audience: 'student',
    area: 'ai',
    tags: [],
    ageMin: null,
    ageMax: null,
    estimatedMinutes: 60,
    accessTier: 'free',
    certificateEnabled: true,
    coverImage: null,
    hardwarePlatformIds: [],
    requiredCapabilities: [],
    moduleCount: 1,
    lessonCount: 4,
    defaultLocale: 'en',
    translations: {},
    publishedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

function submission(fields: Partial<Submission> & { id: string }): Submission {
  return {
    studentUid: 'student-1',
    studentName: 'student-1',
    schoolId: null,
    classId: null,
    context: 'project',
    courseId: 'course-1',
    lessonId: 'l1',
    projectId: 'p1',
    challengeId: null,
    contextTitle: {},
    attemptNumber: 1,
    previousSubmissionId: null,
    title: 't',
    description: '',
    type: 'text',
    content: { text: 'x', linkUrl: null, code: null, codeLanguage: null },
    attachments: [],
    locale: 'en',
    status: 'submitted',
    aiReviewStatus: 'pending',
    latestAiReviewId: null,
    aiRegenerations: 0,
    rubric: [],
    finalScore: null,
    finalCriteria: null,
    finalFeedback: null,
    reviewedByUid: null,
    reviewedAt: null,
    xpAwarded: 0,
    effectsApplied: true,
    submittedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

interface World {
  users: Map<string, UserProfile>;
  classes: Map<string, SchoolClass>;
  members: Map<string, Set<string>>;
  schools: Map<string, School>;
  courses: Map<string, Course>;
  enrollments: Enrollment[];
  submissions: Submission[];
  rateLimited: boolean;
}

let world: World;

const teacher = session('teacher', 'teacher-1', 'school-a', ['class-a', 'class-b']);
const coTeacher = session('teacher', 'teacher-2', 'school-a', ['class-a']);
const otherTeacher = session('teacher', 'teacher-9', 'school-b', ['class-x']);
const schoolAdmin = session('school_admin', 'admin-a', 'school-a');
const platformAdmin = session('platform_admin', 'root');

function canRead(actor: Actor, uid: string): boolean {
  if (isSystem(actor) || actor.role === 'platform_admin' || actor.uid === uid) return true;
  const target = world.users.get(uid);
  return (
    target !== undefined &&
    actor.role === 'school_admin' &&
    actor.schoolId !== null &&
    actor.schoolId === target.schoolId
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  world = {
    users: new Map(),
    classes: new Map(),
    members: new Map(),
    schools: new Map([['school-a', school({ id: 'school-a' })]]),
    courses: new Map([['course-1', course({ id: 'course-1' })]]),
    enrollments: [],
    submissions: [],
    rateLimited: false,
  };
  world.users.set('teacher-1', profile({ id: 'teacher-1', role: 'teacher', schoolId: 'school-a' }));
  world.users.set('teacher-2', profile({ id: 'teacher-2', role: 'teacher', schoolId: 'school-a' }));
  world.users.set('teacher-9', profile({ id: 'teacher-9', role: 'teacher', schoolId: 'school-b' }));
  world.users.set(
    'admin-a',
    profile({ id: 'admin-a', role: 'school_admin', schoolId: 'school-a' }),
  );

  vi.mocked(getUser).mockImplementation(async (actor, uid) => {
    const found = world.users.get(uid);
    if (found === undefined || !canRead(actor, uid)) throw new NotFoundError(`users/${uid}`);
    return found;
  });
  vi.mocked(getClass).mockImplementation(async (actor, classId) => {
    const found = world.classes.get(classId);
    if (found === undefined || !canViewClass(actor, found)) {
      throw new NotFoundError(`classes/${classId}`);
    }
    return found;
  });
  vi.mocked(listMembers).mockImplementation(async (actor, classId) => {
    const found = world.classes.get(classId);
    if (found === undefined || !canViewClass(actor, found)) {
      throw new NotFoundError(`classes/${classId}`);
    }
    if (!canManageClass(actor, found)) throw new ForbiddenError('class.manage');
    return [...(world.members.get(classId) ?? [])].map(
      (uid) => ({ id: uid, classId, displayName: uid }) as ClassMember,
    );
  });
  vi.mocked(findClassByJoinCode).mockImplementation(async (_actor, code) => {
    return (
      [...world.classes.values()].find((cls) => cls.joinCode === code && !cls.archived) ?? null
    );
  });
  vi.mocked(getSchool).mockImplementation(async (_actor, schoolId) => {
    const found = world.schools.get(schoolId);
    if (found === undefined) throw new NotFoundError(`schools/${schoolId}`);
    return found;
  });
  vi.mocked(getCourse).mockImplementation(async (_actor, courseId) => {
    const found = world.courses.get(courseId);
    if (found === undefined) throw new NotFoundError(`courses/${courseId}`);
    return found;
  });
  vi.mocked(getCourses).mockImplementation(async (_actor, courseIds) =>
    courseIds.flatMap((courseId) => world.courses.get(courseId) ?? []),
  );
  vi.mocked(consumeRateLimit).mockImplementation(async () =>
    world.rateLimited
      ? { allowed: false, retryAfterSeconds: 120 }
      : { allowed: true, retryAfterSeconds: null },
  );
  vi.mocked(addMember).mockImplementation(async (_actor, classId, student) => {
    const roster = world.members.get(classId) ?? new Set<string>();
    if (roster.has(student.id)) return;
    roster.add(student.id);
    world.members.set(classId, roster);
    const cls = world.classes.get(classId)!;
    world.classes.set(classId, { ...cls, studentCount: cls.studentCount + 1 });
    const stored = world.users.get(student.id)!;
    world.users.set(student.id, { ...stored, classIds: [...stored.classIds, classId] });
  });
  vi.mocked(removeMember).mockImplementation(async (_actor, classId, uid) => {
    world.members.get(classId)?.delete(uid);
    const stored = world.users.get(uid)!;
    world.users.set(uid, { ...stored, classIds: stored.classIds.filter((id) => id !== classId) });
  });
  vi.mocked(applyIdentityChange).mockImplementation(async (uid, change) => {
    const stored = world.users.get(uid)!;
    world.users.set(uid, { ...stored, ...change });
  });
  vi.mocked(listEnrollmentsForUserInClass).mockImplementation(async (_actor, uid, classId) =>
    world.enrollments.filter((e) => e.userUid === uid && e.classId === classId),
  );
  vi.mocked(listOpenSubmissionsForStudent).mockImplementation(async (_actor, uid, filter) =>
    world.submissions.filter(
      (s) =>
        s.studentUid === uid &&
        s.status === 'submitted' &&
        (filter.courseId === undefined || s.courseId === filter.courseId) &&
        (filter.classId === undefined || s.classId === filter.classId),
    ),
  );
  vi.mocked(createClassRecord).mockImplementation(async (_actor, input) =>
    schoolClass({ id: 'class-new', ...input, teacherUids: [input.ownerUid] }),
  );
  vi.mocked(getCourseAccess).mockResolvedValue({ allowed: true, via: 'staff_preview' });
});

function addClass(cls: SchoolClass, memberUids: string[] = []): void {
  world.classes.set(cls.id, cls);
  world.members.set(cls.id, new Set(memberUids));
  for (const uid of memberUids) {
    const stored = world.users.get(uid)!;
    world.users.set(uid, { ...stored, classIds: [...stored.classIds, cls.id] });
  }
}

// --- Class context --------------------------------------------------------------------------------

describe('pickSupervisingClass', () => {
  const a = schoolClass({ id: 'class-a' });
  const b = schoolClass({ id: 'class-b', assignedCourseIds: ['course-1'] });
  const c = schoolClass({ id: 'class-c', assignedCourseIds: ['course-1'] });

  it('prefers the lowest class id that has the course assigned', () => {
    expect(pickSupervisingClass([c, a, b], 'course-1')?.id).toBe('class-b');
  });

  it('falls back to the lowest class id, also for a challenge', () => {
    expect(pickSupervisingClass([c, b, a], 'course-9')?.id).toBe('class-a');
    expect(pickSupervisingClass([c, b], null)?.id).toBe('class-b');
  });

  it('answers null for a learner in no class', () => {
    expect(pickSupervisingClass([], 'course-1')).toBeNull();
  });
});

describe('resolveClassContext', () => {
  it('takes the school from the supervising class, else from the user', async () => {
    world.users.set('student-1', profile({ id: 'student-1', schoolId: 'school-a' }));
    addClass(schoolClass({ id: 'class-b', schoolId: 'school-b' }), ['student-1']);
    addClass(schoolClass({ id: 'class-a', schoolId: null, assignedCourseIds: ['course-1'] }), [
      'student-1',
    ]);

    expect(await resolveClassContext('student-1', 'course-1')).toEqual({
      classId: 'class-a',
      schoolId: 'school-a',
    });
    expect(await resolveClassContext('student-1', 'course-2')).toEqual({
      classId: 'class-a',
      schoolId: 'school-a',
    });
    world.classes.delete('class-a');
    expect(await resolveClassContext('student-1', null)).toEqual({
      classId: 'class-b',
      schoolId: 'school-b',
    });
  });

  it('leaves a learner in no class unsupervised, with their own school', async () => {
    world.users.set('student-1', profile({ id: 'student-1', schoolId: 'school-a' }));
    expect(await resolveClassContext('student-1', 'course-1')).toEqual({
      classId: null,
      schoolId: 'school-a',
    });
    expect(getClass).not.toHaveBeenCalled();
  });
});

// --- Join codes -----------------------------------------------------------------------------------

describe('lookupJoinCode', () => {
  const ctx = { clientKey: 'a'.repeat(64) };

  it('counts the request first and refuses when the window is full', async () => {
    world.rateLimited = true;
    await expect(lookupJoinCode('RBHDEM23', ctx)).rejects.toMatchObject({
      code: 'rate_limited',
      retryAfterSeconds: 120,
    });
    expect(consumeRateLimit).toHaveBeenCalledWith('join_lookup', ctx.clientKey);
    expect(findClassByJoinCode).not.toHaveBeenCalled();
  });

  it('answers unknown, disabled, expired and school-disabled codes identically', async () => {
    const messages: string[] = [];
    const attempt = async (code: string) => {
      const error = await lookupJoinCode(code, ctx).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(NotFoundError);
      messages.push((error as Error).message);
    };
    await attempt('ZZZZZZZZ');
    addClass(schoolClass({ id: 'class-a', joinCode: 'RBHDEM23', joinCodeEnabled: false }));
    await attempt('RBHDEM23');
    addClass(
      schoolClass({
        id: 'class-a',
        joinCode: 'RBHDEM23',
        joinCodeEnabled: true,
        joinCodeExpiresAt: past(),
      }),
    );
    await attempt('RBHDEM23');
    addClass(
      schoolClass({
        id: 'class-a',
        joinCode: 'RBHDEM23',
        joinCodeEnabled: true,
        joinCodeExpiresAt: future(),
      }),
    );
    world.schools.set(
      'school-a',
      school({
        id: 'school-a',
        settings: { aiEnabled: true, aiDailyMessageLimit: null, joinCodesEnabled: false },
      }),
    );
    await attempt('RBHDEM23');
    await attempt('not a code');
    expect(new Set(messages).size).toBe(1);
  });

  it('normalizes the code and describes what an active school class allows', async () => {
    addClass(
      schoolClass({
        id: 'class-a',
        joinCode: 'RBHDEM23',
        joinCodeEnabled: true,
        joinCodeExpiresAt: future(),
      }),
    );
    expect(await lookupJoinCode('rbhd-em23', ctx)).toEqual({
      className: 'Class class-a',
      accountCreation: true,
      under13Allowed: true,
    });
    expect(findClassByJoinCode).toHaveBeenCalledWith(SYSTEM_ACTOR, 'RBHDEM23');
    expect(getUser).not.toHaveBeenCalled();

    world.schools.set('school-a', school({ id: 'school-a', status: 'suspended' }));
    expect(await lookupJoinCode('RBHDEM23', ctx)).toEqual({
      className: 'Class class-a',
      accountCreation: false,
      under13Allowed: false,
    });
  });

  it('a class without a school creates 13+ accounts only when its owner is a verified educator', async () => {
    addClass(
      schoolClass({
        id: 'class-a',
        schoolId: null,
        joinCode: 'RBHDEM23',
        joinCodeEnabled: true,
        joinCodeExpiresAt: future(),
      }),
    );
    expect(await lookupJoinCode('RBHDEM23', ctx)).toMatchObject({
      accountCreation: false,
      under13Allowed: false,
    });
    world.users.set(
      'teacher-1',
      profile({ id: 'teacher-1', role: 'teacher', verifiedEducator: true }),
    );
    expect(await lookupJoinCode('RBHDEM23', ctx)).toMatchObject({
      accountCreation: true,
      under13Allowed: false,
    });
    world.users.set(
      'teacher-1',
      profile({ id: 'teacher-1', role: 'teacher', verifiedEducator: true, status: 'disabled' }),
    );
    expect(await lookupJoinCode('RBHDEM23', ctx)).toMatchObject({ accountCreation: false });
  });
});

describe('joinClassWithCode', () => {
  beforeEach(() => {
    world.users.set('student-1', profile({ id: 'student-1' }));
    addClass(
      schoolClass({
        id: 'class-a',
        joinCode: 'RBHDEM23',
        joinCodeEnabled: true,
        joinCodeExpiresAt: future(),
        assignedCourseIds: ['course-1'],
      }),
    );
    world.submissions.push(submission({ id: 's-open' }));
    world.submissions.push(submission({ id: 's-done', status: 'approved' }));
  });

  it('is for signed-in students, counted per uid before the code is looked at', async () => {
    await expect(joinClassWithCode(SYSTEM_ACTOR, 'RBHDEM23')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(joinClassWithCode(teacher, 'RBHDEM23')).rejects.toBeInstanceOf(ForbiddenError);
    world.rateLimited = true;
    await expect(
      joinClassWithCode(session('student', 'student-1'), 'RBHDEM23'),
    ).rejects.toBeInstanceOf(RateLimitError);
    expect(consumeRateLimit).toHaveBeenCalledWith('join_class', 'student-1');
    expect(findClassByJoinCode).not.toHaveBeenCalled();
  });

  it('refuses a pupil of another school, before any write', async () => {
    world.users.set('student-1', profile({ id: 'student-1', schoolId: 'school-b' }));
    await expect(
      joinClassWithCode(session('student', 'student-1', 'school-b'), 'RBHDEM23'),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(addMember).not.toHaveBeenCalled();

    world.classes.set('class-a', { ...world.classes.get('class-a')!, schoolId: null });
    await expect(
      joinClassWithCode(session('student', 'student-1', 'school-b'), 'RBHDEM23'),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('adds the member, attaches the school without ending the session, enrols and re-points', async () => {
    const cls = await joinClassWithCode(session('student', 'student-1'), 'RBHDEM23');

    expect(cls.id).toBe('class-a');
    expect(cls.studentCount).toBe(1);
    expect(addMember).toHaveBeenCalledWith(
      SYSTEM_ACTOR,
      'class-a',
      expect.objectContaining({ id: 'student-1' }),
      null,
    );
    expect(applyIdentityChange).toHaveBeenCalledWith(
      'student-1',
      { schoolId: 'school-a' },
      { invalidateSessions: false },
    );
    expect(upsertClassEnrollments).toHaveBeenCalledWith(SYSTEM_ACTOR, [
      {
        userUid: 'student-1',
        courseId: 'course-1',
        classId: 'class-a',
        schoolId: 'school-a',
        source: 'class',
        totalLessonCount: 4,
      },
    ]);
    expect(setSubmissionClassContext).toHaveBeenCalledTimes(1);
    expect(setSubmissionClassContext).toHaveBeenCalledWith(SYSTEM_ACTOR, 's-open', {
      classId: 'class-a',
      schoolId: 'school-a',
    });
  });

  it('leaves the school of a pupil who already has one, and reads no course for a class with none', async () => {
    world.users.set('student-1', profile({ id: 'student-1', schoolId: 'school-a' }));
    world.classes.set('class-a', { ...world.classes.get('class-a')!, assignedCourseIds: [] });
    await joinClassWithCode(session('student', 'student-1', 'school-a'), 'RBHDEM23');
    expect(applyIdentityChange).not.toHaveBeenCalled();
    expect(getCourses).not.toHaveBeenCalled();
    expect(upsertClassEnrollments).not.toHaveBeenCalled();
  });
});

describe('addStudentToClass', () => {
  it('is system only', async () => {
    await expect(
      addStudentToClass(teacher, 'class-a', profile({ id: 'student-1' }), teacher.uid),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('gives a challenge entry the lowest class and a project the class that assigns its course', async () => {
    world.users.set('student-1', profile({ id: 'student-1', schoolId: 'school-a' }));
    addClass(schoolClass({ id: 'class-b' }), ['student-1']);
    addClass(schoolClass({ id: 'class-c', assignedCourseIds: ['course-1'] }));
    world.submissions.push(
      submission({ id: 's-project' }),
      submission({ id: 's-challenge', context: 'challenge', courseId: null, challengeId: 'ch' }),
    );

    await addStudentToClass(SYSTEM_ACTOR, 'class-c', world.users.get('student-1')!, 'teacher-1');

    expect(setSubmissionClassContext).toHaveBeenCalledWith(SYSTEM_ACTOR, 's-project', {
      classId: 'class-c',
      schoolId: 'school-a',
    });
    expect(setSubmissionClassContext).toHaveBeenCalledWith(SYSTEM_ACTOR, 's-challenge', {
      classId: 'class-b',
      schoolId: 'school-a',
    });
  });
});

// --- Roster ---------------------------------------------------------------------------------------

describe('removeStudentFromClass', () => {
  beforeEach(() => {
    world.users.set('student-1', profile({ id: 'student-1', schoolId: 'school-a' }));
    addClass(schoolClass({ id: 'class-a', assignedCourseIds: ['course-1'] }), ['student-1']);
    world.enrollments.push({
      id: 'student-1_course-1',
      userUid: 'student-1',
      courseId: 'course-1',
      classId: 'class-a',
      schoolId: 'school-a',
    } as Enrollment);
    world.submissions.push(
      submission({ id: 's-open', classId: 'class-a', schoolId: 'school-a' }),
      submission({ id: 's-done', classId: 'class-a', schoolId: 'school-a', status: 'approved' }),
    );
  });

  it('refuses an archived class, whose roster is read-only', async () => {
    addClass(schoolClass({ id: 'class-z', archived: true }), ['student-1']);
    await expect(removeStudentFromClass(teacher, 'class-z', 'student-1')).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(removeMember).not.toHaveBeenCalled();
    expect(applyIdentityChange).not.toHaveBeenCalled();
  });

  it('is not found for a class the actor does not run, or a student who is not a member', async () => {
    await expect(
      removeStudentFromClass(otherTeacher, 'class-a', 'student-1'),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(removeStudentFromClass(teacher, 'class-a', 'student-2')).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(removeMember).not.toHaveBeenCalled();
  });

  it('detaches a self-registered student leaving their last class in the school and re-resolves their work', async () => {
    await removeStudentFromClass(teacher, 'class-a', 'student-1');

    expect(removeMember).toHaveBeenCalledWith(SYSTEM_ACTOR, 'class-a', 'student-1');
    expect(applyIdentityChange).toHaveBeenCalledWith(
      'student-1',
      { schoolId: null },
      { invalidateSessions: false },
    );
    expect(setEnrollmentClassContext).toHaveBeenCalledWith(SYSTEM_ACTOR, 'student-1', 'course-1', {
      classId: null,
      schoolId: null,
    });
    expect(setSubmissionClassContext).toHaveBeenCalledTimes(1);
    expect(setSubmissionClassContext).toHaveBeenCalledWith(SYSTEM_ACTOR, 's-open', {
      classId: null,
      schoolId: null,
    });
  });

  it('keeps a provisioned (username) student attached to the school', async () => {
    world.users.set(
      'student-1',
      profile({
        id: 'student-1',
        schoolId: 'school-a',
        username: 'lea.m',
        email: null,
        provisionedByUid: 'teacher-1',
        classIds: ['class-a'],
      }),
    );
    await removeStudentFromClass(schoolAdmin, 'class-a', 'student-1');
    expect(applyIdentityChange).not.toHaveBeenCalled();
    expect(setEnrollmentClassContext).toHaveBeenCalledWith(SYSTEM_ACTOR, 'student-1', 'course-1', {
      classId: null,
      schoolId: 'school-a',
    });
  });

  it('hands the work to another class of the student in the same school', async () => {
    addClass(schoolClass({ id: 'class-b' }), ['student-1']);
    await removeStudentFromClass(teacher, 'class-a', 'student-1');
    expect(applyIdentityChange).not.toHaveBeenCalled();
    expect(setEnrollmentClassContext).toHaveBeenCalledWith(SYSTEM_ACTOR, 'student-1', 'course-1', {
      classId: 'class-b',
      schoolId: 'school-a',
    });
    expect(setSubmissionClassContext).toHaveBeenCalledWith(SYSTEM_ACTOR, 's-open', {
      classId: 'class-b',
      schoolId: 'school-a',
    });
  });
});

describe('getStudentForTeacher', () => {
  beforeEach(() => {
    world.users.set(
      'student-1',
      profile({
        id: 'student-1',
        schoolId: 'school-a',
        username: 'lea.m',
        email: null,
        provisionedByUid: 'teacher-1',
        displayName: 'Lea M',
      }),
    );
    addClass(schoolClass({ id: 'class-a' }), ['student-1']);
  });

  it('returns the reduced summary for a pupil of the class', async () => {
    expect(await getStudentForTeacher(teacher, 'class-a', 'student-1')).toEqual({
      uid: 'student-1',
      displayName: 'Lea M',
      username: 'lea.m',
      ageBand: '11-12',
      avatarId: 'robot',
      status: 'active',
      xpTotal: 120,
      level: 1,
      canResetPassword: true,
    });
  });

  it('offers no password reset for an email account, and nothing for a non-member or another teacher', async () => {
    world.users.set(
      'student-1',
      profile({ id: 'student-1', schoolId: 'school-a', classIds: ['class-a'] }),
    );
    expect((await getStudentForTeacher(teacher, 'class-a', 'student-1')).canResetPassword).toBe(
      false,
    );
    await expect(getStudentForTeacher(teacher, 'class-a', 'student-2')).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(getStudentForTeacher(otherTeacher, 'class-a', 'student-1')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

// --- Classes and teachers -------------------------------------------------------------------------

describe('createClass', () => {
  const input = { name: 'Grade 6 A', gradeLabel: 'Grade 6', ageBand: '11-12' as const };

  it('a teacher owns the class they create, in their school', async () => {
    const cls = await createClass(teacher, input);
    expect(cls.ownerUid).toBe('teacher-1');
    expect(createClassRecord).toHaveBeenCalledWith(SYSTEM_ACTOR, {
      schoolId: 'school-a',
      name: 'Grade 6 A',
      gradeLabel: 'Grade 6',
      ageBand: '11-12',
      ownerUid: 'teacher-1',
    });
    const independent = session('teacher', 'teacher-5');
    await createClass(independent, { ...input, ownerUid: 'teacher-1' });
    expect(createClassRecord).toHaveBeenLastCalledWith(
      SYSTEM_ACTOR,
      expect.objectContaining({ schoolId: null, ownerUid: 'teacher-5' }),
    );
  });

  it('a school admin names an active teacher of their school as owner', async () => {
    await expect(createClass(schoolAdmin, input)).rejects.toMatchObject({
      code: 'validation',
      fieldErrors: { ownerUid: ['required'] },
    });
    await expect(
      createClass(schoolAdmin, { ...input, ownerUid: 'teacher-9' }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(createClass(schoolAdmin, { ...input, ownerUid: 'admin-a' })).rejects.toMatchObject(
      {
        fieldErrors: { ownerUid: ['invalid_choice'] },
      },
    );
    world.users.set(
      'teacher-2',
      profile({ id: 'teacher-2', role: 'teacher', schoolId: 'school-a', status: 'disabled' }),
    );
    await expect(
      createClass(schoolAdmin, { ...input, ownerUid: 'teacher-2' }),
    ).rejects.toMatchObject({
      fieldErrors: { ownerUid: ['invalid_choice'] },
    });
    await createClass(schoolAdmin, { ...input, ownerUid: 'teacher-1' });
    expect(createClassRecord).toHaveBeenCalledWith(
      SYSTEM_ACTOR,
      expect.objectContaining({ schoolId: 'school-a', ownerUid: 'teacher-1' }),
    );
  });

  it('refuses students, the system and an invalid class', async () => {
    await expect(createClass(session('student', 'student-1'), input)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(createClass(SYSTEM_ACTOR, input)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(createClass(teacher, { ...input, name: '   ' })).rejects.toMatchObject({
      fieldErrors: { name: ['required'] },
    });
    expect(createClassRecord).not.toHaveBeenCalled();
  });
});

describe('setClassTeachers', () => {
  beforeEach(() => {
    addClass(schoolClass({ id: 'class-a', teacherUids: ['teacher-1', 'teacher-2'] }));
    addClass(
      schoolClass({
        id: 'class-solo',
        schoolId: null,
        ownerUid: 'teacher-5',
        teacherUids: ['teacher-5'],
      }),
    );
    world.users.set('teacher-5', profile({ id: 'teacher-5', role: 'teacher' }));
  });

  it('in a school only its admin (or a platform admin) decides; outsiders find no class', async () => {
    await expect(setClassTeachers(coTeacher, 'class-a', ['teacher-1'])).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(setClassTeachers(otherTeacher, 'class-a', ['teacher-1'])).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await setClassTeachers(platformAdmin, 'class-a', ['teacher-1']);
    expect(setTeachers).toHaveBeenCalledWith(SYSTEM_ACTOR, 'class-a', ['teacher-1']);
  });

  it('keeps the owner and accepts only active teachers of the school', async () => {
    await expect(setClassTeachers(schoolAdmin, 'class-a', ['teacher-2'])).rejects.toBeInstanceOf(
      ConflictError,
    );
    await expect(setClassTeachers(schoolAdmin, 'class-a', [])).rejects.toMatchObject({
      fieldErrors: { teacherUids: ['required'] },
    });
    for (const bad of ['admin-a', 'teacher-9', 'ghost']) {
      await expect(
        setClassTeachers(schoolAdmin, 'class-a', ['teacher-1', bad]),
      ).rejects.toMatchObject({ fieldErrors: { teacherUids: ['invalid_choice'] } });
    }
    await setClassTeachers(schoolAdmin, 'class-a', ['teacher-2', 'teacher-1', 'teacher-2']);
    expect(setTeachers).toHaveBeenCalledWith(SYSTEM_ACTOR, 'class-a', ['teacher-2', 'teacher-1']);
  });

  it('a class without a school has exactly its owner', async () => {
    const owner = session('teacher', 'teacher-5', null, ['class-solo']);
    await expect(
      setClassTeachers(owner, 'class-solo', ['teacher-5', 'teacher-1']),
    ).rejects.toBeInstanceOf(ConflictError);
    await setClassTeachers(owner, 'class-solo', ['teacher-5']);
    expect(setTeachers).toHaveBeenCalledWith(SYSTEM_ACTOR, 'class-solo', ['teacher-5']);
    expect(getUser).not.toHaveBeenCalled();
  });
});

// --- Assignments ----------------------------------------------------------------------------------

describe('assignCourseToClass', () => {
  beforeEach(() => {
    world.users.set('student-1', profile({ id: 'student-1', schoolId: 'school-a' }));
    world.users.set('student-2', profile({ id: 'student-2', schoolId: 'school-a' }));
    addClass(schoolClass({ id: 'class-a' }), ['student-1', 'student-2']);
    world.submissions.push(
      submission({ id: 's-unsupervised' }),
      submission({ id: 's-other-course', courseId: 'course-2' }),
      submission({ id: 's-supervised', classId: 'class-b', schoolId: 'school-a' }),
    );
  });

  it('needs the actor to run the class and to have access to the course', async () => {
    await expect(
      assignCourseToClass(otherTeacher, 'class-a', 'course-1', null),
    ).rejects.toBeInstanceOf(NotFoundError);
    vi.mocked(getCourseAccess).mockResolvedValue({ allowed: false, reason: 'license_required' });
    await expect(assignCourseToClass(teacher, 'class-a', 'course-1', null)).rejects.toBeInstanceOf(
      LicenseRequiredError,
    );
    vi.mocked(getCourseAccess).mockResolvedValue({ allowed: false, reason: 'not_visible' });
    await expect(assignCourseToClass(teacher, 'class-a', 'course-1', null)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(setAssignment).not.toHaveBeenCalled();
  });

  it('refuses a course for teachers', async () => {
    world.courses.set('course-1', course({ id: 'course-1', audience: 'teacher' }));
    await expect(assignCourseToClass(teacher, 'class-a', 'course-1', null)).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(setAssignment).not.toHaveBeenCalled();
  });

  it('refuses a course that is not published, so no member is enrolled in a draft', async () => {
    for (const status of ['draft', 'archived'] as const) {
      world.courses.set(
        'course-1',
        course({ id: 'course-1', status, isOfficial: false, ownerUid: 'teacher-1' }),
      );
      await expect(
        assignCourseToClass(teacher, 'class-a', 'course-1', null),
      ).rejects.toBeInstanceOf(ConflictError);
    }
    expect(setAssignment).not.toHaveBeenCalled();
    expect(upsertClassEnrollments).not.toHaveBeenCalled();
  });

  it('writes the assignment, enrols every member and adopts their open unsupervised work in that course', async () => {
    await assignCourseToClass(teacher, 'class-a', 'course-1', '2026-12-01T00:00:00.000Z');

    expect(setAssignment).toHaveBeenCalledWith(
      teacher,
      'class-a',
      'course-1',
      '2026-12-01T00:00:00.000Z',
    );
    expect(upsertClassEnrollments).toHaveBeenCalledWith(SYSTEM_ACTOR, [
      {
        userUid: 'student-1',
        courseId: 'course-1',
        classId: 'class-a',
        schoolId: 'school-a',
        source: 'class',
        totalLessonCount: 4,
      },
      {
        userUid: 'student-2',
        courseId: 'course-1',
        classId: 'class-a',
        schoolId: 'school-a',
        source: 'class',
        totalLessonCount: 4,
      },
    ]);
    expect(setSubmissionClassContext).toHaveBeenCalledTimes(1);
    expect(setSubmissionClassContext).toHaveBeenCalledWith(SYSTEM_ACTOR, 's-unsupervised', {
      classId: 'class-a',
      schoolId: 'school-a',
    });
  });

  it('refuses to unassign a course from an archived class', async () => {
    addClass(schoolClass({ id: 'class-z', archived: true, assignedCourseIds: ['course-1'] }));
    await expect(unassignCourseFromClass(schoolAdmin, 'class-z', 'course-1')).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(removeAssignment).not.toHaveBeenCalled();
  });

  it('unassigning keeps the enrollments', async () => {
    await unassignCourseFromClass(schoolAdmin, 'class-a', 'course-1');
    expect(removeAssignment).toHaveBeenCalledWith(schoolAdmin, 'class-a', 'course-1');
    expect(setEnrollmentClassContext).not.toHaveBeenCalled();
    await expect(
      unassignCourseFromClass(otherTeacher, 'class-a', 'course-1'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
