import { describe, expect, it } from 'vitest';
import {
  accountCreation,
  assignedCourseRows,
  capacityLeft,
  credentialsText,
  dueDateToIso,
  enrollmentFacts,
  isOverdue,
  isoToDateInput,
  joinCodeGroups,
  joinCodeState,
  joinHint,
  joinMethod,
  parseStudentNames,
  policyContext,
  rosterEmptyVariant,
  spokenCode,
  studentLineErrors,
} from '@/components/classes/class-model';
import {
  assessmentsPath,
  assignPath,
  attemptPath,
  certificatePath,
  classPath,
  coursePath,
  coursesPath,
  editCoursePath,
  firstParam,
  invitePath,
  lessonPath,
  reportPath,
  studentPath,
  submissionPath,
  TEACHER_PATHS,
} from '@/components/teacher/paths';
import { assignCourseInputSchema } from '@/lib/schemas/class';
import { parseInput } from '@/lib/schemas/common';
import type { ClassAssignment } from '@/types';
import { course, enrollment, NOW, school, schoolClass } from './services-fixtures';

// The pure model of WS-E's class pages (class-model.ts) and the teacher URL builders (paths.ts).

describe('joinCodeState', () => {
  const open = (expiresAt: string | null, extra = {}) =>
    schoolClass({ id: 'c1', joinCodeEnabled: true, joinCodeExpiresAt: expiresAt, ...extra });

  it('is open before the expiry, with a Date or an ISO now', () => {
    const cls = open('2026-10-03T08:00:00.000Z');
    expect(joinCodeState(cls, NOW)).toEqual({ kind: 'open', expiresAt: '2026-10-03T08:00:00.000Z' });
    expect(joinCodeState(cls, new Date(NOW)).kind).toBe('open');
  });

  it('has expired at and after the expiry', () => {
    expect(joinCodeState(open(NOW), NOW)).toEqual({ kind: 'expired', expiredAt: NOW });
    expect(joinCodeState(open('2026-10-01T08:00:00.000Z'), NOW).kind).toBe('expired');
  });

  it('is off when closed (even with a future expiry), archived, or without an expiry', () => {
    const future = '2026-10-03T08:00:00.000Z';
    expect(joinCodeState(open(future, { joinCodeEnabled: false }), NOW)).toEqual({ kind: 'off' });
    expect(joinCodeState(open(future, { archived: true }), NOW)).toEqual({ kind: 'off' });
    expect(joinCodeState(open(null), NOW)).toEqual({ kind: 'off' });
  });
});

describe('the code as read and spoken', () => {
  it('splits the code in two halves', () => {
    expect(joinCodeGroups('RBHDEM23')).toEqual(['RBHD', 'EM23']);
    expect(joinCodeGroups('ABCDEFG')).toEqual(['ABCD', 'EFG']);
  });

  it('spells the code one character at a time', () => {
    expect(spokenCode('RBHDEM23')).toBe('R B H D E M 2 3');
  });
});

describe('rosterEmptyVariant', () => {
  it.each([
    [{ archived: true, creationBlocked: false, schoolJoinCodesOff: false }, 'archived'],
    [{ archived: true, creationBlocked: true, schoolJoinCodesOff: true }, 'archived'],
    [{ archived: false, creationBlocked: true, schoolJoinCodesOff: true }, 'none'],
    [{ archived: false, creationBlocked: true, schoolJoinCodesOff: false }, 'codeOnly'],
    [{ archived: false, creationBlocked: false, schoolJoinCodesOff: true }, 'addOnly'],
    [{ archived: false, creationBlocked: false, schoolJoinCodesOff: false }, 'both'],
  ] as const)('%o → %s', (input, expected) => {
    expect(rosterEmptyVariant(input)).toBe(expected);
  });
});

