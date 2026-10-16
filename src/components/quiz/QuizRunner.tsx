'use client';

import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { submitQuizAttemptAction } from '@/actions/quiz';
import { useToast } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError } from '@/types/actions';
import type { Quiz, QuizAttempt } from '@/types/quiz';
import { focusInView, focusWasLost, hasKeyboardFocus } from './focus';
import { QuizIntro } from './QuizIntro';
import { QuizPreview } from './QuizPreview';
import { QuizResult } from './QuizResult';
import { QuizReviewStep } from './QuizReviewStep';
import { QuizStep } from './QuizStep';
import {
  currentAttempt,
  INITIAL_RUNNER_STATE,
  own,
  questionOrder,
  quizTitleId,
  rewardView,
  runnerReducer,
  shouldToastXp,
  startOption,
  toSubmission,
} from './quiz-model';
import { useActionErrorMessage } from './use-action-error';

export interface QuizRunnerProps {
  courseId: string;
  quiz: Quiz;
  /** The learner's latest attempt (student projection: `results` only once revealed). */
  latestAttempt: QuizAttempt | null;
  /** null = unlimited. */
  attemptsRemaining: number | null;
  readOnly: boolean;
}

/** A quiz in a lesson (ARCHITECTURE.md 7.6, 7.7): one question per step, graded on the server. */
export function QuizRunner({ readOnly, ...props }: QuizRunnerProps) {
  return readOnly ? <QuizPreview quiz={props.quiz} /> : <LearnerRunner {...props} />;
}

