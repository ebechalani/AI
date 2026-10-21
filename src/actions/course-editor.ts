'use server';

// The course creator's actions (ARCHITECTURE.md 10.4, WS-F): teachers and platform admins.
// There is no course-editor service: each action calls its repository, which authorizes the
// course (`loadEditableCourse`) and re-parses the input with the same schema. The client calls
// `router.refresh()` after a success, so nothing here revalidates.

import { runAction } from '@/lib/actions/run-action';
import {
  createBlock,
  createCourse,
  createLesson,
  createModule,
  deleteBlock,
  deleteLesson,
  deleteModule,
  reorderBlocks,
  reorderLessons,
  reorderModules,
  setCourseStatus,
  updateBlock,
  updateCourse,
  updateLesson,
  updateModule,
} from '@/lib/data/courses';
import { deleteProject, saveProject } from '@/lib/data/projects';
import { deleteQuiz, saveQuiz } from '@/lib/data/quizzes';
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
  stripAdminCourseFields,
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
import type { Session } from '@/types/user';

const AUTHORS: readonly Role[] = ['teacher', 'platform_admin'];

// The schemas accept the four platform-admin fields; anyone else's are dropped. The repository
// ignores them for non-admins too; this keeps them out of the call.
// The four fields are optional in `CourseInput`, so the stripped object is still a `T`.
function authorFields<T extends Partial<CourseInput>>(session: Session, input: T): T {
  return session.role === 'platform_admin' ? input : (stripAdminCourseFields(input) as T);
}

// --- Course ------------------------------------------------------------------------------------

export async function createCourseAction(
  input: CourseInput,
): Promise<ActionResult<{ courseId: string }>> {
  return runAction(
    courseInputSchema,
    input,
    async (data, session) => {
      const course = await createCourse(session, authorFields(session, data));
      return { courseId: course.id };
    },
    { roles: AUTHORS },
  );
}

export async function updateCourseAction(input: UpdateCourseInput): Promise<ActionResult<null>> {
  return runAction(
    updateCourseInputSchema,
    input,
    async (data, session) => {
      await updateCourse(session, data.courseId, authorFields(session, data.patch));
      return null;
    },
    { roles: AUTHORS },
  );
}

/** Publishing is guarded by the repository (`getPublishProblems`, WS-F-2). */
export async function setCourseStatusAction(
  input: SetCourseStatusInput,
): Promise<ActionResult<null>> {
  return runAction(
    setCourseStatusInputSchema,
    input,
    async (data, session) => {
      await setCourseStatus(session, data.courseId, data.status);
      return null;
    },
    { roles: AUTHORS },
  );
}

// --- Modules -----------------------------------------------------------------------------------

export async function createModuleAction(
  input: CreateModuleInput,
): Promise<ActionResult<{ moduleId: string }>> {
  return runAction(
    createModuleInputSchema,
    input,
    async (data, session) => {
      const created = await createModule(session, data.courseId, data.input);
      return { moduleId: created.id };
    },
    { roles: AUTHORS },
  );
}

export async function updateModuleAction(input: UpdateModuleInput): Promise<ActionResult<null>> {
  return runAction(
    updateModuleInputSchema,
    input,
    async (data, session) => {
      await updateModule(session, data.courseId, data.moduleId, data.patch);
      return null;
    },
    { roles: AUTHORS },
  );
}

export async function deleteModuleAction(input: ModuleRefInput): Promise<ActionResult<null>> {
  return runAction(
    moduleRefInputSchema,
    input,
    async (data, session) => {
      await deleteModule(session, data.courseId, data.moduleId);
      return null;
    },
    { roles: AUTHORS },
  );
}

export async function reorderModulesAction(
  input: ReorderModulesInput,
): Promise<ActionResult<null>> {
  return runAction(
    reorderModulesInputSchema,
    input,
    async (data, session) => {
      await reorderModules(session, data.courseId, data.orderedIds);
      return null;
    },
    { roles: AUTHORS },
  );
}

// --- Lessons -----------------------------------------------------------------------------------

