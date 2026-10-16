import { pickTranslation } from '@/lib/i18n/content';
import { CONTENT_LIMITS } from '@/lib/limits';
import type { Badge } from '@/types/gamification';
import type {
  QuestionType,
  Quiz,
  QuizAnswer,
  QuizAttempt,
  QuizAttemptResult,
  QuizQuestion,
  RevealAnswers,
} from '@/types/quiz';

// What the quiz runner and the attempt reviews derive from a quiz and its attempts. Pure (no
// React, no DOM), so the unit tests cover it. The runner never computes correctness: every mark
// it shows comes from the attempt's `results` and the action's `correctOptionIds`.

/** A record keyed by id, read without reaching the prototype (`constructor`, `__proto__`). */
export function own<T>(map: Record<string, T>, id: string): T | undefined {
  return Object.hasOwn(map, id) ? map[id] : undefined;
}

/**
 * The id of QuizBlock's title, which the runner focuses after a reset. It never starts with
 * `block-` or `stage-` (the lesson player's anchors); quiz ids are unique within a lesson.
 */
export function quizTitleId(quizId: string): string {
  return `quiz-${quizId}-title`;
}

/** The learner's answers so far, by question id. */
export type Draft = Record<string, QuizAnswer>;

/**
 * Question ids in play order: the authored order, or a fresh permutation (Fisher–Yates) when the
 * quiz shuffles its questions. Called from event handlers only, never during render.
 */
export function questionOrder(
  quiz: Pick<Quiz, 'questions' | 'shuffleQuestions'>,
  random: () => number = Math.random,
): string[] {
  const ids = quiz.questions.map((question) => question.id);
  if (!quiz.shuffleQuestions) return ids;
  for (let index = ids.length - 1; index > 0; index -= 1) {
    const other = Math.min(index, Math.floor(random() * (index + 1)));
    [ids[index], ids[other]] = [ids[other]!, ids[index]!];
  }
  return ids;
}

function isSingleChoice(question: QuizQuestion): boolean {
  return question.type === 'multiple_choice' || question.type === 'true_false';
}

/** The selected ids that are options of the question, in the question's option order. */
function optionIdsIn(question: QuizQuestion, selected: readonly string[]): string[] {
  return question.options.map((option) => option.id).filter((id) => selected.includes(id));
}

export function isAnswered(question: QuizQuestion, answer: QuizAnswer | undefined): boolean {
  if (answer === undefined) return false;
  if (question.type === 'short_answer') return (answer.text ?? '').trim() !== '';
  const valid = optionIdsIn(question, answer.selectedOptionIds);
  return isSingleChoice(question) ? valid.length === 1 : valid.length > 0;
}

function withAnswer(draft: Draft, questionId: string, answer: QuizAnswer | null): Draft {
  // fromEntries defines own keys, so an id such as `__proto__` stays an ordinary entry.
  const rest = Object.entries(draft).filter(([id]) => id !== questionId);
  return Object.fromEntries(answer === null ? rest : [...rest, [questionId, answer]]);
}

/** Single choice (multiple_choice, true_false): the chosen option replaces the previous one. */
export function choose(draft: Draft, question: QuizQuestion, optionId: string): Draft {
  if (!question.options.some((option) => option.id === optionId)) return draft;
  return withAnswer(draft, question.id, { selectedOptionIds: [optionId], text: null });
}

/** multiple_answer: ids kept in the question's option order; unchecking the last one clears it. */
export function toggle(
  draft: Draft,
  question: QuizQuestion,
  optionId: string,
  checked: boolean,
): Draft {
  const current = own(draft, question.id)?.selectedOptionIds ?? [];
  const next = checked ? [...current, optionId] : current.filter((id) => id !== optionId);
  const ordered = optionIdsIn(question, next);
  return withAnswer(
    draft,
    question.id,
    ordered.length === 0 ? null : { selectedOptionIds: ordered, text: null },
  );
}

