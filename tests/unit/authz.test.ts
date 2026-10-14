import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assertSystem, isSystem, SYSTEM_ACTOR, type Actor } from '@/lib/auth/actor';
import {
  assertCan,
  assertRole,
  canAssignRole,
  canEditCourse,
  canIssueCertificate,
  canManageClass,
  canManageSchool,
  canManageUser,
  canReviewSubmission,
  canViewAiReview,
  canViewCertificate,
  canViewChallenge,
  canViewClass,
  canViewCourse,
  canViewLearnerRecord,
  canViewSchool,
  canViewSubmission,
  canViewUser,
  hasRole,
  inSchool,
  isPlatformAdmin,
  teachesAnyOf,
  teachesClass,
} from '@/lib/auth/authz';
import { hasCapability, ROLE_CAPABILITIES } from '@/lib/auth/capabilities';
import { isStaffRole, roleHome, ROLES, safeNextPath, STAFF_ROLES } from '@/lib/auth/roles';
import { ForbiddenError } from '@/lib/errors';
import type {
  Certificate,
  Challenge,
  Course,
  Role,
  SchoolClass,
  Session,
  Submission,
  UserProfile,
} from '@/types';

// --- The cast ----------------------------------------------------------------------------------
// School s1 has two classes: c1 (taught by `teacher`) and c2 (taught by `colleague`). `student`
// and `classmate` are in c1. School s2 and the school-less `soloTeacher` (class c3) are the
// outsiders. Every resource below belongs to `student`, class c1, school s1, unless a test
// says otherwise.

function session(uid: string, role: Role, schoolId: string | null, classIds: string[]): Session {
  return {
    uid,
    role,
    schoolId,
    classIds,
    displayName: uid,
    locale: 'en',
    ageBand: role === 'student' ? '11-12' : 'adult',
    avatarId: 'robot',
    verifiedEducator: false,
  };
}

const ACTORS = {
  student: session('stu-1', 'student', 's1', ['c1']),
  classmate: session('stu-2', 'student', 's1', ['c1']),
  teacher: session('tea-1', 'teacher', 's1', ['c1']),
  colleague: session('tea-2', 'teacher', 's1', ['c2']),
  otherSchoolTeacher: session('tea-9', 'teacher', 's2', ['c9']),
  soloTeacher: session('tea-3', 'teacher', null, ['c3']),
  schoolAdmin: session('adm-1', 'school_admin', 's1', []),
  otherSchoolAdmin: session('adm-2', 'school_admin', 's2', []),
  platformAdmin: session('root-1', 'platform_admin', null, []),
  system: SYSTEM_ACTOR,
} satisfies Record<string, Actor>;

type ActorName = keyof typeof ACTORS;
const ACTOR_NAMES = Object.keys(ACTORS) as ActorName[];

/** Asserts the predicate for every actor: true for the named ones and for the system. */
function expectAllowed(check: (actor: Actor) => boolean, allowed: ActorName[]): void {
  const expected = Object.fromEntries(
    ACTOR_NAMES.map((name) => [name, name === 'system' || allowed.includes(name)]),
  );
  const actual = Object.fromEntries(ACTOR_NAMES.map((name) => [name, check(ACTORS[name])]));
  expect(actual).toEqual(expected);
}

const STAMP = '2026-09-01T08:00:00.000Z';
const stamps = { createdAt: STAMP, updatedAt: STAMP };

function profile(actor: Session, overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    ...stamps,
    id: actor.uid,
    role: actor.role,
    schoolId: actor.schoolId,
    displayName: actor.displayName,
    username: null,
    email: `${actor.uid}@example.com`,
    ageBand: actor.ageBand,
    locale: 'en',
    avatarId: 'robot',
    status: 'active',
    classIds: actor.classIds,
    consentBasis: 'adult',
    provisionedByUid: null,
    verifiedEducator: false,
    sessionsValidAfter: null,
    xpTotal: 0,
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
    ...overrides,
  };
}

/** A username account that `teacher` created in class c1. */
const pupil = profile(ACTORS.student, {
  username: 'lea.m',
  email: null,
  consentBasis: 'school',
  provisionedByUid: 'tea-1',
});

function schoolClass(overrides: Partial<SchoolClass> = {}): SchoolClass {
  return {
    ...stamps,
    id: 'c1',
    schoolId: 's1',
    name: 'Grade 6',
    gradeLabel: null,
    ageBand: '11-12',
    ownerUid: 'tea-1',
    teacherUids: ['tea-1'],
    joinCode: 'ABCDEFGH',
    joinCodeEnabled: false,
    joinCodeExpiresAt: null,
    studentCount: 2,
    assignedCourseIds: [],
    archived: false,
    ...overrides,
  };
}

