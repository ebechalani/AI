'use client';

import { useTranslations } from 'next-intl';
import { RadioGroup } from '@/components/ui';
import { LOCALE_LABELS } from '@/lib/i18n/config';
import type { Locale } from '@/types/common';
import { EDITABLE_LOCALES, isEditableLocale, type TranslationState } from './translations';

export interface LanguageSwitchProps {
  value: Locale;
  onChange(locale: Locale): void;
  defaultLocale: Locale;
  states: Record<Locale, TranslationState>;
  /** The radio group's name, unique on the page. */
  name: string;
  disabled?: boolean;
}

/** Which language's fields are shown; the draft holds every language, switching changes none. */
export function LanguageSwitch({ value, onChange, states, name, disabled }: LanguageSwitchProps) {
  const t = useTranslations('courseEditor');
  return (
    <RadioGroup
      legend={t('language.legend')}
      name={name}
      orientation="horizontal"
      variant="card"
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (isEditableLocale(next)) onChange(next);
      }}
      options={EDITABLE_LOCALES.map((locale) => ({
        value: locale,
        label: <span lang={locale}>{LOCALE_LABELS[locale]}</span>,
        description: t(`language.state.${states[locale]}`),
      }))}
    />
  );
}
