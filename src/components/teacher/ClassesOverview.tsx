import { School } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ClassCard } from '@/components/classes/ClassCard';
import { CreateClassButton } from '@/components/classes/CreateClassButton';
import { EmptyState, LinkButton } from '@/components/ui';
import type { IsoDateString } from '@/types/common';
import type { SchoolClass } from '@/types/school';
import { DASHBOARD_LIMITS } from './dashboard-model';
import { classPath, TEACHER_PATHS } from './paths';

export interface ClassesOverviewProps {
  /** The active classes, by name. */
  classes: SchoolClass[];
  total: number;
  now: IsoDateString;
  viewerUid: string;
  /** For the "no active class" state's create button. */
  schoolless: boolean;
}

export function ClassesOverview({
  classes,
  total,
  now,
  viewerUid,
  schoolless,
}: ClassesOverviewProps) {
  const t = useTranslations('teacher');
  const shown = classes.slice(0, DASHBOARD_LIMITS.classes);

  return (
    <section aria-labelledby="dashboard-classes-title" className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="dashboard-classes-title" className="text-xl font-bold text-ink">
          {t('dashboard.classes.title')}
        </h2>
        <LinkButton href={TEACHER_PATHS.classes} variant="ghost" size="sm">
          {t('dashboard.classes.viewAll')}
        </LinkButton>
      </div>
      {shown.length === 0 ? (
        <EmptyState
          icon={<School />}
          title={t('dashboard.classes.noActive.title')}
          description={t('dashboard.classes.noActive.description')}
          action={
            <CreateClassButton schoolless={schoolless} classHrefBase={TEACHER_PATHS.classes} />
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {shown.map((cls) => (
              <ClassCard
                key={cls.id}
                cls={cls}
                href={classPath(cls.id)}
                now={now}
                viewerUid={viewerUid}
              />
            ))}
          </div>
          {total > shown.length && (
            <p className="text-sm text-ink-muted">
              {t('dashboard.classes.more', { count: total - shown.length })}
            </p>
          )}
        </>
      )}
    </section>
  );
}
