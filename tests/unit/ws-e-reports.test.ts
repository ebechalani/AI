import { describe, expect, it } from 'vitest';
import {
  certificateCell,
  classOptions,
  reportSummary,
  resolveReportClass,
  resolveReportCourse,
  rowStatus,
} from '@/components/teacher/reports-model';
import type { Enrollment } from '@/types';
import { course, enrollment, schoolClass } from './services-fixtures';

// The pure model of the reports page (reports-model.ts).

describe('resolveReportClass', () => {
  const classes = [
    schoolClass({ id: 'old', name: 'Alpha', archived: true }),
    schoolClass({ id: 'b', name: 'Beta' }),
    schoolClass({ id: 'c', name: 'Gamma' }),
  ];

  it('takes the class named in the URL, else the first active one', () => {
    expect(resolveReportClass(classes, 'c')?.id).toBe('c');
    expect(resolveReportClass(classes, 'old')?.id).toBe('old');
    expect(resolveReportClass(classes, 'bogus')?.id).toBe('b');
    expect(resolveReportClass(classes, undefined)?.id).toBe('b');
  });

  it('falls back to an archived class, then to nothing', () => {
    expect(resolveReportClass([classes[0]!], undefined)?.id).toBe('old');
    expect(resolveReportClass([], 'c')).toBeNull();
  });
});

describe('resolveReportCourse', () => {
  const courses = [course({ id: 'k1' }), course({ id: 'k2' })];

  it('takes the course named in the URL, else the first', () => {
    expect(resolveReportCourse(courses, 'k2')?.id).toBe('k2');
    expect(resolveReportCourse(courses, 'nope')?.id).toBe('k1');
    expect(resolveReportCourse([], 'k1')).toBeNull();
  });
});

describe('rowStatus', () => {
  const of = (fields: Partial<Enrollment>) =>
    enrollment({ userUid: 'u', courseId: 'k1', ...fields });

  it('reads the enrollment', () => {
    expect(rowStatus(null)).toBe('notEnrolled');
    expect(rowStatus(of({ status: 'completed', completedLessonCount: 4 }))).toBe('completed');
    expect(rowStatus(of({ completedLessonCount: 0, lastLessonId: null }))).toBe('notStarted');
    // Maya opened a lesson without finishing it: in progress at 0 %.
    expect(rowStatus(of({ completedLessonCount: 0, lastLessonId: 'm1-l1' }))).toBe('inProgress');
    expect(rowStatus(of({ completedLessonCount: 2, lastLessonId: 'm2-l1' }))).toBe('inProgress');
  });
});

describe('certificateCell', () => {
  const official = { certificateEnabled: true, isOfficial: true };
  const active = enrollment({ userUid: 'u', courseId: 'k1' });
  const completed = enrollment({ userUid: 'u', courseId: 'k1', status: 'completed' });

  it('shows an issued certificate even when the course no longer gives any', () => {
    expect(
      certificateCell({ certificateEnabled: false, isOfficial: true }, {
        enrollment: completed,
        certificateId: 'u_k1',
      }),
    ).toEqual({ kind: 'issued', certificateId: 'u_k1' });
  });

  it('follows ARCHITECTURE.md 9.5 for the others', () => {
    expect(
      certificateCell({ certificateEnabled: false, isOfficial: true }, {
        enrollment: completed,
        certificateId: null,
      }),
    ).toEqual({ kind: 'disabled' });
    expect(certificateCell(official, { enrollment: null, certificateId: null })).toEqual({
      kind: 'notEnrolled',
    });
    expect(certificateCell(official, { enrollment: active, certificateId: null })).toEqual({
      kind: 'notCompleted',
    });
    expect(certificateCell(official, { enrollment: completed, certificateId: null })).toEqual({
      kind: 'issue',
    });
    expect(
      certificateCell({ certificateEnabled: true, isOfficial: false }, {
        enrollment: active,
        certificateId: null,
      }),
    ).toEqual({ kind: 'issue' });
  });
});

describe('reportSummary', () => {
  it('is all zeros without rows', () => {
    expect(reportSummary([])).toEqual({
      students: 0,
      averageProgress: 0,
      completed: 0,
      certificates: 0,
    });
  });

  it('averages progress over every row (not enrolled counts as 0)', () => {
    const rows = [
      {
        enrollment: enrollment({
          userUid: 'a',
          courseId: 'k1',
          progressPercent: 100,
          status: 'completed',
        }),
        certificateId: 'a_k1',
      },
      { enrollment: enrollment({ userUid: 'b', courseId: 'k1', progressPercent: 50 }), certificateId: null },
      { enrollment: null, certificateId: null },
    ];
    expect(reportSummary(rows)).toEqual({
      students: 3,
      averageProgress: 50,
      completed: 1,
      certificates: 1,
    });
    // (100 + 25 + 0 + 0) / 4 = 31.25 → 31
    expect(
      reportSummary([
        { enrollment: enrollment({ userUid: 'a', courseId: 'k', progressPercent: 100 }), certificateId: null },
        { enrollment: enrollment({ userUid: 'b', courseId: 'k', progressPercent: 25 }), certificateId: null },
        { enrollment: enrollment({ userUid: 'c', courseId: 'k', progressPercent: 0 }), certificateId: null },
        { enrollment: null, certificateId: null },
      ]).averageProgress,
    ).toBe(31);
  });
});

describe('classOptions', () => {
  it('lists active classes first, then archived ones, each by name', () => {
    expect(
      classOptions([
        schoolClass({ id: 'z', name: 'Zeta' }),
        schoolClass({ id: 'o', name: 'Omega', archived: true }),
        schoolClass({ id: 'a', name: 'Alpha' }),
        schoolClass({ id: 'b', name: 'Beta', archived: true }),
      ]),
    ).toEqual([
      { value: 'a', archived: false, name: 'Alpha' },
      { value: 'z', archived: false, name: 'Zeta' },
      { value: 'b', archived: true, name: 'Beta' },
      { value: 'o', archived: true, name: 'Omega' },
    ]);
  });
});
