import { describe, expect, it } from 'vitest';
import {
  courseConflictReason,
  coursePatch,
  courseToDraft,
  linesToList,
  newCourseInput,
  newCourseValues,
  nextOrderInPathway,
  numberOrNull,
  pathwayFitsAudience,
} from '@/components/course-editor/course-model';
import { CONFLICT_KEYS, conflictMessageKey } from '@/components/course-editor/errors-model';
import {
  lessonDraftToInput,
  lessonPatch,
  lessonToDraft,
  moduleDraftToInput,
  moduleToDraft,
  newLessonDraft,
} from '@/components/course-editor/module-lesson-model';
import {
  courseReadiness,
  lessonRequirements,
  moveId,
  moveResult,
  statusActions,
  statusExplanation,
  targetStatus,
} from '@/components/course-editor/outline-model';
import { editorPaths, NEW_ID, parseCourseTab } from '@/components/course-editor/paths';
import {
  newProjectDraft,
  projectDraftToInput,
  projectToDraft,
  rubricTotal,
} from '@/components/course-editor/project-model';
import type { LessonRow, ModuleRow, ProjectRow, QuizRow } from '@/components/course-editor/rows';
import { stableKey, syncDecision } from '@/components/course-editor/sync-model';
import {
  extraLocales,
  localeOfPath,
  orderedErrorPaths,
  stripInputPrefix,
  textDraftFrom,
  textDraftTo,
  translationState,
} from '@/components/course-editor/translations';
import { CONTENT_LIMITS } from '@/lib/limits';
import { parseInput } from '@/lib/schemas/common';
import { projectInputSchema } from '@/lib/schemas/project';
import { SEED_COURSES } from '../../scripts/seed/content';
import { course, lesson, project, reflectionBlock, richTextBlock } from './services-fixtures';

// The course editor's pure models (SPEC-F 4.1–4.7, 4.11, 4.12).

describe('paths', () => {
  it('builds every URL of both areas', () => {
    const teacher = editorPaths('teacher');
    const admin = editorPaths('admin');
    expect(teacher.list).toBe('/teacher/create');
    expect(admin.list).toBe('/admin/courses');
    expect(teacher.course('c')).toBe('/teacher/create/c');
    expect(teacher.course('c', 'outline')).toBe('/teacher/create/c');
    expect(teacher.course('c', 'details')).toBe('/teacher/create/c?tab=details');
    expect(admin.course('c', 'content')).toBe('/admin/courses/c?tab=content');
    expect(teacher.lesson('c', 'l')).toBe('/teacher/create/c/lessons/l');
    expect(admin.quiz('c', 'q')).toBe('/admin/courses/c/quizzes/q');
    expect(teacher.newQuiz('c')).toBe('/teacher/create/c/quizzes/new');
    expect(teacher.newQuiz('c', 'l 1')).toBe('/teacher/create/c/quizzes/new?lesson=l%201');
    expect(admin.project('c', 'p')).toBe('/admin/courses/c/projects/p');
    expect(admin.newProject('c', 'l')).toBe('/admin/courses/c/projects/new?lesson=l');
    expect(teacher.preview('c', 'l')).toBe('/teacher/courses/c/lessons/l');
    expect(admin.preview('c', 'l')).toBe('/preview/c/lessons/l');
    expect(NEW_ID).toBe('new');
  });

  it('parses the course tab', () => {
    expect(parseCourseTab(['content', 'details'])).toBe('content');
    expect(parseCourseTab('bogus')).toBe('outline');
    expect(parseCourseTab(undefined)).toBe('outline');
  });
});

