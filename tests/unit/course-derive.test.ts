import { describe, expect, it } from 'vitest';
import {
  blockFileIds,
  deriveLessonFields,
  lessonProgressOf,
  linkedContent,
  quizDocumentBytes,
  splitQuizInput,
  toBlockFields,
  toQuizInput,
  type DerivableBlock,
} from '@/lib/data/course-derive';
import { ValidationError } from '@/lib/errors';
import { CONTENT_LIMITS } from '@/lib/limits';
import { parseInput } from '@/lib/schemas/common';
import { blockInputSchema } from '@/lib/schemas/course';
import { quizInputSchema } from '@/lib/schemas/quiz';
import type { BlockInput, MediaRef, QuizInput, QuizQuestionInput } from '@/types';

const FILE_A = '11111111-1111-4111-8111-111111111111';
const FILE_B = '22222222-2222-4222-8222-222222222222';

function mediaRef(fileId: string, fileName: string): MediaRef {
  return {
    fileId,
    storagePath: `course-media/official/${fileId}/${fileName}`,
    fileName,
    contentType: 'image/png',
    sizeBytes: 1234,
    width: 640,
    height: 480,
  };
}

const MEDIA = new Map([
  [FILE_A, mediaRef(FILE_A, 'a.png')],
  [FILE_B, mediaRef(FILE_B, 'b.mp4')],
]);

const richTextInput: BlockInput = {
  type: 'rich_text',
  stage: 'learn',
  defaultLocale: 'en',
  translations: { en: { heading: 'Hello', body: 'Machines learn from examples.' } },
  data: {},
};

const imageInput: BlockInput = {
  type: 'image',
  stage: 'discover',
  defaultLocale: 'en',
  translations: { en: { alt: 'A robot', caption: null } },
  data: { fileId: FILE_A },
};

const fileInput: BlockInput = {
  type: 'file',
  stage: 'build',
  defaultLocale: 'en',
  translations: { en: { label: 'Worksheet', description: null } },
  data: { fileId: FILE_A },
};

const uploadedVideoInput: BlockInput = {
  type: 'video',
  stage: 'watch',
  defaultLocale: 'en',
  translations: { en: { title: 'Intro', caption: null, transcript: null } },
  data: { source: 'file', videoId: null, fileId: FILE_B, durationSeconds: 90 },
};

const youtubeVideoInput: BlockInput = {
  type: 'video',
  stage: 'watch',
  defaultLocale: 'en',
  translations: { en: { title: 'Intro', caption: null, transcript: null } },
  data: { source: 'youtube', videoId: 'dQw4w9WgXcQ', fileId: null, durationSeconds: null },
};

const quizInput: BlockInput = {
  type: 'quiz',
  stage: 'check',
  defaultLocale: 'en',
  translations: { en: { intro: null } },
  data: { quizId: 'quiz-m1' },
};

const projectInput: BlockInput = {
  type: 'project',
  stage: 'build',
  defaultLocale: 'en',
  translations: { en: { intro: 'Build it.' } },
  data: { projectId: 'project-1' },
};

const reflectionInput: BlockInput = {
  type: 'reflection',
  stage: 'reflect',
  defaultLocale: 'en',
  translations: { en: { prompt: 'What surprised you?' } },
  data: { minLength: 20 },
};

const OTHER_INPUTS: BlockInput[] = [
  {
    type: 'code_activity',
    stage: 'try',
    defaultLocale: 'en',
    translations: { en: { instructions: 'Print a greeting.', hint: null } },
    data: { language: 'python', starterCode: '  print("hi")\n' },
  },
  {
    type: 'ai_activity',
    stage: 'ask_ai',
    defaultLocale: 'en',
    translations: { en: { instructions: 'Ask Robo.', starterPrompt: null } },
    data: { tutorMode: 'explain', labToolId: null },
  },
  {
    type: 'embed',
    stage: 'watch',
    defaultLocale: 'en',
    translations: { en: { title: 'A clip', caption: null } },
    data: { url: 'https://player.vimeo.com/video/123', aspectRatio: '16:9' },
  },
];

const ALL_INPUTS: BlockInput[] = [
  richTextInput,
  imageInput,
  fileInput,
  uploadedVideoInput,
  youtubeVideoInput,
  quizInput,
  projectInput,
  reflectionInput,
  ...OTHER_INPUTS,
];