function course(overrides: Partial<Course> = {}): Course {
  return {
    ...stamps,
    id: 'course-1',
    pathwayId: null,
    order: 0,
    ownerUid: 'tea-1',
    schoolId: 's1',
    isOfficial: false,
    status: 'published',
    visibility: 'private',
    audience: 'student',
    area: 'ai',
    tags: [],
    ageMin: null,
    ageMax: null,
    estimatedMinutes: 30,
    accessTier: 'free',
    certificateEnabled: false,
    coverImage: null,
    hardwarePlatformIds: [],
    requiredCapabilities: [],
    moduleCount: 1,
    lessonCount: 1,
    defaultLocale: 'en',
    translations: { en: { title: 'Course', summary: '', description: '', outcomes: [] } },
    publishedAt: STAMP,
    ...overrides,
  };
}

const officialCourse = (overrides: Partial<Course> = {}) =>
  course({
    ownerUid: 'root-1',
    schoolId: null,
    isOfficial: true,
    visibility: 'public',
    ...overrides,
  });

function submission(overrides: Partial<Submission> = {}): Submission {
  return {
    ...stamps,
    id: 'stu-1_p_course-1_project-1_1',
    studentUid: 'stu-1',
    studentName: 'Lea M',
    schoolId: 's1',
    classId: 'c1',
    context: 'project',
    courseId: 'course-1',
    lessonId: 'l1',
    projectId: 'project-1',
    challengeId: null,
    contextTitle: { en: { title: 'Project' } },
    attemptNumber: 1,
    previousSubmissionId: null,
    title: 'My robot',
    description: '',
    type: 'text',
    content: { text: 'Hello', linkUrl: null, code: null, codeLanguage: null },
    attachments: [],
    locale: 'en',
    status: 'submitted',
    aiReviewStatus: 'ready',
    latestAiReviewId: null,
    aiRegenerations: 0,
    rubric: [],
    finalScore: null,
    finalCriteria: null,
    finalFeedback: null,
    reviewedByUid: null,
    reviewedAt: null,
    xpAwarded: 0,
    effectsApplied: false,
    submittedAt: STAMP,
    ...overrides,
  };
}

const certificate: Certificate = {
  ...stamps,
  id: 'stu-1_course-1',
  userUid: 'stu-1',
  recipientName: 'Lea M',
  type: 'course',
  courseId: 'course-1',
  pathwayId: null,
  courseTitle: { en: { title: 'Course' } },
  isOfficial: false,
  schoolId: 's1',
  schoolName: 'School One',
  issuedBy: 'tea-1',
  issuerName: 'Teacher',
  verificationCode: 'RH-ABCDEFGH23',
  status: 'issued',
  revokedReason: null,
  issuedAt: STAMP,
  revokedAt: null,
};

function challenge(overrides: Partial<Challenge> = {}): Challenge {
  return {
    ...stamps,
    id: 'challenge-1',
    type: 'weekly',
    scope: 'global',
    schoolId: null,
    status: 'published',
    area: 'ai',
    ageMin: null,
    ageMax: null,
    startAt: STAMP,
    deadlineAt: STAMP,
    allowedSubmissionTypes: ['text'],
    rubric: [],
    xpReward: 500,
    coverImage: null,
    hardwarePlatformIds: [],
    requiredCapabilities: [],
    submissionCount: 0,
    createdByUid: 'root-1',
    defaultLocale: 'en',
    translations: {},
    ...overrides,
  };
}

const EVERYONE = ACTOR_NAMES;
const S1_MEMBERS: ActorName[] = ['student', 'classmate', 'teacher', 'colleague', 'schoolAdmin'];

// --- Scopes ------------------------------------------------------------------------------------

