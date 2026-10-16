import { describe, expect, it } from 'vitest';
import {
  approveBlock,
  criteriaDraftFrom,
  initialDecision,
  parseCriteriaDraft,
  reviewFieldOf,
  rubricRows,
  scoreState,
  toReviewInput,
  weightedScore,
  type CriteriaDraft,
} from '@/components/projects/review-model';
import { parseInput } from '@/lib/schemas/common';
import { reviewInputSchema } from '@/lib/schemas/submission';
import { weightedScore as serviceWeightedScore } from '@/lib/services/internal-common';
import type { CriteriaScores, RubricWeight } from '@/types';
import { aiReview, submission } from './services-fixtures';

// The teacher's decision form (SPEC-D 5.1, 10.3): "Approve" follows the server's rule exactly,
// the live total equals the server's weighted score, and the drafts become a valid ReviewInput.

const ID = 'student-1_p_course-1_p1_1';

describe('approveBlock', () => {
  const ready = submission({ id: ID, aiReviewStatus: 'ready', latestAiReviewId: 'r1' });
  const review = aiReview({ id: 'r1', submissionId: ID, confidence: 'high' });

  it('allows approving a ready, flag-free, confident suggestion with criteria and a score', () => {
    expect(approveBlock(ready, review)).toBeNull();
    expect(approveBlock(ready, { ...review, confidence: 'medium' })).toBeNull();
  });

  it('waits for a pending review', () => {
    expect(approveBlock({ ...ready, aiReviewStatus: 'pending' }, null)).toBe('not_ready');
  });

  it('blocks a suggestion with points to check, then one of low confidence', () => {
    expect(approveBlock(ready, { ...review, flags: ['possible_personal_data'] })).toBe('flagged');
    expect(approveBlock(ready, { ...review, flags: ['off_topic'], confidence: 'low' })).toBe(
      'flagged',
    );
    expect(approveBlock(ready, { ...review, confidence: 'low' })).toBe('low_confidence');
  });

  it('has nothing to approve otherwise', () => {
    expect(approveBlock({ ...ready, aiReviewStatus: 'failed' }, review)).toBe('unavailable');
    expect(approveBlock({ ...ready, aiReviewStatus: 'skipped' }, null)).toBe('unavailable');
    expect(approveBlock({ ...ready, latestAiReviewId: null }, review)).toBe('unavailable');
    expect(approveBlock(ready, null)).toBe('unavailable');
    expect(approveBlock(ready, { ...review, status: 'failed' })).toBe('unavailable');
    expect(approveBlock(ready, { ...review, criteria: null })).toBe('unavailable');
    expect(approveBlock(ready, { ...review, overallSuggestedScore: null })).toBe('unavailable');
  });
});

describe('weightedScore', () => {
  const rubrics: [string, RubricWeight[]][] = [
    [
      '25 × 4',
      [
        { key: 'creativity', weight: 25 },
        { key: 'technicalQuality', weight: 25 },
        { key: 'understanding', weight: 25 },
        { key: 'responsibleAi', weight: 25 },
      ],
    ],
    [
      '40/30/15/15 (robotics)',
      [
        { key: 'technicalQuality', weight: 40 },
        { key: 'understanding', weight: 30 },
        { key: 'creativity', weight: 15 },
        { key: 'responsibleAi', weight: 15 },
      ],
    ],
    [
      '50/50 on two keys',
      [
        { key: 'creativity', weight: 50 },
        { key: 'understanding', weight: 50 },
      ],
    ],
  ];
  const scores: CriteriaScores[] = [
    { creativity: 90, technicalQuality: 80, understanding: 70, responsibleAi: 60 },
    { creativity: 33, technicalQuality: 67, understanding: 51, responsibleAi: 99 },
    { creativity: 0, technicalQuality: 0, understanding: 0, responsibleAi: 0 },
    { creativity: 250, technicalQuality: 250, understanding: 250, responsibleAi: 250 },
    { creativity: -50, technicalQuality: -50, understanding: -50, responsibleAi: -50 },
  ];

  it.each(rubrics)('equals the service’s score for the %s rubric', (_name, rubric) => {
    for (const criteria of scores) {
      expect(weightedScore(criteria, rubric)).toBe(serviceWeightedScore(criteria, rubric));
    }
  });

  it('gives 75 for 90/80/70/60 under 25 × 4, and clamps out-of-range scores', () => {
    expect(weightedScore(scores[0]!, rubrics[0]![1])).toBe(75);
    expect(weightedScore(scores[3]!, rubrics[0]![1])).toBe(100);
    expect(weightedScore(scores[4]!, rubrics[0]![1])).toBe(0);
  });
});

