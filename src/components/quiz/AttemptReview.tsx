import { Circle, CircleCheck, CircleDot, CircleX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Chip } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { ReviewOption, ReviewRow } from './quiz-model';

// Shared by the learner (quiz result, last attempt) and the teacher's attempt page, so it is
// neither a client component nor uses client-only hooks.

export interface AttemptReviewProps {
  rows: ReviewRow[];
  /** Whose answers they are: "Your answer" or "Student’s answer". */
  perspective: 'learner' | 'teacher';
  /** One level below the caller's own heading. */
  headingAs: 'h3' | 'h4' | 'h5' | 'h6';
}

/** An attempt question by question: marks and points, the answers, and what the server revealed. */
export function AttemptReview({ rows, perspective, headingAs }: AttemptReviewProps) {
  if (rows.length === 0) return null;
  return (
    <ol className="flex flex-col gap-4">
      {rows.map((row) => (
        <ReviewItem key={row.questionId} row={row} perspective={perspective} Heading={headingAs} />
      ))}
    </ol>
  );
}

function ReviewItem({
  row,
  perspective,
  Heading,
}: {
  row: ReviewRow;
  perspective: AttemptReviewProps['perspective'];
  Heading: AttemptReviewProps['headingAs'];
}) {
  const t = useTranslations('quiz');
  const answerLabel =
    perspective === 'learner' ? t('question.yourAnswer') : t('question.studentAnswer');
  const isChoice = row.type !== null && row.type !== 'short_answer';
  const hasText = row.textAnswer !== null && row.textAnswer.trim() !== '';
  // A true/false option may carry no text of its own: the platform's words stand in.
  const trueFalse = new Map([
    ['true', t('answer.true')],
    ['false', t('answer.false')],
  ]);

  return (
    <li className="flex min-w-0 flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Heading className="text-sm font-semibold text-ink">
          {t('question.label', { number: row.number })}
        </Heading>
        <div className="flex flex-wrap items-center gap-2">
          {row.correct !== null &&
            (row.correct ? (
              <Chip tone="success" icon={<CircleCheck aria-hidden="true" />}>
                {t('question.correct')}
              </Chip>
            ) : (
              <Chip tone="danger" icon={<CircleX aria-hidden="true" />}>
                {t('question.incorrect')}
              </Chip>
            ))}
          {row.pointsAwarded !== null && (
            <span className="text-sm text-ink-muted tabular-nums">
              {row.points !== null
                ? t('question.points', { awarded: row.pointsAwarded, points: row.points })
                : t('question.pointsAwarded', { awarded: row.pointsAwarded })}
            </span>
          )}
        </div>
      </div>

      {row.status === 'removed' ? (
        <p className="text-sm text-ink-muted">{t('question.removed')}</p>
      ) : row.prompt === null ? (
        <p className="text-sm text-ink-muted">{t('question.unavailable')}</p>
      ) : (
        <p className="font-medium break-words whitespace-pre-line text-ink">{row.prompt}</p>
      )}

      {row.status === 'notInAttempt' ? (
        <p className="text-sm text-ink-muted">{t('question.notInAttempt')}</p>
      ) : (
        <>
          {isChoice && row.options.length > 0 && (
            <ul className="flex flex-col gap-2">
              {row.options.map((option) => (
                <OptionLine
                  key={option.id}
                  option={option}
                  answerLabel={answerLabel}
                  fallback={row.type === 'true_false' ? (trueFalse.get(option.id) ?? '') : ''}
                />
              ))}
            </ul>
          )}
          {!isChoice && hasText && (
            <p className="text-sm break-words text-ink">
              <span className="font-semibold">{answerLabel}</span>{' '}
              <q className="whitespace-pre-line">{row.textAnswer}</q>
            </p>
          )}
          {!row.answered && <p className="text-sm text-ink-muted">{t('question.noAnswer')}</p>}
          {row.strayAnswer && (
            <p className="text-sm text-ink-muted">{t('question.answerRemoved')}</p>
          )}
        </>
      )}

      {row.explanation !== null && (
        <div className="rounded-control bg-surface-muted p-3 text-sm text-ink">
          <p className="font-semibold">{t('question.explanation')}</p>
          <p className="mt-1 break-words whitespace-pre-line">{row.explanation}</p>
        </div>
      )}
    </li>
  );
}

function OptionLine({
  option,
  answerLabel,
  fallback,
}: {
  option: ReviewOption;
  answerLabel: string;
  fallback: string;
}) {
  const t = useTranslations('quiz');
  const right = option.correct === true;
  const wrongChoice = option.selected && option.correct === false;
  const Icon = right ? CircleCheck : wrongChoice ? CircleX : option.selected ? CircleDot : Circle;

  return (
    <li
      className={cn(
        'flex items-start gap-2.5 rounded-control border px-3 py-2 text-sm',
        right
          ? 'border-success/40 bg-success/5'
          : wrongChoice
            ? 'border-danger/40 bg-danger/5'
            : option.selected
              ? 'border-brand-300 bg-brand-50'
              : 'border-border',
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          'mt-0.5 size-4 shrink-0',
          right
            ? 'text-success'
            : wrongChoice
              ? 'text-danger'
              : option.selected
                ? 'text-brand-600'
                : 'text-ink-muted',
        )}
      />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="min-w-0 break-words whitespace-pre-line text-ink">
          {option.text.trim() !== '' ? option.text : fallback}
        </span>
        {option.selected && <Chip tone="brand">{answerLabel}</Chip>}
        {right && <Chip tone="success">{t('question.rightAnswer')}</Chip>}
      </div>
    </li>
  );
}
