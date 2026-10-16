'use client';

import { useTranslations } from 'next-intl';
import { FormField, Input, Select } from '@/components/ui';
import { CONTENT_LIMITS } from '@/lib/limits';
import { AGE_BANDS, type AgeBand } from '@/types/common';

export interface ClassFormValues {
  name: string;
  gradeLabel: string;
  ageBand: AgeBand;
}

export type ClassField = 'name' | 'gradeLabel' | 'ageBand';

export interface ClassFieldsProps {
  values: ClassFormValues;
  onChange: (values: ClassFormValues) => void;
  /** Already translated. */
  errors: Partial<Record<ClassField, string>>;
  /** The class has no school: the age-group hint names the 13+ rule. */
  schoolless: boolean;
  disabled?: boolean;
}

/** What the class actions take: an empty grade is no grade. */
export function classPayload(values: ClassFormValues): {
  name: string;
  gradeLabel: string | null;
  ageBand: AgeBand;
} {
  return {
    name: values.name,
    gradeLabel: values.gradeLabel.trim() === '' ? null : values.gradeLabel,
    ageBand: values.ageBand,
  };
}

/** Name, grade and age group: the fields of the create and edit dialogs. */
export function ClassFields({ values, onChange, errors, schoolless, disabled }: ClassFieldsProps) {
  const t = useTranslations('classes');
  const tDomain = useTranslations('domain');

  return (
    <div className="flex flex-col gap-5">
      <FormField label={t('form.name')} hint={t('form.nameHint')} error={errors.name} required>
        <Input
          name="name"
          value={values.name}
          onChange={(event) => onChange({ ...values, name: event.target.value })}
          maxLength={CONTENT_LIMITS.classNameChars}
          autoComplete="off"
          disabled={disabled}
          data-autofocus
        />
      </FormField>
      <FormField
        label={t('form.gradeLabel')}
        hint={t('form.gradeLabelHint')}
        error={errors.gradeLabel}
        optional
      >
        <Input
          name="gradeLabel"
          value={values.gradeLabel}
          onChange={(event) => onChange({ ...values, gradeLabel: event.target.value })}
          maxLength={CONTENT_LIMITS.gradeLabelChars}
          autoComplete="off"
          disabled={disabled}
        />
      </FormField>
      <FormField
        label={t('form.ageBand')}
        hint={schoolless ? t('form.ageBandHintNoSchool') : t('form.ageBandHint')}
        error={errors.ageBand}
      >
        <Select
          name="ageBand"
          value={values.ageBand}
          onChange={(event) => onChange({ ...values, ageBand: event.target.value as AgeBand })}
          disabled={disabled}
          options={AGE_BANDS.map((band) => ({ value: band, label: tDomain(`ageBands.${band}`) }))}
        />
      </FormField>
    </div>
  );
}
