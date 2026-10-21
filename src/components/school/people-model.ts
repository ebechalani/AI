import type { SchoolClass } from '@/types/school';
import type { UserProfile } from '@/types/user';

// What the teachers and students lists may offer on each row, and the classes each person is
// in. No React, so Vitest can import it.

export type StatusAction = 'disable' | 'enable';

/** A teacher: 'disable' while active, 'enable' while disabled. */
export function teacherStatusAction(teacher: Pick<UserProfile, 'status'>): StatusAction {
  return teacher.status === 'active' ? 'disable' : 'enable';
}

/**
 * A student: a username account can be disabled, enabled and given a new password. An email
 * account (username null) is never disabled by the school (`setUserStatus` refuses) and has no
 * generated password: only 'enable', when a platform admin disabled it.
 */
export function studentActions(student: Pick<UserProfile, 'status' | 'username'>): {
  status: StatusAction | null;
  resetPassword: boolean;
} {
  if (student.username !== null) {
    return {
      status: student.status === 'active' ? 'disable' : 'enable',
      resetPassword: true,
    };
  }
  return { status: student.status === 'disabled' ? 'enable' : null, resetPassword: false };
}

/** The password email goes only to an active teacher with an address. */
export function canSendPasswordEmail(teacher: Pick<UserProfile, 'status' | 'email'>): boolean {
  return teacher.status === 'active' && teacher.email !== null && teacher.email !== '';
}

export interface ClassRef {
  id: string;
  name: string;
  archived: boolean;
}

/** id → ClassRef, from `listClassesForSchool(…, { includeArchived: true })`. */
export function classIndex(classes: readonly SchoolClass[]): Map<string, ClassRef> {
  return new Map(
    classes.map((cls) => [cls.id, { id: cls.id, name: cls.name, archived: cls.archived }]),
  );
}

function byName(a: ClassRef, b: ClassRef): number {
  return a.name.localeCompare(b.name);
}

/** The known classes of `classIds`: active ones first, each group by name; unknown ids dropped. */
export function classRefsFor(
  classIds: readonly string[],
  index: ReadonlyMap<string, ClassRef>,
): ClassRef[] {
  const refs = [...new Set(classIds)]
    .map((id) => index.get(id))
    .filter((ref): ref is ClassRef => ref !== undefined);
  return [
    ...refs.filter((ref) => !ref.archived).sort(byName),
    ...refs.filter((ref) => ref.archived).sort(byName),
  ];
}

/** The active classes whose teachers include `uid`, by name (a profile's classIds keep archived ones). */
export function activeClassesOf(uid: string, classes: readonly SchoolClass[]): ClassRef[] {
  return classes
    .filter((cls) => !cls.archived && cls.teacherUids.includes(uid))
    .map((cls) => ({ id: cls.id, name: cls.name, archived: false }))
    .sort(byName);
}
