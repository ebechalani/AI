import 'server-only';
import { randomInt } from 'node:crypto';
import type { DocumentReference } from 'firebase-admin/firestore';
import { assertSystem, type Actor } from '@/lib/auth/actor';
import {
  assertCan,
  canManageSchool,
  canViewCertificate,
  canViewUser,
  hasRole,
  isPlatformAdmin,
} from '@/lib/auth/authz';
import { NotFoundError } from '@/lib/errors';
import { getAdminDb } from '@/lib/firebase/admin';
import { collections, docIds } from '@/lib/firebase/collections';
import {
  createdNow,
  fromQuery,
  fromSnapshot,
  fromSnapshotOrNull,
  serverTimestamp,
  updatedNow,
} from '@/lib/firebase/converters';
import { COMPOSITE_ID_PATTERN } from '@/lib/schemas/common';
import type { Localized, Page, PageRequest } from '@/types/common';
import type { Certificate, CertificateStatus, PublicCertificate } from '@/types/gamification';
import {
  assertId,
  clampLimit,
  isActorUid,
  readPage,
  readProfile,
  userDoc,
} from './internal-identity';

/**
 * Built by gamification/certificates: who receives the certificate, for which course, and the
 * snapshots printed on it. The id, the verification code and the dates are set here.
 */
export interface NewCertificate {
  userUid: string;
  recipientName: string;
  courseId: string;
  pathwayId: string | null;
  courseTitle: Localized<{ title: string }>;
  isOfficial: boolean;
  schoolId: string | null;
  schoolName: string | null;
  /** 'system', or the uid of the person who issues it. */
  issuedBy: string;
  issuerName: string;
}

