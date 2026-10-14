import { describe, expect, it } from 'vitest';
import { ICON_NAMES } from '@/components/domain/NamedIcon';
import { isValidUsername } from '@/lib/auth/username';
import { AVATAR_IDS } from '@/lib/avatars';
import { hasTranslation } from '@/lib/i18n/content';
import { JOIN_CODE } from '@/lib/limits';
import { ID_PATTERN } from '@/lib/schemas/common';
import { usernameBase } from '@/lib/services/internal-credentials';
import type { Localized } from '@/types/common';
import { LESSON_STAGES } from '@/types/content';
import { HARDWARE_CAPABILITIES } from '@/types/hardware';
import { BADGES, HARDWARE_PLATFORMS, PATHWAYS } from '../../scripts/migrations/0001_initial';
import { SEED_CHALLENGES, SEED_COURSES } from '../../scripts/seed/content';
import {
  DEFAULT_DEMO_PASSWORD,
  DEMO_ACCOUNTS,
  DEMO_CLASS_STUDENTS,
  DEMO_JOIN_CODE,
  demoAccount,
  resolveDemoPassword,
} from '../../scripts/seed/demo-users';
import type { SeedCourse } from '../../scripts/seed/types';
import {
  CONTENT_LOCALES,
  DEMO_COURSE_IDS,
  contentLinks,
  validateSeedContent,
  validateSeedCourse,
} from '../../scripts/seed/validate';

// The pure half of F6's data tooling (ARCHITECTURE.md 11.1, 11.2, 11.6): the seed content and
// the reference data are checked here, before any emulator run.

const PATHWAY_IDS = [
  'ai-explorer',
  'ai-creator',
  'ai-builder',
  'ai-engineer',
  'ai-innovator',
  'ai-robotics',
  'teacher-academy',
];

function adventure(): SeedCourse {
  const course = SEED_COURSES.find((candidate) => candidate.id === 'my-first-ai-adventure');
  if (course === undefined) throw new Error('my-first-ai-adventure is not seeded');
  return structuredClone(course);
}

function blocksOf(course: SeedCourse) {
  return course.modules.flatMap((module) => module.lessons.flatMap((lesson) => lesson.blocks));
}

