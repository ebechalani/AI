import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setCourseStatus } from '@/lib/data/courses';
import { ValidationError } from '@/lib/errors';
import { getPublishProblems, type PublishOutline } from '@/lib/learning/publish-readiness';
import { course, session } from './services-fixtures';

// The publish rule of WS-F-2 (ARCHITECTURE.md 10.1): the pure getPublishProblems, then the
// guard that data/courses.setCourseStatus runs with it inside its transaction, over an
// in-memory Firestore that knows direct gets, whole-collection reads and a transaction that
// records its reads and applies its updates on commit.

const fake = vi.hoisted(() => {
  type Data = Record<string, unknown>;
  const store = new Map<string, Data>();
  const log: { op: 'get' | 'update'; path: string; data?: Data }[] = [];

  function snapshot(path: string, data: Data | undefined) {
    return {
      id: path.slice(path.lastIndexOf('/') + 1),
      ref: { path },
      exists: data !== undefined,
      data: () => data,
      get: (field: string) => data?.[field],
    };
  }

  function doc(path: string) {
    return {
      id: path.slice(path.lastIndexOf('/') + 1),
      path,
      get: async () => snapshot(path, store.get(path)),
    };
  }

  function collection(path: string) {
    return {
      path,
      doc: (id: string) => doc(`${path}/${id}`),
      get: async () => {
        const prefix = `${path}/`;
        const docs = [...store]
          .filter(([key]) => key.startsWith(prefix) && !key.slice(prefix.length).includes('/'))
          .map(([key, data]) => snapshot(key, data));
        return { docs, empty: docs.length === 0, size: docs.length };
      },
    };
  }

  type Readable = { path: string; get: () => Promise<unknown> };
  const db = {
    collection,
    runTransaction: async (run: (tx: unknown) => Promise<unknown>) => {
      const updates: { path: string; data: Data }[] = [];
      const tx = {
        get: async (target: Readable) => {
          if (updates.length > 0) throw new Error('Firestore transactions read before they write.');
          log.push({ op: 'get', path: target.path });
          return target.get();
        },
        update: (target: { path: string }, data: Data) => {
          log.push({ op: 'update', path: target.path, data });
          updates.push({ path: target.path, data });
        },
      };
      const result = await run(tx);
      for (const { path, data } of updates) {
        const defined = Object.entries(data).filter(([, value]) => value !== undefined);
        // Sentinels (serverTimestamp, increment) are kept as they are; the tests read `status`.
        store.set(path, { ...store.get(path), ...Object.fromEntries(defined) });
      }
      return result;
    },
  };

  return { store, log, db };
});

vi.mock('@/lib/firebase/admin', () => ({ getAdminDb: () => fake.db }));

/** Stores a domain object as its document: `id` is the path's last segment, not a field. */
function put<T extends { id: string }>(path: string, document: T): void {
  const { id, ...data } = document as { id: string } & Record<string, unknown>;
  void id;
  fake.store.set(path, data);
}

const COURSE_ID = 'course-1';
const author = session('teacher', 'teacher-1', 'school-1');
const platformAdmin = session('platform_admin', 'admin-0');

function putCourse(fields: Parameters<typeof course>[0]): void {
  put(`courses/${fields.id}`, course(fields));
}

function putModule(id: string, order: number): void {
  put(`courses/${COURSE_ID}/modules/${id}`, { id, order, lessonCount: 0 });
}

function putLesson(id: string, moduleId: string, order: number, blockCount: number): void {
  put(`courses/${COURSE_ID}/lessons/${id}`, { id, moduleId, order, blockCount });
}

function draftOfAuthor(fields: Partial<Parameters<typeof course>[0]> = {}): void {
  putCourse({
    id: COURSE_ID,
    isOfficial: false,
    ownerUid: author.uid,
    schoolId: 'school-1',
    pathwayId: null,
    visibility: 'school',
    status: 'draft',
    publishedAt: null,
    ...fields,
  });
}

async function refusal(promise: Promise<unknown>): Promise<ValidationError> {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(ValidationError);
  return error as ValidationError;
}

const statusOf = (): unknown => fake.store.get(`courses/${COURSE_ID}`)?.status;
const updates = () => fake.log.filter((entry) => entry.op === 'update');

