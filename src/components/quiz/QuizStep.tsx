import type { FormEvent, Ref } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, ProgressBar } from '@/components/ui';
import type { Quiz, QuizAnswer, QuizQuestion } from '@/types/quiz';
import { QuestionField, type DraftUpdate } from './QuestionField';

export interface QuizStepProps {
  quiz: Quiz;
  question: QuizQuestion;
  /** 1-based position in the play order. */
  number: number;
  total: number;
  answer: QuizAnswer | undefined;
  onAnswer: (update: DraftUpdate) => void;
  /** null on the first question. */
  onBack: (() => void) | null;
  onNext: () => void;
  /** `toReview` on the last question and while one answer is changed from the review step. */
  nextLabel: 'next' | 'toReview';
  headingRef: Ref<HTMLHeadingElement>;
}

/** One question of the quiz. Enter in the short-answer field submits the step, which is Next. */
export function QuizStep({
  quiz,
  question,
  number,
  total,
  answer,
  onAnswer,
  onBack,
  onNext,
  nextLabel,
  headingRef,
}: QuizStepProps) {
  const t = useTranslations('quiz');

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    // Without this the browser would send a GET and reload the lesson, losing the draft.
    event.preventDefault();
    onNext();
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h4
          ref={headingRef}
          tabIndex={-1}
          className="text-sm font-semibold text-brand-700 outline-none"
        >
          {t('step.progress', { number, total })}
        </h4>
        <ProgressBar
          value={(number / Math.max(1, total)) * 100}
          label={t('step.progressLabel')}
          size="sm"
        />
      </div>
      <QuestionField
        key={question.id}
        quiz={quiz}
        question={question}
        answer={answer}
        onChange={onAnswer}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        {onBack ? (
          <Button variant="secondary" onClick={onBack}>
            <ChevronLeft aria-hidden="true" className="rtl:rotate-180" />
            {t('step.back')}
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" variant="primary">
          {nextLabel === 'next' ? t('step.next') : t('step.toReview')}
          <ChevronRight aria-hidden="true" className="rtl:rotate-180" />
        </Button>
      </div>
    </form>
  );
}