export async function createLessonAction(
  input: CreateLessonInput,
): Promise<ActionResult<{ lessonId: string }>> {
  return runAction(
    createLessonInputSchema,
    input,
    async (data, session) => {
      const lesson = await createLesson(session, data.courseId, data.moduleId, data.input);
      return { lessonId: lesson.id };
    },
    { roles: AUTHORS },
  );
}

export async function updateLessonAction(input: UpdateLessonInput): Promise<ActionResult<null>> {
  return runAction(
    updateLessonInputSchema,
    input,
    async (data, session) => {
      await updateLesson(session, data.courseId, data.lessonId, data.patch);
      return null;
    },
    { roles: AUTHORS },
  );
}

export async function deleteLessonAction(input: LessonRefInput): Promise<ActionResult<null>> {
  return runAction(
    lessonRefInputSchema,
    input,
    async (data, session) => {
      await deleteLesson(session, data.courseId, data.lessonId);
      return null;
    },
    { roles: AUTHORS },
  );
}

export async function reorderLessonsAction(
  input: ReorderLessonsInput,
): Promise<ActionResult<null>> {
  return runAction(
    reorderLessonsInputSchema,
    input,
    async (data, session) => {
      await reorderLessons(session, data.courseId, data.moduleId, data.orderedIds);
      return null;
    },
    { roles: AUTHORS },
  );
}

// --- Blocks ------------------------------------------------------------------------------------

export async function createBlockAction(
  input: CreateBlockInput,
): Promise<ActionResult<{ blockId: string }>> {
  return runAction(
    createBlockInputSchema,
    input,
    async (data, session) => {
      const block = await createBlock(session, data.courseId, data.lessonId, data.input);
      return { blockId: block.id };
    },
    { roles: AUTHORS },
  );
}

export async function updateBlockAction(input: UpdateBlockInput): Promise<ActionResult<null>> {
  return runAction(
    updateBlockInputSchema,
    input,
    async (data, session) => {
      await updateBlock(session, data.courseId, data.lessonId, data.blockId, data.input);
      return null;
    },
    { roles: AUTHORS },
  );
}

export async function deleteBlockAction(input: BlockRefInput): Promise<ActionResult<null>> {
  return runAction(
    blockRefInputSchema,
    input,
    async (data, session) => {
      await deleteBlock(session, data.courseId, data.lessonId, data.blockId);
      return null;
    },
    { roles: AUTHORS },
  );
}

export async function reorderBlocksAction(input: ReorderBlocksInput): Promise<ActionResult<null>> {
  return runAction(
    reorderBlocksInputSchema,
    input,
    async (data, session) => {
      await reorderBlocks(session, data.courseId, data.lessonId, data.orderedIds);
      return null;
    },
    { roles: AUTHORS },
  );
}

// --- Quizzes and projects ----------------------------------------------------------------------

export async function saveQuizAction(
  input: SaveQuizInput,
): Promise<ActionResult<{ quizId: string }>> {
  return runAction(
    saveQuizInputSchema,
    input,
    async (data, session) => {
      const quiz = await saveQuiz(session, data.courseId, data.quizId, data.input);
      return { quizId: quiz.id };
    },
    { roles: AUTHORS },
  );
}

export async function deleteQuizAction(input: QuizRefInput): Promise<ActionResult<null>> {
  return runAction(
    quizRefInputSchema,
    input,
    async (data, session) => {
      await deleteQuiz(session, data.courseId, data.quizId);
      return null;
    },
    { roles: AUTHORS },
  );
}

export async function saveProjectAction(
  input: SaveProjectInput,
): Promise<ActionResult<{ projectId: string }>> {
  return runAction(
    saveProjectInputSchema,
    input,
    async (data, session) => {
      const project = await saveProject(session, data.courseId, data.projectId, data.input);
      return { projectId: project.id };
    },
    { roles: AUTHORS },
  );
}

export async function deleteProjectAction(input: ProjectRefInput): Promise<ActionResult<null>> {
  return runAction(
    projectRefInputSchema,
    input,
    async (data, session) => {
      await deleteProject(session, data.courseId, data.projectId);
      return null;
    },
    { roles: AUTHORS },
  );
}
