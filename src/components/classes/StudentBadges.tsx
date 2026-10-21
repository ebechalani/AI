import { useTranslations } from 'next-intl';
import { BadgeTile } from '@/components/domain';
import type { IsoDateString } from '@/types/common';
import type { Badge } from '@/types/gamification';

export interface StudentBadgesProps {
  /** The badges the student holds, newest first. */
  badges: { badge: Badge; awardedAt: IsoDateString }[];
}

export function StudentBadges({ badges }: StudentBadgesProps) {
  const t = useTranslations('classes');
  return (
    <section aria-labelledby="student-badges-title" className="flex min-w-0 flex-col gap-4">
      <h2 id="student-badges-title" className="text-xl font-bold text-ink">
        {t('student.badges.title')}
      </h2>
      {badges.length === 0 ? (
        <p className="text-sm text-ink-muted">{t('student.badges.empty')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {badges.map(({ badge, awardedAt }) => (
            <BadgeTile key={badge.id} badge={badge} earnedAt={awardedAt} />
          ))}
        </div>
      )}
    </section>
  );
}
