import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createBlockAction,
  createCourseAction,
  createLessonAction,
  createModuleAction,
  deleteBlockAction,
  deleteLessonAction,
  deleteModuleAction,
  deleteProjectAction,
  deleteQuizAction,
  reorderBlocksAction,
  reorderLessonsAction,
  reorderModulesAction,
  saveProjectAction,
  saveQuizAction,
  setCourseStatusAction,
  updateBlockAction,
  updateCourseAction,
  updateLessonAction,
  updateModuleAction,
} from '@/actions/course-editor';
import { assertSessionNotRevoked, getSession } from '@/lib/actions/session-source';
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
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import type { ActionResult, Role } from '@/types';
import type {
  BlockInput,
  CourseInput,
  LessonInput,
  ModuleInput,
  ProjectInput,
  QuizInput,
} from '@/types/inputs';
import {
  course,
  lesson,
  project,
  quiz,
  richTextBlock,
  session as sessionOf,
} from './services-fixtures';

// The course creator's actions (ARCHITECTURE.md 10.4, WS-F): the roles they let through, the
// repository calls they make, the shapes they answer, and that the repositories' codes reach
// the client.

vi.mock('next-intl/server', () => ({ getLocale: vi.fn(() => Promise.resolve('en')) }));
vi.mock('@/lib/actions/session-source', () => ({
  getSession: vi.fn(),
  assertSessionNotRevoked: vi.fn(),
}));
vi.mock('@/lib/data/courses', () => ({
  createCourse: vi.fn(),
  updateCourse: vi.fn(),
  setCourseStatus: vi.fn(),
  createModule: vi.fn(),
  updateModule: vi.fn(),
  deleteModule: vi.fn(),
  reorderModules: vi.fn(),
  createLesson: vi.fn(),
  updateLesson: vi.fn(),
  deleteLesson: vi.fn(),
  reorderLessons: vi.fn(),
  createBlock: vi.fn(),
  updateBlock: vi.fn(),
  deleteBlock: vi.fn(),
  reorderBlocks: vi.fn(),
}));
vi.mock('@/lib/data/quizzes', () => ({ saveQuiz: vi.fn(), deleteQuiz: vi.fn() }));
vi.mock('@/lib/data/projects', () => ({ saveProject: vi.fn(), deleteProject: vi.fn() }));

const teacher = sessionOf('teacher', 'teacher-1', 'school-a');
const admin = sessionOf('platform_admin', 'admin-1');

const repositories = [
  createCourse,
  updateCourse,
  setCourseStatus,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  createBlock,
  updateBlock,
  deleteBlock,
  reorderBlocks,
  saveQuiz,
  deleteQuiz,
  saveProject,
  deleteProject,
];

const courseInput: CourseInput = {
  defaultLocale: 'en',
  translations: { en: { title: 'Robots', summary: 'Short', description: 'Long', outcomes: [] } },
  audience: 'student',
  area: 'robotics',
  tags: [],
  ageMin: null,
  ageMax: null,
  estimatedMinutes: 60,
  visibility: 'private',
  certificateEnabled: true,
  coverImageFileId: null,
  hardwarePlatformIds: [],
  requiredCapabilities: [],
};
const adminFields = {
  isOfficial: true,
  pathwayId: 'ai-explorer',
  order: 3,
  accessTier: 'premium',
} as const;
const moduleInput: ModuleInput = {
  defaultLocale: 'en',
  translations: { en: { title: 'Module', description: 'About it' } },
};
const lessonInput: LessonInput = {
  defaultLocale: 'en',
  translations: { en: { title: 'Lesson', summary: 'About it' } },
  estimatedMinutes: 10,
  xpReward: 50,
};
const blockInput: BlockInput = {
  type: 'rich_text',
  stage: 'learn',
  defaultLocale: 'en',
  translations: { en: { heading: null, body: 'Text' } },
  data: {},
};
const quizInput: QuizInput = {
  defaultLocale: 'en',
  translations: { en: { title: 'Quiz', instructions: null } },
  passingScorePercent: 70,
  maxAttempts: null,
  xpReward: 100,
  shuffleQuestions: false,
  revealAnswers: 'after_pass',
  questions: [
    {
      id: null,
      type: 'multiple_choice',
      points: 1,
      translations: { en: { prompt: 'Pick' } },
      options: [
        { id: null, translations: { en: { text: 'A' } } },
        { id: null, translations: { en: { text: 'B' } } },
      ],
      correctOptionIndexes: [0],
      acceptedAnswers: {},
      explanation: {},
    },
  ],
};
const projectInput: ProjectInput = {
  kind: 'project',
  defaultLocale: 'en',
  translations: { en: { title: 'Poster', brief: 'Make one', requirements: 'Hand it in' } },
  allowedSubmissionTypes: ['image'],
  rubric: [
    { key: 'creativity', weight: 50 },
    { key: 'understanding', weight: 50 },
  ],
  xpReward: 300,
  requiredForCertificate: false,
};

