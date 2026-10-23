import { describe, expect, it } from 'vitest';
import {
  changeQuestionType,
  draftToQuizInput,
  moveQuestion,
  newQuestion,
  newQuizDraft,
  quizErrorTarget,
  quizInputToDraft,
  quizTranslationStates,
  typeChangeLosesWork,
  type TrueFalseTexts,
} from '@/components/course-editor/quiz-model';
import { splitQuizInput, toQuizInput } from '@/lib/data/course-derive';
import { parseInput } from '@/lib/schemas/common';
import { quizInputSchema } from '@/lib/schemas/quiz';
import { SEED_COURSES } from '../../scripts/seed/content';

// The quiz editor's model (SPEC-F 4.10): a stored quiz with its key reads into the editor and
// back without loss, option marks follow their options, and errors land on their fields.

const tf: TrueFalseTexts = { en: { true: 'True', false: 'False' }, fr: { true: 'Vrai', false: 'Faux' } };

function keys() {
  let n = 0;
  return () => `k${n++}`;
}

describe('seed round trip', () => {
  it('reads every seed quiz into a draft and back without loss', () => {
    let count = 0;
    for (const seed of SEED_COURSES) {
      for (const { id, input } of seed.quizzes) {
        let n = 0;
        const { quiz, key } = splitQuizInput(input, () => `${id}-${n++}`);
        const editorInput = toQuizInput(quiz, key);
        expect(draftToQuizInput(quizInputToDraft(editorInput, keys())), `${seed.id}/${id}`).toEqual(editorInput);
        count += 1;
      }
    }
    expect(count).toBeGreaterThan(5);
  });
});

describe('new quiz', () => {
  it('parses once its texts and a correct answer are filled, and names what is missing', () => {
    const draft = newQuizDraft('en', keys());
    expect(draft.questions).toHaveLength(1);
    expect(draft.questions[0]!.options).toHaveLength(2);
    const parsed = parseInput(quizInputSchema, draftToQuizInput(draft));
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(Object.keys(parsed.fieldErrors).sort()).toEqual([
        'questions.0.correctOptionIndexes',
        'questions.0.options.0.translations.en.text',
        'questions.0.options.1.translations.en.text',
        'questions.0.translations.en.prompt',
        'translations.en.title',
      ]);
      expect(parsed.fieldErrors['questions.0.correctOptionIndexes']).toEqual(['correct_option_required']);
    }
    draft.text.en.title = 'Q';
    const question = draft.questions[0]!;
    question.prompt.en = 'Pick';
    question.options[0]!.text.en = 'A';
    question.options[1]!.text.en = 'B';
    question.correct = [question.options[1]!.key];
    const ok = parseInput(quizInputSchema, draftToQuizInput(draft));
    expect(ok.success).toBe(true);
    expect(draftToQuizInput(draft).questions[0]!.correctOptionIndexes).toEqual([1]);
    expect(draftToQuizInput(draft)).toMatchObject({ passingScorePercent: 70, maxAttempts: null, xpReward: 100 });
  });

  it('builds a true/false question with the texts of both languages', () => {
    const question = newQuestion('true_false', tf, keys());
    expect(question.options.map((o) => [o.id, o.text.en, o.text.fr])).toEqual([
      ['true', 'True', 'Vrai'],
      ['false', 'False', 'Faux'],
    ]);
    expect(question.points).toBe('1');
  });
});

