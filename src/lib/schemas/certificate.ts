import type { z } from 'zod';
import { CONTENT_LIMITS } from '@/lib/limits';
import type { IssueCertificateInput, RevokeCertificateInput } from '@/types/inputs';
import { compositeIdSchema, idSchema, obj, requiredText } from './common';

export const issueCertificateInputSchema = obj({
  studentUid: idSchema,
  courseId: idSchema,
}) satisfies z.ZodType<IssueCertificateInput>;

export const revokeCertificateInputSchema = obj({
  certificateId: compositeIdSchema,
  reason: requiredText(CONTENT_LIMITS.revokeReasonChars),
}) satisfies z.ZodType<RevokeCertificateInput>;