describe('scope tests', () => {
  it('hasRole matches the role exactly', () => {
    expectAllowed((actor) => hasRole(actor, 'student'), ['student', 'classmate']);
    expectAllowed(
      (actor) => hasRole(actor, 'teacher', 'school_admin'),
      [
        'teacher',
        'colleague',
        'otherSchoolTeacher',
        'soloTeacher',
        'schoolAdmin',
        'otherSchoolAdmin',
      ],
    );
    expectAllowed((actor) => hasRole(actor), []);
  });

  it('isPlatformAdmin', () => {
    expectAllowed(isPlatformAdmin, ['platformAdmin']);
  });

  it('inSchool needs the same, non-null school on both sides', () => {
    expectAllowed((actor) => inSchool(actor, 's1'), S1_MEMBERS);
    expectAllowed((actor) => inSchool(actor, 's2'), ['otherSchoolTeacher', 'otherSchoolAdmin']);
    // Two school-less parties do not share a school.
    expectAllowed((actor) => inSchool(actor, null), []);
  });

  it('teachesClass needs the teacher role and the class', () => {
    expectAllowed((actor) => teachesClass(actor, 'c1'), ['teacher']);
    expectAllowed((actor) => teachesClass(actor, 'c2'), ['colleague']);
    expectAllowed((actor) => teachesClass(actor, 'c3'), ['soloTeacher']);
    expectAllowed((actor) => teachesClass(actor, null), []);
  });

  it('teachesClass never lets a student through, before or after a promotion', () => {
    expect(ACTORS.student.classIds).toContain('c1');
    expect(teachesClass(ACTORS.student, 'c1')).toBe(false);
    // changeUserRole empties classIds; the classes the user was a member of are gone.
    const promoted: Session = { ...ACTORS.student, role: 'teacher', classIds: [] };
    expect(teachesClass(promoted, 'c1')).toBe(false);
    // A demoted teacher whose classIds somehow survived still fails on the role.
    const demoted: Session = { ...ACTORS.teacher, role: 'student' };
    expect(teachesClass(demoted, 'c1')).toBe(false);
    expect(teachesAnyOf(demoted, ['c1'])).toBe(false);
  });

  it('teachesAnyOf needs the teacher role and one shared class', () => {
    expectAllowed((actor) => teachesAnyOf(actor, ['c7', 'c1']), ['teacher']);
    expectAllowed((actor) => teachesAnyOf(actor, ['c1', 'c2']), ['teacher', 'colleague']);
    expectAllowed((actor) => teachesAnyOf(actor, []), []);
  });
});

// --- Users -------------------------------------------------------------------------------------

describe('canViewUser', () => {
  it('a student: themselves, their teacher, their school admin, a platform admin', () => {
    expectAllowed(
      (actor) => canViewUser(actor, pupil),
      ['student', 'teacher', 'schoolAdmin', 'platformAdmin'],
    );
  });

  it('a teacher is seen by themselves and their school admin, not by colleagues or students', () => {
    expectAllowed(
      (actor) => canViewUser(actor, profile(ACTORS.teacher)),
      ['teacher', 'schoolAdmin', 'platformAdmin'],
    );
  });

  it('sharing class ids with a co-teacher is not "a student in a class I teach"', () => {
    const coTeacher = profile(ACTORS.colleague, { classIds: ['c1', 'c2'] });
    expect(canViewUser(ACTORS.teacher, coTeacher)).toBe(false);
  });

  it('a school-less user is seen by nobody through a school', () => {
    const solo = profile(ACTORS.soloTeacher);
    expectAllowed((actor) => canViewUser(actor, solo), ['soloTeacher', 'platformAdmin']);
  });
});

