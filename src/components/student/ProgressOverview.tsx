import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LevelProgress, StatCard } from '@/components/domain';
import { Card, CardTitle } from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';
import type { UserStats } from '@/types/user';
import { TutorShortcut } from './TutorShortcut';

export interface ProgressOverviewProps {
  xp: number;
  stats: UserStats;
}

/** The top row of Home: level and XP, lessons completed, and the AI tutor shortcut. */
export function ProgressOverview({ xp, stats }: ProgressOverviewProps) {
  const t = useTranslations('student');
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="gap-4 p-5 sm:col-span-2 sm:p-6">
        <CardTitle as="h2">{t('progress.title')}</CardTitle>
        <LevelProgress xp={xp} />
        <Link
          href="/student/achievements"
          className="mt-auto inline-flex min-h-6 items-center gap-1 self-start rounded-sm text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline"
        >
          {t('progress.achievementsLink')}
          <ArrowRight aria-hidden="true" className="size-4 shrink-0 rtl:rotate-180" />
        </Link>
      </Card>
      <StatCard
        label={t('progress.lessonsCompleted')}
        value={stats.lessonsCompleted}
        icon="BookOpen"
        tone="brand"
      />
      <TutorShortcut />
    </div>
  );
}
