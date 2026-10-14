import type { z } from 'zod';
import { CONTENT_LIMITS } from '@/lib/limits';
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
import { ageBandSchema, displayNameSchema, joinCodeSchema } from './auth';
import { bool, idSchema, isoDateSchema, list, obj, requiredText, text } from './common';

const classNameSchema = requiredText(CONTENT_LIMITS.classNameChars);
const gradeLabelSchema = text(CONTENT_LIMITS.gradeLabelChars).nullable();

export const classInputSchema = obj({
  name: classNameSchema,
  gradeLabel: gradeLabelSchema,
  ageBand: ageBandSchema,
  ownerUid: idSchema.optional(),
}) satisfies z.ZodType<ClassInput>;

/** Archive a class, regenerate its join code. */
export const classRefInputSchema = obj({
  classId: idSchema,
}) satisfies z.ZodType<ClassRefInput>;

export const updateClassInputSchema = obj({
  classId: idSchema,
  name: classNameSchema.optional(),
  gradeLabel: gradeLabelSchema.optional(),
  ageBand: ageBandSchema.optional(),
  joinCodeEnabled: bool().optional(),
}) satisfies z.ZodType<UpdateClassInput>;

/** Whether each age band is allowed in that class is decided by the server (account policy). */
export const addStudentsInputSchema = obj({
  classId: idSchema,
  students: list(obj({ displayName: displayNameSchema, ageBand: ageBandSchema.optional() }), {
    min: 1,
    max: CONTENT_LIMITS.studentsPerClass,
  }),
}) satisfies z.ZodType<AddStudentsInput>;

export const removeStudentInputSchema = obj({
  classId: idSchema,
  studentUid: idSchema,
}) satisfies z.ZodType<RemoveStudentInput>;

export const resetStudentPasswordInputSchema = obj({
  studentUid: idSchema,
}) satisfies z.ZodType<ResetStudentPasswordInput>;

export const assignCourseInputSchema = obj({
  classId: idSchema,
  courseId: idSchema,
  dueAt: isoDateSchema.nullable(),
}) satisfies z.ZodType<AssignCourseInput>;

export const unassignCourseInputSchema = obj({
  classId: idSchema,
  courseId: idSchema,
}) satisfies z.ZodType<UnassignCourseInput>;

export const joinClassInputSchema = obj({
  joinCode: joinCodeSchema,
}) satisfies z.ZodType<JoinClassInput>;

export const awardBadgeInputSchema = obj({
  studentUid: idSchema,
  badgeId: idSchema,
  note: text(CONTENT_LIMITS.badgeNoteChars).nullable(),
}) satisfies z.ZodType<AwardBadgeInput>;
