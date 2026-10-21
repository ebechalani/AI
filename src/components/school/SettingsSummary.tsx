import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Card, Chip, LinkButton } from '@/components/ui';
import type { SchoolSettings } from '@/types/school';
import { SCHOOL_PATHS } from './paths';
import { DEFAULT_DAILY_MESSAGES } from './school-model';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
      <dt className="min-w-0 text-sm text-ink-muted">{label}</dt>
      <dd className="text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

/** The school's switches at a glance, with the way to change them. */
export function SettingsSummary({ settings }: { settings: SchoolSettings }) {
  const t = useTranslations('school');
  const onOff = (on: boolean) =>
    on ? (
      <Chip tone="success" size="sm">
        {t('dashboard.settings.on')}
      </Chip>
    ) : (
      <Chip size="sm">{t('dashboard.settings.off')}</Chip>
    );

  return (
    <Card as="section" aria-labelledby="summary-title" className="gap-3 p-5 sm:p-6">
      <h2 id="summary-title" className="text-lg leading-snug font-bold text-ink">
        {t('dashboard.settings.title')}
      </h2>
      <dl className="divide-y divide-border">
        <Row label={t('dashboard.settings.ai')}>{onOff(settings.aiEnabled)}</Row>
        <Row label={t('dashboard.settings.joinCodes')}>{onOff(settings.joinCodesEnabled)}</Row>
        <Row label={t('dashboard.settings.limit')}>
          {settings.aiDailyMessageLimit ??
            t('dashboard.settings.limitDefault', { count: DEFAULT_DAILY_MESSAGES })}
        </Row>
      </dl>
      <div>
        <LinkButton href={SCHOOL_PATHS.settings} variant="secondary" size="sm">
          {t('dashboard.settings.change')}
        </LinkButton>
      </div>
    </Card>
  );
}
