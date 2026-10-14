import { ArrowLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { NamedIcon, useAgeRangeLabel } from '@/components/domain';
import { Chip } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import type { Pathway, PathwayAccent } from '@/types/content';
import { CONTAINER } from './Section';

// Written out in full so Tailwind generates them; each tile carries white at AA or better.
const ACCENT_TILES: Record<PathwayAccent, string> = {
  violet: 'from-violet-600 to-violet-800',
  cyan: 'from-cyan-600 to-cyan-800',
  emerald: 'from-emerald-600 to-emerald-800',
  amber: 'from-amber-600 to-amber-800',
  rose: 'from-rose-600 to-rose-800',
  blue: 'from-blue-600 to-blue-800',
  slate: 'from-slate-600 to-slate-800',
};

export interface PathwayHeroProps {
  pathway: Pathway;
  courseCount: number;
}

/** The head of a public pathway page: who it is for, what it covers, how many courses. */
export function PathwayHero({ pathway, courseCount }: PathwayHeroProps) {
  const locale = useLocale();
  const t = useTranslations('home');
  const tDomain = useTranslations('domain');
  const ageRange = useAgeRangeLabel()(pathway.ageMin, pathway.ageMax);
  const text = pickTranslation(pathway.translations, locale, pathway.defaultLocale);
  const topics = text.topics ?? [];

  return (
    <header className="relative isolate overflow-hidden bg-linear-to-b from-brand-50 to-surface">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] bg-[size:28px_28px] [mask-image:linear-gradient(to_bottom,black_20%,transparent)]"
      />
      <div className={`${CONTAINER} flex flex-col gap-8 py-10 sm:py-14`}>
        <Link
          href="/pathways"
          className="inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          {t('pathwayPage.back')}
        </Link>
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
          <span
            aria-hidden="true"
            className={cn(
              'flex size-20 shrink-0 items-center justify-center rounded-card bg-linear-to-br text-white shadow-card',
              ACCENT_TILES[pathway.accent] ?? ACCENT_TILES.slate,
            )}
          >
            <NamedIcon name={pathway.icon} className="size-10" strokeWidth={1.75} />
          </span>
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {pathway.audience === 'teacher' ? (
                <Chip tone="accent" size="md">
                  {tDomain('course.forTeachers')}
                </Chip>
              ) : (
                ageRange && (
                  <Chip tone="brand" size="md">
                    {ageRange}
                  </Chip>
                )
              )}
              <Chip size="md">{t('pathwayPage.coursesCount', { count: courseCount })}</Chip>
            </div>
            <h1 className="text-3xl leading-tight font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
              {text.title}
            </h1>
            {text.tagline && <p className="text-xl font-medium text-ink">{text.tagline}</p>}
            {text.description && (
              <p className="max-w-3xl text-base text-ink-muted sm:text-lg">{text.description}</p>
            )}
            {topics.length > 0 && (
              <div className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold tracking-wider text-ink-muted uppercase">
                  {t('pathwayPage.topics')}
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {topics.map((topic) => (
                    <li key={topic} className="max-w-full">
                      <Chip size="md">{topic}</Chip>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