/** short_answer: kept as typed (trimmed on submit); an empty field clears the answer. */
export function write(draft: Draft, question: QuizQuestion, text: string): Draft {
  return withAnswer(draft, question.id, text === '' ? null : { selectedOptionIds: [], text });
}

/** The payload of submitQuizAttemptAction: the answered questions of this quiz only. */
export function toSubmission(quiz: Quiz, draft: Draft): Record<string, QuizAnswer> {
  const entries: [string, QuizAnswer][] = [];
  for (const question of quiz.questions) {
    const answer = own(draft, question.id);
    if (answer === undefined || !isAnswered(question, answer)) continue;
    entries.push([
      question.id,
      question.type === 'short_answer'
        ? {
            selectedOptionIds: [],
            text: (answer.text ?? '').trim().slice(0, CONTENT_LIMITS.quizAnswerChars),
          }
        : { selectedOptionIds: optionIdsIn(question, answer.selectedOptionIds), text: null },
    ]);
  }
  return Object.fromEntries(entries);
}

function questionById(quiz: Pick<Quiz, 'questions'>, id: string): QuizQuestion | undefined {
  return quiz.questions.find((question) => question.id === id);
}

/** The questions of `order` that are still without an answer. */
export function unansweredCount(quiz: Quiz, order: readonly string[], draft: Draft): number {
  return order.filter((id) => {
    const question = questionById(quiz, id);
    return question !== undefined && !isAnswered(question, own(draft, id));
  }).length;
}

/** A prompt shortened for the review list: one line of at most `max` characters. */
export function shortPrompt(prompt: string, max = 80): string {
  const flat = prompt.replace(/\s+/g, ' ').trim();
  const chars = Array.from(flat);
  return chars.length <= max
    ? flat
    : `${chars
        .slice(0, max - 1)
        .join('')
        .trimEnd()}…`;
}

export type StartOption =
  | { kind: 'start' | 'retry' | 'retake' }
  | { kind: 'none'; reason: 'readOnly' | 'noQuestions' | 'noAttemptsLeft' };

/** What the intro and the result offer: start, try again, take again, or nothing (and why). */
export function startOption(input: {
  readOnly: boolean;
  questionCount: number;
  latest: Pick<QuizAttempt, 'passed'> | null;
  remaining: number | null;
}): StartOption {
  if (input.readOnly) return { kind: 'none', reason: 'readOnly' };
  if (input.questionCount === 0) return { kind: 'none', reason: 'noQuestions' };
  if (input.remaining === 0) return { kind: 'none', reason: 'noAttemptsLeft' };
  if (input.latest === null) return { kind: 'start' };
  return { kind: input.latest.passed ? 'retake' : 'retry' };
}

/** The newer of the page's latest attempt and the result this runner received (a refresh may lag). */
export function currentAttempt(
  latest: QuizAttempt | null,
  remaining: number | null,
  result: QuizAttemptResult | null,
): { latest: QuizAttempt | null; remaining: number | null } {
  if (result !== null && result.attempt.attemptNumber >= (latest?.attemptNumber ?? 0)) {
    return { latest: result.attempt, remaining: result.attemptsRemaining };
  }
  return { latest, remaining };
}

export type HiddenReason = 'after_pass' | 'never';

/** Why the answers of an attempt are hidden, or null when the server revealed them. */
export function hiddenReason(
  revealAnswers: RevealAnswers,
  attempt: Pick<QuizAttempt, 'results'>,
): HiddenReason | null {
  if (attempt.results !== null) return null;
  return revealAnswers === 'never' ? 'never' : 'after_pass';
}

export interface RewardView {
  xp: number;
  leveledUp: boolean;
  level: number | null;
  badges: Badge[];
  note: 'pending' | 'alreadyEarned' | null;
}

