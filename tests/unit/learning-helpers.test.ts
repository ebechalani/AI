import { describe, expect, it } from 'vitest';
import { getChallengePhase } from '@/lib/learning/challenge-phase';
import { EMBED_HOSTS, toEmbedUrl, toVideoEmbedUrl } from '@/lib/learning/embed-allowlist';
import {
  getMissingForCompletion,
  isReadyForCompletion,
  responseLength,
  type LessonCompletionState,
} from '@/lib/learning/lesson-completion';
import { groupBlocksByStage, LESSON_STAGES } from '@/lib/learning/stages';
import { EMBED_HOSTS as DECLARED_EMBED_HOSTS } from '@/lib/limits';
import { isEmbeddableUrl } from '@/lib/schemas/course';
import { LESSON_STAGES as DECLARED_LESSON_STAGES, type LessonStage } from '@/types';

describe('lesson stages', () => {
  it('re-exports the one list of stages, in lesson-flow order', () => {
    expect(LESSON_STAGES).toBe(DECLARED_LESSON_STAGES);
    expect(LESSON_STAGES).toEqual([
      'discover',
      'learn',
      'watch',
      'try',
      'ask_ai',
      'build',
      'check',
      'reflect',
    ]);
  });

  it('groups blocks by stage, in stage order, sorted by position, leaving empty stages out', () => {
    const block = (id: string, stage: LessonStage, order: number) => ({ id, stage, order });
    const blocks = [
      block('quiz', 'check', 5),
      block('text-2', 'learn', 3),
      block('intro', 'discover', 0),
      block('text-1', 'learn', 1),
      block('reflection', 'reflect', 6),
    ];
    const groups = groupBlocksByStage(blocks);

    expect(groups.map((group) => [group.stage, group.blocks.map((item) => item.id)])).toEqual([
      ['discover', ['intro']],
      ['learn', ['text-1', 'text-2']],
      ['check', ['quiz']],
      ['reflect', ['reflection']],
    ]);
    expect(blocks.map((item) => item.id)).toEqual([
      'quiz',
      'text-2',
      'intro',
      'text-1',
      'reflection',
    ]);
    expect(groupBlocksByStage([])).toEqual([]);
  });
});

describe('getChallengePhase', () => {
  const challenge = { startAt: '2026-10-01T08:00:00.000Z', deadlineAt: '2026-10-31T20:00:00.000Z' };

  it('is upcoming before the start, open until the deadline, closed from the deadline on', () => {
    expect(getChallengePhase(challenge, '2026-10-01T07:59:59.999Z')).toBe('upcoming');
    expect(getChallengePhase(challenge, '2026-10-01T08:00:00.000Z')).toBe('open');
    expect(getChallengePhase(challenge, '2026-10-31T19:59:59.999Z')).toBe('open');
    expect(getChallengePhase(challenge, '2026-10-31T20:00:00.000Z')).toBe('closed');
    expect(getChallengePhase(challenge, '2027-01-01T00:00:00.000Z')).toBe('closed');
  });

  it('takes a Date or an ISO string, whatever its offset', () => {
    expect(getChallengePhase(challenge, new Date('2026-10-15T12:00:00.000Z'))).toBe('open');
    expect(getChallengePhase(challenge, '2026-10-01T10:30:00+03:00')).toBe('upcoming');
  });
});

