'use server';

import { runAction } from '@/lib/actions/run-action';
import { updateProfile } from '@/lib/data/users';
import { profilePatchSchema } from '@/lib/schemas/profile';
import type { ActionResult } from '@/types/actions';
import { ROLES } from '@/types/common';
import type { ProfilePatch } from '@/types/inputs';

/**
 * The signed-in user's display name, language and avatar (ARCHITECTURE.md 10.4: every role).
 * Also the `persistLocale` of every AppShell and of the (shared) layout's LocaleSwitcher, which
 * sends `{ locale }` alone. Always the session's own profile: the schema has no uid, and
 * unknown keys are dropped.
 */
export async function updateProfileAction(input: ProfilePatch): Promise<ActionResult<null>> {
  return runAction(
    profilePatchSchema,
    input,
    async (data, session) => {
      // Nothing to write: answer without a write (the forms never send an empty patch).
      if (
        data.displayName === undefined &&
        data.locale === undefined &&
        data.avatarId === undefined
      ) {
        return null;
      }
      await updateProfile(session, session.uid, data);
      return null;
    },
    { roles: ROLES },
  );
}
