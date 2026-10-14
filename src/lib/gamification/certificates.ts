import 'server-only';
import { SYSTEM_ACTOR } from '@/lib/auth/actor';
import { createCertificate, getCertificate, setCertificateRevoked } from '@/lib/data/certificates';
import { getCourse } from '@/lib/data/courses';
import { getEnrollment, setEnrollmentCertificate } from '@/lib/data/enrollments';
import { listProjects } from '@/lib/data/projects';
import { getSchool } from '@/lib/data/schools';
import { getUser } from '@/lib/data/users';
import { NotFoundError } from '@/lib/errors';
import { docIds } from '@/lib/firebase/collections';
import type { Localized } from '@/types/common';
import type { Course } from '@/types/content';
import type { Certificate } from '@/types/gamification';
import type { Enrollment } from '@/types/learning';
import type { SubmissionStatus } from '@/types/project';

// Internal (ARCHITECTURE.md 9): no actor, no authorization. People issue and revoke through
// services/recognition, which authorizes and writes the audit entry.

/** The issuer of a certificate nobody issued by hand. */
export const SYSTEM_ISSUER = { uid: 'system', name: 'RoboHolic AI' } as const;

const ACCEPTED: readonly SubmissionStatus[] = ['approved', 'ai_reviewed'];

async function orNullIfMissing<T>(read: Promise<T>): Promise<T | null> {
  try {
    return await read;
  } catch (error) {
    if (error instanceof NotFoundError) return null;
    throw error;
  }
}

function titleSnapshot(translations: Course['translations']): Localized<{ title: string }> {
  return Object.fromEntries(
    Object.entries(translations).flatMap(([locale, entry]) =>
      entry ? [[locale, { title: entry.title }]] : [],
    ),
  );
}

// The certificate is issued in the name of the school that supervises the enrollment.
async function issue(
  uid: string,
  course: Course,
  enrollment: Enrollment,
  issuer: { uid: string; name: string },
): Promise<Certificate> {
  const [user, school] = await Promise.all([
    getUser(SYSTEM_ACTOR, uid),
    enrollment.schoolId === null
      ? null
      : orNullIfMissing(getSchool(SYSTEM_ACTOR, enrollment.schoolId)),
  ]);
  const { certificate } = await createCertificate(SYSTEM_ACTOR, {
    userUid: uid,
    recipientName: user.displayName,
    courseId: course.id,
    pathwayId: course.pathwayId,
    courseTitle: titleSnapshot(course.translations),
    isOfficial: course.isOfficial,
    schoolId: enrollment.schoolId,
    schoolName: school?.name ?? null,
    issuedBy: issuer.uid,
    issuerName: issuer.name,
  });
  if (enrollment.certificateId !== certificate.id) {
    await setEnrollmentCertificate(SYSTEM_ACTOR, uid, course.id, certificate.id);
  }
  return certificate;
}

/**
 * The automatic path (ARCHITECTURE.md 9.5): issues the course certificate when the course
 * gives certificates, the enrollment is completed and every project that is required for the
 * certificate has been accepted. Answers the certificate when this call issued it (or
 * finished an interrupted issue), and null otherwise: conditions not met, the learner
 * already holds it, or it was revoked. A revoked certificate comes back only when a person
 * issues it again (issueCertificateFor).
 */
export async function maybeIssueCourseCertificate(
  uid: string,
  courseId: string,
): Promise<Certificate | null> {
  const [course, enrollment] = await Promise.all([
    getCourse(SYSTEM_ACTOR, courseId),
    getEnrollment(SYSTEM_ACTOR, uid, courseId),
  ]);
  if (!course.certificateEnabled || enrollment?.status !== 'completed') return null;
  if (enrollment.certificateId !== null) return null;

  // A project no lesson links to cannot be submitted, so it cannot be required.
  const required = (await listProjects(SYSTEM_ACTOR, courseId)).filter(
    (project) => project.requiredForCertificate && project.lessonId !== null,
  );
  const accepted = required.every((project) => {
    const summary = Object.hasOwn(enrollment.projectSummary, project.id)
      ? enrollment.projectSummary[project.id]
      : undefined;
    return summary !== undefined && ACCEPTED.includes(summary.latestStatus);
  });
  if (!accepted) return null;

  const existing = await orNullIfMissing(
    getCertificate(SYSTEM_ACTOR, docIds.certificate(uid, courseId)),
  );
  if (existing?.status === 'revoked') return null;
  return issue(uid, course, enrollment, SYSTEM_ISSUER);
}

/**
 * Issues the certificate whatever the course's progress says; the caller has decided that the
 * learner deserves it. An issued certificate is returned unchanged, a revoked one is issued
 * again with a new verification code. NotFoundError when the user is not enrolled.
 */
export async function issueCertificateFor(
  uid: string,
  courseId: string,
  issuer: { uid: string | 'system'; name: string },
): Promise<Certificate> {
  const [course, enrollment] = await Promise.all([
    getCourse(SYSTEM_ACTOR, courseId),
    getEnrollment(SYSTEM_ACTOR, uid, courseId),
  ]);
  if (enrollment === null) {
    throw new NotFoundError(`User ${uid} is not enrolled in course ${courseId}.`);
  }
  return issue(uid, course, enrollment, issuer);
}

/**
 * Revokes the certificate and unlinks it from the enrollment. Safe to repeat. Who revoked it
 * is recorded by the caller's audit entry; the certificate has no field for it.
 */
export async function revokeCertificateById(
  certificateId: string,
  reason: string,
  revokedByUid: string,
): Promise<void> {
  void revokedByUid;
  const certificate = await getCertificate(SYSTEM_ACTOR, certificateId);
  await setCertificateRevoked(SYSTEM_ACTOR, certificateId, reason);
  const enrollment = await getEnrollment(SYSTEM_ACTOR, certificate.userUid, certificate.courseId);
  if (enrollment?.certificateId === certificateId) {
    await setEnrollmentCertificate(SYSTEM_ACTOR, certificate.userUid, certificate.courseId, null);
  }
}
