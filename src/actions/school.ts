'use server';

import { runAction } from '@/lib/actions/run-action';
import { updateSchool } from '@/lib/data/schools';
import { ForbiddenError } from '@/lib/errors';
import {
  createTeacherInputSchema,
  setClassTeachersInputSchema,
  setUserStatusInputSchema,
  updateSchoolSettingsInputSchema,
} from '@/lib/schemas/school';
import { setClassTeachers } from '@/lib/services/classroom';
import { createTeacher, setUserStatus } from '@/lib/services/provisioning';
import type { ActionResult } from '@/types/actions';
import type { Role } from '@/types/common';
import type {
  CreateTeacherInput,
  SetClassTeachersInput,
  SetUserStatusInput,
  UpdateSchoolSettingsInput,
} from '@/types/inputs';
import type { Session } from '@/types/user';

// The school admin's actions (ARCHITECTURE.md 10.4). The role gate is coarse: the services and
// repositories authorize the school, the user and the class, and their codes reach the client
// unchanged. The school is always the admin's own, never one named in the payload (the schemas
// drop unknown keys, so a `schoolId` or a `country` sent here never reaches a service). No
// revalidatePath: the client containers call router.refresh().

const SCHOOL_ADMINS: readonly Role[] = ['school_admin'];

/** The admin's school. A school admin without one is refused. */
function schoolOf(session: Session): string {
  if (session.schoolId === null) throw new ForbiddenError('A school admin without a school.');
  return session.schoolId;
}

/** A teacher account without a password: the page then sends the password email. */
export async function createTeacherAction(
  input: CreateTeacherInput,
): Promise<ActionResult<{ uid: string; email: string }>> {
  return runAction(
    createTeacherInputSchema,
    input,
    async ({ displayName, email }, session) => {
      const profile = await createTeacher(session, {
        displayName,
        email,
        schoolId: schoolOf(session),
      });
      return { uid: profile.id, email: profile.email ?? email };
    },
    { roles: SCHOOL_ADMINS },
  );
}

/** Disable or enable a teacher or a student of the school. */
export async function setSchoolUserStatusAction(
  input: SetUserStatusInput,
): Promise<ActionResult<null>> {
  return runAction(
    setUserStatusInputSchema,
    input,
    async ({ uid, status }, session) => {
      await setUserStatus(session, uid, status);
      return null;
    },
    { roles: SCHOOL_ADMINS },
  );
}

/** Name, city, default language and the switches; `settings` is replaced as a whole. */
export async function updateSchoolSettingsAction(
  input: UpdateSchoolSettingsInput,
): Promise<ActionResult<null>> {
  return runAction(
    updateSchoolSettingsInputSchema,
    input,
    async (patch, session) => {
      await updateSchool(session, schoolOf(session), patch);
      return null;
    },
    { roles: SCHOOL_ADMINS },
  );
}

/** The class's teachers: the owner and up to four co-teachers of the school. */
export async function setClassTeachersAction(
  input: SetClassTeachersInput,
): Promise<ActionResult<null>> {
  return runAction(
    setClassTeachersInputSchema,
    input,
    async ({ classId, teacherUids }, session) => {
      await setClassTeachers(session, classId, teacherUids);
      return null;
    },
    { roles: SCHOOL_ADMINS },
  );
}
