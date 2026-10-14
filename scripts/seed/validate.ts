// Pure checks of seed content against the zod schemas and the content rules of
// ARCHITECTURE.md 11.2, shared by the runner (which writes nothing that fails them) and by
// tests/unit/seed-content.test.ts. Each problem is one line naming where it was found.

import type { z } from 'zod';
import { quizDocumentBytes, splitQuizInput } from '@/lib/data/course-derive';
import { CONTENT_LIMITS } from '@/lib/limits';
import { challengeInputSchema } from '@/lib/schemas/admin';
import { ID_PATTERN, parseInput } from '@/lib/schemas/common';
import {
  blockInputSchema,
  courseInputSchema,
  lessonInputSchema,
  moduleInputSchema,
} from '@/lib/schemas/course';
import { projectInputSchema } from '@/lib/schemas/project';
import { quizInputSchema } from '@/lib/schemas/quiz';
import type { Locale, Localized } from '@/types/common';
import { LESSON_STAGES, type BlockType, type LessonStage } from '@/types/content';
import type { CourseInput, QuizInput } from '@/types/inputs';
import type { SeedChallenge, SeedCourse } from './types';

/** The languages every piece of demo content carries, whatever LOCALES enables. */
export const CONTENT_LOCALES: readonly Locale[] = ['en', 'fr'];

/** The five demo courses of ARCHITECTURE.md 11.6, by document id. */
export const DEMO_COURSE_IDS = [
  'my-first-ai-adventure',
  'build-with-generative-ai',
  'from-ai-user-to-ai-developer',
  'ai-essentials-for-educators',
  'ai-robotics-foundations',
] as const;

/** What createCourse would be given: the seed's course fields with no cover. */
export function courseInputOf(seed: SeedCourse): CourseInput {
  return { ...seed.course, coverImageFileId: null };
}

/** The lesson whose block references each quiz and project (the first reference wins). */
export interface ContentLinks {
  quizzes: Map<string, string>;
  projects: Map<string, string>;
}

export function contentLinks(course: SeedCourse): ContentLinks {
  const links: ContentLinks = { quizzes: new Map(), projects: new Map() };
  for (const courseModule of course.modules) {
    for (const lesson of courseModule.lessons) {
      for (const block of lesson.blocks) {
        if (block.type === 'quiz' && !links.quizzes.has(block.data.quizId)) {
          links.quizzes.set(block.data.quizId, lesson.id);
        }
        if (block.type === 'project' && !links.projects.has(block.data.projectId)) {
          links.projects.set(block.data.projectId, lesson.id);
        }
      }
    }
  }
  return links;
}

// --- Building blocks ---------------------------------------------------------------------------

// The fields a block must fill in each content language, per type (the schema's own list for
// the default language).
const BLOCK_TEXT_FIELDS: Record<BlockType, readonly string[]> = {
  rich_text: ['body'],
  image: ['alt'],
  video: ['title'],
  file: ['label'],
  quiz: [],
  code_activity: ['instructions'],
  ai_activity: ['instructions'],
  embed: ['title'],
  reflection: ['prompt'],
  project: [],
};

function isBlank(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  return Array.isArray(value) && value.length === 0;
}

/** Every content language present, with none of `fields` blank. */
function textProblems(
  path: string,
  translations: Localized<object>,
  fields: readonly string[],
): string[] {
  const problems: string[] = [];
  for (const locale of CONTENT_LOCALES) {
    const entry = translations[locale] as Record<string, unknown> | undefined;
    if (entry === undefined || entry === null) {
      problems.push(`${path}: no ${locale} translation`);
      continue;
    }
    for (const field of fields) {
      if (isBlank(entry[field])) problems.push(`${path}: translations.${locale}.${field} is blank`);
    }
  }
  return problems;
}

function schemaProblems(path: string, schema: z.ZodType, input: unknown): string[] {
  const parsed = parseInput(schema, input);
  if (parsed.success) return [];
  return Object.entries(parsed.fieldErrors).map(
    ([field, keys]) => `${path}: ${field} ${keys.join(', ')}`,
  );
}

function idProblems(path: string, id: string, seen: Set<string>): string[] {
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
    return [`${path}: id "${String(id)}" does not match ${ID_PATTERN}`];
  }
  if (seen.has(id)) return [`${path}: id "${id}" is used twice`];
  seen.add(id);
  return [];
}

