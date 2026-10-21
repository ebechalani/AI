import { useTranslations } from 'next-intl';
import { StatusChip } from '@/components/domain';
import { Link } from '@/lib/i18n/navigation';
import type { SchoolClass } from '@/types/school';
import { schoolClassPath } from './paths';

/** The archived classes of the school, folded away; each opens read-only. Nothing when none. */
export function ArchivedClassList({ classes }: { classes: SchoolClass[] }) {
  const t = useTranslations('school');
  if (classes.length === 0) return null;

  return (
    <details className="group mt-8 rounded-card border border-border bg-surface p-5">
      <summary className="cursor-pointer rounded-sm font-semibold text-ink">
        {t('classes.archivedSummary', { count: classes.length })}
      </summary>
      <p className="mt-3 text-sm text-ink-muted">{t('classes.archivedHint')}</p>
      <ul className="mt-3 divide-y divide-border">
        {classes.map((cls) => (
          <li key={cls.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
            <Link
              href={schoolClassPath(cls.id)}
              className="min-w-0 rounded-sm font-medium break-words text-ink underline-offset-4 hover:text-brand-700 hover:underline"
            >
              {cls.name}
            </Link>
            {cls.gradeLabel && <span className="text-sm text-ink-muted">{cls.gradeLabel}</span>}
            <StatusChip status="archived" />
          </li>
        ))}
      </ul>
    </details>
  );
}
