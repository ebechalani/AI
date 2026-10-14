// The demo organisation and accounts of ARCHITECTURE.md 11.6, as data: the school, its licence,
// the class "Grade 6 A" and the seven accounts. scripts/seed/index.ts creates them;
// tests/unit/seed-content.test.ts checks the invariants it relies on. Pure: nothing here
// touches Firebase.

import { usernameToEmail } from '@/lib/auth/username';
import type { AvatarId } from '@/lib/avatars';
import type { AgeBand, Locale, Role } from '@/types/common';
import type { ClassInput, LicenseInput, SchoolInput } from '@/types/inputs';
import type { ConsentBasis } from '@/types/user';

export const DEMO_EMAIL_DOMAIN = 'demo.roboholic.test';

/** The password of every demo account on the emulators when SEED_DEMO_PASSWORD is not set. */
export const DEFAULT_DEMO_PASSWORD = 'demo-password';

/** A real project only accepts a configured password of at least this length (11.6). */
export const PROJECT_PASSWORD_MIN_CHARS = 16;

/** The join code of the demo class on the emulators; a real project keeps a random, disabled one. */
export const DEMO_JOIN_CODE = 'RBHDEM23';

export const DEMO_SCHOOL: SchoolInput = {
  name: 'Demo Academy',
  country: 'LB',
  city: 'Beirut',
  defaultLocale: 'en',
};

export const DEMO_LICENSE_NAME = 'Demo Academy annual licence';

const DAY_MS = 24 * 60 * 60 * 1000;

/** An active licence over every official course, started a month ago and valid for a year. */
export function demoLicenseInput(schoolId: string, now: Date): LicenseInput {
  return {
    schoolId,
    subscriptionId: null,
    name: DEMO_LICENSE_NAME,
    seatsTotal: 100,
    scope: { type: 'all_official' },
    startsAt: new Date(now.getTime() - 30 * DAY_MS).toISOString(),
    endsAt: new Date(now.getTime() + 335 * DAY_MS).toISOString(),
    status: 'active',
  };
}

export const DEMO_CLASS: ClassInput = {
  name: 'Grade 6 A',
  gradeLabel: 'Grade 6',
  ageBand: '11-12',
};

export type DemoAccountKey =
  'admin' | 'schoolAdmin' | 'teacher' | 'student' | 'lea' | 'omar' | 'maya';

export interface DemoAccount {
  key: DemoAccountKey;
  /** The Auth uid the seed asks for; an account that already holds the address keeps its own. */
  uid: string;
  role: Role;
  displayName: string;
  /** The sign-in address; a username account signs in with its username. */
  email: string;
  username: string | null;
  ageBand: AgeBand;
  locale: Locale;
  consentBasis: ConsentBasis;
  /** Belongs to Demo Academy. */
  inSchool: boolean;
  /** Never created on a real project (11.6). */
  emulatorOnly: boolean;
  avatarId: AvatarId;
}

function emailAccount(
  key: DemoAccountKey,
  uid: string,
  role: Role,
  displayName: string,
  localPart: string,
  fields: Partial<DemoAccount> = {},
): DemoAccount {
  return {
    key,
    uid,
    role,
    displayName,
    email: `${localPart}@${DEMO_EMAIL_DOMAIN}`,
    username: null,
    ageBand: 'adult',
    locale: 'en',
    consentBasis: 'adult',
    inSchool: true,
    emulatorOnly: false,
    avatarId: 'robot',
    ...fields,
  };
}

function classStudent(
  key: DemoAccountKey,
  uid: string,
  displayName: string,
  username: string,
  locale: Locale,
  avatarId: AvatarId,
): DemoAccount {
  return {
    key,
    uid,
    role: 'student',
    displayName,
    email: usernameToEmail(username),
    username,
    ageBand: '11-12',
    locale,
    consentBasis: 'school',
    inSchool: true,
    emulatorOnly: false,
    avatarId,
  };
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  emailAccount('admin', 'demo-admin', 'platform_admin', 'RoboHolic Admin', 'admin', {
    inSchool: false,
    emulatorOnly: true,
    avatarId: 'gear',
  }),
  emailAccount('schoolAdmin', 'demo-school-admin', 'school_admin', 'Rita Demo', 'schooladmin', {
    avatarId: 'compass',
  }),
  emailAccount('teacher', 'demo-teacher', 'teacher', 'Nadia Demo', 'teacher', {
    avatarId: 'bulb',
  }),
  emailAccount('student', 'demo-student', 'student', 'Sam Demo', 'student', {
    ageBand: '13-15',
    consentBasis: 'self_13_plus',
    inSchool: false,
    avatarId: 'rocket',
  }),
  classStudent('lea', 'demo-lea', 'Lea Demo', 'lea.demo', 'en', 'star'),
  classStudent('omar', 'demo-omar', 'Omar Demo', 'omar.demo', 'fr', 'planet'),
  classStudent('maya', 'demo-maya', 'Maya Demo', 'maya.demo', 'en', 'satellite'),
];

/** The members of "Grade 6 A", in roster order. */
export const DEMO_CLASS_STUDENTS: readonly DemoAccountKey[] = ['lea', 'omar', 'maya'];

export function demoAccount(key: DemoAccountKey): DemoAccount {
  const account = DEMO_ACCOUNTS.find((candidate) => candidate.key === key);
  if (account === undefined) throw new Error(`No demo account "${key}".`);
  return account;
}

/**
 * The password rules of 11.6: on the emulators SEED_DEMO_PASSWORD or the documented default;
 * on a real project SEED_DEMO_PASSWORD of at least 16 characters, or the seed refuses.
 */
export function resolveDemoPassword(
  mode: 'emulator' | 'project',
  configured: string | undefined,
): { password: string; source: 'SEED_DEMO_PASSWORD' | 'default' } {
  const value = configured?.trim() ?? '';
  if (mode === 'project') {
    if (value.length < PROJECT_PASSWORD_MIN_CHARS) {
      throw new Error(
        `SEED_DEMO_PASSWORD must be set to at least ${PROJECT_PASSWORD_MIN_CHARS} characters to create demo accounts on a real project.`,
      );
    }
    return { password: value, source: 'SEED_DEMO_PASSWORD' };
  }
  return value === ''
    ? { password: DEFAULT_DEMO_PASSWORD, source: 'default' }
    : { password: value, source: 'SEED_DEMO_PASSWORD' };
}
