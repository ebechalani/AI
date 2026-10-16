// The teacher's decision form (SPEC-D 5.1, 10.3): when the AI suggestion may be approved, the
// score a set of criteria gives, and the form's drafts. Pure, for the unit tests.

import {
  RUBRIC_KEYS,
  type AiReview,
  type CriteriaScores,
  type ReviewDecision,
  type RubricKey,
  type RubricWeight,
  type Submission,
} from '@/types/project';
import type { ReviewInput } from '@/types/inputs';

export type ApproveBlock = 'not_ready' | 'unavailable' | 'flagged' | 'low_confidence';

/**
 * Why "Approve" is not available, or null when it is. The same rule as
 * project-flow.reviewSubmission (8.4): a ready suggestion with no flag, not of low confidence,
 * with criteria and an overall score.
 */
export function approveBlock(
  s: Pick<Submission, 'aiReviewStatus' | 'latestAiReviewId'>,
  ai: AiReview | null,
): ApproveBlock | null {
  if (s.aiReviewStatus === 'pending') return 'not_ready';
  if (s.aiReviewStatus !== 'ready' || s.latestAiReviewId === null || ai?.status !== 'ready') {
    return 'unavailable';
  }
  if (ai.flags.length > 0) return 'flagged';
  if (ai.confidence === 'low') return 'low_confidence';
  if (ai.criteria === null || ai.overallSuggestedScore === null) return 'unavailable';
  return null;
}

/** Σ score × weight / 100, rounded and kept within 0–100; keys not in the rubric weigh nothing. */
export function weightedScore(criteria: CriteriaScores, rubric: readonly RubricWeight[]): number {
  const total = rubric.reduce((sum, { key, weight }) => sum + criteria[key] * weight, 0);
  return Math.max(0, Math.min(100, Math.round(total / 100)));
}

/** The rubric's criteria in its order, then the criteria it leaves out, weighing nothing. */
export function rubricRows(rubric: readonly RubricWeight[]): { key: RubricKey; weight: number }[] {
  const rows = rubric.map(({ key, weight }) => ({ key, weight }));
  for (const key of RUBRIC_KEYS) {
    if (!rows.some((row) => row.key === key)) rows.push({ key, weight: 0 });
  }
  return rows;
}

/** The score inputs as typed. */
export type CriteriaDraft = Record<RubricKey, string>;

/** The AI's scores as a start, or empty inputs. */
export function criteriaDraftFrom(ai: AiReview | null): CriteriaDraft {
  const criteria = ai?.criteria ?? null;
  const draft = {} as CriteriaDraft;
  for (const key of RUBRIC_KEYS) {
    draft[key] = criteria === null ? '' : String(criteria[key].score);
  }
  return draft;
}

export type CriterionProblem = 'required' | 'invalid_integer' | 'too_small' | 'too_big';

export function parseCriteriaDraft(
  d: CriteriaDraft,
):
  | { ok: true; criteria: CriteriaScores }
  | { ok: false; errors: Partial<Record<RubricKey, CriterionProblem>> } {
  const errors: Partial<Record<RubricKey, CriterionProblem>> = {};
  const criteria = {} as CriteriaScores;
  for (const key of RUBRIC_KEYS) {
    const value = d[key].trim();
    if (value === '') errors[key] = 'required';
    else if (/^-\d+$/.test(value)) errors[key] = 'too_small';
    else if (!/^\d+$/.test(value)) errors[key] = 'invalid_integer';
    else {
      const score = Number(value);
      if (score > 100) errors[key] = 'too_big';
      else criteria[key] = score;
    }
  }
  return Object.keys(errors).length === 0 ? { ok: true, criteria } : { ok: false, errors };
}

/**
 * What the live total under the scores says: the grade once all four are valid; `invalid` when
 * a score that is typed is wrong (too big, negative, not a whole number), so the teacher is
 * told to correct it rather than to fill it in; `incomplete` while scores are only missing.
 */
export type ScoreState =
  { kind: 'ready'; score: number } | { kind: 'invalid' } | { kind: 'incomplete' };

export function scoreState(d: CriteriaDraft, rubric: readonly RubricWeight[]): ScoreState {
  const parsed = parseCriteriaDraft(d);
  if (parsed.ok) return { kind: 'ready', score: weightedScore(parsed.criteria, rubric) };
  const problems = Object.values(parsed.errors);
  return problems.some((problem) => problem !== 'required')
    ? { kind: 'invalid' }
    : { kind: 'incomplete' };
}

export function initialDecision(block: ApproveBlock | null): ReviewDecision {
  return block === null ? 'approve' : 'modify';
}

/**
 * Scores go with `modify` only: the schema refuses them with the other decisions. `aiReviewId`
 * is the suggestion the form shows: an approve that no longer names the latest one is a
 * conflict, so the teacher sees the new suggestion before it becomes the grade (WS-D-4).
 */
export function toReviewInput(a: {
  submissionId: string;
  decision: ReviewDecision;
  criteria: CriteriaScores | null;
  feedback: string;
  aiReviewId: string | null;
}): ReviewInput {
  return {
    submissionId: a.submissionId,
    decision: a.decision,
    criteria: a.decision === 'modify' ? a.criteria : null,
    feedback: a.feedback,
    aiReviewId: a.aiReviewId,
  };
}

export type ReviewField = 'decision' | 'feedback' | 'criteria' | RubricKey;

/** The input a `fieldErrors` path belongs to; null for problems shown at the form level. */
export function reviewFieldOf(path: string): ReviewField | null {
  if (path === 'decision' || path === 'feedback' || path === 'criteria') return path;
  const match = /^criteria\.(\w+)$/.exec(path);
  const key = match?.[1];
  return key !== undefined && (RUBRIC_KEYS as readonly string[]).includes(key)
    ? (key as RubricKey)
    : null;
}
