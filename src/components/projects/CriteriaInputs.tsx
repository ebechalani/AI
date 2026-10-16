'use client';

import { useTranslations } from 'next-intl';
import { FormField, Input } from '@/components/ui';
import type { RubricKey, RubricWeight } from '@/types/project';
import { scoreState, type CriteriaDraft } from './review-model';

export interface CriteriaInputsProps {
  rows: { key: RubricKey; weight: number }[];
  rubric: readonly RubricWeight[];
  draft: CriteriaDraft;
  onChange: (key: RubricKey, value: string) => void;
  /** Translated messages by criterion, and for the group. */
  errors: Partial<Record<RubricKey | 'criteria', string>>;
  idOf: (key: RubricKey) => string;
  legendId: string;
}

/**
 * The teacher's four scores (0–100). The schema needs all four, so the criteria the rubric does
 * not weigh are there too, marked "not counted". The total follows as they are typed.
 */
export function CriteriaInputs({
  rows,
  rubric,
  draft,
  onChange,
  errors,
  idOf,
  legendId,
}: CriteriaInputsProps) {
  const t = useTranslations('review');
  const tDomain = useTranslations('domain');
  const total = scoreState(draft, rubric);
  const hintId = `${legendId}-hint`;

  return (
    <fieldset className="flex min-w-0 flex-col gap-3" aria-describedby={hintId}>
      <legend id={legendId} className="mb-1 text-sm font-semibold text-ink">
        {t('form.criteria.legend')}
      </legend>
      <p id={hintId} className="-mt-1 text-sm text-ink-muted">
        {t('form.criteria.hint')}
      </p>
      {errors.criteria && <p className="text-sm font-medium text-danger">{errors.criteria}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {rows.map((row) => (
          <FormField
            key={row.key}
            id={idOf(row.key)}
            label={tDomain(`rubric.${row.key}`)}
            hint={
              row.weight > 0
                ? t('form.criteria.weight', { weight: row.weight })
                : t('form.criteria.notWeighted')
            }
            error={errors[row.key]}
            required
          >
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              step={1}
              name={`criteria.${row.key}`}
              value={draft[row.key]}
              onChange={(event) => onChange(row.key, event.target.value)}
            />
          </FormField>
        ))}
      </div>
      <p aria-live="polite" className="text-sm font-semibold text-ink">
        {total.kind === 'ready'
          ? t('form.score', { score: total.score })
          : total.kind === 'invalid'
            ? t('form.scoreInvalid')
            : t('form.scorePending')}
      </p>
    </fieldset>
  );
}