/** A stored block, as deriveLessonFields receives it from the repository or the seed. */
function stored(id: string, order: number, input: BlockInput): DerivableBlock {
  return { ...toBlockFields(input, MEDIA), id, order };
}

function richText(
  id: string,
  order: number,
  bodies: Record<string, string>,
  defaultLocale: 'en' | 'fr' = 'en',
): DerivableBlock {
  return {
    id,
    order,
    type: 'rich_text',
    stage: 'learn',
    defaultLocale,
    translations: Object.fromEntries(
      Object.entries(bodies).map(([locale, body]) => [locale, { heading: null, body }]),
    ),
    data: {},
  };
}

describe('the fixtures', () => {
  it('are blocks an editor could send, one of every type', () => {
    for (const input of ALL_INPUTS) {
      expect(parseInput(blockInputSchema, input)).toEqual({ success: true, data: input });
    }
    expect(new Set(ALL_INPUTS.map((input) => input.type)).size).toBe(10);
  });
});

describe('blockFileIds', () => {
  it('names the file of an image, a file and an uploaded video block', () => {
    expect(blockFileIds(imageInput)).toEqual([FILE_A]);
    expect(blockFileIds(fileInput)).toEqual([FILE_A]);
    expect(blockFileIds(uploadedVideoInput)).toEqual([FILE_B]);
  });

  it('names nothing for a hosted video and for blocks without media', () => {
    const withoutMedia = [youtubeVideoInput, richTextInput, quizInput, projectInput];
    for (const input of [...withoutMedia, reflectionInput, ...OTHER_INPUTS]) {
      expect(blockFileIds(input)).toEqual([]);
    }
  });
});

describe('toBlockFields', () => {
  it('replaces the file id of an image and a file block by the MediaRef', () => {
    expect(toBlockFields(imageInput, MEDIA)).toEqual({
      type: 'image',
      stage: 'discover',
      defaultLocale: 'en',
      translations: imageInput.translations,
      data: { media: MEDIA.get(FILE_A) },
    });
    expect(toBlockFields(fileInput, MEDIA).data).toEqual({ media: MEDIA.get(FILE_A) });
  });

  it('stores an uploaded video with its media and a hosted one with none', () => {
    expect(toBlockFields(uploadedVideoInput, MEDIA).data).toEqual({
      source: 'file',
      videoId: null,
      media: MEDIA.get(FILE_B),
      durationSeconds: 90,
    });
    expect(toBlockFields(youtubeVideoInput, new Map()).data).toEqual({
      source: 'youtube',
      videoId: 'dQw4w9WgXcQ',
      media: null,
      durationSeconds: null,
    });
  });

  it('keeps the other block types as they are', () => {
    for (const input of [
      richTextInput,
      quizInput,
      projectInput,
      reflectionInput,
      ...OTHER_INPUTS,
    ]) {
      expect(toBlockFields(input, new Map())).toEqual(input);
    }
  });

  it('stores only the five block fields, whatever else the input object carries', () => {
    const seedBlock = { id: 'b1', order: 7, ...quizInput };
    expect(Object.keys(toBlockFields(seedBlock, new Map())).sort()).toEqual([
      'data',
      'defaultLocale',
      'stage',
      'translations',
      'type',
    ]);
    const seedImage = { id: 'b2', ...imageInput };
    expect(toBlockFields(seedImage, MEDIA)).not.toHaveProperty('id');
  });

  it('refuses a file that was not resolved', () => {
    expect(() => toBlockFields(imageInput, new Map())).toThrow(ValidationError);
    expect(() =>
      toBlockFields(uploadedVideoInput, new Map([[FILE_A, MEDIA.get(FILE_A)!]])),
    ).toThrow(ValidationError);
  });
});

describe('linkedContent', () => {
  it('finds the quiz or project a block references', () => {
    expect(linkedContent(toBlockFields(quizInput, MEDIA))).toEqual({ kind: 'quiz', id: 'quiz-m1' });
    expect(linkedContent(toBlockFields(projectInput, MEDIA))).toEqual({
      kind: 'project',
      id: 'project-1',
    });
  });

  it('is null for every other block', () => {
    const others = ALL_INPUTS.filter((input) => input.type !== 'quiz' && input.type !== 'project');
    for (const input of others) expect(linkedContent(toBlockFields(input, MEDIA))).toBeNull();
  });
});

