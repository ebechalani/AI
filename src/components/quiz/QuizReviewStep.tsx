import type { Ref } from 'react';
import { ChevronLeft, CircleCheck, CircleDashed, Send } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Alert, Button } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import type { Quiz } from '@/types/quiz';
import { isAnswered, own, shortPrompt, unansweredCount, type Draft } from './quiz-model';

export interface QuizReviewStepProps {
  quiz: Quiz;
  /** Question ids in play order. */
  order: readonly string[];
  draft: Draft;
  /** The attempt is on its way: nothing on the step may change it. */
  pending: boolean;
  /** Index in `order` of the question to change. */
  onEdit: (index: number) => void;
  onBack: () => void;
  onSubmit: () => void;
  headingRef: Ref<HTMLHeadingElement>;
  submitRef: Ref<HTMLButtonElement>;
  /** Where the runner looks for lost focus after a failed submit. */
  containerRef: Ref<HTMLDivElement>;
}

/** The answers before they are sent: what is answered, what is missing, and Send. */
export function QuizReviewStep({
  quiz,
  order,
  draft,
  pending,
  onEdit,
  onBack,
  onSubmit,
  headingRef,
  submitRef,
  containerRef,
}: QuizReviewStepProps) {
  const t = useTranslations('quiz');
  const locale = useLocale();
  const missing = unansweredCount(quiz, order, draft);

  return (
    <div ref={containerRef} className="flex flex-col gap-5">
      <h4 ref={headingRef} tabIndex={-1} className="text-base font-semibold text-ink outline-none">
        {t('review.title')}
      </h4>
      <ol className="flex flex-col divide-y divide-border rounded-card border border-border">
        {order.map((id, index) => {
          const question = quiz.questions.find((candidate) => candidate.id === id);
          if (question === undefined) return null;
          const prompt = pickTranslation(question.translations, locale, quiz.defaultLocale).prompt;
          const answered = isAnswered(question, own(draft, id));
          const number = index + 1;
          return (
            <li key={id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <div className="min-w-0 flex-1 basis-52">
                <p className="text-sm font-semibold text-ink">{t('question.label', { number })}</p>
                <p className="text-sm break-words text-ink-muted">{shortPrompt(prompt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                  {answered ? (
                    <CircleCheck aria-hidden="true" className="size-4 shrink-0 text-success" />
                  ) : (
                    <CircleDashed aria-hidden="true" className="size-4 shrink-0 text-warning" />
                  )}
                  {answered ? t('review.answered') : t('review.unanswered')}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t('review.changeLabel', { number })}
                  disabled={pending}
                  onClick={() => onEdit(index)}
                >
                  {t('review.change')}
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
      {missing > 0 && (
        <Alert tone="warning" live="off">
          {t('review.unansweredWarning', { count: missing })}
        </Alert>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" disabled={pending} onClick={onBack}>
          <ChevronLeft aria-hidden="true" className="rtl:rotate-180" />
          {t('review.backToQuestions')}
        </Button>
        <Button ref={submitRef} variant="primary" loading={pending} onClick={onSubmit}>
          {t('review.submit')}
          {!pending && <Send aria-hidden="true" className="rtl:-scale-x-100" />}
        </Button>
      </div>
    </div>
  );
}
