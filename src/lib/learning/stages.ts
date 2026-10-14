import { LESSON_STAGES, type LessonStage } from '@/types/content';

export { LESSON_STAGES };
export type { LessonStage };

export interface StageGroup<B> {
  stage: LessonStage;
  blocks: B[];
}

/**
 * The blocks of a lesson as the player shows them: one group per stage that has blocks, in
 * the order of LESSON_STAGES, each group sorted by `order`.
 */
export function groupBlocksByStage<B extends { stage: LessonStage; order: number }>(
  blocks: readonly B[],
): StageGroup<B>[] {
  return LESSON_STAGES.map((stage) => ({
    stage,
    blocks: blocks.filter((block) => block.stage === stage).sort((a, b) => a.order - b.order),
  })).filter((group) => group.blocks.length > 0);
}
