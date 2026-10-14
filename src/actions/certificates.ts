'use server';

// Stubs (F8): the signatures and roles of ARCHITECTURE.md 10.4; WS-J fills them in.

import { runAction } from '@/lib/actions/run-action';
import { AppError } from '@/lib/errors';
import {
  issueCertificateInputSchema,
  revokeCertificateInputSchema,
} from '@/lib/schemas/certificate';
import type { ActionResult } from '@/types/actions';
import type { Role } from '@/types/common';
import type { IssueCertificateInput, RevokeCertificateInput } from '@/types/inputs';

const ISSUERS: readonly Role[] = ['teacher', 'platform_admin'];

async function notImplemented(): Promise<never> {
  throw new AppError('not_implemented');
}

export async function issueCertificateAction(
  input: IssueCertificateInput,
): Promise<ActionResult<{ certificateId: string }>> {
  return runAction(issueCertificateInputSchema, input, notImplemented, { roles: ISSUERS });
}

export async function revokeCertificateAction(
  input: RevokeCertificateInput,
): Promise<ActionResult<null>> {
  return runAction(revokeCertificateInputSchema, input, notImplemented, { roles: ISSUERS });
}
