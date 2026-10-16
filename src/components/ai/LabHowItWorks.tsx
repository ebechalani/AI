import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui';

export interface LabHowItWorksProps {
  status: 'live' | 'mock';
  /** The prompt tips of the text tool. */
  tips?: boolean;
}

const TIP_KEYS = ['audience', 'length', 'tone'] as const;

/** The aside of a tool page: what happens to the prompt, and tips for writing one. */
export function LabHowItWorks({ status, tips = false }: LabHowItWorksProps) {
  const t = useTranslations('aiLab');
  return (
    <Card tone="muted" className="gap-3 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-ink">{t('howItWorks.title')}</h2>
      <p className="text-sm text-ink-muted">{t(`howItWorks.${status}`)}</p>
      {tips && (
        <>
          <h3 className="mt-2 text-sm font-semibold text-ink">{t('tools.text.tips.title')}</h3>
          <ul className="flex list-disc flex-col gap-1 ps-5 text-sm text-ink-muted">
            {TIP_KEYS.map((key) => (
              <li key={key}>{t(`tools.text.tips.${key}`)}</li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
