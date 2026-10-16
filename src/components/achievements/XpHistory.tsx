import {
  BookOpen,
  ClipboardCheck,
  FolderKanban,
  Medal,
  SlidersHorizontal,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useDateFormat } from '@/components/domain';
import { PageSection } from '@/components/robotics/PageSection';
import { Alert, EmptyState } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { cn } from '@/lib/utils';
import type { XpReason } from '@/types/gamification';
import { XP_HISTORY_LIMIT, type XpHistoryRow } from './achievements-model';

const ICONS: Record<XpReason, LucideIcon> = {
  lesson: BookOpen,
  quiz: ClipboardCheck,
  project: FolderKanban,
  challenge: Trophy,
  badge: Medal,
  adjustment: SlidersHorizontal,
};

export interface XpHistoryProps {
  /** The most recent ledger entries, newest first; null when the read failed. */
  rows: readonly XpHistoryRow[] | null;
}

export function XpHistory({ rows }: XpHistoryProps) {
  const t = useTranslations('achievements');
  const locale = useLocale();
  const formatDate = useDateFormat();

  function label(row: XpHistoryRow): string {
    if (row.reason === 'badge' && row.badge !== null) {
      const { name } = pickTranslation(row.badge.translations, locale, row.badge.defaultLocale);
      if (name) return t('history.reasons.badgeNamed', { name });
    }
    return t(`history.reasons.${row.reason}`);
  }

  return (
    <PageSection
      id="achievements-history"
      title={t('history.title')}
      description={t('history.description')}
    >
      {rows === null ? (
        <Alert tone="warning" live="off">
          {t('sectionError')}
        </Alert>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Zap />}
          title={t('history.empty.title')}
          description={t('history.empty.description')}
        />
      ) : (
        <>
          <ol className="divide-y divide-border rounded-card border border-border bg-surface">
            {rows.map((row) => {
              const Icon = ICONS[row.reason];
              const gain = row.amount >= 0;
              return (
                <li key={row.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium break-words text-ink">{label(row)}</p>
                    <p className="text-xs text-ink-muted">{formatDate(row.createdAt, 'date')}</p>
                  </div>
                  <p
                    className={cn(
                      'shrink-0 text-sm font-semibold tabular-nums',
                      gain ? 'text-success' : 'text-danger',
                    )}
                  >
                    {t(gain ? 'history.gain' : 'history.loss', { xp: Math.abs(row.amount) })}
                  </p>
                </li>
              );
            })}
          </ol>
          {rows.length === XP_HISTORY_LIMIT && (
            <p className="text-sm text-ink-muted">
              {t('history.limited', { count: XP_HISTORY_LIMIT })}
            </p>
          )}
        </>
      )}
    </PageSection>
  );
}
