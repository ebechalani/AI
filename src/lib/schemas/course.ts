import { z } from 'zod';
import { CONTENT_LIMITS, EMBED_HOSTS } from '@/lib/limits';
import { LAB_TOOL_IDS, TUTOR_MODES } from '@/types/ai';
import { AUDIENCES, LEARNING_AREAS } from '@/types/common';
import {
  ACCESS_TIERS,
  BLOCK_TYPES,
  CODE_LANGUAGES,
  COURSE_STATUSES,
  EMBED_ASPECT_RATIOS,
  LESSON_STAGES,
  VIDEO_SOURCES,
  type BlockType,
} from '@/types/content';
import { HARDWARE_CAPABILITIES } from '@/types/hardware';
import type {
  BlockInput,
  BlockRefInput,
  CourseInput,
  CreateBlockInput,
  CreateLessonInput,
  CreateModuleInput,
  LessonInput,
  ModuleInput,
  ModuleRefInput,
  ReorderBlocksInput,
  ReorderLessonsInput,
  ReorderModulesInput,
  SetCourseStatusInput,
  UpdateBlockInput,
  UpdateCourseInput,
  UpdateLessonInput,
  UpdateModuleInput,
} from '@/types/inputs';
import {
  bool,
  checkAgeRange,
  checkTranslationsPatch,
  fileIdSchema,
  httpsUrlSchema,
  idSchema,
  int,
  list,
  localeSchema,
  localized,
  obj,
  oneOf,
  requireDefaultLocale,
  text,
  unionOf,
  uniqueList,
  whenPresent,
  type AgeRangeFields,
  type TranslatedFields,
} from './common';

// --- Pieces shared with challenges ---------------------------------------------------------------

export const ageSchema = int(CONTENT_LIMITS.ageMin, CONTENT_LIMITS.ageMax);

export const hardwarePlatformIdsSchema = uniqueList(idSchema, {
  max: CONTENT_LIMITS.hardwarePlatformsPerItem,
});

export const requiredCapabilitiesSchema = uniqueList(oneOf(HARDWARE_CAPABILITIES), {
  max: HARDWARE_CAPABILITIES.length,
});

// --- Course ------------------------------------------------------------------------------------

const tagSchema = z
  .string({ error: whenPresent('invalid') })
  .trim()
  .toLowerCase()
  .regex(new RegExp(`^[a-z0-9-]{1,${CONTENT_LIMITS.tagChars}}$`), 'invalid');

const courseFields = {
  defaultLocale: localeSchema,
  translations: localized(
    obj({
      title: text(CONTENT_LIMITS.titleChars),
      summary: text(CONTENT_LIMITS.summaryChars),
      description: text(CONTENT_LIMITS.descriptionChars),
      outcomes: list(text(CONTENT_LIMITS.outcomeChars), { max: CONTENT_LIMITS.outcomesPerCourse }),
    }),
  ),
  audience: oneOf(AUDIENCES),
  area: oneOf(LEARNING_AREAS),
  tags: uniqueList(tagSchema, { max: CONTENT_LIMITS.tagsPerCourse }),
  ageMin: ageSchema.nullable(),
  ageMax: ageSchema.nullable(),
  estimatedMinutes: int(0, CONTENT_LIMITS.courseMinutesMax),
  visibility: unionOf<CourseInput['visibility']>()(['private', 'school']),
  certificateEnabled: bool(),
  coverImageFileId: fileIdSchema.nullable(),
  hardwarePlatformIds: hardwarePlatformIdsSchema,
  requiredCapabilities: requiredCapabilitiesSchema,
};

const adminCourseFields = {
  isOfficial: bool().optional(),
  pathwayId: idSchema.nullable().optional(),
  order: int(0, CONTENT_LIMITS.courseOrderMax).optional(),
  accessTier: oneOf(ACCESS_TIERS).optional(),
};

const COURSE_REQUIRED_TEXT = ['title', 'summary', 'description'] as const;

function checkCourse(value: TranslatedFields & AgeRangeFields, ctx: z.core.$RefinementCtx): void {
  requireDefaultLocale(COURSE_REQUIRED_TEXT)(value, ctx);
  checkAgeRange(value, ctx);
}

// A patch can only be checked against itself: when it carries one age bound, the repository
// compares it with the stored one.
function checkCoursePatch(
  value: TranslatedFields & AgeRangeFields,
  ctx: z.core.$RefinementCtx,
): void {
  checkTranslationsPatch(COURSE_REQUIRED_TEXT)(value, ctx);
  checkAgeRange(value, ctx);
}

/** Accepts the platform-admin fields; use `stripAdminCourseFields` for any other actor. */
export const courseInputSchema = obj({ ...courseFields, ...adminCourseFields }).superRefine(
  checkCourse,
) satisfies z.ZodType<CourseInput>;

/** The same input with the platform-admin fields dropped. */
export const teacherCourseInputSchema = obj(courseFields).superRefine(
  checkCourse,
) satisfies z.ZodType<CourseInput>;

