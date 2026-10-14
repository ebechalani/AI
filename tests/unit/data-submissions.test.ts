import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SYSTEM_ACTOR } from '@/lib/auth/actor';
import { getLatestSubmission } from '@/lib/data/submissions';
import { NotFoundError } from '@/lib/errors';
import { enrollment, session, submission } from './services-fixtures';

// getLatestSubmission over an in-memory Firestore that knows the two shapes it uses: a direct
// get by id and an equality query ordered and limited (3.7). What is under test is the
// no-existence-oracle rule of 4.4 for submissions: whoever may not see a submission must get
// the same answer whether or not it exists.

const fake = vi.hoisted(() => {
  type Data = Record<string, unknown>;
  interface Filter {
    field: string;
    op: string;
    value: unknown;
  }
  interface Order {
    field: string;
    direction: 'asc' | 'desc';
  }
  const store = new Map<string, Data>();

  function snapshot(path: string, data: Data | undefined) {
    return {
      id: path.slice(path.lastIndexOf('/') + 1),
      ref: { path },
      exists: data !== undefined,
      data: () => data,
      get: (field: string) => data?.[field],
    };
  }
  type Snapshot = ReturnType<typeof snapshot>;

  function compare(left: unknown, right: unknown): number {
    if (typeof left === 'number' && typeof right === 'number') return left - right;
    const [l, r] = [String(left), String(right)];
    return l < r ? -1 : l > r ? 1 : 0;
  }

  function query(
    collectionPath: string,
    filters: Filter[],
    order: Order | null,
    max: number | null,
  ) {
    return {
      where: (field: string, op: string, value: unknown) =>
        query(collectionPath, [...filters, { field, op, value }], order, max),
      orderBy: (field: string, direction: 'asc' | 'desc' = 'asc') =>
        query(collectionPath, filters, { field, direction }, max),
      limit: (count: number) => query(collectionPath, filters, order, count),
      doc: (id: string) => {
        const path = `${collectionPath}/${id}`;
        return { id, path, get: async () => snapshot(path, store.get(path)) };
      },
      get: async () => {
        let docs: Snapshot[] = [];
        for (const [path, data] of store) {
          const prefix = `${collectionPath}/`;
          if (path.startsWith(prefix) && !path.slice(prefix.length).includes('/')) {
            docs.push(snapshot(path, data));
          }
        }
        for (const filter of filters) {
          if (filter.op !== '==') {
            throw new Error(`The fake Firestore knows only '==', not '${filter.op}'.`);
          }
          docs = docs.filter((document) => document.get(filter.field) === filter.value);
        }
        if (order !== null) {
          const { field, direction } = order;
          const sign = direction === 'desc' ? -1 : 1;
          docs.sort((a, b) => sign * compare(a.get(field), b.get(field)));
        }
        if (max !== null) docs = docs.slice(0, max);
        return { docs, empty: docs.length === 0, size: docs.length };
      },
    };
  }

  return { store, db: { collection: (path: string) => query(path, [], null, null) } };
});

vi.mock('@/lib/firebase/admin', () => ({ getAdminDb: () => fake.db }));

/** Stores a domain object as its document: `id` is the path's last segment, not a field. */
function put(path: string, document: { id: string }): void {
  const { id, ...data } = document as { id: string } & Record<string, unknown>;
  void id;
  fake.store.set(path, data);
}

const owner = session('student', 'student-1', 'school-1', ['class-b']);
const classmate = session('student', 'student-2', 'school-1', ['class-b']);
const teacherOfB = session('teacher', 'teacher-b', 'school-1', ['class-b']);
const teacherOfA = session('teacher', 'teacher-a', 'school-1', ['class-a']);
const ownSchoolAdmin = session('school_admin', 'admin-1', 'school-1');
const otherSchoolAdmin = session('school_admin', 'admin-2', 'school-2');
const platformAdmin = session('platform_admin', 'admin-0');

