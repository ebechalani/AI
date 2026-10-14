import 'server-only';
import { ValidationError } from '@/lib/errors';
import { pickTranslation } from '@/lib/i18n/content';
import { CONTENT_LIMITS } from '@/lib/limits';
import { ID_PATTERN } from '@/lib/schemas/common';
import { assertNever } from '@/lib/utils';
import type { Localized, MediaRef } from '@/types/common';
import type { BlockType, Lesson, LessonBlockOf } from '@/types/content';
import type { BlockInput, BlockInputOf, QuizInput, QuizQuestionInput } from '@/types/inputs';
import type { Quiz, QuizAnswerKey, QuizQuestion } from '@/types/quiz';

// Pure helpers behind the content repositories: nothing here reads or writes Firestore. The
// seed runner writes course documents itself and derives every denormalized field with these
// same functions, so seeded and edited content cannot drift apart (ARCHITECTURE.md 3.6, 11.2).

// --- Blocks ------------------------------------------------------------------------------------

/** What a block document stores besides `order` and its timestamps. */
export type BlockFieldsOf<T extends BlockType> = Pick<
  LessonBlockOf<T>,
  'type' | 'stage' | 'defaultLocale' | 'translations' | 'data'
>;
export type BlockFields = { [T in BlockType]: BlockFieldsOf<T> }[BlockType];

/** What the derivations read of a block; a LessonBlock is one. */
export type DerivableBlock = BlockFields & { id: string; order: number };

/** The registered course_media files an editor's block names. */
export function blockFileIds(input: BlockInput): string[] {
  switch (input.type) {
    case 'image':
    case 'file':
      return [input.data.fileId];
    case 'video':
      return input.data.fileId === null ? [] : [input.data.fileId];
    default:
      return [];
  }
}

type MediaFreeBlockType = Exclude<BlockType, 'image' | 'video' | 'file'>;

// Field by field, so nothing else an input object carries (a seed block has an `id`) is stored.
function sameData<T extends MediaFreeBlockType>(input: BlockInputOf<T>): BlockFieldsOf<T> {
  return {
    type: input.type,
    stage: input.stage,
    defaultLocale: input.defaultLocale,
    translations: input.translations,
    // BlockInputDataMap declares these types as their BlockDataMap entry; the compiler cannot
    // follow that through the type parameter.
    data: input.data as BlockFieldsOf<T>['data'],
  };
}

/**
 * The stored form of an editor's block: the same fields, with every file id replaced by the
 * MediaRef of that file. `media` maps file id → MediaRef for the ids of blockFileIds(input).
 */
export function toBlockFields(
  input: BlockInput,
  media: ReadonlyMap<string, MediaRef>,
): BlockFields {
  const mediaOf = (fileId: string): MediaRef => {
    const ref = media.get(fileId);
    if (!ref) throw new ValidationError(`Unknown file ${fileId}.`, { 'data.fileId': ['invalid'] });
    return ref;
  };
  const { stage, defaultLocale } = input;

  switch (input.type) {
    case 'image':
      return {
        type: 'image',
        stage,
        defaultLocale,
        translations: input.translations,
        data: { media: mediaOf(input.data.fileId) },
      };
    case 'file':
      return {
        type: 'file',
        stage,
        defaultLocale,
        translations: input.translations,
        data: { media: mediaOf(input.data.fileId) },
      };
    case 'video':
      return {
        type: 'video',
        stage,
        defaultLocale,
        translations: input.translations,
        data: {
          source: input.data.source,
          videoId: input.data.videoId,
          media: input.data.fileId === null ? null : mediaOf(input.data.fileId),
          durationSeconds: input.data.durationSeconds,
        },
      };
    // One case each: a shared case would widen `input` and lose the type ↔ data pairing.
    case 'rich_text':
      return sameData(input);
    case 'quiz':
      return sameData(input);
    case 'code_activity':
      return sameData(input);
    case 'ai_activity':
      return sameData(input);
    case 'embed':
      return sameData(input);
    case 'reflection':
      return sameData(input);
    case 'project':
      return sameData(input);
    default:
      return assertNever(input, 'Unknown block type');
  }
}