const CODE_PREFIX = 'RH-';
const CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789';
const CODE_LENGTH = 10;
const CODE_PATTERN = new RegExp(`^${CODE_PREFIX}[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

// 34^10 values: no uniqueness check is made (ARCHITECTURE.md 9.5).
function newVerificationCode(): string {
  let code = CODE_PREFIX;
  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

function certificateDoc(certificateId: string): DocumentReference {
  assertId(certificateId, COMPOSITE_ID_PATTERN);
  return collections.certificates().doc(certificateId);
}

/** A teacher reaches a certificate through its holder: a student in a class they teach. */
async function teachesHolder(actor: Actor, holderUid: string): Promise<boolean> {
  if (!hasRole(actor, 'teacher')) return false;
  const holder = await readProfile(holderUid);
  return holder !== null && canViewUser(actor, holder);
}

export async function getCertificate(actor: Actor, certificateId: string): Promise<Certificate> {
  const certificate = fromSnapshotOrNull<Certificate>(await certificateDoc(certificateId).get());
  const allowed =
    certificate !== null &&
    (canViewCertificate(actor, certificate) || (await teachesHolder(actor, certificate.userUid)));
  if (!allowed) throw new NotFoundError(`certificates/${certificateId} does not exist.`);
  return certificate;
}

/** Public verification: a redacted shape, with no learner name. null for an unknown code. */
export async function getCertificateByCode(code: string): Promise<PublicCertificate | null> {
  if (typeof code !== 'string' || !CODE_PATTERN.test(code)) return null;
  const snapshot = await collections
    .certificates()
    .where('verificationCode', '==', code)
    .limit(1)
    .get();
  const certificate = fromQuery<Certificate>(snapshot).at(0);
  if (certificate === undefined) return null;
  return {
    verificationCode: certificate.verificationCode,
    status: certificate.status,
    courseTitle: certificate.courseTitle,
    isOfficial: certificate.isOfficial,
    issuerName: certificate.issuerName,
    schoolName: certificate.schoolName,
    issuedAt: certificate.issuedAt,
  };
}

/**
 * Newest first. The holder, a teacher of one of the holder's classes and platform admins get
 * every certificate; a school admin gets the ones issued in their school.
 */
export async function listCertificatesForUser(
  actor: Actor,
  uid: string,
  opts?: { limit?: number },
): Promise<Certificate[]> {
  assertId(uid);
  const seesAll =
    isPlatformAdmin(actor) || isActorUid(actor, uid) || (await teachesHolder(actor, uid));
  if (!seesAll && !hasRole(actor, 'school_admin')) {
    throw new NotFoundError(`users/${uid} does not exist.`);
  }
  const ordered = collections
    .certificates()
    .where('userUid', '==', uid)
    .orderBy('issuedAt', 'desc');
  const query = opts?.limit === undefined ? ordered : ordered.limit(clampLimit(opts.limit));
  const certificates = fromQuery<Certificate>(await query.get());
  return seesAll
    ? certificates
    : certificates.filter((certificate) => canViewCertificate(actor, certificate));
}

export async function listCertificatesForSchool(
  actor: Actor,
  schoolId: string,
  page?: PageRequest,
): Promise<Page<Certificate>> {
  assertCan(canManageSchool(actor, schoolId), 'school.certificates.list');
  assertId(schoolId);
  const query = collections
    .certificates()
    .where('schoolId', '==', schoolId)
    .orderBy('issuedAt', 'desc');
  return readPage<Certificate>(
    query,
    collections.certificates(),
    page,
    (data) => data.schoolId === schoolId,
  );
}

export async function listAllCertificates(
  actor: Actor,
  page?: PageRequest,
): Promise<Page<Certificate>> {
  assertCan(isPlatformAdmin(actor), 'certificates.list');
  const query = collections.certificates().orderBy('issuedAt', 'desc');
  return readPage<Certificate>(query, collections.certificates(), page, () => true);
}

/**
 * One certificate per user and course. No document: it is created. An issued one is returned
 * as it is (`created: false`). A revoked one is issued again, with a new verification code,
 * date, issuer and snapshots, so the old code stops verifying. `users.stats.certificates`
 * moves in the same transaction.
 */
export async function createCertificate(
  actor: Actor,
  input: NewCertificate,
): Promise<{ certificate: Certificate; created: boolean }> {
  assertSystem(actor);
  assertId(input.courseId);
  const userRef = userDoc(input.userUid);
  const ref = certificateDoc(docIds.certificate(input.userUid, input.courseId));

  const created = await getAdminDb().runTransaction(async (tx) => {
    const [existing, user] = await tx.getAll(ref, userRef);
    const current = fromSnapshotOrNull<Certificate>(existing);
    if (current?.status === 'issued') return false;
    if (!user.exists) throw new NotFoundError(`users/${input.userUid} does not exist.`);

    const fields = {
      userUid: input.userUid,
      recipientName: input.recipientName,
      type: 'course',
      courseId: input.courseId,
      pathwayId: input.pathwayId,
      courseTitle: input.courseTitle,
      isOfficial: input.isOfficial,
      schoolId: input.schoolId,
      schoolName: input.schoolName,
      issuedBy: input.issuedBy,
      issuerName: input.issuerName,
      verificationCode: newVerificationCode(),
      status: 'issued' satisfies CertificateStatus,
      revokedReason: null,
      issuedAt: serverTimestamp(),
      revokedAt: null,
    };
    if (current === null) tx.create(ref, { ...fields, ...createdNow() });
    else tx.update(ref, { ...fields, ...updatedNow() });

    const held = Number(user.get('stats.certificates') ?? 0);
    tx.update(userRef, { 'stats.certificates': held + 1, ...updatedNow() });
    return true;
  });
  return { certificate: fromSnapshot<Certificate>(await ref.get()), created };
}

/** Revoking a revoked certificate changes nothing. */
export async function setCertificateRevoked(
  actor: Actor,
  certificateId: string,
  reason: string,
): Promise<void> {
  assertSystem(actor);
  const ref = certificateDoc(certificateId);

  await getAdminDb().runTransaction(async (tx) => {
    const certificate = fromSnapshot<Certificate>(await tx.get(ref));
    if (certificate.status === 'revoked') return;
    const user = await tx.get(collections.users().doc(certificate.userUid));

    tx.update(ref, {
      status: 'revoked' satisfies CertificateStatus,
      revokedReason: reason,
      revokedAt: serverTimestamp(),
      ...updatedNow(),
    });
    if (user.exists) {
      const held = Number(user.get('stats.certificates') ?? 0);
      tx.update(user.ref, { 'stats.certificates': Math.max(0, held - 1), ...updatedNow() });
    }
  });
}
