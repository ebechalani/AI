import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AI_LIMITS, CONTENT_LIMITS, SUBMISSION_LIMITS } from '@/lib/limits';
import * as adminSchemas from '@/lib/schemas/admin';
import * as aiSchemas from '@/lib/schemas/ai';
import * as authSchemas from '@/lib/schemas/auth';
import * as certificateSchemas from '@/lib/schemas/certificate';
import * as classSchemas from '@/lib/schemas/class';
import * as commonSchemas from '@/lib/schemas/common';
import * as courseSchemas from '@/lib/schemas/course';
import * as learningSchemas from '@/lib/schemas/learning';
import * as profileSchemas from '@/lib/schemas/profile';
import * as projectSchemas from '@/lib/schemas/project';
import * as quizSchemas from '@/lib/schemas/quiz';
import * as schoolSchemas from '@/lib/schemas/school';
import * as submissionSchemas from '@/lib/schemas/submission';
import en from '@/messages/en/validation.json';
import fr from '@/messages/fr/validation.json';
import type { BlockInput, QuizInput, QuizQuestionInput } from '@/types';

const { FORM_ERROR_KEY, VALIDATION_KEYS, isValidationKey, parseInput } = commonSchemas;

const FILE_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_FILE_ID = '123e4567-e89b-42d3-a456-426614174001';
const LATER = '2026-09-01T08:00:00.000Z';
const EARLIER = '2026-08-01T08:00:00.000Z';

function errorsOf(schema: z.ZodType, input: unknown): Record<string, string[]> {
  const result = parseInput(schema, input);
  return result.success ? {} : result.fieldErrors;
}

function dataOf<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = parseInput(schema, input);
  if (!result.success)
    throw new Error(`expected a valid input: ${JSON.stringify(result.fieldErrors)}`);
  return result.data;
}

const chars = (count: number) => 'a'.repeat(count);
const ids = (count: number) => Array.from({ length: count }, (_, index) => `id-${index}`);

describe('validation message keys', () => {
  it('are exactly the keys of the validation namespace, in both locales', () => {
    const keys = [...VALIDATION_KEYS].sort();
    expect(Object.keys(en).sort()).toEqual(keys);
    expect(Object.keys(fr).sort()).toEqual(keys);
  });

  it('label issues that no schema labelled', () => {
    const schema = z.object({
      name: z.string(),
      count: z.number().int(),
      email: z.email(),
      tags: z.array(z.string()).max(1),
    });
    expect(errorsOf(schema, { count: 1.5, email: 'nope', tags: ['a', 'b'] })).toEqual({
      name: ['required'],
      count: ['invalid_integer'],
      email: ['invalid_email'],
      tags: ['too_many'],
    });
  });

  it('report a problem with the input as a whole under the form key', () => {
    expect(errorsOf(z.string(), 5)).toEqual({ [FORM_ERROR_KEY]: ['invalid'] });
  });

  it('are the only messages any schema produces, whatever it is given', () => {
    const modules = {
      adminSchemas,
      aiSchemas,
      authSchemas,
      certificateSchemas,
      classSchemas,
      commonSchemas,
      courseSchemas,
      learningSchemas,
      profileSchemas,
      projectSchemas,
      quizSchemas,
      schoolSchemas,
      submissionSchemas,
    };
    const garbage: unknown[] = [
      undefined,
      null,
      0,
      -1.5,
      '',
      'x'.repeat(40_000),
      [],
      [null],
      {},
      { type: 'nope', purpose: 'nope', context: 'nope' },
      { translations: { '!!': 1 }, defaultLocale: 'xx', questions: [{}], messages: [{}] },
      {
        input: {},
        patch: { translations: {} },
        students: [{}],
        target: {},
        content: {},
        scope: {},
      },
    ];
    let schemaCount = 0;
    for (const [moduleName, exports] of Object.entries(modules)) {
      for (const [exportName, schema] of Object.entries(exports)) {
        if (!(schema instanceof z.ZodType)) continue;
        schemaCount += 1;
        for (const input of garbage) {
          for (const messages of Object.values(errorsOf(schema, input))) {
            for (const message of messages) {
              expect(isValidationKey(message), `${moduleName}.${exportName}: "${message}"`).toBe(
                true,
              );
            }
          }
        }
      }
    }
    expect(schemaCount).toBeGreaterThan(60);
  });
});