function quizProblems(path: string, input: QuizInput): string[] {
  const problems = schemaProblems(path, quizInputSchema, input);
  if (problems.length > 0) return problems;
  problems.push(...textProblems(path, input.translations, ['title']));
  input.questions.forEach((question, index) => {
    const at = `${path}.questions.${index}`;
    problems.push(...textProblems(at, question.translations, ['prompt']));
    question.options.forEach((option, optionIndex) => {
      problems.push(...textProblems(`${at}.options.${optionIndex}`, option.translations, ['text']));
    });
    if (question.type === 'short_answer') {
      for (const locale of CONTENT_LOCALES) {
        if ((question.acceptedAnswers[locale] ?? []).length === 0) {
          problems.push(`${at}: no accepted ${locale} answer`);
        }
      }
    }
  });
  let counter = 0;
  try {
    const { quiz, key } = splitQuizInput(input, () => `gen-${(counter += 1)}`);
    const bytes = quizDocumentBytes(quiz, key);
    if (bytes > CONTENT_LIMITS.quizDocumentBytes) {
      problems.push(`${path}: ${bytes} bytes, above ${CONTENT_LIMITS.quizDocumentBytes}`);
    }
  } catch (error) {
    problems.push(`${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
  return problems;
}

// --- Courses -----------------------------------------------------------------------------------

export function validateSeedCourse(course: SeedCourse): string[] {
  const problems: string[] = [];
  const path = `course ${course.id}`;
  problems.push(...idProblems(path, course.id, new Set()));
  problems.push(...schemaProblems(path, courseInputSchema, courseInputOf(course)));
  problems.push(
    ...textProblems(path, course.course.translations, ['title', 'summary', 'description']),
  );
  if (course.course.isOfficial !== true) problems.push(`${path}: isOfficial must be true`);
  if (course.course.accessTier !== 'free') problems.push(`${path}: accessTier must be 'free'`);
  if (typeof course.course.pathwayId !== 'string' || !ID_PATTERN.test(course.course.pathwayId)) {
    problems.push(`${path}: pathwayId must be a pathway slug`);
  }
  if (course.modules.length < 2) problems.push(`${path}: at least two modules are required`);

  const teacherCourse = course.course.audience === 'teacher';
  const moduleIds = new Set<string>();
  const lessonIds = new Set<string>();
  const stages = new Set<LessonStage>();
  const quizReferences = new Map<string, string[]>();
  const projectReferences = new Map<string, string[]>();
  let reflections = 0;

  for (const courseModule of course.modules) {
    const modulePath = `${path} / module ${courseModule.id}`;
    problems.push(...idProblems(modulePath, courseModule.id, moduleIds));
    problems.push(...schemaProblems(modulePath, moduleInputSchema, courseModule.input));
    problems.push(
      ...textProblems(modulePath, courseModule.input.translations, ['title', 'description']),
    );
    if (courseModule.lessons.length < 2) {
      problems.push(`${modulePath}: at least two lessons are required`);
    }
    let moduleQuizzes = 0;

    for (const lesson of courseModule.lessons) {
      const lessonPath = `${modulePath} / lesson ${lesson.id}`;
      problems.push(...idProblems(lessonPath, lesson.id, lessonIds));
      problems.push(...schemaProblems(lessonPath, lessonInputSchema, lesson.input));
      problems.push(...textProblems(lessonPath, lesson.input.translations, ['title', 'summary']));
      if (lesson.blocks.length === 0) problems.push(`${lessonPath}: no blocks`);
      const blockIds = new Set<string>();

      for (const block of lesson.blocks) {
        const blockPath = `${lessonPath} / block ${block.id}`;
        problems.push(...idProblems(blockPath, block.id, blockIds));
        problems.push(...schemaProblems(blockPath, blockInputSchema, block));
        problems.push(
          ...textProblems(blockPath, block.translations, BLOCK_TEXT_FIELDS[block.type]),
        );
        stages.add(block.stage);
        switch (block.type) {
          case 'image':
          case 'file':
            problems.push(`${blockPath}: seed content uses no uploaded files`);
            break;
          case 'video':
            if (block.data.source === 'file') {
              problems.push(`${blockPath}: seed videos reference YouTube or Vimeo, not a file`);
            }
            break;
          case 'quiz':
            moduleQuizzes += 1;
            quizReferences.set(block.data.quizId, [
              ...(quizReferences.get(block.data.quizId) ?? []),
              lesson.id,
            ]);
            break;
          case 'project':
            if (teacherCourse) problems.push(`${blockPath}: no project blocks in a teacher course`);
            projectReferences.set(block.data.projectId, [
              ...(projectReferences.get(block.data.projectId) ?? []),
              lesson.id,
            ]);
            break;
          case 'reflection':
            reflections += 1;
            break;
          default:
            break;
        }
      }
    }
    if (moduleQuizzes === 0) problems.push(`${modulePath}: no quiz block in any of its lessons`);
  }

  for (const stage of LESSON_STAGES) {
    if (!stages.has(stage)) problems.push(`${path}: no block has stage '${stage}'`);
  }

  const quizIds = new Set<string>();
  for (const quiz of course.quizzes) {
    const quizPath = `${path} / quiz ${quiz.id}`;
    problems.push(...idProblems(quizPath, quiz.id, quizIds));
    problems.push(...quizProblems(quizPath, quiz.input));
    const references = quizReferences.get(quiz.id) ?? [];
    if (references.length === 0) problems.push(`${quizPath}: no block references it`);
    if (references.length > 1) {
      problems.push(`${quizPath}: referenced by several lessons (${references.join(', ')})`);
    }
  }
  for (const quizId of quizReferences.keys()) {
    if (!quizIds.has(quizId))
      problems.push(`${path}: a quiz block references unknown quiz ${quizId}`);
  }

  const projectIds = new Set<string>();
  for (const project of course.projects) {
    const projectPath = `${path} / project ${project.id}`;
    problems.push(...idProblems(projectPath, project.id, projectIds));
    problems.push(...schemaProblems(projectPath, projectInputSchema, project.input));
    problems.push(
      ...textProblems(projectPath, project.input.translations, ['title', 'brief', 'requirements']),
    );
    const references = projectReferences.get(project.id) ?? [];
    if (references.length === 0) problems.push(`${projectPath}: no block references it`);
    if (references.length > 1) {
      problems.push(`${projectPath}: referenced by several lessons (${references.join(', ')})`);
    }
  }
  for (const projectId of projectReferences.keys()) {
    if (!projectIds.has(projectId)) {
      problems.push(`${path}: a project block references unknown project ${projectId}`);
    }
  }
  if (teacherCourse) {
    if (course.projects.length > 0) problems.push(`${path}: a teacher course has no projects`);
    if (reflections === 0) problems.push(`${path}: a teacher course needs a reflection block`);
  } else if (course.projects.length === 0) {
    problems.push(`${path}: a student course needs a project`);
  }
  return problems;
}

// --- Challenges --------------------------------------------------------------------------------

export function validateSeedChallenge(challenge: SeedChallenge): string[] {
  const path = `challenge ${challenge.id}`;
  const problems = idProblems(path, challenge.id, new Set());
  problems.push(...schemaProblems(path, challengeInputSchema, challenge.input));
  problems.push(
    ...textProblems(path, challenge.input.translations, [
      'title',
      'description',
      'submissionRequirements',
    ]),
  );
  if (challenge.input.coverImageFileId !== null) {
    problems.push(`${path}: seed content uses no uploaded files (coverImageFileId)`);
  }
  return problems;
}

// --- Everything --------------------------------------------------------------------------------

export function validateSeedContent(
  courses: readonly SeedCourse[],
  challenges: readonly SeedChallenge[],
): string[] {
  const problems: string[] = [];
  const courseIds = new Set<string>();
  for (const course of courses) {
    if (courseIds.has(course.id)) problems.push(`course ${course.id}: id is used twice`);
    courseIds.add(course.id);
    problems.push(...validateSeedCourse(course));
  }
  const challengeIds = new Set<string>();
  for (const challenge of challenges) {
    if (challengeIds.has(challenge.id))
      problems.push(`challenge ${challenge.id}: id is used twice`);
    challengeIds.add(challenge.id);
    problems.push(...validateSeedChallenge(challenge));
  }
  return problems;
}
