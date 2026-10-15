import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LinkButton } from '@/components/ui';

export interface LessonFooterProps {
  previousHref: string | null;
  nextHref: string | null;
  /** The complete control; null in the read-only preview. */
  control: ReactNode;
}

/**
 * Previous · complete · Next. The side links show only their icon on phones, so the three fit
 * on one row at 375 px; the middle column stays centred whatever the side labels' length.
 */
export function LessonFooter({ previousHref, nextHref, control }: LessonFooterProps) {
  const t = useTranslations('lesson');
  return (
    <nav aria-label={t('footer.label')}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="flex min-w-0 justify-start">
          {previousHref && (
            <LinkButton href={previousHref} variant="secondary">
              <ChevronLeft aria-hidden="true" className="rtl:rotate-180" />
              <span className="max-sm:sr-only">{t('footer.previous')}</span>
            </LinkButton>
          )}
        </div>
        <div className="flex min-w-0 justify-center">{control}</div>
        <div className="flex min-w-0 justify-end">
          {nextHref && (
            <LinkButton href={nextHref} variant="secondary">
              <span className="max-sm:sr-only">{t('footer.next')}</span>
              <ChevronRight aria-hidden="true" className="rtl:rotate-180" />
            </LinkButton>
          )}
        </div>
      </div>
    </nav>
  );
}