describe('auth schemas', () => {
  const signup = {
    displayName: 'Lea M',
    role: 'student',
    ageBand: '13-15',
    locale: 'fr',
    acceptedTerms: true,
  };

  it('accept self sign-up from 13 and for teachers as adults only', () => {
    const { signupInputSchema } = authSchemas;
    expect(errorsOf(signupInputSchema, signup)).toEqual({});
    expect(errorsOf(signupInputSchema, { ...signup, role: 'teacher', ageBand: 'adult' })).toEqual(
      {},
    );
    expect(errorsOf(signupInputSchema, { ...signup, ageBand: '11-12' })).toEqual({
      ageBand: ['age_band_not_allowed'],
    });
    expect(errorsOf(signupInputSchema, { ...signup, role: 'teacher', ageBand: '16-18' })).toEqual({
      ageBand: ['age_band_not_allowed'],
    });
    expect(errorsOf(signupInputSchema, { ...signup, role: 'school_admin' })).toEqual({
      role: ['invalid_choice'],
    });
  });

  it('require the terms and bound the display name', () => {
    expect(
      errorsOf(authSchemas.signupInputSchema, {
        ...signup,
        acceptedTerms: false,
        displayName: ' L ',
      }),
    ).toEqual({ acceptedTerms: ['terms_required'], displayName: ['display_name_length'] });
    expect(errorsOf(authSchemas.displayNameSchema, chars(41))).toEqual({
      [FORM_ERROR_KEY]: ['display_name_length'],
    });
  });

  it('carry the id token next to the sign-up fields', () => {
    const { completeSignupInputSchema } = authSchemas;
    expect(dataOf(completeSignupInputSchema, { ...signup, idToken: 'token' }).idToken).toBe(
      'token',
    );
    expect(errorsOf(completeSignupInputSchema, signup)).toEqual({ idToken: ['required'] });
  });

  it('normalise join codes and usernames before checking them', () => {
    const join = {
      joinCode: ' abcd-efgh ',
      displayName: 'Sam K',
      username: 'Sam.K',
      password: 'correct horse',
      ageBand: '8-10',
      locale: 'en',
      acceptedTerms: true,
    };
    const parsed = dataOf(authSchemas.joinSignupInputSchema, join);
    expect(parsed.joinCode).toBe('ABCDEFGH');
    expect(parsed.username).toBe('sam.k');

    // O, I, L, 0 and 1 are not in the alphabet.
    expect(
      errorsOf(authSchemas.joinSignupInputSchema, {
        ...join,
        joinCode: 'ABCDEFGO',
        username: 'a b',
        password: 'short',
      }),
    ).toEqual({
      joinCode: ['join_code_invalid'],
      username: ['username_invalid'],
      password: ['password_too_short'],
    });
  });

  it('accept a session request with or without a return path', () => {
    const { createSessionInputSchema } = authSchemas;
    expect(errorsOf(createSessionInputSchema, { idToken: 'token' })).toEqual({});
    expect(errorsOf(createSessionInputSchema, { idToken: 'token', next: '/student' })).toEqual({});
    expect(errorsOf(createSessionInputSchema, { idToken: '' })).toEqual({ idToken: ['required'] });
    expect(errorsOf(createSessionInputSchema, { idToken: '   ' })).toEqual({
      idToken: ['required'],
    });
    expect(
      errorsOf(createSessionInputSchema, { idToken: chars(CONTENT_LIMITS.idTokenChars + 1) }),
    ).toEqual({ idToken: ['too_long'] });
  });
});

describe('profile and class schemas', () => {
  it('accept a partial profile patch and only known avatars', () => {
    const { profilePatchSchema } = profileSchemas;
    expect(dataOf(profilePatchSchema, { locale: 'fr' })).toEqual({ locale: 'fr' });
    expect(errorsOf(profilePatchSchema, { avatarId: 'robot' })).toEqual({});
    expect(errorsOf(profilePatchSchema, { avatarId: 'my-photo', locale: 'de' })).toEqual({
      avatarId: ['invalid_choice'],
      locale: ['invalid_choice'],
    });
  });

  it('bound class names and the number of students added at once', () => {
    const { classInputSchema, addStudentsInputSchema } = classSchemas;
    const cls = { name: 'Grade 6 B', gradeLabel: null, ageBand: '11-12' };
    expect(errorsOf(classInputSchema, cls)).toEqual({});
    expect(errorsOf(classInputSchema, { ...cls, name: '  ' })).toEqual({ name: ['required'] });
    expect(
      errorsOf(classInputSchema, { ...cls, name: chars(CONTENT_LIMITS.classNameChars + 1) }),
    ).toEqual({
      name: ['too_long'],
    });

    const students = (count: number) =>
      Array.from({ length: count }, (_, index) => ({ displayName: `Student ${index}` }));
    expect(
      errorsOf(addStudentsInputSchema, {
        classId: 'class-1',
        students: students(CONTENT_LIMITS.studentsPerClass),
      }),
    ).toEqual({});
    expect(
      errorsOf(addStudentsInputSchema, {
        classId: 'class-1',
        students: students(CONTENT_LIMITS.studentsPerClass + 1),
      }),
    ).toEqual({ students: ['too_many'] });
    expect(errorsOf(addStudentsInputSchema, { classId: 'class-1', students: [] })).toEqual({
      students: ['required'],
    });
  });

  it('reject ids that could be mistaken for a composite id', () => {
    expect(errorsOf(classSchemas.classRefInputSchema, { classId: 'a_b' })).toEqual({
      classId: ['invalid'],
    });
    expect(
      errorsOf(classSchemas.assignCourseInputSchema, {
        classId: 'c1',
        courseId: 'k1',
        dueAt: 'soon',
      }),
    ).toEqual({
      dueAt: ['invalid_date'],
    });
    expect(
      errorsOf(classSchemas.assignCourseInputSchema, {
        classId: 'c1',
        courseId: 'k1',
        dueAt: LATER,
      }),
    ).toEqual({});
  });
});

