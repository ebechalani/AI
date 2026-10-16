import { z } from 'zod';
import { CONTENT_LIMITS, FILE_NAME_PATTERN, SUBMISSION_LIMITS } from '@/lib/limits';
import { FILE_KINDS, SUBMISSION_TYPES, type FileKind } from '@/types/common';
import type {
  DeleteAttachmentInput,
  RegenerateAiReviewInput,
  RegisterUploadInput,
  ReviewInput,
  SubmitWorkInput,
} from '@/types/inputs';
import { REVIEW_DECISIONS } from '@/types/project';
import {
  compositeIdSchema,
  fileIdSchema,
  httpsUrlSchema,
  idSchema,
  int,
  obj,
  oneOf,
  requiredText,
  text,
  whenPresent,
} from './common';

// --- Upload registration -----------------------------------------------------------------------

// The server builds the storage path from this name, so a segment made only of dots ('.',
// '..') is refused although FILE_NAME_PATTERN, which the Storage rules share, matches it.
export const fileNameSchema = z
  .string({ error: whenPresent('file_name_invalid') })
  .regex(FILE_NAME_PATTERN, 'file_name_invalid')
  .refine((name) => !/^\.+$/.test(name), 'file_name_invalid');

// Display hints measured in the browser; the real type and size are read back from Storage.
const pixelsSchema = int(1, CONTENT_LIMITS.imagePixelsMax).nullable().optional();

const uploadFields = {
  fileId: fileIdSchema,
  kind: oneOf(FILE_KINDS),
  fileName: fileNameSchema,
  width: pixelsSchema,
  height: pixelsSchema,
};

export const registerUploadInputSchema = z.discriminatedUnion(
  'purpose',
  [
    obj({ ...uploadFields, purpose: z.literal('submission') }),
    obj({ ...uploadFields, purpose: z.literal('course_media'), courseId: idSchema.nullable() }),
  ],
  { error: whenPresent('invalid_choice') },
) satisfies z.ZodType<RegisterUploadInput>;

// --- Submitting work ---------------------------------------------------------------------------

const targetSchema = z.discriminatedUnion(
  'context',
  [
    obj({ context: z.literal('project'), courseId: idSchema, projectId: idSchema }),
    obj({ context: z.literal('challenge'), challengeId: idSchema }),
  ],
  { error: whenPresent('invalid_choice') },
);

const fileIdsSchema = z
  .array(fileIdSchema, { error: whenPresent('invalid') })
  .max(SUBMISSION_LIMITS.maxAttachments, 'too_many_files')
  .refine((ids) => new Set(ids).size === ids.length, 'duplicate');

function isBlank(value: string | null): boolean {
  return value === null || value.trim() === '';
}

/**
 * The content named by `type` must be present: text, code, a link, or at least one file for
 * the uploaded kinds. Anything else may accompany it.
 */
export const submitWorkInputSchema = obj({
  target: targetSchema,
  title: requiredText(SUBMISSION_LIMITS.titleChars),
  description: text(SUBMISSION_LIMITS.descriptionChars),
  type: oneOf(SUBMISSION_TYPES),
  content: obj({
    text: text(SUBMISSION_LIMITS.textChars).nullable(),
    linkUrl: httpsUrlSchema(SUBMISSION_LIMITS.linkUrlChars).nullable(),
    code: text(SUBMISSION_LIMITS.codeChars, { trim: false }).nullable(),
    codeLanguage: text(SUBMISSION_LIMITS.codeLanguageChars).nullable(),
  }),
  fileIds: fileIdsSchema,
  previousSubmissionId: compositeIdSchema.nullable(),
}).superRefine((work, ctx) => {
  const missing = (...path: string[]) =>
    ctx.addIssue({ code: 'custom', message: 'content_required', path });
  if (work.type === 'text') {
    if (isBlank(work.content.text)) missing('content', 'text');
  } else if (work.type === 'code') {
    if (isBlank(work.content.code)) missing('content', 'code');
  } else if (work.type === 'link') {
    if (work.content.linkUrl === null) missing('content', 'linkUrl');
  } else {
    // The remaining submission types are exactly the uploaded file kinds.
    work.type satisfies FileKind;
    if (work.fileIds.length === 0) missing('fileIds');
  }
}) satisfies z.ZodType<SubmitWorkInput>;

export const deleteAttachmentInputSchema = obj({
  submissionId: compositeIdSchema,
  fileId: fileIdSchema,
}) satisfies z.ZodType<DeleteAttachmentInput>;

// --- Review ------------------------------------------------------------------------------------

const scoreSchema = int(0, 100);

/**
 * 'modify' carries the teacher's own scores; 'approve' (the AI suggestion becomes the grade)
 * and 'return' carry none. Feedback is always required: it is what the student reads.
 * `aiReviewId` names the suggestion the teacher saw (null: none); whether an 'approve' still
 * matches the latest suggestion is the service's decision (a conflict), not a field error.
 */
export const reviewInputSchema = obj({
  submissionId: compositeIdSchema,
  decision: oneOf(REVIEW_DECISIONS),
  criteria: obj({
    creativity: scoreSchema,
    technicalQuality: scoreSchema,
    understanding: scoreSchema,
    responsibleAi: scoreSchema,
  }).nullable(),
  feedback: requiredText(CONTENT_LIMITS.feedbackChars),
  // AI reviews have Firestore auto-ids.
  aiReviewId: idSchema.nullable().optional(),
}).superRefine((review, ctx) => {
  if (review.decision === 'modify' && review.criteria === null) {
    ctx.addIssue({ code: 'custom', message: 'required', path: ['criteria'] });
  }
  if (review.decision !== 'modify' && review.criteria !== null) {
    ctx.addIssue({ code: 'custom', message: 'invalid', path: ['criteria'] });
  }
}) satisfies z.ZodType<ReviewInput>;

export const regenerateAiReviewInputSchema = obj({
  submissionId: compositeIdSchema,
}) satisfies z.ZodType<RegenerateAiReviewInput>;
