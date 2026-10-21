import { XP_RULES } from '@/lib/gamification/rules';
import type { Locale, Localized } from '@/types/common';
import type { QuizInput, QuizOptionInput, QuizQuestionInput } from '@/types/inputs';
import type { QuestionType, RevealAnswers } from '@/types/quiz';
import { linesToList, numberOrNull, requiredNumber } from './course-model';
import {
  EDITABLE_LOCALES,
  extraLocales,
  localeOfPath,
  textDraftFrom,
  textDraftTo,
  type TextDraft,
  type TranslationState,
} from './translations';

// The quiz editor's draft (6.4). Option marks follow option keys, so reordering or removing
// options keeps the right answers marked.

/** The default true/false option texts in every editable locale (from both catalogs). */
export type TrueFalseTexts = Record<Locale, { true: string; false: string }>;

export interface OptionDraft {
  key: string;
  id: string | null;
  text: Record<Locale, string>;
  extra: Localized<unknown>;
}

export interface QuestionDraft {
  /** React key and anchor; = id when there is one. */
  key: string;
  id: string | null;
  type: QuestionType;
  points: string;
  prompt: Record<Locale, string>;
  promptExtra: Localized<unknown>;
  options: OptionDraft[];
  /** Option keys. */
  correct: string[];
  /** Short answer: one accepted answer per line. */
  accepted: Record<Locale, string>;
  acceptedExtra: Localized<string[]>;
  explanation: Record<Locale, string>;
  explanationExtra: Localized<unknown>;
}

export type QuizTextField = 'title' | 'instructions';
export const QUIZ_TEXT_FIELDS: readonly QuizTextField[] = ['title', 'instructions'];

export interface QuizDraft {
  defaultLocale: Locale;
  text: TextDraft<QuizTextField>;
  extra: Localized<unknown>;
  passingScorePercent: string;
  /** '' = unlimited. */
  maxAttempts: string;
  xpReward: string;
  shuffleQuestions: boolean;
  revealAnswers: RevealAnswers;
  questions: QuestionDraft[];
}

export const DEFAULT_PASS_MARK = 70;

function perLocale(read: (locale: Locale) => string): Record<Locale, string> {
  const result = {} as Record<Locale, string>;
  for (const locale of EDITABLE_LOCALES) result[locale] = read(locale);
  return result;
}

function emptyText(): Record<Locale, string> {
  return perLocale(() => '');
}

function blank(value: string): boolean {
  return value.trim() === '';
}

function optionToDraft(option: QuizOptionInput, newKey: () => string): OptionDraft {
  return {
    key: option.id ?? newKey(),
    id: option.id,
    text: perLocale((locale) => option.translations[locale]?.text ?? ''),
    extra: extraLocales(option.translations),
  };
}

function questionToDraft(question: QuizQuestionInput, newKey: () => string): QuestionDraft {
  const options = question.options.map((option) => optionToDraft(option, newKey));
  return {
    key: question.id ?? newKey(),
    id: question.id,
    type: question.type,
    points: String(question.points),
    prompt: perLocale((locale) => question.translations[locale]?.prompt ?? ''),
    promptExtra: extraLocales(question.translations),
    options,
    correct: question.correctOptionIndexes.flatMap((index) => {
      const option = options[index];
      return option ? [option.key] : [];
    }),
    accepted: perLocale((locale) => (question.acceptedAnswers[locale] ?? []).join('\n')),
    acceptedExtra: extraLocales(question.acceptedAnswers),
    explanation: perLocale((locale) => question.explanation[locale]?.text ?? ''),
    explanationExtra: extraLocales(question.explanation),
  };
}

export function quizInputToDraft(input: QuizInput, newKey: () => string): QuizDraft {
  return {
    defaultLocale: input.defaultLocale,
    text: textDraftFrom(input.translations, QUIZ_TEXT_FIELDS),
    extra: extraLocales(input.translations),
    passingScorePercent: String(input.passingScorePercent),
    maxAttempts: input.maxAttempts === null ? '' : String(input.maxAttempts),
    xpReward: String(input.xpReward),
    shuffleQuestions: input.shuffleQuestions,
    revealAnswers: input.revealAnswers,
    questions: input.questions.map((question) => questionToDraft(question, newKey)),
  };
}

function emptyOption(newKey: () => string): OptionDraft {
  return { key: newKey(), id: null, text: emptyText(), extra: {} };
}

function trueFalseOptions(tf: TrueFalseTexts): OptionDraft[] {
  return (['true', 'false'] as const).map((value) => ({
    key: value,
    id: value,
    text: perLocale((locale) => tf[locale]?.[value] ?? ''),
    extra: {},
  }));
}

