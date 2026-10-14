'use server';

// Stubs (F8): the signatures and roles of ARCHITECTURE.md 10.4; WS-F fills them in.

import { runAction } from '@/lib/actions/run-action';
import { AppError } from '@/lib/errors';
import {
  blockRefInputSchema,
  courseInputSchema,
  createBlockInputSchema,
  createLessonInputSchema,
  createModuleInputSchema,
  moduleRefInputSchema,
  reorderBlocksInputSchema,
  reorderLessonsInputSchema,
  reorderModulesInputSchema,
  setCourseStatusInputSchema,
  updateBlockInputSchema,
  updateCourseInputSchema,
  updateLessonInputSchema,
  updateModuleInputSchema,
} from '@/lib/schemas/course';
import { lessonRefInputSchema } from '@/lib/schemas/learning';
import { projectRefInputSchema, saveProjectInputSchema } from '@/lib/schemas/project';
import { quizRefInputSchema, saveQuizInputSchema } from '@/lib/schemas/quiz';
import type { ActionResult } from '@/types/actions';
import type { Role } from '@/types/common';
import type {
  BlockRefInput,
  CourseInput,
  CreateBlockInput,
  CreateLessonInput,
  CreateModuleInput,
  LessonRefInput,
  ModuleRefInput,
  ProjectRefInput,
  QuizRefInput,
  ReorderBlocksInput,
  ReorderLessonsInput,
  ReorderModulesInput,
  SaveProjectInput,
  SaveQuizInput,
  SetCourseStatusInput,
  UpdateBlockInput,
  UpdateCourseInput,
  UpdateLessonInput,
  UpdateModuleInput,
} from '@/types/inputs';

const AUTHORS: readonly Role[] = ['teacher', 'platform_admin'];

async function notImplemented(): Promise<never> {
  throw new AppError('not_implemented');
}

// --- Course ------------------------------------------------------------------------------------

export async function createCourseAction(
  input: CourseInput,
): Promise<ActionResult<{ courseId: string }>> {
  return runAction(courseInputSchema, input, notImplemented, { roles: AUTHORS });
}

export async function updateCourseAction(input: UpdateCourseInput): Promise<ActionResult<null>> {
  return runAction(updateCourseInputSchema, input, notImplemented, { roles: AUTHORS });
}

export async function setCourseStatusAction(
  input: SetCourseStatusInput,
): Promise<ActionResult<null>> {
  return runAction(setCourseStatusInputSchema, input, notImplemented, { roles: AUTHORS });
}

// --- Modules -----------------------------------------------------------------------------------

export async function createModuleAction(
  input: CreateModuleInput,
): Promise<ActionResult<{ moduleId: string }>> {
  return runAction(createModuleInputSchema, input, notImplemented, { roles: AUTHORS });
}

export async function updateModuleAction(input: UpdateModuleInput): Promise<ActionResult<null>> {
  return runAction(updateModuleInputSchema, input, notImplemented, { roles: AUTHORS });
}

export async function deleteModuleAction(input: ModuleRefInput): Promise<ActionResult<null>> {
  return runAction(moduleRefInputSchema, input, notImplemented, { roles: AUTHORS });
}

export async function reorderModulesAction(
  input: ReorderModulesInput,
): Promise<ActionResult<null>> {
  return runAction(reorderModulesInputSchema, input, notImplemented, { roles: AUTHORS });
}

// --- Lessons -----------------------------------------------------------------------------------

export async function createLessonAction(
  input: CreateLessonInput,
): Promise<ActionResult<{ lessonId: string }>> {
  return runAction(createLessonInputSchema, input, notImplemented, { roles: AUTHORS });
}

export async function updateLessonAction(input: UpdateLessonInput): Promise<ActionResult<null>> {
  return runAction(updateLessonInputSchema, input, notImplemented, { roles: AUTHORS });
}

export async function deleteLessonAction(input: LessonRefInput): Promise<ActionResult<null>> {
  return runAction(lessonRefInputSchema, input, notImplemented, { roles: AUTHORS });
}

export async function reorderLessonsAction(
  input: ReorderLessonsInput,
): Promise<ActionResult<null>> {
  return runAction(reorderLessonsInputSchema, input, notImplemented, { roles: AUTHORS });
}

// --- Blocks ------------------------------------------------------------------------------------

export async function createBlockAction(
  input: CreateBlockInput,
): Promise<ActionResult<{ blockId: string }>> {
  return runAction(createBlockInputSchema, input, notImplemented, { roles: AUTHORS });
}

export async function updateBlockAction(input: UpdateBlockInput): Promise<ActionResult<null>> {
  return runAction(updateBlockInputSchema, input, notImplemented, { roles: AUTHORS });
}

export async function deleteBlockAction(input: BlockRefInput): Promise<ActionResult<null>> {
  return runAction(blockRefInputSchema, input, notImplemented, { roles: AUTHORS });
}

export async function reorderBlocksAction(input: ReorderBlocksInput): Promise<ActionResult<null>> {
  return runAction(reorderBlocksInputSchema, input, notImplemented, { roles: AUTHORS });
}

// --- Quizzes and projects ----------------------------------------------------------------------

export async function saveQuizAction(
  input: SaveQuizInput,
): Promise<ActionResult<{ quizId: string }>> {
  return runAction(saveQuizInputSchema, input, notImplemented, { roles: AUTHORS });
}

export async function deleteQuizAction(input: QuizRefInput): Promise<ActionResult<null>> {
  return runAction(quizRefInputSchema, input, notImplemented, { roles: AUTHORS });
}

export async function saveProjectAction(
  input: SaveProjectInput,
): Promise<ActionResult<{ projectId: string }>> {
  return runAction(saveProjectInputSchema, input, notImplemented, { roles: AUTHORS });
}

export async function deleteProjectAction(input: ProjectRefInput): Promise<ActionResult<null>> {
  return runAction(projectRefInputSchema, input, notImplemented, { roles: AUTHORS });
}
