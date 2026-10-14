'use server';

// Stub (F8): the signature and roles of ARCHITECTURE.md 10.4; WS-J fills it in.

import { runAction } from '@/lib/actions/run-action';
import { AppError } from '@/lib/errors';
import { profilePatchSchema } from '@/lib/schemas/profile';
import type { ActionResult } from '@/types/actions';
import { ROLES } from '@/types/common';
import type { ProfilePatch } from '@/types/inputs';

async function notImplemented(): Promise<never> {
  throw new AppError('not_implemented');
}

export async function updateProfileAction(input: ProfilePatch): Promise<ActionResult<null>> {
  return runAction(profilePatchSchema, input, notImplemented, { roles: ROLES });
}
