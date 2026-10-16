import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addStudentsAction,
  archiveClassAction,
  assignCourseAction,
  awardBadgeAction,
  createClassAction,
  joinClassAction,
  regenerateJoinCodeAction,
  removeStudentAction,
  resetStudentPasswordAction,
  unassignCourseAction,
  updateClassAction,
} from '@/actions/classes';
import { assertSessionNotRevoked, getSession } from '@/lib/actions/session-source';
import { archiveClass, regenerateJoinCode, updateClass } from '@/lib/data/classes';
import {
  ConflictError,
  ForbiddenError,
  LicenseRequiredError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from '@/lib/errors';
import {
  assignCourseToClass,
  createClass,
  joinClassWithCode,
  removeStudentFromClass,
  unassignCourseFromClass,
} from '@/lib/services/classroom';
import { provisionStudents, resetStudentPassword } from '@/lib/services/provisioning';
import { awardManualBadge } from '@/lib/services/recognition';
import type { ActionResult, Role } from '@/types';
import { schoolClass, session as sessionOf } from './services-fixtures';

// The class actions of WS-E (ARCHITECTURE.md 10.4): the roles they let through, what they hand
// to the services, the shapes they answer, and that the services' codes reach the client.

vi.mock('next-intl/server', () => ({ getLocale: vi.fn(() => Promise.resolve('en')) }));
vi.mock('@/lib/actions/session-source', () => ({
  getSession: vi.fn(),
  assertSessionNotRevoked: vi.fn(),
}));
vi.mock('@/lib/services/classroom', () => ({
  createClass: vi.fn(),
  removeStudentFromClass: vi.fn(),
  assignCourseToClass: vi.fn(),
  unassignCourseFromClass: vi.fn(),
  joinClassWithCode: vi.fn(),
}));
vi.mock('@/lib/services/provisioning', () => ({
  provisionStudents: vi.fn(),
  resetStudentPassword: vi.fn(),
}));
vi.mock('@/lib/data/classes', () => ({
  updateClass: vi.fn(),
  archiveClass: vi.fn(),
  regenerateJoinCode: vi.fn(),
}));
vi.mock('@/lib/services/recognition', () => ({ awardManualBadge: vi.fn() }));

const teacher = sessionOf('teacher', 'teacher-1', 'school-a', ['c1']);

const serviceMocks = [
  createClass,
  removeStudentFromClass,
  assignCourseToClass,
  unassignCourseFromClass,
  joinClassWithCode,
  provisionStudents,
  resetStudentPassword,
  updateClass,
  archiveClass,
  regenerateJoinCode,
  awardManualBadge,
];

function signIn(role: Role | null): void {
  vi.mocked(getSession).mockResolvedValue(role === null ? null : sessionOf(role, `${role}-1`));
}

function failure(result: ActionResult<unknown>) {
  if (result.ok) throw new Error('Expected a failure.');
  return result.error;
}

beforeEach(() => {
  for (const mock of serviceMocks) vi.mocked(mock).mockReset();
  vi.mocked(getSession).mockReset().mockResolvedValue(teacher);
  vi.mocked(assertSessionNotRevoked).mockReset().mockResolvedValue(undefined);
  vi.mocked(createClass).mockResolvedValue(schoolClass({ id: 'new-class' }));
  vi.mocked(updateClass).mockResolvedValue(schoolClass({ id: 'c1' }));
  vi.mocked(archiveClass).mockResolvedValue(undefined);
  vi.mocked(regenerateJoinCode).mockResolvedValue('NEWCODE2');
  vi.mocked(provisionStudents).mockResolvedValue([
    { uid: 'u-1', displayName: 'Lea D.', username: 'lea.d', password: 'abcd-efgh-jkmn' },
  ]);
  vi.mocked(removeStudentFromClass).mockResolvedValue(undefined);
  vi.mocked(resetStudentPassword).mockResolvedValue({ username: 'lea.d', password: 'pqrs-tuvw' });
  vi.mocked(assignCourseToClass).mockResolvedValue(undefined);
  vi.mocked(unassignCourseFromClass).mockResolvedValue(undefined);
  vi.mocked(joinClassWithCode).mockResolvedValue(schoolClass({ id: 'c9', name: 'Grade 6 A' }));
  vi.mocked(awardManualBadge).mockResolvedValue({ awarded: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const T = 'teacher';
const A = 'school_admin';
const P = 'platform_admin';
const S = 'student';

const ACTIONS = [
  ['createClassAction', () => createClassAction({ name: 'Grade 7 B', gradeLabel: null, ageBand: '11-12' }), createClass, [T, A]],
  ['updateClassAction', () => updateClassAction({ classId: 'c1', name: 'Grade 7 C' }), updateClass, [T, A, P]],
  ['archiveClassAction', () => archiveClassAction({ classId: 'c1' }), archiveClass, [T, A, P]],
  ['regenerateJoinCodeAction', () => regenerateJoinCodeAction({ classId: 'c1' }), regenerateJoinCode, [T, A, P]],
  ['addStudentsAction', () => addStudentsAction({ classId: 'c1', students: [{ displayName: 'Lea D.' }] }), provisionStudents, [T, A, P]],
  ['removeStudentAction', () => removeStudentAction({ classId: 'c1', studentUid: 'stu-1' }), removeStudentFromClass, [T, A, P]],
  ['resetStudentPasswordAction', () => resetStudentPasswordAction({ studentUid: 'stu-1' }), resetStudentPassword, [T, A, P]],
  ['assignCourseAction', () => assignCourseAction({ classId: 'c1', courseId: 'course-1', dueAt: null }), assignCourseToClass, [T, A, P]],
  ['unassignCourseAction', () => unassignCourseAction({ classId: 'c1', courseId: 'course-1' }), unassignCourseFromClass, [T, A, P]],
  ['joinClassAction', () => joinClassAction({ joinCode: 'RBHDEM23' }), joinClassWithCode, [S]],
  ['awardBadgeAction', () => awardBadgeAction({ studentUid: 'stu-1', badgeId: 'responsible-ai-champion', note: null }), awardManualBadge, [T, P]],
] as const satisfies readonly (readonly [string, () => Promise<ActionResult<unknown>>, unknown, readonly Role[]])[];

const ROLES: Role[] = [S, T, A, P];

describe.each(ACTIONS)('%s roles (ARCHITECTURE.md 10.4)', (_name, call, service, allowed) => {
  it.each(ROLES)('%s', async (role) => {
    signIn(role);
    const result = await call();
    if ((allowed as readonly Role[]).includes(role)) {
      expect(result.ok).toBe(true);
      expect(service).toHaveBeenCalledTimes(1);
    } else {
      expect(result).toEqual({ ok: false, error: { code: 'forbidden' } });
      for (const mock of serviceMocks) expect(mock).not.toHaveBeenCalled();
    }
  });

  it('answers unauthenticated without a session', async () => {
    signIn(null);
    expect(await call()).toEqual({ ok: false, error: { code: 'unauthenticated' } });
    for (const mock of serviceMocks) expect(mock).not.toHaveBeenCalled();
  });
});

describe('createClassAction', () => {
  it('hands the trimmed class to the service and answers its id', async () => {
    const result = await createClassAction({
      name: '  Grade 7 B ',
      gradeLabel: null,
      ageBand: '11-12',
    });
    expect(result).toEqual({ ok: true, data: { classId: 'new-class' } });
    expect(createClass).toHaveBeenCalledWith(teacher, {
      name: 'Grade 7 B',
      gradeLabel: null,
      ageBand: '11-12',
    });
  });

  it('passes the service’s validation and conflict through', async () => {
    vi.mocked(createClass).mockRejectedValueOnce(
      new ValidationError('x', { ownerUid: ['required'] }),
    );
    expect(
      failure(await createClassAction({ name: 'A', gradeLabel: null, ageBand: '11-12' })),
    ).toEqual({ code: 'validation', fieldErrors: { ownerUid: ['required'] } });

    vi.mocked(createClass).mockRejectedValueOnce(new ConflictError('30 classes'));
    expect(
      failure(await createClassAction({ name: 'A', gradeLabel: null, ageBand: '11-12' })).code,
    ).toBe('conflict');
  });
});

describe('updateClassAction', () => {
  it('sends only the keys it was given', async () => {
    expect(await updateClassAction({ classId: 'c1', joinCodeEnabled: true })).toEqual({
      ok: true,
      data: null,
    });
    expect(updateClass).toHaveBeenCalledWith(teacher, 'c1', { joinCodeEnabled: true });
    expect(Object.keys(vi.mocked(updateClass).mock.calls[0]![2])).toEqual(['joinCodeEnabled']);
  });

  it('refuses a malformed class id before any read', async () => {
    expect(failure(await updateClassAction({ classId: 'a/b' })).code).toBe('validation');
    expect(updateClass).not.toHaveBeenCalled();
  });

  it('passes conflict (archived) and not_found through', async () => {
    vi.mocked(updateClass).mockRejectedValueOnce(new ConflictError('archived'));
    expect(failure(await updateClassAction({ classId: 'c1', name: 'B' })).code).toBe('conflict');
    vi.mocked(updateClass).mockRejectedValueOnce(new NotFoundError('gone'));
    expect(failure(await updateClassAction({ classId: 'c1', name: 'B' })).code).toBe('not_found');
  });
});

describe('archiveClassAction and regenerateJoinCodeAction', () => {
  it('archives the class', async () => {
    expect(await archiveClassAction({ classId: 'c1' })).toEqual({ ok: true, data: null });
    expect(archiveClass).toHaveBeenCalledWith(teacher, 'c1');
  });

  it('answers the new code', async () => {
    expect(await regenerateJoinCodeAction({ classId: 'c1' })).toEqual({
      ok: true,
      data: { joinCode: 'NEWCODE2' },
    });
    expect(regenerateJoinCode).toHaveBeenCalledWith(teacher, 'c1');
  });
});

describe('addStudentsAction', () => {
  it('provisions the students and answers the credentials without the uid', async () => {
    const result = await addStudentsAction({
      classId: 'c1',
      students: [{ displayName: 'Lea D.', ageBand: '13-15' }],
    });
    expect(provisionStudents).toHaveBeenCalledWith(teacher, 'c1', [
      { displayName: 'Lea D.', ageBand: '13-15' },
    ]);
    expect(result).toEqual({
      ok: true,
      data: {
        credentials: [{ displayName: 'Lea D.', username: 'lea.d', password: 'abcd-efgh-jkmn' }],
      },
    });
  });

  it('refuses an empty list, more than 60 students and a short name before any call', async () => {
    expect(failure(await addStudentsAction({ classId: 'c1', students: [] }))).toEqual({
      code: 'validation',
      fieldErrors: { students: ['required'] },
    });
    const many = Array.from({ length: 61 }, (_, index) => ({ displayName: `Pupil ${index}` }));
    expect(failure(await addStudentsAction({ classId: 'c1', students: many }))).toEqual({
      code: 'validation',
      fieldErrors: { students: ['too_many'] },
    });
    expect(
      failure(await addStudentsAction({ classId: 'c1', students: [{ displayName: 'L' }] })),
    ).toEqual({
      code: 'validation',
      fieldErrors: { 'students.0.displayName': ['display_name_length'] },
    });
    expect(provisionStudents).not.toHaveBeenCalled();
  });

  it('passes forbidden (account policy), conflict and a partial batch (internal) through', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const input = { classId: 'c1', students: [{ displayName: 'Lea D.' }] };
    vi.mocked(provisionStudents).mockRejectedValueOnce(new ForbiddenError('policy'));
    expect(failure(await addStudentsAction(input)).code).toBe('forbidden');
    vi.mocked(provisionStudents).mockRejectedValueOnce(new ConflictError('full'));
    expect(failure(await addStudentsAction(input)).code).toBe('conflict');
    vi.mocked(provisionStudents).mockRejectedValueOnce(new Error('auth emulator down'));
    expect(failure(await addStudentsAction(input))).toEqual({ code: 'internal' });
  });
});

describe('removeStudentAction', () => {
  it('removes the student from the class', async () => {
    expect(await removeStudentAction({ classId: 'c1', studentUid: 'stu-1' })).toEqual({
      ok: true,
      data: null,
    });
    expect(removeStudentFromClass).toHaveBeenCalledWith(teacher, 'c1', 'stu-1');
  });

  it('passes not_found through', async () => {
    vi.mocked(removeStudentFromClass).mockRejectedValueOnce(new NotFoundError('left'));
    expect(failure(await removeStudentAction({ classId: 'c1', studentUid: 'stu-1' })).code).toBe(
      'not_found',
    );
  });
});

describe('resetStudentPasswordAction', () => {
  it('answers the username and the new password', async () => {
    expect(await resetStudentPasswordAction({ studentUid: 'stu-1' })).toEqual({
      ok: true,
      data: { username: 'lea.d', password: 'pqrs-tuvw' },
    });
    expect(resetStudentPassword).toHaveBeenCalledWith(teacher, 'stu-1');
  });

  it('passes forbidden through (an email account)', async () => {
    vi.mocked(resetStudentPassword).mockRejectedValueOnce(new ForbiddenError('email'));
    expect(failure(await resetStudentPasswordAction({ studentUid: 'stu-1' })).code).toBe(
      'forbidden',
    );
  });
});

describe('assignCourseAction', () => {
  it.each([null, '2026-10-30T12:00:00.000Z'])('hands due date %s to the service', async (dueAt) => {
    expect(
      await assignCourseAction({ classId: 'c1', courseId: 'my-first-ai-adventure', dueAt }),
    ).toEqual({ ok: true, data: null });
    expect(assignCourseToClass).toHaveBeenCalledWith(
      teacher,
      'c1',
      'my-first-ai-adventure',
      dueAt,
    );
  });

  it('refuses a bare calendar date', async () => {
    expect(
      failure(
        await assignCourseAction({ classId: 'c1', courseId: 'course-1', dueAt: '2026-10-30' }),
      ),
    ).toEqual({ code: 'validation', fieldErrors: { dueAt: ['invalid_date'] } });
    expect(assignCourseToClass).not.toHaveBeenCalled();
  });

  it('passes license_required and conflict through', async () => {
    const input = { classId: 'c1', courseId: 'course-1', dueAt: null };
    vi.mocked(assignCourseToClass).mockRejectedValueOnce(new LicenseRequiredError('premium'));
    expect(failure(await assignCourseAction(input)).code).toBe('license_required');
    vi.mocked(assignCourseToClass).mockRejectedValueOnce(new ConflictError('teacher course'));
    expect(failure(await assignCourseAction(input)).code).toBe('conflict');
  });
});

describe('unassignCourseAction', () => {
  it('unassigns the course', async () => {
    expect(await unassignCourseAction({ classId: 'c1', courseId: 'course-1' })).toEqual({
      ok: true,
      data: null,
    });
    expect(unassignCourseFromClass).toHaveBeenCalledWith(teacher, 'c1', 'course-1');
  });
});

describe('joinClassAction', () => {
  beforeEach(() => signIn('student'));

  it('normalises the code and answers the class id and name', async () => {
    expect(await joinClassAction({ joinCode: 'rbhd-em23' })).toEqual({
      ok: true,
      data: { classId: 'c9', className: 'Grade 6 A' },
    });
    expect(joinClassWithCode).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'student' }),
      'RBHDEM23',
    );
  });

  it('refuses a malformed code before the service', async () => {
    expect(failure(await joinClassAction({ joinCode: 'abc' }))).toEqual({
      code: 'validation',
      fieldErrors: { joinCode: ['join_code_invalid'] },
    });
    expect(joinClassWithCode).not.toHaveBeenCalled();
  });

  it('passes the rate limit, not_found and conflict through', async () => {
    vi.mocked(joinClassWithCode).mockRejectedValueOnce(new RateLimitError(120));
    expect(failure(await joinClassAction({ joinCode: 'RBHDEM23' }))).toEqual({
      code: 'rate_limited',
      retryAfterSeconds: 120,
    });
    vi.mocked(joinClassWithCode).mockRejectedValueOnce(new NotFoundError('closed'));
    expect(failure(await joinClassAction({ joinCode: 'RBHDEM23' })).code).toBe('not_found');
    vi.mocked(joinClassWithCode).mockRejectedValueOnce(new ConflictError('full'));
    expect(failure(await joinClassAction({ joinCode: 'RBHDEM23' })).code).toBe('conflict');
  });
});

describe('awardBadgeAction', () => {
  it('awards the badge and answers whether it was new', async () => {
    const input = { studentUid: 'stu-1', badgeId: 'responsible-ai-champion', note: null };
    expect(await awardBadgeAction(input)).toEqual({ ok: true, data: { awarded: true } });
    expect(awardManualBadge).toHaveBeenCalledWith(teacher, input);
  });

  it('refuses a note over 300 characters', async () => {
    expect(
      failure(
        await awardBadgeAction({
          studentUid: 'stu-1',
          badgeId: 'responsible-ai-champion',
          note: 'x'.repeat(301),
        }),
      ),
    ).toEqual({ code: 'validation', fieldErrors: { note: ['too_long'] } });
    expect(awardManualBadge).not.toHaveBeenCalled();
  });
});