/** The quiz or project a block points at. Each may be referenced by one block only (3.4). */
export function linkedContent(block: BlockFields): { kind: 'quiz' | 'project'; id: string } | null {
  if (block.type === 'quiz') return { kind: 'quiz', id: block.data.quizId };
  if (block.type === 'project') return { kind: 'project', id: block.data.projectId };
  return null;
}

// --- Lesson fields derived from the blocks --------------------------------------------------------

export type LessonDerivedFields = Pick<
  Lesson,
  'blockCount' | 'quizIds' | 'projectIds' | 'reflectionBlockIds' | 'tutorExcerpt'
>;

function cut(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const head = text.slice(0, maxChars);
  // The cut may fall inside a surrogate pair; half a character is dropped, not stored.
  return (/[\uD800-\uDBFF]$/.test(head) ? head.slice(0, -1) : head).trimEnd();
}

function bodyOf(entry: { body?: unknown } | undefined): string {
  return typeof entry?.body === 'string' ? entry.body.trim() : '';
}

// One excerpt per language in which at least one rich_text block has a body. A block that
// lacks that language contributes its fallback text, so no excerpt has holes.
function deriveTutorExcerpt(ordered: readonly DerivableBlock[]): Localized<string> {
  const richText = ordered.filter((block) => block.type === 'rich_text');
  const locales = new Set<string>();
  for (const block of richText) {
    for (const [locale, entry] of Object.entries(block.translations)) {
      if (bodyOf(entry) !== '') locales.add(locale);
    }
  }

  const excerpt: Localized<string> = {};
  for (const locale of locales) {
    const bodies = richText
      .map((block) => bodyOf(pickTranslation(block.translations, locale, block.defaultLocale)))
      .filter((body) => body !== '');
    excerpt[locale] = cut(bodies.join('\n\n'), CONTENT_LIMITS.tutorExcerptChars);
  }
  return excerpt;
}

/**
 * `lessons.blockCount`, `quizIds`, `projectIds`, `reflectionBlockIds` and `tutorExcerpt` from
 * the lesson's blocks, which may come in any order: they are read by `order`.
 */
export function deriveLessonFields(blocks: readonly DerivableBlock[]): LessonDerivedFields {
  const ordered = [...blocks].sort((a, b) => a.order - b.order);
  const quizIds: string[] = [];
  const projectIds: string[] = [];
  const reflectionBlockIds: string[] = [];

  for (const block of ordered) {
    const link = linkedContent(block);
    if (link?.kind === 'quiz' && !quizIds.includes(link.id)) quizIds.push(link.id);
    if (link?.kind === 'project' && !projectIds.includes(link.id)) projectIds.push(link.id);
    if (block.type === 'reflection') reflectionBlockIds.push(block.id);
  }

  return {
    blockCount: ordered.length,
    quizIds,
    projectIds,
    reflectionBlockIds,
    tutorExcerpt: deriveTutorExcerpt(ordered),
  };
}

// --- Quizzes -----------------------------------------------------------------------------------

/** What a quiz document stores besides `lessonId` and its timestamps. */
export type QuizFields = Pick<
  Quiz,
  | 'passingScorePercent'
  | 'maxAttempts'
  | 'xpReward'
  | 'shuffleQuestions'
  | 'revealAnswers'
  | 'questionCount'
  | 'defaultLocale'
  | 'translations'
  | 'questions'
>;

const NEW_ID_TRIES = 100;

// Ids the input brings are kept; a null one gets a fresh id that none of its siblings has.
function assignIds(given: (string | null)[], newId: () => string, path: string): string[] {
  const taken = new Set<string>();
  for (const id of given) {
    if (id === null) continue;
    if (!ID_PATTERN.test(id))
      throw new ValidationError(`Malformed id in ${path}.`, { [path]: ['invalid'] });
    if (taken.has(id))
      throw new ValidationError(`Repeated id in ${path}.`, { [path]: ['duplicate'] });
    taken.add(id);
  }

  return given.map((id) => {
    if (id !== null) return id;
    for (let tries = 0; tries < NEW_ID_TRIES; tries += 1) {
      const candidate = newId();
      if (ID_PATTERN.test(candidate) && !taken.has(candidate)) {
        taken.add(candidate);
        return candidate;
      }
    }
    throw new Error(`newId() produced no usable id for ${path}.`);
  });
}

