'use client';

import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { getPathname } from '@/lib/i18n/navigation';
import type { StudentCredential } from './class-model';

export interface PrintableCredentialsProps {
  className: string | null;
  credentials: StudentCredential[];
}

// Only the slips print: the shell, the dialog and its backdrop are hidden. Dialog sets an inline
// overflow:hidden on <html> while open, which some engines then print as a single page.
const PRINT_CSS = `@media print {
  html { overflow: visible !important; }
  body > :not([data-credentials-print]) { display: none !important; }
  dialog, ::backdrop { display: none !important; }
  @page { margin: 12mm; }
}`;

/**
 * Cut-out slips, one per student, portalled into `<body>` so the print rules can hide
 * everything else. Rendered only while the credentials dialog is open, which happens after a
 * client action: `document` and `window` exist.
 */
export function PrintableCredentials({ className, credentials }: PrintableCredentialsProps) {
  const t = useTranslations('classes');
  const locale = useLocale();
  const loginUrl = new URL(getPathname({ href: '/login', locale }), window.location.origin).href;

  return createPortal(
    <div data-credentials-print className="hidden bg-white p-2 text-black print:block">
      <style>{PRINT_CSS}</style>
      <h1 className="mb-4 text-xl font-bold">
        {className === null
          ? t('credentials.slip.sheetTitleNoClass')
          : t('credentials.slip.sheetTitle', { className })}
      </h1>
      <div className="grid grid-cols-2 gap-4">
        {credentials.map((row, index) => (
          <section
            key={`${row.username}-${index}`}
            className="flex break-inside-avoid flex-col gap-1 rounded-card border border-dashed border-border p-4 text-sm"
          >
            <h2 className="text-base font-bold">{t('credentials.slip.heading')}</h2>
            {className !== null && <p>{t('credentials.slip.class', { className })}</p>}
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1">
              <dt>{t('credentials.slip.name')}</dt>
              <dd className="font-semibold break-words">{row.displayName}</dd>
              <dt>{t('credentials.slip.username')}</dt>
              <dd translate="no" className="font-mono text-lg font-bold break-all">
                {row.username}
              </dd>
              <dt>{t('credentials.slip.password')}</dt>
              <dd translate="no" className="font-mono text-lg font-bold break-all">
                {row.password}
              </dd>
            </dl>
            <p className="break-all">{t('credentials.slip.signIn', { url: loginUrl })}</p>
            <p className="text-xs italic">{t('credentials.slip.private')}</p>
          </section>
        ))}
      </div>
    </div>,
    document.body,
  );
}