describe('joinMethod', () => {
  it('tells the code, the viewer and anyone else apart', () => {
    expect(joinMethod({ addedByUid: null }, 'teacher-1')).toBe('code');
    expect(joinMethod({ addedByUid: 'teacher-1' }, 'teacher-1')).toBe('you');
    expect(joinMethod({ addedByUid: 'teacher-2' }, 'teacher-1')).toBe('staff');
    expect(joinMethod({ addedByUid: 'system' }, 'teacher-1')).toBe('staff');
  });
});

describe('account creation in a class', () => {
  const viewer = { uid: 'teacher-1', verifiedEducator: true };

  it('offers every band in an active school, the class band first', () => {
    const cls = schoolClass({ id: 'c1', ageBand: '11-12' });
    const creation = accountCreation(cls, policyContext(cls, school({ id: 'school-a' }), viewer));
    expect(creation).toEqual({
      allowedBands: ['8-10', '11-12', '13-15', '16-18', 'adult'],
      defaultBand: '11-12',
      blocked: null,
    });
    expect(joinHint(creation)).toBe('anyAge');
  });

  it('blocks a suspended school and a missing school document', () => {
    const cls = schoolClass({ id: 'c1' });
    const suspended = accountCreation(
      cls,
      policyContext(cls, school({ id: 'school-a', status: 'suspended' }), viewer),
    );
    expect(suspended).toEqual({ allowedBands: [], defaultBand: null, blocked: 'school_inactive' });
    expect(joinHint(suspended)).toBe('existingOnly');
    expect(accountCreation(cls, policyContext(cls, null, viewer)).blocked).toBe('school_inactive');
  });

  it('allows a verified owner without a school 13 and over only', () => {
    const cls = schoolClass({ id: 'c1', schoolId: null, ageBand: '11-12' });
    const creation = accountCreation(cls, policyContext(cls, null, viewer));
    expect(creation).toEqual({
      allowedBands: ['13-15', '16-18', 'adult'],
      defaultBand: '13-15',
      blocked: null,
    });
    expect(joinHint(creation)).toBe('thirteenPlus');
  });

  it('blocks an unverified owner without a school, and a viewer who is not the owner', () => {
    const cls = schoolClass({ id: 'c1', schoolId: null });
    const unverified = { uid: 'teacher-1', verifiedEducator: false };
    expect(accountCreation(cls, policyContext(cls, null, unverified)).blocked).toBe(
      'educator_not_verified',
    );
    const other = { uid: 'teacher-2', verifiedEducator: true };
    expect(policyContext(cls, null, other)).toEqual({
      schoolActive: false,
      ownerVerifiedEducator: false,
    });
    expect(accountCreation(cls, policyContext(cls, null, other)).blocked).toBe(
      'educator_not_verified',
    );
  });
});

describe('capacityLeft', () => {
  it.each([
    [3, 57],
    [60, 0],
    [61, 0],
  ])('%i students → %i left', (studentCount, left) => {
    expect(capacityLeft({ studentCount })).toBe(left);
  });
});

describe('parseStudentNames', () => {
  it('keeps one trimmed name per non-empty line, duplicates included', () => {
    expect(parseStudentNames('Lea D.\r\n\n  Omar   K. \nMaya\t S.\n')).toEqual([
      'Lea D.',
      'Omar K.',
      'Maya S.',
    ]);
    expect(parseStudentNames('Sam\rSam')).toEqual(['Sam', 'Sam']);
    expect(parseStudentNames('  \n\n')).toEqual([]);
  });
});

describe('studentLineErrors', () => {
  it('maps student paths to 1-based lines and the rest to the form', () => {
    expect(
      studentLineErrors({
        'students.2.displayName': ['display_name_length'],
        students: ['too_many'],
        _form: ['invalid'],
      }),
    ).toEqual({ form: ['too_many', 'invalid'], lines: [{ line: 3, keys: ['display_name_length'] }] });
  });

  it('sorts lines, merges a line’s keys and deduplicates form keys', () => {
    expect(
      studentLineErrors({
        'students.10.displayName': ['display_name_length'],
        'students.0.ageBand': ['invalid_choice'],
        'students.0.displayName': ['display_name_length'],
        'students.4': ['invalid'],
        classId: ['invalid'],
        _form: ['invalid'],
      }),
    ).toEqual({
      form: ['invalid'],
      lines: [
        { line: 1, keys: ['invalid_choice', 'display_name_length'] },
        { line: 5, keys: ['invalid'] },
        { line: 11, keys: ['display_name_length'] },
      ],
    });
  });
});

