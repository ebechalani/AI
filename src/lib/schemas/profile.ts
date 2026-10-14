import type { z } from 'zod';
import { AVATAR_IDS } from '@/lib/avatars';
import type { ProfilePatch } from '@/types/inputs';
import { displayNameSchema } from './auth';
import { localeSchema, obj, oneOf } from './common';

/** Every field is optional: the language switcher sends `{ locale }` alone. */
export const profilePatchSchema = obj({
  displayName: displayNameSchema.optional(),
  locale: localeSchema.optional(),
  avatarId: oneOf(AVATAR_IDS).optional(),
}) satisfies z.ZodType<ProfilePatch>;
