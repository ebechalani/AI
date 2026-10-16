'use client';

import { useTranslations } from 'next-intl';
import { RadioGroup } from '@/components/ui';
import type { SubmissionType } from '@/types/common';
import { revealChoiceCard } from './focus';

export interface SubmissionTypeFieldProps {
  allowedTypes: readonly SubmissionType[];
  value: SubmissionType;
  onChange: (type: SubmissionType) => void;
  error?: string;
  /** Wraps the group: the form focuses its first radio after a type error. */
  containerId: string;
}

/** The kind of work: a plain line when only one is allowed, else one card per allowed type. */
export function SubmissionTypeField({
  allowedTypes,
  value,
  onChange,
  error,
  containerId,
}: SubmissionTypeFieldProps) {
  const t = useTranslations('projects');
  const tDomain = useTranslations('domain');

  if (allowedTypes.length === 1) {
    return (
      <div id={containerId} className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-ink">
          {t('form.type.single', { type: tDomain(`submissionTypes.${value}`) })}
        </p>
        <p className="text-sm text-ink-muted">{t(`form.type.hints.${value}`)}</p>
        {error && <p className="text-sm font-medium text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <div id={containerId} onFocus={revealChoiceCard}>
      <RadioGroup
        name="type"
        variant="card"
        legend={t('form.type.legend')}
        value={value}
        onValueChange={(next) => {
          const type = allowedTypes.find((allowed) => allowed === next);
          if (type !== undefined) onChange(type);
        }}
        error={error}
        options={allowedTypes.map((type) => ({
          value: type,
          label: tDomain(`submissionTypes.${type}`),
          description: t(`form.type.hints.${type}`),
        }))}
        className="sm:[&>div]:grid sm:[&>div]:grid-cols-2"
      />
    </div>
  );
}
