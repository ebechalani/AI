import { describe, expect, it } from 'vitest';
import { gradeQuiz, type GradableQuiz } from '@/lib/learning/quiz-grading';
import type { QuizAnswer, QuizAnswerKey, QuizQuestion } from '@/types';

function option(id: string) {
  return { id, translations: { en: { text: id } } };
}

function question(
  id: string,
  type: QuizQuestion['type'],
  optionIds: string[],
  points = 1,
): QuizQuestion {
  return { id, type, points, translations: { en: { prompt: id } }, options: optionIds.map(option) };
}

const quiz: GradableQuiz = {
  defaultLocale: 'en',
  passingScorePercent: 70,
  questions: [
    question('choice', 'multiple_choice', ['a', 'b', 'c'], 2),
    question('truth', 'true_false', ['true', 'false'], 1),
    question('many', 'multiple_answer', ['a', 'b', 'c', 'd'], 3),
    question('short', 'short_answer', [], 4),
  ],
};

const key: QuizAnswerKey = {
  answers: {
    choice: { correctOptionIds: ['b'], acceptedAnswers: {} },
    truth: { correctOptionIds: ['false'], acceptedAnswers: {} },
    many: { correctOptionIds: ['a', 'c'], acceptedAnswers: {} },
    short: {
      correctOptionIds: [],
      acceptedAnswers: { en: ['Machine learning', 'ML'], fr: ['Apprentissage automatique'] },
    },
  },
  explanations: {},
};

const pick = (...selectedOptionIds: string[]): QuizAnswer => ({ selectedOptionIds, text: null });
const write = (text: string): QuizAnswer => ({ selectedOptionIds: [], text });

const allCorrect: Record<string, QuizAnswer> = {
  choice: pick('b'),
  truth: pick('false'),
  many: pick('c', 'a'),
  short: write('  machine   LEARNING '),
};

