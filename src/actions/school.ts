'use server';

// Stubs (F8): the signatures and roles of ARCHITECTURE.md 10.4; WS-G fills them in.

import { runAction } from '@/lib/actions/run-action';
import { AppError } from '@/lib/errors';
import {
  createTeacherInputSchema,
  setClassTeachersInputSchema,
  setUserStatusInputSchema,
  updateSchoolSettingsInputSchema,
} from '@/lib/schemas/school';
import type { ActionResult } from '@/types/actions';
import type { Role } from '@/types/common';
import type {
  CreateTeacherInput,
  SetClassTeachersInput,
  SetUserStatusInput,
  UpdateSchoolSettingsInput,
} from '@/types/inputs';

const SCHOOL_ADMINS: readonly Role[] = ['school_admin'];

async function notImplemented(): Promise<never> {
  throw new AppError('not_implemented');
}

export async function createTeacherAction(
  input: CreateTeacherInput,
): Promise<ActionResult<{ uid: string; email: string }>> {
  return runAction(createTeacherInputSchema, input, notImplemented, { roles: SCHOOL_ADMINS });
}

export async function setSchoolUserStatusAction(
  input: SetUserStatusInput,
): Promise<ActionResult<null>> {
  return runAction(setUserStatusInputSchema, input, notImplemented, { roles: SCHOOL_ADMINS });
}

export async function updateSchoolSettingsAction(
  input: UpdateSchoolSettingsInput,
): Promise<ActionResult<null>> {
  return runAction(updateSchoolSettingsInputSchema, input, notImplemented, {
    roles: SCHOOL_ADMINS,
  });
}

export async function setClassTeachersAction(
  input: SetClassTeachersInput,
): Promise<ActionResult<null>> {
  return runAction(setClassTeachersInputSchema, input, notImplemented, { roles: SCHOOL_ADMINS });
}
