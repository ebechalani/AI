import type { Localized } from '@/types/common';
import type {
  Quiz,
  QuizAnswer,
  QuizAnswerKey,
  QuizQuestion,
  QuizQuestionResult,
} from '@/types/quiz';

// Combining Diacritical Marks and their supplements: the accents of Latin, Greek and Cyrillic
// text. Marks that belong to a script's spelling (Thai tone marks, Devanagari vowel signs) are
// left alone, because removing them turns one word into another.
const DIACRITICS =
  /[\u{300}-\u{36f}\u{1ab0}-\u{1aff}\u{1dc0}-\u{1dff}\u{20d0}-\u{20ff}\u{fe20}-\u{fe2f}]/gu;

// Invisible format characters (zero-width joiners, direction marks, soft hyphen) that
// keyboards and copy-paste leave in a text.
const INVISIBLE = /\p{Cf}/gu;

// Arabic: tatweel, then harakat and the Quranic annotation marks. U+0653 to U+0655 are what
// NFD leaves of the hamza and madda on a carrier letter, so removing them turns the alef
// forms into a bare alef (and waw or yeh with hamza into waw or yeh).
const ARABIC_TATWEEL = /\u{640}/gu;
const ARABIC_MARKS =
  /[\u{610}-\u{61a}\u{64b}-\u{65f}\u{670}\u{6d6}-\u{6dc}\u{6df}-\u{6e4}\u{6e7}\u{6e8}\u{6ea}-\u{6ed}]/gu;
const ARABIC_ALEF_WASLA = /\u{671}/gu;
const ARABIC_ALEF_MAQSURA = /\u{649}/gu;

function isArabic(locale: string): boolean {
  const language = locale.toLowerCase();
  return language === 'ar' || language.startsWith('ar-');
}

/**
 * The form in which a short answer is compared. It is applied to the learner's answer and to
 * the accepted answer alike, at grading time (keys are stored as authored): compatibility
 * forms, case, accents, invisible characters and runs of whitespace make no difference. For
 * Arabic, tatweel, harakat and the spelling of alef and hamza make none either.
 */
export function normalizeAnswer(text: string, locale: string): string {
  // Upper then lower is a case fold: it also maps 'ß' to 'ss' and a final sigma to sigma.
  let value = text.normalize('NFKC').toUpperCase().toLowerCase().normalize('NFD');
  value = value.replace(DIACRITICS, '').replace(INVISIBLE, '');
  if (isArabic(locale)) {
    value = value
      .replace(ARABIC_TATWEEL, '')
      .replace(ARABIC_MARKS, '')
      .replace(ARABIC_ALEF_WASLA, '\u{627}')
      .replace(ARABIC_ALEF_MAQSURA, '\u{64a}');
  }
  return value.normalize('NFC').replace(/\s+/g, ' ').trim();
}

/** What grading reads of a quiz. A locale is any language tag, as in `translations`. */
export type GradableQuiz = Pick<Quiz, 'questions' | 'passingScorePercent'> & {
  defaultLocale: string;
};

export interface QuizGrade {
  /** One entry per question of the quiz, answered or not. */
  results: Record<string, QuizQuestionResult>;
  score: number;
  maxScore: number;
  /** 0–100, rounded down, so it never shows the passing score for an attempt that failed. */
  scorePercent: number;
  passed: boolean;
}

type KeyEntry = QuizAnswerKey['answers'][string];

function own<T>(map: Record<string, T>, id: string): T | undefined {
  return Object.hasOwn(map, id) ? map[id] : undefined;
}

function isShortAnswerCorrect(
  text: string | null,
  accepted: Localized<string[]>,
  locales: readonly string[],
): boolean {
  if (text === null) return false;
  // Each list is compared under the rules of its own language, on both sides.
  return [...new Set(locales)].some((locale) => {
    const given = normalizeAnswer(text, locale);
    return (
      given !== '' &&
      (own(accepted, locale) ?? []).some((answer) => normalizeAnswer(answer, locale) === given)
    );
  });
}

function isCorrect(
  question: QuizQuestion,
  answer: QuizAnswer | undefined,
  key: KeyEntry | undefined,
  locales: readonly string[],
): boolean {
  if (answer === undefined || key === undefined) return false;
  const selected = [...new Set(answer.selectedOptionIds)];
  switch (question.type) {
    case 'multiple_choice':
    case 'true_false':
      return selected.length === 1 && key.correctOptionIds.includes(selected[0]!);
    case 'multiple_answer': {
      const correct = new Set(key.correctOptionIds);
      return (
        correct.size > 0 &&
        selected.length === correct.size &&
        selected.every((id) => correct.has(id))
      );
    }
    case 'short_answer':
      return isShortAnswerCorrect(answer.text, key.acceptedAnswers, locales);
    default:
      return false;
  }
}

/**
 * Grades one attempt. Multiple choice and true/false are correct when the single selected
 * option is a correct one; multiple answer is all or nothing; a short answer is correct when
 * its normalized form equals that of an accepted answer of the attempt's locale or of the
 * quiz's default locale. Answers to questions the quiz does not have are ignored.
 */
export function gradeQuiz(
  quiz: GradableQuiz,
  key: QuizAnswerKey,
  answers: Record<string, QuizAnswer>,
  locale: string,
): QuizGrade {
  const locales = [locale, quiz.defaultLocale];
  const results: Record<string, QuizQuestionResult> = {};
  let score = 0;
  let maxScore = 0;

  for (const question of quiz.questions) {
    const correct = isCorrect(
      question,
      own(answers, question.id),
      own(key.answers, question.id),
      locales,
    );
    const pointsAwarded = correct ? question.points : 0;
    // defineProperty, so a question id such as '__proto__' becomes an ordinary key.
    Object.defineProperty(results, question.id, {
      value: { correct, pointsAwarded },
      enumerable: true,
      writable: true,
      configurable: true,
    });
    score += pointsAwarded;
    maxScore += question.points;
  }

  const scorePercent = maxScore > 0 ? Math.floor((score * 100) / maxScore) : 0;
  return {
    results,
    score,
    maxScore,
    scorePercent,
    passed: maxScore > 0 && scorePercent >= quiz.passingScorePercent,
  };
}