describe('translations', () => {
  const FIELDS = ['title', 'caption'] as const;

  it('fills every editable locale and turns blanks back into the stored shape', () => {
    const draft = textDraftFrom({ en: { title: 'T', caption: null } }, FIELDS);
    expect(draft).toEqual({ en: { title: 'T', caption: '' }, fr: { title: '', caption: '' } });
    expect(
      textDraftTo(
        { en: { title: '', caption: ' ' }, fr: { title: '', caption: '' } },
        { fields: FIELDS, nullable: ['caption'], defaultLocale: 'en', extra: { ar: { title: 'ع', caption: null } } },
      ),
    ).toEqual({ en: { title: '', caption: null }, ar: { title: 'ع', caption: null } });
    expect(
      textDraftTo(
        { en: { title: 'T', caption: '' }, fr: { title: '', caption: 'L' } },
        { fields: FIELDS, nullable: ['caption'], defaultLocale: 'en' },
      ),
    ).toEqual({ en: { title: 'T', caption: null }, fr: { title: '', caption: 'L' } });
  });

  it('keeps the entries the UI does not edit', () => {
    expect(extraLocales({ en: { a: 1 }, ar: { a: 2 }, fr: undefined })).toEqual({ ar: { a: 2 } });
  });

  it('states a translation', () => {
    expect(translationState({ title: '' }, 'en', 'en')).toBe('required');
    expect(translationState({ title: 'x' }, 'fr', 'en')).toBe('translated');
    expect(translationState({ title: ' ' }, 'fr', 'en')).toBe('missing');
  });

  it('reads the locale of a path', () => {
    expect(localeOfPath('translations.fr.title')).toBe('fr');
    expect(localeOfPath('questions.2.options.0.translations.fr.text')).toBe('fr');
    expect(localeOfPath('questions.1.acceptedAnswers.fr.0')).toBe('fr');
    expect(localeOfPath('questions.0.explanation.en.text')).toBe('en');
    expect(localeOfPath('translations.ar.title')).toBeNull();
    expect(localeOfPath('estimatedMinutes')).toBeNull();
    expect(localeOfPath('questions.0.translations')).toBeNull();
  });

  it('strips one input or patch prefix and merges collisions', () => {
    expect(
      stripInputPrefix({
        'input.translations.en.title': ['required'],
        'patch.ageMax': ['age_range'],
        'translations.en.title': ['too_long', 'required'],
        'data.fileId': ['invalid'],
      }),
    ).toEqual({
      'translations.en.title': ['required', 'too_long'],
      ageMax: ['age_range'],
      'data.fileId': ['invalid'],
    });
  });

  it('orders error paths in reading order', () => {
    expect(
      orderedErrorPaths(
        { xpReward: ['too_big'], 'translations.fr.title': ['too_long'], other: ['x'], estimatedMinutes: ['required'] },
        ['translations', 'estimatedMinutes', 'xpReward'],
      ),
    ).toEqual(['translations.fr.title', 'estimatedMinutes', 'xpReward', 'other']);
  });
});

describe('sync-model', () => {
  it('keys ignore property order and undefined', () => {
    expect(stableKey({ a: 1, b: undefined, c: { d: [1, { e: 2, f: 3 }] } })).toBe(
      stableKey({ c: { d: [1, { f: 3, e: 2 }] }, a: 1 }),
    );
  });

  it('decides what a new server version means', () => {
    const table = [
      ['k', 'k', true, false, 'keep'],
      ['k', 'n', false, false, 'reset'],
      ['k', 'n', true, false, 'conflict'],
      ['k', 'n', true, true, 'keep'],
      ['k', 'n', false, true, 'reset'],
    ] as const;
    for (const [seenServerKey, serverKey, dirty, ownSave, expected] of table) {
      expect(syncDecision({ seenServerKey, serverKey, dirty, ownSave })).toBe(expected);
    }
  });
});

