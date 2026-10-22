'use server';

import { runAction } from '@/lib/actions/run-action';
import { writeAudit, type AuditAction } from '@/lib/data/audit';
import { listSubscriptionsForOwner, upsertLicense, upsertSubscription } from '@/lib/data/billing';
import { setChallengeStatus, upsertChallenge } from '@/lib/data/challenges';
import { getCourses } from '@/lib/data/courses';
import { listHardwarePlatforms } from '@/lib/data/hardware';
import { listPathways } from '@/lib/data/pathways';
import { getSchool, setSchoolStatus, updateSchool } from '@/lib/data/schools';
import { getUser } from '@/lib/data/users';
import { isAppError, ValidationError } from '@/lib/errors';
import {
  createSchoolInputSchema,
  setChallengeStatusInputSchema,
  setSchoolStatusInputSchema,
  setUserRoleInputSchema,
  setVerifiedEducatorInputSchema,
  updateSchoolInputSchema,
  upsertChallengeInputSchema,
  upsertLicenseInputSchema,
  upsertSubscriptionInputSchema,
} from '@/lib/schemas/admin';
import { setUserStatusInputSchema } from '@/lib/schemas/school';
import {
  changeUserRole,
  createSchoolWithAdmin,
  setUserStatus,
  setVerifiedEducator,
} from '@/lib/services/provisioning';
import type { ActionResult } from '@/types/actions';
import type { Role } from '@/types/common';
import type {
  CreateSchoolInput,
  SetChallengeStatusInput,
  SetSchoolStatusInput,
  SetUserRoleInput,
  SetUserStatusInput,
  SetVerifiedEducatorInput,
  UpdateSchoolInput,
  UpsertChallengeInput,
  UpsertLicenseInput,
  UpsertSubscriptionInput,
} from '@/types/inputs';
import type { Session } from '@/types/user';

// The platform admin's actions (ARCHITECTURE.md 10.4). The role gate is the whole
// authorization: every repository and service below checks `isPlatformAdmin` again, and their
// codes reach the client unchanged. The actions add the checks the repositories do not make
// (an owner, a school, a course, a pathway or a kit named by the payload must exist) and the
// three audit entries no repository writes. No revalidatePath: the client containers call
// router.refresh().

const PLATFORM_ADMINS: readonly Role[] = ['platform_admin'];

/** `ValidationError { [field]: ['invalid_choice'] }`: the payload names something unknown. */
function invalidChoice(field: string): ValidationError {
  return new ValidationError(`${field} names an unknown document.`, {
    [field]: ['invalid_choice'],
  });
}

/** A document named by the payload must exist: a NotFoundError becomes a field error. */
async function mustExist<T>(load: () => Promise<T>, field: string): Promise<T> {
  try {
    return await load();
  } catch (error) {
    if (isAppError(error) && error.code === 'not_found') throw invalidChoice(field);
    throw error;
  }
}

/** Every id of `ids` is one of `known` (a reference list read whole), else invalidChoice. */
function assertAllKnown(
  ids: readonly string[],
  known: readonly { id: string }[],
  field: string,
): void {
  const knownIds = new Set(known.map((item) => item.id));
  if (ids.some((id) => !knownIds.has(id))) throw invalidChoice(field);
}

/**
 * The audit entries of ARCHITECTURE.md 3.4 that no repository writes. Best effort: the change
 * is already stored, and failing the action would make the admin retry a create (a duplicate
 * subscription or licence).
 */
async function audit(
  session: Session,
  entry: {
    action: AuditAction;
    targetType: string;
    targetId: string;
    schoolId: string | null;
    meta: Record<string, string | number | boolean | null>;
  },
): Promise<void> {
  try {
    await writeAudit(session, entry);
  } catch (error) {
    console.error('Audit entry not written.', entry.action, error);
  }
}

// --- Schools and users -------------------------------------------------------------------------

/** A school and its first administrator; the caller's browser then sends the password email. */
export async function createSchoolAction(
  input: CreateSchoolInput,
): Promise<ActionResult<{ schoolId: string; adminEmail: string }>> {
  return runAction(
    createSchoolInputSchema,
    input,
    async (data, session) => {
      const { school, admin } = await createSchoolWithAdmin(session, data);
      return { schoolId: school.id, adminEmail: admin.email ?? data.adminEmail };
    },
    { roles: PLATFORM_ADMINS },
  );
}

export async function updateSchoolAction(input: UpdateSchoolInput): Promise<ActionResult<null>> {
  return runAction(
    updateSchoolInputSchema,
    input,
    async ({ schoolId, patch }, session) => {
      await updateSchool(session, schoolId, patch);
      return null;
    },
    { roles: PLATFORM_ADMINS },
  );
}

/** Suspend or reactivate a school; the same status again changes nothing. */
export async function setSchoolStatusAction(
  input: SetSchoolStatusInput,
): Promise<ActionResult<null>> {
  return runAction(
    setSchoolStatusInputSchema,
    input,
    async ({ schoolId, status }, session) => {
      const school = await getSchool(session, schoolId);
      if (school.status === status) return null;
      await setSchoolStatus(session, schoolId, status);
      await audit(session, {
        action: 'school.status_changed',
        targetType: 'school',
        targetId: schoolId,
        schoolId,
        meta: { status, previousStatus: school.status },
      });
      return null;
    },
    { roles: PLATFORM_ADMINS },
  );
}

