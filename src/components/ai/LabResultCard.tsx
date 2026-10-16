import type { ReactNode } from 'react';
import { FlaskConical, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, Chip } from '@/components/ui';

export interface LabResultCardProps {
  /** `ai`: written by the model (labelled and with the disclaimer, 8.6). `demo`: a canned result. */
  variant: 'ai' | 'demo';
  prompt: string;
  /** The demo tool's choice, already translated. */
  option?: string | null;
  children: ReactNode;
}

/** One AI Lab result with what produced it. */
export function LabResultCard({ variant, prompt, option, children }: LabResultCardProps) {
  const t = useTranslations('aiLab');
  return (
    <Card className="gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        {variant === 'ai' ? (
          <Chip tone="brand" icon={<Sparkles aria-hidden="true" />}>
            {t('result.aiLabel')}
          </Chip>
        ) : (
          <Chip tone="accent" icon={<FlaskConical aria-hidden="true" />}>
            {t('result.mockLabel')}
          </Chip>
        )}
      </div>
      <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_minmax(0,1fr)]">
        <dt className="font-semibold text-ink-muted">{t('result.yourPrompt')}</dt>
        <dd className="min-w-0 break-words whitespace-pre-wrap text-ink">{prompt}</dd>
        {option && (
          <>
            <dt className="mt-1 font-semibold text-ink-muted sm:mt-0">{t('result.option')}</dt>
            <dd className="min-w-0 break-words text-ink">{option}</dd>
          </>
        )}
      </dl>
      <div className="min-w-0 border-t border-border pt-4">{children}</div>
      {variant === 'ai' && <p className="text-xs text-ink-muted">{t('result.disclaimer')}</p>}
    </Card>
  );
}
