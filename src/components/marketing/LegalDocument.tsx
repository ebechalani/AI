import { FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Alert, Chip } from '@/components/ui';
import { CONTAINER } from './Section';

export interface LegalDocumentProps {
  document: 'privacy' | 'terms';
  /** The section keys of `legal.<document>.sections`, in reading order. */
  sections: readonly string[];
}

/**
 * A legal page from the `legal` catalog: a visible draft notice, a table of contents and the
 * sections. The copy is a placeholder until the owner's lawyer supplies the final text.
 */
export function LegalDocument({ document, sections }: LegalDocumentProps) {
  const t = useTranslations('legal');
  return (
    <article className={`${CONTAINER} max-w-3xl py-10 sm:py-14`}>
      <header className="flex flex-col gap-4 border-b border-border pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-11 items-center justify-center rounded-control bg-brand-100 text-brand-700"
          >
            <FileText className="size-5" />
          </span>
          <Chip tone="warning" size="md">
            {t('draft.label')}
          </Chip>
        </div>
        <h1 className="text-3xl leading-tight font-bold tracking-tight text-ink sm:text-4xl">
          {t(`${document}.title`)}
        </h1>
        <p className="text-lg text-ink-muted">{t(`${document}.intro`)}</p>
        <Alert tone="warning" title={t('draft.title')} live="off">
          {t('draft.description')}
        </Alert>
      </header>

      <nav aria-label={t(`${document}.title`)} className="py-8">
        <ol className="grid gap-1.5 text-sm sm:grid-cols-2">
          {sections.map((key, index) => (
            <li key={key}>
              <a
                href={`#${key}`}
                className="inline-flex min-h-9 items-center gap-2 rounded-sm font-medium text-brand-700 underline-offset-4 hover:underline"
              >
                <span className="text-ink-muted tabular-nums">{index + 1}.</span>
                {t(`${document}.sections.${key}.title`)}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex flex-col gap-10">
        {sections.map((key, index) => (
          <section key={key} id={key} aria-labelledby={`${key}-title`} className="scroll-mt-24">
            <h2 id={`${key}-title`} className="text-xl font-semibold text-ink">
              <span className="me-2 text-ink-muted tabular-nums">{index + 1}.</span>
              {t(`${document}.sections.${key}.title`)}
            </h2>
            <p className="mt-3 text-base leading-7 text-ink">
              {t(`${document}.sections.${key}.body`)}
            </p>
          </section>
        ))}
        <section aria-labelledby="legal-contact" className="rounded-card bg-surface-muted p-6">
          <h2 id="legal-contact" className="text-base font-semibold text-ink">
            {t('contact.title')}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">{t('contact.description')}</p>
        </section>
      </div>
    </article>
  );
}
