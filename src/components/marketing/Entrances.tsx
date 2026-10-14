import { ArrowRight, GraduationCap, School, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LinkButton } from '@/components/ui';
import { cn } from '@/lib/utils';
import { CONTAINER } from './Section';

// Students and teachers sign up; schools are created by the platform team, so their entrance
// points at the "For Schools" section (ARCHITECTURE.md 6.1).
const ENTRANCES = [
  {
    key: 'students',
    href: '/signup?role=student',
    Icon: Sparkles,
    tile: 'bg-brand-600 text-white',
    ring: 'hover:border-brand-300',
  },
  {
    key: 'teachers',
    href: '/signup?role=teacher',
    Icon: GraduationCap,
    tile: 'bg-accent-600 text-white',
    ring: 'hover:border-accent-400',
  },
  {
    key: 'schools',
    href: '#schools',
    Icon: School,
    tile: 'bg-ink text-white',
    ring: 'hover:border-ink/40',
  },
] as const;

/** The three doors of the homepage: students, teachers, schools. */
export function Entrances() {
  const t = useTranslations('home');
  return (
    <section aria-labelledby="entrances-title" className="relative -mt-4 pb-16 sm:pb-20">
      <div className={CONTAINER}>
        <h2 id="entrances-title" className="sr-only">
          {t('entrances.title')}
        </h2>
        <ul className="grid gap-5 md:grid-cols-3">
          {ENTRANCES.map(({ key, href, Icon, tile, ring }) => (
            <li key={key}>
              <article
                className={cn(
                  'flex h-full flex-col gap-4 rounded-card border border-border bg-surface p-6 shadow-card transition-[border-color,box-shadow,translate] duration-200 hover:shadow-lg motion-safe:hover:-translate-y-0.5',
                  ring,
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex size-11 shrink-0 items-center justify-center rounded-control',
                      tile,
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <p className="text-sm font-semibold tracking-wider text-ink-muted uppercase">
                    {t(`entrances.${key}.label`)}
                  </p>
                </div>
                <h3 className="text-xl leading-snug font-bold text-ink">
                  {t(`entrances.${key}.title`)}
                </h3>
                <p className="text-sm text-ink-muted">{t(`entrances.${key}.description`)}</p>
                <div className="mt-auto pt-2">
                  <LinkButton href={href} variant="secondary" fullWidth>
                    {t(`entrances.${key}.cta`)}
                    <ArrowRight aria-hidden="true" className="rtl:-scale-x-100" />
                  </LinkButton>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
