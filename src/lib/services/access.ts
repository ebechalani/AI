import 'server-only';
import { isSystem, SYSTEM_ACTOR, type Actor, type Session } from '@/lib/auth/actor';
import { canViewCourse, isPlatformAdmin } from '@/lib/auth/authz';
import { listLicensesForSchool, listSubscriptionsForOwner } from '@/lib/data/billing';
import { getClass } from '@/lib/data/classes';
import { getEnrollment } from '@/lib/data/enrollments';
import { NotFoundError } from '@/lib/errors';
import type { License, Subscription } from '@/types/billing';
import type { Course } from '@/types/content';

export type CourseAccess =
  | {
      allowed: true;
      via: 'free' | 'license' | 'subscription' | 'owner' | 'staff_preview' | 'class_assignment';
    }
  | { allowed: false; reason: 'not_visible' | 'license_required' };

/** Active, started and not yet ended, with a scope that covers the course. */
export function licenseCovers(license: License, course: Course, now: Date): boolean {
  if (license.status !== 'active' || !course.isOfficial) return false;
  const at = now.getTime();
  if (!(Date.parse(license.startsAt) <= at && at < Date.parse(license.endsAt))) return false;
  if (license.scope.type === 'all_official') return true;
  return course.pathwayId !== null && license.scope.pathwayIds.includes(course.pathwayId);
}

/**
 * Trialing or active, inside its period. An individual plan covers every premium student
 * course; the course-scoped plans (course purchase, teacher training) cover the courses they
 * name. A school's plan gives access through the licences issued under it, not here.
 */
export function subscriptionCovers(subscription: Subscription, course: Course, now: Date): boolean {
  if (subscription.status !== 'trialing' && subscription.status !== 'active') return false;
  if (!(now.getTime() < Date.parse(subscription.currentPeriodEnd))) return false;
  if (subscription.plan === 'individual_monthly' || subscription.plan === 'individual_yearly') {
    return course.audience === 'student';
  }
  return subscription.courseIds.includes(course.id);
}

/** Whether one of the student's classes (archived ones aside) has the course assigned today. */
async function assignedByOwnClass(student: Session, courseId: string): Promise<boolean> {
  const classes = await Promise.all(
    student.classIds.map((classId) =>
      getClass(student, classId).catch((error: unknown) => {
        if (error instanceof NotFoundError) return null;
        throw error;
      }),
    ),
  );
  return classes.some(
    (cls) => cls !== null && !cls.archived && cls.assignedCourseIds.includes(courseId),
  );
}

/**
 * Whether the actor may open the course's content, and on what ground (ARCHITECTURE.md 4.5).
 * `canViewCourse` decides whether the course exists for the actor at all; this adds the
 * question of premium content. A free course costs no read, or one when only an enrollment
 * can make a teacher-made course visible.
 */
export async function getCourseAccess(actor: Actor, course: Course): Promise<CourseAccess> {
  if (isSystem(actor)) return { allowed: true, via: 'staff_preview' };

  let visible = canViewCourse(actor, course, { enrolled: false });
  if (!visible && !course.isOfficial) {
    const enrolled = (await getEnrollment(actor, actor.uid, course.id)) !== null;
    visible = canViewCourse(actor, course, { enrolled });
  }
  if (!visible) return { allowed: false, reason: 'not_visible' };

  if (actor.uid === course.ownerUid) return { allowed: true, via: 'owner' };
  if (isPlatformAdmin(actor)) return { allowed: true, via: 'staff_preview' };

  if (course.accessTier === 'free') {
    // Staff who cannot enrol in the course read it in the preview player.
    const previewOnly =
      actor.role === 'school_admin' || (actor.role === 'teacher' && course.audience !== 'teacher');
    return { allowed: true, via: previewOnly ? 'staff_preview' : 'free' };
  }

  const now = new Date();
  if (actor.schoolId !== null) {
    // Read as the system: a student or teacher session may not list the school's licences.
    const licenses = await listLicensesForSchool(SYSTEM_ACTOR, actor.schoolId);
    if (licenses.some((license) => licenseCovers(license, course, now))) {
      return { allowed: true, via: 'license' };
    }
  }
  const subscriptions = await listSubscriptionsForOwner(actor, 'user', actor.uid);
  if (subscriptions.some((subscription) => subscriptionCovers(subscription, course, now))) {
    return { allowed: true, via: 'subscription' };
  }
  // The teacher who assigned the course to the class held the cover (assignCourseToClass).
  if (actor.role === 'student' && (await assignedByOwnClass(actor, course.id))) {
    return { allowed: true, via: 'class_assignment' };
  }
  return { allowed: false, reason: 'license_required' };
}