export function newQuestion(
  type: QuestionType,
  tf: TrueFalseTexts,
  newKey: () => string,
): QuestionDraft {
  const key = newKey();
  return {
    key,
    id: null,
    type,
    points: '1',
    prompt: emptyText(),
    promptExtra: {},
    options:
      type === 'true_false'
        ? trueFalseOptions(tf)
        : type === 'short_answer'
          ? []
          : [emptyOption(newKey), emptyOption(newKey)],
    correct: [],
    accepted: emptyText(),
    acceptedExtra: {},
    explanation: emptyText(),
    explanationExtra: {},
  };
}

/** Pass mark 70, unlimited attempts, 100 XP, revealed after a pass, one empty question. */
export function newQuizDraft(defaultLocale: Locale, newKey: () => string): QuizDraft {
  return {
    defaultLocale,
    text: textDraftFrom({}, QUIZ_TEXT_FIELDS),
    extra: {},
    passingScorePercent: String(DEFAULT_PASS_MARK),
    maxAttempts: '',
    xpReward: String(XP_RULES.quiz),
    shuffleQuestions: false,
    revealAnswers: 'after_pass',
    questions: [newQuestion('multiple_choice', {} as TrueFalseTexts, newKey)],
  };
}

function isChoice(type: QuestionType): boolean {
  return type === 'multiple_choice' || type === 'multiple_answer';
}

/**
 * Id, prompt, points and explanation are kept. Between one and several correct answers the
 * options stay (one correct answer keeps the first mark); true/false gets its two fixed options;
 * a short answer has no options; accepted answers are kept only for a short answer.
 */
export function changeQuestionType(
  question: QuestionDraft,
  type: QuestionType,
  tf: TrueFalseTexts,
  newKey: () => string,
): QuestionDraft {
  if (question.type === type) return question;
  const accepted = type === 'short_answer' ? question.accepted : emptyText();
  const acceptedExtra = type === 'short_answer' ? question.acceptedExtra : {};
  if (isChoice(question.type) && isChoice(type)) {
    const firstMark = question.options.find((option) => question.correct.includes(option.key));
    return {
      ...question,
      type,
      correct:
        type === 'multiple_choice' ? (firstMark ? [firstMark.key] : []) : question.correct,
      accepted,
      acceptedExtra,
    };
  }
  return {
    ...question,
    type,
    options:
      type === 'true_false'
        ? trueFalseOptions(tf)
        : type === 'short_answer'
          ? []
          : [emptyOption(newKey), emptyOption(newKey)],
    correct: [],
    accepted,
    acceptedExtra,
  };
}

function hasText(record: Record<string, string>): boolean {
  return Object.values(record).some((value) => !blank(value));
}

/**
 * True when options the author wrote, or accepted answers, would be dropped (ask first). The
 * fixed true/false texts are not the author's work.
 */
export function typeChangeLosesWork(question: QuestionDraft, type: QuestionType): boolean {
  if (question.type === type) return false;
  const optionsDropped =
    question.type !== 'true_false' && !(isChoice(question.type) && isChoice(type));
  if (optionsDropped && question.options.some((option) => hasText(option.text))) return true;
  return question.type === 'short_answer' && hasText(question.accepted);
}

function localizedEntries<V>(
  values: Record<Locale, string>,
  defaultLocale: Locale,
  build: (value: string) => V,
  extra: Localized<unknown>,
  keepDefault = true,
): Localized<V> {
  const result: Localized<V> = {};
  for (const locale of EDITABLE_LOCALES) {
    const value = values[locale] ?? '';
    if ((keepDefault && locale === defaultLocale) || !blank(value)) result[locale] = build(value);
  }
  for (const [locale, entry] of Object.entries(extra)) {
    if (entry !== undefined) result[locale] = entry as V;
  }
  return result;
}

function questionToInput(question: QuestionDraft, defaultLocale: Locale): QuizQuestionInput {
  const choice = question.type !== 'short_answer';
  return {
    id: question.id,
    type: question.type,
    points: requiredNumber(question.points),
    translations: localizedEntries(
      question.prompt,
      defaultLocale,
      (prompt) => ({ prompt }),
      question.promptExtra,
    ),
    options: question.options.map((option) => ({
      id: option.id,
      translations: localizedEntries(option.text, defaultLocale, (text) => ({ text }), option.extra),
    })),
    correctOptionIndexes: choice
      ? question.options.flatMap((option, index) =>
          question.correct.includes(option.key) ? [index] : [],
        )
      : [],
    acceptedAnswers: choice
      ? {}
      : (() => {
          const result: Localized<string[]> = {};
          for (const locale of EDITABLE_LOCALES) {
            const list = linesToList(question.accepted[locale] ?? '');
            if (locale === defaultLocale || list.length > 0) result[locale] = list;
          }
          for (const [locale, entry] of Object.entries(question.acceptedExtra)) {
            if (entry !== undefined) result[locale] = entry;
          }
          return result;
        })(),
    explanation: localizedEntries(
      question.explanation,
      defaultLocale,
      (text) => ({ text }),
      question.explanationExtra,
      false,
    ),
  };
}