describe('getPublishProblems', () => {
  const moduleOf = (id: string, order: number) => ({ id, order });
  const lessonOf = (id: string, moduleId: string, order: number, blockCount: number) => ({
    id,
    moduleId,
    order,
    blockCount,
  });

  it('answers no_modules alone for a course without modules, whatever its lessons', () => {
    expect(getPublishProblems({ modules: [], lessons: [] })).toEqual([{ kind: 'no_modules' }]);
    expect(getPublishProblems({ modules: [], lessons: [lessonOf('l1', 'gone', 0, 0)] })).toEqual([
      { kind: 'no_modules' },
    ]);
  });

  it('names a module without lessons', () => {
    expect(
      getPublishProblems({
        modules: [moduleOf('m1', 0), moduleOf('m2', 1)],
        lessons: [lessonOf('l1', 'm1', 0, 3)],
      }),
    ).toEqual([{ kind: 'empty_module', moduleId: 'm2' }]);
  });

  it('names each lesson without blocks', () => {
    expect(
      getPublishProblems({
        modules: [moduleOf('m1', 0)],
        lessons: [
          lessonOf('l1', 'm1', 0, 2),
          lessonOf('l2', 'm1', 1, 0),
          lessonOf('l3', 'm1', 2, 0),
        ],
      }),
    ).toEqual([
      { kind: 'empty_lesson', lessonId: 'l2' },
      { kind: 'empty_lesson', lessonId: 'l3' },
    ]);
  });

  it('answers [] for a course whose every module has lessons and every lesson blocks', () => {
    expect(
      getPublishProblems({
        modules: [moduleOf('m1', 0), moduleOf('m2', 1)],
        lessons: [
          lessonOf('l1', 'm1', 0, 1),
          lessonOf('l2', 'm2', 0, 4),
          lessonOf('l3', 'm2', 1, 2),
        ],
      }),
    ).toEqual([]);
  });

  it('lists the problems module by module, then lesson by lesson, in outline order', () => {
    const outline: PublishOutline = {
      // Given out of order: the outline order is `order`, not the order of the arrays.
      modules: [moduleOf('m3', 2), moduleOf('m1', 0), moduleOf('m2', 1)],
      lessons: [
        lessonOf('l3-b', 'm3', 1, 0),
        lessonOf('l1-b', 'm1', 1, 0),
        lessonOf('l3-a', 'm3', 0, 0),
        lessonOf('l1-a', 'm1', 0, 0),
        lessonOf('l1-c', 'm1', 2, 5),
      ],
    };
    const before = JSON.stringify(outline);
    expect(getPublishProblems(outline)).toEqual([
      { kind: 'empty_lesson', lessonId: 'l1-a' },
      { kind: 'empty_lesson', lessonId: 'l1-b' },
      { kind: 'empty_module', moduleId: 'm2' },
      { kind: 'empty_lesson', lessonId: 'l3-a' },
      { kind: 'empty_lesson', lessonId: 'l3-b' },
    ]);
    expect(JSON.stringify(outline)).toBe(before);
  });

  it('does not look at a lesson whose module is not in the outline', () => {
    expect(
      getPublishProblems({
        modules: [moduleOf('m1', 0)],
        lessons: [lessonOf('l1', 'm1', 0, 1), lessonOf('stray', 'gone', 0, 0)],
      }),
    ).toEqual([]);
  });
});

describe('setCourseStatus: the publish guard', () => {
  beforeEach(() => {
    fake.store.clear();
    fake.log.length = 0;
  });

  it('refuses to publish a course without modules, before any write', async () => {
    draftOfAuthor();
    const error = await refusal(setCourseStatus(author, COURSE_ID, 'published'));
    expect(error.fieldErrors).toEqual({ status: ['content_required'] });
    expect(statusOf()).toBe('draft');
    expect(updates()).toEqual([]);
    expect(fake.log.map((entry) => entry.path)).toEqual([
      `courses/${COURSE_ID}`,
      `courses/${COURSE_ID}/modules`,
      `courses/${COURSE_ID}/lessons`,
    ]);
  });

  it('refuses a course with an empty module or a lesson without blocks', async () => {
    draftOfAuthor();
    putModule('m1', 0);
    putModule('m2', 1);
    putLesson('l1', 'm1', 0, 2);
    await refusal(setCourseStatus(author, COURSE_ID, 'published'));

    putLesson('l2', 'm2', 0, 0);
    const error = await refusal(setCourseStatus(platformAdmin, COURSE_ID, 'published'));
    expect(error.fieldErrors).toEqual({ status: ['content_required'] });
    expect(statusOf()).toBe('draft');
    expect(updates()).toEqual([]);
  });

  it('publishes a complete course and counts it in its pathway', async () => {
    putCourse({
      id: COURSE_ID,
      ownerUid: platformAdmin.uid,
      pathwayId: 'ai-explorer',
      status: 'draft',
      publishedAt: null,
    });
    put('pathways/ai-explorer', { id: 'ai-explorer', publishedCourseCount: 2 });
    putModule('m1', 0);
    putLesson('l1', 'm1', 0, 3);

    const published = await setCourseStatus(platformAdmin, COURSE_ID, 'published');
    expect(published.status).toBe('published');
    expect(updates().map((entry) => entry.path)).toEqual([
      `courses/${COURSE_ID}`,
      'pathways/ai-explorer',
    ]);
    expect(updates()[0]?.data).toMatchObject({ status: 'published' });
  });

  it('keeps re-publishing a published course a no-op, even one that lost its content', async () => {
    draftOfAuthor({ status: 'published' });
    const course = await setCourseStatus(author, COURSE_ID, 'published');
    expect(course.status).toBe('published');
    expect(updates()).toEqual([]);
    expect(fake.log.map((entry) => entry.path)).toEqual([`courses/${COURSE_ID}`]);
  });

  it('asks nothing of the content for a move to draft or archived', async () => {
    draftOfAuthor({ status: 'published' });
    await setCourseStatus(author, COURSE_ID, 'archived');
    expect(statusOf()).toBe('archived');
    await setCourseStatus(author, COURSE_ID, 'draft');
    expect(statusOf()).toBe('draft');
    expect(fake.log.some((entry) => entry.path.endsWith('/modules'))).toBe(false);
  });
});
