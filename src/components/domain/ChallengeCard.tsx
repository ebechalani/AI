import { CalendarDays, CircleCheck, Users, Zap } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, Chip } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import { getChallengePhase } from '@/lib/learning/challenge-phase';
import { cn } from '@/lib/utils';
import type { Challenge } from '@/types/challenge';
import type { IsoDateString } from '@/types/common';
import { useAgeRangeLabel, useDateFormat } from './format';
import { MediaImage } from './MediaImage';
import { StatusChip } from './StatusChip';

export interface ChallengeCardProps {
  challenge: Challenge;
  /** Locale-less path. */
  href: string;
  /** The time the page was rendered at; the phase (upcoming, open, closed) is derived from it. */
  now: IsoDateString;
  /** The viewer has submitted an entry. */
  entered?: boolean;
  className?: string;
}

export function ChallengeCard({
  challenge,
  href,
  now,
  entered = false,
  className,
}: ChallengeCardProps) {
  const locale = useLocale();
  const t = useTranslations('domain');
  const formatDate = useDateFormat();
  const ageRange = useAgeRangeLabel()(challenge.ageMin, challenge.ageMax);
  const text = pickTranslation(challenge.translations, locale, challenge.defaultLocale);
  const phase = getChallengePhase(challenge, now);

  const dateLine =
    phase === 'upcoming'
      ? t('challenge.opensOn', { date: formatDate(challenge.startAt) })
      : phase === 'open'
        ? t('challenge.dueOn', { date: formatDate(challenge.deadlineAt) })
        : t('challenge.closedOn', { date: formatDate(challenge.deadlineAt) });

  return (
    <Card as="article" interactive className={cn('h-full', className)}>
      {challenge.coverImage && (
        <MediaImage
          media={challenge.coverImage}
          alt=""
          frame="16:9"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="rounded-t-card"
        />
      )}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="brand">{t(`challenge.types.${challenge.type}`)}</Chip>
          <StatusChip status={phase} />
          {entered && (
            <Chip tone="success" icon={<CircleCheck aria-hidden="true" />}>
              {t('challenge.entered')}
            </Chip>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-base leading-snug font-semibold text-ink">
            <Link
              href={href}
              className="rounded-sm after:absolute after:inset-0 after:rounded-card"
            >
              {text.title}
            </Link>
          </h3>
          {text.description && (
            <p className="line-clamp-2 text-sm text-ink-muted">{text.description}</p>
          )}
        </div>

        <ul className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-1 text-sm text-ink-muted">
          <li className="flex items-center gap-1.5">
            <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
            {dateLine}
          </li>
          {challenge.xpReward > 0 && (
            <li className="flex items-center gap-1.5 font-semibold text-brand-700">
              <Zap aria-hidden="true" className="size-4 shrink-0" />
              {t('challenge.reward', { xp: challenge.xpReward })}
            </li>
          )}
          {ageRange && (
            <li className="flex items-center gap-1.5">
              <Users aria-hidden="true" className="size-4 shrink-0" />
              {ageRange}
            </li>
          )}
        </ul>
      </div>
    </Card>
  );
}
