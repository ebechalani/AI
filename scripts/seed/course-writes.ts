// The documents of an official course as the seed writes them (ARCHITECTURE.md 11.2, 11.7):
// the ids of the content file, the input fields as the schemas parse them, and every derived
// field computed with the helpers of src/lib/data/course-derive.ts. Shared by the seed runner,
// which upserts them, and by the content release tool, which only creates the ones a database
// lacks. Nothing here writes; the release tool must never import scripts/seed/index.ts, which
// runs the seed as soon as it is imported.

import type { z } from 'zod';
import {
  deriveLessonFields,
  splitQuizInput,
  toBlockFields,
  type DerivableBlock,
} from '@/lib/data/course-derive';
import { collections, quizKeyDoc } from '@/lib/firebase/collections';
import { serverTimestamp } from '@/lib/firebase/converters';
import { parseInput } from '@/lib/schemas/common';
import {
  blockInputSchema,
  courseInputSchema,
  lessonInputSchema,
  moduleInputSchema,
} from '@/lib/schemas/course';
import { projectInputSchema } from '@/lib/schemas/project';
import { quizInputSchema } from '@/lib/schemas/quiz';
import type { MediaRef } from '@/types/common';
import { ScriptError, type ScriptTarget } from '../lib/admin';
import type { DocumentWrite } from '../lib/firestore';
import { courseDetailsOf, type CourseDetails } from './course-details';
import type { SeedCourse } from './types';
import { contentLinks, courseInputOf } from './validate';

/** The seed owns no official media, so no block names a file. */
const NO_MEDIA: ReadonlyMap<string, MediaRef> = new Map();

export function parsed<T>(schema: z.ZodType<T>, input: unknown, what: string): T {
  const result = parseInput(schema, input);
  if (!result.success) {
    throw new ScriptError(`${what}: ${JSON.stringify(result.fieldErrors)}`);
  }
  return result.data;
}

/**
 * Every document of a course with the ids of the content file, the input fields as the
 * schemas parse them, and the derived fields the repositories would have written (11.2). The
 * course document comes last.
 */
