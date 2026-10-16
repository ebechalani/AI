import type { ReactNode, RefObject } from 'react';
import { useId } from 'react';
import { useTranslations } from 'next-intl';
import type { LabRun } from './lab-model';

export interface LabResultsProps {
  /** Newest first. */
  runs: readonly LabRun[];
  /** Focused after a run, so the new result is announced by its heading. */
  headingRef: RefObject<HTMLHeadingElement | null>;
  renderRun: (run: LabRun) => ReactNode;
}

/** The results of this visit: the newest, then the earlier ones (nothing is stored). */
export function LabResults({ runs, headingRef, renderRun }: LabResultsProps) {
  const t = useTranslations('aiLab');
  const headingId = useId();
  const [latest, ...earlier] = runs;
  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-4">
      <h2
        id={headingId}
        ref={headingRef}
        tabIndex={-1}
        className="rounded-sm text-xl font-semibold text-ink"
      >
        {t('result.title')}
      </h2>
      {latest === undefined ? (
        <p className="text-ink-muted">{t('result.empty')}</p>
      ) : (
        renderRun(latest)
      )}
      {earlier.length > 0 && (
        <>
          <h3 className="mt-2 text-base font-semibold text-ink">{t('result.earlier')}</h3>
          <ol className="flex flex-col gap-4">
            {earlier.map((run) => (
              <li key={run.id}>{renderRun(run)}</li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
