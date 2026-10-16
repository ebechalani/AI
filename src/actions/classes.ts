'use server';

import { runAction } from '@/lib/actions/run-action';
import { archiveClass, regenerateJoinCode, updateClass } from '@/lib/data/classes';
import {
  addStudentsInputSchema,
  assignCourseInputSchema,
  awardBadgeInputSchema,
  classInputSchema,
  classRefInputSchema,
  joinClassInputSchema,
  removeStudentInputSchema,
  resetStudentPasswordInputSchema,
  unassignCourseInputSchema,
  updateClassInputSchema,
} from '@/lib/schemas/class';
import {
  assignCourseToClass,
  createClass,
  joinClassWithCode,
  removeStudentFromClass,
  unassignCourseFromClass,
} from '@/lib/services/classroom';
import { provisionStudents, resetStudentPassword } from '@/lib/services/provisioning';
import { awardManualBadge } from '@/lib/services/recognition';
import type { ActionResult } from '@/types/actions';
import type { Role } from '@/types/common';
import type {
  AddStudentsInput,
  AssignCourseInput,
  AwardBadgeInput,
  ClassInput,
  ClassRefInput,
  JoinClassInput,
  RemoveStudentInput,
  ResetStudentPasswordInput,
  UnassignCourseInput,
  UpdateClassInput,
} from '@/types/inputs';

// Classes, students and recognition (ARCHITECTURE.md 10.4). The role gate is coarse: the
// classroom, provisioning and recognition services authorize the class, the student and the
// badge, and their codes reach the client unchanged. No revalidatePath: the client containers
// call router.refresh(). Generated passwords are only ever in the responses, never logged.

const CREATORS: readonly Role[] = ['teacher', 'school_admin'];
const MANAGERS: readonly Role[] = ['teacher', 'school_admin', 'platform_admin'];
const AWARDERS: readonly Role[] = ['teacher', 'platform_admin'];

export async function createClassAction(
  input: ClassInput,
): Promise<ActionResult<{ classId: string }>> {
  return runAction(
    classInputSchema,
    input,
    async (data, session) => {
      const cls = await createClass(session, data);
      return { classId: cls.id };
    },
    { roles: CREATORS },
  );
}

/** Rename, change the grade or age group, or open / extend / close the join code. */
export async function updateClassAction(input: UpdateClassInput): Promise<ActionResult<null>> {
  return runAction(
    updateClassInputSchema,
    input,
    async ({ classId, ...patch }, session) => {
      await updateClass(session, classId, patch);
      return null;
    },
    { roles: MANAGERS },
  );
}

export async function archiveClassAction(input: ClassRefInput): Promise<ActionResult<null>> {
  return runAction(
    classRefInputSchema,
    input,
    async ({ classId }, session) => {
      await archiveClass(session, classId);
      return null;
    },
    { roles: MANAGERS },
  );
}

export async function regenerateJoinCodeAction(
  input: ClassRefInput,
): Promise<ActionResult<{ joinCode: string }>> {
  return runAction(
    classRefInputSchema,
    input,
    async ({ classId }, session) => ({ joinCode: await regenerateJoinCode(session, classId) }),
    { roles: MANAGERS },
  );
}

/**
 * Creates username accounts one by one. Not atomic: when one fails, the earlier ones exist and
 * the call answers `conflict` or `internal`; the client then refreshes the roster.
 */
export async function addStudentsAction(
  input: AddStudentsInput,
): Promise<
  ActionResult<{ credentials: { displayName: string; username: string; password: string }[] }>
> {
  return runAction(
    addStudentsInputSchema,
    input,
    async ({ classId, students }, session) => {
      const created = await provisionStudents(session, classId, students);
      return {
        credentials: created.map(({ displayName, username, password }) => ({
          displayName,
          username,
          password,
        })),
      };
    },
    { roles: MANAGERS },
  );
}

export async function removeStudentAction(input: RemoveStudentInput): Promise<ActionResult<null>> {
  return runAction(
    removeStudentInputSchema,
    input,
    async ({ classId, studentUid }, session) => {
      await removeStudentFromClass(session, classId, studentUid);
      return null;
    },
    { roles: MANAGERS },
  );
}

export async function resetStudentPasswordAction(
  input: ResetStudentPasswordInput,
): Promise<ActionResult<{ username: string; password: string }>> {
  return runAction(
    resetStudentPasswordInputSchema,
    input,
    async ({ studentUid }, session) => {
      const { username, password } = await resetStudentPassword(session, studentUid);
      return { username, password };
    },
    { roles: MANAGERS },
  );
}

/** Assigns a course, or replaces the due date of a course already assigned. */
export async function assignCourseAction(input: AssignCourseInput): Promise<ActionResult<null>> {
  return runAction(
    assignCourseInputSchema,
    input,
    async ({ classId, courseId, dueAt }, session) => {
      await assignCourseToClass(session, classId, courseId, dueAt);
      return null;
    },
    { roles: MANAGERS },
  );
}

export async function unassignCourseAction(
  input: UnassignCourseInput,
): Promise<ActionResult<null>> {
  return runAction(
    unassignCourseInputSchema,
    input,
    async ({ classId, courseId }, session) => {
      await unassignCourseFromClass(session, classId, courseId);
      return null;
    },
    { roles: MANAGERS },
  );
}

/** A signed-in student joins with a class code (normalised by the schema). */
export async function joinClassAction(
  input: JoinClassInput,
): Promise<ActionResult<{ classId: string; className: string }>> {
  return runAction(
    joinClassInputSchema,
    input,
    async ({ joinCode }, session) => {
      const cls = await joinClassWithCode(session, joinCode);
      return { classId: cls.id, className: cls.name };
    },
    { roles: ['student'] },
  );
}

export async function awardBadgeAction(
  input: AwardBadgeInput,
): Promise<ActionResult<{ awarded: boolean }>> {
  return runAction(
    awardBadgeInputSchema,
    input,
    async (data, session) => {
      const { awarded } = await awardManualBadge(session, data);
      return { awarded };
    },
    { roles: AWARDERS },
  );
}