describe('canManageUser', () => {
  it('a provisioned pupil: the teacher of the class, the school admin, a platform admin', () => {
    expectAllowed(
      (actor) => canManageUser(actor, pupil),
      ['teacher', 'schoolAdmin', 'platformAdmin'],
    );
  });

  it('a teacher manages a same-school pupil of their class whoever created the account', () => {
    expect(canManageUser(ACTORS.teacher, { ...pupil, provisionedByUid: 'adm-1' })).toBe(true);
    expect(canManageUser(ACTORS.teacher, { ...pupil, provisionedByUid: null })).toBe(true);
  });

  it('a teacher cannot manage an email account, even in their class', () => {
    const selfRegistered = profile(ACTORS.student, { username: null });
    expect(canManageUser(ACTORS.teacher, selfRegistered)).toBe(false);
  });

  it('a teacher cannot manage a pupil of their school who is in another class', () => {
    expect(canManageUser(ACTORS.teacher, { ...pupil, classIds: ['c2'] })).toBe(false);
    expect(canManageUser(ACTORS.colleague, pupil)).toBe(false);
  });

  it('a teacher cannot manage a student of another school who joined their class', () => {
    const visitor: UserProfile = {
      ...pupil,
      id: 'stu-7',
      schoolId: 's2',
      classIds: ['c1'],
      provisionedByUid: 'tea-9',
    };
    expect(teachesAnyOf(ACTORS.teacher, visitor.classIds)).toBe(true);
    expect(canManageUser(ACTORS.teacher, visitor)).toBe(false);
    // The school-less teacher is in the same position towards any school's pupil…
    const inSoloClass = { ...visitor, classIds: ['c3'] };
    expect(canManageUser(ACTORS.soloTeacher, inSoloClass)).toBe(false);
    // …but manages the accounts they created themselves.
    const own = { ...inSoloClass, schoolId: null, provisionedByUid: 'tea-3' };
    expect(canManageUser(ACTORS.soloTeacher, own)).toBe(true);
    // Two school-less parties do not count as "the same school".
    expect(canManageUser(ACTORS.soloTeacher, { ...own, provisionedByUid: 'tea-8' })).toBe(false);
  });

  it('a teacher cannot manage another teacher', () => {
    const coTeacher = profile(ACTORS.colleague, { classIds: ['c1'], username: 'col.league' });
    expect(canManageUser(ACTORS.teacher, coTeacher)).toBe(false);
  });

  it('a school admin manages the teachers and students of their own school only', () => {
    expectAllowed(
      (actor) => canManageUser(actor, profile(ACTORS.teacher)),
      ['schoolAdmin', 'platformAdmin'],
    );
    expectAllowed(
      (actor) => canManageUser(actor, profile(ACTORS.otherSchoolTeacher)),
      ['otherSchoolAdmin', 'platformAdmin'],
    );
    // Not a fellow school admin, not themselves, not a platform admin, not a school-less user.
    const fellow = profile(session('adm-3', 'school_admin', 's1', []));
    expect(canManageUser(ACTORS.schoolAdmin, fellow)).toBe(false);
    expect(canManageUser(ACTORS.schoolAdmin, profile(ACTORS.schoolAdmin))).toBe(false);
    expect(canManageUser(ACTORS.schoolAdmin, profile(ACTORS.platformAdmin))).toBe(false);
    expect(canManageUser(ACTORS.schoolAdmin, profile(ACTORS.soloTeacher))).toBe(false);
  });

  it('students manage nobody, themselves included', () => {
    expect(canManageUser(ACTORS.student, pupil)).toBe(false);
    expect(canManageUser(ACTORS.classmate, pupil)).toBe(false);
  });
});

describe('canAssignRole', () => {
  const humans = ACTOR_NAMES.filter((name) => name !== 'system');

  it('nobody can change their own role', () => {
    for (const name of humans) {
      const actor = ACTORS[name] as Session;
      for (const role of ROLES) {
        expect([name, role, canAssignRole(actor, profile(actor), role, actor.schoolId)]).toEqual([
          name,
          role,
          false,
        ]);
      }
    }
  });

  it('a platform admin assigns any role to anyone else', () => {
    for (const role of ROLES) {
      expect(canAssignRole(ACTORS.platformAdmin, pupil, role, null)).toBe(true);
      expect(canAssignRole(ACTORS.platformAdmin, profile(ACTORS.schoolAdmin), role, 's2')).toBe(
        true,
      );
    }
  });

  it('a school admin moves their own people between student and teacher, inside the school', () => {
    const admin = ACTORS.schoolAdmin;
    expect(canAssignRole(admin, pupil, 'teacher', 's1')).toBe(true);
    expect(canAssignRole(admin, profile(ACTORS.teacher), 'student', 's1')).toBe(true);
  });

  it('a school admin cannot assign school_admin, platform_admin or another school', () => {
    const admin = ACTORS.schoolAdmin;
    expect(canAssignRole(admin, pupil, 'school_admin', 's1')).toBe(false);
    expect(canAssignRole(admin, pupil, 'platform_admin', null)).toBe(false);
    expect(canAssignRole(admin, pupil, 'platform_admin', 's1')).toBe(false);
    expect(canAssignRole(admin, pupil, 'teacher', 's2')).toBe(false);
    expect(canAssignRole(admin, pupil, 'teacher', null)).toBe(false);
  });

  it('a school admin cannot touch people outside their school or other admins', () => {
    const admin = ACTORS.schoolAdmin;
    expect(canAssignRole(admin, profile(ACTORS.otherSchoolTeacher), 'student', 's1')).toBe(false);
    expect(canAssignRole(admin, profile(ACTORS.soloTeacher), 'teacher', 's1')).toBe(false);
    const fellow = profile(session('adm-3', 'school_admin', 's1', []));
    expect(canAssignRole(admin, fellow, 'teacher', 's1')).toBe(false);
  });

  it('teachers and students assign nothing', () => {
    expectAllowed(
      (actor) => canAssignRole(actor, profile(ACTORS.classmate), 'teacher', 's1'),
      ['schoolAdmin', 'platformAdmin'],
    );
  });
});