describe('course-model', () => {
  const fixture = course({
    id: 'c1',
    isOfficial: false,
    visibility: 'school',
    tags: ['robots', 'ai'],
    ageMin: 11,
    ageMax: 14,
    translations: {
      en: { title: 'T', summary: 'S', description: 'D', outcomes: ['a', 'b'] },
      fr: { title: 'Tf', summary: 'Sf', description: 'Df', outcomes: [] },
      ar: { title: 'ع', summary: '', description: '', outcomes: [] },
    },
  });
  const base = courseToDraft(fixture);

  it('reads a course into a draft', () => {
    expect(base.text.en.outcomes).toBe('a\nb');
    expect(base.tags).toBe('robots, ai');
    expect(base.ageMin).toBe('11');
    expect(base.visibility).toBe('school');
    expect(base.extra).toEqual({ ar: fixture.translations.ar });
    expect(base.pathwayId).toBe('ai-explorer');
    expect(coursePatch(base, base, { admin: false, official: false })).toEqual({});
  });

  it('sends text with its default language and keeps the other entries', () => {
    const draft = { ...base, text: { ...base.text, fr: { ...base.text.fr, summary: 'Sf2' } } };
    const patch = coursePatch(base, draft, { admin: false, official: false });
    expect(Object.keys(patch).sort()).toEqual(['defaultLocale', 'translations']);
    expect(patch.translations).toEqual({
      en: { title: 'T', summary: 'S', description: 'D', outcomes: ['a', 'b'] },
      fr: { title: 'Tf', summary: 'Sf2', description: 'Df', outcomes: [] },
      ar: fixture.translations.ar,
    });
  });

  it('sends both ages together and nulls them for a course for teachers', () => {
    expect(coursePatch(base, { ...base, ageMax: '16' }, { admin: false, official: false })).toEqual({
      ageMin: 11,
      ageMax: 16,
    });
    expect(
      coursePatch(base, { ...base, audience: 'teacher', ageMin: '', ageMax: '' }, { admin: false, official: false }),
    ).toEqual({ audience: 'teacher', ageMin: null, ageMax: null });
  });

  it('sends visibility for teacher-made courses only and the catalog fields for admins on official ones', () => {
    const draft = { ...base, visibility: 'private' as const, pathwayId: '', order: '4', accessTier: 'premium' as const };
    expect(coursePatch(base, draft, { admin: false, official: false })).toEqual({ visibility: 'private' });
    expect(coursePatch(base, draft, { admin: true, official: false })).toEqual({ visibility: 'private' });
    expect(coursePatch(base, draft, { admin: true, official: true })).toEqual({
      pathwayId: null,
      order: 4,
      accessTier: 'premium',
    });
  });

  it('builds a new course', () => {
    const values = { ...newCourseValues('fr'), title: 'T', summary: 'S', description: 'D' };
    const teacher = newCourseInput(values, 'teacher');
    expect(teacher).toMatchObject({
      defaultLocale: 'fr',
      translations: { fr: { title: 'T', summary: 'S', description: 'D', outcomes: [] } },
      visibility: 'private',
      estimatedMinutes: 60,
      certificateEnabled: true,
    });
    expect('isOfficial' in teacher).toBe(false);
    expect(newCourseInput(values, 'admin')).toMatchObject({ isOfficial: true, pathwayId: null, accessTier: 'free' });
    expect(nextOrderInPathway([{ pathwayId: 'p', order: 3 }, { pathwayId: 'q', order: 9 }], 'p')).toBe(4);
    expect(nextOrderInPathway([], null)).toBe(1);
  });

  it('names the conflict of a details save', () => {
    const published = course({ id: 'c', status: 'published', pathwayId: 'p1' });
    expect(courseConflictReason({ pathwayId: 'p2' }, published, [])).toBe('pathwayLocked');
    expect(courseConflictReason({ audience: 'teacher' }, published, [{ projectIds: ['x'] }])).toBe('audienceHasProjects');
    expect(courseConflictReason({ tags: [] }, published, [{ projectIds: ['x'] }])).toBe('generic');
  });

  it('parses text fields', () => {
    expect(linesToList(' a \n\n b\n')).toEqual(['a', 'b']);
    expect(numberOrNull('')).toBeNull();
    expect(numberOrNull('12')).toBe(12);
    expect(numberOrNull('x')).toBeNaN();
    expect(pathwayFitsAudience('', 'student', [])).toBe(true);
    expect(pathwayFitsAudience('p', 'student', [{ id: 'p', audience: 'teacher' }])).toBe(false);
    expect(pathwayFitsAudience('zz', 'student', [{ id: 'p', audience: 'student' }])).toBe(false);
    expect(pathwayFitsAudience('p', 'student', [{ id: 'p', audience: 'student' }])).toBe(true);
  });
});

