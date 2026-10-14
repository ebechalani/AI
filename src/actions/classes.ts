'use server';

// Stubs (F8): the signatures and roles of ARCHITECTURE.md 10.4; WS-E fills them in.

import { runAction } from '@/lib/actions/run-action';
import { AppError } from '@/lib/errors';
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

const CREATORS: readonly Role[] = ['teacher', 'school_admin'];
const MANAGERS: readonly Role[] = ['teacher', 'school_admin', 'platform_admin'];
const AWARDERS: readonly Role[] = ['teacher', 'platform_admin'];

async function notImplemented(): Promise<never> {
  throw new AppError('not_implemented');
}

export async function createClassAction(
  input: ClassInput,
): Promise<ActionResult<{ classId: string }>> {
  return runAction(classInputSchema, input, notImplemented, { roles: CREATORS });
}

export async function updateClassAction(input: UpdateClassInput): Promise<ActionResult<null>> {
  return runAction(updateClassInputSchema, input, notImplemented, { roles: MANAGERS });
}

export async function archiveClassAction(input: ClassRefInput): Promise<ActionResult<null>> {
  return runAction(classRefInputSchema, input, notImplemented, { roles: MANAGERS });
}

export async function regenerateJoinCodeAction(
  input: ClassRefInput,
): Promise<ActionResult<{ joinCode: string }>> {
  return runAction(classRefInputSchema, input, notImplemented, { roles: MANAGERS });
}

export async function addStudentsAction(
  input: AddStudentsInput,
): Promise<
  ActionResult<{ credentials: { displayName: string; username: string; password: string }[] }>
> {
  return runAction(addStudentsInputSchema, input, notImplemented, { roles: MANAGERS });
}

export async function removeStudentAction(input: RemoveStudentInput): Promise<ActionResult<null>> {
  return runAction(removeStudentInputSchema, input, notImplemented, { roles: MANAGERS });
}

export async function resetStudentPasswordAction(
  input: ResetStudentPasswordInput,
): Promise<ActionResult<{ username: string; password: string }>> {
  return runAction(resetStudentPasswordInputSchema, input, notImplemented, { roles: MANAGERS });
}

export async function assignCourseAction(input: AssignCourseInput): Promise<ActionResult<null>> {
  return runAction(assignCourseInputSchema, input, notImplemented, { roles: MANAGERS });
}

export async function unassignCourseAction(
  input: UnassignCourseInput,
): Promise<ActionResult<null>> {
  return runAction(unassignCourseInputSchema, input, notImplemented, { roles: MANAGERS });
}

export async function joinClassAction(
  input: JoinClassInput,
): Promise<ActionResult<{ classId: string; className: string }>> {
  return runAction(joinClassInputSchema, input, notImplemented, { roles: ['student'] });
}

export async function awardBadgeAction(
  input: AwardBadgeInput,
): Promise<ActionResult<{ awarded: boolean }>> {
  return runAction(awardBadgeInputSchema, input, notImplemented, { roles: AWARDERS });
}
