import { z } from 'zod';
import { CONTENT_LIMITS } from '@/lib/limits';
import {
  LICENSE_STATUSES,
  SUBSCRIPTION_OWNER_TYPES,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUSES,
  type SubscriptionPlan,
} from '@/types/billing';
import { CHALLENGE_SCOPES, CHALLENGE_STATUSES, CHALLENGE_TYPES } from '@/types/challenge';
import { LEARNING_AREAS, ROLES } from '@/types/common';
import type {
  ChallengeInput,
  CreateSchoolInput,
  LicenseInput,
  SetChallengeStatusInput,
  SetSchoolStatusInput,
  SetUserRoleInput,
  SetVerifiedEducatorInput,
  SubscriptionInput,
  UpdateSchoolInput,
  UpsertChallengeInput,
  UpsertLicenseInput,
  UpsertSubscriptionInput,
} from '@/types/inputs';
import { SCHOOL_STATUSES } from '@/types/school';
import { accountEmailSchema, displayNameSchema } from './auth';
import {
  bool,
  checkAgeRange,
  checkDateOrder,
  fileIdSchema,
  idOrNullSchema,
  idSchema,
  int,
  isoDateSchema,
  localeSchema,
  localized,
  obj,
  oneOf,
  requireDefaultLocale,
  requiredText,
  text,
  uniqueList,
  whenPresent,
} from './common';
import { ageSchema, hardwarePlatformIdsSchema, requiredCapabilitiesSchema } from './course';
import { allowedSubmissionTypesSchema, rubricSchema } from './project';
import { schoolInputSchema, schoolPatchSchema } from './school';

// --- Schools and users -------------------------------------------------------------------------

export const createSchoolInputSchema = obj({
  school: schoolInputSchema,
  adminDisplayName: displayNameSchema,
  adminEmail: accountEmailSchema,
}) satisfies z.ZodType<CreateSchoolInput>;

export const updateSchoolInputSchema = obj({
  schoolId: idSchema,
  patch: schoolPatchSchema,
}) satisfies z.ZodType<UpdateSchoolInput>;

export const setSchoolStatusInputSchema = obj({
  schoolId: idSchema,
  status: oneOf(SCHOOL_STATUSES),
}) satisfies z.ZodType<SetSchoolStatusInput>;

/**
 * A school admin belongs to a school and a platform admin to none; students and teachers may
 * have either. Whether the caller may assign the role is decided by the server (canAssignRole).
 */
export const setUserRoleInputSchema = obj({
  uid: idSchema,
  role: oneOf(ROLES),
  schoolId: idSchema.nullable(),
}).superRefine((value, ctx) => {
  if (value.role === 'school_admin' && value.schoolId === null) {
    ctx.addIssue({ code: 'custom', message: 'required', path: ['schoolId'] });
  }
  if (value.role === 'platform_admin' && value.schoolId !== null) {
    ctx.addIssue({ code: 'custom', message: 'invalid', path: ['schoolId'] });
  }
}) satisfies z.ZodType<SetUserRoleInput>;

export const setVerifiedEducatorInputSchema = obj({
  uid: idSchema,
  verified: bool(),
}) satisfies z.ZodType<SetVerifiedEducatorInput>;

// --- Subscriptions and licences ----------------------------------------------------------------

const COURSE_SCOPED_PLANS: readonly SubscriptionPlan[] = ['course_purchase', 'teacher_training'];

export const subscriptionInputSchema = obj({
  ownerType: oneOf(SUBSCRIPTION_OWNER_TYPES),
  ownerId: idSchema,
  plan: oneOf(SUBSCRIPTION_PLANS),
  status: oneOf(SUBSCRIPTION_STATUSES),
  currentPeriodStart: isoDateSchema,
  currentPeriodEnd: isoDateSchema,
  courseIds: uniqueList(idSchema, { max: CONTENT_LIMITS.courseIdsPerSubscription }),
  notes: text(CONTENT_LIMITS.notesChars).nullable(),
}).superRefine((value, ctx) => {
  checkDateOrder('currentPeriodStart', 'currentPeriodEnd')(value, ctx);
  // Only the course-scoped plans name courses; the others cover a whole catalog.
  const courseScoped = COURSE_SCOPED_PLANS.includes(value.plan);
  if (courseScoped && value.courseIds.length === 0) {
    ctx.addIssue({ code: 'custom', message: 'required', path: ['courseIds'] });
  }
  if (!courseScoped && value.courseIds.length > 0) {
    ctx.addIssue({ code: 'custom', message: 'too_many', path: ['courseIds'] });
  }
  const individual = value.plan === 'individual_monthly' || value.plan === 'individual_yearly';
  if (
    (individual && value.ownerType !== 'user') ||
    (value.plan === 'school_annual' && value.ownerType !== 'school')
  ) {
    ctx.addIssue({ code: 'custom', message: 'invalid_choice', path: ['plan'] });
  }
}) satisfies z.ZodType<SubscriptionInput>;