describe('outline-model', () => {
  const modules: ModuleRow[] = [
    { id: 'm1', order: 0, lessonCount: 2, defaultLocale: 'en', translations: { en: { title: 'A', description: 'd' }, fr: { title: 'Af', description: '' } } },
    { id: 'm2', order: 1, lessonCount: 0, defaultLocale: 'en', translations: { en: { title: 'B', description: 'd' } } },
  ];
  const lessons: LessonRow[] = [
    { id: 'l1', moduleId: 'm1', order: 0, estimatedMinutes: 10, xpReward: 50, blockCount: 4, quizIds: ['q1'], projectIds: [], reflectionBlockIds: ['b4'], defaultLocale: 'en', translations: { en: { title: 'L1', summary: 's' }, fr: { title: 'L1f', summary: '' } } },
    { id: 'l2', moduleId: 'm1', order: 1, estimatedMinutes: 10, xpReward: 50, blockCount: 0, quizIds: [], projectIds: [], reflectionBlockIds: [], defaultLocale: 'en', translations: { en: { title: 'L2', summary: 's' } } },
  ];
  const quizzes: QuizRow[] = [
    { id: 'q1', lessonId: 'l1', questionCount: 4, defaultLocale: 'en', translations: { en: { title: 'Q' } } },
    { id: 'q2', lessonId: null, questionCount: 1, defaultLocale: 'en', translations: { en: { title: 'S' } } },
  ];
  const projects: ProjectRow[] = [
    { id: 'p1', lessonId: null, kind: 'project', defaultLocale: 'en', translations: { en: { title: 'P' } } },
  ];
  const withCover = course({
    id: 'c',
    isOfficial: false,
    coverImage: { fileId: 'f', storagePath: 'x', fileName: 'c.png', contentType: 'image/png', sizeBytes: 1, width: 1, height: 1 },
  });

  it('lists blockers in outline order and the warnings', () => {
    expect(courseReadiness({ course: withCover, modules, lessons, quizzes, projects })).toEqual({
      blockers: [
        { kind: 'empty_lesson', lessonId: 'l2' },
        { kind: 'empty_module', moduleId: 'm2' },
      ],
      warnings: [
        { kind: 'untranslated', locale: 'fr', course: false, modules: 1, lessons: 1 },
        { kind: 'unused_quizzes', count: 1 },
        { kind: 'unused_projects', count: 1 },
      ],
    });
    const none = courseReadiness({ course: course({ id: 'c', coverImage: null, translations: { en: withCover.translations.en } }), modules: [], lessons: [], quizzes: [], projects: [] });
    expect(none.blockers).toEqual([{ kind: 'no_modules' }]);
    expect(none.warnings).toEqual([{ kind: 'untranslated', locale: 'fr', course: true, modules: 0, lessons: 0 }, { kind: 'no_cover' }]);
  });

  it('knows the status actions and targets', () => {
    expect(statusActions('draft')).toEqual(['publish', 'archive']);
    expect(statusActions('published')).toEqual(['unpublish', 'archive']);
    expect(statusActions('archived')).toEqual(['restore']);
    expect(['publish', 'unpublish', 'archive', 'restore'].map((a) => targetStatus(a as never))).toEqual([
      'published',
      'draft',
      'archived',
      'draft',
    ]);
  });

  it('explains a status', () => {
    expect(statusExplanation({ status: 'draft', isOfficial: true, visibility: 'public', audience: 'student' })).toBe('draft');
    expect(statusExplanation({ status: 'archived', isOfficial: false, visibility: 'private', audience: 'student' })).toBe('archived');
    expect(statusExplanation({ status: 'published', isOfficial: true, visibility: 'public', audience: 'teacher' })).toBe('publishedOfficial');
    expect(statusExplanation({ status: 'published', isOfficial: false, visibility: 'school', audience: 'teacher' })).toBe('publishedForTeachers');
    expect(statusExplanation({ status: 'published', isOfficial: false, visibility: 'private', audience: 'teacher' })).toBe('publishedForTeachers');
    expect(statusExplanation({ status: 'published', isOfficial: false, visibility: 'school', audience: 'student' })).toBe('publishedSchool');
    expect(statusExplanation({ status: 'published', isOfficial: false, visibility: 'private', audience: 'student' })).toBe('publishedPrivate');
  });

  it('moves ids with clamping and edges', () => {
    expect(moveId(['a', 'b', 'c'], 'c', 0)).toEqual(['c', 'a', 'b']);
    expect(moveId(['a', 'b', 'c'], 'a', 9)).toEqual(['b', 'c', 'a']);
    expect(moveId(['a', 'b'], 'zz', 0)).toEqual(['a', 'b']);
    expect(moveResult(['a', 'b', 'c'], 'b', 1)).toEqual({ orderedIds: ['a', 'c', 'b'], index: 2 });
    expect(moveResult(['a', 'b', 'c'], 'a', -1)).toBeNull();
    expect(moveResult(['a', 'b', 'c'], 'c', 1)).toBeNull();
  });

  it('counts the requirements of a lesson', () => {
    const row = lesson({ id: 'l', courseId: 'c', quizIds: ['q'], projectIds: ['p', 'p2'] });
    const blocks = [reflectionBlock('r0', 'c', 'l', 0), reflectionBlock('r1', 'c', 'l', 20), richTextBlock('t', 'c', 'l')];
    expect(lessonRequirements(row, blocks)).toEqual({ quizzes: 1, projects: 2, reflections: 1 });
  });
});

