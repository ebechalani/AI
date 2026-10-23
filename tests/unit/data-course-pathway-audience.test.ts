import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCourse, updateCourse } from '@/lib/data/courses';
import { ValidationError } from '@/lib/errors';
import type { Audience, CourseInput } from '@/types';
import { course, session } from './services-fixtures';

// createCourse and updateCourse over an in-memory Firestore that knows the shapes they use:
// documents by id, an auto id, a whole collection, and a transaction. What is under test is
// the editor's rule (pathwayFitsAudience) on the server: a pathway lists its courses without
// filtering them by audience, so a course joins only a pathway of its own audience.

const fake = vi.hoisted(() => {
  type Data = Record<string, unknown>;
  const store = new Map<string, Data>();
  let nextId = 0;

  function snapshot(path: string, data: Data | undefined) {
    return {
      id: path.slice(path.lastIndexOf('/') + 1),
      ref: { path },
      exists: data !== undefined,
      data: () => data,
      get: (field: string) => data?.[field],
    };
  }

  function update(path: string, fields: Data): void {
    const data = store.get(path);
    if (data === undefined) throw new Error(`${path} does not exist.`);
    const defined = Object.entries(fields).filter(([, value]) => value !== undefined);
    store.set(path, { ...data, ...Object.fromEntries(defined) });
  }

  function doc(collectionPath: string, id = `new-${++nextId}`) {
    const path = `${collectionPath}/${id}`;
    return {
      id,
      path,
      get: async () => snapshot(path, store.get(path)),
      create: async (data: Data) => {
        if (store.has(path)) throw new Error(`${path} already exists.`);
        store.set(path, data);
      },
    };
  }

  function collection(collectionPath: string) {
    return {
      doc: (id?: string) => doc(collectionPath, id),
      get: async () => {
        const prefix = `${collectionPath}/`;
        const docs = [...store]
          .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
          .map(([path, data]) => snapshot(path, data));
        return { docs, empty: docs.length === 0, size: docs.length };
      },
    };
  }

  type Readable = { get: () => Promise<unknown> };
  async function runTransaction<T>(
    body: (tx: {
      get(ref: Readable): Promise<unknown>;
      update(ref: { path: string }, fields: Data): void;
    }) => Promise<T>,
  ): Promise<T> {
    const writes: [string, Data][] = [];
    const result = await body({
      get: (ref) => ref.get(),
      update: (ref, fields) => void writes.push([ref.path, fields]),
    });
    for (const [path, fields] of writes) update(path, fields);
    return result;
  }

  return {
    store,
    reset: () => {
      store.clear();
      nextId = 0;
    },
    db: { collection, runTransaction },
  };
});

vi.mock('@/lib/firebase/admin', () => ({ getAdminDb: () => fake.db }));

/** Stores a domain object as its document: `id` is the path's last segment, not a field. */
function put(path: string, document: { id: string }): void {
  const { id, ...data } = document as { id: string } & Record<string, unknown>;
  void id;
  fake.store.set(path, data);
}

function pathway(id: string, audience: Audience): void {
  fake.store.set(`pathways/${id}`, { audience, status: 'published', publishedCourseCount: 0 });
}

const admin = session('platform_admin', 'admin-0');
const teacher = session('teacher', 'teacher-1', 'school-1');

const input: CourseInput = {
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

// The code of a pathway that does not exist, so the editor shows the same message.
const refusal = (field: string) => ({ fieldErrors: { [field]: ['invalid'] } });

beforeEach(() => {
  fake.reset();
  pathway('ai-explorer', 'student');
  pathway('robot-builders', 'student');
  pathway('teacher-academy', 'teacher');
});

describe('createCourse', () => {
  it('refuses a pathway that does not serve the audience, writing nothing', async () => {
    const official = { ...input, isOfficial: true, pathwayId: 'teacher-academy' };
    const created = createCourse(admin, official);
    await expect(created).rejects.toBeInstanceOf(ValidationError);
    await expect(created).rejects.toMatchObject(refusal('pathwayId'));
    await expect(
      createCourse(admin, { ...official, audience: 'teacher', pathwayId: 'ai-explorer' }),
    ).rejects.toMatchObject(refusal('pathwayId'));
    expect([...fake.store.keys()].filter((path) => path.startsWith('courses/'))).toEqual([]);
  });

  it('accepts a pathway of the same audience', async () => {
    await expect(
      createCourse(admin, { ...input, isOfficial: true, pathwayId: 'ai-explorer' }),
    ).resolves.toMatchObject({ pathwayId: 'ai-explorer', audience: 'student' });
    await expect(
      createCourse(admin, {
        ...input,
        audience: 'teacher',
        isOfficial: true,
        pathwayId: 'teacher-academy',
      }),
    ).resolves.toMatchObject({ pathwayId: 'teacher-academy', audience: 'teacher' });
  });

  it('checks nothing without a pathway', async () => {
    fake.store.clear();
    await expect(
      createCourse(admin, { ...input, audience: 'teacher', isOfficial: true }),
    ).resolves.toMatchObject({ pathwayId: null, audience: 'teacher' });
    await expect(createCourse(teacher, { ...input, audience: 'teacher' })).resolves.toMatchObject({
      pathwayId: null,
      audience: 'teacher',
      isOfficial: false,
    });
  });
});

describe('updateCourse', () => {
  const official = course({ id: 'c-1', pathwayId: 'ai-explorer', status: 'draft' });

  it('refuses an audience the stored pathway does not serve', async () => {
    put('courses/c-1', official);
    await expect(updateCourse(admin, 'c-1', { audience: 'teacher' })).rejects.toMatchObject(
      refusal('patch.pathwayId'),
    );
    expect(fake.store.get('courses/c-1')).toMatchObject({ audience: 'student' });
  });

  it('refuses a pathway that does not serve the stored audience', async () => {
    put('courses/c-1', official);
    await expect(
      updateCourse(admin, 'c-1', { pathwayId: 'teacher-academy' }),
    ).rejects.toMatchObject(refusal('patch.pathwayId'));
    expect(fake.store.get('courses/c-1')).toMatchObject({ pathwayId: 'ai-explorer' });
  });

  it('accepts a pathway of the stored audience, and both changed together', async () => {
    put('courses/c-1', official);
    await expect(
      updateCourse(admin, 'c-1', { pathwayId: 'robot-builders' }),
    ).resolves.toMatchObject({ pathwayId: 'robot-builders', audience: 'student' });
    await expect(
      updateCourse(admin, 'c-1', { audience: 'teacher', pathwayId: 'teacher-academy' }),
    ).resolves.toMatchObject({ pathwayId: 'teacher-academy', audience: 'teacher' });
  });

  it('checks nothing once the pathway is cleared, or for a course without one', async () => {
    put('courses/c-1', official);
    await expect(
      updateCourse(admin, 'c-1', { audience: 'teacher', pathwayId: null }),
    ).resolves.toMatchObject({ pathwayId: null, audience: 'teacher' });

    fake.store.clear();
    put(
      'courses/own',
      course({
        id: 'own',
        isOfficial: false,
        pathwayId: null,
        ownerUid: 'teacher-1',
        schoolId: 'school-1',
        status: 'draft',
        visibility: 'private',
      }),
    );
    await expect(updateCourse(teacher, 'own', { audience: 'teacher' })).resolves.toMatchObject({
      pathwayId: null,
      audience: 'teacher',
    });
  });
});
