import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import {
  choose,
  currentAttempt,
  hiddenReason,
  INITIAL_RUNNER_STATE,
  isAnswered,
  own,
  questionOrder,
  quizTitleId,
  reviewRows,
  rewardView,
  runnerReducer,
  shortPrompt,
  shouldToastXp,
  startOption,
  toggle,
  toSubmission,
  unansweredCount,
  write,
  type Draft,
  type RunnerState,
} from '@/components/quiz/quiz-model';
import type { QuizAttemptResult, QuizQuestion } from '@/types';
import { attempt, badge, outcome, quiz } from './services-fixtures';

// WS-C: the pure model of the quiz runner and the attempt reviews (spec 4.2), and the hygiene of
// the `quiz` catalogs (ARCHITECTURE.md 10.5).

function question(
  id: string,
  type: QuizQuestion['type'],
  optionIds: string[] = [],
  points = 1,
): QuizQuestion {
  return {
    id,
    type,
    points,
    translations: { en: { prompt: `Prompt ${id}` }, fr: { prompt: `Énoncé ${id}` } },
    options: optionIds.map((optionId) => ({
      id: optionId,
      translations: { en: { text: `Option ${optionId}` } },
    })),
  };
}

const MC = question('q1', 'multiple_choice', ['a', 'b', 'c'], 2);
const TF = question('q2', 'true_false', ['true', 'false'], 1);
const MA = question('q3', 'multiple_answer', ['x', 'y', 'z'], 2);
const SA = question('q4', 'short_answer', [], 1);
const QUIZ = quiz({ id: 'quiz-1', courseId: 'c1', questions: [MC, TF, MA, SA], questionCount: 4 });

function answer(selectedOptionIds: string[], text: string | null = null) {
  return { selectedOptionIds, text };
}

/** A deterministic `random` (a linear congruential generator). */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

function result(fields: Partial<QuizAttemptResult> = {}): QuizAttemptResult {
  return {
    attempt: attempt({ userUid: 'u1', courseId: 'c1', quizId: 'quiz-1' }),
    correctOptionIds: null,
    explanations: null,
    attemptsRemaining: null,
    gamification: outcome(),
    ...fields,
  };
}

describe('own and quizTitleId', () => {
  it('reads own keys only', () => {
    const map: Record<string, number> = { a: 1 };
    expect(own(map, 'a')).toBe(1);
    expect(own(map, 'constructor')).toBeUndefined();
    expect(own(map, '__proto__')).toBeUndefined();
  });

  it('gives a stable title id that is not a player anchor', () => {
    expect(quizTitleId('quiz-m1')).toBe(quizTitleId('quiz-m1'));
    expect(quizTitleId('quiz-m1')).not.toBe(quizTitleId('quiz-m2'));
    for (const id of ['quiz-m1', 'block-1', 'stage-learn']) {
      expect(quizTitleId(id)).not.toMatch(/^(block|stage)-/);
    }
  });
});

describe('questionOrder', () => {
  const ids = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'];
  const many = quiz({
    id: 'q',
    courseId: 'c1',
    questions: ids.map((id) => question(id, 'short_answer')),
  });

  it('keeps the authored order without shuffling', () => {
    expect(questionOrder(many, seeded(1))).toEqual(ids);
  });

  it('shuffles into another permutation of the same ids', () => {
    const shuffled = questionOrder({ ...many, shuffleQuestions: true }, seeded(7));
    expect(shuffled).not.toEqual(ids);
    expect([...shuffled].sort()).toEqual(ids);
  });

  it('is always a permutation, even with a random of 0 or almost 1', () => {
    for (const value of [0, 0.999999, 1]) {
      const order = questionOrder({ ...many, shuffleQuestions: true }, () => value);
      expect([...order].sort()).toEqual(ids);
    }
  });
});

