import { z } from 'zod';
import { CONTENT_LIMITS } from '@/lib/limits';
import type {
  QuizInput,
  QuizQuestionInput,
  QuizRefInput,
  SaveQuizInput,
  SubmitQuizAttemptInput,
} from '@/types/inputs';
import { QUESTION_TYPES, REVEAL_ANSWERS, type QuizAnswer } from '@/types/quiz';
import {
  addMissingDefaultLocale,
  bool,
  idOrNullSchema,
  idSchema,
  int,
  list,
  localeSchema,
  localized,
  obj,
  oneOf,
  requiredText,
  requireDefaultLocale,
  text,
  uniqueList,
  whenPresent,
} from './common';

const optionSchema = obj({
  id: idOrNullSchema,
  translations: localized(obj({ text: text(CONTENT_LIMITS.optionTextChars) })),
});

/**
 * The shape of one question. The rules that depend on the quiz (default language, question
 * type) are checked by quizInputSchema, which is the schema to validate an editor with.
 */
export const quizQuestionInputSchema = obj({
  id: idOrNullSchema,
  type: oneOf(QUESTION_TYPES),
  points: int(1, CONTENT_LIMITS.questionPointsMax),
  translations: localized(obj({ prompt: text(CONTENT_LIMITS.questionPromptChars) })),
  options: list(optionSchema, { max: CONTENT_LIMITS.optionsPerQuestion }),
  correctOptionIndexes: list(int(0, CONTENT_LIMITS.optionsPerQuestion - 1), {
    max: CONTENT_LIMITS.optionsPerQuestion,
  }),
  acceptedAnswers: localized(
    list(requiredText(CONTENT_LIMITS.acceptedAnswerChars), {
      max: CONTENT_LIMITS.acceptedAnswersPerQuestion,
    }),
  ),
  explanation: localized(obj({ text: text(CONTENT_LIMITS.explanationChars) })),
}) satisfies z.ZodType<QuizQuestionInput>;

function hasDuplicates(values: readonly unknown[]): boolean {
  return new Set(values).size !== values.length;
}

// The rules that depend on the question type. `path` is the question's path inside the quiz.
function checkQuestion(
  question: QuizQuestionInput,
  defaultLocale: string,
  path: PropertyKey[],
  ctx: z.core.$RefinementCtx,
): void {
  const issue = (message: string, ...at: PropertyKey[]) =>
    ctx.addIssue({ code: 'custom', message, path: [...path, ...at] });

  addMissingDefaultLocale(
    ctx,
    question.translations,
    defaultLocale,
    ['prompt'],
    [...path, 'translations'],
  );

  if (question.type === 'short_answer') {
    if (question.options.length > 0) issue('too_many', 'options');
    if (question.correctOptionIndexes.length > 0) issue('too_many', 'correctOptionIndexes');
    if ((question.acceptedAnswers[defaultLocale] ?? []).length === 0) {
      issue('correct_option_required', 'acceptedAnswers', defaultLocale);
    }
    return;
  }

  const { options, correctOptionIndexes: correct } = question;
  if (question.type === 'true_false') {
    const ids = options.map((option) => option.id);
    if (ids.length !== 2 || !ids.includes('true') || !ids.includes('false')) {
      issue('invalid', 'options');
    }
  } else if (options.length < 2) {
    issue('too_few', 'options');
  }
  if (hasDuplicates(options.map((option) => option.id).filter((id) => id !== null))) {
    issue('duplicate', 'options');
  }
  options.forEach((option, index) => {
    addMissingDefaultLocale(
      ctx,
      option.translations,
      defaultLocale,
      ['text'],
      [...path, 'options', index, 'translations'],
    );
  });

  if (correct.some((index) => index >= options.length) || hasDuplicates(correct)) {
    issue('invalid', 'correctOptionIndexes');
  } else if (correct.length === 0) {
    issue('correct_option_required', 'correctOptionIndexes');
  } else if (question.type !== 'multiple_answer' && correct.length > 1) {
    issue('too_many', 'correctOptionIndexes');
  }
}

export const quizInputSchema = obj({
  defaultLocale: localeSchema,
  translations: localized(
    obj({
      title: text(CONTENT_LIMITS.titleChars),
      instructions: text(CONTENT_LIMITS.quizInstructionsChars).nullable(),
    }),
  ),
  passingScorePercent: int(0, 100),
  maxAttempts: int(1, CONTENT_LIMITS.quizMaxAttemptsMax).nullable(),
  xpReward: int(0, CONTENT_LIMITS.xpRewardMax.quiz),
  shuffleQuestions: bool(),
  revealAnswers: oneOf(REVEAL_ANSWERS),
  questions: list(quizQuestionInputSchema, { min: 1, max: CONTENT_LIMITS.questionsPerQuiz }),
}).superRefine((quiz, ctx) => {
  requireDefaultLocale(['title'])(quiz, ctx);
  quiz.questions.forEach((question, index) => {
    checkQuestion(question, quiz.defaultLocale, ['questions', index], ctx);
  });
  if (hasDuplicates(quiz.questions.map((question) => question.id).filter((id) => id !== null))) {
    ctx.addIssue({ code: 'custom', message: 'duplicate', path: ['questions'] });
  }
}) satisfies z.ZodType<QuizInput>;

export const saveQuizInputSchema = obj({
  courseId: idSchema,
  quizId: idOrNullSchema,
  input: quizInputSchema,
}) satisfies z.ZodType<SaveQuizInput>;

export const quizRefInputSchema = obj({
  courseId: idSchema,
  quizId: idSchema,
}) satisfies z.ZodType<QuizRefInput>;

export const quizAnswerSchema = obj({
  selectedOptionIds: uniqueList(idSchema, { max: CONTENT_LIMITS.optionsPerQuestion }),
  text: text(CONTENT_LIMITS.quizAnswerChars).nullable(),
}) satisfies z.ZodType<QuizAnswer>;

/** `answers` is keyed by question id; questions left out count as unanswered. */
export const submitQuizAttemptInputSchema = obj({
  courseId: idSchema,
  quizId: idSchema,
  answers: z
    .record(idSchema, quizAnswerSchema, { error: whenPresent('invalid') })
    .refine(
      (answers) => Object.keys(answers).length <= CONTENT_LIMITS.questionsPerQuiz,
      'too_many',
    ),
}) satisfies z.ZodType<SubmitQuizAttemptInput>;
