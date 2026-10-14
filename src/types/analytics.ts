import type { Role } from './common';
import type { Course } from './content';
import type { Enrollment } from './learning';
import type { ClassMember, SchoolClass } from './school';

export interface SchoolStats {
  teachers: number;
  students: number;
  classes: number;
  enrollments: number;
  completedEnrollments: number;
  completionRatePercent: number;
  certificates: number;
  seatsTotal: number;
  /** Equals `students`. */
  seatsUsed: number;
}

export interface CourseUsageRow {
  courseId: string;
  course: Course;
  enrollments: number;
  completed: number;
  completionRatePercent: number;
}

export interface ClassReportRow {
  student: ClassMember & { uid: string };
  enrollment: Enrollment | null;
  /** Mean of the best percent of every quiz attempted; null when none was. */
  quizAveragePercent: number | null;
  /** Projects whose latest submission is 'approved' or 'ai_reviewed'. */
  submissionsApproved: number;
  /** Projects whose latest submission is 'submitted'. */
  submissionsPending: number;
  certificateId: string | null;
}

export interface ClassReport {
  cls: SchoolClass;
  course: Course;
  rows: ClassReportRow[];
}

export interface PlatformStats {
  schools: number;
  users: Record<Role, number>;
  officialCourses: number;
  enrollments: number;
  completedEnrollments: number;
  submissions: number;
  certificates: number;
}
