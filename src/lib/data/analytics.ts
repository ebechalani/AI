import 'server-only';
import type { Query } from 'firebase-admin/firestore';
import type { Actor } from '@/lib/auth/actor';
import { assertCan, canManageClass, canManageSchool, isPlatformAdmin } from '@/lib/auth/authz';
import { getAdminDb } from '@/lib/firebase/admin';
import { collections, docIds } from '@/lib/firebase/collections';
import { fromSnapshotOrNull } from '@/lib/firebase/converters';
import type {
  ClassReport,
  ClassReportRow,
  CourseUsageRow,
  PlatformStats,
  SchoolStats,
} from '@/types/analytics';
import { ROLES, type Role } from '@/types/common';
import type { Course } from '@/types/content';
import type { Enrollment } from '@/types/learning';
import type { ClassMember } from '@/types/school';
import { listLicensesForSchool } from './billing';
import { getClass, listClassesForSchool, listMembers } from './classes';
import { assertId, isId, loadCourse } from './internal-content';
import { getSchool } from './schools';

// Numbers for the dashboards. Nothing here reads learner documents one by one: counts are
// count() aggregations, and the class report is built from the enrollments alone (3.7).

async function countOf(query: Query): Promise<number> {
  return (await query.count().get()).data().count;
}

function percentOf(part: number, whole: number): number {
  return whole > 0 ? Math.round((part * 100) / whole) : 0;
}

/**
 * Teachers, students, classes and seats used are the school's own counters; only enrollments
 * and certificates are counted here.
 */
export async function getSchoolStats(actor: Actor, schoolId: string): Promise<SchoolStats> {
  assertCan(canManageSchool(actor, schoolId), 'school.analytics');
  assertId(schoolId);
  const inSchool = collections.enrollments().where('schoolId', '==', schoolId);
  const [school, licenses, enrollments, completedEnrollments, certificates] = await Promise.all([
    getSchool(actor, schoolId),
    listLicensesForSchool(actor, schoolId),
    countOf(inSchool),
    countOf(inSchool.where('status', '==', 'completed' satisfies Enrollment['status'])),
    countOf(collections.certificates().where('schoolId', '==', schoolId)),
  ]);

  const now = Date.now();
  const seatsTotal = licenses
    .filter((license) => license.status === 'active' && now < Date.parse(license.endsAt))
    .reduce((seats, license) => seats + license.seatsTotal, 0);

  return {
    teachers: school.counts.teachers,
    students: school.counts.students,
    classes: school.counts.classes,
    enrollments,
    completedEnrollments,
    completionRatePercent: percentOf(completedEnrollments, enrollments),
    certificates,
    seatsTotal,
    seatsUsed: school.counts.students,
  };
}

/** One row per course assigned to a class of the school that is not archived, busiest first. */
export async function getSchoolCourseUsage(
  actor: Actor,
  schoolId: string,
): Promise<CourseUsageRow[]> {
  assertCan(canManageSchool(actor, schoolId), 'school.analytics');
  assertId(schoolId);
  const classes = await listClassesForSchool(actor, schoolId);
  const courseIds = [...new Set(classes.flatMap((cls) => cls.assignedCourseIds))].filter(isId);
  if (courseIds.length === 0) return [];

  const snapshots = await getAdminDb().getAll(
    ...courseIds.map((courseId) => collections.courses().doc(courseId)),
  );
  const courses = snapshots.flatMap((snapshot) => fromSnapshotOrNull<Course>(snapshot) ?? []);

  const rows = await Promise.all(
    courses.map(async (course): Promise<CourseUsageRow> => {
      const inCourse = collections
        .enrollments()
        .where('schoolId', '==', schoolId)
        .where('courseId', '==', course.id);
      const [enrollments, completed] = await Promise.all([
        countOf(inCourse),
        countOf(inCourse.where('status', '==', 'completed' satisfies Enrollment['status'])),
      ]);
      return {
        courseId: course.id,
        course,
        enrollments,
        completed,
        completionRatePercent: percentOf(completed, enrollments),
      };
    }),
  );
  return rows.sort((a, b) => b.enrollments - a.enrollments);
}

function reportRow(member: ClassMember, enrollment: Enrollment | null): ClassReportRow {
  const quizzes = Object.values(enrollment?.quizSummary ?? {});
  const projects = Object.values(enrollment?.projectSummary ?? {});
  return {
    student: { ...member, uid: member.id },
    enrollment,
    quizAveragePercent:
      quizzes.length === 0
        ? null
        : Math.round(quizzes.reduce((sum, quiz) => sum + quiz.bestPercent, 0) / quizzes.length),
    submissionsApproved: projects.filter(
      (project) => project.latestStatus === 'approved' || project.latestStatus === 'ai_reviewed',
    ).length,
    submissionsPending: projects.filter((project) => project.latestStatus === 'submitted').length,
    certificateId: enrollment?.certificateId ?? null,
  };
}

/**
 * Authorized at class level: whoever manages the class sees the progress of its members in a
 * course assigned to it, whichever class supervises each enrollment. A student in two classes
 * that both assign the course therefore appears, with the same progress, in both reports.
 */
export async function getClassReport(
  actor: Actor,
  classId: string,
  courseId: string,
): Promise<ClassReport> {
  const cls = await getClass(actor, classId);
  assertId(courseId);
  assertCan(canManageClass(actor, cls) && cls.assignedCourseIds.includes(courseId), 'class.report');
  const [course, members] = await Promise.all([loadCourse(courseId), listMembers(actor, classId)]);
  const snapshots =
    members.length === 0
      ? []
      : await getAdminDb().getAll(
          ...members.map((member) =>
            collections.enrollments().doc(docIds.enrollment(member.id, courseId)),
          ),
        );
  return {
    cls,
    course,
    rows: members.map((member, index) =>
      reportRow(member, fromSnapshotOrNull<Enrollment>(snapshots[index]!)),
    ),
  };
}

export async function getPlatformStats(actor: Actor): Promise<PlatformStats> {
  assertCan(isPlatformAdmin(actor), 'platform.analytics');
  const users = collections.users();
  const enrollments = collections.enrollments();
  const [
    schools,
    byRole,
    officialCourses,
    allEnrollments,
    completedEnrollments,
    submissions,
    certificates,
  ] = await Promise.all([
    countOf(collections.schools()),
    Promise.all(ROLES.map((role) => countOf(users.where('role', '==', role)))),
    countOf(collections.courses().where('isOfficial', '==', true)),
    countOf(enrollments),
    countOf(enrollments.where('status', '==', 'completed' satisfies Enrollment['status'])),
    countOf(collections.submissions()),
    countOf(collections.certificates()),
  ]);

  return {
    schools,
    users: Object.fromEntries(ROLES.map((role, index) => [role, byRole[index]!])) as Record<
      Role,
      number
    >,
    officialCourses,
    enrollments: allEnrollments,
    completedEnrollments,
    submissions,
    certificates,
  };
}