// --- Schools and classes -----------------------------------------------------------------------

describe('schools', () => {
  it('canViewSchool: every member of the school', () => {
    expectAllowed((actor) => canViewSchool(actor, 's1'), [...S1_MEMBERS, 'platformAdmin']);
  });

  it('canManageSchool: its school admin', () => {
    expectAllowed((actor) => canManageSchool(actor, 's1'), ['schoolAdmin', 'platformAdmin']);
    expectAllowed((actor) => canManageSchool(actor, 's2'), ['otherSchoolAdmin', 'platformAdmin']);
  });
});

describe('classes', () => {
  it('canViewClass: its teachers, its students, the school admin', () => {
    expectAllowed(
      (actor) => canViewClass(actor, schoolClass()),
      ['student', 'classmate', 'teacher', 'schoolAdmin', 'platformAdmin'],
    );
  });

  it('canManageClass: its teachers and the school admin, never a student', () => {
    expectAllowed(
      (actor) => canManageClass(actor, schoolClass()),
      ['teacher', 'schoolAdmin', 'platformAdmin'],
    );
  });

  it('another class of the same school is closed to the teacher and students of c1', () => {
    const c2 = schoolClass({ id: 'c2', ownerUid: 'tea-2', teacherUids: ['tea-2'] });
    expectAllowed(
      (actor) => canViewClass(actor, c2),
      ['colleague', 'schoolAdmin', 'platformAdmin'],
    );
    expectAllowed(
      (actor) => canManageClass(actor, c2),
      ['colleague', 'schoolAdmin', 'platformAdmin'],
    );
  });

  it('a co-teacher listed in teacherUids manages the class', () => {
    const shared = schoolClass({ teacherUids: ['tea-1', 'tea-2'] });
    expect(canManageClass(ACTORS.colleague, shared)).toBe(true);
  });

  it('teacherUids decides, not the session: a removed teacher is out', () => {
    const reassigned = schoolClass({ ownerUid: 'tea-2', teacherUids: ['tea-2'] });
    expect(ACTORS.teacher.classIds).toContain(reassigned.id);
    expect(canManageClass(ACTORS.teacher, reassigned)).toBe(false);
    expect(canViewClass(ACTORS.teacher, reassigned)).toBe(false);
  });

  it('a former teacher who is now a student does not manage the class', () => {
    const demoted: Session = { ...ACTORS.teacher, role: 'student', classIds: [] };
    expect(canManageClass(demoted, schoolClass())).toBe(false);
  });

  it('a school-less class belongs to its teacher alone', () => {
    const c3 = schoolClass({ id: 'c3', schoolId: null, ownerUid: 'tea-3', teacherUids: ['tea-3'] });
    expectAllowed((actor) => canManageClass(actor, c3), ['soloTeacher', 'platformAdmin']);
    expectAllowed((actor) => canViewClass(actor, c3), ['soloTeacher', 'platformAdmin']);
  });
});

// --- Courses -----------------------------------------------------------------------------------

describe('canViewCourse', () => {
  const notEnrolled = { enrolled: false };

  it('a published official student course is open to everyone', () => {
    expectAllowed((actor) => canViewCourse(actor, officialCourse(), notEnrolled), EVERYONE);
  });

  it('a published official teacher course is closed to students', () => {
    const academy = officialCourse({ audience: 'teacher' });
    expectAllowed(
      (actor) => canViewCourse(actor, academy, notEnrolled),
      EVERYONE.filter((name) => name !== 'student' && name !== 'classmate'),
    );
    expect(canViewCourse(ACTORS.student, academy, { enrolled: true })).toBe(false);
  });

  it('an unpublished official course is for platform admins only', () => {
    for (const status of ['draft', 'archived'] as const) {
      expectAllowed(
        (actor) => canViewCourse(actor, officialCourse({ status }), notEnrolled),
        ['platformAdmin'],
      );
    }
  });

  it('a private teacher-made course: its owner and the school admin of its school', () => {
    expectAllowed(
      (actor) => canViewCourse(actor, course(), notEnrolled),
      ['teacher', 'schoolAdmin', 'platformAdmin'],
    );
  });

  it('visibility "school" adds the teachers of that school, not its students', () => {
    expectAllowed(
      (actor) => canViewCourse(actor, course({ visibility: 'school' }), notEnrolled),
      ['teacher', 'colleague', 'schoolAdmin', 'platformAdmin'],
    );
  });

  it('an enrollment opens a teacher-made course to the learner', () => {
    expect(canViewCourse(ACTORS.student, course(), { enrolled: true })).toBe(true);
    expect(canViewCourse(ACTORS.classmate, course(), notEnrolled)).toBe(false);
  });

  it("a school-less teacher's course is shared with no school", () => {
    const solo = course({ ownerUid: 'tea-3', schoolId: null, visibility: 'school' });
    expectAllowed(
      (actor) => canViewCourse(actor, solo, notEnrolled),
      ['soloTeacher', 'platformAdmin'],
    );
  });
});