describe('deriveLessonFields', () => {
  it('describes a lesson without blocks', () => {
    expect(deriveLessonFields([])).toEqual({
      blockCount: 0,
      quizIds: [],
      projectIds: [],
      reflectionBlockIds: [],
      tutorExcerpt: {},
    });
  });

  it('counts every block and collects quizzes, projects and reflections', () => {
    const blocks = ALL_INPUTS.map((input, index) => stored(`b${index}`, index, input));
    const derived = deriveLessonFields(blocks);
    expect(derived.blockCount).toBe(ALL_INPUTS.length);
    expect(derived.quizIds).toEqual(['quiz-m1']);
    expect(derived.projectIds).toEqual(['project-1']);
    expect(derived.reflectionBlockIds).toEqual(['b7']);
    expect(derived.tutorExcerpt).toEqual({ en: 'Machines learn from examples.' });
  });

  it('reads the blocks by `order`, whatever order they arrive in', () => {
    const quiz = (id: string, order: number, quizId: string) =>
      stored(id, order, { ...quizInput, data: { quizId } } as BlockInput);
    const blocks = [
      quiz('b3', 30, 'quiz-c'),
      richText('b2', 20, { en: 'Second.' }),
      stored('r2', 25, reflectionInput),
      quiz('b1', 10, 'quiz-a'),
      stored('r1', 5, reflectionInput),
      richText('b0', 0, { en: 'First.' }),
    ];
    const derived = deriveLessonFields(blocks);
    expect(derived.quizIds).toEqual(['quiz-a', 'quiz-c']);
    expect(derived.reflectionBlockIds).toEqual(['r1', 'r2']);
    expect(derived.tutorExcerpt).toEqual({ en: 'First.\n\nSecond.' });
    expect(deriveLessonFields([...blocks].reverse())).toEqual(derived);
  });

  it('does not reorder the array it is given', () => {
    const blocks = [richText('b', 2, { en: 'B' }), richText('a', 1, { en: 'A' })];
    deriveLessonFields(blocks);
    expect(blocks.map((block) => block.id)).toEqual(['b', 'a']);
  });

  it('lists a quiz or project once even if two blocks name it', () => {
    const blocks = [stored('b1', 1, quizInput), stored('b2', 2, quizInput)];
    expect(deriveLessonFields(blocks).quizIds).toEqual(['quiz-m1']);
  });

  describe('tutorExcerpt', () => {
    it('has one entry per language that has text, from rich_text blocks only', () => {
      const blocks = [
        richText('b1', 1, { en: 'One.', fr: 'Un.' }),
        stored('b2', 2, reflectionInput),
        richText('b3', 3, { en: 'Two.', fr: 'Deux.' }),
      ];
      expect(deriveLessonFields(blocks).tutorExcerpt).toEqual({
        en: 'One.\n\nTwo.',
        fr: 'Un.\n\nDeux.',
      });
    });

    it('fills a language a block lacks with that block’s fallback text', () => {
      const blocks = [
        richText('b1', 1, { en: 'One.', fr: 'Un.' }),
        richText('b2', 2, { en: 'Two.' }),
        richText('b3', 3, { fr: 'Trois.' }, 'fr'),
      ];
      expect(deriveLessonFields(blocks).tutorExcerpt).toEqual({
        en: 'One.\n\nTwo.\n\nTrois.',
        fr: 'Un.\n\nTwo.\n\nTrois.',
      });
    });

    it('ignores blank bodies and languages that are blank everywhere', () => {
      const blocks = [
        richText('b1', 1, { en: '  Text.  ', fr: '   ' }),
        richText('b2', 2, { en: '' }),
      ];
      expect(deriveLessonFields(blocks).tutorExcerpt).toEqual({ en: 'Text.' });
    });

    it('is cut to the limit per language', () => {
      const limit = CONTENT_LIMITS.tutorExcerptChars;
      const blocks = [
        richText('b1', 1, { en: 'a'.repeat(limit - 10), fr: 'court' }),
        richText('b2', 2, { en: 'b'.repeat(500) }),
      ];
      const { tutorExcerpt } = deriveLessonFields(blocks);
      expect(tutorExcerpt.en).toHaveLength(limit);
      expect(tutorExcerpt.en?.endsWith('\n\nbbbbbbbb')).toBe(true);
      expect(tutorExcerpt.fr).toBe(`court\n\n${'b'.repeat(500)}`);
    });

    it('never ends on half a character', () => {
      const limit = CONTENT_LIMITS.tutorExcerptChars;
      // The emoji takes two UTF-16 units and straddles the limit.
      const blocks = [richText('b1', 1, { en: `${'a'.repeat(limit - 1)}🤖tail` })];
      const excerpt = deriveLessonFields(blocks).tutorExcerpt.en!;
      expect(excerpt).toBe('a'.repeat(limit - 1));
      expect(excerpt.isWellFormed()).toBe(true);
    });
  });
});

