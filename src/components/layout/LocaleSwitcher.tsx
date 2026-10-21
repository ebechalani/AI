'use client';

import { useTransition } from 'react';
import { Globe } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { DropdownMenu } from '@/components/ui';
import { LOCALE_LABELS, LOCALES } from '@/lib/i18n/config';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import type { Locale } from '@/types/common';

/**
 * Saves the chosen language to the signed-in user's profile. The shape of
 * `updateProfileAction` (src/actions/settings.ts), which the area layouts pass down so that
 * this foundation component does not depend on a workstream-owned module.
 */
export type PersistLocale = (patch: { locale: Locale }) => Promise<unknown>;

export interface LocaleSwitcherProps {
  /** Set by the app shell for signed-in users; absent on the public and auth pages. */
  persist?: PersistLocale | null;
  /** Which edge of the button the list lines up with; use `start` when the button is not at the end of its row. */
  align?: 'start' | 'end';
  /**
   * `true`: below `sm` the button is the globe alone, without the language code (a crowded top
   * bar). `'narrow'`: the same only below 360 px (the public header on the smallest phones).
   */
  compact?: boolean | 'narrow';
}

/** Lists the languages, each named in itself, and reloads the current page in the chosen one. */
export function LocaleSwitcher({ persist, align = 'end', compact = false }: LocaleSwitcherProps) {
  const t = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale || pending) return;
    startTransition(async () => {
      if (persist) {
        // The page changes language whether or not the preference could be saved.
        await persist({ locale: next }).catch(() => null);
      }
      const { search, hash } = window.location;
      router.replace(`${pathname}${search}${hash}`, { locale: next, scroll: false });
    });
  }

  return (
    <DropdownMenu
      align={align}
      aria-label={`${t('locale.label')}: ${LOCALE_LABELS[locale]}`}
      items={LOCALES.map((option) => ({
        label: LOCALE_LABELS[option],
        selected: option === locale,
        onSelect: () => switchTo(option),
      }))}
      triggerClassName="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-control px-2.5 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink aria-expanded:bg-surface-muted aria-expanded:text-ink"
      trigger={
        <>
          <Globe aria-hidden="true" className="size-5 shrink-0" />
          <span className="max-sm:hidden">{LOCALE_LABELS[locale]}</span>
          {compact !== true && (
            <span
              className={
                compact === 'narrow'
                  ? 'uppercase max-[22.5rem]:hidden sm:hidden'
                  : 'uppercase sm:hidden'
              }
            >
              {locale}
            </span>
          )}
        </>
      }
    />
  );
}
