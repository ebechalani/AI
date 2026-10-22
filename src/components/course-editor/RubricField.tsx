'use client';

import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui';
import { cn } from '@/lib/utils';
import { RUBRIC_KEYS } from '@/types/project';
import { NumberField } from './NumberField';
import { rubricTotal, type ProjectDraft } from './project-model';

export interface RubricFieldProps {
  rubric: ProjectDraft['rubric'];
  onChange(rubric: ProjectDraft['rubric']): void;
  error?: string;
  disabled: boolean;
}

/** The criteria the work is judged on and their weights, with a running total (6.5). */
export function RubricField({ rubric, onChange, error, disabled }: RubricFieldProps) {
  const t = useTranslations('courseEditor');
  const tDomain = useTranslations('domain');
  const total = rubricTotal(rubric);
  return (
    <fieldset className="min-w-0" aria-invalid={error ? true : undefined}>
      <legend className="mb-1 text-sm font-semibold text-ink">{t('project.rubric')}</legend>
      <p className="mb-3 text-sm text-ink-muted">{t('project.rubricHint')}</p>
      <div className="flex flex-col gap-3">
        {RUBRIC_KEYS.map((key) => {
          const entry = rubric[key];
          const criterion = tDomain(`rubric.${key}`);
          return (
            <div key={key} className="grid grid-cols-[1fr_auto] items-center gap-3">
              <Checkbox
                label={criterion}
                checked={entry.included}
                disabled={disabled}
                onChange={(event) =>
                  onChange({ ...rubric, [key]: { ...entry, included: event.target.checked } })
                }
              />
              <NumberField
                label={t('project.weight', { criterion })}
                value={entry.weight}
                onChange={(weight) => onChange({ ...rubric, [key]: { ...entry, weight } })}
                min={0}
                max={100}
                suffix="%"
                disabled={disabled || !entry.included}
                className="[&_label]:sr-only"
              />
            </div>
          );
        })}
      </div>
      <p
        aria-live="polite"
        className={cn('mt-3 text-sm font-semibold', total === 100 ? 'text-ink' : 'text-danger')}
      >
        {t('project.rubricTotal', { total })}
      </p>
      {error && <p className="mt-1.5 text-sm font-medium text-danger">{error}</p>}
    </fieldset>
  );
}
