'use server';

import { runAction } from '@/lib/actions/run-action';
import {
  issueCertificateInputSchema,
  revokeCertificateInputSchema,
} from '@/lib/schemas/certificate';
import { issueCertificate, revokeCertificate } from '@/lib/services/recognition';
import type { ActionResult } from '@/types/actions';
import type { Role } from '@/types/common';
import type { IssueCertificateInput, RevokeCertificateInput } from '@/types/inputs';

// Course certificates (ARCHITECTURE.md 10.4, 9.5). The role gate is coarse: the recognition
// service decides who may issue or revoke this certificate and answers forbidden, not_found or
// conflict.

const ISSUERS: readonly Role[] = ['teacher', 'platform_admin'];

/** Issues (or issues again, with a new code, a revoked) course certificate. */
export async function issueCertificateAction(
  input: IssueCertificateInput,
): Promise<ActionResult<{ certificateId: string }>> {
  return runAction(
    issueCertificateInputSchema,
    input,
    async (data, session) => {
      const certificate = await issueCertificate(session, data);
      return { certificateId: certificate.id };
    },
    { roles: ISSUERS },
  );
}

/** Revokes a certificate with a reason the holder sees; a revoked one is left as it is. */
export async function revokeCertificateAction(
  input: RevokeCertificateInput,
): Promise<ActionResult<null>> {
  return runAction(
    revokeCertificateInputSchema,
    input,
    async ({ certificateId, reason }, session) => {
      await revokeCertificate(session, certificateId, reason);
      return null;
    },
    { roles: ISSUERS },
  );
}
