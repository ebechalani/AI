import { z } from 'zod';
import { CONTENT_LIMITS, JOIN_CODE, SELF_SIGNUP_AGE_BANDS, USERNAME_PATTERN } from '@/lib/limits';
import { AGE_BANDS } from '@/types/common';
import type {
  CompleteSignupInput,
  CreateSessionInput,
  JoinSignupInput,
  LookupJoinCodeInput,
  SignupInput,
} from '@/types/inputs';
import {
  emailSchema,
  localeSchema,
  obj,
  oneOf,
  requiredText,
  text,
  unionOf,
  whenPresent,
} from './common';

// --- Fields, also used on their own by the login, sign-up and settings forms --------------------

export const displayNameSchema = z
  .string({ error: whenPresent('invalid') })
  .trim()
  .min(CONTENT_LIMITS.displayNameMinChars, 'display_name_length')
  .max(CONTENT_LIMITS.displayNameMaxChars, 'display_name_length');

export const accountEmailSchema = emailSchema(CONTENT_LIMITS.emailChars);

/** Lower-cased before it is checked, so "Lea.M" is accepted as "lea.m". */
export const usernameSchema = z
  .string({ error: whenPresent('username_invalid') })
  .trim()
  .toLowerCase()
  .regex(USERNAME_PATTERN, 'username_invalid');

export const passwordSchema = z
  .string({ error: whenPresent('invalid') })
  .min(CONTENT_LIMITS.passwordMinChars, 'password_too_short')
  .max(CONTENT_LIMITS.passwordMaxChars, 'too_long');

const JOIN_CODE_PATTERN = new RegExp(`^[${JOIN_CODE.alphabet}]{${JOIN_CODE.length}}$`);

/** Upper-cased and stripped of spaces and dashes before it is checked. */
export const joinCodeSchema = z
  .string({ error: whenPresent('join_code_invalid') })
  .transform((value) => value.replace(/[\s-]/g, '').toUpperCase())
  .pipe(z.string().regex(JOIN_CODE_PATTERN, 'join_code_invalid'));

export const ageBandSchema = oneOf(AGE_BANDS);

const acceptedTermsSchema = z.literal(true, { error: 'terms_required' });

const idTokenSchema = requiredText(CONTENT_LIMITS.idTokenChars, { trim: false });

// --- Action inputs -----------------------------------------------------------------------------

export const createSessionInputSchema = obj({
  idToken: idTokenSchema,
  next: text(CONTENT_LIMITS.nextPathChars).nullable().optional(),
}) satisfies z.ZodType<CreateSessionInput>;

const signupFields = {
  displayName: displayNameSchema,
  role: unionOf<SignupInput['role']>()(['student', 'teacher']),
  ageBand: ageBandSchema,
  locale: localeSchema,
  acceptedTerms: acceptedTermsSchema,
};

function checkSignupAgeBand(
  value: Pick<SignupInput, 'role' | 'ageBand'>,
  ctx: z.core.$RefinementCtx,
) {
  const allowed =
    value.role === 'teacher'
      ? value.ageBand === 'adult'
      : SELF_SIGNUP_AGE_BANDS.includes(value.ageBand);
  if (!allowed) {
    ctx.addIssue({ code: 'custom', message: 'age_band_not_allowed', path: ['ageBand'] });
  }
}

export const signupInputSchema = obj(signupFields).superRefine(
  checkSignupAgeBand,
) satisfies z.ZodType<SignupInput>;

export const completeSignupInputSchema = obj({
  idToken: idTokenSchema,
  ...signupFields,
}).superRefine(checkSignupAgeBand) satisfies z.ZodType<CompleteSignupInput>;

export const lookupJoinCodeInputSchema = obj({
  joinCode: joinCodeSchema,
}) satisfies z.ZodType<LookupJoinCodeInput>;

/** Whether the age band is allowed in that class is decided by the server (account policy). */
export const joinSignupInputSchema = obj({
  joinCode: joinCodeSchema,
  displayName: displayNameSchema,
  username: usernameSchema,
  password: passwordSchema,
  ageBand: ageBandSchema,
  locale: localeSchema,
  acceptedTerms: acceptedTermsSchema,
}) satisfies z.ZodType<JoinSignupInput>;