describe('getLatestSubmission', () => {
  beforeEach(() => {
    fake.store.clear();
  });

  describe('a challenge entry (latest by query)', () => {
    const target = { challengeId: 'ch-1' };
    const entry = (attemptNumber: number) =>
      submission({
        id: `student-1_c_ch-1_${attemptNumber}`,
        context: 'challenge',
        courseId: null,
        lessonId: null,
        projectId: null,
        challengeId: 'ch-1',
        classId: 'class-b',
        schoolId: 'school-1',
        attemptNumber,
      });

    it('answers the highest attempt to everyone who may see it', async () => {
      put('submissions/student-1_c_ch-1_1', entry(1));
      put('submissions/student-1_c_ch-1_2', entry(2));
      for (const actor of [owner, teacherOfB, ownSchoolAdmin, platformAdmin, SYSTEM_ACTOR]) {
        await expect(getLatestSubmission(actor, 'student-1', target)).resolves.toMatchObject({
          id: 'student-1_c_ch-1_2',
          attemptNumber: 2,
        });
      }
    });

    it('answers null when there is no entry, to the owner and to staff', async () => {
      for (const actor of [owner, teacherOfB, teacherOfA, ownSchoolAdmin, otherSchoolAdmin]) {
        await expect(getLatestSubmission(actor, 'student-1', target)).resolves.toBeNull();
      }
    });

    it('answers staff who may not see the entry exactly as if there were none', async () => {
      put('submissions/student-1_c_ch-1_1', entry(1));
      await expect(getLatestSubmission(teacherOfA, 'student-1', target)).resolves.toBeNull();
      await expect(getLatestSubmission(otherSchoolAdmin, 'student-1', target)).resolves.toBeNull();
    });

    it('refuses another student the same way whether or not an entry exists', async () => {
      await expect(getLatestSubmission(classmate, 'student-1', target)).rejects.toBeInstanceOf(
        NotFoundError,
      );
      put('submissions/student-1_c_ch-1_1', entry(1));
      await expect(getLatestSubmission(classmate, 'student-1', target)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe('a project submission (latest through the enrollment)', () => {
    const target = { courseId: 'course-1', projectId: 'p1' };
    const latest = submission({
      id: 'student-1_p_course-1_p1_2',
      attemptNumber: 2,
      previousSubmissionId: 'student-1_p_course-1_p1_1',
      classId: 'class-b',
      schoolId: 'school-1',
    });

    function enrol(): void {
      put(
        'enrollments/student-1_course-1',
        enrollment({
          userUid: 'student-1',
          courseId: 'course-1',
          classId: 'class-b',
          schoolId: 'school-1',
          source: 'class',
          projectSummary: {
            p1: { attempts: 2, latestSubmissionId: latest.id, latestStatus: 'submitted' },
          },
        }),
      );
    }

    it('reads the attempt the summary names, for everyone who may see it', async () => {
      enrol();
      put(`submissions/${latest.id}`, latest);
      put(
        'submissions/student-1_p_course-1_p1_1',
        submission({ id: 'student-1_p_course-1_p1_1', classId: 'class-b', status: 'returned' }),
      );
      for (const actor of [owner, teacherOfB, ownSchoolAdmin, platformAdmin, SYSTEM_ACTOR]) {
        await expect(getLatestSubmission(actor, 'student-1', target)).resolves.toMatchObject({
          id: latest.id,
          attemptNumber: 2,
        });
      }
    });

    it('answers null without an enrollment or without an attempt', async () => {
      await expect(getLatestSubmission(owner, 'student-1', target)).resolves.toBeNull();
      await expect(getLatestSubmission(teacherOfB, 'student-1', target)).resolves.toBeNull();
      put(
        'enrollments/student-1_course-1',
        enrollment({ userUid: 'student-1', courseId: 'course-1', classId: 'class-b' }),
      );
      await expect(getLatestSubmission(owner, 'student-1', target)).resolves.toBeNull();
      await expect(getLatestSubmission(teacherOfB, 'student-1', target)).resolves.toBeNull();
    });

    it('answers staff who may not see the attempt exactly as if there were none', async () => {
      enrol();
      put(`submissions/${latest.id}`, latest);
      await expect(getLatestSubmission(teacherOfA, 'student-1', target)).resolves.toBeNull();
      await expect(getLatestSubmission(otherSchoolAdmin, 'student-1', target)).resolves.toBeNull();
    });

    it('refuses another student the same way whether or not an attempt exists', async () => {
      await expect(getLatestSubmission(classmate, 'student-1', target)).rejects.toBeInstanceOf(
        NotFoundError,
      );
      enrol();
      put(`submissions/${latest.id}`, latest);
      await expect(getLatestSubmission(classmate, 'student-1', target)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });
});
