import { CONTENT_LIMITS } from '@/lib/limits';
import type { SchoolClass } from '@/types/school';
import type { UserProfile } from '@/types/user';

// The classes of a school as its admin manages them: the active / archived split, the owner
// picker of "New class", and who teaches a class. The roster's empty state is WS-E's
// `rosterEmptyVariant`. No React, so Vitest can import it.

export function splitClasses(classes: readonly SchoolClass[]): {
  active: SchoolClass[];
  archived: SchoolClass[];
} {
  return {
    active: classes.filter((cls) => !cls.archived),
    archived: classes.filter((cls) => cls.archived),
  };
}

export function teacherIndex(teachers: readonly UserProfile[]): Map<string, UserProfile> {
  return new Map(teachers.map((teacher) => [teacher.id, teacher]));
}

function byDisplayName(a: Pick<UserProfile, 'displayName'>, b: Pick<UserProfile, 'displayName'>) {
  return a.displayName.localeCompare(b.displayName);
}

/** The active teachers by name: who may own a new class. */
export function ownerOptions(teachers: readonly UserProfile[]): { value: string; label: string }[] {
  return teachers
    .filter((teacher) => teacher.status === 'active')
    .sort(byDisplayName)
    .map((teacher) => ({ value: teacher.id, label: teacher.displayName }));
}

export interface ClassTeacher {
  uid: string;
  /** null: no longer a teacher of the school. */
  name: string | null;
  owner: boolean;
  disabled: boolean;
}

/** The class's teachers: the owner first, then by name (former teachers last). */
export function classTeachers(
  cls: Pick<SchoolClass, 'ownerUid' | 'teacherUids'>,
  index: ReadonlyMap<string, UserProfile>,
): ClassTeacher[] {
  const uids = [cls.ownerUid, ...cls.teacherUids.filter((uid) => uid !== cls.ownerUid)];
  const teachers = [...new Set(uids)].map((uid): ClassTeacher => {
    const profile = index.get(uid);
    return {
      uid,
      name: profile?.displayName ?? null,
      owner: uid === cls.ownerUid,
      disabled: profile?.status === 'disabled',
    };
  });
  const [owner, ...others] = teachers;
  others.sort((a, b) => {
    if (a.name === null || b.name === null) return a.name === null ? (b.name === null ? 0 : 1) : -1;
    return a.name.localeCompare(b.name);
  });
  return owner === undefined ? others : [owner, ...others];
}

/** The names on a class card: `classTeachers` without the former teachers. */
export function classTeacherNames(
  cls: Pick<SchoolClass, 'ownerUid' | 'teacherUids'>,
  index: ReadonlyMap<string, UserProfile>,
): string[] {
  return classTeachers(cls, index)
    .map((teacher) => teacher.name)
    .filter((name): name is string => name !== null);
}

export interface TeacherOption {
  uid: string;
  name: string;
  checked: boolean;
  /** The owner: always checked, never unchecked. */
  locked: boolean;
}

export interface TeacherPicker {
  /** Every active teacher of the school: the owner first (checked, locked), then by name. */
  options: TeacherOption[];
  /** The uids checked at opening: the owner and the current active co-teachers. */
  initial: string[];
  /**
   * Current co-teachers that `setClassTeachers` would refuse (`invalid_choice`), so saving drops
   * them: a disabled account (its name), or a uid that is no longer a teacher of the school
   * (null). The owner is never here (see `ownerDisabled`).
   */
  dropped: (string | null)[];
  /** The owner's account is disabled: `setClassTeachers` refuses every list. */
  ownerDisabled: boolean;
  max: number;
}

export function teacherPicker(
  cls: Pick<SchoolClass, 'ownerUid' | 'teacherUids'>,
  teachers: readonly UserProfile[],
): TeacherPicker {
  const index = teacherIndex(teachers);
  const owner = index.get(cls.ownerUid);
  const active = teachers.filter((teacher) => teacher.status === 'active');
  const current = new Set(cls.teacherUids);

  const others = active
    .filter((teacher) => teacher.id !== cls.ownerUid)
    .sort(byDisplayName)
    .map(
      (teacher): TeacherOption => ({
        uid: teacher.id,
        name: teacher.displayName,
        checked: current.has(teacher.id),
        locked: false,
      }),
    );
  const options: TeacherOption[] =
    owner !== undefined && owner.status === 'active'
      ? [{ uid: owner.id, name: owner.displayName, checked: true, locked: true }, ...others]
      : others;

  const dropped: (string | null)[] = [];
  for (const uid of new Set(cls.teacherUids)) {
    if (uid === cls.ownerUid) continue;
    const teacher = index.get(uid);
    if (teacher === undefined) dropped.push(null);
    else if (teacher.status !== 'active') dropped.push(teacher.displayName);
  }

  return {
    options,
    initial: options.filter((option) => option.checked).map((option) => option.uid),
    dropped,
    ownerDisabled: owner?.status !== 'active',
    max: CONTENT_LIMITS.teachersPerClass,
  };
}

/** Checks or unchecks `uid`; never unchecks the owner; never goes above `max`. */
export function toggleTeacher(
  selected: readonly string[],
  uid: string,
  ownerUid: string,
  max: number,
): string[] {
  if (selected.includes(uid)) {
    return uid === ownerUid ? [...selected] : selected.filter((value) => value !== uid);
  }
  return selected.length >= max ? [...selected] : [...selected, uid];
}

/** The action's list: the owner first, then the others, each once. */
export function teachersPayload(selected: readonly string[], ownerUid: string): string[] {
  return [...new Set([ownerUid, ...selected])];
}
