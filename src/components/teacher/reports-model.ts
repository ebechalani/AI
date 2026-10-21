import type { ClassReportRow } from '@/types/analytics';
import type { Course } from '@/types/content';
import type { Enrollment } from '@/types/learning';
import type { SchoolClass } from '@/types/school';

// The pure model of the reports page: which class and course the URL picks, the status and the
// certificate cell of each row, and the summary. No React, so Vitest can import it.

/** The class named in the URL, else the first active class, else the first one. */
export function resolveReportClass(
  classes: readonly SchoolClass[],
  classId: string | undefined,
): SchoolClass | null {
  return (
    classes.find((cls) => cls.id === classId) ??
    classes.find((cls) => !cls.archived) ??
    classes[0] ??
    null
  );
}

/** `courses` are the class's assigned courses (assignment order). */
export function resolveReportCourse(
  courses: readonly Course[],
  courseId: string | undefined,
): Course | null {
  return courses.find((course) => course.id === courseId) ?? courses[0] ?? null;
}

export type RowStatus = 'notEnrolled' | 'notStarted' | 'inProgress' | 'completed';

/** A student who opened a lesson without finishing it is in progress at 0 %. */
export function rowStatus(
  enrollment: Pick<Enrollment, 'status' | 'completedLessonCount' | 'lastLessonId'> | null,
): RowStatus {
  if (enrollment === null) return 'notEnrolled';
  if (enrollment.status === 'completed') return 'completed';
  if (enrollment.completedLessonCount === 0 && enrollment.lastLessonId === null) {
    return 'notStarted';
  }
  return 'inProgress';
}

export type CertificateCell =
  | { kind: 'issued'; certificateId: string }
  | { kind: 'issue' }
  | { kind: 'notCompleted' }
  | { kind: 'notEnrolled' }
  | { kind: 'disabled' };

/**
 * ARCHITECTURE.md 9.5: a teacher issues an official course's certificate only for a completed
 * enrollment; a teacher-made course's at the teacher's discretion.
 */
export function certificateCell(
  course: Pick<Course, 'certificateEnabled' | 'isOfficial'>,
  row: Pick<ClassReportRow, 'enrollment' | 'certificateId'>,
): CertificateCell {
  if (row.certificateId !== null) return { kind: 'issued', certificateId: row.certificateId };
  if (!course.certificateEnabled) return { kind: 'disabled' };
  if (row.enrollment === null) return { kind: 'notEnrolled' };
  if (course.isOfficial && row.enrollment.status !== 'completed') return { kind: 'notCompleted' };
  return { kind: 'issue' };
}

export interface ReportSummaryValues {
  students: number;
  averageProgress: number;
  completed: number;
  certificates: number;
}

/** A student who is not enrolled counts as 0 % in the average. */
export function reportSummary(
  rows: readonly Pick<ClassReportRow, 'enrollment' | 'certificateId'>[],
): ReportSummaryValues {
  const total = rows.reduce((sum, row) => sum + (row.enrollment?.progressPercent ?? 0), 0);
  return {
    students: rows.length,
    averageProgress: rows.length === 0 ? 0 : Math.round(total / rows.length),
    completed: rows.filter((row) => row.enrollment?.status === 'completed').length,
    certificates: rows.filter((row) => row.certificateId !== null).length,
  };
}

export interface ClassOption {
  value: string;
  archived: boolean;
  name: string;
}

/** Active classes first, then archived ones, each by name. */
export function classOptions(classes: readonly SchoolClass[]): ClassOption[] {
  const byName = (a: SchoolClass, b: SchoolClass) => a.name.localeCompare(b.name);
  return [
    ...classes.filter((cls) => !cls.archived).sort(byName),
    ...classes.filter((cls) => cls.archived).sort(byName),
  ].map((cls) => ({ value: cls.id, archived: cls.archived, name: cls.name }));
}