describe('canEditCourse', () => {
  it('a teacher-made course: its owner', () => {
    expectAllowed((actor) => canEditCourse(actor, course()), ['teacher', 'platformAdmin']);
    expectAllowed(
      (actor) => canEditCourse(actor, course({ visibility: 'school' })),
      ['teacher', 'platformAdmin'],
    );
  });

  it('an official course: platform admins only, whoever owns it', () => {
    expectAllowed((actor) => canEditCourse(actor, officialCourse()), ['platformAdmin']);
    expect(canEditCourse(ACTORS.teacher, officialCourse({ ownerUid: 'tea-1' }))).toBe(false);
  });

  it('an owner who is no longer a teacher cannot edit', () => {
    const demoted: Session = { ...ACTORS.teacher, role: 'student' };
    expect(canEditCourse(demoted, course())).toBe(false);
  });
});

// --- Learner records ---------------------------------------------------------------------------

describe('canViewLearnerRecord', () => {
  const record = { userUid: 'stu-1', schoolId: 's1', classId: 'c1' };

  it('the learner, the teacher of the class, the school admin', () => {
    expectAllowed(
      (actor) => canViewLearnerRecord(actor, record),
      ['student', 'teacher', 'schoolAdmin', 'platformAdmin'],
    );
  });

  it("a teacher does not see the same student's record from another class", () => {
    const elsewhere = { ...record, classId: 'c2' };
    expect(canViewLearnerRecord(ACTORS.teacher, elsewhere)).toBe(false);
    expect(canViewLearnerRecord(ACTORS.colleague, elsewhere)).toBe(true);
  });

  it('an unsupervised record is the learner’s own (and the school admin’s, if it has a school)', () => {
    expectAllowed(
      (actor) => canViewLearnerRecord(actor, { ...record, classId: null }),
      ['student', 'schoolAdmin', 'platformAdmin'],
    );
    expectAllowed(
      (actor) => canViewLearnerRecord(actor, { userUid: 'stu-1', schoolId: null, classId: null }),
      ['student', 'platformAdmin'],
    );
  });

  it('a record of another school is closed to this school', () => {
    const foreign = { userUid: 'stu-7', schoolId: 's2', classId: 'c9' };
    expectAllowed(
      (actor) => canViewLearnerRecord(actor, foreign),
      ['otherSchoolTeacher', 'otherSchoolAdmin', 'platformAdmin'],
    );
  });
});

describe('submissions', () => {
  it('canViewSubmission: the student, the teacher of the class, the school admin', () => {
    expectAllowed(
      (actor) => canViewSubmission(actor, submission()),
      ['student', 'teacher', 'schoolAdmin', 'platformAdmin'],
    );
  });

  it('canViewSubmission: not across classes or schools', () => {
    expectAllowed(
      (actor) => canViewSubmission(actor, submission({ classId: 'c2' })),
      ['student', 'colleague', 'schoolAdmin', 'platformAdmin'],
    );
    expectAllowed(
      (actor) =>
        canViewSubmission(
          actor,
          submission({ studentUid: 'stu-7', schoolId: 's2', classId: 'c9' }),
        ),
      ['otherSchoolTeacher', 'otherSchoolAdmin', 'platformAdmin'],
    );
  });

  it('canReviewSubmission: the teacher of the class; a school admin only reads', () => {
    expectAllowed(
      (actor) => canReviewSubmission(actor, submission()),
      ['teacher', 'platformAdmin'],
    );
    expectAllowed(
      (actor) => canReviewSubmission(actor, submission({ classId: 'c2' })),
      ['colleague', 'platformAdmin'],
    );
  });

  it('canReviewSubmission: an unsupervised submission has no reviewing teacher', () => {
    expectAllowed(
      (actor) => canReviewSubmission(actor, submission({ classId: null })),
      ['platformAdmin'],
    );
  });

  it('canViewAiReview: reviewers only while a teacher supervises', () => {
    expectAllowed((actor) => canViewAiReview(actor, submission()), ['teacher', 'platformAdmin']);
  });

  it('canViewAiReview: the owner in the unsupervised flow', () => {
    const unsupervised = submission({ classId: null, schoolId: null });
    expectAllowed((actor) => canViewAiReview(actor, unsupervised), ['student', 'platformAdmin']);
  });
});

