import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LinkButton } from '@/components/ui';
import { HeroPreview } from './HeroPreview';
import { CONTAINER } from './Section';

export interface HeroProps {
  /** Published pathways, counted from the database. */
  pathwayCount: number;
}

const FACTS = ['ages', 'pathways', 'languages', 'robotics'] as const;

/** "Learn AI. Build with AI. Create the Future." and the two ways to begin. */
export function Hero({ pathwayCount }: HeroProps) {
  const t = useTranslations('home');
  return (
    <section className="relative isolate overflow-hidden bg-linear-to-b from-brand-50 via-surface to-surface">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] bg-[size:28px_28px] [mask-image:linear-gradient(to_bottom,black_30%,transparent)]"
      />
      <div
        aria-hidden="true"
        className="absolute -top-32 -inset-e-24 -z-10 size-[28rem] rounded-full bg-brand-300/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 -inset-s-32 -z-10 size-96 rounded-full bg-accent-200/50 blur-3xl"
      />

      <div
        className={`${CONTAINER} grid gap-12 py-16 sm:py-20 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:items-center lg:gap-16 lg:py-28`}
      >
        <div className="flex flex-col gap-6">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-surface/80 px-3 py-1 text-sm font-semibold text-brand-700 shadow-sm backdrop-blur-sm">
            <Sparkles aria-hidden="true" className="size-4" />
            {t('hero.eyebrow')}
          </p>
          <h1 className="text-4xl leading-[1.05] font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl">
            <span className="block">{t('hero.titleLine1')}</span>
            <span className="block">{t('hero.titleLine2')}</span>
            <span className="block bg-linear-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
              {t('hero.titleLine3')}
            </span>
          </h1>
          <p className="text-xl font-medium text-ink sm:text-2xl">{t('hero.subtitle')}</p>
          <p className="max-w-xl text-lg text-ink-muted">{t('hero.lead')}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/signup" size="lg">
              {t('hero.primary')}
              <ArrowRight aria-hidden="true" className="rtl:-scale-x-100" />
            </LinkButton>
            <LinkButton href="/pathways" variant="secondary" size="lg">
              {t('hero.secondary')}
            </LinkButton>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink-muted">
            {FACTS.map((fact) => (
              <li key={fact} className="flex items-center gap-1.5">
                <Check aria-hidden="true" className="size-4 shrink-0 text-success" />
                {fact === 'pathways'
                  ? t('hero.facts.pathways', { count: pathwayCount })
                  : t(`hero.facts.${fact}`)}
              </li>
            ))}
          </ul>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}