describe('module-lesson-model', () => {
  it('round-trips a module and a lesson', () => {
    const row: ModuleRow = {
      id: 'm', order: 0, lessonCount: 0, defaultLocale: 'en',
      translations: { en: { title: 'A', description: 'd' }, fr: { title: 'Af', description: 'df' }, ar: { title: 'ع', description: 'x' } },
    };
    expect(moduleDraftToInput(moduleToDraft(row))).toEqual({ defaultLocale: 'en', translations: row.translations });
    const l = lesson({ id: 'l', courseId: 'c', estimatedMinutes: 25, xpReward: 80 });
    expect(lessonDraftToInput(lessonToDraft(l))).toEqual({
      defaultLocale: 'en',
      translations: l.translations,
      estimatedMinutes: 25,
      xpReward: 80,
    });
    expect(lessonDraftToInput(newLessonDraft('fr'))).toMatchObject({ defaultLocale: 'fr', estimatedMinutes: 10, xpReward: 50 });
  });

  it('patches only what changed', () => {
    const base = lessonToDraft(lesson({ id: 'l', courseId: 'c' }));
    expect(lessonPatch(base, base)).toEqual({});
    expect(lessonPatch(base, { ...base, estimatedMinutes: '12' })).toEqual({ estimatedMinutes: 12 });
    expect(lessonPatch(base, { ...base, estimatedMinutes: '' })).toEqual({ estimatedMinutes: null });
  });
});