// --- Certificates and challenges ---------------------------------------------------------------

describe('certificates', () => {
  it('canIssueCertificate: a teacher of a class the student is in', () => {
    expectAllowed((actor) => canIssueCertificate(actor, pupil), ['teacher', 'platformAdmin']);
    expectAllowed(
      (actor) => canIssueCertificate(actor, { ...pupil, classIds: ['c1', 'c2'] }),
      ['teacher', 'colleague', 'platformAdmin'],
    );
  });

  it('canIssueCertificate: a co-teacher is not a student of the class', () => {
    const coTeacher = profile(ACTORS.colleague, { classIds: ['c1', 'c2'] });
    expectAllowed((actor) => canIssueCertificate(actor, coTeacher), ['platformAdmin']);
  });

  it('canViewCertificate: the holder and the school admin', () => {
    // The holder's teacher gets in through canViewUser, which the caller checks.
    expectAllowed(
      (actor) => canViewCertificate(actor, certificate),
      ['student', 'schoolAdmin', 'platformAdmin'],
    );
    expectAllowed(
      (actor) => canViewCertificate(actor, { ...certificate, schoolId: null }),
      ['student', 'platformAdmin'],
    );
  });
});

describe('canViewChallenge', () => {
  it('a published global challenge is open to everyone', () => {
    expectAllowed((actor) => canViewChallenge(actor, challenge()), EVERYONE);
  });

  it('a published school challenge is open to that school', () => {
    const school = challenge({ scope: 'school', schoolId: 's1' });
    expectAllowed((actor) => canViewChallenge(actor, school), [...S1_MEMBERS, 'platformAdmin']);
  });

  it('a draft or archived challenge is for platform admins only', () => {
    for (const status of ['draft', 'archived'] as const) {
      expectAllowed((actor) => canViewChallenge(actor, challenge({ status })), ['platformAdmin']);
      expectAllowed(
        (actor) => canViewChallenge(actor, challenge({ status, scope: 'school', schoolId: 's1' })),
        ['platformAdmin'],
      );
    }
  });
});

// --- Assertions and the system actor -----------------------------------------------------------

describe('assertions', () => {
  it('assertRole throws ForbiddenError unless the role matches', () => {
    expect(() => assertRole(ACTORS.teacher, 'teacher', 'platform_admin')).not.toThrow();
    expect(() => assertRole(SYSTEM_ACTOR, 'platform_admin')).not.toThrow();
    expect(() => assertRole(ACTORS.student, 'teacher')).toThrow(ForbiddenError);
  });

  it('assertCan throws ForbiddenError naming the operation', () => {
    expect(() => assertCan(true, 'submission.view')).not.toThrow();
    expect(() => assertCan(false, 'submission.view')).toThrow(ForbiddenError);
    expect(() => assertCan(false, 'submission.view')).toThrow('submission.view');
  });
});

describe('the system actor', () => {
  it('is told apart from every session', () => {
    expect(isSystem(SYSTEM_ACTOR)).toBe(true);
    expect(SYSTEM_ACTOR).toEqual({ system: true, reason: 'system' });
    expect(Object.isFrozen(SYSTEM_ACTOR)).toBe(true);
    for (const name of ACTOR_NAMES) expect(isSystem(ACTORS[name])).toBe(name === 'system');
  });

  it('assertSystem lets only the system through', () => {
    expect(() => assertSystem(SYSTEM_ACTOR)).not.toThrow();
    expect(() => assertSystem(ACTORS.platformAdmin)).toThrow(ForbiddenError);
    expect(() => assertSystem(ACTORS.student)).toThrow(ForbiddenError);
  });
});

// --- Roles, redirects, capabilities ------------------------------------------------------------

describe('roles', () => {
  it('every role has a home, and staff is everyone but students', () => {
    expect(ROLES.map(roleHome)).toEqual(['/student', '/teacher', '/school', '/admin']);
    expect(STAFF_ROLES).toEqual(['teacher', 'school_admin', 'platform_admin']);
    expect(ROLES.filter(isStaffRole)).toEqual(STAFF_ROLES);
  });
});