describe('seed content', () => {
  it('passes every content rule of 11.2', () => {
    expect(validateSeedContent(SEED_COURSES, SEED_CHALLENGES)).toEqual([]);
  });

  it('ships the AI Explorer course of 11.6, and only demo course ids', () => {
    const course = adventure();
    expect(course.course.pathwayId).toBe('ai-explorer');
    expect(course.course.audience).toBe('student');
    expect([course.course.ageMin, course.course.ageMax]).toEqual([8, 10]);
    expect(course.course.isOfficial).toBe(true);
    expect(course.course.accessTier).toBe('free');
    expect(course.course.certificateEnabled).toBe(true);
    for (const seeded of SEED_COURSES) {
      expect(DEMO_COURSE_IDS).toContain(seeded.id);
    }
  });

  it('has two modules of two lessons, a quiz per module, one project and every stage', () => {
    const course = adventure();
    expect(course.modules.length).toBeGreaterThanOrEqual(2);
    for (const courseModule of course.modules) {
      expect(courseModule.lessons.length).toBeGreaterThanOrEqual(2);
      const quizBlocks = courseModule.lessons.flatMap((lesson) =>
        lesson.blocks.filter((block) => block.type === 'quiz'),
      );
      expect(quizBlocks.length).toBeGreaterThanOrEqual(1);
    }
    expect(course.projects).toHaveLength(1);
    const stages = new Set(blocksOf(course).map((block) => block.stage));
    expect([...LESSON_STAGES].filter((stage) => !stages.has(stage))).toEqual([]);
  });

  it('references no uploaded file', () => {
    for (const block of blocksOf(adventure())) {
      expect(block.type).not.toBe('image');
      expect(block.type).not.toBe('file');
      if (block.type === 'video') {
        expect(block.data.source).not.toBe('file');
        expect(block.data.fileId).toBeNull();
      }
    }
    for (const challenge of SEED_CHALLENGES) expect(challenge.input.coverImageFileId).toBeNull();
  });

  it('links every quiz and project to exactly one lesson', () => {
    const course = adventure();
    const links = contentLinks(course);
    expect([...links.quizzes.keys()].sort()).toEqual(course.quizzes.map((quiz) => quiz.id).sort());
    expect([...links.projects.keys()]).toEqual(course.projects.map((project) => project.id));
    const lessonIds = course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id));
    for (const lessonId of [...links.quizzes.values(), ...links.projects.values()]) {
      expect(lessonIds).toContain(lessonId);
    }
  });

  it('carries every content language on every document', () => {
    const course = adventure();
    for (const locale of CONTENT_LOCALES) {
      expect(hasTranslation(course.course.translations, locale)).toBe(true);
      for (const courseModule of course.modules) {
        expect(hasTranslation(courseModule.input.translations, locale)).toBe(true);
        for (const lesson of courseModule.lessons) {
          expect(hasTranslation(lesson.input.translations, locale)).toBe(true);
        }
      }
      for (const quiz of course.quizzes) {
        expect(hasTranslation(quiz.input.translations, locale)).toBe(true);
      }
      for (const project of course.projects) {
        expect(hasTranslation(project.input.translations, locale)).toBe(true);
      }
      for (const challenge of SEED_CHALLENGES) {
        expect(hasTranslation(challenge.input.translations, locale)).toBe(true);
      }
    }
  });

  it('recommends only hardware the migration defines', () => {
    const platformIds = HARDWARE_PLATFORMS.map((platform) => platform.id);
    for (const challenge of SEED_CHALLENGES) {
      for (const id of challenge.input.hardwarePlatformIds) expect(platformIds).toContain(id);
    }
    for (const course of SEED_COURSES) {
      for (const id of course.course.hardwarePlatformIds) expect(platformIds).toContain(id);
    }
  });

  it('keeps one challenge open and one upcoming', () => {
    const now = Date.now();
    const phases = SEED_CHALLENGES.map((challenge) => {
      const start = Date.parse(challenge.input.startAt);
      const deadline = Date.parse(challenge.input.deadlineAt);
      return now < start ? 'upcoming' : now < deadline ? 'open' : 'closed';
    });
    expect(phases.sort()).toEqual(['open', 'upcoming']);
  });
});

describe('seed content validation', () => {
  const problemsAbout = (course: SeedCourse, text: string) =>
    validateSeedCourse(course).filter((problem) => problem.includes(text));

  it('refuses a course with one module', () => {
    const course = adventure();
    course.modules = course.modules.slice(0, 1);
    expect(problemsAbout(course, 'at least two modules')).toHaveLength(1);
  });

  it('refuses a repeated id', () => {
    const course = adventure();
    course.modules[1]!.lessons[0]!.id = course.modules[0]!.lessons[0]!.id;
    expect(problemsAbout(course, 'is used twice')).toHaveLength(1);
  });

  it('refuses a quiz referenced by two lessons', () => {
    const course = adventure();
    const [first, second] = course.modules[0]!.lessons;
    const quizBlock = second!.blocks.find((block) => block.type === 'quiz')!;
    first!.blocks.push({ ...structuredClone(quizBlock), id: 'extra-quiz-block' });
    expect(problemsAbout(course, 'referenced by several lessons')).toHaveLength(1);
  });

  it('refuses an unknown quiz, an uploaded image and a missing stage', () => {
    const course = adventure();
    for (const lesson of course.modules.flatMap((module) => module.lessons)) {
      lesson.blocks = lesson.blocks.filter((block) => block.type !== 'reflection');
    }
    const lesson = course.modules[0]!.lessons[0]!;
    lesson.blocks.push({
      id: 'bad-quiz',
      type: 'quiz',
      stage: 'check',
      defaultLocale: 'en',
      translations: { en: { intro: null }, fr: { intro: null } },
      data: { quizId: 'quiz-nowhere' },
    });
    lesson.blocks.push({
      id: 'bad-image',
      type: 'image',
      stage: 'learn',
      defaultLocale: 'en',
      translations: { en: { alt: 'x', caption: null }, fr: { alt: 'x', caption: null } },
      data: { fileId: '11111111-1111-4111-8111-111111111111' },
    });
    const problems = validateSeedCourse(course);
    expect(problems.some((problem) => problem.includes('unknown quiz quiz-nowhere'))).toBe(true);
    expect(problems.some((problem) => problem.includes('no uploaded files'))).toBe(true);
    expect(problems.some((problem) => problem.includes("no block has stage 'reflect'"))).toBe(true);
  });

  it('refuses a project block in a teacher course and asks for a reflection', () => {
    const course = adventure();
    course.course.audience = 'teacher';
    const problems = validateSeedCourse(course);
    expect(
      problems.some((problem) => problem.includes('no project blocks in a teacher course')),
    ).toBe(true);
    expect(problems.some((problem) => problem.includes('a teacher course has no projects'))).toBe(
      true,
    );
  });

  it('refuses text missing in one content language', () => {
    const course = adventure();
    delete course.modules[0]!.input.translations.fr;
    expect(problemsAbout(course, 'no fr translation')).toHaveLength(1);
  });
});

