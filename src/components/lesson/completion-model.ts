import type { Badge } from '@/types/gamification';
import type { LessonCompletionResult } from '@/types/learning';

// What the completion dialog shows (the EARN stage, ARCHITECTURE.md 9.4), from the answer of
// completeLessonAction. Pure, for the unit tests.

export interface CompletionSummary {
  xpAwarded: number;
  /**
   * No gamification outcome came back with a completion. Either the handler failed (its effects
   * stay pending and the next read of the player applies them) or the lesson had already been
   * completed with its effects applied (a second tab, a double submit): the answer cannot tell
   * the two apart, so the copy shown for it is true in both cases.
   */
  rewardsPending: boolean;
  leveledUp: boolean;
  level: number | null;
  newBadges: Badge[];
  /** Only when this completion finished the course and a certificate exists for it. */
  certificateId: string | null;
  courseJustCompleted: boolean;
}

export function summarizeCompletion(
  result: LessonCompletionResult,
  courseCompletedBefore: boolean,
): CompletionSummary {
  const gamification = result.gamification;
  const courseJustCompleted = !courseCompletedBefore && result.enrollment.status === 'completed';
  return {
    xpAwarded: gamification?.xpAwarded ?? 0,
    rewardsPending: gamification === null,
    leveledUp: gamification?.leveledUp ?? false,
    level: gamification?.level ?? null,
    newBadges: gamification?.newBadges ?? [],
    certificateId: courseJustCompleted
      ? (gamification?.certificate?.id ?? result.enrollment.certificateId)
      : null,
    courseJustCompleted,
  };
}