// --- Quizzes -----------------------------------------------------------------------------------

function question(overrides: Partial<QuizQuestionInput>): QuizQuestionInput {
  return {
    id: null,
    type: 'multiple_choice',
    points: 1,
    translations: { en: { prompt: 'Which one is a robot?' } },
    options: [
      { id: null, translations: { en: { text: 'A toaster' } } },
      { id: null, translations: { en: { text: 'A rover' } } },
    ],
    correctOptionIndexes: [1],
    acceptedAnswers: {},
    explanation: { en: { text: 'A rover senses and moves.' } },
    ...overrides,
  };
}

const QUIZ: QuizInput = {
  defaultLocale: 'en',
  translations: { en: { title: 'Module 1 quiz', instructions: null } },
  passingScorePercent: 70,
  maxAttempts: 3,
  xpReward: 100,
  shuffleQuestions: true,
  revealAnswers: 'after_pass',
  questions: [
    question({ id: 'q-robot' }),
    question({
      type: 'true_false',
      translations: { en: { prompt: 'AI never makes mistakes.' } },
      options: [
        { id: 'true', translations: { en: { text: 'True' } } },
        { id: 'false', translations: { en: { text: 'False' } } },
      ],
      correctOptionIndexes: [1],
      explanation: {},
    }),
    question({
      type: 'multiple_answer',
      points: 2,
      options: [
        { id: 'opt-a', translations: { en: { text: 'Camera' } } },
        { id: null, translations: { en: { text: 'Paint' } } },
        { id: 'opt-c', translations: { en: { text: 'Microphone' } } },
      ],
      correctOptionIndexes: [0, 2],
    }),
    question({
      type: 'short_answer',
      translations: { en: { prompt: 'What does AI stand for?' } },
      options: [],
      correctOptionIndexes: [],
      acceptedAnswers: { en: ['artificial intelligence'], fr: ['intelligence artificielle'] },
    }),
  ],
};

/** n1, n2, …: what a seed could pass. */
function counter(): () => string {
  let next = 0;
  return () => `n${(next += 1)}`;
}