export function courseWrites(seed: SeedCourse, ownerUid: string): DocumentWrite[] {
  const courseId = seed.id;
  const links = contentLinks(seed);
  const writes: DocumentWrite[] = [];
  let lessonCount = 0;

  seed.modules.forEach((module, moduleOrder) => {
    const moduleInput = parsed(moduleInputSchema, module.input, `module ${module.id}`);
    writes.push({
      ref: collections.modules(courseId).doc(module.id),
      fields: { order: moduleOrder, lessonCount: module.lessons.length, ...moduleInput },
    });

    module.lessons.forEach((lesson, lessonOrder) => {
      lessonCount += 1;
      const lessonInput = parsed(lessonInputSchema, lesson.input, `lesson ${lesson.id}`);
      const derivable: DerivableBlock[] = [];
      lesson.blocks.forEach((block, order) => {
        const input = parsed(blockInputSchema, block, `block ${block.id}`);
        const fields = toBlockFields(input, NO_MEDIA);
        writes.push({
          ref: collections.blocks(courseId, lesson.id).doc(block.id),
          fields: { ...fields, order },
        });
        derivable.push({ ...fields, id: block.id, order });
      });
      writes.push({
        ref: collections.lessons(courseId).doc(lesson.id),
        fields: {
          moduleId: module.id,
          order: lessonOrder,
          estimatedMinutes: lessonInput.estimatedMinutes,
          xpReward: lessonInput.xpReward,
          ...deriveLessonFields(derivable),
          defaultLocale: lessonInput.defaultLocale,
          translations: lessonInput.translations,
        },
      });
    });
  });

  for (const seedQuiz of seed.quizzes) {
    const input = parsed(quizInputSchema, seedQuiz.input, `quiz ${seedQuiz.id}`);
    let counter = 0;
    const { quiz, key } = splitQuizInput(input, () => `gen-${(counter += 1)}`);
    writes.push({
      ref: collections.quizzes(courseId).doc(seedQuiz.id),
      fields: { lessonId: links.quizzes.get(seedQuiz.id) ?? null, ...quiz },
    });
    writes.push({ ref: quizKeyDoc(courseId, seedQuiz.id), fields: key });
  }

  for (const seedProject of seed.projects) {
    const input = parsed(projectInputSchema, seedProject.input, `project ${seedProject.id}`);
    writes.push({
      ref: collections.projects(courseId).doc(seedProject.id),
      fields: {
        lessonId: links.projects.get(seedProject.id) ?? null,
        kind: input.kind,
        allowedSubmissionTypes: input.allowedSubmissionTypes,
        rubric: input.rubric,
        xpReward: input.xpReward,
        requiredForCertificate: input.requiredForCertificate,
        defaultLocale: input.defaultLocale,
        translations: input.translations,
      },
    });
  }

  const course = parsed(courseInputSchema, courseInputOf(seed), `course ${courseId}`);
  writes.push({
    ref: collections.courses().doc(courseId),
    fields: (existing) => ({
      pathwayId: seed.course.pathwayId,
      order: seed.course.order,
      ownerUid,
      schoolId: null,
      isOfficial: true,
      status: 'published',
      visibility: 'public',
      audience: course.audience,
      area: course.area,
      tags: course.tags,
      ageMin: course.ageMin,
      ageMax: course.ageMax,
      estimatedMinutes: course.estimatedMinutes,
      accessTier: 'free',
      certificateEnabled: course.certificateEnabled,
      coverImage: null,
      hardwarePlatformIds: course.hardwarePlatformIds,
      requiredCapabilities: course.requiredCapabilities,
      moduleCount: seed.modules.length,
      lessonCount,
      defaultLocale: course.defaultLocale,
      translations: course.translations,
      publishedAt: (existing?.get('publishedAt') as unknown) ?? serverTimestamp(),
    }),
  });
  return writes;
}

/** The details a content release may replace, exactly as courseWrites stores them. */
export function seedCourseDetails(seed: SeedCourse): CourseDetails {
  return courseDetailsOf(parsed(courseInputSchema, courseInputOf(seed), `course ${seed.id}`));
}

// --- The guard ---------------------------------------------------------------------------------

/**
 * Whether meta/seed (its data, undefined when it does not exist) shows that the seed finished
 * writing the official courses: coursesSeededAt, set once they are all written. A database
 * seeded before that field existed is known by the challenges meta/seed records, which the seed
 * has always written after the courses. That meta/seed exists proves nothing: the demo school is
 * recorded in it before any course is written, so a first run that failed half-way leaves it.
 */
export function coursesSeededIn(seedState: Record<string, unknown> | undefined): boolean {
  if (seedState === undefined) return false;
  if (seedState.coursesSeededAt !== undefined && seedState.coursesSeededAt !== null) return true;
  const challenges = seedState.challenges;
  return (
    typeof challenges === 'object' && challenges !== null && Object.keys(challenges).length > 0
  );
}

/**
 * Why the seed must not write the courses, or null. A real project whose official courses were
 * seeded before (coursesSeededIn) holds the courses its users learn from, perhaps with edits a
 * platform admin made in the app, and an upsert would replace them whole (11.7).
 */
export function courseOverwriteRefusal(
  mode: ScriptTarget['mode'],
  coursesSeeded: boolean,
  overwrite: boolean,
): string | null {
  if (mode === 'emulator' || !coursesSeeded || overwrite) return null;
  return [
    'The official courses of this project were seeded before (meta/seed records it): writing',
    'them again would replace them whole, with every edit made to them in the app. New courses',
    'and modules reach a live database with "npm run content:release" (ARCHITECTURE.md 11.7).',
    'To overwrite the official courses anyway, pass --overwrite-official-courses.',
  ].join('\n');
}