export const upsertSubscriptionInputSchema = obj({
  subscriptionId: idOrNullSchema,
  input: subscriptionInputSchema,
}) satisfies z.ZodType<UpsertSubscriptionInput>;

export const licenseScopeSchema = z.discriminatedUnion(
  'type',
  [
    obj({ type: z.literal('all_official') }),
    obj({
      type: z.literal('pathways'),
      pathwayIds: uniqueList(idSchema, { min: 1, max: CONTENT_LIMITS.pathwaysPerLicense }),
    }),
  ],
  { error: whenPresent('invalid_choice') },
);

export const licenseInputSchema = obj({
  schoolId: idSchema,
  subscriptionId: idOrNullSchema,
  name: requiredText(CONTENT_LIMITS.licenseNameChars),
  seatsTotal: int(1, CONTENT_LIMITS.seatsMax),
  scope: licenseScopeSchema,
  startsAt: isoDateSchema,
  endsAt: isoDateSchema,
  status: oneOf(LICENSE_STATUSES),
}).superRefine(checkDateOrder('startsAt', 'endsAt')) satisfies z.ZodType<LicenseInput>;

export const upsertLicenseInputSchema = obj({
  licenseId: idOrNullSchema,
  input: licenseInputSchema,
}) satisfies z.ZodType<UpsertLicenseInput>;

// --- Challenges --------------------------------------------------------------------------------

export const challengeInputSchema = obj({
  type: oneOf(CHALLENGE_TYPES),
  scope: oneOf(CHALLENGE_SCOPES),
  schoolId: idSchema.nullable(),
  area: oneOf(LEARNING_AREAS),
  ageMin: ageSchema.nullable(),
  ageMax: ageSchema.nullable(),
  startAt: isoDateSchema,
  deadlineAt: isoDateSchema,
  allowedSubmissionTypes: allowedSubmissionTypesSchema,
  rubric: rubricSchema,
  xpReward: int(0, CONTENT_LIMITS.xpRewardMax.challenge),
  coverImageFileId: fileIdSchema.nullable(),
  hardwarePlatformIds: hardwarePlatformIdsSchema,
  requiredCapabilities: requiredCapabilitiesSchema,
  defaultLocale: localeSchema,
  translations: localized(
    obj({
      title: text(CONTENT_LIMITS.titleChars),
      description: text(CONTENT_LIMITS.descriptionChars),
      submissionRequirements: text(CONTENT_LIMITS.descriptionChars),
      prizes: text(CONTENT_LIMITS.prizesChars).nullable(),
    }),
  ),
}).superRefine((value, ctx) => {
  requireDefaultLocale(['title', 'description', 'submissionRequirements'])(value, ctx);
  checkAgeRange(value, ctx);
  checkDateOrder('startAt', 'deadlineAt')(value, ctx);
  if (value.scope === 'school' && value.schoolId === null) {
    ctx.addIssue({ code: 'custom', message: 'required', path: ['schoolId'] });
  }
  if (value.scope === 'global' && value.schoolId !== null) {
    ctx.addIssue({ code: 'custom', message: 'invalid', path: ['schoolId'] });
  }
}) satisfies z.ZodType<ChallengeInput>;

export const upsertChallengeInputSchema = obj({
  challengeId: idOrNullSchema,
  input: challengeInputSchema,
}) satisfies z.ZodType<UpsertChallengeInput>;

export const setChallengeStatusInputSchema = obj({
  challengeId: idSchema,
  status: oneOf(CHALLENGE_STATUSES),
}) satisfies z.ZodType<SetChallengeStatusInput>;
