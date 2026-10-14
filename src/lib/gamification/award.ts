import 'server-only';
import { SYSTEM_ACTOR } from '@/lib/auth/actor';
import { createUserBadge, getBadge, listBadges, listUserBadges } from '@/lib/data/badges';
import { listPublishedCoursesByPathway } from '@/lib/data/courses';
import { getEnrollment } from '@/lib/data/enrollments';
import { applyXpEntry } from '@/lib/data/xp';
import type { Badge, BadgeCriteria, BadgeTrigger, XpReason } from '@/types/gamification';

// Internal (ARCHITECTURE.md 9): no actor, no authorization. Request-handling code reaches
// these through a service that has authorized.

/**
 * Grants XP once per ledger id `${reason}_${refId}`: a second call for the same id changes
 * nothing and answers `awarded: false`, with the current total, level and counter.
 */
export async function awardXp(
  uid: string,
  entry: { reason: XpReason; refId: string; amount: number; courseId: string | null },
): Promise<{
  awarded: boolean;
  xpTotal: number;
  level: number;
  leveledUp: boolean;
  stat: { name: string; value: number } | null;
}> {
  const applied = await applyXpEntry(SYSTEM_ACTOR, uid, entry);
  return {
    awarded: applied.created,
    xpTotal: applied.xpTotal,
    level: applied.level,
    leveledUp: applied.level > applied.previousLevel,
    stat: applied.stat,
  };
}

// The bonus goes first: its ledger id makes it safe to repeat, so a run that dies between the
// two writes is completed by the next evaluation, which still finds the badge missing. The
// other order would leave a badge without its bonus for good.
async function grantBadge(
  uid: string,
  badge: Badge,
  awardedBy: 'system' | string,
  note: string | null,
): Promise<{ awarded: boolean }> {
  if (badge.xpBonus > 0) {
    await awardXp(uid, { reason: 'badge', refId: badge.id, amount: badge.xpBonus, courseId: null });
  }
  const { created } = await createUserBadge(SYSTEM_ACTOR, uid, badge.id, awardedBy, note);
  return { awarded: created };
}

/**
 * Gives the user a badge they do not hold yet, with its XP bonus. The bonus triggers no
 * badge evaluation. NotFoundError for an unknown badge; whether the badge is active, manual
 * or deserved is the caller's question.
 */
export async function awardBadge(
  uid: string,
  badgeId: string,
  awardedBy: 'system' | string,
  note?: string,
): Promise<{ awarded: boolean }> {
  const badge = await getBadge(SYSTEM_ACTOR, badgeId);
  return grantBadge(uid, badge, awardedBy, note ?? null);
}

/** Every published official course of the pathway has a completed enrollment of the user. */
async function hasCompletedPathway(uid: string, pathwayId: string): Promise<boolean> {
  const courses = await listPublishedCoursesByPathway(pathwayId);
  if (courses.length === 0) return false;
  const enrollments = await Promise.all(
    courses.map((course) => getEnrollment(SYSTEM_ACTOR, uid, course.id)),
  );
  return enrollments.every((enrollment) => enrollment?.status === 'completed');
}

// A trigger can only satisfy the criteria it names, so an ordinary XP event never reads
// enrollments; only a completed course looks at its own pathway.
async function isSatisfied(
  uid: string,
  criteria: BadgeCriteria,
  trigger: BadgeTrigger,
): Promise<boolean> {
  switch (criteria.type) {
    case 'stat_threshold':
      return trigger.type === 'stat'
        ? criteria.stat === trigger.stat && trigger.value >= criteria.threshold
        : criteria.stat === 'coursesCompleted' && trigger.coursesCompleted >= criteria.threshold;
    case 'course_completed':
      return trigger.type === 'course_completed' && criteria.courseId === trigger.courseId;
    case 'pathway_completed':
      return (
        trigger.type === 'course_completed' &&
        trigger.pathwayId !== null &&
        criteria.pathwayId === trigger.pathwayId &&
        (await hasCompletedPathway(uid, criteria.pathwayId))
      );
    default:
      // 'manual', and any criteria type this version does not know.
      return false;
  }
}

/**
 * evaluateBadges for an event that carries several triggers (a lesson that also completes its
 * course): the active badges and the user's badges are read once.
 */
export async function evaluateBadgeTriggers(
  uid: string,
  triggers: readonly BadgeTrigger[],
): Promise<Badge[]> {
  if (triggers.length === 0) return [];
  const [badges, held] = await Promise.all([
    listBadges(SYSTEM_ACTOR, { activeOnly: true }),
    listUserBadges(SYSTEM_ACTOR, uid),
  ]);
  const heldIds = new Set(held.map((userBadge) => userBadge.badgeId));

  const awarded: Badge[] = [];
  for (const badge of badges) {
    if (heldIds.has(badge.id) || !(await isSatisfiedByAny(uid, badge.criteria, triggers))) continue;
    if ((await grantBadge(uid, badge, 'system', null)).awarded) awarded.push(badge);
  }
  return awarded;
}

async function isSatisfiedByAny(
  uid: string,
  criteria: BadgeCriteria,
  triggers: readonly BadgeTrigger[],
): Promise<boolean> {
  for (const trigger of triggers) {
    if (await isSatisfied(uid, criteria, trigger)) return true;
  }
  return false;
}

/**
 * Awards every active badge the trigger newly satisfies and returns those badges. Only the
 * criteria the trigger can affect are evaluated (ARCHITECTURE.md 9.3); manual badges never are.
 */
export async function evaluateBadges(uid: string, trigger: BadgeTrigger): Promise<Badge[]> {
  return evaluateBadgeTriggers(uid, [trigger]);
}