describe('type changes', () => {
  const base = newQuestion('multiple_answer', tf, keys());
  base.options[0]!.text.en = 'A';
  base.options[1]!.text.en = 'B';
  base.correct = base.options.map((o) => o.key);

  it('keeps or drops what the new type needs', () => {
    const mc = changeQuestionType(base, 'multiple_choice', tf, keys());
    expect(mc.options).toHaveLength(2);
    expect(mc.correct).toEqual([base.options[0]!.key]);
    const back = changeQuestionType(mc, 'multiple_answer', tf, keys());
    expect(back.correct).toEqual(mc.correct);
    const tfq = changeQuestionType(base, 'true_false', tf, keys());
    expect(tfq.options.map((o) => o.id)).toEqual(['true', 'false']);
    expect(tfq.correct).toEqual([]);
    const short = changeQuestionType(base, 'short_answer', tf, keys());
    expect(short.options).toEqual([]);
    short.accepted.en = 'motor';
    const again = changeQuestionType(short, 'multiple_choice', tf, keys());
    expect(again.options).toHaveLength(2);
    expect(again.options.every((o) => o.text.en === '')).toBe(true);
    expect(again.accepted.en).toBe('');
  });

  it('says when a change would lose work', () => {
    expect(typeChangeLosesWork(base, 'multiple_choice')).toBe(false);
    expect(typeChangeLosesWork(base, 'true_false')).toBe(true);
    expect(typeChangeLosesWork(base, 'short_answer')).toBe(true);
    const empty = newQuestion('multiple_choice', tf, keys());
    expect(typeChangeLosesWork(empty, 'short_answer')).toBe(false);
    const short = newQuestion('short_answer', tf, keys());
    short.accepted.en = 'x';
    expect(typeChangeLosesWork(short, 'multiple_choice')).toBe(true);
    const tfq = newQuestion('true_false', tf, keys());
    expect(typeChangeLosesWork(tfq, 'short_answer')).toBe(false);
  });
});

describe('marks and accepted answers', () => {
  it('marks follow option keys when options are removed', () => {
    const question = newQuestion('multiple_choice', tf, keys());
    question.options.push({ key: 'third', id: null, text: { en: 'C', fr: '' }, extra: {} });
    question.correct = ['third'];
    question.options = question.options.slice(1);
    const draft = { ...newQuizDraft('en', keys()), questions: [question] };
    expect(draftToQuizInput(draft).questions[0]!.correctOptionIndexes).toEqual([1]);
  });

  it('splits accepted answers per line and requires one in the default language', () => {
    const question = newQuestion('short_answer', tf, keys());
    question.prompt.en = 'What moves the robot?';
    question.accepted.en = 'motor\n a motor \n\n';
    const draft = { ...newQuizDraft('en', keys()), questions: [question] };
    draft.text.en.title = 'Q';
    expect(draftToQuizInput(draft).questions[0]!.acceptedAnswers).toEqual({ en: ['motor', 'a motor'] });
    question.accepted.en = '';
    expect(draftToQuizInput(draft).questions[0]!.acceptedAnswers).toEqual({ en: [] });
    const parsed = parseInput(quizInputSchema, draftToQuizInput(draft));
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.fieldErrors['questions.0.acceptedAnswers.en']).toEqual(['correct_option_required']);
    }
  });

  it('moves questions one step', () => {
    const a = newQuestion('multiple_choice', tf, keys());
    const b = newQuestion('multiple_choice', tf, keys());
    expect(moveQuestion([a, b], b.key, -1).map((q) => q.key)).toEqual([b.key, a.key]);
    expect(moveQuestion([a, b], a.key, -1).map((q) => q.key)).toEqual([a.key, b.key]);
  });
});

describe('errors and translations', () => {
  it('targets error paths', () => {
    expect(quizErrorTarget('translations.fr.title')).toEqual({ questionIndex: null, optionIndex: null, field: 'title', locale: 'fr' });
    expect(quizErrorTarget('questions.3.options.1.translations.en.text')).toEqual({ questionIndex: 3, optionIndex: 1, field: 'optionText', locale: 'en' });
    expect(quizErrorTarget('questions.3.correctOptionIndexes')).toMatchObject({ questionIndex: 3, field: 'correct' });
    expect(quizErrorTarget('questions.3.acceptedAnswers.en.2')).toMatchObject({ questionIndex: 3, field: 'accepted', locale: 'en' });
    expect(quizErrorTarget('questions')).toMatchObject({ questionIndex: null, field: 'questions' });
    expect(quizErrorTarget('_form')).toMatchObject({ field: 'form' });
    expect(quizErrorTarget('maxAttempts')).toMatchObject({ field: 'maxAttempts' });
    expect(quizErrorTarget('questions.0.translations.en.prompt')).toMatchObject({ questionIndex: 0, field: 'prompt', locale: 'en' });
  });

  it('states the languages of a quiz', () => {
    const draft = newQuizDraft('en', keys());
    expect(quizTranslationStates(draft)).toEqual({ en: 'required', fr: 'missing' });
    draft.questions[0]!.prompt.fr = 'Choisis';
    expect(quizTranslationStates(draft)).toEqual({ en: 'required', fr: 'translated' });
  });
});
