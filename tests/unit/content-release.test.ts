import { describe, expect, it, vi } from 'vitest';
import { ID_PATTERN } from '@/lib/schemas/common';
import { PATHWAYS } from '../../scripts/migrations/0001_initial';
import { SEED_COURSES } from '../../scripts/seed/content';
import { CONTENT_RELEASES } from '../../scripts/seed/content/releases';
import { fingerprintCourseDetails } from '../../scripts/seed/course-details';
import {
  courseOverwriteRefusal,
  courseWrites,
  coursesSeededIn,
  seedCourseDetails,
} from '../../scripts/seed/course-writes';
import {
  decideCourseDetails,
  decideNewCourse,
  decideNewModule,
  modulePaths,
  moduleWrites,
  placeModule,
  releaseProblems,
  selectReleases,
} from '../../scripts/seed/release';
import type { ContentRelease, SeedCourse, SeedModule } from '../../scripts/seed/types';

// The pure half of the content release tool (ARCHITECTURE.md 11.7): the releases of
// scripts/seed/content/releases.ts against the seed content, and the decisions a run takes from
// what a database holds. tests/integration/content-release.test.ts runs it on the emulators.

// Document references with their paths and nothing else: what courseWrites builds them from.
vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: () => ({
    collection: (path: string) => ({
      doc: (id: string) => ({ id, path: `${path}/${id}` }),
    }),
  }),
}));

const FINGERPRINT = /^[0-9a-f]{16}$/;

function seedCourse(courseId: string): SeedCourse {
  const course = SEED_COURSES.find((candidate) => candidate.id === courseId);
  if (course === undefined) throw new Error(`${courseId} is not seeded`);
  return course;
}

function linksOf(courseModule: SeedModule): string[] {
  return courseModule.lessons.flatMap((lesson) =>
    lesson.blocks.flatMap((block) => {
      if (block.type === 'quiz') return [`quiz ${block.data.quizId}`];
      if (block.type === 'project') return [`project ${block.data.projectId}`];
      return [];
    }),
  );
}

/** A course of the seed with a module that has a quiz, and that course's other modules. */
const COURSE = seedCourse('from-ai-user-to-ai-developer');
const MODULE = COURSE.modules[1]!;

function release(overrides: Partial<ContentRelease>): ContentRelease {
  return {
    id: 'test-release',
    summary: 'A release for the tests',
    newCourses: [],
    newModules: [],
    courseDetails: [],
    ...overrides,
  };
}