/** The rewards of a passed attempt; null for a failed one. */
export function rewardView(result: QuizAttemptResult, xpReward: number): RewardView | null {
  if (!result.attempt.passed) return null;
  const outcome = result.gamification;
  if (outcome === null) {
    return { xp: 0, leveledUp: false, level: null, badges: [], note: 'pending' };
  }
  const badges = outcome.newBadges;
  const xp = outcome.xpAwarded;
  return {
    xp,
    leveledUp: outcome.leveledUp,
    level: outcome.level,
    badges,
    note: xp === 0 && xpReward > 0 && badges.length === 0 ? 'alreadyEarned' : null,
  };
}

/** The XP toast appears only when this attempt earned XP. */
export function shouldToastXp(view: RewardView | null): view is RewardView {
  return view !== null && view.xp > 0;
}

export interface ReviewOption {
  id: string;
  text: string;
  selected: boolean;
  /** null unless the server sent the right answers (the learner's fresh result). */
  correct: boolean | null;
}

export interface ReviewRow {
  questionId: string;
  /** 1-based position in the rows. */
  number: number;
  status: 'graded' | 'notInAttempt' | 'removed';
  /** null: removed, or the quiz is not available. */
  type: QuestionType | null;
  prompt: string | null;
  options: ReviewOption[];
  textAnswer: string | null;
  /** The attempt holds an answer for this question. */
  answered: boolean;
  /** A selected id is no longer an option of the question (edited since the attempt). */
  strayAnswer: boolean;
  correct: boolean | null;
  pointsAwarded: number | null;
  /** The question's current points. */
  points: number | null;
  explanation: string | null;
}

function hasAnswer(answer: QuizAnswer | undefined): boolean {
  if (answer === undefined) return false;
  return answer.selectedOptionIds.length > 0 || (answer.text ?? '').trim() !== '';
}

/** Natural order of ids (`q2` before `q10`), for rows the quiz cannot order. */
function byNaturalId(a: string, b: string): number {
  return a.localeCompare(b, 'en', { numeric: true });
}

/** `order`'s questions first (unknown ids skipped), then the questions it misses, authored. */
function orderedQuestions(questions: QuizQuestion[], order?: readonly string[]): QuizQuestion[] {
  if (order === undefined) return questions;
  const byId = new Map(questions.map((question) => [question.id, question]));
  const placed = new Set<string>();
  const ordered: QuizQuestion[] = [];
  for (const id of order) {
    const question = byId.get(id);
    if (question === undefined || placed.has(id)) continue;
    placed.add(id);
    ordered.push(question);
  }
  return [...ordered, ...questions.filter((question) => !placed.has(question.id))];
}

type RowDraft = Omit<ReviewRow, 'number'>;

function bareRow(
  questionId: string,
  status: ReviewRow['status'],
  attempt: QuizAttempt,
  explanation: string | null,
): RowDraft {
  const answer = own(attempt.answers, questionId);
  const result = attempt.results === null ? undefined : own(attempt.results, questionId);
  return {
    questionId,
    status,
    type: null,
    prompt: null,
    options: [],
    textAnswer: answer?.text ?? null,
    answered: hasAnswer(answer),
    strayAnswer: false,
    correct: status === 'graded' ? (result?.correct ?? null) : null,
    pointsAwarded: result?.pointsAwarded ?? null,
    points: null,
    explanation,
  };
}

/**
 * The per-question rows of an attempt's review; [] while the attempt's results are hidden.
 * With the quiz: one row per question (in `order` when given), then one per answered question
 * the quiz no longer has. Without it (a teacher who cannot read the quiz): one prompt-less row
 * per result.
 */
