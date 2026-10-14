import type { z } from 'zod';
import { CONTENT_LIMITS } from '@/lib/limits';
import { SUBMISSION_TYPES } from '@/types/common';
import type { ProjectInput, ProjectRefInput, SaveProjectInput } from '@/types/inputs';
import { PROJECT_KINDS, RUBRIC_KEYS } from '@/types/project';
import {
  bool,
  idOrNullSchema,
  idSchema,
  int,
  list,
  localeSchema,
  localized,
  obj,
  oneOf,
  requireDefaultLocale,
  text,
  uniqueList,
} from './common';

/** One entry per criterion at most; the weights sum to 100. Also used by challenges. */
export const rubricSchema = list(obj({ key: oneOf(RUBRIC_KEYS), weight: int(0, 100) }), {
  min: 1,
  max: RUBRIC_KEYS.length,
}).superRefine((rubric, ctx) => {
  if (new Set(rubric.map((entry) => entry.key)).size !== rubric.length) {
    ctx.addIssue({ code: 'custom', message: 'duplicate' });
  }
  if (rubric.reduce((sum, entry) => sum + entry.weight, 0) !== 100) {
    ctx.addIssue({ code: 'custom', message: 'weights_sum' });
  }
});

export const allowedSubmissionTypesSchema = uniqueList(oneOf(SUBMISSION_TYPES), {
  min: 1,
  max: SUBMISSION_TYPES.length,
});

export const projectInputSchema = obj({
  kind: oneOf(PROJECT_KINDS),
  defaultLocale: localeSchema,
  translations: localized(
    obj({
      title: text(CONTENT_LIMITS.titleChars),
      brief: text(CONTENT_LIMITS.projectBriefChars),
      requirements: text(CONTENT_LIMITS.projectBriefChars),
    }),
  ),
  allowedSubmissionTypes: allowedSubmissionTypesSchema,
  rubric: rubricSchema,
  xpReward: int(0, CONTENT_LIMITS.xpRewardMax.project),
  requiredForCertificate: bool(),
}).superRefine(
  requireDefaultLocale(['title', 'brief', 'requirements']),
) satisfies z.ZodType<ProjectInput>;

export const saveProjectInputSchema = obj({
  courseId: idSchema,
  projectId: idOrNullSchema,
  input: projectInputSchema,
}) satisfies z.ZodType<SaveProjectInput>;

export const projectRefInputSchema = obj({
  courseId: idSchema,
  projectId: idSchema,
}) satisfies z.ZodType<ProjectRefInput>;
