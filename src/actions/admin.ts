'use server';

// Stubs (F8): the signatures and roles of ARCHITECTURE.md 10.4; WS-H fills them in.

import { runAction } from '@/lib/actions/run-action';
import { AppError } from '@/lib/errors';
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

const PLATFORM_ADMINS: readonly Role[] = ['platform_admin'];

async function notImplemented(): Promise<never> {
  throw new AppError('not_implemented');
}

// --- Schools and users -------------------------------------------------------------------------

export async function createSchoolAction(
  input: CreateSchoolInput,
): Promise<ActionResult<{ schoolId: string; adminEmail: string }>> {
  return runAction(createSchoolInputSchema, input, notImplemented, { roles: PLATFORM_ADMINS });
}

export async function updateSchoolAction(input: UpdateSchoolInput): Promise<ActionResult<null>> {
  return runAction(updateSchoolInputSchema, input, notImplemented, { roles: PLATFORM_ADMINS });
}

export async function setSchoolStatusAction(
  input: SetSchoolStatusInput,
): Promise<ActionResult<null>> {
  return runAction(setSchoolStatusInputSchema, input, notImplemented, { roles: PLATFORM_ADMINS });
}

export async function setUserRoleAction(input: SetUserRoleInput): Promise<ActionResult<null>> {
  return runAction(setUserRoleInputSchema, input, notImplemented, { roles: PLATFORM_ADMINS });
}

export async function setUserStatusAction(input: SetUserStatusInput): Promise<ActionResult<null>> {
  return runAction(setUserStatusInputSchema, input, notImplemented, { roles: PLATFORM_ADMINS });
}

export async function setVerifiedEducatorAction(
  input: SetVerifiedEducatorInput,
): Promise<ActionResult<null>> {
  return runAction(setVerifiedEducatorInputSchema, input, notImplemented, {
    roles: PLATFORM_ADMINS,
  });
}

// --- Billing and challenges --------------------------------------------------------------------

export async function upsertSubscriptionAction(
  input: UpsertSubscriptionInput,
): Promise<ActionResult<{ subscriptionId: string }>> {
  return runAction(upsertSubscriptionInputSchema, input, notImplemented, {
    roles: PLATFORM_ADMINS,
  });
}

export async function upsertLicenseAction(
  input: UpsertLicenseInput,
): Promise<ActionResult<{ licenseId: string }>> {
  return runAction(upsertLicenseInputSchema, input, notImplemented, { roles: PLATFORM_ADMINS });
}

export async function upsertChallengeAction(
  input: UpsertChallengeInput,
): Promise<ActionResult<{ challengeId: string }>> {
  return runAction(upsertChallengeInputSchema, input, notImplemented, { roles: PLATFORM_ADMINS });
}

export async function setChallengeStatusAction(
  input: SetChallengeStatusInput,
): Promise<ActionResult<null>> {
  return runAction(setChallengeStatusInputSchema, input, notImplemented, {
    roles: PLATFORM_ADMINS,
  });
}
