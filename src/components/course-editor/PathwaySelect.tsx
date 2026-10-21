'use client';

import { useLocale, useTranslations } from 'next-intl';
import { FormField, Select } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import type { Audience } from '@/types/common';
import type { PathwayOption } from './rows';

export interface PathwaySelectProps {
  value: string;
  onChange(pathwayId: string): void;
  /** Only the pathways that serve this audience are offered (Q13). */
  audience: Audience;
  pathways: readonly PathwayOption[];
  error?: string;
  hint?: string;
  disabled?: boolean;
  id?: string;
}

export function pathwayLabel(pathway: PathwayOption, locale: string): string {
  return pickTranslation(pathway.translations, locale, pathway.defaultLocale).title;
}

/** An official course's pathway: none, or one of those serving its audience. */
export function PathwaySelect({
  value,
  onChange,
  audience,
  pathways,
  error,
  hint,
  disabled,
  id,
}: PathwaySelectProps) {
  const t = useTranslations('courseEditor');
  const locale = useLocale();
  const fitting = pathways.filter((pathway) => pathway.audience === audience);
  return (
    <FormField id={id} label={t('fields.pathway')} error={error} hint={hint}>
      <Select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        options={[
          { value: '', label: t('fields.noPathway') },
          ...fitting.map((pathway) => {
            const title = pathwayLabel(pathway, locale);
            return {
              value: pathway.id,
              label: pathway.status === 'draft' ? t('fields.pathwayDraft', { pathway: title }) : title,
            };
          }),
        ]}
      />
    </FormField>
  );
}