export const ADMIN_COURSE_FIELDS = ['isOfficial', 'pathwayId', 'order', 'accessTier'] as const;

/** For an action that serves teachers and platform admins with one schema. */
export function stripAdminCourseFields<T extends Partial<CourseInput>>(
  input: T,
): Omit<T, (typeof ADMIN_COURSE_FIELDS)[number]> {
  const rest: Partial<CourseInput> = { ...input };
  for (const field of ADMIN_COURSE_FIELDS) delete rest[field];
  return rest as Omit<T, (typeof ADMIN_COURSE_FIELDS)[number]>;
}

export const updateCourseInputSchema = obj({
  courseId: idSchema,
  patch: obj({ ...courseFields, ...adminCourseFields })
    .partial()
    .superRefine(checkCoursePatch),
}) satisfies z.ZodType<UpdateCourseInput>;

export const setCourseStatusInputSchema = obj({
  courseId: idSchema,
  status: oneOf(COURSE_STATUSES),
}) satisfies z.ZodType<SetCourseStatusInput>;

// --- Module ------------------------------------------------------------------------------------

const moduleFields = {
  defaultLocale: localeSchema,
  translations: localized(
    obj({
      title: text(CONTENT_LIMITS.titleChars),
      description: text(CONTENT_LIMITS.moduleDescriptionChars),
    }),
  ),
};
const MODULE_REQUIRED_TEXT = ['title', 'description'] as const;

export const moduleInputSchema = obj(moduleFields).superRefine(
  requireDefaultLocale(MODULE_REQUIRED_TEXT),
) satisfies z.ZodType<ModuleInput>;

export const createModuleInputSchema = obj({
  courseId: idSchema,
  input: moduleInputSchema,
}) satisfies z.ZodType<CreateModuleInput>;

export const updateModuleInputSchema = obj({
  courseId: idSchema,
  moduleId: idSchema,
  patch: obj(moduleFields).partial().superRefine(checkTranslationsPatch(MODULE_REQUIRED_TEXT)),
}) satisfies z.ZodType<UpdateModuleInput>;

export const moduleRefInputSchema = obj({
  courseId: idSchema,
  moduleId: idSchema,
}) satisfies z.ZodType<ModuleRefInput>;

export const reorderModulesInputSchema = obj({
  courseId: idSchema,
  orderedIds: uniqueList(idSchema, { max: CONTENT_LIMITS.modulesPerCourse }),
}) satisfies z.ZodType<ReorderModulesInput>;

// --- Lesson ------------------------------------------------------------------------------------

const lessonFields = {
  defaultLocale: localeSchema,
  translations: localized(
    obj({
      title: text(CONTENT_LIMITS.titleChars),
      summary: text(CONTENT_LIMITS.summaryChars),
    }),
  ),
  estimatedMinutes: int(1, CONTENT_LIMITS.lessonMinutesMax),
  xpReward: int(0, CONTENT_LIMITS.xpRewardMax.lesson),
};
const LESSON_REQUIRED_TEXT = ['title', 'summary'] as const;

export const lessonInputSchema = obj(lessonFields).superRefine(
  requireDefaultLocale(LESSON_REQUIRED_TEXT),
) satisfies z.ZodType<LessonInput>;

export const createLessonInputSchema = obj({
  courseId: idSchema,
  moduleId: idSchema,
  input: lessonInputSchema,
}) satisfies z.ZodType<CreateLessonInput>;

export const updateLessonInputSchema = obj({
  courseId: idSchema,
  lessonId: idSchema,
  patch: obj(lessonFields).partial().superRefine(checkTranslationsPatch(LESSON_REQUIRED_TEXT)),
}) satisfies z.ZodType<UpdateLessonInput>;

export const reorderLessonsInputSchema = obj({
  courseId: idSchema,
  moduleId: idSchema,
  orderedIds: uniqueList(idSchema, { max: CONTENT_LIMITS.lessonsPerModule }),
}) satisfies z.ZodType<ReorderLessonsInput>;

// --- Blocks ------------------------------------------------------------------------------------

const title = text(CONTENT_LIMITS.titleChars);
const caption = text(CONTENT_LIMITS.captionChars).nullable();
const intro = text(CONTENT_LIMITS.blockIntroChars).nullable();

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID_PATTERN = /^\d{1,12}$/;

/**
 * True for an https URL whose host is one of EMBED_HOSTS. A port or credentials are refused:
 * the frame-src directive lists the bare hosts, so the browser would block such a frame.
 */
export function isEmbeddableUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      EMBED_HOSTS.includes(parsed.hostname) &&
      parsed.port === '' &&
      parsed.username === '' &&
      parsed.password === ''
    );
  } catch {
    return false;
  }
}

