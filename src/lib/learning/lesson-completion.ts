import type { BlockType, Lesson, LessonBlockOf } from '@/types/content';
import type { Enrollment, LessonCompletionResult, LessonProgress } from '@/types/learning';
import type { Quiz } from '@/types/quiz';

export type LessonCompletionMissing = LessonCompletionResult['missing'];

type BlockRequirement = {
  [T in BlockType]: Pick<LessonBlockOf<T>, 'id' | 'type' | 'data'>;
}[BlockType];

export interface LessonCompletionState {
  lesson: Pick<Lesson, 'quizIds' | 'projectIds' | 'reflectionBlockIds'>;
  /** The lesson's blocks; only the reflection blocks are looked at, for their `minLength`. */
  blocks: readonly BlockRequirement[];
  /** By quiz id; only `maxAttempts` is looked at. */
  quizzes: Record<string, Pick<Quiz, 'maxAttempts'>>;
  enrollment: Pick<Enrollment, 'quizSummary' | 'projectSummary'>;
  /** `progress.responses`, or `{}` when the lesson has no progress document yet. */
  responses: LessonProgress['responses'];
}

function own<T>(map: Record<string, T>, id: string): T | undefined {
  return Object.hasOwn(map, id) ? map[id] : undefined;
}

/** What counts towards a reflection's `minLength`: the text without its surrounding whitespace. */
export function responseLength(text: string): number {
  return text.trim().length;
}

/**
 * What still stands between the learner and "Complete lesson" (ARCHITECTURE.md 9.4), from the
 * enrollment and the lesson's progress alone:
 * - a quiz must be passed, or its attempts used up (the learner moves on without its XP);
 * - a project needs one submission; it does not have to be accepted;
 * - a reflection needs a saved response of at least its `minLength`.
 */
export function getMissingForCompletion(state: LessonCompletionState): LessonCompletionMissing {
  const { lesson, enrollment } = state;

  const quizIds = lesson.quizIds.filter((quizId) => {
    const summary = own(enrollment.quizSummary, quizId);
    const maxAttempts = own(state.quizzes, quizId)?.maxAttempts ?? null;
    const exhausted = maxAttempts !== null && (summary?.attempts ?? 0) >= maxAttempts;
    return summary?.passed !== true && !exhausted;
  });

  const projectIds = lesson.projectIds.filter(
    (projectId) => (own(enrollment.projectSummary, projectId)?.attempts ?? 0) < 1,
  );

  const minLengths = new Map<string, number>();
  for (const block of state.blocks) {
    if (block.type === 'reflection') minLengths.set(block.id, block.data.minLength);
  }
  const reflectionBlockIds = lesson.reflectionBlockIds.filter((blockId) => {
    const text = own(state.responses, blockId)?.text ?? '';
    return responseLength(text) < (minLengths.get(blockId) ?? 0);
  });

  return { quizIds, projectIds, reflectionBlockIds };
}

export function isReadyForCompletion(missing: LessonCompletionMissing): boolean {
  return (
    missing.quizIds.length === 0 &&
    missing.projectIds.length === 0 &&
    missing.reflectionBlockIds.length === 0
  );
}
