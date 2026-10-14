import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { assertSystem, type Actor } from '@/lib/auth/actor';
import { assertCan, canManageSchool, canViewSchool, isPlatformAdmin } from '@/lib/auth/authz';
import { ValidationError } from '@/lib/errors';
import { collections } from '@/lib/firebase/collections';
import { createdNow, fromSnapshot, updatedNow } from '@/lib/firebase/converters';
import { parseInput } from '@/lib/schemas/common';
import { schoolInputSchema, schoolPatchSchema } from '@/lib/schemas/school';
import type { Page, PageRequest } from '@/types/common';
import type { SchoolInput } from '@/types/inputs';
import {
  SCHOOL_STATUSES,
  type School,
  type SchoolCounts,
  type SchoolSettings,
  type SchoolStatus,
} from '@/types/school';
import {
  actorUid,
  assertId,
  clampAiDailyMessageLimit,
  readPage,
  updateExisting,
} from './internal-identity';

const DEFAULT_SETTINGS: SchoolSettings = {
  aiEnabled: true,
  aiDailyMessageLimit: null,
  joinCodesEnabled: true,
};

const COUNT_KEYS = ['teachers', 'students', 'classes'] as const satisfies (keyof SchoolCounts)[];

function schoolDoc(schoolId: string) {
  assertId(schoolId);
  return collections.schools().doc(schoolId);
}

function withClampedLimit(school: School): School {
  const aiDailyMessageLimit = clampAiDailyMessageLimit(school.settings.aiDailyMessageLimit);
  return { ...school, settings: { ...school.settings, aiDailyMessageLimit } };
}

export async function getSchool(actor: Actor, schoolId: string): Promise<School> {
  assertCan(canViewSchool(actor, schoolId), 'school.view');
  return withClampedLimit(fromSnapshot<School>(await schoolDoc(schoolId).get()));
}

export async function listSchools(actor: Actor, page?: PageRequest): Promise<Page<School>> {
  assertCan(isPlatformAdmin(actor), 'schools.list');
  const schools = await readPage<School>(
    collections.schools().orderBy('name'),
    collections.schools(),
    page,
    () => true,
  );
  return { ...schools, items: schools.items.map(withClampedLimit) };
}

export async function createSchool(actor: Actor, input: SchoolInput): Promise<School> {
  assertCan(isPlatformAdmin(actor), 'school.create');
  const parsed = parseInput(schoolInputSchema, input);
  if (!parsed.success) throw new ValidationError('Invalid school.', parsed.fieldErrors);

  const ref = collections.schools().doc();
  await ref.create({
    ...parsed.data,
    status: 'active' satisfies SchoolStatus,
    settings: DEFAULT_SETTINGS,
    counts: { teachers: 0, students: 0, classes: 0 } satisfies SchoolCounts,
    createdByUid: actorUid(actor),
    ...createdNow(),
  });
  return fromSnapshot<School>(await ref.get());
}

/** `settings` is replaced as a whole. Only a platform admin may move a school to another country. */
export async function updateSchool(
  actor: Actor,
  schoolId: string,
  patch: Partial<Pick<School, 'name' | 'country' | 'city' | 'defaultLocale' | 'settings'>>,
): Promise<School> {
  assertCan(canManageSchool(actor, schoolId), 'school.update');
  assertCan(patch.country === undefined || isPlatformAdmin(actor), 'school.update.country');
  const parsed = parseInput(schoolPatchSchema, {
    ...patch,
    settings: patch.settings && {
      ...patch.settings,
      aiDailyMessageLimit: clampAiDailyMessageLimit(patch.settings.aiDailyMessageLimit),
    },
  });
  if (!parsed.success) throw new ValidationError('Invalid school patch.', parsed.fieldErrors);

  const ref = schoolDoc(schoolId);
  await updateExisting(ref, { ...parsed.data, ...updatedNow() });
  return withClampedLimit(fromSnapshot<School>(await ref.get()));
}

export async function setSchoolStatus(
  actor: Actor,
  schoolId: string,
  status: School['status'],
): Promise<void> {
  assertCan(isPlatformAdmin(actor), 'school.set_status');
  if (!SCHOOL_STATUSES.includes(status)) {
    throw new ValidationError('Unknown school status.', { status: ['invalid_choice'] });
  }
  await updateExisting(schoolDoc(schoolId), { status, ...updatedNow() });
}

export async function adjustSchoolCounts(
  actor: Actor,
  schoolId: string,
  delta: Partial<School['counts']>,
): Promise<void> {
  assertSystem(actor);
  const increments: Record<string, FieldValue> = {};
  for (const key of COUNT_KEYS) {
    const amount = Object.hasOwn(delta, key) ? delta[key] : undefined;
    if (amount === undefined || amount === 0) continue;
    if (!Number.isInteger(amount)) throw new Error(`counts.${key}: not an integer.`);
    increments[`counts.${key}`] = FieldValue.increment(amount);
  }
  if (Object.keys(increments).length === 0) return;
  await updateExisting(schoolDoc(schoolId), { ...increments, ...updatedNow() });
}