describe('answers in the draft', () => {
  it('isAnswered per question type', () => {
    expect(isAnswered(MC, undefined)).toBe(false);
    expect(isAnswered(MC, answer([]))).toBe(false);
    expect(isAnswered(MC, answer(['a']))).toBe(true);
    expect(isAnswered(MC, answer(['a', 'b']))).toBe(false);
    expect(isAnswered(MC, answer(['nope']))).toBe(false);
    expect(isAnswered(TF, answer(['false']))).toBe(true);
    expect(isAnswered(MA, answer([]))).toBe(false);
    expect(isAnswered(MA, answer(['x']))).toBe(true);
    expect(isAnswered(MA, answer(['x', 'z']))).toBe(true);
    expect(isAnswered(MA, answer(['nope']))).toBe(false);
    expect(isAnswered(SA, answer([], ''))).toBe(false);
    expect(isAnswered(SA, answer([], '  '))).toBe(false);
    expect(isAnswered(SA, answer([], null))).toBe(false);
    expect(isAnswered(SA, answer([], 'data'))).toBe(true);
  });

  it('choose replaces the single choice and ignores ids that are not options', () => {
    const once = choose({}, MC, 'a');
    expect(once).toEqual({ q1: answer(['a']) });
    expect(choose(once, MC, 'b')).toEqual({ q1: answer(['b']) });
    expect(choose(once, MC, 'nope')).toBe(once);
  });

  it('toggle keeps the option order and removes the entry with the last box', () => {
    let draft: Draft = toggle({}, MA, 'z', true);
    draft = toggle(draft, MA, 'x', true);
    expect(draft).toEqual({ q3: answer(['x', 'z']) });
    draft = toggle(draft, MA, 'x', false);
    expect(draft).toEqual({ q3: answer(['z']) });
    expect(toggle(draft, MA, 'z', false)).toEqual({});
  });

  it('write keeps the text as typed and removes the entry when empty', () => {
    const draft = write({}, SA, '  Data ');
    expect(draft).toEqual({ q4: answer([], '  Data ') });
    expect(write(draft, SA, '')).toEqual({});
  });

  it('keeps an id such as __proto__ as an ordinary entry', () => {
    const odd = question('__proto__', 'short_answer');
    const draft = write({}, odd, 'x');
    expect(Object.hasOwn(draft, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(draft)).toBe(Object.prototype);
  });
});

describe('toSubmission', () => {
  it('sends the answered questions of the quiz only, normalized', () => {
    const draft: Draft = {
      q1: answer(['ghost', 'b']),
      q2: answer([]),
      q3: answer(['z', 'ghost', 'x'], 'ignored'),
      q4: answer(['a'], `  ${'d'.repeat(600)}  `),
      unknown: answer(['a']),
    };
    const sent = toSubmission(QUIZ, draft);
    expect(Object.keys(sent)).toEqual(['q1', 'q3', 'q4']);
    expect(sent.q1).toEqual(answer(['b']));
    expect(sent.q3).toEqual(answer(['x', 'z']));
    expect(sent.q4).toEqual(answer([], 'd'.repeat(500)));
  });

  it('trims a short answer and leaves out a blank one', () => {
    expect(toSubmission(QUIZ, { q4: answer([], '  Data  ') })).toEqual({
      q4: answer([], 'Data'),
    });
    expect(toSubmission(QUIZ, { q4: answer([], '   ') })).toEqual({});
  });

  it('counts the questions still without an answer', () => {
    const order = ['q3', 'q1', 'q4', 'q2'];
    expect(unansweredCount(QUIZ, order, {})).toBe(4);
    expect(unansweredCount(QUIZ, order, { q1: answer(['a']), q4: answer([], 'x') })).toBe(2);
    expect(unansweredCount(QUIZ, [...order, 'gone'], {})).toBe(4);
  });

  it('shortens a long prompt to one line', () => {
    expect(shortPrompt('Short\nprompt')).toBe('Short prompt');
    const long = shortPrompt('word '.repeat(40));
    expect(Array.from(long)).toHaveLength(80);
    expect(long.endsWith('…')).toBe(true);
  });
});

describe('startOption and currentAttempt', () => {
  const passed = { passed: true };
  const failed = { passed: false };
  const base = { readOnly: false, questionCount: 4, latest: null, remaining: null };

  it('covers every branch, read-only first', () => {
    expect(startOption({ ...base, readOnly: true, questionCount: 0, remaining: 0 })).toEqual({
      kind: 'none',
      reason: 'readOnly',
    });
    expect(startOption({ ...base, questionCount: 0, remaining: 0 })).toEqual({
      kind: 'none',
      reason: 'noQuestions',
    });
    expect(startOption({ ...base, remaining: 0 })).toEqual({
      kind: 'none',
      reason: 'noAttemptsLeft',
    });
    expect(startOption({ ...base, latest: failed, remaining: 0 })).toEqual({
      kind: 'none',
      reason: 'noAttemptsLeft',
    });
    expect(startOption(base)).toEqual({ kind: 'start' });
    expect(startOption({ ...base, remaining: 2 })).toEqual({ kind: 'start' });
    expect(startOption({ ...base, latest: failed, remaining: 1 })).toEqual({ kind: 'retry' });
    expect(startOption({ ...base, latest: passed })).toEqual({ kind: 'retake' });
  });

  it('prefers the runner result unless the page already has a newer attempt', () => {
    const second = attempt({ userUid: 'u1', courseId: 'c1', quizId: 'quiz-1', attemptNumber: 2 });
    const third = attempt({ userUid: 'u1', courseId: 'c1', quizId: 'quiz-1', attemptNumber: 3 });
    const fresh = result({ attempt: second, attemptsRemaining: 1 });

    expect(currentAttempt(null, 2, null)).toEqual({ latest: null, remaining: 2 });
    expect(currentAttempt(null, 2, fresh)).toEqual({ latest: second, remaining: 1 });
    expect(currentAttempt(second, 1, fresh)).toEqual({ latest: second, remaining: 1 });
    expect(currentAttempt(third, 0, fresh)).toEqual({ latest: third, remaining: 0 });
  });
});

describe('hiddenReason, rewardView and shouldToastXp', () => {
  it('hides answers only when the server sent no results', () => {
    expect(hiddenReason('never', { results: {} })).toBeNull();
    expect(hiddenReason('never', { results: null })).toBe('never');
    expect(hiddenReason('after_pass', { results: null })).toBe('after_pass');
    expect(hiddenReason('after_attempt', { results: null })).toBe('after_pass');
  });

  const failedAttempt = attempt({ userUid: 'u1', courseId: 'c1', quizId: 'q', passed: false });

  it('has no rewards and no toast for a failed attempt', () => {
    const view = rewardView(result({ attempt: failedAttempt, gamification: null }), 100);
    expect(view).toBeNull();
    expect(shouldToastXp(view)).toBe(false);
  });

  it('says the rewards are on their way when the handler failed', () => {
    const view = rewardView(result({ gamification: null }), 100);
    expect(view).toEqual({ xp: 0, leveledUp: false, level: null, badges: [], note: 'pending' });
    expect(shouldToastXp(view)).toBe(false);
  });

  it('toasts the XP of a first pass, with the new level', () => {
    const view = rewardView(
      result({ gamification: outcome({ xpAwarded: 100, leveledUp: true, level: 2 }) }),
      100,
    );
    expect(view).toEqual({ xp: 100, leveledUp: true, level: 2, badges: [], note: null });
    expect(shouldToastXp(view)).toBe(true);
  });

  it('notes a repeat pass, without a toast', () => {
    const view = rewardView(result({ gamification: outcome({ xpAwarded: 0 }) }), 100);
    expect(view?.note).toBe('alreadyEarned');
    expect(shouldToastXp(view)).toBe(false);
    expect(rewardView(result({ gamification: outcome({ xpAwarded: 0 }) }), 0)?.note).toBeNull();
  });

  it('carries the new badges', () => {
    const detective = badge({ id: 'data-detective' });
    const view = rewardView(
      result({ gamification: outcome({ xpAwarded: 125, newBadges: [detective] }) }),
      100,
    );
    expect(view?.badges).toEqual([detective]);
    expect(view?.note).toBeNull();
  });
});

describe('reviewRows', () => {
  const graded = attempt({
    userUid: 'u1',
    courseId: 'c1',
    quizId: 'quiz-1',
    answers: {
      q1: answer(['b']),
      q2: answer(['true']),
      q3: answer(['x', 'gone']),
      q4: answer([], 'banana'),
      old: answer([], 'kept'),
    },
    results: {
      q1: { correct: false, pointsAwarded: 0 },
      q2: { correct: true, pointsAwarded: 1 },
      q3: { correct: false, pointsAwarded: 0 },
      q4: { correct: false, pointsAwarded: 0 },
      old: { correct: true, pointsAwarded: 3 },
    },
  });
  const base = { quiz: QUIZ, attempt: graded, correctOptionIds: null, explanations: null };

  it('is empty while the results are hidden', () => {
    expect(reviewRows({ ...base, attempt: { ...graded, results: null }, locale: 'en' })).toEqual(
      [],
    );
  });

  it('lists the questions in authored order, then the ones the quiz no longer has', () => {
    const rows = reviewRows({ ...base, locale: 'fr' });
    expect(rows.map((row) => [row.number, row.questionId, row.status])).toEqual([
      [1, 'q1', 'graded'],
      [2, 'q2', 'graded'],
      [3, 'q3', 'graded'],
      [4, 'q4', 'graded'],
      [5, 'old', 'removed'],
    ]);
    expect(rows[0]).toMatchObject({
      type: 'multiple_choice',
      prompt: 'Énoncé q1',
      correct: false,
      pointsAwarded: 0,
      points: 2,
      answered: true,
      strayAnswer: false,
      explanation: null,
    });
    expect(rows[0]!.options).toEqual([
      { id: 'a', text: 'Option a', selected: false, correct: null },
      { id: 'b', text: 'Option b', selected: true, correct: null },
      { id: 'c', text: 'Option c', selected: false, correct: null },
    ]);
    expect(rows[2]!.strayAnswer).toBe(true);
    expect(rows[3]).toMatchObject({ options: [], textAnswer: 'banana', type: 'short_answer' });
    expect(rows[4]).toMatchObject({
      type: null,
      prompt: null,
      correct: null,
      textAnswer: 'kept',
      pointsAwarded: 3,
      points: null,
    });
  });

  it('follows the play order: unknown ids skipped, missing questions appended', () => {
    const rows = reviewRows({ ...base, locale: 'en', order: ['q3', 'nope', 'q1'] });
    expect(rows.slice(0, 4).map((row) => row.questionId)).toEqual(['q3', 'q1', 'q2', 'q4']);
    expect(rows.map((row) => row.number)).toEqual([1, 2, 3, 4, 5]);
  });

  it('marks a question added after the attempt', () => {
    const later = { ...QUIZ, questions: [...QUIZ.questions, question('q5', 'true_false')] };
    const row = reviewRows({ ...base, quiz: later, locale: 'en' }).find(
      (candidate) => candidate.questionId === 'q5',
    );
    expect(row).toMatchObject({ status: 'notInAttempt', correct: null, answered: false });
  });

  it('gives prompt-less graded rows without the quiz', () => {
    const rows = reviewRows({ ...base, quiz: null, locale: 'en' });
    expect(rows.map((row) => row.questionId)).toEqual(['old', 'q1', 'q2', 'q3', 'q4']);
    expect(rows.every((row) => row.status === 'graded' && row.prompt === null)).toBe(true);
    expect(rows.find((row) => row.questionId === 'q4')).toMatchObject({
      textAnswer: 'banana',
      correct: false,
    });
  });

  it('shows the right options and explanations only when the server sent them', () => {
    const rows = reviewRows({
      ...base,
      correctOptionIds: { q1: ['a'], q3: ['x', 'z'] },
      explanations: { q1: 'Because A.', q2: '  ' },
      locale: 'en',
    });
    expect(rows[0]!.options.map((option) => option.correct)).toEqual([true, false, false]);
    expect(rows[1]!.options.map((option) => option.correct)).toEqual([null, null]);
    expect(rows[0]!.explanation).toBe('Because A.');
    expect(rows[1]!.explanation).toBeNull();
  });

  it('reads id-keyed records with own()', () => {
    const odd = question('constructor', 'true_false', ['true', 'false']);
    const rows = reviewRows({
      quiz: { ...QUIZ, questions: [odd] },
      attempt: { ...graded, answers: {}, results: {} },
      correctOptionIds: {},
      explanations: {},
      locale: 'en',
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ status: 'notInAttempt', answered: false, explanation: null });
    expect(rows[0]!.options.map((option) => option.correct)).toEqual([null, null]);
  });

  it('keeps an empty true/false text empty (the component shows True / False)', () => {
    const bare: QuizQuestion = {
      ...question('tf', 'true_false', ['true', 'false']),
      options: [
        { id: 'true', translations: { en: { text: '' } } },
        { id: 'false', translations: { en: { text: '' } } },
      ],
    };
    const rows = reviewRows({
      ...base,
      quiz: { ...QUIZ, questions: [bare] },
      attempt: { ...graded, results: { tf: { correct: true, pointsAwarded: 1 } } },
      locale: 'en',
    });
    expect(rows[0]!.options.map((option) => option.text)).toEqual(['', '']);
  });
});

describe('runnerReducer', () => {
  const started = runnerReducer(INITIAL_RUNNER_STATE, { type: 'start', order: ['q1', 'q2', 'q3'] });

  it('starts at the first question with a clean draft', () => {
    const dirty: RunnerState = {
      ...started,
      phase: 'result',
      index: 2,
      draft: { q1: answer(['a']) },
      result: result(),
      returnToReview: true,
    };
    expect(runnerReducer(dirty, { type: 'start', order: ['q2', 'q1'] })).toEqual({
      phase: 'question',
      order: ['q2', 'q1'],
      index: 0,
      draft: {},
      result: null,
      returnToReview: false,
    });
  });

  it('walks forward to the review step after the last question', () => {
    let state = runnerReducer(started, { type: 'next' });
    expect(state).toMatchObject({ phase: 'question', index: 1 });
    state = runnerReducer(runnerReducer(state, { type: 'next' }), { type: 'next' });
    expect(state).toMatchObject({ phase: 'review', index: 2 });
  });

  it('goes back one question, never before the first, and from review to the last', () => {
    expect(runnerReducer(started, { type: 'back' })).toBe(started);
    const second = runnerReducer(started, { type: 'next' });
    expect(runnerReducer(second, { type: 'back' })).toMatchObject({ index: 0 });
    const review = { ...started, phase: 'review' as const, index: 0 };
    expect(runnerReducer(review, { type: 'back' })).toMatchObject({
      phase: 'question',
      index: 2,
      returnToReview: false,
    });
  });

  it('changes one answer from the review step and returns straight to it', () => {
    const review = { ...started, phase: 'review' as const, index: 2 };
    const editing = runnerReducer(review, { type: 'edit', index: 0 });
    expect(editing).toMatchObject({ phase: 'question', index: 0, returnToReview: true });
    expect(runnerReducer(editing, { type: 'next' })).toMatchObject({
      phase: 'review',
      returnToReview: false,
    });
    expect(runnerReducer(review, { type: 'edit', index: 9 })).toMatchObject({ index: 2 });
    expect(runnerReducer(review, { type: 'edit', index: -3 })).toMatchObject({ index: 0 });
    expect(runnerReducer(started, { type: 'edit', index: 1 })).toBe(started);
  });

  it('replaces the draft, shows the result and resets after a conflict', () => {
    const answered = runnerReducer(started, { type: 'answer', draft: { q1: answer(['a']) } });
    expect(answered.draft).toEqual({ q1: answer(['a']) });
    const fresh = result();
    const shown = runnerReducer(
      { ...answered, phase: 'review' },
      { type: 'submitted', result: fresh },
    );
    expect(shown).toMatchObject({ phase: 'result', result: fresh });
    expect(runnerReducer(shown, { type: 'reset' })).toEqual(INITIAL_RUNNER_STATE);
  });
});

// --- Catalog hygiene (10.5) ----------------------------------------------------------------

const MESSAGES_DIR = path.join(import.meta.dirname, '..', '..', 'src', 'messages');

function leaves(node: unknown, prefix = ''): [string, string][] {
  if (typeof node === 'string') return [[prefix, node]];
  if (typeof node !== 'object' || node === null) return [];
  return Object.entries(node).flatMap(([key, value]) =>
    leaves(value, prefix ? `${prefix}.${key}` : key),
  );
}

/** Braces open and close in pairs, at any depth (plural branches nest arguments). */
function balanced(value: string): boolean {
  let depth = 0;
  for (const char of value) {
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
}

function rawCatalog(locale: string): string {
  return readFileSync(path.join(MESSAGES_DIR, locale, 'quiz.json'), 'utf8');
}

// Every argument any `quiz` message takes, so each message can be formatted.
const VALUES = {
  count: 2,
  percent: 70,
  remaining: 1,
  max: 2,
  xp: 100,
  number: 3,
  total: 4,
  date: '15 Oct 2026, 10:00',
  score: 4,
  level: 2,
  awarded: 1,
  points: 2,
};

type Translate = (key: string, values?: Record<string, string | number>) => string;

// The raw JSON catalog is checked as data, so the app's typed `AppConfig` does not apply.
const translator = createTranslator as unknown as (config: {
  locale: string;
  messages: Record<string, unknown>;
  namespace: string;
  onError: (error: Error) => void;
}) => Translate;

describe.each(['en', 'fr'])('quiz catalog (%s)', (locale) => {
  const catalog: unknown = JSON.parse(rawCatalog(locale));
  const messages = leaves(catalog);
  const strict = () =>
    translator({
      locale,
      messages: { quiz: catalog },
      namespace: 'quiz',
      onError: (error) => {
        throw error;
      },
    });

  it('uses typographic apostrophes and balanced braces', () => {
    for (const [key, value] of messages) {
      expect(value, key).not.toMatch(/'/);
      expect(balanced(value), key).toBe(true);
    }
  });

  it('has the same keys as the English source', () => {
    const source = leaves(JSON.parse(rawCatalog('en'))).map(([key]) => key);
    expect(messages.map(([key]) => key).sort()).toEqual(source.sort());
  });

  it('formats every message as ICU without an error', () => {
    const errors: string[] = [];
    const t = translator({
      locale,
      messages: { quiz: catalog },
      namespace: 'quiz',
      onError: (error) => errors.push(error.message),
    });
    for (const [key] of messages) {
      // A missing key or a failed format comes back as the key's path.
      expect(t(key, VALUES), key).not.toBe(`quiz.${key}`);
    }
    expect(errors).toEqual([]);
  });

  it('agrees the counts with their numbers', () => {
    const t = strict();
    const nb = String.fromCharCode(0xa0);
    const expected: Record<string, string[]> = {
      en: [
        '1 question',
        '4 questions',
        '6 of 1 point',
        '6 of 6 points',
        '1 question has no answer. A question without an answer counts as wrong.',
        '2 questions have no answer. A question without an answer counts as wrong.',
        'No attempt left out of 2',
        '1 attempt left out of 2',
      ],
      fr: [
        '1 question',
        '4 questions',
        '6 sur 1 point',
        '6 sur 6 points',
        '1 question n’a pas de réponse. Une question sans réponse compte comme fausse.',
        '2 questions n’ont pas de réponse. Une question sans réponse compte comme fausse.',
        'Aucune tentative restante sur 2',
        '1 tentative restante sur 2',
      ],
    };
    expect([
      t('facts.questions', { count: 1 }),
      t('facts.questions', { count: 4 }),
      t('result.points', { score: 6, max: 1 }),
      t('result.points', { score: 6, max: 6 }),
      t('review.unansweredWarning', { count: 1 }),
      t('review.unansweredWarning', { count: 2 }),
      t('facts.attemptsLeft', { remaining: 0, max: 2 }),
      t('facts.attemptsLeft', { remaining: 1, max: 2 }),
    ]).toEqual(expected[locale]);
    if (locale === 'fr') {
      expect(t('facts.passMark', { percent: 70 })).toBe(`Seuil de réussite${nb}: 70${nb}%`);
      expect(t('result.passedTitle')).toBe(`Quiz réussi${nb}!`);
    }
  });

  it('writes French no-break spaces as the visible escape', () => {
    if (locale !== 'fr') return;
    for (const [key, value] of messages) {
      expect(value, key).not.toMatch(/\S [?!:;»%]/);
      expect(value, key).not.toMatch(/« /);
    }
    const raw = rawCatalog(locale);
    expect(raw.includes(String.fromCharCode(0xa0))).toBe(false);
    expect(raw).toContain('\\u00a0');
  });
});