describe('CONTENT_RELEASES', () => {
  it('passes every check of releaseProblems', () => {
    expect(releaseProblems(CONTENT_RELEASES, SEED_COURSES)).toEqual([]);
  });

  it('has release ids that match ID_PATTERN, each used once', () => {
    const ids = CONTENT_RELEASES.map((entry) => entry.id);
    for (const id of ids) expect(id).toMatch(ID_PATTERN);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('names only courses and modules that SEED_COURSES holds', () => {
    const courseIds = SEED_COURSES.map((course) => course.id);
    for (const entry of CONTENT_RELEASES) {
      for (const courseId of entry.newCourses) expect(courseIds).toContain(courseId);
      for (const { courseId, moduleId } of entry.newModules) {
        expect(courseIds).toContain(courseId);
        expect(seedCourse(courseId).modules.map((courseModule) => courseModule.id)).toContain(
          moduleId,
        );
      }
      for (const { courseId } of entry.courseDetails) expect(courseIds).toContain(courseId);
    }
  });

  it('names no new course, module or detail change twice', () => {
    const named = CONTENT_RELEASES.flatMap((entry) => [
      ...entry.newCourses.map((courseId) => `course ${courseId}`),
      ...entry.newModules.map(({ courseId, moduleId }) => `module ${courseId}/${moduleId}`),
      ...entry.courseDetails.map(({ courseId, before }) => `details ${courseId}/${before}`),
    ]);
    expect(new Set(named).size).toBe(named.length);
  });

  it('gives every new course a pathway the migration publishes', () => {
    for (const entry of CONTENT_RELEASES) {
      for (const courseId of entry.newCourses) {
        const pathwayId = seedCourse(courseId).course.pathwayId;
        expect(PATHWAYS.find((pathway) => pathway.id === pathwayId)?.status).toBe('published');
      }
    }
  });

  it('brings the quizzes and projects of a new module with it: no other module uses them', () => {
    for (const entry of CONTENT_RELEASES) {
      for (const { courseId, moduleId } of entry.newModules) {
        const course = seedCourse(courseId);
        const own = linksOf(course.modules.find((candidate) => candidate.id === moduleId)!);
        const others = course.modules
          .filter((candidate) => candidate.id !== moduleId)
          .flatMap(linksOf);
        expect(own.filter((link) => others.includes(link))).toEqual([]);
      }
    }
  });

  it('names the details it replaces by a fingerprint of 16 hex digits', () => {
    for (const entry of CONTENT_RELEASES) {
      for (const { before } of entry.courseDetails) expect(before).toMatch(FINGERPRINT);
    }
  });
});

describe('releaseProblems', () => {
  it('accepts a release of seed content', () => {
    const valid = release({
      newCourses: ['ai-robotics-foundations'],
      newModules: [{ courseId: COURSE.id, moduleId: MODULE.id }],
      courseDetails: [{ courseId: 'build-with-generative-ai', before: '0123456789abcdef' }],
    });
    expect(releaseProblems([valid], SEED_COURSES)).toEqual([]);
  });

  it('refuses ids that SEED_COURSES does not hold', () => {
    const problems = releaseProblems(
      [
        release({
          newCourses: ['no-such-course'],
          newModules: [
            { courseId: 'no-such-course', moduleId: 'm1' },
            { courseId: COURSE.id, moduleId: 'no-such-module' },
          ],
          courseDetails: [{ courseId: 'no-such-course', before: '0123456789abcdef' }],
        }),
      ],
      SEED_COURSES,
    );
    expect(problems).toEqual([
      'release test-release / new course no-such-course: not in SEED_COURSES',
      'release test-release / new module no-such-course/m1: course no-such-course is not in SEED_COURSES',
      `release test-release / new module ${COURSE.id}/no-such-module: not in SEED_COURSES`,
      'release test-release / details of no-such-course: course no-such-course is not in SEED_COURSES',
    ]);
  });

  it('refuses a release id used twice, a bad id, a blank summary and an empty release', () => {
    const problems = releaseProblems(
      [
        release({ newCourses: ['ai-robotics-foundations'] }),
        release({ courseDetails: [{ courseId: COURSE.id, before: '0123456789abcdef' }] }),
        release({ id: 'Not valid!', summary: ' ' }),
      ],
      SEED_COURSES,
    );
    expect(problems).toEqual([
      'release test-release: id is used twice',
      `release Not valid!: id does not match ${ID_PATTERN}`,
      'release Not valid!: summary is blank',
      'release Not valid!: names no content',
    ]);
  });

  it('refuses a course, a module or a starting point named twice, in one release or two', () => {
    const item = { courseId: COURSE.id, moduleId: MODULE.id };
    const details = { courseId: COURSE.id, before: '0123456789abcdef' };
    const problems = releaseProblems(
      [
        release({ id: 'first', newCourses: ['ai-robotics-foundations'], newModules: [item] }),
        release({
          id: 'second',
          newCourses: ['ai-robotics-foundations'],
          newModules: [item],
          courseDetails: [details, details],
        }),
      ],
      SEED_COURSES,
    );
    expect(problems).toEqual([
      'release second / new course ai-robotics-foundations: already named by release first',
      `release second / new module ${COURSE.id}/${MODULE.id}: already named by release first`,
      `release second / details of ${COURSE.id}: already named by release second`,
    ]);
  });

  it('accepts a second change of the same details from another starting point', () => {
    const problems = releaseProblems(
      [
        release({
          id: 'first',
          courseDetails: [{ courseId: COURSE.id, before: 'aaaaaaaaaaaaaaaa' }],
        }),
        release({
          id: 'second',
          courseDetails: [{ courseId: COURSE.id, before: 'bbbbbbbbbbbbbbbb' }],
        }),
      ],
      SEED_COURSES,
    );
    expect(problems).toEqual([]);
  });

  it('refuses a fingerprint that is not 16 lowercase hex digits', () => {
    const problems = releaseProblems(
      [release({ courseDetails: [{ courseId: COURSE.id, before: 'ABCDEF0123456789' }] })],
      SEED_COURSES,
    );
    expect(problems).toEqual([
      `release test-release / details of ${COURSE.id}: before "ABCDEF0123456789" is not 16 lowercase hex digits`,
    ]);
  });

  it('refuses a new module whose quiz another module references', () => {
    const course = structuredClone(COURSE);
    const quizBlock = course.modules[1]!.lessons.flatMap((lesson) => lesson.blocks).find(
      (block) => block.type === 'quiz',
    );
    if (quizBlock?.type !== 'quiz') throw new Error('The module has no quiz block.');
    const other = course.modules[0]!.lessons[0]!;
    other.blocks.push({ ...quizBlock, id: 'shared-quiz' });
    const problems = releaseProblems(
      [release({ newModules: [{ courseId: course.id, moduleId: course.modules[1]!.id }] })],
      [course],
    );
    expect(problems).toEqual([
      `release test-release / new module ${course.id}/${course.modules[1]!.id}: quiz ${quizBlock.data.quizId} is also referenced from module ${course.modules[0]!.id}`,
    ]);
  });
});

describe('selectReleases', () => {
  const releases = [release({ id: 'first' }), release({ id: 'second' }), release({ id: 'third' })];

  it('takes every release, oldest first, when none is named', () => {
    expect(selectReleases(releases, []).map((entry) => entry.id)).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  it('keeps the order of the list, not of the command line', () => {
    expect(selectReleases(releases, ['third', 'first']).map((entry) => entry.id)).toEqual([
      'first',
      'third',
    ]);
  });

  it('refuses an id the list does not hold', () => {
    expect(() => selectReleases(releases, ['first', 'fourth'])).toThrow(
      'Unknown release fourth (known: first, second, third).',
    );
  });
});

describe('the documents of a new module', () => {
  it('are the module, its lessons and blocks, and the quizzes, keys and projects they use', () => {
    const base = `courses/${COURSE.id}`;
    const paths = modulePaths(COURSE, MODULE.id);
    const expected = [`${base}/modules/${MODULE.id}`];
    for (const lesson of MODULE.lessons) {
      expected.push(`${base}/lessons/${lesson.id}`);
      for (const block of lesson.blocks) {
        expected.push(`${base}/lessons/${lesson.id}/blocks/${block.id}`);
        if (block.type === 'quiz') {
          expected.push(
            `${base}/quizzes/${block.data.quizId}`,
            `${base}/quizzes/${block.data.quizId}/private/key`,
          );
        }
        if (block.type === 'project') expected.push(`${base}/projects/${block.data.projectId}`);
      }
    }
    expect([...paths].sort()).toEqual([...expected].sort());
    expect(paths.some((path) => path.includes('/private/key'))).toBe(true);
  });

  it('are written exactly as courseWrites writes them, for every module of the seed', () => {
    for (const course of SEED_COURSES) {
      const whole = new Map(courseWrites(course, 'system').map((write) => [write.ref.path, write]));
      const covered = new Set<string>();
      for (const courseModule of course.modules) {
        for (const write of moduleWrites(course, courseModule.id)) {
          expect(write.fields).toEqual(whole.get(write.ref.path)?.fields);
          covered.add(write.ref.path);
        }
      }
      // Every document of the course but the course itself belongs to one of its modules.
      expect([...whole.keys()].filter((path) => !covered.has(path))).toEqual([
        `courses/${course.id}`,
      ]);
    }
  });

  it('link their quizzes and projects to the lesson that uses them', () => {
    const writes = moduleWrites(COURSE, MODULE.id);
    const lessonIds = MODULE.lessons.map((lesson) => lesson.id);
    for (const write of writes) {
      if (/\/(quizzes|projects)\/[^/]+$/.test(write.ref.path)) {
        expect(lessonIds).toContain((write.fields as { lessonId: string | null }).lessonId);
      }
    }
  });
});

describe('decisions', () => {
  const paths = ['courses/c/modules/m1', 'courses/c/lessons/l1', 'courses/c'];
  const state = (existing: string[], recorded: string[] = []) => ({
    existing: new Set(existing),
    recorded: new Set(recorded),
  });

  it('a new course: created whole when the database never had it', () => {
    expect(decideNewCourse('c', paths, state([]))).toEqual({ action: 'create', paths });
  });

  it('a new course: left alone when it is there, or when an admin deleted it', () => {
    expect(decideNewCourse('c', paths, state(['courses/c']))).toMatchObject({
      action: 'skip',
      reason: 'already in the database',
      warning: false,
    });
    expect(decideNewCourse('c', paths, state(['courses/c'], paths))).toMatchObject({
      reason: 'created by this release',
    });
    expect(decideNewCourse('c', paths, state([], paths))).toMatchObject({
      action: 'skip',
      reason: 'created by this release and deleted since: not created again',
      warning: false,
    });
  });

  it('a new course: a stopped run is finished, a foreign document stops it', () => {
    expect(
      decideNewCourse('c', paths, state(['courses/c/modules/m1'], ['courses/c/modules/m1'])),
    ).toEqual({ action: 'create', paths: ['courses/c/lessons/l1', 'courses/c'] });
    expect(decideNewCourse('c', paths, state(['courses/c/lessons/l1']))).toMatchObject({
      action: 'skip',
      warning: true,
    });
  });

  it('a new module: only in a course the database holds, never twice, never after a delete', () => {
    const modulePathList = ['courses/c/modules/m2', 'courses/c/lessons/l3'];
    const decideModule = (existing: string[], recorded: string[] = [], courseExists = true) =>
      decideNewModule('c', 'm2', modulePathList, { ...state(existing, recorded), courseExists });
    expect(decideModule([])).toEqual({ action: 'create', paths: modulePathList });
    expect(decideModule([], [], false)).toMatchObject({
      reason: 'courses/c is not in the database',
      warning: true,
    });
    expect(decideModule(['courses/c/modules/m2'])).toMatchObject({
      reason: 'already in the database',
    });
    expect(decideModule(['courses/c/modules/m2'], modulePathList)).toMatchObject({
      reason: 'created by this release',
    });
    expect(decideModule([], modulePathList)).toMatchObject({
      reason: 'created by this release and deleted since: not created again',
      warning: false,
    });
    expect(decideModule(['courses/c/lessons/l3'])).toMatchObject({ action: 'skip', warning: true });
  });

  it('course details: replaced only while the database holds the ones the release replaces', () => {
    const decide = (live: string | null, recorded = false, later: string[] = []) =>
      decideCourseDetails({ live, before: 'old', seed: 'new', later, recorded });
    expect(decide('old')).toEqual({ action: 'update' });
    expect(decide('new')).toMatchObject({ reason: 'already up to date', warning: false });
    expect(decide('edited')).toMatchObject({ action: 'skip', warning: true });
    expect(decide('edited', true)).toMatchObject({ action: 'skip', warning: false });
    expect(decide('next', false, ['next'])).toMatchObject({
      reason: 'a later release replaces them',
      warning: false,
    });
    expect(decide(null)).toMatchObject({ action: 'skip', warning: true });
  });

  it('course details: the seed fingerprint is 16 hex digits and what the seed stores', () => {
    for (const course of SEED_COURSES) {
      const details = seedCourseDetails(course);
      expect(fingerprintCourseDetails(details)).toMatch(FINGERPRINT);
      const stored = courseWrites(course, 'system').find(
        (write) => write.ref.path === `courses/${course.id}`,
      )!;
      const fields = typeof stored.fields === 'function' ? stored.fields(null) : stored.fields;
      expect(fingerprintCourseDetails(fields as typeof details)).toBe(
        fingerprintCourseDetails(details),
      );
    }
  });
});

describe('placeModule', () => {
  const file = ['m1', 'm2', 'm3', 'm4'];
  const stored = (...ids: string[]) => ids.map((id, order) => ({ id, order }));

  it('goes after the module that precedes it in the file', () => {
    expect(placeModule(file, 'm3', stored('m1', 'm2', 'm4'))).toEqual({
      order: 2,
      after: 'm2',
      moves: [{ id: 'm4', order: 3 }],
    });
  });

  it('goes after the nearest earlier module the database holds', () => {
    expect(placeModule(file, 'm3', stored('m1', 'm4'))).toEqual({
      order: 1,
      after: 'm1',
      moves: [{ id: 'm4', order: 2 }],
    });
  });

  it('comes first when no earlier module is there, and last after the last one', () => {
    expect(placeModule(file, 'm1', stored('m2', 'm3'))).toEqual({
      order: 0,
      after: null,
      moves: [
        { id: 'm2', order: 1 },
        { id: 'm3', order: 2 },
      ],
    });
    expect(placeModule(file, 'm4', stored('m1', 'm2', 'm3'))).toEqual({
      order: 3,
      after: 'm3',
      moves: [],
    });
  });

  it('keeps the modules an admin added or moved where they are, around the new one', () => {
    // An admin's module "x" sits between m1 and m2, and m2 was moved before m1.
    const current = [
      { id: 'm2', order: 0 },
      { id: 'm1', order: 1 },
      { id: 'x', order: 2 },
    ];
    expect(placeModule(file, 'm3', current)).toEqual({
      order: 1,
      after: 'm2',
      moves: [
        { id: 'm1', order: 2 },
        { id: 'x', order: 3 },
      ],
    });
  });

  it('numbers gaps 0..n-1 again, as reorderModules does, writing only what changes', () => {
    const gaps = [
      { id: 'm1', order: 0 },
      { id: 'm2', order: 5 },
    ];
    expect(placeModule(file, 'm4', gaps)).toEqual({
      order: 2,
      after: 'm2',
      moves: [{ id: 'm2', order: 1 }],
    });
  });
});

describe('the seed guard', () => {
  it('knows the courses were seeded from the marker the seed sets once they are written', () => {
    expect(coursesSeededIn(undefined)).toBe(false);
    expect(coursesSeededIn({})).toBe(false);
    // A first run that stopped after creating the demo school, before any course was written.
    expect(coursesSeededIn({ schoolId: 'school-1', updatedAt: 'now' })).toBe(false);
    expect(coursesSeededIn({ schoolId: 'school-1', challenges: {} })).toBe(false);
    expect(coursesSeededIn({ schoolId: 'school-1', coursesSeededAt: 'now' })).toBe(true);
    // Seeded before the marker existed: the challenges are only ever written after the courses.
    expect(coursesSeededIn({ schoolId: 'school-1', challenges: { weekly: 'abc' } })).toBe(true);
  });

  it('refuses to write the courses of a real project seeded before, unless told to', () => {
    expect(courseOverwriteRefusal('project', true, false)).toContain('npm run content:release');
    expect(courseOverwriteRefusal('project', true, false)).toContain(
      '--overwrite-official-courses',
    );
    expect(courseOverwriteRefusal('project', true, true)).toBeNull();
    expect(courseOverwriteRefusal('project', false, false)).toBeNull();
    expect(courseOverwriteRefusal('emulator', true, false)).toBeNull();
  });
});