describe('errors-model', () => {
  it('picks the message of every conflict (SPEC-F 3.2)', () => {
    const m = CONTENT_LIMITS;
    expect(conflictMessageKey({ action: 'updateCourse', reason: 'pathwayLocked' })).toEqual({ key: 'conflicts.pathwayLocked', refresh: false });
    expect(conflictMessageKey({ action: 'updateCourse', reason: 'audienceHasProjects' })).toEqual({ key: 'conflicts.audienceHasProjects', refresh: false });
    expect(conflictMessageKey({ action: 'updateCourse', reason: 'generic' })).toEqual({ key: 'conflicts.generic', refresh: true });
    expect(conflictMessageKey({ action: 'createModule' })).toEqual({ key: 'conflicts.tooManyModules', refresh: false, values: { max: m.modulesPerCourse } });
    expect(conflictMessageKey({ action: 'deleteModule', hasLessons: true })).toEqual({ key: 'conflicts.moduleHasLessons', refresh: false });
    expect(conflictMessageKey({ action: 'deleteModule', hasLessons: false })).toEqual({ key: 'conflicts.locked', refresh: true });
    expect(conflictMessageKey({ action: 'createLesson' })).toEqual({ key: 'conflicts.tooManyLessons', refresh: false, values: { max: m.lessonsPerModule } });
    expect(conflictMessageKey({ action: 'deleteStructure' })).toEqual({ key: 'conflicts.locked', refresh: true });
    expect(conflictMessageKey({ action: 'reorder' })).toEqual({ key: 'conflicts.staleOrder', refresh: true });
    const save = { action: 'saveBlock' as const, creating: true, blockCount: m.blocksPerLesson, link: null, teacherCourse: false };
    expect(conflictMessageKey(save)).toEqual({ key: 'conflicts.tooManyBlocks', refresh: false, values: { max: m.blocksPerLesson } });
    expect(conflictMessageKey({ ...save, blockCount: 1, link: 'quiz' })).toEqual({ key: 'conflicts.quizInUse', refresh: true });
    expect(conflictMessageKey({ ...save, blockCount: 1, link: 'project' })).toEqual({ key: 'conflicts.projectInUse', refresh: true });
    expect(conflictMessageKey({ ...save, blockCount: 1, link: 'project', teacherCourse: true })).toEqual({ key: 'conflicts.teacherCourseProject', refresh: false });
    expect(conflictMessageKey({ ...save, creating: false, link: null })).toEqual({ key: 'conflicts.generic', refresh: true });
    expect(conflictMessageKey({ action: 'deleteQuiz', linked: true })).toEqual({ key: 'conflicts.quizLinked', refresh: false });
    expect(conflictMessageKey({ action: 'deleteQuiz', linked: false })).toEqual({ key: 'conflicts.locked', refresh: true });
    expect(conflictMessageKey({ action: 'deleteProject', linked: true })).toEqual({ key: 'conflicts.projectLinked', refresh: false });
    expect(conflictMessageKey({ action: 'other' })).toEqual({ key: 'conflicts.generic', refresh: true });
    expect(CONFLICT_KEYS).toHaveLength(14);
  });
});

describe('project-model', () => {
  it('round-trips every seed project', () => {
    const inputs = SEED_COURSES.flatMap((seed) => seed.projects.map((p) => p.input));
    expect(inputs.length).toBeGreaterThan(0);
    for (const input of inputs) {
      const stored = project({ id: 'p', courseId: 'c', ...input });
      expect(projectDraftToInput(projectToDraft(stored))).toEqual(input);
    }
  });

  it('starts a new project that parses once its texts are filled', () => {
    const draft = newProjectDraft('en');
    draft.text.en = { title: 'T', brief: 'B', requirements: 'R' };
    const parsed = parseInput(projectInputSchema, projectDraftToInput(draft));
    expect(parsed.success).toBe(true);
    expect(rubricTotal(draft.rubric)).toBe(100);
    expect(rubricTotal({ ...draft.rubric, creativity: { included: true, weight: 'x' } })).toBe(75);
    expect(rubricTotal({ ...draft.rubric, creativity: { included: false, weight: '25' } })).toBe(75);
  });
});