describe('reference data of 0001_initial', () => {
  it('defines the seven pathways of brief section 8, published, in order', () => {
    expect(PATHWAYS.map((pathway) => pathway.id)).toEqual(PATHWAY_IDS);
    expect(PATHWAYS.map((pathway) => pathway.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(new Set(PATHWAYS.map((pathway) => pathway.accent)).size).toBe(PATHWAYS.length);
    for (const pathway of PATHWAYS) {
      expect(pathway.status).toBe('published');
      expect(pathway.audience).toBe(pathway.kind === 'teacher_academy' ? 'teacher' : 'student');
      if (pathway.id === 'teacher-academy') {
        expect([pathway.ageMin, pathway.ageMax]).toEqual([null, null]);
      } else {
        expect(pathway.ageMin).not.toBeNull();
        expect(pathway.ageMax).not.toBeNull();
        expect(pathway.ageMin!).toBeLessThanOrEqual(pathway.ageMax!);
      }
      expect(pathway.translations.en?.topics.length).toBeGreaterThan(0);
    }
    expect(PATHWAYS.find((pathway) => pathway.id === 'ai-robotics')?.kind).toBe('robotics');
  });

  it('defines the seven badges with the criteria of 9.3', () => {
    expect(Object.fromEntries(BADGES.map((badge) => [badge.id, badge.criteria]))).toEqual({
      'ai-explorer': { type: 'pathway_completed', pathwayId: 'ai-explorer' },
      'prompt-master': { type: 'course_completed', courseId: 'build-with-generative-ai' },
      'data-detective': { type: 'stat_threshold', stat: 'quizzesPassed', threshold: 5 },
      'vision-builder': { type: 'stat_threshold', stat: 'projectsAccepted', threshold: 3 },
      'responsible-ai-champion': { type: 'manual' },
      'robotics-engineer': { type: 'pathway_completed', pathwayId: 'ai-robotics' },
      'ai-innovator': { type: 'pathway_completed', pathwayId: 'ai-innovator' },
    });
    for (const badge of BADGES) {
      expect(badge.isActive).toBe(true);
      expect(badge.xpBonus).toBeGreaterThanOrEqual(0);
      if (badge.criteria.type === 'course_completed') {
        expect(DEMO_COURSE_IDS).toContain(badge.criteria.courseId);
      }
      if (badge.criteria.type === 'pathway_completed') {
        expect(PATHWAY_IDS).toContain(badge.criteria.pathwayId);
      }
    }
  });

  it('defines the hardware platforms of 11.6 with known capabilities', () => {
    expect(HARDWARE_PLATFORMS.map((platform) => platform.id)).toEqual([
      'simulator',
      'generic-camera-rover',
      'generic-sensor-kit',
    ]);
    for (const platform of HARDWARE_PLATFORMS) {
      expect(platform.vendor).toBeNull();
      expect(platform.image).toBeNull();
      for (const capability of platform.capabilities) {
        expect(HARDWARE_CAPABILITIES).toContain(capability);
      }
    }
  });

  it('uses valid ids, icons of ICON_NAMES and both content languages', () => {
    const named: { id: string; icon: string; translations: Localized<object> }[] = [
      ...PATHWAYS,
      ...BADGES,
    ];
    for (const document of named) {
      expect(document.id).toMatch(ID_PATTERN);
      expect(ICON_NAMES).toContain(document.icon);
      for (const locale of CONTENT_LOCALES) {
        expect(hasTranslation(document.translations, locale)).toBe(true);
      }
    }
    for (const platform of HARDWARE_PLATFORMS) {
      expect(platform.id).toMatch(ID_PATTERN);
      for (const locale of CONTENT_LOCALES) {
        expect(hasTranslation(platform.translations, locale)).toBe(true);
      }
    }
  });
});

describe('demo accounts of 11.6', () => {
  it('have valid uids, unique lower-case addresses and known avatars', () => {
    const emails = DEMO_ACCOUNTS.map((account) => account.email);
    expect(new Set(emails).size).toBe(emails.length);
    for (const account of DEMO_ACCOUNTS) {
      expect(account.uid).toMatch(ID_PATTERN);
      expect(account.email).toBe(account.email.toLowerCase());
      expect(AVATAR_IDS).toContain(account.avatarId);
    }
  });

  it('name the class students as provisioning would', () => {
    for (const key of DEMO_CLASS_STUDENTS) {
      const account = demoAccount(key);
      expect(account.role).toBe('student');
      expect(account.inSchool).toBe(true);
      expect(account.consentBasis).toBe('school');
      expect(account.username).not.toBeNull();
      expect(isValidUsername(account.username!)).toBe(true);
      expect(usernameBase(account.displayName)).toBe(account.username);
      expect(account.email).toBe(`${account.username}@student.roboholic.invalid`);
    }
    expect(DEMO_CLASS_STUDENTS.map((key) => demoAccount(key).username)).toEqual([
      'lea.demo',
      'omar.demo',
      'maya.demo',
    ]);
  });

  it('keep the platform admin off real projects and the individual learner out of the school', () => {
    expect(demoAccount('admin').emulatorOnly).toBe(true);
    expect(demoAccount('admin').role).toBe('platform_admin');
    expect(DEMO_ACCOUNTS.filter((account) => account.emulatorOnly)).toHaveLength(1);
    const student = demoAccount('student');
    expect(student.inSchool).toBe(false);
    expect(student.consentBasis).toBe('self_13_plus');
    expect(student.username).toBeNull();
  });

  it('use a join code of the join-code alphabet', () => {
    expect(DEMO_JOIN_CODE).toMatch(new RegExp(`^[${JOIN_CODE.alphabet}]{${JOIN_CODE.length}}$`));
  });

  it('resolve the demo password by the rules of 11.6', () => {
    expect(resolveDemoPassword('emulator', undefined)).toEqual({
      password: DEFAULT_DEMO_PASSWORD,
      source: 'default',
    });
    expect(resolveDemoPassword('emulator', ' from-the-environment ')).toEqual({
      password: 'from-the-environment',
      source: 'SEED_DEMO_PASSWORD',
    });
    expect(() => resolveDemoPassword('project', undefined)).toThrow(/16 characters/);
    expect(() => resolveDemoPassword('project', 'short-password')).toThrow(/16 characters/);
    expect(resolveDemoPassword('project', 'a-long-enough-demo-password')).toEqual({
      password: 'a-long-enough-demo-password',
      source: 'SEED_DEMO_PASSWORD',
    });
  });
});
