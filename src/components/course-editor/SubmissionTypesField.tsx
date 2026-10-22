'use client';

import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui';
import { SUBMISSION_TYPES, type SubmissionType } from '@/types/common';

export interface SubmissionTypesFieldProps {
  value: SubmissionType[];
  onChange(value: SubmissionType[]): void;
  error?: string;
  disabled: boolean;
}

/** What learners may submit for a project (6.5). */
export function SubmissionTypesField({ value, onChange, error, disabled }: SubmissionTypesFieldProps) {
  const t = useTranslations('courseEditor');
  const tDomain = useTranslations('domain');
  return (
    <fieldset className="min-w-0" aria-invalid={error ? true : undefined}>
      <legend className="mb-1 text-sm font-semibold text-ink">{t('project.submissionTypes')}</legend>
      <p className="mb-3 text-sm text-ink-muted">{t('project.submissionTypesHint')}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {SUBMISSION_TYPES.map((type) => (
          <Checkbox
            key={type}
            label={tDomain(`submissionTypes.${type}`)}
            checked={value.includes(type)}
            disabled={disabled}
            onChange={(event) =>
              onChange(
                event.target.checked
                  ? SUBMISSION_TYPES.filter((candidate) => candidate === type || value.includes(candidate))
                  : value.filter((candidate) => candidate !== type),
              )
            }
          />
        ))}
      </div>
      {error && <p className="mt-1.5 text-sm font-medium text-danger">{error}</p>}
    </fieldset>
  );
}