/**
 * Splits what an author saves into the two documents of a quiz (ARCHITECTURE.md 3.4): the
 * student-readable part and the answer key of `private/key`. Nothing of the key (correct
 * options, accepted answers, explanations) is left in the first.
 *
 * `newId` is called for every question and option whose id is null. It returns an id of
 * ID_PATTERN; the repository passes a random one, a seed may pass a counter.
 */
export function splitQuizInput(
  input: QuizInput,
  newId: () => string,
): { quiz: QuizFields; key: QuizAnswerKey } {
  const questionIds = assignIds(
    input.questions.map((question) => question.id),
    newId,
    'questions',
  );
  const questions: QuizQuestion[] = [];
  const key: QuizAnswerKey = { answers: {}, explanations: {} };

  input.questions.forEach((question, index) => {
    const id = questionIds[index]!;
    const path = `questions.${index}`;
    const optionIds = assignIds(
      question.options.map((option) => option.id),
      newId,
      `${path}.options`,
    );

    const correctOptionIds = question.correctOptionIndexes.map((optionIndex) => {
      const optionId = optionIds[optionIndex];
      if (optionId === undefined) {
        throw new ValidationError(`No option ${optionIndex} in ${path}.`, {
          [`${path}.correctOptionIndexes`]: ['invalid'],
        });
      }
      return optionId;
    });

    questions.push({
      id,
      type: question.type,
      points: question.points,
      translations: question.translations,
      options: question.options.map((option, optionIndex) => ({
        id: optionIds[optionIndex]!,
        translations: option.translations,
      })),
    });
    key.answers[id] = { correctOptionIds, acceptedAnswers: question.acceptedAnswers };
    key.explanations[id] = question.explanation;
  });

  return {
    quiz: {
      passingScorePercent: input.passingScorePercent,
      maxAttempts: input.maxAttempts,
      xpReward: input.xpReward,
      shuffleQuestions: input.shuffleQuestions,
      revealAnswers: input.revealAnswers,
      questionCount: questions.length,
      defaultLocale: input.defaultLocale,
      translations: input.translations,
      questions,
    },
    key,
  };
}

/** The inverse of splitQuizInput, for the quiz editor: every id is kept. */
export function toQuizInput(quiz: QuizFields, key: QuizAnswerKey): QuizInput {
  const questions = quiz.questions.map((question): QuizQuestionInput => {
    const answer = Object.hasOwn(key.answers, question.id) ? key.answers[question.id] : undefined;
    const correct = answer?.correctOptionIds ?? [];
    return {
      id: question.id,
      type: question.type,
      points: question.points,
      translations: question.translations,
      options: question.options.map((option) => ({
        id: option.id,
        translations: option.translations,
      })),
      correctOptionIndexes: question.options.flatMap((option, index) =>
        correct.includes(option.id) ? [index] : [],
      ),
      acceptedAnswers: answer?.acceptedAnswers ?? {},
      explanation:
        (Object.hasOwn(key.explanations, question.id)
          ? key.explanations[question.id]
          : undefined) ?? {},
    };
  });

  return {
    defaultLocale: quiz.defaultLocale,
    translations: quiz.translations,
    passingScorePercent: quiz.passingScorePercent,
    maxAttempts: quiz.maxAttempts,
    xpReward: quiz.xpReward,
    shuffleQuestions: quiz.shuffleQuestions,
    revealAnswers: quiz.revealAnswers,
    questions,
  };
}

/** UTF-8 size of the two documents together, compared with CONTENT_LIMITS.quizDocumentBytes. */
export function quizDocumentBytes(quiz: QuizFields, key: QuizAnswerKey): number {
  return new TextEncoder().encode(JSON.stringify({ quiz, key })).length;
}

// --- Enrollment progress -------------------------------------------------------------------------

/**
 * `enrollments.progressPercent` (0–100, rounded down so that 100 means every lesson) and
 * whether the course is finished. A course without lessons is never finished.
 */
export function lessonProgressOf(
  completedLessonCount: number,
  totalLessonCount: number,
): { progressPercent: number; allLessonsDone: boolean } {
  if (totalLessonCount <= 0) return { progressPercent: 0, allLessonsDone: false };
  const done = Math.min(Math.max(completedLessonCount, 0), totalLessonCount);
  return {
    progressPercent: Math.floor((done * 100) / totalLessonCount),
    allLessonsDone: done === totalLessonCount,
  };
}
