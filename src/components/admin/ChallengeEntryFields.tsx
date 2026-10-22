'use client';

import { useTranslations } from 'next-intl';
import { Checkbox, Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import { SUBMISSION_TYPES, type SubmissionType } from '@/types/common';
import { RUBRIC_KEYS, type RubricKey } from '@/types/project';
import { SECTION_LEGEND, toggleItem, type ChallengeFieldsProps } from './challenge-fields';
import { rubricTotal } from './challenge-model';
import { CheckboxFieldset } from './CheckboxFieldset';

/** What students may send and how the entries are scored. */
export function ChallengeEntryFields({ values, onChange, errors, disabled }: ChallengeFieldsProps) {
  const t = useTranslations('admin');
  const tDomain = useTranslations('domain');
  const total = rubricTotal(values);
  const rubricError = errors.rubric;
  const firstEnabled = RUBRIC_KEYS.find((key) => values.rubric[key].enabled);

  function setRubric(key: RubricKey, patch: Partial<{ enabled: boolean; weight: string }>) {
    onChange({ ...values, rubric: { ...values.rubric, [key]: { ...values.rubric[key], ...patch } } });
  }

  return (
    <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-5">
      <legend className={SECTION_LEGEND}>{t('challenges.form.entriesLegend')}</legend>
      <CheckboxFieldset
        legend={t('challenges.form.types')}
        hint={t('challenges.form.typesHint')}
        error={errors.allowedSubmissionTypes}
        gridClassName="grid grid-cols-2 sm:grid-cols-4"
      >
        {SUBMISSION_TYPES.map((type, index) => (
          <Checkbox
            key={type}
            name="allowedSubmissionTypes"
            value={type}
            label={tDomain(`submissionTypes.${type}`)}
            checked={values.allowedSubmissionTypes.includes(type)}
            invalid={index === 0 && errors.allowedSubmissionTypes !== undefined}
            onChange={(event) =>
              onChange({
                ...values,
                allowedSubmissionTypes: toggleItem<SubmissionType>(
                  values.allowedSubmissionTypes,
                  type,
                  event.target.checked,
                ),
              })
            }
          />
        ))}
      </CheckboxFieldset>
      <CheckboxFieldset
        legend={t('challenges.form.rubricLegend')}
        hint={t('challenges.form.rubricHint')}
        error={rubricError}
      >
        {RUBRIC_KEYS.map((key, index) => {
          const entry = values.rubric[key];
          const criterion = tDomain(`rubric.${key}`);
          const markWeight = rubricError !== undefined && firstEnabled === key;
          const markBox = rubricError !== undefined && firstEnabled === undefined && index === 0;
          return (
            <div key={key} className="grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-3">
              <Checkbox
                name="rubric"
                value={key}
                label={criterion}
                checked={entry.enabled}
                invalid={markBox}
                onChange={(event) => setRubric(key, { enabled: event.target.checked })}
              />
              <Input
                type="number"
                inputMode="numeric"
                name={`rubric-${key}`}
                min={0}
                max={100}
                aria-label={t('challenges.form.rubricWeight', { criterion })}
                value={entry.weight}
                disabled={!entry.enabled}
                invalid={markWeight}
                onChange={(event) => setRubric(key, { weight: event.target.value })}
              />
            </div>
          );
        })}
        <p
          aria-live="polite"
          className={cn('text-sm font-medium', total === 100 ? 'text-ink-muted' : 'text-danger')}
        >
          {t('challenges.form.rubricTotal', { total })}
        </p>
      </CheckboxFieldset>
    </fieldset>
  );
}
