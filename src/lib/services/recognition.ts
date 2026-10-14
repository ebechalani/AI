import 'server-only';
import { SYSTEM_ACTOR, type Actor, type Session } from '@/lib/auth/actor';
import {
  assertCan,
  assertRole,
  canIssueCertificate,
  isPlatformAdmin,
  teachesAnyOf,
} from '@/lib/auth/authz';
import { writeAudit } from '@/lib/data/audit';
import { getBadge } from '@/lib/data/badges';
import { getCertificate } from '@/lib/data/certificates';
import { getClass } from '@/lib/data/classes';
import { getCourse } from '@/lib/data/courses';
import { getEnrollment } from '@/lib/data/enrollments';
import { getUser } from '@/lib/data/users';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors';
import { awardBadge } from '@/lib/gamification/award';
import { issueCertificateFor, revokeCertificateById } from '@/lib/gamification/certificates';
import { awardBadgeInputSchema } from '@/lib/schemas/class';
import {
  issueCertificateInputSchema,
  revokeCertificateInputSchema,
} from '@/lib/schemas/certificate';
import { parseInput } from '@/lib/schemas/common';
import type { Certificate } from '@/types/gamification';
import type { UserProfile } from '@/types/user';
import { orNullIfMissing, requireSessionActor } from './internal-common';

// The three things a person does for a learner's recognition (ARCHITECTURE.md 9.3, 9.5, 10.3):
// issue a certificate, revoke one, award a manual badge. Each authorizes, then calls the
// internal gamification function and writes the audit entry.

/**
 * A student as a teacher may name them: one in a class the teacher teaches. The profile is
 * read as the system (data/users.getUser refuses teachers) and withheld as "not found" when
 * the predicate fails, so a uid cannot be probed.
 */
async function loadStudentFor(
  actor: Actor,
  studentUid: string,
  allowed: (student: UserProfile) => boolean,
): Promise<UserProfile> {
  const student = await orNullIfMissing(getUser(SYSTEM_ACTOR, studentUid));
  if (student === null || !allowed(student)) {
    throw new NotFoundError(`users/${studentUid} does not exist.`);
  }
  return student;
}

/** Whether a class the teacher shares with the student has the course assigned (9.5). */
async function sharesClassAssigning(
  teacher: Session,
  student: UserProfile,
  courseId: string,
): Promise<boolean> {
  const shared = student.classIds.filter((classId) => teacher.classIds.includes(classId));
  const classes = await Promise.all(
    shared.map((classId) => orNullIfMissing(getClass(teacher, classId))),
  );
  return classes.some((cls) => cls !== null && cls.assignedCourseIds.includes(courseId));
}

/**
 * A teacher issues the course certificate to a student of a class they teach, to which the
 * course is assigned; for an official course only once the enrollment is completed, and only
 * when the course gives certificates. A platform admin needs the enrollment alone. Issuing an
 * issued certificate returns it unchanged; a revoked one is issued again (9.5).
 */
export async function issueCertificate(
  actor: Actor,
  input: { studentUid: string; courseId: string },
): Promise<Certificate> {
  const session = requireSessionActor(actor, 'certificate.issue');
  assertRole(actor, 'teacher', 'platform_admin');
  const parsed = parseInput(issueCertificateInputSchema, input);
  if (!parsed.success) throw new ValidationError('Invalid request.', parsed.fieldErrors);
  const { studentUid, courseId } = parsed.data;

  const student = await loadStudentFor(actor, studentUid, (profile) =>
    canIssueCertificate(actor, profile),
  );
  const [course, enrollment] = await Promise.all([
    getCourse(actor, courseId),
    getEnrollment(SYSTEM_ACTOR, studentUid, courseId),
  ]);
  if (enrollment === null) {
    throw new NotFoundError(`users/${studentUid} is not enrolled in courses/${courseId}.`);
  }
  if (!isPlatformAdmin(actor)) {
    assertCan(await sharesClassAssigning(session, student, courseId), 'certificate.issue');
    if (!course.certificateEnabled) {
      throw new ConflictError(`courses/${courseId} gives no certificate.`);
    }
    if (course.isOfficial && enrollment.status !== 'completed') {
      throw new ConflictError(`users/${studentUid} has not completed courses/${courseId}.`);
    }
  }

  const certificate = await issueCertificateFor(studentUid, courseId, {
    uid: session.uid,
    name: session.displayName,
  });
  await writeAudit(actor, {
    action: 'certificate.issued',
    targetType: 'certificate',
    targetId: certificate.id,
    schoolId: certificate.schoolId,
    meta: { studentUid, courseId },
  });
  return certificate;
}

/**
 * The teacher who issued the certificate, or a platform admin, revokes it with a reason; the
 * verify page then reports it as revoked. Revoking a revoked certificate changes nothing.
 */
export async function revokeCertificate(
  actor: Actor,
  certificateId: string,
  reason: string,
): Promise<void> {
  const session = requireSessionActor(actor, 'certificate.revoke');
  assertRole(actor, 'teacher', 'platform_admin');
  const parsed = parseInput(revokeCertificateInputSchema, { certificateId, reason });
  if (!parsed.success) throw new ValidationError('Invalid request.', parsed.fieldErrors);

  const certificate = await getCertificate(actor, certificateId);
  assertCan(isPlatformAdmin(actor) || certificate.issuedBy === session.uid, 'certificate.revoke');
  if (certificate.status === 'revoked') return;

  await revokeCertificateById(certificateId, parsed.data.reason, session.uid);
  await writeAudit(actor, {
    action: 'certificate.revoked',
    targetType: 'certificate',
    targetId: certificateId,
    schoolId: certificate.schoolId,
    meta: {
      studentUid: certificate.userUid,
      courseId: certificate.courseId,
      reason: parsed.data.reason,
    },
  });
}

/**
 * A badge whose criteria are `manual`, given by a platform admin or by a teacher to a student
 * of a class they teach (9.3). `awarded` is false when the student already holds it.
 */
export async function awardManualBadge(
  actor: Actor,
  input: { studentUid: string; badgeId: string; note: string | null },
): Promise<{ awarded: boolean }> {
  const session = requireSessionActor(actor, 'badge.award');
  assertRole(actor, 'teacher', 'platform_admin');
  const parsed = parseInput(awardBadgeInputSchema, input);
  if (!parsed.success) throw new ValidationError('Invalid request.', parsed.fieldErrors);
  const { studentUid, badgeId, note } = parsed.data;

  const badge = await getBadge(actor, badgeId);
  if (!badge.isActive || badge.criteria.type !== 'manual') {
    throw new ConflictError(`badges/${badgeId} is not awarded by hand.`);
  }
  const student = await loadStudentFor(
    actor,
    studentUid,
    (profile) =>
      isPlatformAdmin(actor) ||
      (profile.role === 'student' && teachesAnyOf(actor, profile.classIds)),
  );

  const result = await awardBadge(studentUid, badgeId, session.uid, note ?? undefined);
  if (result.awarded) {
    await writeAudit(actor, {
      action: 'badge.awarded',
      targetType: 'user',
      targetId: studentUid,
      schoolId: student.schoolId,
      meta: { badgeId, note },
    });
  }
  return result;
}
