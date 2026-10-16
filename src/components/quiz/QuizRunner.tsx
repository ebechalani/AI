'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { submitQuizAttemptAction } from '@/actions/quiz';
import { useToast } from '@/components/ui';
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

  const { latest, remaining } = currentAttempt(latestAttempt, attemptsRemaining, state.result);
  const start = startOption({
    readOnly: false,
    questionCount: quiz.questions.length,
    latest,
    remaining,
  });

  // Focus follows the view (and announces it), but never on the first render: comparing with
  // the last view shown also holds under Strict Mode, which runs effects twice on mount.
  const viewKey = `${state.phase}:${state.index}`;
  const shownKey = useRef(viewKey);
  const { phase } = state;
  useEffect(() => {
    if (shownKey.current === viewKey) return;
    shownKey.current = viewKey;
    // The intro comes back only after a conflict: its target is QuizBlock's title.
    const target =
      phase === 'intro' ? document.getElementById(quizTitleId(quiz.id)) : headingRef.current;
    if (target !== null) focusInView(target);
  }, [viewKey, phase, quiz.id]);

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
          toast({
            tone: 'success',
            title: t('result.xpToast', { xp: view.xp }),
            description:
              view.leveledUp && view.level !== null
                ? t('result.levelUp', { level: view.level })
                : undefined,
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

  if (phase === 'intro') {
    return (
      <QuizIntro quiz={quiz} latest={latest} remaining={remaining} start={start} onStart={begin} />
    );
  }
  if (phase === 'result' && state.result !== null) {
    return (
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
  }
  if (question !== undefined) {
    return (
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
  }
  // The review step, also for a question that left the quiz while it was being answered.
  return (
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
