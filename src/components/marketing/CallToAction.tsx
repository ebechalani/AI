import { useTranslations } from 'next-intl';
import { LinkButton, Logo } from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';
import { CONTAINER } from './Section';

// Buttons on the brand gradient: the kit's variants are made for light surfaces, so the two
// dark-surface looks are written here rather than layered over a variant's own colours.
const OUTLINE_ON_DARK =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-white/40 px-6 py-2.5 text-center text-base font-semibold text-white transition-colors select-none hover:bg-white/10 active:bg-white/15';
const LINK_ON_DARK =
  'inline-flex min-h-11 items-center justify-center rounded-sm px-2 text-sm font-semibold text-white/85 underline-offset-4 transition-colors hover:text-white hover:underline';

/** The closing "Call to Action": two ways to sign up and the way back in. */
export function CallToAction() {
  const t = useTranslations('home');
  return (
    <section aria-labelledby="cta-title" className="py-16 sm:py-20 lg:py-24">
      <div className={CONTAINER}>
        <div className="relative isolate overflow-hidden rounded-[1.5rem] bg-linear-to-br from-brand-700 via-brand-600 to-accent-700 px-6 py-12 text-center text-white shadow-card sm:px-12 sm:py-16">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.18)_1px,transparent_0)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
          />
          <Logo variant="mark" tone="inverse" height={44} label="" className="mx-auto" />
          <h2
            id="cta-title"
            className="mt-6 text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl"
          >
            {t('cta.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">{t('cta.description')}</p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <LinkButton href="/signup?role=student" variant="secondary" size="lg">
              {t('cta.student')}
            </LinkButton>
            <Link href="/signup?role=teacher" className={OUTLINE_ON_DARK}>
              {t('cta.teacher')}
            </Link>
          </div>
          <div className="mt-4">
            <Link href="/login" className={LINK_ON_DARK}>
              {t('cta.login')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