describe('safeNextPath', () => {
  it("keeps a path inside the role's own area", () => {
    expect(safeNextPath('/teacher/classes/abc-123', 'teacher')).toBe('/teacher/classes/abc-123');
    expect(safeNextPath('/student', 'student')).toBe('/student');
    expect(safeNextPath('/school/analytics', 'school_admin')).toBe('/school/analytics');
    expect(safeNextPath('/admin/schools/s1', 'platform_admin')).toBe('/admin/schools/s1');
  });

  it('keeps a path inside a shared area, for every role', () => {
    for (const role of ROLES) {
      expect(safeNextPath('/certificates/stu-1_course-1', role)).toBe(
        '/certificates/stu-1_course-1',
      );
      expect(safeNextPath('/preview/course-1/lessons/l1', role)).toBe(
        '/preview/course-1/lessons/l1',
      );
    }
  });

  it("falls back to the role's home for another area, or none", () => {
    expect(safeNextPath('/admin/users', 'student')).toBe('/student');
    expect(safeNextPath('/student/learn', 'teacher')).toBe('/teacher');
    expect(safeNextPath('/schoolyard', 'school_admin')).toBe('/school');
    expect(safeNextPath('/students', 'student')).toBe('/student');
    expect(safeNextPath('/certificates', 'student')).toBe('/student');
    expect(safeNextPath('/login', 'teacher')).toBe('/teacher');
    expect(safeNextPath('/', 'teacher')).toBe('/teacher');
    expect(safeNextPath('/en/student/learn', 'student')).toBe('/student');
    expect(safeNextPath(null, 'student')).toBe('/student');
    expect(safeNextPath(undefined, 'platform_admin')).toBe('/admin');
    expect(safeNextPath('', 'teacher')).toBe('/teacher');
  });

  it.each([
    'https://evil.example/student',
    '//evil.example/student',
    '/\\evil.example',
    '/student//evil.example',
    '/student/\\evil.example',
    '\\student',
    'student/learn',
    'javascript:alert(1)',
    '/student/../admin',
    '/student/./learn',
    '/student/%2e%2e/admin',
    '/student/%2F%2Fevil.example',
    '/student/learn?next=https://evil.example',
    '/student/learn#https://evil.example',
    '/student/learn\n/evil',
    '/student/learn\u0000',
    '/student/ learn',
    '/student/learn/',
    '/student/http:evil',
    '/student@evil.example',
  ])('refuses %j', (next) => {
    expect(safeNextPath(next, 'student')).toBe('/student');
  });
});

describe('capabilities', () => {
  it('follow the permissions matrix', () => {
    expect(hasCapability('student', 'learn')).toBe(true);
    expect(hasCapability('student', 'lab.use')).toBe(true);
    expect(hasCapability('student', 'class.manage')).toBe(false);
    expect(hasCapability('teacher', 'submission.review')).toBe(true);
    expect(hasCapability('teacher', 'tutor.use')).toBe(true);
    expect(hasCapability('teacher', 'lab.use')).toBe(false);
    expect(hasCapability('teacher', 'project.submit')).toBe(false);
    expect(hasCapability('teacher', 'teacher.manage')).toBe(false);
    expect(hasCapability('school_admin', 'teacher.manage')).toBe(true);
    expect(hasCapability('school_admin', 'submission.review')).toBe(false);
    expect(hasCapability('school_admin', 'certificate.issue')).toBe(false);
    expect(hasCapability('school_admin', 'learn')).toBe(false);
    expect(hasCapability('platform_admin', 'platform.manage')).toBe(true);
    expect(hasCapability('platform_admin', 'learn')).toBe(false);
  });

  it('only a platform admin manages the platform, and no list repeats itself', () => {
    for (const role of ROLES) {
      expect(hasCapability(role, 'platform.manage')).toBe(role === 'platform_admin');
      expect(new Set(ROLE_CAPABILITIES[role]).size).toBe(ROLE_CAPABILITIES[role].length);
    }
  });
});

// --- The session cookie ------------------------------------------------------------------------

describe('the session cookie name', () => {
  // src/proxy.ts cannot import the server-only session module, so each file spells the name
  // out. Compared as text, because the proxy does not export its copy.
  it('is __session in the session module and in the proxy', () => {
    const source = (path: string) =>
      readFileSync(new URL(`../../src/${path}`, import.meta.url), 'utf8');
    expect(source('lib/auth/session.ts')).toContain(
      "export const SESSION_COOKIE_NAME = '__session';",
    );
    expect(source('proxy.ts')).toContain("const SESSION_COOKIE = '__session';");
  });
});