describe('course schemas', () => {
  const course = {
    defaultLocale: 'en',
    translations: {
      en: {
        title: 'My first AI adventure',
        summary: 'Meet AI',
        description: 'A first course.',
        outcomes: [],
      },
    },
    audience: 'student',
    area: 'ai',
    tags: ['Vision', 'sensors'],
    ageMin: 8,
    ageMax: 10,
    estimatedMinutes: 120,
    visibility: 'private',
    certificateEnabled: true,
    coverImageFileId: null,
    hardwarePlatformIds: [],
    requiredCapabilities: ['camera'],
  };

  it('keep the platform-admin fields only in the admin schema', () => {
    const input = { ...course, isOfficial: true, pathwayId: 'ai-explorer', accessTier: 'premium' };
    const forAdmin = dataOf(courseSchemas.courseInputSchema, input);
    expect(forAdmin.isOfficial).toBe(true);
    expect(forAdmin.tags).toEqual(['vision', 'sensors']);

    const forTeacher = dataOf(courseSchemas.teacherCourseInputSchema, input);
    expect(forTeacher).not.toHaveProperty('isOfficial');
    expect(forTeacher).not.toHaveProperty('pathwayId');
    expect(forTeacher).not.toHaveProperty('accessTier');
    expect(courseSchemas.stripAdminCourseFields(forAdmin)).toEqual(forTeacher);
  });

  it('require every text field in the default language and a sane age range', () => {
    expect(
      errorsOf(courseSchemas.courseInputSchema, {
        ...course,
        defaultLocale: 'fr',
        ageMin: 12,
        ageMax: 10,
        tags: ['a', 'a'],
      }),
    ).toEqual({
      'translations.fr.title': ['default_locale_required'],
      'translations.fr.summary': ['default_locale_required'],
      'translations.fr.description': ['default_locale_required'],
      ageMax: ['age_range'],
      tags: ['duplicate'],
    });
  });

  it('accept content in a language the UI has not enabled', () => {
    const translations = { ...course.translations, ar: { ...course.translations.en } };
    expect(errorsOf(courseSchemas.courseInputSchema, { ...course, translations })).toEqual({});
    expect(
      errorsOf(courseSchemas.courseInputSchema, {
        ...course,
        translations: { ...translations, 'not a locale': {} },
      }),
    ).toHaveProperty(['translations.not a locale']);
  });

  it('make a patch carry translations and defaultLocale together', () => {
    const { updateCourseInputSchema } = courseSchemas;
    expect(
      errorsOf(updateCourseInputSchema, { courseId: 'c1', patch: { estimatedMinutes: 30 } }),
    ).toEqual({});
    expect(
      errorsOf(updateCourseInputSchema, {
        courseId: 'c1',
        patch: { translations: course.translations },
      }),
    ).toEqual({ 'patch.defaultLocale': ['required'] });
  });

  it('bound lessons, modules and reordering', () => {
    const lesson = {
      defaultLocale: 'en',
      translations: { en: { title: 'What is AI?', summary: 'A first look.' } },
      estimatedMinutes: 20,
      xpReward: 50,
    };
    expect(errorsOf(courseSchemas.lessonInputSchema, lesson)).toEqual({});
    expect(
      errorsOf(courseSchemas.lessonInputSchema, {
        ...lesson,
        xpReward: CONTENT_LIMITS.xpRewardMax.lesson + 1,
        estimatedMinutes: 0,
      }),
    ).toEqual({ xpReward: ['too_big'], estimatedMinutes: ['too_small'] });

    expect(
      errorsOf(courseSchemas.reorderBlocksInputSchema, {
        courseId: 'c1',
        lessonId: 'l1',
        orderedIds: ids(CONTENT_LIMITS.blocksPerLesson + 1),
      }),
    ).toEqual({ orderedIds: ['too_many'] });
    expect(
      errorsOf(courseSchemas.reorderModulesInputSchema, {
        courseId: 'c1',
        orderedIds: ['m1', 'm1'],
      }),
    ).toEqual({ orderedIds: ['duplicate'] });
  });
});