function signIn(role: Role | null): void {
  vi.mocked(getSession).mockResolvedValue(role === null ? null : sessionOf(role, `${role}-1`));
}

function failure(result: ActionResult<unknown>) {
  if (result.ok) throw new Error('Expected a failure.');
  return result.error;
}

beforeEach(() => {
  for (const mock of repositories) vi.mocked(mock).mockReset();
  vi.mocked(getSession).mockReset().mockResolvedValue(teacher);
  vi.mocked(assertSessionNotRevoked).mockReset().mockResolvedValue(undefined);
  vi.mocked(createCourse).mockResolvedValue(course({ id: 'new-course' }));
  vi.mocked(updateCourse).mockResolvedValue(course({ id: 'c1' }));
  vi.mocked(setCourseStatus).mockResolvedValue(course({ id: 'c1' }));
  vi.mocked(createModule).mockResolvedValue({
    id: 'm-new',
    courseId: 'c1',
    order: 0,
    lessonCount: 0,
    ...moduleInput,
    createdAt: 'x',
    updatedAt: 'x',
  });
  vi.mocked(createLesson).mockResolvedValue(lesson({ id: 'l-new', courseId: 'c1' }));
  vi.mocked(createBlock).mockResolvedValue(richTextBlock('b-new', 'c1', 'l1'));
  vi.mocked(updateBlock).mockResolvedValue(richTextBlock('b1', 'c1', 'l1'));
  vi.mocked(saveQuiz).mockResolvedValue(quiz({ id: 'q-new', courseId: 'c1' }));
  vi.mocked(saveProject).mockResolvedValue(project({ id: 'p-new', courseId: 'c1' }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

const S = 'student';
const T = 'teacher';
const A = 'school_admin';
const P = 'platform_admin';
const ROLES: Role[] = [S, T, A, P];

const ACTIONS = [
  ['createCourseAction', () => createCourseAction(courseInput), createCourse],
  ['updateCourseAction', () => updateCourseAction({ courseId: 'c1', patch: { certificateEnabled: false } }), updateCourse],
  ['setCourseStatusAction', () => setCourseStatusAction({ courseId: 'c1', status: 'published' }), setCourseStatus],
  ['createModuleAction', () => createModuleAction({ courseId: 'c1', input: moduleInput }), createModule],
  ['updateModuleAction', () => updateModuleAction({ courseId: 'c1', moduleId: 'm1', patch: moduleInput }), updateModule],
  ['deleteModuleAction', () => deleteModuleAction({ courseId: 'c1', moduleId: 'm1' }), deleteModule],
  ['reorderModulesAction', () => reorderModulesAction({ courseId: 'c1', orderedIds: ['m2', 'm1'] }), reorderModules],
  ['createLessonAction', () => createLessonAction({ courseId: 'c1', moduleId: 'm1', input: lessonInput }), createLesson],
  ['updateLessonAction', () => updateLessonAction({ courseId: 'c1', lessonId: 'l1', patch: { xpReward: 20 } }), updateLesson],
  ['deleteLessonAction', () => deleteLessonAction({ courseId: 'c1', lessonId: 'l1' }), deleteLesson],
  ['reorderLessonsAction', () => reorderLessonsAction({ courseId: 'c1', moduleId: 'm1', orderedIds: ['l2', 'l1'] }), reorderLessons],
  ['createBlockAction', () => createBlockAction({ courseId: 'c1', lessonId: 'l1', input: blockInput }), createBlock],
  ['updateBlockAction', () => updateBlockAction({ courseId: 'c1', lessonId: 'l1', blockId: 'b1', input: blockInput }), updateBlock],
  ['deleteBlockAction', () => deleteBlockAction({ courseId: 'c1', lessonId: 'l1', blockId: 'b1' }), deleteBlock],
  ['reorderBlocksAction', () => reorderBlocksAction({ courseId: 'c1', lessonId: 'l1', orderedIds: ['b2', 'b1'] }), reorderBlocks],
  ['saveQuizAction', () => saveQuizAction({ courseId: 'c1', quizId: null, input: quizInput }), saveQuiz],
  ['deleteQuizAction', () => deleteQuizAction({ courseId: 'c1', quizId: 'q1' }), deleteQuiz],
  ['saveProjectAction', () => saveProjectAction({ courseId: 'c1', projectId: null, input: projectInput }), saveProject],
  ['deleteProjectAction', () => deleteProjectAction({ courseId: 'c1', projectId: 'p1' }), deleteProject],
] as const satisfies readonly (readonly [string, () => Promise<ActionResult<unknown>>, unknown])[];

describe.each(ACTIONS)('%s roles (ARCHITECTURE.md 10.4: T P)', (_name, call, repository) => {
  it.each(ROLES)('%s', async (role) => {
    signIn(role);
    const result = await call();
    if (role === T || role === P) {
      expect(result.ok).toBe(true);
      expect(repository).toHaveBeenCalledTimes(1);
    } else {
      expect(result).toEqual({ ok: false, error: { code: 'forbidden' } });
      for (const mock of repositories) expect(mock).not.toHaveBeenCalled();
    }
  });

  it('answers unauthenticated without a session', async () => {
    signIn(null);
    expect(await call()).toEqual({ ok: false, error: { code: 'unauthenticated' } });
    for (const mock of repositories) expect(mock).not.toHaveBeenCalled();
  });
});

describe('schema first', () => {
  it('refuses a malformed course id and a missing input before any read', async () => {
    expect(failure(await updateCourseAction({ courseId: 'a/b', patch: {} }))).toEqual({
      code: 'validation',
      fieldErrors: { courseId: ['invalid'] },
    });
    const missing = failure(await createModuleAction({ courseId: 'c1' } as never));
    expect(missing.code).toBe('validation');
    expect(missing.fieldErrors).toEqual({ input: ['required'] });
    for (const mock of repositories) expect(mock).not.toHaveBeenCalled();
  });

  it('parses deleteLessonAction with lessonRefInputSchema', async () => {
    expect(
      await deleteLessonAction({ courseId: 'c1', lessonId: 'l1', extra: true } as never),
    ).toEqual({ ok: true, data: null });
    expect(deleteLesson).toHaveBeenCalledWith(teacher, 'c1', 'l1');
    expect(failure(await deleteLessonAction({ courseId: 'c1' } as never))).toEqual({
      code: 'validation',
      fieldErrors: { lessonId: ['required'] },
    });
  });
});

describe('calls and answers', () => {
  it('creates and answers ids', async () => {
    expect(await createCourseAction(courseInput)).toEqual({ ok: true, data: { courseId: 'new-course' } });
    expect(createCourse).toHaveBeenCalledWith(teacher, courseInput);
    expect(await createModuleAction({ courseId: 'c1', input: moduleInput })).toEqual({
      ok: true,
      data: { moduleId: 'm-new' },
    });
    expect(createModule).toHaveBeenCalledWith(teacher, 'c1', moduleInput);
    expect(await createLessonAction({ courseId: 'c1', moduleId: 'm1', input: lessonInput })).toEqual({
      ok: true,
      data: { lessonId: 'l-new' },
    });
    expect(createLesson).toHaveBeenCalledWith(teacher, 'c1', 'm1', lessonInput);
    expect(await createBlockAction({ courseId: 'c1', lessonId: 'l1', input: blockInput })).toEqual({
      ok: true,
      data: { blockId: 'b-new' },
    });
    expect(createBlock).toHaveBeenCalledWith(teacher, 'c1', 'l1', blockInput);
    expect(await saveQuizAction({ courseId: 'c1', quizId: null, input: quizInput })).toEqual({
      ok: true,
      data: { quizId: 'q-new' },
    });
    expect(saveQuiz).toHaveBeenCalledWith(teacher, 'c1', null, quizInput);
    expect(await saveProjectAction({ courseId: 'c1', projectId: 'p1', input: projectInput })).toEqual({
      ok: true,
      data: { projectId: 'p-new' },
    });
    expect(saveProject).toHaveBeenCalledWith(teacher, 'c1', 'p1', projectInput);
  });

  it('updates, deletes and reorders with the exact arguments and answers null', async () => {
    expect(await updateCourseAction({ courseId: 'c1', patch: { tags: ['robots'] } })).toEqual({ ok: true, data: null });
    expect(updateCourse).toHaveBeenCalledWith(teacher, 'c1', { tags: ['robots'] });
    expect(await setCourseStatusAction({ courseId: 'c1', status: 'archived' })).toEqual({ ok: true, data: null });
    expect(setCourseStatus).toHaveBeenCalledWith(teacher, 'c1', 'archived');
    await updateModuleAction({ courseId: 'c1', moduleId: 'm1', patch: moduleInput });
    expect(updateModule).toHaveBeenCalledWith(teacher, 'c1', 'm1', moduleInput);
    await deleteModuleAction({ courseId: 'c1', moduleId: 'm1' });
    expect(deleteModule).toHaveBeenCalledWith(teacher, 'c1', 'm1');
    await reorderModulesAction({ courseId: 'c1', orderedIds: ['m2', 'm1'] });
    expect(reorderModules).toHaveBeenCalledWith(teacher, 'c1', ['m2', 'm1']);
    await updateLessonAction({ courseId: 'c1', lessonId: 'l1', patch: { estimatedMinutes: 12 } });
    expect(updateLesson).toHaveBeenCalledWith(teacher, 'c1', 'l1', { estimatedMinutes: 12 });
    await reorderLessonsAction({ courseId: 'c1', moduleId: 'm1', orderedIds: ['l2', 'l1'] });
    expect(reorderLessons).toHaveBeenCalledWith(teacher, 'c1', 'm1', ['l2', 'l1']);
    expect(await updateBlockAction({ courseId: 'c1', lessonId: 'l1', blockId: 'b1', input: blockInput })).toEqual({ ok: true, data: null });
    expect(updateBlock).toHaveBeenCalledWith(teacher, 'c1', 'l1', 'b1', blockInput);
    await deleteBlockAction({ courseId: 'c1', lessonId: 'l1', blockId: 'b1' });
    expect(deleteBlock).toHaveBeenCalledWith(teacher, 'c1', 'l1', 'b1');
    await reorderBlocksAction({ courseId: 'c1', lessonId: 'l1', orderedIds: ['b2', 'b1'] });
    expect(reorderBlocks).toHaveBeenCalledWith(teacher, 'c1', 'l1', ['b2', 'b1']);
    await deleteQuizAction({ courseId: 'c1', quizId: 'q1' });
    expect(deleteQuiz).toHaveBeenCalledWith(teacher, 'c1', 'q1');
    await deleteProjectAction({ courseId: 'c1', projectId: 'p1' });
    expect(deleteProject).toHaveBeenCalledWith(teacher, 'c1', 'p1');
  });

  it('refuses a duplicate in a reorder before the repository runs', async () => {
    expect(failure(await reorderModulesAction({ courseId: 'c1', orderedIds: ['m1', 'm1'] }))).toEqual({
      code: 'validation',
      fieldErrors: { orderedIds: ['duplicate'] },
    });
    expect(reorderModules).not.toHaveBeenCalled();
  });
});

describe('admin fields', () => {
  it('drops the four platform-admin fields for a teacher and keeps them for a platform admin', async () => {
    await createCourseAction({ ...courseInput, ...adminFields });
    expect(createCourse).toHaveBeenCalledWith(teacher, courseInput);
    await updateCourseAction({ courseId: 'c1', patch: { ...adminFields, tags: ['x'] } });
    expect(updateCourse).toHaveBeenCalledWith(teacher, 'c1', { tags: ['x'] });

    vi.mocked(getSession).mockResolvedValue(admin);
    await createCourseAction({ ...courseInput, ...adminFields });
    expect(createCourse).toHaveBeenLastCalledWith(admin, { ...courseInput, ...adminFields });
    await updateCourseAction({ courseId: 'c1', patch: { ...adminFields } });
    expect(updateCourse).toHaveBeenLastCalledWith(admin, 'c1', { ...adminFields });
  });
});

describe('error pass-through', () => {
  it('maps the repository errors to their codes', async () => {
    vi.mocked(deleteModule).mockRejectedValueOnce(new ConflictError('has lessons'));
    expect(failure(await deleteModuleAction({ courseId: 'c1', moduleId: 'm1' })).code).toBe('conflict');
    vi.mocked(updateLesson).mockRejectedValueOnce(new NotFoundError('gone'));
    expect(failure(await updateLessonAction({ courseId: 'c1', lessonId: 'l1', patch: {} })).code).toBe('not_found');
    vi.mocked(setCourseStatus).mockRejectedValueOnce(new ForbiddenError('not yours'));
    expect(failure(await setCourseStatusAction({ courseId: 'c1', status: 'draft' })).code).toBe('forbidden');
    vi.mocked(createBlock).mockRejectedValueOnce(
      new ValidationError('x', { 'input.data.fileId': ['file_type_not_allowed'] }),
    );
    expect(failure(await createBlockAction({ courseId: 'c1', lessonId: 'l1', input: blockInput }))).toEqual({
      code: 'validation',
      fieldErrors: { 'input.data.fileId': ['file_type_not_allowed'] },
    });
    vi.mocked(setCourseStatus).mockRejectedValueOnce(
      new ValidationError('not ready', { status: ['content_required'] }),
    );
    expect(failure(await setCourseStatusAction({ courseId: 'c1', status: 'published' }))).toEqual({
      code: 'validation',
      fieldErrors: { status: ['content_required'] },
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(saveQuiz).mockRejectedValueOnce(new Error('boom'));
    expect(failure(await saveQuizAction({ courseId: 'c1', quizId: 'q1', input: quizInput })).code).toBe('internal');
  });
});