describe('credentialsText', () => {
  it('writes a tab-separated header and rows without a trailing newline', () => {
    expect(
      credentialsText(
        [
          { displayName: 'Lea D.', username: 'lea.d', password: 'abcd-efgh' },
          { displayName: 'Omar K.', username: 'omar.k', password: 'jkmn-pqrs' },
        ],
        { name: 'Student', username: 'Username', password: 'Password' },
      ),
    ).toBe(
      'Student\tUsername\tPassword\nLea D.\tlea.d\tabcd-efgh\nOmar K.\tomar.k\tjkmn-pqrs',
    );
  });
});

describe('due dates', () => {
  it('turns a date input value into noon UTC that the schema accepts', () => {
    const dueAt = dueDateToIso('2026-10-30');
    expect(dueAt).toBe('2026-10-30T12:00:00.000Z');
    const parsed = parseInput(assignCourseInputSchema, { classId: 'c1', courseId: 'k1', dueAt });
    expect(parsed.success).toBe(true);
  });

  it('reads an empty value as no due date and anything else as invalid', () => {
    expect(dueDateToIso('')).toBeNull();
    expect(dueDateToIso('  ')).toBeNull();
    for (const value of ['2026-02-30', '30/10/2026', '2026-1-5', '2026-13-01']) {
      expect(dueDateToIso(value), value).toBeUndefined();
    }
  });

  it('shows the calendar day in the viewer’s zone', () => {
    expect(isoToDateInput(null, 'UTC')).toBe('');
    expect(isoToDateInput('not a date', 'UTC')).toBe('');
    expect(isoToDateInput('2026-10-30T22:30:00.000Z', 'UTC')).toBe('2026-10-30');
    expect(isoToDateInput('2026-10-30T22:30:00.000Z', 'Asia/Beirut')).toBe('2026-10-31');
  });

  it('keeps a noon-UTC due date on its day from UTC−11 to UTC+11', () => {
    const dueAt = dueDateToIso('2026-10-30')!;
    for (const zone of ['Pacific/Pago_Pago', 'Pacific/Honolulu', 'UTC', 'Asia/Beirut', 'Pacific/Noumea']) {
      expect(isoToDateInput(dueAt, zone), zone).toBe('2026-10-30');
    }
  });

  it('is overdue only after the due day', () => {
    const now = '2026-10-30T15:00:00.000Z';
    expect(isOverdue('2026-10-29T12:00:00.000Z', now, 'UTC')).toBe(true);
    expect(isOverdue('2026-10-30T12:00:00.000Z', now, 'UTC')).toBe(false);
    expect(isOverdue('2026-10-31T12:00:00.000Z', new Date(now), 'UTC')).toBe(false);
    expect(isOverdue(null, now, 'UTC')).toBe(false);
    expect(typeof isOverdue('2026-10-29T12:00:00.000Z', now, undefined)).toBe('boolean');
  });
});

