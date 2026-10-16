import { Play, RotateCcw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Alert, Button } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import type { Quiz, QuizAttempt } from '@/types/quiz';
import { LatestAttempt } from './LatestAttempt';
import { QuizFacts } from './QuizFacts';
import type { StartOption } from './quiz-model';

export interface QuizIntroProps {
  quiz: Quiz;
  latest: QuizAttempt | null;
  /** null = unlimited. */
  remaining: number | null;
  start: StartOption;
  onStart: () => void;
}

/** Before a run: the instructions, the facts, the last attempt and Start / Try again. */
export function QuizIntro({ quiz, latest, remaining, start, onStart }: QuizIntroProps) {
  const t = useTranslations('quiz');
  const locale = useLocale();
  const instructions = pickTranslation(quiz.translations, locale, quiz.defaultLocale).instructions;

  return (
    <div className="flex flex-col gap-4">
      {instructions && instructions.trim() !== '' && (
        <p className="whitespace-pre-line text-ink">{instructions}</p>
      )}
      <QuizFacts quiz={quiz} remaining={remaining} />
      {latest !== null && <LatestAttempt quiz={quiz} attempt={latest} />}
      {start.kind === 'none' ? (
        start.reason === 'noAttemptsLeft' ? (
          <Alert tone="info" live="off">
            {t('intro.noAttemptsLeft')}
          </Alert>
        ) : (
          start.reason === 'noQuestions' && (
            <p className="text-ink-muted">{t('intro.noQuestions')}</p>
          )
        )
      ) : (
        <Button
          variant={start.kind === 'retake' ? 'secondary' : 'primary'}
          className="self-start"
          onClick={onStart}
        >
          {start.kind === 'start' ? (
            <Play aria-hidden="true" className="rtl:-scale-x-100" />
          ) : (
            <RotateCcw aria-hidden="true" />
          )}
          {start.kind === 'start'
            ? t('intro.start')
            : start.kind === 'retry'
              ? t('intro.retry')
              : t('intro.retake')}
        </Button>
      )}
    </div>
  );
}
