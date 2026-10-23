'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { createBlockAction, saveQuizAction } from '@/actions/course-editor';
import { Button, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { FORM_ERROR_KEY, parseInput } from '@/lib/schemas/common';
import { quizInputSchema } from '@/lib/schemas/quiz';
import type { Locale } from '@/types/common';
import type { QuizInput } from '@/types/inputs';
import { ConflictAlert } from './ConflictAlert';
import { useEditorEvents } from './editor-events';
import { FormActions } from './FormActions';
import { FormAlert } from './FormAlert';
import { anchors, editorPaths, type EditorMode } from './paths';
import { QuestionList } from './QuestionList';
import {
  draftToQuizInput,
  newQuizDraft,
  quizInputToDraft,
  quizTranslationStates,
  type QuizDraft,
  type TrueFalseTexts,
} from './quiz-model';
import { QuizSettingsFields } from './QuizSettingsFields';
import { focusSyncNotice } from './SyncNotice';
import { EDITABLE_LOCALES } from './translations';
import { useEditorAction } from './use-editor-action';
import { useFormErrors } from './use-form-errors';
import { useServerSync } from './use-server-sync';
import { useRegisterDirty } from './unsaved-changes';

const ORDER = [
  'defaultLocale',
  'translations',
  'passingScorePercent',
  'maxAttempts',
  'xpReward',
  'shuffleQuestions',
  'revealAnswers',
  'questions',
];
const LOCALES = EDITABLE_LOCALES.join('|');
const SHOWN = new RegExp(
  `^(translations\\.(${LOCALES})\\.(title|instructions)|passingScorePercent|maxAttempts|xpReward|shuffleQuestions|revealAnswers|questions|questions\\.\\d+\\.(type|points|translations\\.(${LOCALES})\\.prompt|options|options\\.\\d+|options\\.\\d+\\.translations\\.(${LOCALES})\\.text|correctOptionIndexes|acceptedAnswers\\.(${LOCALES})(\\.\\d+)?|explanation\\.(${LOCALES})\\.text))$`,
);

/** Deterministic keys for the questions and options the server draft holds without an id. */
function serverKeys(): () => string {
  let n = 0;
  return () => `new-${n++}`;
}

export interface QuizEditorProps {
  courseId: string;
  mode: EditorMode;
  /** null = a new quiz. */
  quizId: string | null;
  /** The stored quiz with its answer key, as editor input; null for a new quiz. */
  input: QuizInput | null;
  defaultLocale: Locale;
  /** The default true/false option texts in every editable language. */
  tf: TrueFalseTexts;
  /** The lesson the new quiz is added to on its first save (6.4). */
  addTo: { lessonId: string; title: string; blockCount: number } | null;
}

/** The quiz editor (6.4): settings and questions, saved together. */
export function QuizEditor({ courseId, mode, quizId, input, defaultLocale, tf, addTo }: QuizEditorProps) {
  const t = useTranslations('courseEditor');
  const router = useRouter();
  const { toast } = useToast();
  const { run, refresh, refreshing } = useEditorAction();
  const events = useEditorEvents();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const conflictRef = useRef<HTMLDivElement>(null);
  const paths = editorPaths(mode);
  const serverDraft = input ? quizInputToDraft(input, serverKeys()) : newQuizDraft(defaultLocale, serverKeys());
  const sync = useServerSync(serverDraft, { refreshing });
  const { draft, dirty, conflict } = sync;
  const [language, setLanguage] = useState<Locale>(serverDraft.defaultLocale);
  const [pending, setPending] = useState(false);
  const [gone, setGone] = useState(false);
  useRegisterDirty('quiz', dirty);
  const errors = useFormErrors({
    formRef,
    alertRef,
    language,
    setLanguage,
    order: ORDER,
    isShown: (path) => SHOWN.test(path),
    message: (key, path) => {
      if (key !== 'correct_option_required') return undefined;
      return /acceptedAnswers/.test(path) ? t('quiz.errors.acceptedRequired') : t('quiz.errors.markCorrect');
    },
  });

  function set(patch: Partial<QuizDraft>) {
    sync.setDraft((current) => ({ ...current, ...patch }));
  }

  function showErrors(fieldErrors: Record<string, string[]>) {
    if (fieldErrors[FORM_ERROR_KEY]?.includes('too_long')) {
      errors.fail({ message: t('quiz.errors.tooLarge'), sessionEnded: false });
      return;
    }
    errors.show(fieldErrors);
  }

  async function addBlock(newId: string) {
    if (addTo === null) return;
    const added = await run(
      () =>
        createBlockAction({
          courseId,
          lessonId: addTo.lessonId,
          input: {
            type: 'quiz',
            stage: 'check',
            defaultLocale: draft.defaultLocale,
            translations: {},
            data: { quizId: newId },
          },
        }),
      {
        context: {
          action: 'saveBlock',
          creating: true,
          blockCount: addTo.blockCount,
          link: 'quiz',
          teacherCourse: false,
        },
        report: 'toast',
      },
    );
    if (added.ok) {
      toast({ tone: 'success', title: t('quiz.createdAndAdded', { lesson: addTo.title }) });
      router.push(`${paths.lesson(courseId, addTo.lessonId)}#${anchors.block(added.data.blockId)}`);
    } else {
      toast({ tone: 'danger', title: t('quiz.createdNotAdded') });
      router.replace(paths.quiz(courseId, newId));
    }
  }

  async function save(asNew: boolean) {
    if (pending) return;
    if (events.pending) {
      focusSyncNotice();
      return;
    }
    if (conflict) {
      conflictRef.current?.focus();
      return;
    }
    const quizInput = draftToQuizInput(draft);
    const parsed = parseInput(quizInputSchema, quizInput);
    if (!parsed.success) {
      showErrors(parsed.fieldErrors);
      return;
    }
    errors.clear();
    setPending(true);
    const id = asNew ? null : quizId;
    const result = await run(() => saveQuizAction({ courseId, quizId: id, input: quizInput }), {
      report: errors.fail,
      onFieldErrors: showErrors,
      notFound: id === null ? 'gone' : 'report',
    });
    if (!result.ok) {
      setPending(false);
      if (result.error.code === 'not_found' && id !== null) {
        setGone(true);
        errors.fail({ message: t('quiz.gone'), sessionEnded: false });
      }
      return;
    }
    sync.markSaved();
    setGone(false);
    const newId = result.data.quizId;
    if (id !== null) {
      setPending(false);
      toast({ tone: 'success', title: t('quiz.saved') });
      refresh();
      return;
    }
    if (addTo !== null && !asNew) {
      await addBlock(newId);
      return;
    }
    toast({ tone: 'success', title: t('quiz.created') });
    router.replace(paths.quiz(courseId, newId));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save(false);
  }

  function discard() {
    sync.discard();
    errors.clear();
  }

  return (
    <form id="quiz-form" ref={formRef} noValidate onSubmit={onSubmit} className="flex min-w-0 flex-col gap-6">
      {conflict && (
        <ConflictAlert ref={conflictRef} onTakeTheirs={sync.takeTheirs} onKeepMine={sync.keepMine} />
      )}
      <FormActions
        saveLabel={t('quiz.save')}
        pending={pending}
        onDiscard={discard}
        discardLabel={t('details.discard')}
        discardDisabled={!dirty}
      />
      <QuizSettingsFields
        draft={draft}
        set={set}
        language={language}
        onLanguageChange={setLanguage}
        states={quizTranslationStates(draft)}
        errorFor={errors.errorFor}
        disabled={pending}
        formId={formId}
      />
      <QuestionList
        questions={draft.questions}
        onChange={(questions) => set({ questions })}
        language={language}
        defaultLocale={draft.defaultLocale}
        tf={tf}
        errorsFor={(index) => ({
          errorFor: (path) => errors.errorFor(`questions.${index}.${path}`),
          errorUnder: (prefix) => errors.errorUnder(`questions.${index}.${prefix}`),
        })}
        errorUnder={errors.errorFor}
        disabled={pending}
      />
      <FormAlert
        ref={alertRef}
        failure={errors.failure}
        action={
          gone ? (
            <Button size="sm" variant="secondary" loading={pending} onClick={() => void save(true)}>
              {t('quiz.saveAsNew')}
            </Button>
          ) : undefined
        }
      >
        {errors.otherLanguageNote && <p className="mt-1">{errors.otherLanguageNote}</p>}
      </FormAlert>
      <FormActions
        saveLabel={t('quiz.save')}
        pending={pending}
        onDiscard={discard}
        discardLabel={t('details.discard')}
        discardDisabled={!dirty}
      />
    </form>
  );
}