describe('gradeQuiz', () => {
  it('awards every point for a fully correct attempt', () => {
    expect(gradeQuiz(quiz, key, allCorrect, 'en')).toEqual({
      results: {
        choice: { correct: true, pointsAwarded: 2 },
        truth: { correct: true, pointsAwarded: 1 },
        many: { correct: true, pointsAwarded: 3 },
        short: { correct: true, pointsAwarded: 4 },
      },
      score: 10,
      maxScore: 10,
      scorePercent: 100,
      passed: true,
    });
  });

  it('gives an unanswered quiz zero and a result for every question', () => {
    const grade = gradeQuiz(quiz, key, {}, 'en');
    expect(grade).toMatchObject({ score: 0, maxScore: 10, scorePercent: 0, passed: false });
    expect(Object.keys(grade.results)).toEqual(['choice', 'truth', 'many', 'short']);
    expect(Object.values(grade.results).every((result) => !result.correct)).toBe(true);
  });

  it('wants exactly one selected option for multiple choice and true/false', () => {
    const grade = (answers: Record<string, QuizAnswer>) => gradeQuiz(quiz, key, answers, 'en');
    expect(grade({ choice: pick('a') }).results.choice?.correct).toBe(false);
    expect(grade({ choice: pick('a', 'b') }).results.choice?.correct).toBe(false);
    expect(grade({ choice: pick() }).results.choice?.correct).toBe(false);
    expect(grade({ choice: pick('b', 'b') }).results.choice?.correct).toBe(true);
    expect(grade({ truth: pick('true') }).results.truth?.correct).toBe(false);
    expect(grade({ truth: pick('true', 'false') }).results.truth?.correct).toBe(false);
  });

  it('grades multiple answer all or nothing', () => {
    const many = (...ids: string[]) =>
      gradeQuiz(quiz, key, { many: pick(...ids) }, 'en').results.many;
    expect(many('a', 'c')).toEqual({ correct: true, pointsAwarded: 3 });
    expect(many('a')).toEqual({ correct: false, pointsAwarded: 0 });
    expect(many('a', 'c', 'd')).toEqual({ correct: false, pointsAwarded: 0 });
    expect(many('a', 'b')).toEqual({ correct: false, pointsAwarded: 0 });
    expect(many()).toEqual({ correct: false, pointsAwarded: 0 });
  });

  it('accepts a short answer of the attempt locale or of the default locale', () => {
    const short = (text: string, locale: string) =>
      gradeQuiz(quiz, key, { short: write(text) }, locale).results.short?.correct;
    expect(short('ml', 'en')).toBe(true);
    expect(short('apprentissage  AUTOMATIQUE', 'fr')).toBe(true);
    // A French attempt may still answer in the quiz's default language.
    expect(short('Machine Learning', 'fr')).toBe(true);
    // An English attempt is not graded against the French answers.
    expect(short('apprentissage automatique', 'en')).toBe(false);
    expect(short('deep learning', 'en')).toBe(false);
  });

  it('never accepts an empty short answer', () => {
    const blankKey: QuizAnswerKey = {
      answers: { short: { correctOptionIds: [], acceptedAnswers: { en: ['', '   '] } } },
      explanations: {},
    };
    const only: GradableQuiz = { ...quiz, questions: [question('short', 'short_answer', [])] };
    expect(gradeQuiz(only, blankKey, { short: write('   ') }, 'en').score).toBe(0);
    expect(gradeQuiz(only, blankKey, { short: pick() }, 'en').score).toBe(0);
  });

  it('normalizes both sides under the rules of the language of the accepted answer', () => {
    const arabic: GradableQuiz = {
      defaultLocale: 'ar',
      passingScorePercent: 100,
      questions: [question('q', 'short_answer', [])],
    };
    // Authored as alef-with-hamza, hah, meem, dal with harakat; answered with a bare alef and no
    // harakat, from the French interface.
    const arabicKey: QuizAnswerKey = {
      answers: {
        q: {
          correctOptionIds: [],
          acceptedAnswers: { ar: ['\u{623}\u{64e}\u{62d}\u{652}\u{645}\u{64e}\u{62f}'] },
        },
      },
      explanations: {},
    };
    const answer = { q: write('\u{627}\u{62d}\u{645}\u{62f}') };
    expect(gradeQuiz(arabic, arabicKey, answer, 'fr').passed).toBe(true);
    expect(gradeQuiz(arabic, arabicKey, answer, 'ar').passed).toBe(true);
  });

  it('marks a question without a key as incorrect', () => {
    const partialKey: QuizAnswerKey = {
      answers: { choice: key.answers.choice! },
      explanations: {},
    };
    const grade = gradeQuiz(quiz, partialKey, allCorrect, 'en');
    expect(grade.score).toBe(2);
    expect(grade.results.truth).toEqual({ correct: false, pointsAwarded: 0 });
  });

  it('ignores answers to questions the quiz does not have', () => {
    const grade = gradeQuiz(quiz, key, { ...allCorrect, ghost: pick('a') }, 'en');
    expect(Object.keys(grade.results)).not.toContain('ghost');
    expect(grade.score).toBe(10);
  });

  it('does not read inherited object members as answers or keys', () => {
    const odd: GradableQuiz = {
      ...quiz,
      questions: [
        question('constructor', 'multiple_choice', ['a']),
        question('toString', 'short_answer', []),
      ],
    };
    const grade = gradeQuiz(odd, { answers: {}, explanations: {} }, {}, 'en');
    expect(grade.results).toEqual({
      constructor: { correct: false, pointsAwarded: 0 },
      toString: { correct: false, pointsAwarded: 0 },
    });
  });

  it('rounds the percentage down and passes at the passing score exactly', () => {
    const three: GradableQuiz = {
      defaultLocale: 'en',
      passingScorePercent: 67,
      questions: ['q1', 'q2', 'q3'].map((id) => question(id, 'multiple_choice', ['a', 'b'])),
    };
    const threeKey: QuizAnswerKey = {
      answers: Object.fromEntries(
        ['q1', 'q2', 'q3'].map((id) => [id, { correctOptionIds: ['a'], acceptedAnswers: {} }]),
      ),
      explanations: {},
    };
    // 2 of 3 is 66.67 %: shown as 66 and below a passing score of 67.
    const twoRight = gradeQuiz(
      three,
      threeKey,
      { q1: pick('a'), q2: pick('a'), q3: pick('b') },
      'en',
    );
    expect(twoRight).toMatchObject({ score: 2, maxScore: 3, scorePercent: 66, passed: false });
    expect(
      gradeQuiz(
        { ...three, passingScorePercent: 66 },
        threeKey,
        { q1: pick('a'), q2: pick('a') },
        'en',
      ).passed,
    ).toBe(true);

    // 7 of 10 points with a passing score of 70.
    const seven = gradeQuiz(quiz, key, { many: pick('a', 'c'), short: write('ML') }, 'en');
    expect(seven).toMatchObject({ score: 7, scorePercent: 70, passed: true });
  });

  it('never passes a quiz that has no points to give', () => {
    const empty: GradableQuiz = { defaultLocale: 'en', passingScorePercent: 0, questions: [] };
    expect(gradeQuiz(empty, { answers: {}, explanations: {} }, {}, 'en')).toEqual({
      results: {},
      score: 0,
      maxScore: 0,
      scorePercent: 0,
      passed: false,
    });
  });
});
