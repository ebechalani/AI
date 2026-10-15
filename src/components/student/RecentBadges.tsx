import { Medal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BadgeTile } from '@/components/domain';
import { EmptyState } from '@/components/ui';
import type { EarnedBadge } from './home-model';
import { SectionUnavailable } from './SectionUnavailable';

export interface RecentBadgesProps {
  /** The latest awards with their definitions, newest first; null when they could not be read. */
  badges: readonly EarnedBadge[] | null;
}

export function RecentBadges({ badges }: RecentBadgesProps) {
  const t = useTranslations('student');

  if (badges === null) return <SectionUnavailable />;
  if (badges.length === 0) {
    return (
      <EmptyState
        icon={<Medal />}
        title={t('badges.empty.title')}
        description={t('badges.empty.description')}
      />
    );
  }

  return (
    // Two per row on phones and in the side column (xl); three while the page is one wide column.
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2">
      {badges.map(({ badge, awardedAt }) => (
        <li key={badge.id} className="min-w-0">
          <BadgeTile badge={badge} earnedAt={awardedAt} className="h-full" />
        </li>
      ))}
    </ul>
  );
}
