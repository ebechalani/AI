import type { z } from 'zod';
import { CONTENT_LIMITS } from '@/lib/limits';
import type { EnrollInCourseInput, LessonRefInput, SaveBlockResponseInput } from '@/types/inputs';
import { idSchema, obj, text } from './common';

export const enrollInCourseInputSchema = obj({
  courseId: idSchema,
}) satisfies z.ZodType<EnrollInCourseInput>;

/** Start a lesson, complete a lesson, delete a lesson. */
export const lessonRefInputSchema = obj({
  courseId: idSchema,
  lessonId: idSchema,
}) satisfies z.ZodType<LessonRefInput>;

/** A reflection or code-activity response. Not trimmed: code keeps its indentation. */
export const saveBlockResponseInputSchema = obj({
  courseId: idSchema,
  lessonId: idSchema,
  blockId: idSchema,
  text: text(CONTENT_LIMITS.blockResponseChars, { trim: false }),
}) satisfies z.ZodType<SaveBlockResponseInput>;
