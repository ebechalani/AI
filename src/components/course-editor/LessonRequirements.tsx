import { useTranslations } from 'next-intl';
import { Card, CardTitle } from '@/components/ui';
import type { lessonRequirements } from './outline-model';

/** What a learner must do to complete the lesson (ARCHITECTURE.md 9.4), for the author. */
export function LessonRequirements({
  requirements,
}: {
  requirements: ReturnType<typeof lessonRequirements>;
}) {
  const t = useTranslations('courseEditor');
  const items = [
    requirements.quizzes > 0 ? t('requirements.quizzes', { count: requirements.quizzes }) : null,
    requirements.projects > 0 ? t('requirements.projects', { count: requirements.projects }) : null,
    requirements.reflections > 0
      ? t('requirements.reflections', { count: requirements.reflections })
      : null,
  ].filter((item) => item !== null);
  return (
    <Card className="gap-3 p-5 sm:p-6">
      <CardTitle as="h2" className="text-lg font-bold">
        {t('requirements.title')}
      </CardTitle>
      {items.length === 0 ? (
        <p className="text-sm text-ink-muted">{t('requirements.none')}</p>
      ) : (
        <ul className="list-disc ps-5 text-sm text-ink">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