describe('block schema', () => {
  const base = { stage: 'learn', defaultLocale: 'en' } as const;
  const blocks: BlockInput[] = [
    {
      ...base,
      type: 'rich_text',
      translations: { en: { heading: null, body: '# Hello' } },
      data: {},
    },
    {
      ...base,
      type: 'image',
      translations: { en: { alt: 'A robot', caption: null } },
      data: { fileId: FILE_ID },
    },
    {
      ...base,
      type: 'video',
      translations: { en: { title: 'Intro', caption: null, transcript: null } },
      data: { source: 'youtube', videoId: 'dQw4w9WgXcQ', fileId: null, durationSeconds: 212 },
    },
    {
      ...base,
      type: 'video',
      translations: { en: { title: 'Intro', caption: null, transcript: 'Hello.' } },
      data: { source: 'file', videoId: null, fileId: FILE_ID, durationSeconds: null },
    },
    {
      ...base,
      type: 'file',
      translations: { en: { label: 'Worksheet', description: null } },
      data: { fileId: FILE_ID },
    },
    { ...base, type: 'quiz', translations: {}, data: { quizId: 'quiz-m1' } },
    {
      ...base,
      type: 'code_activity',
      translations: { en: { instructions: 'Print hello.', hint: null } },
      data: { language: 'python', starterCode: '  print("hi")\n' },
    },
    {
      ...base,
      type: 'ai_activity',
      translations: { en: { instructions: 'Ask Robo.', starterPrompt: null } },
      data: { tutorMode: 'explain', labToolId: null },
    },
    {
      ...base,
      type: 'embed',
      translations: { en: { title: 'Demo', caption: null } },
      data: { url: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', aspectRatio: '16:9' },
    },
    {
      ...base,
      type: 'reflection',
      translations: { en: { prompt: 'What did you learn?' } },
      data: { minLength: 20 },
    },
    {
      ...base,
      type: 'project',
      translations: { en: { intro: null } },
      data: { projectId: 'project-1' },
    },
  ];

  it.each(blocks.map((block) => [block.type, block] as const))(
    'accepts a %s block',
    (_type, block) => {
      expect(errorsOf(courseSchemas.blockInputSchema, block)).toEqual({});
    },
  );

  it('keeps the indentation of starter code', () => {
    const parsed = dataOf(courseSchemas.blockInputSchema, blocks[6]);
    expect(parsed.type === 'code_activity' && parsed.data.starterCode).toBe('  print("hi")\n');
  });

  it('takes a file id, never a MediaRef, for media blocks', () => {
    const media = { fileId: FILE_ID, storagePath: 'course-media/official/x/y.png' };
    const parsed = dataOf(courseSchemas.blockInputSchema, { ...blocks[1], data: media });
    expect(parsed.data).toEqual({ fileId: FILE_ID });
    expect(errorsOf(courseSchemas.blockInputSchema, { ...blocks[1], data: { media } })).toEqual({
      'data.fileId': ['required'],
    });
  });

  it('checks the video reference against its source', () => {
    const video = blocks[2];
    expect(
      errorsOf(courseSchemas.blockInputSchema, {
        ...video,
        data: { ...video.data, videoId: 'not an id' },
      }),
    ).toEqual({ 'data.videoId': ['video_id_invalid'] });
    expect(
      errorsOf(courseSchemas.blockInputSchema, {
        ...video,
        data: { source: 'file', videoId: null, fileId: null, durationSeconds: null },
      }),
    ).toEqual({ 'data.fileId': ['required'] });
    expect(
      errorsOf(courseSchemas.blockInputSchema, {
        ...video,
        data: { source: 'vimeo', videoId: '123456789', fileId: FILE_ID, durationSeconds: null },
      }),
    ).toEqual({ 'data.fileId': ['invalid'] });
  });

  it('allows embeds from the allow-listed hosts only', () => {
    const embed = blocks[8];
    for (const url of ['https://evil.example/embed/1', 'http://player.vimeo.com/video/1']) {
      const errors = errorsOf(courseSchemas.blockInputSchema, {
        ...embed,
        data: { url, aspectRatio: '16:9' },
      });
      expect(Object.keys(errors)).toEqual(['data.url']);
    }
    expect(courseSchemas.isEmbeddableUrl('https://player.vimeo.com/video/76979871')).toBe(true);
    expect(courseSchemas.isEmbeddableUrl('https://player.vimeo.com.evil.example/video/1')).toBe(
      false,
    );
    // The CSP frame-src lists the bare hosts, so the browser would block these two.
    expect(courseSchemas.isEmbeddableUrl('https://player.vimeo.com:8443/video/1')).toBe(false);
    expect(courseSchemas.isEmbeddableUrl('https://user:pw@player.vimeo.com/video/1')).toBe(false);
  });

  it('enforces the text limits and the required text of the default language', () => {
    expect(
      errorsOf(courseSchemas.blockInputSchema, {
        ...blocks[0],
        translations: { en: { heading: null, body: chars(CONTENT_LIMITS.richTextBodyChars + 1) } },
      }),
    ).toEqual({ 'translations.en.body': ['too_long'] });
    expect(
      errorsOf(courseSchemas.blockInputSchema, {
        ...blocks[3],
        translations: {
          en: {
            title: 'Intro',
            caption: null,
            transcript: chars(CONTENT_LIMITS.videoTranscriptChars + 1),
          },
        },
      }),
    ).toEqual({ 'translations.en.transcript': ['too_long'] });
    expect(
      errorsOf(courseSchemas.blockInputSchema, {
        ...blocks[0],
        translations: { fr: { heading: null, body: 'Salut' } },
      }),
    ).toEqual({ 'translations.en.body': ['default_locale_required'] });
  });

  it('rejects an unknown block type or stage', () => {
    expect(errorsOf(courseSchemas.blockInputSchema, { ...blocks[0], type: 'script' })).toEqual({
      type: ['invalid_choice'],
    });
    expect(errorsOf(courseSchemas.blockInputSchema, { ...blocks[0], stage: 'earn' })).toEqual({
      stage: ['invalid_choice'],
    });
  });
});

describe('quiz schemas', () => {
  const option = (text: string, id: string | null = null) => ({
    id,
    translations: { en: { text } },
  });
  const question = (overrides: Partial<QuizQuestionInput> = {}): QuizQuestionInput => ({
    id: null,
    type: 'multiple_choice',
    points: 1,
    translations: { en: { prompt: 'Which one is a robot?' } },
    options: [option('A toaster'), option('A rover')],
    correctOptionIndexes: [1],
    acceptedAnswers: {},
    explanation: {},
    ...overrides,
  });
  const quiz = (questions: QuizQuestionInput[]): QuizInput => ({
    defaultLocale: 'en',
    translations: { en: { title: 'Check what you know', instructions: null } },
    passingScorePercent: 70,
    maxAttempts: null,
    xpReward: 100,
    shuffleQuestions: false,
    revealAnswers: 'after_pass',
    questions,
  });
  const { quizInputSchema } = quizSchemas;

  it('accepts one question of every type', () => {
    const input = quiz([
      question(),
      question({ type: 'multiple_answer', correctOptionIndexes: [0, 1] }),
      question({
        type: 'true_false',
        options: [option('True', 'true'), option('False', 'false')],
        correctOptionIndexes: [0],
      }),
      question({
        type: 'short_answer',
        options: [],
        correctOptionIndexes: [],
        acceptedAnswers: { en: ['a rover', 'rover'], fr: ['un rover'] },
        explanation: { en: { text: 'Rovers sense and act.' } },
      }),
    ]);
    expect(errorsOf(quizInputSchema, input)).toEqual({});
  });

  it('requires a correct answer that fits the question type', () => {
    expect(errorsOf(quizInputSchema, quiz([question({ correctOptionIndexes: [] })]))).toEqual({
      'questions.0.correctOptionIndexes': ['correct_option_required'],
    });
    expect(errorsOf(quizInputSchema, quiz([question({ correctOptionIndexes: [0, 1] })]))).toEqual({
      'questions.0.correctOptionIndexes': ['too_many'],
    });
    expect(errorsOf(quizInputSchema, quiz([question({ correctOptionIndexes: [2] })]))).toEqual({
      'questions.0.correctOptionIndexes': ['invalid'],
    });
    expect(
      errorsOf(
        quizInputSchema,
        quiz([question({ type: 'short_answer', options: [], correctOptionIndexes: [] })]),
      ),
    ).toEqual({ 'questions.0.acceptedAnswers.en': ['correct_option_required'] });
  });

  it('fixes the options of a true/false question', () => {
    expect(errorsOf(quizInputSchema, quiz([question({ type: 'true_false' })]))).toEqual({
      'questions.0.options': ['invalid'],
    });
  });

  it('requires the prompt and option text in the default language', () => {
    expect(
      errorsOf(
        quizInputSchema,
        quiz([
          question({
            translations: { fr: { prompt: 'Lequel ?' } },
            options: [option('A'), { id: null, translations: {} }],
          }),
        ]),
      ),
    ).toEqual({
      'questions.0.translations.en.prompt': ['default_locale_required'],
      'questions.0.options.1.translations.en.text': ['default_locale_required'],
    });
  });

  it('enforces the content limits', () => {
    const many = <T>(count: number, make: (index: number) => T) =>
      Array.from({ length: count }, (_, i) => make(i));

    expect(
      errorsOf(quizInputSchema, quiz(many(CONTENT_LIMITS.questionsPerQuiz + 1, () => question()))),
    ).toEqual({ questions: ['too_many'] });
    expect(errorsOf(quizInputSchema, quiz([]))).toEqual({ questions: ['required'] });

    expect(
      errorsOf(
        quizInputSchema,
        quiz([
          question({
            options: many(CONTENT_LIMITS.optionsPerQuestion + 1, (i) => option(`Option ${i}`)),
          }),
        ]),
      ),
    ).toEqual({ 'questions.0.options': ['too_many'] });

    expect(
      errorsOf(
        quizInputSchema,
        quiz([
          question({
            translations: { en: { prompt: chars(CONTENT_LIMITS.questionPromptChars + 1) } },
            options: [option(chars(CONTENT_LIMITS.optionTextChars + 1)), option('B')],
            explanation: { en: { text: chars(CONTENT_LIMITS.explanationChars + 1) } },
          }),
        ]),
      ),
    ).toEqual({
      'questions.0.translations.en.prompt': ['too_long'],
      'questions.0.options.0.translations.en.text': ['too_long'],
      'questions.0.explanation.en.text': ['too_long'],
    });

    const shortAnswer = (accepted: string[]) =>
      quiz([
        question({
          type: 'short_answer',
          options: [],
          correctOptionIndexes: [],
          acceptedAnswers: { en: accepted },
        }),
      ]);
    expect(
      errorsOf(
        quizInputSchema,
        shortAnswer(many(CONTENT_LIMITS.acceptedAnswersPerQuestion + 1, (i) => `answer ${i}`)),
      ),
    ).toEqual({ 'questions.0.acceptedAnswers.en': ['too_many'] });
    expect(
      errorsOf(quizInputSchema, shortAnswer([chars(CONTENT_LIMITS.acceptedAnswerChars + 1)])),
    ).toEqual({ 'questions.0.acceptedAnswers.en.0': ['too_long'] });
  });

  it('accepts answers keyed by question id', () => {
    const { submitQuizAttemptInputSchema } = quizSchemas;
    const attempt = {
      courseId: 'c1',
      quizId: 'quiz-m1',
      answers: {
        q1: { selectedOptionIds: ['o2'], text: null },
        q2: { selectedOptionIds: [], text: ' A rover ' },
      },
    };
    expect(dataOf(submitQuizAttemptInputSchema, attempt).answers.q2?.text).toBe('A rover');
    expect(
      errorsOf(submitQuizAttemptInputSchema, {
        ...attempt,
        answers: { q1: { selectedOptionIds: ['o1', 'o1'], text: null } },
      }),
    ).toEqual({ 'answers.q1.selectedOptionIds': ['duplicate'] });
  });
});

describe('project and submission schemas', () => {
  const project = {
    kind: 'project',
    defaultLocale: 'en',
    translations: {
      en: { title: 'Build a chatbot', brief: 'Make one.', requirements: 'It must answer.' },
    },
    allowedSubmissionTypes: ['text', 'image'],
    rubric: [
      { key: 'creativity', weight: 25 },
      { key: 'technicalQuality', weight: 25 },
      { key: 'understanding', weight: 25 },
      { key: 'responsibleAi', weight: 25 },
    ],
    xpReward: 300,
    requiredForCertificate: true,
  };

  it('require rubric weights that sum to 100, one per criterion', () => {
    const { projectInputSchema } = projectSchemas;
    expect(errorsOf(projectInputSchema, project)).toEqual({});
    expect(
      errorsOf(projectInputSchema, { ...project, rubric: [{ key: 'creativity', weight: 60 }] }),
    ).toEqual({ rubric: ['weights_sum'] });
    expect(
      errorsOf(projectInputSchema, {
        ...project,
        rubric: [
          { key: 'creativity', weight: 50 },
          { key: 'creativity', weight: 50 },
        ],
        allowedSubmissionTypes: [],
      }),
    ).toEqual({ rubric: ['duplicate'], allowedSubmissionTypes: ['required'] });
  });

  const work = {
    target: { context: 'project', courseId: 'c1', projectId: 'project-1' },
    title: 'My chatbot',
    description: 'It answers questions about space.',
    type: 'text',
    content: { text: 'Here is how it works.', linkUrl: null, code: null, codeLanguage: null },
    fileIds: [],
    previousSubmissionId: null,
  };

  it('require the content the submission type names', () => {
    const { submitWorkInputSchema } = submissionSchemas;
    expect(errorsOf(submitWorkInputSchema, work)).toEqual({});
    expect(
      errorsOf(submitWorkInputSchema, {
        ...work,
        target: { context: 'challenge', challengeId: 'ch1' },
      }),
    ).toEqual({});
    expect(
      errorsOf(submitWorkInputSchema, { ...work, content: { ...work.content, text: '  ' } }),
    ).toEqual({ 'content.text': ['content_required'] });
    expect(errorsOf(submitWorkInputSchema, { ...work, type: 'image' })).toEqual({
      fileIds: ['content_required'],
    });
    expect(errorsOf(submitWorkInputSchema, { ...work, type: 'image', fileIds: [FILE_ID] })).toEqual(
      {},
    );
    expect(errorsOf(submitWorkInputSchema, { ...work, type: 'link' })).toEqual({
      'content.linkUrl': ['content_required'],
    });
  });

  it('enforce the submission limits', () => {
    const { submitWorkInputSchema } = submissionSchemas;
    expect(
      errorsOf(submitWorkInputSchema, {
        ...work,
        title: chars(SUBMISSION_LIMITS.titleChars + 1),
        description: chars(SUBMISSION_LIMITS.descriptionChars + 1),
        content: {
          text: chars(SUBMISSION_LIMITS.textChars + 1),
          linkUrl: 'http://example.com/project',
          code: chars(SUBMISSION_LIMITS.codeChars + 1),
          codeLanguage: null,
        },
        fileIds: Array.from(
          { length: SUBMISSION_LIMITS.maxAttachments + 1 },
          (_, i) => `${FILE_ID.slice(0, -1)}${i}`,
        ),
      }),
    ).toEqual({
      title: ['too_long'],
      description: ['too_long'],
      'content.text': ['too_long'],
      'content.linkUrl': ['invalid_url'],
      'content.code': ['too_long'],
      fileIds: ['too_many_files'],
    });
    expect(
      errorsOf(submitWorkInputSchema, { ...work, previousSubmissionId: 'uid1_p_c1_project-1_1' }),
    ).toEqual({});
  });

  it('tie review criteria to the decision', () => {
    const { reviewInputSchema } = submissionSchemas;
    const criteria = {
      creativity: 80,
      technicalQuality: 70,
      understanding: 90,
      responsibleAi: 100,
    };
    const review = {
      submissionId: 'uid1_p_c1_project-1_1',
      decision: 'modify',
      criteria,
      feedback: 'Well done.',
    };
    expect(errorsOf(reviewInputSchema, review)).toEqual({});
    expect(errorsOf(reviewInputSchema, { ...review, criteria: null })).toEqual({
      criteria: ['required'],
    });
    expect(errorsOf(reviewInputSchema, { ...review, decision: 'approve' })).toEqual({
      criteria: ['invalid'],
    });
    expect(
      errorsOf(reviewInputSchema, { ...review, decision: 'return', criteria: null, feedback: ' ' }),
    ).toEqual({ feedback: ['required'] });
    expect(
      errorsOf(reviewInputSchema, { ...review, criteria: { ...criteria, creativity: 101 } }),
    ).toEqual({ 'criteria.creativity': ['too_big'] });
  });

  it('name the AI suggestion a review was decided on, optionally (WS-D-4)', () => {
    const { reviewInputSchema } = submissionSchemas;
    const approve = {
      submissionId: 'uid1_p_c1_project-1_1',
      decision: 'approve',
      criteria: null,
      feedback: 'Well done.',
    };
    expect(errorsOf(reviewInputSchema, approve)).toEqual({});
    expect(errorsOf(reviewInputSchema, { ...approve, aiReviewId: null })).toEqual({});
    expect(errorsOf(reviewInputSchema, { ...approve, aiReviewId: 'q4XChK972fSu4wO56qhE' })).toEqual(
      {},
    );
    for (const aiReviewId of ['', 'a/b', 'a_b', 'x'.repeat(65), 7]) {
      expect(errorsOf(reviewInputSchema, { ...approve, aiReviewId })).toEqual({
        aiReviewId: ['invalid'],
      });
    }
    const parsed = reviewInputSchema.safeParse({ ...approve, aiReviewId: 'q4XChK972fSu4wO56qhE' });
    expect(parsed.success && parsed.data.aiReviewId).toBe('q4XChK972fSu4wO56qhE');
  });

  it('register an upload by id, kind and file name, never by path', () => {
    const { registerUploadInputSchema } = submissionSchemas;
    const upload = {
      fileId: FILE_ID,
      kind: 'image',
      fileName: 'robot_1.png',
      purpose: 'submission',
    };
    expect(
      dataOf(registerUploadInputSchema, {
        ...upload,
        storagePath: 'user-uploads/other/x',
        courseId: 'c1',
      }),
    ).toEqual(upload);
    expect(
      dataOf(registerUploadInputSchema, {
        ...upload,
        purpose: 'course_media',
        courseId: null,
        width: 640,
        height: 480,
      }),
    ).toEqual({ ...upload, purpose: 'course_media', courseId: null, width: 640, height: 480 });
    expect(errorsOf(registerUploadInputSchema, { ...upload, purpose: 'course_media' })).toEqual({
      courseId: ['required'],
    });
    expect(
      errorsOf(registerUploadInputSchema, {
        ...upload,
        fileId: 'not-a-uuid',
        fileName: '../secret.png',
        kind: 'svg',
      }),
    ).toEqual({ fileId: ['invalid'], fileName: ['file_name_invalid'], kind: ['invalid_choice'] });
    for (const fileName of ['.', '..', '...']) {
      expect(errorsOf(registerUploadInputSchema, { ...upload, fileName })).toEqual({
        fileName: ['file_name_invalid'],
      });
    }
    expect(errorsOf(registerUploadInputSchema, { ...upload, fileName: 'v1.2.png' })).toEqual({});
    expect(
      errorsOf(submissionSchemas.deleteAttachmentInputSchema, {
        submissionId: 'u_c_ch1_1',
        fileId: OTHER_FILE_ID,
      }),
    ).toEqual({});
  });
});

describe('tutor and lab schemas', () => {
  const { tutorRequestSchema } = aiSchemas;
  const turn = (role: 'user' | 'assistant', content = 'Why is the sky blue?') => ({
    role,
    content,
  });
  const request = (messages: unknown[], rest: object = {}) => ({
    mode: 'explain',
    courseId: 'c1',
    lessonId: 'm1-l1',
    messages,
    locale: 'en',
    ...rest,
  });
  const LIMITS = AI_LIMITS.tutorRequest;

  it('accepts an alternating thread that ends with the learner', () => {
    expect(errorsOf(tutorRequestSchema, request([turn('user')]))).toEqual({});
    expect(
      errorsOf(
        tutorRequestSchema,
        request([turn('assistant'), turn('user')], { courseId: null, lessonId: null }),
      ),
    ).toEqual({});
    const full = Array.from({ length: LIMITS.maxMessages }, (_, i) =>
      turn(i % 2 === 0 ? 'assistant' : 'user'),
    );
    expect(errorsOf(tutorRequestSchema, request(full))).toEqual({});
  });

  it('rejects a thread that does not alternate or does not end with the learner', () => {
    expect(errorsOf(tutorRequestSchema, request([turn('user'), turn('user')]))).toEqual({
      messages: ['invalid'],
    });
    expect(errorsOf(tutorRequestSchema, request([turn('user'), turn('assistant')]))).toEqual({
      messages: ['invalid'],
    });
    expect(errorsOf(tutorRequestSchema, request([]))).toEqual({ messages: ['required'] });
  });

  it('caps the number and the length of messages', () => {
    const tooMany = Array.from({ length: LIMITS.maxMessages + 1 }, (_, i) =>
      turn(i % 2 === 0 ? 'user' : 'assistant'),
    );
    expect(errorsOf(tutorRequestSchema, request(tooMany))).toEqual({ messages: ['too_many'] });

    expect(
      errorsOf(tutorRequestSchema, request([turn('user', chars(LIMITS.userMessageChars + 1))])),
    ).toEqual({ 'messages.0.content': ['too_long'] });
    expect(
      errorsOf(
        tutorRequestSchema,
        request([turn('assistant', chars(LIMITS.assistantMessageChars + 1)), turn('user')]),
      ),
    ).toEqual({ 'messages.0.content': ['too_long'] });
    expect(
      errorsOf(
        tutorRequestSchema,
        request([turn('assistant', chars(LIMITS.assistantMessageChars)), turn('user')]),
      ),
    ).toEqual({});

    const long = Array.from({ length: LIMITS.maxMessages }, (_, i) =>
      i % 2 === 0
        ? turn('assistant', chars(LIMITS.assistantMessageChars))
        : turn('user', chars(LIMITS.userMessageChars)),
    );
    expect(errorsOf(tutorRequestSchema, request(long))).toEqual({ messages: ['too_long'] });
  });

  it('needs the course of a lesson, a known mode and a non-empty question', () => {
    expect(errorsOf(tutorRequestSchema, request([turn('user', '  ')], { courseId: null }))).toEqual(
      {
        courseId: ['required'],
        'messages.0.content': ['required'],
      },
    );
    expect(
      errorsOf(tutorRequestSchema, request([turn('user')], { mode: 'do_my_homework' })),
    ).toEqual({
      mode: ['invalid_choice'],
    });
  });

  it('validates a lab request', () => {
    const { runLabToolInputSchema } = aiSchemas;
    expect(
      errorsOf(runLabToolInputSchema, { toolId: 'text', prompt: 'A poem about robots' }),
    ).toEqual({});
    expect(
      errorsOf(runLabToolInputSchema, {
        toolId: 'deepfake',
        prompt: chars(AI_LIMITS.labPromptChars + 1),
      }),
    ).toEqual({ toolId: ['invalid_choice'], prompt: ['too_long'] });
  });
});

describe('school and admin schemas', () => {
  it('normalise the country and bound the school settings', () => {
    const school = { name: 'Lycée Montaigne', country: 'lb', city: null, defaultLocale: 'fr' };
    expect(dataOf(schoolSchemas.schoolInputSchema, school).country).toBe('LB');
    expect(
      errorsOf(schoolSchemas.schoolInputSchema, { ...school, country: 'LBN', name: 'L' }),
    ).toEqual({
      country: ['invalid'],
      name: ['too_short'],
    });

    const settings = { aiEnabled: true, aiDailyMessageLimit: null, joinCodesEnabled: false };
    expect(errorsOf(schoolSchemas.updateSchoolSettingsInputSchema, { settings })).toEqual({});
    expect(
      errorsOf(schoolSchemas.updateSchoolSettingsInputSchema, {
        settings: { ...settings, aiDailyMessageLimit: AI_LIMITS.schoolDailyMessageLimit.max + 1 },
      }),
    ).toEqual({ 'settings.aiDailyMessageLimit': ['too_big'] });
    expect(
      dataOf(schoolSchemas.updateSchoolSettingsInputSchema, { country: 'FR', city: 'Beirut' }),
    ).toEqual({
      city: 'Beirut',
    });
  });

  it('bound the teachers of a class and normalise a teacher email', () => {
    expect(
      errorsOf(schoolSchemas.setClassTeachersInputSchema, {
        classId: 'c1',
        teacherUids: ids(CONTENT_LIMITS.teachersPerClass + 1),
      }),
    ).toEqual({ teacherUids: ['too_many'] });
    expect(
      errorsOf(schoolSchemas.setClassTeachersInputSchema, { classId: 'c1', teacherUids: [] }),
    ).toEqual({
      teacherUids: ['required'],
    });
    expect(
      dataOf(schoolSchemas.createTeacherInputSchema, {
        displayName: 'Ms Rivera',
        email: ' Ana.Rivera@Example.org ',
      }).email,
    ).toBe('ana.rivera@example.org');
    expect(
      errorsOf(schoolSchemas.createTeacherInputSchema, { displayName: 'Ms Rivera', email: 'ana' }),
    ).toEqual({ email: ['invalid_email'] });
  });

  it('tie the school of a role change to the role', () => {
    const { setUserRoleInputSchema } = adminSchemas;
    expect(
      errorsOf(setUserRoleInputSchema, { uid: 'u1', role: 'teacher', schoolId: null }),
    ).toEqual({});
    expect(
      errorsOf(setUserRoleInputSchema, { uid: 'u1', role: 'school_admin', schoolId: null }),
    ).toEqual({
      schoolId: ['required'],
    });
    expect(
      errorsOf(setUserRoleInputSchema, { uid: 'u1', role: 'platform_admin', schoolId: 's1' }),
    ).toEqual({
      schoolId: ['invalid'],
    });
  });

  it('validate subscriptions', () => {
    const { subscriptionInputSchema } = adminSchemas;
    const subscription = {
      ownerType: 'user',
      ownerId: 'u1',
      plan: 'individual_monthly',
      status: 'active',
      currentPeriodStart: EARLIER,
      currentPeriodEnd: LATER,
      courseIds: [],
      notes: null,
    };
    expect(errorsOf(subscriptionInputSchema, subscription)).toEqual({});
    expect(errorsOf(subscriptionInputSchema, { ...subscription, plan: 'course_purchase' })).toEqual(
      {
        courseIds: ['required'],
      },
    );
    expect(
      errorsOf(subscriptionInputSchema, {
        ...subscription,
        courseIds: ['c1'],
        currentPeriodStart: LATER,
        currentPeriodEnd: EARLIER,
      }),
    ).toEqual({ courseIds: ['too_many'], currentPeriodEnd: ['date_order'] });
    expect(errorsOf(subscriptionInputSchema, { ...subscription, plan: 'school_annual' })).toEqual({
      plan: ['invalid_choice'],
    });
  });

  it('validate licences', () => {
    const { licenseInputSchema } = adminSchemas;
    const license = {
      schoolId: 's1',
      subscriptionId: null,
      name: 'Pilot 2026',
      seatsTotal: 120,
      scope: { type: 'all_official' },
      startsAt: EARLIER,
      endsAt: LATER,
      status: 'active',
    };
    expect(errorsOf(licenseInputSchema, license)).toEqual({});
    expect(
      errorsOf(licenseInputSchema, {
        ...license,
        scope: { type: 'pathways', pathwayIds: ['ai-explorer'] },
      }),
    ).toEqual({});
    expect(
      errorsOf(licenseInputSchema, {
        ...license,
        scope: { type: 'pathways', pathwayIds: [] },
        seatsTotal: 0,
        endsAt: EARLIER,
      }),
    ).toEqual({
      'scope.pathwayIds': ['required'],
      seatsTotal: ['too_small'],
      endsAt: ['date_order'],
    });
    expect(errorsOf(licenseInputSchema, { ...license, scope: { type: 'everything' } })).toEqual({
      'scope.type': ['invalid_choice'],
    });
  });

  it('validate challenges', () => {
    const { challengeInputSchema } = adminSchemas;
    const challenge = {
      type: 'weekly',
      scope: 'global',
      schoolId: null,
      area: 'robotics',
      ageMin: null,
      ageMax: null,
      startAt: EARLIER,
      deadlineAt: LATER,
      allowedSubmissionTypes: ['video', 'code'],
      rubric: [
        { key: 'creativity', weight: 50 },
        { key: 'technicalQuality', weight: 50 },
      ],
      xpReward: 500,
      coverImageFileId: null,
      hardwarePlatformIds: [],
      requiredCapabilities: ['drive', 'line'],
      defaultLocale: 'en',
      translations: {
        en: {
          title: 'Line follower',
          description: 'Follow the line.',
          submissionRequirements: 'A video.',
          prizes: null,
        },
      },
    };
    expect(errorsOf(challengeInputSchema, challenge)).toEqual({});
    expect(
      errorsOf(challengeInputSchema, { ...challenge, scope: 'school', deadlineAt: EARLIER }),
    ).toEqual({
      schoolId: ['required'],
      deadlineAt: ['date_order'],
    });
    // The cross-field rules run once every field is valid on its own.
    expect(
      errorsOf(challengeInputSchema, {
        ...challenge,
        scope: 'school',
        requiredCapabilities: ['lasers'],
      }),
    ).toEqual({ 'requiredCapabilities.0': ['invalid_choice'] });
    expect(errorsOf(challengeInputSchema, { ...challenge, schoolId: 's1' })).toEqual({
      schoolId: ['invalid'],
    });
  });
});

describe('learning and certificate schemas', () => {
  it('keep a saved response as written, up to the limit', () => {
    const { saveBlockResponseInputSchema } = learningSchemas;
    const response = {
      courseId: 'c1',
      lessonId: 'l1',
      blockId: 'b1',
      text: '  def f():\n    pass\n',
    };
    expect(dataOf(saveBlockResponseInputSchema, response).text).toBe(response.text);
    expect(
      errorsOf(saveBlockResponseInputSchema, {
        ...response,
        text: chars(CONTENT_LIMITS.blockResponseChars + 1),
      }),
    ).toEqual({ text: ['too_long'] });
  });

  it('require a reason to revoke a certificate', () => {
    const { revokeCertificateInputSchema, issueCertificateInputSchema } = certificateSchemas;
    expect(errorsOf(issueCertificateInputSchema, { studentUid: 'u1', courseId: 'c1' })).toEqual({});
    expect(
      errorsOf(revokeCertificateInputSchema, {
        certificateId: 'u1_c1',
        reason: 'Issued by mistake',
      }),
    ).toEqual({});
    expect(errorsOf(revokeCertificateInputSchema, { certificateId: 'u1_c1', reason: '' })).toEqual({
      reason: ['required'],
    });
  });

  it('take no payload for actions without input', () => {
    expect(errorsOf(commonSchemas.noInputSchema, undefined)).toEqual({});
    expect(errorsOf(commonSchemas.noInputSchema, { anything: 1 })).toEqual({
      [FORM_ERROR_KEY]: ['invalid'],
    });
  });
});
