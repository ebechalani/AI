import { ClipboardCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { own, quizTitleId } from '@/components/quiz/quiz-model';
import { QuizRunner } from '@/components/quiz/QuizRunner';
import { Card } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import type { BlockRendererProps } from './registry';

/** A quiz of the lesson (ARCHITECTURE.md 7.6): its card, title and intro around the runner. */
export function QuizBlock({ block, runtime }: BlockRendererProps<'quiz'>) {
  const locale = useLocale();
  const t = useTranslations('quiz');
  const quiz = own(runtime.quizzes, block.data.quizId);
  const intro = pickTranslation(block.translations, locale, block.defaultLocale).intro;

  if (quiz === undefined) {
    return (
      <Card>
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <p className="text-ink-muted">{t('block.unavailable')}</p>
        </div>
      </Card>
    );
  }

  // null means unlimited, so a missing entry falls back to the quiz's own limit, never `??`.
  const stored = own(runtime.attemptsRemaining, quiz.id);
  const remaining = stored === undefined ? quiz.maxAttempts : stored;
  const title = pickTranslation(quiz.translations, locale, quiz.defaultLocale).title;

  return (
    <Card>
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"
          >
            <ClipboardCheck className="size-5" />
          </span>
          {/* The runner focuses the title when it returns to the intro after a conflict. */}
          <h3
            id={quizTitleId(quiz.id)}
            tabIndex={-1}
            className="min-w-0 text-lg leading-snug font-semibold break-words text-ink outline-none"
          >
            {title}
          </h3>
        </div>
        {typeof intro === 'string' && intro.trim() !== '' && (
          <p className="break-words whitespace-pre-line text-ink-muted">{intro}</p>
        )}
        {/* Keyed by lesson and quiz: router.refresh() keeps the runner and its result. */}
        <QuizRunner
          key={`${runtime.lessonId}/${quiz.id}`}
          courseId={runtime.courseId}
          quiz={quiz}
          latestAttempt={own(runtime.latestAttempts, quiz.id) ?? null}
          attemptsRemaining={remaining}
          readOnly={runtime.readOnly}
        />
      </div>
    </Card>
  );
}
