import { useTranslations } from 'next-intl';
import { Card, LinkButton } from '@/components/ui';
import { SCHOOL_PATHS } from './paths';
import type { OnboardingStep } from './school-model';

/** The steps a new school still has to take; nothing once teachers and a class exist. */
export function GettingStarted({ steps }: { steps: OnboardingStep[] }) {
  const t = useTranslations('school');
  if (steps.length === 0) return null;

  return (
    <Card
      as="section"
      tone="brand"
      aria-labelledby="getting-started-title"
      className="mt-8 gap-4 p-5 sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 id="getting-started-title" className="text-lg leading-snug font-bold text-ink">
          {t('dashboard.start.title')}
        </h2>
        <p className="text-sm text-ink-muted">{t('dashboard.start.description')}</p>
      </div>
      <ol className="flex list-decimal flex-col gap-4 ps-5">
        {steps.map((step) => (
          <li key={step} className="ps-1">
            <div className="flex flex-col items-start gap-2">
              <p className="text-ink">
                {step === 'teachers' ? t('dashboard.start.teachers') : t('dashboard.start.classes')}
              </p>
              {step === 'teachers' ? (
                <LinkButton href={SCHOOL_PATHS.teachers} size="sm">
                  {t('dashboard.start.teachersAction')}
                </LinkButton>
              ) : (
                <LinkButton href={SCHOOL_PATHS.classes} size="sm">
                  {t('dashboard.start.classesAction')}
                </LinkButton>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
