'use client';

import { Award, PartyPopper, Sparkles, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BadgeTile } from '@/components/domain';
import { LinkButton } from '@/components/ui';
import type { IsoDateString } from '@/types/common';
import type { CompletionSummary } from './completion-model';

export interface LessonCompletePanelProps {
  summary: CompletionSummary;
  /** When the lesson was completed: the date on the new badges. */
  earnedAt: IsoDateString;
}

/** The EARN stage, inside the completion dialog: XP, level-up, new badges, the certificate. */
export function LessonCompletePanel({ summary, earnedAt }: LessonCompletePanelProps) {
  const t = useTranslations('lesson');

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-2 rounded-card bg-linear-to-br from-brand-50 via-surface to-accent-50 px-4 py-6 text-center">
        <span
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-full bg-brand-100 text-brand-600"
        >
          <Sparkles className="size-7" />
        </span>
        {summary.xpAwarded > 0 ? (
          <p className="text-3xl font-bold text-brand-700 tabular-nums">
            {t('complete.xp', { xp: summary.xpAwarded })}
          </p>
        ) : (
          <p className="text-ink">
            {summary.rewardsPending ? t('complete.pending') : t('complete.noXp')}
          </p>
        )}
        {summary.leveledUp && summary.level !== null && (
          <p className="inline-flex items-center gap-1.5 font-semibold text-ink">
            <TrendingUp aria-hidden="true" className="size-5 shrink-0 text-success" />
            {t('complete.levelUp', { level: summary.level })}
          </p>
        )}
      </div>

      {summary.courseJustCompleted && (
        <p className="flex items-start gap-2 font-semibold text-ink">
          <PartyPopper aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-600" />
          {t('complete.courseCompleted')}
        </p>
      )}

      {summary.newBadges.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold text-ink">{t('complete.badges')}</h3>
          <ul className="grid grid-cols-2 gap-3">
            {summary.newBadges.map((badge) => (
              <li key={badge.id} className="min-w-0">
                <BadgeTile badge={badge} earnedAt={earnedAt} className="h-full" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.certificateId !== null && (
        <div className="flex flex-col items-start gap-3 rounded-card border border-border p-4">
          <p className="flex items-start gap-2 text-ink">
            <Award aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-600" />
            {t('complete.certificate')}
          </p>
          <LinkButton href={`/certificates/${summary.certificateId}`} variant="secondary" size="sm">
            {t('complete.viewCertificate')}
          </LinkButton>
        </div>
      )}
    </div>
  );
}
