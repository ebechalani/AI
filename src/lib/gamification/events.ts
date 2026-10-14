import 'server-only';
import { SYSTEM_ACTOR } from '@/lib/auth/actor';
import { getCourse } from '@/lib/data/courses';
import { markLessonEffectsApplied } from '@/lib/data/enrollments';
import { markAttemptEffectsApplied } from '@/lib/data/quizzes';
import { markSubmissionEffectsApplied } from '@/lib/data/submissions';
import { getUser } from '@/lib/data/users';
import type { Badge, BadgeTrigger, Certificate, GamificationOutcome } from '@/types/gamification';
import { awardXp, evaluateBadgeTriggers } from './award';
import { maybeIssueCourseCertificate } from './certificates';

// Internal (ARCHITECTURE.md 9.4, 9.6): the entry points of the system services. Each handler
// runs after the transaction that changed the learner's state and ends by setting that
// document's `effectsApplied`. Every step is idempotent, so a handler that failed half-way is
// simply run again; when it throws, the flag stays false and the next read repairs it.

type XpAward = Awaited<ReturnType<typeof awardXp>>;
type StatName = Extract<BadgeTrigger, { type: 'stat' }>['stat'];

function statTrigger(stat: StatName, xp: XpAward): BadgeTrigger[] {
  return xp.stat === null ? [] : [{ type: 'stat', stat, value: xp.stat.value }];
}

// A badge bonus moves the total after the award was read, so the profile is read once more.
async function toOutcome(
  uid: string,
  xp: XpAward,
  amount: number,
  newBadges: Badge[],
  certificate: Certificate | null,
): Promise<GamificationOutcome> {
  const bonus = newBadges.reduce((sum, badge) => sum + badge.xpBonus, 0);
  const { xpTotal, level } = bonus > 0 ? await getUser(SYSTEM_ACTOR, uid) : xp;
  return {
    xpAwarded: (xp.awarded ? amount : 0) + bonus,
    xpTotal,
    level,
    leveledUp: xp.leveledUp || level > xp.level,
    newBadges,
    certificate,
  };
}

/**
 * Lesson XP (ledger id `lesson_{courseId}_{lessonId}`), the badges of the lesson counter and,
 * when this lesson completed the course, the course and pathway badges and the certificate.
 */
export async function onLessonCompleted(
  uid: string,
  ctx: { courseId: string; lessonId: string; xpReward: number; courseCompleted: boolean },
): Promise<GamificationOutcome> {
  const xp = await awardXp(uid, {
    reason: 'lesson',
    refId: `${ctx.courseId}_${ctx.lessonId}`,
    amount: ctx.xpReward,
    courseId: ctx.courseId,
  });

  const triggers = statTrigger('lessonsCompleted', xp);
  if (ctx.courseCompleted) {
    const [course, user] = await Promise.all([
      getCourse(SYSTEM_ACTOR, ctx.courseId),
      getUser(SYSTEM_ACTOR, uid),
    ]);
    triggers.push({
      type: 'course_completed',
      courseId: ctx.courseId,
      pathwayId: course.pathwayId,
      coursesCompleted: user.stats.coursesCompleted,
    });
  }
  const newBadges = await evaluateBadgeTriggers(uid, triggers);
  const certificate = ctx.courseCompleted
    ? await maybeIssueCourseCertificate(uid, ctx.courseId)
    : null;

  const outcome = await toOutcome(uid, xp, ctx.xpReward, newBadges, certificate);
  await markLessonEffectsApplied(SYSTEM_ACTOR, uid, ctx.courseId, ctx.lessonId);
  return outcome;
}

/**
 * Quiz XP (ledger id `quiz_{courseId}_{quizId}`) and the badges of the quiz counter. Passing
 * the same quiz again grants nothing and still closes the attempt.
 */
export async function onQuizPassed(
  uid: string,
  ctx: { attemptId: string; courseId: string; quizId: string; xpReward: number },
): Promise<GamificationOutcome> {
  const xp = await awardXp(uid, {
    reason: 'quiz',
    refId: `${ctx.courseId}_${ctx.quizId}`,
    amount: ctx.xpReward,
    courseId: ctx.courseId,
  });
  const newBadges = await evaluateBadgeTriggers(uid, statTrigger('quizzesPassed', xp));

  const outcome = await toOutcome(uid, xp, ctx.xpReward, newBadges, null);
  await markAttemptEffectsApplied(SYSTEM_ACTOR, ctx.attemptId);
  return outcome;
}

/**
 * XP for an accepted project submission (ledger id `project_{courseId}_{projectId}`) or
 * challenge entry (`challenge_{challengeId}`); `refId` is the project or challenge id. A
 * project may have been the last thing the course certificate was waiting for.
 */
export async function onSubmissionAccepted(
  uid: string,
  ctx: {
    submissionId: string;
    context: 'project' | 'challenge';
    refId: string;
    courseId: string | null;
    xpReward: number;
  },
): Promise<GamificationOutcome> {
  const courseId = ctx.context === 'project' ? ctx.courseId : null;
  if (ctx.context === 'project' && courseId === null) {
    throw new Error('A project submission belongs to a course.');
  }
  const xp = await awardXp(uid, {
    reason: ctx.context,
    refId: courseId === null ? ctx.refId : `${courseId}_${ctx.refId}`,
    amount: ctx.xpReward,
    courseId,
  });
  const newBadges = await evaluateBadgeTriggers(
    uid,
    statTrigger(ctx.context === 'project' ? 'projectsAccepted' : 'challengesCompleted', xp),
  );
  const certificate = courseId === null ? null : await maybeIssueCourseCertificate(uid, courseId);

  const outcome = await toOutcome(uid, xp, ctx.xpReward, newBadges, certificate);
  // One submission per project or challenge is ever accepted, so the ledger entry is this
  // submission's also when an earlier, interrupted run of this handler created it.
  await markSubmissionEffectsApplied(SYSTEM_ACTOR, ctx.submissionId, ctx.xpReward);
  return outcome;
}