export async function setUserRoleAction(input: SetUserRoleInput): Promise<ActionResult<null>> {
  return runAction(
    setUserRoleInputSchema,
    input,
    async ({ uid, role, schoolId }, session) => {
      await changeUserRole(session, uid, role, schoolId);
      return null;
    },
    { roles: PLATFORM_ADMINS },
  );
}

export async function setUserStatusAction(input: SetUserStatusInput): Promise<ActionResult<null>> {
  return runAction(
    setUserStatusInputSchema,
    input,
    async ({ uid, status }, session) => {
      await setUserStatus(session, uid, status);
      return null;
    },
    { roles: PLATFORM_ADMINS },
  );
}

export async function setVerifiedEducatorAction(
  input: SetVerifiedEducatorInput,
): Promise<ActionResult<null>> {
  return runAction(
    setVerifiedEducatorInputSchema,
    input,
    async ({ uid, verified }, session) => {
      await setVerifiedEducator(session, uid, verified);
      return null;
    },
    { roles: PLATFORM_ADMINS },
  );
}

// --- Billing and challenges --------------------------------------------------------------------

/**
 * The owner must exist and, for a new subscription of a person, take courses (a student or a
 * teacher: staff get nothing from one, and an edit is never refused for the owner's role, so a
 * subscription whose owner became staff can still be canceled). Named courses must exist and be
 * official: teacher-made courses are always free (ARCHITECTURE.md 4.5).
 */
export async function upsertSubscriptionAction(
  input: UpsertSubscriptionInput,
): Promise<ActionResult<{ subscriptionId: string }>> {
  return runAction(
    upsertSubscriptionInputSchema,
    input,
    async ({ subscriptionId, input: data }, session) => {
      if (data.ownerType === 'school') {
        await mustExist(() => getSchool(session, data.ownerId), 'input.ownerId');
      } else {
        const owner = await mustExist(() => getUser(session, data.ownerId), 'input.ownerId');
        if (subscriptionId === null && owner.role !== 'student' && owner.role !== 'teacher') {
          throw invalidChoice('input.ownerId');
        }
      }
      if (data.courseIds.length > 0) {
        const found = await getCourses(session, data.courseIds);
        if (found.length !== data.courseIds.length || found.some((c) => !c.isOfficial)) {
          throw invalidChoice('input.courseIds');
        }
      }
      const subscription = await upsertSubscription(session, subscriptionId, data);
      await audit(session, {
        action: 'subscription.upserted',
        targetType: 'subscription',
        targetId: subscription.id,
        schoolId: data.ownerType === 'school' ? data.ownerId : null,
        meta: {
          ownerType: data.ownerType,
          ownerId: data.ownerId,
          plan: data.plan,
          status: data.status,
          created: subscriptionId === null,
        },
      });
      return { subscriptionId: subscription.id };
    },
    { roles: PLATFORM_ADMINS },
  );
}

/** The pathways of a scoped licence must exist; a linked subscription must be the school's. */
export async function upsertLicenseAction(
  input: UpsertLicenseInput,
): Promise<ActionResult<{ licenseId: string }>> {
  return runAction(
    upsertLicenseInputSchema,
    input,
    async ({ licenseId, input: data }, session) => {
      if (data.scope.type === 'pathways') {
        assertAllKnown(data.scope.pathwayIds, await listPathways(session), 'input.scope.pathwayIds');
      }
      if (data.subscriptionId !== null) {
        const own = await listSubscriptionsForOwner(session, 'school', data.schoolId);
        if (!own.some((subscription) => subscription.id === data.subscriptionId)) {
          throw invalidChoice('input.subscriptionId');
        }
      }
      const license = await upsertLicense(session, licenseId, data);
      await audit(session, {
        action: 'license.upserted',
        targetType: 'license',
        targetId: license.id,
        schoolId: data.schoolId,
        meta: {
          seatsTotal: data.seatsTotal,
          status: data.status,
          scope: data.scope.type,
          subscriptionId: data.subscriptionId,
          created: licenseId === null,
        },
      });
      return { licenseId: license.id };
    },
    { roles: PLATFORM_ADMINS },
  );
}

/**
 * The school of a school-scoped challenge and every named kit must exist (inactive kits count:
 * an edit keeps a kit the challenge already names). A new challenge is a draft.
 */
export async function upsertChallengeAction(
  input: UpsertChallengeInput,
): Promise<ActionResult<{ challengeId: string }>> {
  return runAction(
    upsertChallengeInputSchema,
    input,
    async ({ challengeId, input: data }, session) => {
      if (data.scope === 'school' && data.schoolId !== null) {
        const schoolId = data.schoolId;
        await mustExist(() => getSchool(session, schoolId), 'input.schoolId');
      }
      if (data.hardwarePlatformIds.length > 0) {
        assertAllKnown(
          data.hardwarePlatformIds,
          await listHardwarePlatforms(session),
          'input.hardwarePlatformIds',
        );
      }
      const challenge = await upsertChallenge(session, challengeId, data);
      return { challengeId: challenge.id };
    },
    { roles: PLATFORM_ADMINS },
  );
}

export async function setChallengeStatusAction(
  input: SetChallengeStatusInput,
): Promise<ActionResult<null>> {
  return runAction(
    setChallengeStatusInputSchema,
    input,
    async ({ challengeId, status }, session) => {
      await setChallengeStatus(session, challengeId, status);
      return null;
    },
    { roles: PLATFORM_ADMINS },
  );
}
