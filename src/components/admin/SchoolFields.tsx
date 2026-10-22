'use client';

import { useLocale, useTranslations } from 'next-intl';
import { FormField, Input, Select } from '@/components/ui';
import { LOCALES } from '@/lib/i18n/config';
import { CONTENT_LIMITS } from '@/lib/limits';
import type { Locale } from '@/types/common';
import { regionName, type SchoolFormValues } from './school-model';

export type SchoolField = keyof SchoolFormValues;

export interface SchoolFieldsProps {
  values: SchoolFormValues;
  onChange: (values: SchoolFormValues) => void;
  errors: Partial<Record<SchoolField, string>>;
  disabled?: boolean;
  /** Ids `${idPrefix}-name` and so on, so two forms on a page never share one. */
  idPrefix: string;
}

const COUNTRY_CODE = /^[A-Za-z]{2}$/;

/** Name, country code (with its name as a preview), city and default language of a school. */
export function SchoolFields({ values, onChange, errors, disabled, idPrefix }: SchoolFieldsProps) {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const code = values.country.trim();
  const preview = COUNTRY_CODE.test(code) ? regionName(code.toUpperCase(), locale) : null;

  return (
    <div className="flex flex-col gap-5">
      <FormField
        id={`${idPrefix}-name`}
        label={t('schools.fields.name')}
        hint={t('schools.fields.nameHint', {
          min: CONTENT_LIMITS.schoolNameMinChars,
          max: CONTENT_LIMITS.schoolNameMaxChars,
        })}
        error={errors.name}
        required
      >
        <Input
          name="name"
          value={values.name}
          onChange={(event) => onChange({ ...values, name: event.target.value })}
          autoComplete="off"
          maxLength={CONTENT_LIMITS.schoolNameMaxChars}
          disabled={disabled}
          data-autofocus
        />
      </FormField>
      <div>
        <FormField
          id={`${idPrefix}-country`}
          label={t('schools.fields.country')}
          hint={t('schools.fields.countryHint')}
          error={errors.country}
          required
        >
          <Input
            name="country"
            value={values.country}
            onChange={(event) => onChange({ ...values, country: event.target.value })}
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={2}
            disabled={disabled}
            className="w-24 uppercase"
          />
        </FormField>
        <p aria-live="polite" className="mt-1.5 text-sm text-ink-muted">
          {preview !== null && t('schools.fields.countryPreview', { country: preview })}
        </p>
      </div>
      <FormField
        id={`${idPrefix}-city`}
        label={t('schools.fields.city')}
        error={errors.city}
        optional
      >
        <Input
          name="city"
          value={values.city}
          onChange={(event) => onChange({ ...values, city: event.target.value })}
          autoComplete="off"
          maxLength={CONTENT_LIMITS.cityChars}
          disabled={disabled}
        />
      </FormField>
      <FormField
        id={`${idPrefix}-defaultLocale`}
        label={t('schools.fields.defaultLocale')}
        hint={t('schools.fields.defaultLocaleHint')}
        error={errors.defaultLocale}
        required
      >
        <Select
          name="defaultLocale"
          value={values.defaultLocale}
          onChange={(event) => onChange({ ...values, defaultLocale: event.target.value as Locale })}
          disabled={disabled}
          options={LOCALES.map((item) => ({ value: item, label: tCommon(`locale.names.${item}`) }))}
        />
      </FormField>
    </div>
  );
}