export function reviewRows(input: {
  quiz: Quiz | null;
  attempt: QuizAttempt;
  correctOptionIds: Record<string, string[]> | null;
  explanations: Record<string, string> | null;
  locale: string;
  order?: readonly string[];
}): ReviewRow[] {
  const { quiz, attempt, correctOptionIds, explanations, locale } = input;
  const results = attempt.results;
  if (results === null) return [];
  const explanationOf = (id: string) => {
    const text = explanations === null ? undefined : own(explanations, id);
    return text === undefined || text.trim() === '' ? null : text;
  };

  const rows: RowDraft[] = [];
  if (quiz === null) {
    for (const id of Object.keys(results).sort(byNaturalId)) {
      rows.push(bareRow(id, 'graded', attempt, explanationOf(id)));
    }
  } else {
    for (const question of orderedQuestions(quiz.questions, input.order)) {
      const answer = own(attempt.answers, question.id);
      const result = own(results, question.id);
      const selected = answer?.selectedOptionIds ?? [];
      const choice = question.type !== 'short_answer';
      const right = correctOptionIds === null ? undefined : own(correctOptionIds, question.id);
      rows.push({
        questionId: question.id,
        status: result === undefined ? 'notInAttempt' : 'graded',
        type: question.type,
        prompt: pickTranslation(question.translations, locale, quiz.defaultLocale).prompt,
        options: choice
          ? question.options.map((option) => ({
              id: option.id,
              text: pickTranslation(option.translations, locale, quiz.defaultLocale).text,
              selected: selected.includes(option.id),
              correct: right === undefined ? null : right.includes(option.id),
            }))
          : [],
        textAnswer: choice ? null : (answer?.text ?? null),
        answered: hasAnswer(answer),
        strayAnswer:
          choice && selected.some((id) => !question.options.some((option) => option.id === id)),
        correct: result?.correct ?? null,
        pointsAwarded: result?.pointsAwarded ?? null,
        points: question.points,
        explanation: explanationOf(question.id),
      });
    }
    const known = new Set(quiz.questions.map((question) => question.id));
    for (const id of Object.keys(results).sort(byNaturalId)) {
      if (!known.has(id)) rows.push(bareRow(id, 'removed', attempt, null));
    }
  }
  return rows.map((row, index) => ({ ...row, number: index + 1 }));
}

// --- The runner's state machine (QuizRunner uses useReducer with it) -------------------------

export type RunnerPhase = 'intro' | 'question' | 'review' | 'result';

export interface RunnerState {
  phase: RunnerPhase;
  /** Question ids in play order. */
  order: string[];
  /** The question shown, in `order`. */
  index: number;
  draft: Draft;
  result: QuizAttemptResult | null;
  /** True while one answer is changed from the review step: Next goes straight back to it. */
  returnToReview: boolean;
}

export const INITIAL_RUNNER_STATE: RunnerState = {
  phase: 'intro',
  order: [],
  index: 0,
  draft: {},
  result: null,
  returnToReview: false,
};

export type RunnerEvent =
  | { type: 'start'; order: string[] }
  | { type: 'answer'; draft: Draft }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'edit'; index: number }
  | { type: 'submitted'; result: QuizAttemptResult }
  | { type: 'reset' };

function lastIndex(state: RunnerState): number {
  return Math.max(0, state.order.length - 1);
}

export function runnerReducer(state: RunnerState, event: RunnerEvent): RunnerState {
  switch (event.type) {
    case 'start':
      return { ...INITIAL_RUNNER_STATE, phase: 'question', order: event.order };
    case 'answer':
      return { ...state, draft: event.draft };
    case 'next':
      if (state.phase !== 'question') return state;
      if (state.returnToReview || state.index >= lastIndex(state)) {
        return { ...state, phase: 'review', returnToReview: false };
      }
      return { ...state, index: state.index + 1 };
    case 'back':
      if (state.phase === 'review') {
        return { ...state, phase: 'question', index: lastIndex(state), returnToReview: false };
      }
      if (state.phase !== 'question' || state.index === 0) return state;
      return { ...state, index: state.index - 1 };
    case 'edit':
      if (state.phase !== 'review') return state;
      return {
        ...state,
        phase: 'question',
        index: Math.min(Math.max(0, Math.trunc(event.index)), lastIndex(state)),
        returnToReview: true,
      };
    case 'submitted':
      return { ...state, phase: 'result', result: event.result, returnToReview: false };
    case 'reset':
      return INITIAL_RUNNER_STATE;
  }
}
