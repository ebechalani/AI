import type { Ref } from 'react';
import { RotateCcw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Alert, Button, ProgressRing } from '@/components/ui';
import type { Quiz, QuizAttemptResult } from '@/types/quiz';
import { AttemptReview } from './AttemptReview';
import { QuizRewards } from './QuizRewards';
import { hiddenReason, reviewRows, rewardView, type StartOption } from './quiz-model';

export interface QuizResultProps {
  quiz: Quiz;
  result: QuizAttemptResult;
  /** The order the questions were played in, for the review. */
  order: readonly string[];
  /** Attempts left after this one; null = unlimited. */
  remaining: number | null;
  start: StartOption;
  onRetry: () => void;
  headingRef: Ref<HTMLHeadingElement>;
}

/** The attempt just sent: score, pass or fail, rewards, the review the server allows, retry. */
export function QuizResult({
  quiz,
  result,
  order,
  remaining,
  start,
  onRetry,
  headingRef,
}: QuizResultProps) {
  const t = useTranslations('quiz');
  const locale = useLocale();
  const { attempt } = result;
  const rewards = rewardView(result, quiz.xpReward);
  const hidden = hiddenReason(quiz.revealAnswers, attempt);
  const rows =
    hidden === null
      ? reviewRows({
          quiz,
          attempt,
          correctOptionIds: result.correctOptionIds,
          explanations: result.explanations,
          locale,
          order,
        })
      : [];

  return (
    <div className="flex flex-col gap-5">
      <h4 ref={headingRef} tabIndex={-1} className="text-xl font-bold text-ink outline-none">
        {attempt.passed ? t('result.passedTitle') : t('result.failedTitle')}
      </h4>
      <div className="flex flex-wrap items-center gap-4">
        <ProgressRing value={attempt.scorePercent} size={88} label={t('result.scoreLabel')} />
        <div className="flex min-w-0 flex-col gap-0.5 text-sm text-ink-muted">
          <p className="text-base font-semibold text-ink tabular-nums">
            {t('result.points', { score: attempt.score, max: attempt.maxScore })}
          </p>
          <p>{t('facts.passMark', { percent: quiz.passingScorePercent })}</p>
          <p>{t('result.attempt', { number: attempt.attemptNumber })}</p>
          <p>
            {remaining === null
              ? t('result.attemptsUnlimited')
              : remaining === 0
                ? t('result.exhausted')
                : t('result.attemptsLeft', { count: remaining })}
          </p>
        </div>
      </div>

      {rewards !== null && <QuizRewards view={rewards} earnedAt={attempt.submittedAt} />}

      {hidden !== null ? (
        <Alert tone="info" live="off">
          {hidden === 'never' ? t('result.hiddenNever') : t('result.hiddenAfterPass')}
        </Alert>
      ) : (
        rows.length > 0 && (
          <div className="flex flex-col gap-3">
            <h5 className="font-semibold text-ink">{t('result.reviewTitle')}</h5>
            <AttemptReview rows={rows} perspective="learner" headingAs="h6" />
          </div>
        )
      )}

      {(start.kind === 'retry' || start.kind === 'retake') && (
        <Button
          variant={start.kind === 'retry' ? 'primary' : 'secondary'}
          className="self-start"
          onClick={onRetry}
        >
          <RotateCcw aria-hidden="true" />
          {start.kind === 'retry' ? t('intro.retry') : t('intro.retake')}
        </Button>
      )}
    </div>
  );
}