describe('splitQuizInput', () => {
  it('is fed a quiz an editor could send', () => {
    expect(parseInput(quizInputSchema, QUIZ).success).toBe(true);
  });

  it('copies the settings and counts the questions', () => {
    const { quiz } = splitQuizInput(QUIZ, counter());
    expect(quiz).toMatchObject({
      defaultLocale: 'en',
      translations: QUIZ.translations,
      passingScorePercent: 70,
      maxAttempts: 3,
      xpReward: 100,
      shuffleQuestions: true,
      revealAnswers: 'after_pass',
      questionCount: 4,
    });
    expect(quiz).not.toHaveProperty('lessonId');
  });

  it('keeps the ids it is given and assigns the missing ones, questions first', () => {
    const { quiz } = splitQuizInput(QUIZ, counter());
    expect(quiz.questions.map((item) => item.id)).toEqual(['q-robot', 'n1', 'n2', 'n3']);
    expect(quiz.questions[0]!.options.map((option) => option.id)).toEqual(['n4', 'n5']);
    expect(quiz.questions[1]!.options.map((option) => option.id)).toEqual(['true', 'false']);
    expect(quiz.questions[2]!.options.map((option) => option.id)).toEqual(['opt-a', 'n6', 'opt-c']);
    expect(quiz.questions[3]!.options).toEqual([]);
  });

  it('turns the indexes of the correct options into their ids', () => {
    const { key } = splitQuizInput(QUIZ, counter());
    expect(key.answers).toEqual({
      'q-robot': { correctOptionIds: ['n5'], acceptedAnswers: {} },
      n1: { correctOptionIds: ['false'], acceptedAnswers: {} },
      n2: { correctOptionIds: ['opt-a', 'opt-c'], acceptedAnswers: {} },
      n3: {
        correctOptionIds: [],
        acceptedAnswers: { en: ['artificial intelligence'], fr: ['intelligence artificielle'] },
      },
    });
    expect(key.explanations['q-robot']).toEqual({ en: { text: 'A rover senses and moves.' } });
    expect(key.explanations.n1).toEqual({});
  });

  it('leaves nothing of the answer key in the student-readable part', () => {
    const { quiz } = splitQuizInput(QUIZ, counter());
    const readable = JSON.stringify(quiz);
    for (const secret of [
      'correct',
      'accepted',
      'explanation',
      'artificial intelligence',
      'senses',
    ]) {
      expect(readable).not.toContain(secret);
    }
    for (const item of quiz.questions) {
      expect(Object.keys(item).sort()).toEqual(['id', 'options', 'points', 'translations', 'type']);
      for (const option of item.options) {
        expect(Object.keys(option).sort()).toEqual(['id', 'translations']);
      }
    }
  });

  it('has a key entry for every question and no other', () => {
    const { quiz, key } = splitQuizInput(QUIZ, counter());
    const ids = quiz.questions.map((item) => item.id).sort();
    expect(Object.keys(key.answers).sort()).toEqual(ids);
    expect(Object.keys(key.explanations).sort()).toEqual(ids);
  });

  it('draws again when a new id is already taken, among questions and among options', () => {
    const drawn = ['q-robot', 'fresh-q', 'opt-a', 'opt-c', 'fresh-o'];
    const input: QuizInput = {
      ...QUIZ,
      questions: [QUIZ.questions[0]!, { ...QUIZ.questions[2]!, id: null }],
    };
    const { quiz } = splitQuizInput(input, () => drawn.shift() ?? 'spare');
    expect(quiz.questions.map((item) => item.id)).toEqual(['q-robot', 'fresh-q']);
    expect(quiz.questions[1]!.options.map((option) => option.id)).toEqual([
      'opt-a',
      'fresh-o',
      'opt-c',
    ]);
  });

  it('lets two questions use the same option ids', () => {
    const trueFalse = QUIZ.questions[1]!;
    const { quiz } = splitQuizInput({ ...QUIZ, questions: [trueFalse, trueFalse] }, counter());
    expect(quiz.questions.map((item) => item.options.map((option) => option.id))).toEqual([
      ['true', 'false'],
      ['true', 'false'],
    ]);
  });

  it('refuses a repeated or malformed id', () => {
    const twice = { ...QUIZ, questions: [QUIZ.questions[0]!, QUIZ.questions[0]!] };
    expect(() => splitQuizInput(twice, counter())).toThrow(ValidationError);

    const sameOptions = question({
      options: [
        { id: 'same', translations: { en: { text: 'A' } } },
        { id: 'same', translations: { en: { text: 'B' } } },
      ],
    });
    expect(() => splitQuizInput({ ...QUIZ, questions: [sameOptions] }, counter())).toThrow(
      ValidationError,
    );

    // '_' separates the parts of composite ids and '.' the parts of a field path.
    for (const id of ['a_b', 'a.b', 'a/b', '']) {
      const malformed = { ...QUIZ, questions: [question({ id })] };
      expect(() => splitQuizInput(malformed, counter())).toThrow(ValidationError);
    }
  });

  it('refuses a correct option that does not exist', () => {
    const input = { ...QUIZ, questions: [question({ correctOptionIndexes: [2] })] };
    expect(() => splitQuizInput(input, counter())).toThrow(ValidationError);
  });

  it('gives up on an id source that only repeats itself', () => {
    const input = { ...QUIZ, questions: [question({}), question({})] };
    expect(() => splitQuizInput(input, () => 'always')).toThrow(/newId/);
    expect(() => splitQuizInput(input, () => 'not an id')).toThrow(/newId/);
  });

  it('does not change its input', () => {
    const before = structuredClone(QUIZ);
    splitQuizInput(QUIZ, counter());
    expect(QUIZ).toEqual(before);
  });
});