describe('rubricRows', () => {
  it('keeps the rubric’s order, then adds the missing criteria with weight 0', () => {
    expect(
      rubricRows([
        { key: 'understanding', weight: 50 },
        { key: 'creativity', weight: 50 },
      ]),
    ).toEqual([
      { key: 'understanding', weight: 50 },
      { key: 'creativity', weight: 50 },
      { key: 'technicalQuality', weight: 0 },
      { key: 'responsibleAi', weight: 0 },
    ]);
  });
});

describe('criteria drafts', () => {
  const full: CriteriaDraft = {
    creativity: '90',
    technicalQuality: '80',
    understanding: '70',
    responsibleAi: ' 60 ',
  };

  it('starts from the AI’s scores, or empty', () => {
    expect(criteriaDraftFrom(aiReview({ id: 'r', submissionId: ID }))).toEqual({
      creativity: '80',
      technicalQuality: '60',
      understanding: '70',
      responsibleAi: '90',
    });
    expect(criteriaDraftFrom(null)).toEqual({
      creativity: '',
      technicalQuality: '',
      understanding: '',
      responsibleAi: '',
    });
  });

  it('reads trimmed whole numbers from 0 to 100', () => {
    expect(parseCriteriaDraft(full)).toEqual({
      ok: true,
      criteria: { creativity: 90, technicalQuality: 80, understanding: 70, responsibleAi: 60 },
    });
  });

  it('names the problem of each score', () => {
    expect(
      parseCriteriaDraft({
        creativity: '',
        technicalQuality: '7.5',
        understanding: '-1',
        responsibleAi: '101',
      }),
    ).toEqual({
      ok: false,
      errors: {
        creativity: 'required',
        technicalQuality: 'invalid_integer',
        understanding: 'too_small',
        responsibleAi: 'too_big',
      },
    });
  });

  it('shows a total only once all four scores are valid', () => {
    const rubric = rubricRows([]).map((row) => ({ ...row, weight: 25 }));
    expect(scoreState({ ...full, creativity: '' }, rubric)).toEqual({ kind: 'incomplete' });
    expect(scoreState(full, rubric)).toEqual({ kind: 'ready', score: 75 });
  });

  it('asks to correct a typed score that is wrong rather than to fill it in', () => {
    const rubric = rubricRows([]).map((row) => ({ ...row, weight: 25 }));
    for (const wrong of ['101', '-1', '7.5']) {
      expect(scoreState({ ...full, creativity: wrong }, rubric), wrong).toEqual({
        kind: 'invalid',
      });
      // A wrong score says more than the empty ones next to it.
      expect(scoreState({ ...full, creativity: wrong, understanding: '' }, rubric)).toEqual({
        kind: 'invalid',
      });
    }
    const empty = { creativity: '', technicalQuality: '', understanding: '', responsibleAi: '' };
    expect(scoreState(empty, rubric)).toEqual({ kind: 'incomplete' });
  });
});

describe('the decision', () => {
  it('starts on approve when it is allowed, else on modify', () => {
    expect(initialDecision(null)).toBe('approve');
    expect(initialDecision('flagged')).toBe('modify');
  });

  it('sends scores with modify only, and each decision passes the schema', () => {
    const criteria = { creativity: 1, technicalQuality: 2, understanding: 3, responsibleAi: 4 };
    for (const decision of ['approve', 'modify', 'return'] as const) {
      const input = toReviewInput({ submissionId: ID, decision, criteria, feedback: 'Good.' });
      expect(input.criteria).toEqual(decision === 'modify' ? criteria : null);
      expect(parseInput(reviewInputSchema, input).success).toBe(true);
    }
  });

  it.each([
    ['decision', 'decision'],
    ['feedback', 'feedback'],
    ['criteria', 'criteria'],
    ['criteria.creativity', 'creativity'],
    ['criteria.responsibleAi', 'responsibleAi'],
    ['criteria.nonsense', null],
    ['submissionId', null],
    ['_form', null],
  ])('routes the error path %s to %s', (path, field) => {
    expect(reviewFieldOf(path)).toBe(field);
  });
});
