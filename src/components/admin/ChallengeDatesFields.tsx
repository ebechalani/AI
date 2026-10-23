'use client';

import { useTranslations } from 'next-intl';
import { FormField, Input } from '@/components/ui';
import { SECTION_LEGEND, type ChallengeFieldsProps } from './challenge-fields';

export interface ChallengeDatesFieldsProps extends ChallengeFieldsProps {
  /** The viewer's time zone, in which the two instants are typed. */
  timeZone: string;
}

/** When entries open and close, in the viewer's zone. */
export function ChallengeDatesFields({
  values,
  onChange,
  errors,
  disabled,
  timeZone,
}: ChallengeDatesFieldsProps) {
  const t = useTranslations('admin');

  return (
    <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-4">
      <legend className={SECTION_LEGEND}>{t('challenges.form.datesLegend')}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="challenge-startAt" label={t('challenges.form.startAt')} error={errors.startAt} required>
          <Input
            type="datetime-local"
            name="startAt"
            value={values.startAt}
            onChange={(event) => onChange({ ...values, startAt: event.target.value })}
          />
        </FormField>
        <FormField
          id="challenge-deadlineAt"
          label={t('challenges.form.deadlineAt')}
          error={errors.deadlineAt}
          required
        >
          <Input
            type="datetime-local"
            name="deadlineAt"
            value={values.deadlineAt}
            onChange={(event) => onChange({ ...values, deadlineAt: event.target.value })}
          />
        </FormField>
      </div>
      <p className="text-sm text-ink-muted">{t('shared.timeZone', { zone: timeZone })}</p>
    </fieldset>
  );
}
