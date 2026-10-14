import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SYSTEM_ACTOR } from '@/lib/auth/actor';
import { writeAudit } from '@/lib/data/audit';
import { getBadge } from '@/lib/data/badges';
import { getCertificate } from '@/lib/data/certificates';
import { getClass } from '@/lib/data/classes';
import { getCourse } from '@/lib/data/courses';
import { getEnrollment } from '@/lib/data/enrollments';
import { getUser } from '@/lib/data/users';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { awardBadge } from '@/lib/gamification/award';
import { issueCertificateFor, revokeCertificateById } from '@/lib/gamification/certificates';
import { awardManualBadge, issueCertificate, revokeCertificate } from '@/lib/services/recognition';
import {
  badge,
  certificate,
  course,
  enrollment,
  profile,
  schoolClass,
  session,
} from './services-fixtures';

// services/recognition over mocked repositories: the conditions of 9.3 and 9.5 for issuing and
// revoking a certificate and awarding a manual badge, and the audit entry each one writes.

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(() => {
    throw new Error('Firestore was reached.');
  }),
}));
vi.mock('@/lib/data/audit', () => ({ writeAudit: vi.fn() }));
vi.mock('@/lib/data/badges', () => ({ getBadge: vi.fn() }));
vi.mock('@/lib/data/certificates', () => ({ getCertificate: vi.fn() }));
vi.mock('@/lib/data/classes', () => ({ getClass: vi.fn() }));
vi.mock('@/lib/data/courses', () => ({ getCourse: vi.fn() }));
vi.mock('@/lib/data/enrollments', () => ({ getEnrollment: vi.fn() }));
vi.mock('@/lib/data/users', () => ({ getUser: vi.fn() }));
vi.mock('@/lib/gamification/award', () => ({ awardBadge: vi.fn() }));
vi.mock('@/lib/gamification/certificates', () => ({
  issueCertificateFor: vi.fn(),
  revokeCertificateById: vi.fn(),
}));

const teacher = session('teacher', 'teacher-1', 'school-a', ['class-a', 'class-b']);
const otherTeacher = session('teacher', 'teacher-2', 'school-a', ['class-c']);
const platformAdmin = session('platform_admin', 'root');
const student = session('student', 'student-1', 'school-a', ['class-a']);

const pupil = profile({ id: 'student-1', schoolId: 'school-a', classIds: ['class-a'] });
const officialCourse = course({ id: 'course-1' });
const ownCourse = course({
  id: 'course-t',
  isOfficial: false,
  ownerUid: 'teacher-1',
  schoolId: 'school-a',
  visibility: 'school',
  pathwayId: null,
});
const classA = schoolClass({ id: 'class-a', assignedCourseIds: ['course-1', 'course-t'] });
const classB = schoolClass({ id: 'class-b' });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getUser).mockImplementation(async (_actor, uid) => {
    if (uid === 'student-1') return pupil;
    throw new NotFoundError(`users/${uid}`);
  });
  vi.mocked(getCourse).mockImplementation(async (_actor, courseId) => {
    if (courseId === 'course-1') return officialCourse;
    if (courseId === 'course-t') return ownCourse;
    throw new NotFoundError(`courses/${courseId}`);
  });
  vi.mocked(getClass).mockImplementation(async (_actor, classId) => {
    if (classId === 'class-a') return classA;
    if (classId === 'class-b') return classB;
    throw new NotFoundError(`classes/${classId}`);
  });
  vi.mocked(getEnrollment).mockImplementation(async (_actor, userUid, courseId) =>
    enrollment({
      userUid,
      courseId,
      classId: 'class-a',
      schoolId: 'school-a',
      status: 'completed',
    }),
  );
  vi.mocked(issueCertificateFor).mockImplementation(async (uid, courseId, issuer) =>
    certificate({ id: `${uid}_${courseId}`, userUid: uid, courseId, issuedBy: issuer.uid }),
  );
  vi.mocked(getBadge).mockResolvedValue(badge({ id: 'responsible-ai-champion' }));
  vi.mocked(awardBadge).mockResolvedValue({ awarded: true });
});

