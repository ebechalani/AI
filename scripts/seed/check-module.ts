// Checks one module file of scripts/seed/content/<courseId>/<moduleId>.ts on its own, before it
// is spread into its course: its schemas, ids, texts in every content language, quizzes and
// projects, as validateSeedCourse checks them, plus the module's links to the course.
//
//   npx tsx --conditions=react-server scripts/seed/check-module.ts <courseId> <moduleId>
//
// The module is checked inside its course when the course already exists (so ids must not
// clash with the course's own), else inside a stand-in course of the given audience.

import path from 'node:path';
import { SEED_COURSES } from './content';
import type { SeedCourse, SeedModulePart } from './types';
import { validateSeedCourse } from './validate';

const [courseId, moduleId, audienceArg] = process.argv.slice(2);
if (courseId === undefined || moduleId === undefined) {
  console.error('Usage: check-module.ts <courseId> <moduleId> [student|teacher]');
  process.exit(2);
}

// Run from the repository root, as npm runs every script.
const file = path.resolve('scripts/seed/content', courseId, `${moduleId}.ts`);
// eslint-disable-next-line @typescript-eslint/no-require-imports -- tsx loads the file as CommonJS
const loaded = require(file) as Record<string, unknown>;
const part = Object.values(loaded).find(
  (value): value is SeedModulePart =>
    typeof value === 'object' && value !== null && 'module' in value && 'quizzes' in value,
);
if (part === undefined) {
  console.error(`${file} exports no SeedModulePart.`);
  process.exit(2);
}

const existing = SEED_COURSES.find((course) => course.id === courseId);
const alreadyIn = existing?.modules.some((courseModule) => courseModule.id === moduleId) ?? false;
const base: SeedCourse = existing ?? {
  id: courseId,
  course: {
    defaultLocale: 'en',
    translations: {
      en: { title: 'Stand-in', summary: 'Stand-in', description: 'Stand-in', outcomes: [] },
      fr: { title: 'Substitut', summary: 'Substitut', description: 'Substitut', outcomes: [] },
    },
    audience: audienceArg === 'teacher' ? 'teacher' : 'student',
    area: 'ai',
    tags: [],
    ageMin: audienceArg === 'teacher' ? null : 14,
    ageMax: audienceArg === 'teacher' ? null : 16,
    estimatedMinutes: 60,
    visibility: 'private',
    certificateEnabled: true,
    hardwarePlatformIds: [],
    requiredCapabilities: [],
    isOfficial: true,
    pathwayId: 'ai-engineer',
    order: 1,
    accessTier: 'free',
  },
  modules: [],
  quizzes: [],
  projects: [],
};
const course: SeedCourse = alreadyIn
  ? base
  : {
      ...base,
      modules: [...base.modules, part.module],
      quizzes: [...base.quizzes, ...part.quizzes],
      projects: [...base.projects, ...part.projects],
    };

// Course-wide rules a single module cannot meet on its own (two modules, every lesson stage,
// a project in a student course) are reported only when the module is checked in its course.
const courseWide = /at least two modules|no block has stage|needs a project|needs a reflection/;
const problems = validateSeedCourse(course).filter(
  (problem) => existing !== undefined || !courseWide.test(problem),
);
if (part.module.id !== moduleId) problems.push(`module id is ${part.module.id}, not ${moduleId}`);

const minutes = part.module.lessons.reduce((sum, lesson) => sum + lesson.input.estimatedMinutes, 0);
console.log(
  `${courseId}/${moduleId}: ${part.module.lessons.length} lessons, ${minutes} min, ` +
    `${part.quizzes.length} quiz(zes), ${part.projects.length} project(s)`,
);
if (problems.length > 0) {
  console.error(`${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('valid');
