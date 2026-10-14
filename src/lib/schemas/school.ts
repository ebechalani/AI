import { z } from 'zod';
import { AI_LIMITS, CONTENT_LIMITS } from '@/lib/limits';
import type {
  CreateTeacherInput,
  SchoolInput,
  SchoolPatch,
  SetClassTeachersInput,
  SetUserStatusInput,
  UpdateSchoolSettingsInput,
} from '@/types/inputs';
import { USER_STATUSES } from '@/types/user';
import { accountEmailSchema, displayNameSchema } from './auth';
import {
  bool,
  idSchema,
  int,
  localeSchema,
  obj,
  oneOf,
  text,
  uniqueList,
  whenPresent,
} from './common';

const schoolNameSchema = z
  .string({ error: whenPresent('invalid') })
  .trim()
  .min(CONTENT_LIMITS.schoolNameMinChars, 'too_short')
  .max(CONTENT_LIMITS.schoolNameMaxChars, 'too_long');

/** ISO 3166-1 alpha-2, upper-cased before it is checked. Whether the code is assigned is not checked. */
const countrySchema = z
  .string({ error: whenPresent('invalid') })
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, 'invalid');

const citySchema = text(CONTENT_LIMITS.cityChars).nullable();

export const schoolSettingsSchema = obj({
  aiEnabled: bool(),
  aiDailyMessageLimit: int(
    AI_LIMITS.schoolDailyMessageLimit.min,
    AI_LIMITS.schoolDailyMessageLimit.max,
  ).nullable(),
  joinCodesEnabled: bool(),
});

const schoolFields = {
  name: schoolNameSchema,
  country: countrySchema,
  city: citySchema,
  defaultLocale: localeSchema,
};

export const schoolInputSchema = obj(schoolFields) satisfies z.ZodType<SchoolInput>;

/** `settings` is replaced as a whole when present. */
export const schoolPatchSchema = obj({
  ...schoolFields,
  settings: schoolSettingsSchema,
}).partial() satisfies z.ZodType<SchoolPatch>;

/** What a school admin may change about their own school: everything in the patch but the country. */
export const updateSchoolSettingsInputSchema = obj({
  name: schoolNameSchema,
  city: citySchema,
  defaultLocale: localeSchema,
  settings: schoolSettingsSchema,
}).partial() satisfies z.ZodType<UpdateSchoolSettingsInput>;

export const createTeacherInputSchema = obj({
  displayName: displayNameSchema,
  email: accountEmailSchema,
}) satisfies z.ZodType<CreateTeacherInput>;

/** Used by the school admin's and the platform admin's status actions. */
export const setUserStatusInputSchema = obj({
  uid: idSchema,
  status: oneOf(USER_STATUSES),
}) satisfies z.ZodType<SetUserStatusInput>;

/** The list replaces the class's teachers and must still contain its owner (checked by the service). */
export const setClassTeachersInputSchema = obj({
  classId: idSchema,
  teacherUids: uniqueList(idSchema, { min: 1, max: CONTENT_LIMITS.teachersPerClass }),
}) satisfies z.ZodType<SetClassTeachersInput>;
