import { getTranslations } from 'next-intl/server';
import { LessonShell, PageHeader } from '@/components/layout';
import { EmptyState, LinkButton } from '@/components/ui';

export interface LessonPlayerProps {
  courseId: string;
  lessonId: string;
  /** Locale-less path of the course's lessons, without the lesson id. */
  lessonBasePath: string;
  exitHref: string;
}

// Stub (F8): WS-B replaces it with the server component of ARCHITECTURE.md 7.6, which loads
// getLessonPlayerData and fills every LessonShell slot. The frame is already the real one.
export async function LessonPlayer({ exitHref }: LessonPlayerProps) {
  const t = await getTranslations('nav');
  return (
    <LessonShell
      top={
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate font-semibold text-ink">{t('pages.lesson')}</p>
          <LinkButton href={exitHref} variant="ghost" size="sm">
            {t('lesson.exit')}
          </LinkButton>
        </div>
      }
      nav={<EmptyState variant="plain" />}
      aside={null}
    >
      <PageHeader title={t('pages.lesson')} />
      <EmptyState />
    </LessonShell>
  );
}