export function draftToQuizInput(draft: QuizDraft): QuizInput {
  return {
    defaultLocale: draft.defaultLocale,
    translations: textDraftTo(draft.text, {
      fields: QUIZ_TEXT_FIELDS,
      nullable: ['instructions'],
      defaultLocale: draft.defaultLocale,
      extra: draft.extra,
    }) as QuizInput['translations'],
    passingScorePercent: requiredNumber(draft.passingScorePercent),
    maxAttempts: numberOrNull(draft.maxAttempts),
    xpReward: requiredNumber(draft.xpReward),
    shuffleQuestions: draft.shuffleQuestions,
    revealAnswers: draft.revealAnswers,
    questions: draft.questions.map((question) => questionToInput(question, draft.defaultLocale)),
  };
}

/** One step up or down; unchanged at an edge. */
export function moveQuestion(
  questions: readonly QuestionDraft[],
  key: string,
  delta: -1 | 1,
): QuestionDraft[] {
  const from = questions.findIndex((question) => question.key === key);
  const to = from + delta;
  if (from === -1 || to < 0 || to >= questions.length) return [...questions];
  const next = [...questions];
  [next[from], next[to]] = [next[to]!, next[from]!];
  return next;
}

export type QuizErrorField =
  | 'title'
  | 'instructions'
  | 'passingScorePercent'
  | 'maxAttempts'
  | 'xpReward'
  | 'revealAnswers'
  | 'questions'
  | 'form'
  | 'type'
  | 'points'
  | 'prompt'
  | 'options'
  | 'optionText'
  | 'correct'
  | 'accepted'
  | 'explanation'
  | 'other';

export interface QuizErrorTarget {
  questionIndex: number | null;
  optionIndex: number | null;
  field: QuizErrorField;
  locale: Locale | null;
}

const QUIZ_FIELDS: Record<string, QuizErrorField> = {
  passingScorePercent: 'passingScorePercent',
  maxAttempts: 'maxAttempts',
  xpReward: 'xpReward',
  revealAnswers: 'revealAnswers',
};

function index(part: string | undefined): number | null {
  return part !== undefined && /^\d+$/.test(part) ? Number(part) : null;
}

/** Where a field-error path of the quiz schema (or of `splitQuizInput`) belongs. */
export function quizErrorTarget(path: string): QuizErrorTarget {
  const locale = localeOfPath(path);
  const target = (
    field: QuizErrorField,
    questionIndex: number | null = null,
    optionIndex: number | null = null,
  ): QuizErrorTarget => ({ questionIndex, optionIndex, field, locale });
  const parts = path.split('.');
  const [first, second] = parts;
  if (path === '_form') return target('form');
  if (first === 'translations') {
    const field = parts[2];
    return field === 'title' || field === 'instructions' ? target(field) : target('other');
  }
  if (first !== undefined && QUIZ_FIELDS[first] !== undefined) return target(QUIZ_FIELDS[first]!);
  if (first !== 'questions') return target('other');
  const questionIndex = index(second);
  if (questionIndex === null) return target('questions');
  const field = parts[2];
  switch (field) {
    case 'type':
    case 'points':
      return target(field, questionIndex);
    case 'translations':
      return target('prompt', questionIndex);
    case 'options': {
      const optionIndex = index(parts[3]);
      if (optionIndex !== null && parts[4] === 'translations') {
        return target('optionText', questionIndex, optionIndex);
      }
      return target('options', questionIndex, optionIndex);
    }
    case 'correctOptionIndexes':
      return target('correct', questionIndex);
    case 'acceptedAnswers':
      return target('accepted', questionIndex);
    case 'explanation':
      return target('explanation', questionIndex);
    default:
      return target('other', questionIndex);
  }
}

/**
 * Default locale 'required'; another locale 'missing' when neither the title nor any question
 * prompt has text in it, else 'translated' (partial counts as started).
 */
export function quizTranslationStates(draft: QuizDraft): Record<Locale, TranslationState> {
  const states = {} as Record<Locale, TranslationState>;
  for (const locale of EDITABLE_LOCALES) {
    if (locale === draft.defaultLocale) {
      states[locale] = 'required';
      continue;
    }
    const started =
      !blank(draft.text[locale]?.title ?? '') ||
      draft.questions.some((question) => !blank(question.prompt[locale] ?? ''));
    states[locale] = started ? 'translated' : 'missing';
  }
  return states;
}