describe('embed allow-list', () => {
  it('is exactly the list the Content-Security-Policy frames', () => {
    expect(EMBED_HOSTS).toBe(DECLARED_EMBED_HOSTS);
    expect(EMBED_HOSTS).toEqual(['www.youtube-nocookie.com', 'player.vimeo.com']);
  });

  const urls = [
    'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    'https://player.vimeo.com/video/76979871?h=abc',
    'http://player.vimeo.com/video/1',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://youtube-nocookie.com/embed/dQw4w9WgXcQ',
    'https://player.vimeo.com.evil.example/video/1',
    'https://evil.example/?u=https://player.vimeo.com/video/1',
    'https://player.vimeo.com:8443/video/1',
    'https://user:pw@player.vimeo.com/video/1',
    'javascript:alert(1)',
    '//player.vimeo.com/video/1',
    'not a url',
    '',
  ];

  it('passes an https URL on an allowed host and nothing else', () => {
    expect(urls.filter((url) => toEmbedUrl(url) !== null)).toEqual(urls.slice(0, 2));
    expect(toEmbedUrl(urls[1]!)).toBe('https://player.vimeo.com/video/76979871?h=abc');
  });

  it('agrees with the rule the course editor validates with', () => {
    for (const url of urls) expect(toEmbedUrl(url) !== null, url).toBe(isEmbeddableUrl(url));
  });

  it('builds the player URL of a YouTube or Vimeo video', () => {
    expect(toVideoEmbedUrl('youtube', 'dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    );
    expect(toVideoEmbedUrl('vimeo', '76979871')).toBe('https://player.vimeo.com/video/76979871');
    // An id cannot leave the player path or add parameters.
    expect(toVideoEmbedUrl('youtube', '../x?autoplay=1')).toBe(
      'https://www.youtube-nocookie.com/embed/..%2Fx%3Fautoplay%3D1',
    );
  });
});

describe('lesson completion', () => {
  const state = (overrides: Partial<LessonCompletionState> = {}): LessonCompletionState => ({
    lesson: { quizIds: ['quiz-1'], projectIds: ['project-1'], reflectionBlockIds: ['block-r'] },
    blocks: [
      { id: 'block-r', type: 'reflection', data: { minLength: 20 } },
      { id: 'block-q', type: 'quiz', data: { quizId: 'quiz-1' } },
    ],
    quizzes: { 'quiz-1': { maxAttempts: 3 } },
    enrollment: { quizSummary: {}, projectSummary: {} },
    responses: {},
    ...overrides,
  });
  const summary = (attempts: number, passed: boolean) => ({
    attempts,
    passed,
    bestPercent: passed ? 80 : 40,
    lastPercent: passed ? 80 : 40,
  });
  const response = (text: string) => ({ text, updatedAt: '2026-10-02T08:00:00.000Z' });

  it('lists everything a fresh lesson still needs', () => {
    const missing = getMissingForCompletion(state());
    expect(missing).toEqual({
      quizIds: ['quiz-1'],
      projectIds: ['project-1'],
      reflectionBlockIds: ['block-r'],
    });
    expect(isReadyForCompletion(missing)).toBe(false);
  });

  it('is ready when the quiz is passed, the project submitted and the reflection long enough', () => {
    const missing = getMissingForCompletion(
      state({
        enrollment: {
          quizSummary: { 'quiz-1': summary(2, true) },
          // Submitted is enough; the project does not have to be accepted.
          projectSummary: {
            'project-1': { attempts: 1, latestSubmissionId: 's-1', latestStatus: 'submitted' },
          },
        },
        responses: { 'block-r': response('I learned that models learn from data.') },
      }),
    );
    expect(missing).toEqual({ quizIds: [], projectIds: [], reflectionBlockIds: [] });
    expect(isReadyForCompletion(missing)).toBe(true);
  });

  it('lets a learner move on once the attempts of a quiz are used up', () => {
    const failed = (attempts: number, maxAttempts: number | null) =>
      getMissingForCompletion(
        state({
          quizzes: { 'quiz-1': { maxAttempts } },
          enrollment: { quizSummary: { 'quiz-1': summary(attempts, false) }, projectSummary: {} },
        }),
      ).quizIds;
    expect(failed(2, 3)).toEqual(['quiz-1']);
    expect(failed(3, 3)).toEqual([]);
    // Unlimited attempts: only passing counts.
    expect(failed(25, null)).toEqual(['quiz-1']);
  });

  it('measures a reflection without its surrounding whitespace', () => {
    const reflection = (text: string) =>
      getMissingForCompletion(state({ responses: { 'block-r': response(text) } }))
        .reflectionBlockIds;
    expect(reflection(`  short ${' '.repeat(40)}`)).toEqual(['block-r']);
    expect(reflection('x'.repeat(19))).toEqual(['block-r']);
    expect(reflection('x'.repeat(20))).toEqual([]);
    expect(responseLength('  two words \n')).toBe(9);
  });

  it('asks nothing of a reflection with no minimum length', () => {
    const missing = getMissingForCompletion(
      state({ blocks: [{ id: 'block-r', type: 'reflection', data: { minLength: 0 } }] }),
    );
    expect(missing.reflectionBlockIds).toEqual([]);
  });

  it('does not read inherited object members as summaries or responses', () => {
    const missing = getMissingForCompletion(
      state({
        lesson: {
          quizIds: ['constructor'],
          projectIds: ['toString'],
          reflectionBlockIds: ['valueOf'],
        },
        blocks: [{ id: 'valueOf', type: 'reflection', data: { minLength: 1 } }],
        quizzes: {},
      }),
    );
    expect(missing).toEqual({
      quizIds: ['constructor'],
      projectIds: ['toString'],
      reflectionBlockIds: ['valueOf'],
    });
  });

  it('is ready at once for a lesson with nothing to do', () => {
    const missing = getMissingForCompletion(
      state({ lesson: { quizIds: [], projectIds: [], reflectionBlockIds: [] }, blocks: [] }),
    );
    expect(isReadyForCompletion(missing)).toBe(true);
  });
});