function LearnerRunner({
  courseId,
  quiz,
  latestAttempt,
  attemptsRemaining,
}: Omit<QuizRunnerProps, 'readOnly'>) {
  const t = useTranslations('quiz');
  const locale = useLocale();
  const format = useFormatter();
  const errorMessage = useActionErrorMessage();
  const router = useRouter();
  const { toast } = useToast();
  const [state, dispatch] = useReducer(runnerReducer, INITIAL_RUNNER_STATE);
  const [pending, setPending] = useState(false);
  // A ref, not `pending`: two clicks in one frame both see `pending === false`, and the second
  // call would come back `conflict` and reset the runner over the first result.
  const inFlight = useRef(false);
  const restoreSubmitFocus = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const { latest, remaining } = currentAttempt(latestAttempt, attemptsRemaining, state.result);
  const start = startOption({
    readOnly: false,
    questionCount: quiz.questions.length,
    latest,
    remaining,
  });

  // Focus follows the view (and announces it), but never on the first render: comparing with
  // the last view shown also holds under Strict Mode, which runs effects twice on mount. A
  // question is known by its id, so a question that only moved in the order is the same view.
  const { phase } = state;
  const viewKey = phase === 'question' ? `question:${state.order[state.index] ?? ''}` : phase;
  const shownKey = useRef(viewKey);
  useEffect(() => {
    if (shownKey.current === viewKey) return;
    shownKey.current = viewKey;
    // Only when the learner was in the runner (or its control left the page): a change that
    // came with a refresh never pulls focus away from another block of the lesson.
    if (!focusWasLost(null) && !rootRef.current?.contains(document.activeElement)) return;
    // The intro comes back only after a conflict: its target is QuizBlock's title.
    const target =
      phase === 'intro' ? document.getElementById(quizTitleId(quiz.id)) : headingRef.current;
    if (target !== null) focusInView(target);
  }, [viewKey, phase, quiz.id]);

  // router.refresh() may bring an edited quiz in the middle of a run: the run follows it, so
  // the step on screen always matches the runner's state.
  const questionIds = JSON.stringify(quiz.questions.map((question) => question.id));
  useEffect(() => {
    dispatch({ type: 'sync', questionIds: JSON.parse(questionIds) as string[] });
  }, [questionIds]);

  // After a failed submit from the keyboard, Submit gets focus back once it is enabled again.
  useEffect(() => {
    if (pending || !restoreSubmitFocus.current) return;
    restoreSubmitFocus.current = false;
    if (focusWasLost(containerRef.current) && submitRef.current !== null) {
      focusInView(submitRef.current);
    }
  }, [pending]);

  function begin() {
    dispatch({ type: 'start', order: questionOrder(quiz) });
  }

  function onFailure(error: ActionError, fromKeyboard: boolean) {
    if (error.code === 'conflict') {
      toast({ tone: 'warning', title: t('errors.conflict') });
      dispatch({ type: 'reset' });
      router.refresh();
      return;
    }
    toast({
      tone: 'danger',
      title: error.code === 'not_found' ? t('errors.notFound') : errorMessage(error),
    });
    const sessionOrAccess = ['not_found', 'forbidden', 'unauthenticated', 'license_required'];
    if (sessionOrAccess.includes(error.code)) {
      router.refresh();
      return;
    }
    // Anything else: stay on the review step with the draft intact.
    restoreSubmitFocus.current = fromKeyboard;
  }

  async function submit() {
    if (inFlight.current) return;
    inFlight.current = true;
    const fromKeyboard = hasKeyboardFocus(document.activeElement);
    setPending(true);
    let error: ActionError;
    try {
      const response = await submitQuizAttemptAction({
        courseId,
        quizId: quiz.id,
        answers: toSubmission(quiz, state.draft),
      });
      if (response.ok) {
        dispatch({ type: 'submitted', result: response.data });
        const view = rewardView(response.data, quiz.xpReward);
        if (shouldToastXp(view)) {
          // The XP may include a new badge's bonus, so the toast names the badges too.
          const names = view.badges.map(
            (badge) => pickTranslation(badge.translations, locale, badge.defaultLocale).name,
          );
          const lines = [
            view.leveledUp && view.level !== null ? t('result.levelUp', { level: view.level }) : '',
            names.length > 0
              ? t('result.badgeToast', { count: names.length, names: format.list(names) })
              : '',
          ].filter((line) => line !== '');
          toast({
            tone: 'success',
            title: t('result.xpToast', { xp: view.xp }),
            description: lines.length > 0 ? lines.join(' ') : undefined,
          });
        }
        // The EARN checklist and the footer's "steps left" count read the new attempt.
        router.refresh();
        return;
      }
      error = response.error;
    } catch {
      error = { code: 'internal' };
    } finally {
      inFlight.current = false;
      setPending(false);
    }
    onFailure(error, fromKeyboard);
  }

  const question =
    phase === 'question'
      ? quiz.questions.find((candidate) => candidate.id === state.order[state.index])
      : undefined;

  let step: ReactNode;
  if (phase === 'intro') {
    step = (
      <QuizIntro quiz={quiz} latest={latest} remaining={remaining} start={start} onStart={begin} />
    );
  } else if (phase === 'result' && state.result !== null) {
    step = (
      <QuizResult
        quiz={quiz}
        result={state.result}
        order={state.order}
        remaining={remaining}
        start={start}
        onRetry={begin}
        headingRef={headingRef}
      />
    );
  } else if (question !== undefined) {
    step = (
      <QuizStep
        quiz={quiz}
        question={question}
        number={state.index + 1}
        total={state.order.length}
        answer={own(state.draft, question.id)}
        onAnswer={(update) => dispatch({ type: 'answer', draft: update(state.draft) })}
        onBack={state.index > 0 ? () => dispatch({ type: 'back' }) : null}
        onNext={() => dispatch({ type: 'next' })}
        nextLabel={
          state.returnToReview || state.index >= state.order.length - 1 ? 'toReview' : 'next'
        }
        headingRef={headingRef}
      />
    );
  } else {
    // The review step. A question that left the quiz shows it too, for the one render before
    // the 'sync' event moves the state there.
    step = (
      <QuizReviewStep
        quiz={quiz}
        order={state.order}
        draft={state.draft}
        pending={pending}
        onEdit={(index) => dispatch({ type: 'edit', index })}
        onBack={() => dispatch({ type: 'back' })}
        onSubmit={submit}
        headingRef={headingRef}
        submitRef={submitRef}
        containerRef={containerRef}
      />
    );
  }
  // One root, so the focus rule can tell whether the learner was in the runner.
  return <div ref={rootRef}>{step}</div>;
}
