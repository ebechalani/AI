import { useTranslations } from 'next-intl';
import { LinkButton, Logo } from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';
import { LocaleSwitcher } from './LocaleSwitcher';

export interface PublicHeaderProps {
  /**
   * The signed-in visitor's own area (`roleHome(role)`). When given, one "Go to my space"
   * button replaces Log in and Get started.
   */
  mySpaceHref?: string | null;
}

export function PublicHeader({ mySpaceHref }: PublicHeaderProps) {
  const t = useTranslations('nav');
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur-sm">
      {/* Below 360 px (French on a 320 px phone) the gaps tighten and the language button is
          the globe alone, so the row never scrolls sideways; 360 px and up are unchanged. */}
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center gap-1 px-4 min-[22.5rem]:gap-1.5 sm:gap-3 sm:px-6 lg:px-8">
        <Link href="/" aria-label={t('shell.homeLink')} className="shrink-0 rounded-sm">
          <Logo variant="mark" label="" className="sm:hidden" />
          <Logo label="" className="max-sm:hidden" />
        </Link>
        <nav aria-label={t('shell.mainNavigation')} className="ms-4 max-md:hidden">
          <Link
            href="/pathways"
            className="rounded-control px-3 py-2 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
          >
            {t('public.pathways')}
          </Link>
        </nav>
        <div className="flex-1" />
        <LocaleSwitcher align="start" compact="narrow" />
        {mySpaceHref ? (
          <LinkButton href={mySpaceHref} size="sm">
            {t('public.mySpace')}
          </LinkButton>
        ) : (
          <>
            <LinkButton href="/login" variant="ghost" size="sm">
              {t('public.login')}
            </LinkButton>
            <LinkButton href="/signup" size="sm">
              {t('public.getStarted')}
            </LinkButton>
          </>
        )}
      </div>
    </header>
  );
}
