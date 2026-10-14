import { useTranslations } from 'next-intl';
import { Logo } from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';

const LINKS = [
  { key: 'pathways', href: '/pathways' },
  { key: 'privacy', href: '/privacy' },
  { key: 'terms', href: '/terms' },
] as const;

export function PublicFooter() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  return (
    <footer className="border-t border-border bg-surface-muted">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex max-w-sm flex-col gap-3">
            <Logo height={28} />
            <p className="text-sm text-ink-muted">{tCommon('tagline')}</p>
          </div>
          <nav aria-label={t('public.footerNavigation')}>
            <ul className="flex flex-wrap gap-x-6 gap-y-1">
              {LINKS.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-ink-muted underline-offset-4 hover:text-ink hover:underline"
                  >
                    {t(`public.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="border-t border-border pt-6 text-sm text-ink-muted">
          {t('public.copyright', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
