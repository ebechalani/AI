import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import type { UserProfile } from '@/types';

/** The fields of `users/{uid}` that the two rule files read. */
type ProfileFields = Pick<UserProfile, 'role' | 'schoolId' | 'status' | 'classIds' | 'displayName'>;

/**
 * One school (`school-a`) with two classes, each with its own teacher and student, a second
 * school that only has an admin, a platform admin, and accounts that must get nothing from
 * their token alone.
 */
export const PROFILES = {
  'student-a': {
    role: 'student',
    schoolId: 'school-a',
    status: 'active',
    classIds: ['class-a'],
    displayName: 'Maya K.',
  },
  'student-b': {
    role: 'student',
    schoolId: 'school-a',
    status: 'active',
    classIds: ['class-b'],
    displayName: 'Omar H.',
  },
  'teacher-a': {
    role: 'teacher',
    schoolId: 'school-a',
    status: 'active',
    classIds: ['class-a'],
    displayName: 'Nadia Haddad',
  },
  'teacher-b': {
    role: 'teacher',
    schoolId: 'school-a',
    status: 'active',
    classIds: ['class-b'],
    displayName: 'Karim Saad',
  },
  'admin-a': {
    role: 'school_admin',
    schoolId: 'school-a',
    status: 'active',
    classIds: [],
    displayName: 'Rita Khoury',
  },
  'admin-b': {
    role: 'school_admin',
    schoolId: 'school-b',
    status: 'active',
    classIds: [],
    displayName: 'Sami Aoun',
  },
  platform: {
    role: 'platform_admin',
    schoolId: null,
    status: 'active',
    classIds: [],
    displayName: 'RoboHolic Admin',
  },
  /** An individual learner: no school, no class. */
  solo: {
    role: 'student',
    schoolId: null,
    status: 'active',
    classIds: [],
    displayName: 'Lea M.',
  },
  'disabled-student': {
    role: 'student',
    schoolId: 'school-a',
    status: 'disabled',
    classIds: ['class-a'],
    displayName: 'Jad N.',
  },
  'disabled-teacher': {
    role: 'teacher',
    schoolId: 'school-a',
    status: 'disabled',
    classIds: ['class-a'],
    displayName: 'Hala T.',
  },
  'disabled-admin': {
    role: 'platform_admin',
    schoolId: null,
    status: 'disabled',
    classIds: [],
    displayName: 'Former Admin',
  },
  /** Changed from teacher to student; class-a still lists the uid among its teachers. */
  'former-teacher': {
    role: 'student',
    schoolId: 'school-a',
    status: 'active',
    classIds: [],
    displayName: 'Tarek B.',
  },
  /** Not a shape the server writes: a school admin whose profile names no school. */
  'orphan-admin': {
    role: 'school_admin',
    schoolId: null,
    status: 'active',
    classIds: [],
    displayName: 'Mona S.',
  },
  /** Demoted to a student of another school; the token still carries the old claims. */
  demoted: {
    role: 'student',
    schoolId: 'school-b',
    status: 'active',
    classIds: [],
    displayName: 'Ziad F.',
  },
} satisfies Record<string, ProfileFields>;

export type ProfileUid = keyof typeof PROFILES;

/** A Firebase Auth account that never got a profile document. */
export const NO_PROFILE_UID = 'no-profile';

/** The claims `demoted` had before the demotion. */
export const STALE_CLAIMS = { role: 'platform_admin', schoolId: 'school-a' };

/** The eight callers every collection is tested against, by uid (null = not signed in). */
export const ACTORS = {
  anonymous: null,
  student: 'student-a',
  otherStudent: 'student-b',
  classTeacher: 'teacher-a',
  otherTeacher: 'teacher-b',
  schoolAdmin: 'admin-a',
  otherSchoolAdmin: 'admin-b',
  platformAdmin: 'platform',
} as const satisfies Record<string, ProfileUid | null>;

export type ActorName = keyof typeof ACTORS;
export const ACTOR_NAMES = Object.keys(ACTORS) as ActorName[];

function rulesSource(fileName: string): string {
  return readFileSync(new URL(`../../${fileName}`, import.meta.url), 'utf8');
}

/**
 * Loads both rule files into the running emulators, so a test never runs against rules that
 * were current when the emulators started. The emulator addresses come from the environment
 * that `firebase emulators:exec` sets (`npm run test:rules`).
 */
export function startRulesEnvironment(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: process.env.GCLOUD_PROJECT ?? 'demo-roboholic',
    firestore: { rules: rulesSource('firestore.rules') },
    storage: { rules: rulesSource('storage.rules') },
  });
}

export function contextFor(env: RulesTestEnvironment, uid: string | null): RulesTestContext {
  return uid === null ? env.unauthenticatedContext() : env.authenticatedContext(uid);
}

export async function seedProfiles(env: RulesTestEnvironment): Promise<void> {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const batch = db.batch();
    for (const [uid, profile] of Object.entries(PROFILES))
      batch.set(db.doc(`users/${uid}`), profile);
    await batch.commit();
  });
}
