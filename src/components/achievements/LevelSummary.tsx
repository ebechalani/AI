import { useTranslations } from 'next-intl';
import { LevelProgress } from '@/components/domain';
import { Card, CardTitle } from '@/components/ui';

export interface LevelSummaryProps {
  xp: number;
}

/** The student's level, XP total and the way to the next level. */
export function LevelSummary({ xp }: LevelSummaryProps) {
  const t = useTranslations('achievements');
  return (
    <Card
      as="section"
      tone="brand"
      aria-labelledby="achievements-level"
      className="gap-4 p-5 sm:p-6"
    >
      <CardTitle as="h2" id="achievements-level" className="text-xl">
        {t('level.title')}
      </CardTitle>
      <LevelProgress xp={xp} />
    </Card>
  );
}