describe('toQuizInput', () => {
  it('rebuilds what the editor saved, with the ids that were assigned', () => {
    const { quiz, key } = splitQuizInput(QUIZ, counter());
    const rebuilt = toQuizInput(quiz, key);

    expect(parseInput(quizInputSchema, rebuilt).success).toBe(true);
    expect(rebuilt.questions.map((item) => item.id)).toEqual(['q-robot', 'n1', 'n2', 'n3']);
    const withoutIds = (input: QuizInput) => ({
      ...input,
      questions: input.questions.map((item) => ({
        ...item,
        id: null,
        options: item.options.map((option) => ({ ...option, id: null })),
      })),
    });
    expect(withoutIds(rebuilt)).toEqual(withoutIds(QUIZ));
  });

  it('splits again into the same two documents', () => {
    const first = splitQuizInput(QUIZ, counter());
    const never = () => {
      throw new Error('every id is already set');
    };
    expect(splitQuizInput(toQuizInput(first.quiz, first.key), never)).toEqual(first);
  });

  it('survives a key that lacks a question, or names one like an Object method', () => {
    const { quiz } = splitQuizInput(
      { ...QUIZ, questions: [question({ id: 'constructor' })] },
      counter(),
    );
    const rebuilt = toQuizInput(quiz, { answers: {}, explanations: {} });
    expect(rebuilt.questions[0]).toMatchObject({
      id: 'constructor',
      correctOptionIndexes: [],
      acceptedAnswers: {},
      explanation: {},
    });
  });
});

describe('quizDocumentBytes', () => {
  it('measures the two documents together, in UTF-8 bytes', () => {
    const split = splitQuizInput(QUIZ, counter());
    const base = quizDocumentBytes(split.quiz, split.key);
    expect(base).toBe(Buffer.byteLength(JSON.stringify(split)));
    expect(base).toBeLessThan(CONTENT_LIMITS.quizDocumentBytes);

    const accented = structuredClone(split);
    accented.key.explanations['q-robot'] = { en: { text: 'é'.repeat(1000) } };
    const plain = structuredClone(split);
    plain.key.explanations['q-robot'] = { en: { text: 'e'.repeat(1000) } };
    expect(
      quizDocumentBytes(accented.quiz, accented.key) - quizDocumentBytes(plain.quiz, plain.key),
    ).toBe(1000);
  });

  it('puts the largest quiz the schema allows above the limit, so saveQuiz must check', () => {
    const big = question({
      translations: { en: { prompt: 'p'.repeat(CONTENT_LIMITS.questionPromptChars) } },
      options: Array.from({ length: CONTENT_LIMITS.optionsPerQuestion }, () => ({
        id: null,
        translations: Object.fromEntries(
          ['en', 'fr', 'ar', 'es', 'de', 'it', 'pt', 'nl', 'tr', 'pl', 'sv', 'da'].map((locale) => [
            locale,
            { text: 'o'.repeat(CONTENT_LIMITS.optionTextChars) },
          ]),
        ),
      })),
    });
    const input: QuizInput = {
      ...QUIZ,
      questions: Array.from({ length: CONTENT_LIMITS.questionsPerQuiz }, () => big),
    };
    expect(parseInput(quizInputSchema, input).success).toBe(true);
    const { quiz, key } = splitQuizInput(input, counter());
    expect(quizDocumentBytes(quiz, key)).toBeGreaterThan(CONTENT_LIMITS.quizDocumentBytes);
  });
});

describe('lessonProgressOf', () => {
  it('is a whole percentage that reaches 100 only with the last lesson', () => {
    expect(lessonProgressOf(0, 4)).toEqual({ progressPercent: 0, allLessonsDone: false });
    expect(lessonProgressOf(1, 3)).toEqual({ progressPercent: 33, allLessonsDone: false });
    expect(lessonProgressOf(2, 3)).toEqual({ progressPercent: 66, allLessonsDone: false });
    expect(lessonProgressOf(199, 200)).toEqual({ progressPercent: 99, allLessonsDone: false });
    expect(lessonProgressOf(4, 4)).toEqual({ progressPercent: 100, allLessonsDone: true });
  });

  it('stays at 100 when more lessons are recorded than the course now has', () => {
    expect(lessonProgressOf(5, 4)).toEqual({ progressPercent: 100, allLessonsDone: true });
  });

  it('never finishes a course without lessons', () => {
    expect(lessonProgressOf(0, 0)).toEqual({ progressPercent: 0, allLessonsDone: false });
    expect(lessonProgressOf(3, 0)).toEqual({ progressPercent: 0, allLessonsDone: false });
  });
});