// --- issueCertificate -------------------------------------------------------------------------

describe('issueCertificate', () => {
  it('lets the teacher of a class that assigns the course issue it, and audits it', async () => {
    const issued = await issueCertificate(teacher, {
      studentUid: 'student-1',
      courseId: 'course-1',
    });
    expect(issueCertificateFor).toHaveBeenCalledWith('student-1', 'course-1', {
      uid: 'teacher-1',
      name: 'Name of teacher-1',
    });
    expect(getEnrollment).toHaveBeenCalledWith(SYSTEM_ACTOR, 'student-1', 'course-1');
    expect(issued.id).toBe('student-1_course-1');
    expect(writeAudit).toHaveBeenCalledWith(teacher, {
      action: 'certificate.issued',
      targetType: 'certificate',
      targetId: 'student-1_course-1',
      schoolId: 'school-a',
      meta: { studentUid: 'student-1', courseId: 'course-1' },
    });
  });

  it('withholds a student the teacher does not teach as not found', async () => {
    await expect(
      issueCertificate(otherTeacher, { studentUid: 'student-1', courseId: 'course-1' }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      issueCertificate(teacher, { studentUid: 'ghost', courseId: 'course-1' }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(issueCertificateFor).not.toHaveBeenCalled();
  });

  it('requires the course to be assigned to a class the teacher shares with the student', async () => {
    vi.mocked(getClass).mockResolvedValue(schoolClass({ id: 'class-a', assignedCourseIds: [] }));
    await expect(
      issueCertificate(teacher, { studentUid: 'student-1', courseId: 'course-1' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('requires a completed enrollment for an official course, not for a teacher-made one', async () => {
    vi.mocked(getEnrollment).mockImplementation(async (_actor, userUid, courseId) =>
      enrollment({ userUid, courseId, classId: 'class-a', schoolId: 'school-a' }),
    );
    await expect(
      issueCertificate(teacher, { studentUid: 'student-1', courseId: 'course-1' }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      issueCertificate(teacher, { studentUid: 'student-1', courseId: 'course-t' }),
    ).resolves.toMatchObject({ courseId: 'course-t' });
  });

  it('refuses a course that gives no certificate, and needs an enrollment', async () => {
    vi.mocked(getCourse).mockResolvedValueOnce(
      course({ id: 'course-1', certificateEnabled: false }),
    );
    await expect(
      issueCertificate(teacher, { studentUid: 'student-1', courseId: 'course-1' }),
    ).rejects.toBeInstanceOf(ConflictError);
    vi.mocked(getEnrollment).mockResolvedValueOnce(null);
    await expect(
      issueCertificate(teacher, { studentUid: 'student-1', courseId: 'course-1' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lets a platform admin issue with an enrollment alone', async () => {
    vi.mocked(getEnrollment).mockResolvedValueOnce(
      enrollment({ userUid: 'student-1', courseId: 'course-1' }),
    );
    vi.mocked(getCourse).mockResolvedValueOnce(
      course({ id: 'course-1', certificateEnabled: false }),
    );
    await issueCertificate(platformAdmin, { studentUid: 'student-1', courseId: 'course-1' });
    expect(getClass).not.toHaveBeenCalled();
    expect(issueCertificateFor).toHaveBeenCalledWith('student-1', 'course-1', {
      uid: 'root',
      name: 'Name of root',
    });
  });

  it('refuses students, the system and a malformed input', async () => {
    await expect(
      issueCertificate(student, { studentUid: 'student-1', courseId: 'course-1' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      issueCertificate(SYSTEM_ACTOR, { studentUid: 'student-1', courseId: 'course-1' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      issueCertificate(teacher, { studentUid: 'student 1', courseId: 'course-1' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

// --- revokeCertificate ------------------------------------------------------------------------

describe('revokeCertificate', () => {
  beforeEach(() => {
    vi.mocked(getCertificate).mockResolvedValue(certificate({ id: 'student-1_course-1' }));
  });

  it('lets the issuing teacher or a platform admin revoke, with the reason in the audit entry', async () => {
    await revokeCertificate(teacher, 'student-1_course-1', 'Issued by mistake');
    expect(revokeCertificateById).toHaveBeenCalledWith(
      'student-1_course-1',
      'Issued by mistake',
      'teacher-1',
    );
    expect(writeAudit).toHaveBeenCalledWith(teacher, {
      action: 'certificate.revoked',
      targetType: 'certificate',
      targetId: 'student-1_course-1',
      schoolId: 'school-a',
      meta: { studentUid: 'student-1', courseId: 'course-1', reason: 'Issued by mistake' },
    });
    await revokeCertificate(platformAdmin, 'student-1_course-1', 'Policy');
    expect(revokeCertificateById).toHaveBeenCalledTimes(2);
  });

  it('refuses another teacher, a blank reason and the system', async () => {
    await expect(
      revokeCertificate(otherTeacher, 'student-1_course-1', 'Not mine'),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(revokeCertificate(teacher, 'student-1_course-1', '   ')).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(revokeCertificate(SYSTEM_ACTOR, 'student-1_course-1', 'x')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(revokeCertificateById).not.toHaveBeenCalled();
  });

  it('changes nothing for a certificate that is already revoked', async () => {
    vi.mocked(getCertificate).mockResolvedValue(
      certificate({ id: 'student-1_course-1', status: 'revoked' }),
    );
    await revokeCertificate(teacher, 'student-1_course-1', 'Again');
    expect(revokeCertificateById).not.toHaveBeenCalled();
    expect(writeAudit).not.toHaveBeenCalled();
  });
});

// --- awardManualBadge -------------------------------------------------------------------------

describe('awardManualBadge', () => {
  it('awards an active manual badge to a student of the teacher, and audits it', async () => {
    const result = await awardManualBadge(teacher, {
      studentUid: 'student-1',
      badgeId: 'responsible-ai-champion',
      note: 'Great debate',
    });
    expect(result).toEqual({ awarded: true });
    expect(awardBadge).toHaveBeenCalledWith(
      'student-1',
      'responsible-ai-champion',
      'teacher-1',
      'Great debate',
    );
    expect(writeAudit).toHaveBeenCalledWith(teacher, {
      action: 'badge.awarded',
      targetType: 'user',
      targetId: 'student-1',
      schoolId: 'school-a',
      meta: { badgeId: 'responsible-ai-champion', note: 'Great debate' },
    });
  });

  it('writes no audit entry when the student already holds the badge', async () => {
    vi.mocked(awardBadge).mockResolvedValue({ awarded: false });
    const result = await awardManualBadge(platformAdmin, {
      studentUid: 'student-1',
      badgeId: 'responsible-ai-champion',
      note: null,
    });
    expect(result).toEqual({ awarded: false });
    expect(awardBadge).toHaveBeenCalledWith(
      'student-1',
      'responsible-ai-champion',
      'root',
      undefined,
    );
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it('refuses a badge that is inactive or not manual', async () => {
    vi.mocked(getBadge).mockResolvedValueOnce(badge({ id: 'x', isActive: false }));
    await expect(
      awardManualBadge(teacher, { studentUid: 'student-1', badgeId: 'x', note: null }),
    ).rejects.toBeInstanceOf(ConflictError);
    vi.mocked(getBadge).mockResolvedValueOnce(
      badge({
        id: 'data-detective',
        criteria: { type: 'stat_threshold', stat: 'quizzesPassed', threshold: 5 },
      }),
    );
    await expect(
      awardManualBadge(teacher, { studentUid: 'student-1', badgeId: 'data-detective', note: null }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(awardBadge).not.toHaveBeenCalled();
  });

  it('withholds a student the teacher does not teach, and refuses students', async () => {
    await expect(
      awardManualBadge(otherTeacher, {
        studentUid: 'student-1',
        badgeId: 'responsible-ai-champion',
        note: null,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      awardManualBadge(student, {
        studentUid: 'student-1',
        badgeId: 'responsible-ai-champion',
        note: null,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(awardBadge).not.toHaveBeenCalled();
  });
});