const videoDataSchema = obj({
  source: oneOf(VIDEO_SOURCES),
  videoId: text(CONTENT_LIMITS.videoIdChars).nullable(),
  fileId: fileIdSchema.nullable(),
  durationSeconds: int(1, CONTENT_LIMITS.videoDurationSeconds).nullable(),
}).superRefine((data, ctx) => {
  // Exactly one of the two references is used, according to the source.
  if (data.source === 'file') {
    if (data.fileId === null)
      ctx.addIssue({ code: 'custom', message: 'required', path: ['fileId'] });
    if (data.videoId !== null)
      ctx.addIssue({ code: 'custom', message: 'invalid', path: ['videoId'] });
    return;
  }
  const pattern = data.source === 'youtube' ? YOUTUBE_ID_PATTERN : VIMEO_ID_PATTERN;
  if (data.videoId === null || !pattern.test(data.videoId)) {
    ctx.addIssue({ code: 'custom', message: 'video_id_invalid', path: ['videoId'] });
  }
  if (data.fileId !== null) ctx.addIssue({ code: 'custom', message: 'invalid', path: ['fileId'] });
});

const stageSchema = oneOf(LESSON_STAGES);

// `requiredText` names the fields that must be filled in the block's default language.
function block<T extends BlockType, Text extends z.ZodType<object>, Data extends z.ZodType>(
  type: T,
  textSchema: Text,
  requiredText: readonly string[],
  dataSchema: Data,
) {
  return obj({
    type: z.literal(type),
    stage: stageSchema,
    defaultLocale: localeSchema,
    translations: localized(textSchema),
    data: dataSchema,
  }).superRefine((value, ctx) =>
    requireDefaultLocale(requiredText)(
      { defaultLocale: value.defaultLocale, translations: value.translations },
      ctx,
    ),
  );
}

export const blockInputSchema = z.discriminatedUnion(
  'type',
  [
    block(
      'rich_text',
      obj({ heading: title.nullable(), body: text(CONTENT_LIMITS.richTextBodyChars) }),
      ['body'],
      z.object({}, { error: whenPresent('invalid') }),
    ),
    block(
      'image',
      obj({ alt: text(CONTENT_LIMITS.captionChars), caption }),
      ['alt'],
      obj({ fileId: fileIdSchema }),
    ),
    block(
      'video',
      obj({ title, caption, transcript: text(CONTENT_LIMITS.videoTranscriptChars).nullable() }),
      ['title'],
      videoDataSchema,
    ),
    block(
      'file',
      obj({ label: title, description: text(CONTENT_LIMITS.fileDescriptionChars).nullable() }),
      ['label'],
      obj({ fileId: fileIdSchema }),
    ),
    block('quiz', obj({ intro }), [], obj({ quizId: idSchema })),
    block(
      'code_activity',
      obj({
        instructions: text(CONTENT_LIMITS.activityInstructionsChars),
        hint: text(CONTENT_LIMITS.hintChars).nullable(),
      }),
      ['instructions'],
      obj({
        language: oneOf(CODE_LANGUAGES),
        starterCode: text(CONTENT_LIMITS.starterCodeChars, { trim: false }),
      }),
    ),
    block(
      'ai_activity',
      obj({
        instructions: text(CONTENT_LIMITS.activityInstructionsChars),
        starterPrompt: text(CONTENT_LIMITS.starterPromptChars).nullable(),
      }),
      ['instructions'],
      obj({ tutorMode: oneOf(TUTOR_MODES), labToolId: oneOf(LAB_TOOL_IDS).nullable() }),
    ),
    block(
      'embed',
      obj({ title, caption }),
      ['title'],
      obj({
        url: httpsUrlSchema(CONTENT_LIMITS.embedUrlChars).refine(
          isEmbeddableUrl,
          'embed_not_allowed',
        ),
        aspectRatio: oneOf(EMBED_ASPECT_RATIOS),
      }),
    ),
    block(
      'reflection',
      obj({ prompt: text(CONTENT_LIMITS.reflectionPromptChars) }),
      ['prompt'],
      obj({ minLength: int(0, CONTENT_LIMITS.reflectionMinLengthMax) }),
    ),
    block('project', obj({ intro }), [], obj({ projectId: idSchema })),
  ],
  { error: whenPresent('invalid_choice') },
) satisfies z.ZodType<BlockInput>;

export const blockTypeSchema = oneOf(BLOCK_TYPES);

export const createBlockInputSchema = obj({
  courseId: idSchema,
  lessonId: idSchema,
  input: blockInputSchema,
}) satisfies z.ZodType<CreateBlockInput>;

export const updateBlockInputSchema = obj({
  courseId: idSchema,
  lessonId: idSchema,
  blockId: idSchema,
  input: blockInputSchema,
}) satisfies z.ZodType<UpdateBlockInput>;

export const blockRefInputSchema = obj({
  courseId: idSchema,
  lessonId: idSchema,
  blockId: idSchema,
}) satisfies z.ZodType<BlockRefInput>;

export const reorderBlocksInputSchema = obj({
  courseId: idSchema,
  lessonId: idSchema,
  orderedIds: uniqueList(idSchema, { max: CONTENT_LIMITS.blocksPerLesson }),
}) satisfies z.ZodType<ReorderBlocksInput>;
