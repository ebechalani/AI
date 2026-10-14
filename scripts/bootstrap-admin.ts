// The first platform admin (ARCHITECTURE.md 1.5, path 7): creates or promotes the account of
// an email address. A new Auth user gets a password-reset link; an existing one must have a
// verified address. Either way the user's sessions are invalidated, so a cookie issued before
// the promotion cannot inherit the role.
//
//   npm run admin:bootstrap -- <email> [--name "Display Name"] [--locale en]
//                              [--allow-project <id>] [--yes]

import type { z } from 'zod';
import { SYSTEM_ACTOR } from '@/lib/auth/actor';
import { syncClaims } from '@/lib/auth/claims';
import { writeAudit } from '@/lib/data/audit';
import { removeUserFromAllClasses } from '@/lib/data/classes';
import { createUserProfile, getUser } from '@/lib/data/users';
import { ConflictError } from '@/lib/errors';
import { getAdminAuth } from '@/lib/firebase/admin';
import { accountEmailSchema, displayNameSchema } from '@/lib/schemas/auth';
import { localeSchema, parseInput } from '@/lib/schemas/common';
import { applyIdentityChange, invalidateSessions } from '@/lib/services/identity';
import type { Locale } from '@/types/common';
import type { UserProfile } from '@/types/user';
import {
  COMMON_USAGE,
  connect,
  parseScriptArgs,
  runScript,
  ScriptError,
  step,
  targetOptions,
} from './lib/admin';
import { ifFound } from './lib/firestore';

const USAGE = `Usage: npm run admin:bootstrap -- <email> [options]

Creates the Auth account of <email> when none exists (and prints a password-reset link), or
promotes the existing, verified account; then makes it a platform admin.

  --name <display name>  the profile's display name (default: the part before the @)
  --locale <en|fr>       the profile's language (default: en)
${COMMON_USAGE}`;

function authErrorCode(error: unknown): string | null {
  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
    ? error.code
    : null;
}

function parsedOrThrow<T>(schema: z.ZodType<T>, input: unknown, what: string): T {
  const result = parseInput(schema, input);
  if (!result.success) throw new ScriptError(`${what}: ${JSON.stringify(result.fieldErrors)}`);
  return result.data;
}

async function ensureAuthUser(
  email: string,
  displayName: string,
): Promise<{ uid: string; created: boolean }> {
  const auth = getAdminAuth();
  try {
    const user = await auth.getUserByEmail(email);
    if (!user.emailVerified) {
      throw new ScriptError(
        `The account ${email} exists but its address is not verified. Verify it first (sign in once and follow the verification email), then run this again.`,
      );
    }
    if (user.disabled) throw new ScriptError(`The account ${email} is disabled.`);
    return { uid: user.uid, created: false };
  } catch (error) {
    if (authErrorCode(error) !== 'auth/user-not-found') throw error;
  }
  const user = await auth.createUser({ email, displayName, emailVerified: false });
  console.log(`   created the Auth account ${email} (uid ${user.uid})`);
  try {
    const link = await auth.generatePasswordResetLink(email);
    console.log(`\n   Password-reset link (set the password with it):\n   ${link}\n`);
  } catch (error) {
    console.warn(
      `   Could not generate a password-reset link (${error instanceof Error ? error.message : String(error)}); use "Forgot password" on the login page instead.`,
    );
  }
  return { uid: user.uid, created: true };
}

async function promote(profile: UserProfile): Promise<void> {
  try {
    await removeUserFromAllClasses(SYSTEM_ACTOR, profile.id);
  } catch (error) {
    if (error instanceof ConflictError) {
      throw new ScriptError(
        `${profile.id} owns a class that is not archived; archive it or hand it over first.`,
      );
    }
    throw error;
  }
  await applyIdentityChange(
    profile.id,
    { role: 'platform_admin', schoolId: null },
    { invalidateSessions: true },
  );
  await writeAudit(SYSTEM_ACTOR, {
    action: 'user.role_changed',
    targetType: 'user',
    targetId: profile.id,
    schoolId: null,
    meta: {
      role: 'platform_admin',
      previousRole: profile.role,
      previousSchoolId: profile.schoolId,
    },
  });
}

async function main(): Promise<void> {
  const { values, positionals } = parseScriptArgs(
    { name: { type: 'string' }, locale: { type: 'string', default: 'en' } },
    USAGE,
  );
  if (positionals.length !== 1) throw new ScriptError(USAGE);
  const email = parsedOrThrow<string>(accountEmailSchema, positionals[0], 'email');
  const displayName = parsedOrThrow<string>(
    displayNameSchema,
    values.name ?? email.slice(0, email.indexOf('@')),
    '--name',
  );
  const locale = parsedOrThrow<Locale>(localeSchema, values.locale, '--locale');
  await connect(targetOptions(values));

  step(`Platform admin ${email}`);
  const { uid, created } = await ensureAuthUser(email, displayName);

  const profile = await ifFound(getUser(SYSTEM_ACTOR, uid));
  if (profile === null) {
    await createUserProfile(SYSTEM_ACTOR, uid, {
      role: 'platform_admin',
      schoolId: null,
      displayName,
      username: null,
      email,
      ageBand: 'adult',
      locale,
      consentBasis: 'adult',
      provisionedByUid: null,
    });
    await syncClaims(uid);
    await invalidateSessions(uid);
    console.log(`   created the profile users/${uid} as platform_admin`);
  } else if (profile.role === 'platform_admin') {
    await invalidateSessions(uid);
    console.log(`   users/${uid} is already a platform admin; its sessions were invalidated`);
  } else {
    await promote(profile);
    console.log(`   promoted users/${uid} from ${profile.role} to platform_admin`);
  }
  if (created) {
    console.log(
      '   The new account signs in once its password is set; the login page asks it to verify the address if the reset link did not.',
    );
  }
}

runScript(main);