describe('enrollmentFacts', () => {
  it('counts nothing for empty or missing maps', () => {
    const empty = {
      quizzesAttempted: 0,
      quizzesPassed: 0,
      quizAveragePercent: null,
      projectsApproved: 0,
      projectsPending: 0,
      projectsReturned: 0,
    };
    expect(enrollmentFacts({ quizSummary: {}, projectSummary: {} })).toEqual(empty);
    expect(
      enrollmentFacts({} as Parameters<typeof enrollmentFacts>[0]),
    ).toEqual(empty);
  });

  it('averages the best scores and counts the projects by latest status', () => {
    const facts = enrollmentFacts({
      quizSummary: {
        q1: { attempts: 1, passed: true, bestPercent: 100, lastPercent: 100 },
        q2: { attempts: 2, passed: false, bestPercent: 75, lastPercent: 50 },
      },
      projectSummary: {
        p1: { attempts: 1, latestSubmissionId: 's1', latestStatus: 'approved' },
        p2: { attempts: 1, latestSubmissionId: 's2', latestStatus: 'ai_reviewed' },
        p3: { attempts: 1, latestSubmissionId: 's3', latestStatus: 'submitted' },
        p4: { attempts: 2, latestSubmissionId: 's4', latestStatus: 'returned' },
      },
    });
    expect(facts).toEqual({
      quizzesAttempted: 2,
      quizzesPassed: 1,
      quizAveragePercent: 88,
      projectsApproved: 2,
      projectsPending: 1,
      projectsReturned: 1,
    });
    expect(enrollment({ userUid: 'u', courseId: 'k' }).quizSummary).toEqual({});
  });
});

describe('assignedCourseRows', () => {
  const assignment = (courseId: string, assignedAt: string): ClassAssignment => ({
    id: courseId,
    classId: 'c1',
    courseId,
    assignedByUid: 'teacher-1',
    assignedAt,
    dueAt: null,
    createdAt: assignedAt,
    updatedAt: assignedAt,
  });

  it('keeps the assignment order and marks a course it cannot read', () => {
    const rows = assignedCourseRows(
      [assignment('k1', '2026-10-01T00:00:00.000Z'), assignment('hidden', '2026-10-02T00:00:00.000Z')],
      [course({ id: 'k1' })],
    );
    expect(rows.map((row) => [row.assignment.courseId, row.course?.id ?? null])).toEqual([
      ['k1', 'k1'],
      ['hidden', null],
    ]);
  });
});

describe('teacher paths', () => {
  it('builds every URL', () => {
    expect(TEACHER_PATHS.dashboard).toBe('/teacher');
    expect(classPath('c1')).toBe('/teacher/classes/c1');
    expect(assignPath('c1')).toBe('/teacher/classes/c1/assign');
    expect(studentPath('c1', 'u1')).toBe('/teacher/classes/c1/students/u1');
    expect(coursesPath()).toBe('/teacher/courses');
    expect(coursesPath('catalog')).toBe('/teacher/courses');
    expect(coursesPath('academy')).toBe('/teacher/courses?tab=academy');
    expect(coursePath('k1')).toBe('/teacher/courses/k1');
    expect(lessonPath('k1', 'm1-l1')).toBe('/teacher/courses/k1/lessons/m1-l1');
    expect(reportPath()).toBe('/teacher/reports');
    expect(reportPath('c1')).toBe('/teacher/reports?classId=c1');
    expect(reportPath('c1', 'k1')).toBe('/teacher/reports?classId=c1&courseId=k1');
    expect(reportPath(undefined, 'x')).toBe('/teacher/reports');
    expect(editCoursePath('k1')).toBe('/teacher/create/k1');
    expect(submissionPath('s_1')).toBe('/teacher/projects/s_1');
    expect(attemptPath('a_1')).toBe('/teacher/assessments/a_1');
    expect(assessmentsPath('c1')).toBe('/teacher/assessments?classId=c1');
    expect(assessmentsPath('c1', 'k1')).toBe('/teacher/assessments?classId=c1&courseId=k1');
    expect(certificatePath('u_k')).toBe('/certificates/u_k');
    expect(invitePath('/fr/join', 'RBHDEM23')).toBe('/fr/join?code=RBHDEM23');
  });

  it('reads the first value of a repeated parameter', () => {
    expect(firstParam(['a', 'b'])).toBe('a');
    expect(firstParam('a')).toBe('a');
    expect(firstParam(undefined)).toBeUndefined();
  });
});
