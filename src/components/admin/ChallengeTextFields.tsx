'use client';

import { useTranslations } from 'next-intl';
import { Chip, FormField, Input, RadioGroup, Textarea } from '@/components/ui';
import { LOCALES } from '@/lib/i18n/config';
import { CONTENT_LIMITS } from '@/lib/limits';
import type { Locale } from '@/types/common';
import type { ChallengeFieldsProps } from './challenge-fields';
import type { ChallengeTextValues } from './challenge-model';

const TEXT_FIELDS = ['title', 'description', 'submissionRequirements', 'prizes'] as const;
type TextField = (typeof TEXT_FIELDS)[number];

/** The default language and one group of four texts per supported language (default first). */
export function ChallengeTextFields({ values, onChange, errors, disabled }: ChallengeFieldsProps) {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const ordered = [values.defaultLocale, ...LOCALES.filter((l) => l !== values.defaultLocale)];

  function setText(locale: string, field: TextField, text: string) {
    const current = values.translations[locale] ?? {
      title: '',
      description: '',
      submissionRequirements: '',
      prizes: '',
    };
    onChange({
      ...values,
      translations: { ...values.translations, [locale]: { ...current, [field]: text } },
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <h2 className="text-lg font-semibold text-ink">{t('challenges.form.textTitle')}</h2>
      <RadioGroup
        legend={t('challenges.form.defaultLocale')}
        name="defaultLocale"
        orientation="horizontal"
        hint={t('challenges.form.defaultLocaleHint')}
        value={values.defaultLocale}
        onValueChange={(value) => onChange({ ...values, defaultLocale: value as Locale })}
        error={errors.defaultLocale}
        disabled={disabled}
        options={LOCALES.map((locale) => ({ value: locale, label: tCommon(`locale.names.${locale}`) }))}
      />
      {ordered.map((locale) => {
        const text: ChallengeTextValues = values.translations[locale] ?? {
          title: '',
          description: '',
          submissionRequirements: '',
          prizes: '',
        };
        const isDefault = locale === values.defaultLocale;
        const filled = TEXT_FIELDS.some((field) => text[field].trim() !== '');
        const errorOf = (field: TextField) => errors[`translations.${locale}.${field}`];
        return (
          <fieldset key={locale} disabled={disabled} className="flex min-w-0 flex-col gap-4">
            <legend className="mb-2 flex flex-wrap items-center gap-2 text-base font-semibold text-ink">
              {t('challenges.form.languageLegend', { language: tCommon(`locale.names.${locale}`) })}
              {isDefault ? (
                <Chip tone="brand" size="sm">
                  {t('challenges.form.defaultBadge')}
                </Chip>
              ) : filled ? (
                <Chip tone="success" size="sm">
                  {t('challenges.form.translated')}
                </Chip>
              ) : (
                <Chip tone="neutral" size="sm">
                  {t('challenges.form.notTranslated')}
                </Chip>
              )}
            </legend>
            <FormField
              id={`challenge-${locale}-title`}
              label={t('challenges.form.title')}
              error={errorOf('title')}
              required={isDefault}
            >
              <Input
                name={`title-${locale}`}
                lang={locale}
                value={text.title}
                maxLength={CONTENT_LIMITS.titleChars}
                autoComplete="off"
                onChange={(event) => setText(locale, 'title', event.target.value)}
              />
            </FormField>
            <FormField
              id={`challenge-${locale}-description`}
              label={t('challenges.form.description')}
              error={errorOf('description')}
              required={isDefault}
            >
              <Textarea
                name={`description-${locale}`}
                lang={locale}
                rows={6}
                value={text.description}
                maxLength={CONTENT_LIMITS.descriptionChars}
                onChange={(event) => setText(locale, 'description', event.target.value)}
              />
            </FormField>
            <FormField
              id={`challenge-${locale}-submissionRequirements`}
              label={t('challenges.form.submissionRequirements')}
              error={errorOf('submissionRequirements')}
              required={isDefault}
            >
              <Textarea
                name={`submissionRequirements-${locale}`}
                lang={locale}
                rows={4}
                value={text.submissionRequirements}
                maxLength={CONTENT_LIMITS.descriptionChars}
                onChange={(event) => setText(locale, 'submissionRequirements', event.target.value)}
              />
            </FormField>
            <FormField
              id={`challenge-${locale}-prizes`}
              label={t('challenges.form.prizes')}
              hint={t('challenges.form.prizesHint')}
              error={errorOf('prizes')}
              optional
            >
              <Textarea
                name={`prizes-${locale}`}
                lang={locale}
                rows={3}
                value={text.prizes}
                maxLength={CONTENT_LIMITS.prizesChars}
                onChange={(event) => setText(locale, 'prizes', event.target.value)}
              />
            </FormField>
          </fieldset>
        );
      })}
    </div>
  );
}
