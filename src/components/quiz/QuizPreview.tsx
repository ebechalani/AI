import { useLocale, useTranslations } from 'next-intl';
import { Alert } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import type { Quiz } from '@/types/quiz';
import { QuestionField } from './QuestionField';
import { QuizFacts } from './QuizFacts';

export interface QuizPreviewProps {
  quiz: Quiz;
}

/**
 * The quiz in a read-only player (staff on a student course, admins, a learner not enrolled):
 * the facts and the questions with disabled controls, never a Start button or an action call.
 */
export function QuizPreview({ quiz }: QuizPreviewProps) {
  const t = useTranslations('quiz');
  const locale = useLocale();
  const instructions = pickTranslation(quiz.translations, locale, quiz.defaultLocale).instructions;
  const count = quiz.questions.length;

  return (
    <div className="flex flex-col gap-4">
      <Alert tone="info" live="off">
        {t('preview.notice')}
      </Alert>
      {instructions && instructions.trim() !== '' && (
        <p className="break-words whitespace-pre-line text-ink">{instructions}</p>
      )}
      <QuizFacts quiz={quiz} remaining={quiz.maxAttempts} />
      {count === 0 ? (
        <p className="text-ink-muted">{t('intro.noQuestions')}</p>
      ) : (
        // Closed by default, so a long quiz does not stretch the preview.
        <details>
          <summary className="min-h-11 cursor-pointer py-2.5 font-semibold text-brand-700">
            {t('preview.showQuestions', { count })}
          </summary>
          <ol className="mt-3 flex flex-col gap-6">
            {quiz.questions.map((question, index) => (
              <li key={question.id} className="flex flex-col gap-2">
                <h4 className="text-sm font-semibold text-brand-700">
                  {t('question.label', { number: index + 1 })}
                </h4>
                <QuestionField quiz={quiz} question={question} answer={undefined} />
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
