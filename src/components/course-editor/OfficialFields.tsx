'use client';

import { useTranslations } from 'next-intl';
import { RadioGroup } from '@/components/ui';
import { CONTENT_LIMITS } from '@/lib/limits';
import { ACCESS_TIERS, type AccessTier, type Course } from '@/types/content';
import type { CourseDraft } from './course-model';
import { NumberField } from './NumberField';
import { PathwaySelect } from './PathwaySelect';
import type { PathwayOption } from './rows';

export interface OfficialFieldsProps {
  draft: CourseDraft;
  set(patch: Partial<CourseDraft>): void;
  course: Course;
  pathways: readonly PathwayOption[];
  errorFor(path: string): string | undefined;
  disabled: boolean;
  formId: string;
}

/** An official course's pathway, position and access tier (admin only, 6.2.4). */
export function OfficialFields({
  draft,
  set,
  course,
  pathways,
  errorFor,
  disabled,
  formId,
}: OfficialFieldsProps) {
  const t = useTranslations('courseEditor');
  const published = course.status === 'published';
  return (
    <>
      <PathwaySelect
        value={draft.pathwayId}
        onChange={(pathwayId) => set({ pathwayId })}
        audience={draft.audience}
        pathways={pathways}
        error={errorFor('pathwayId')}
        hint={published ? t('fields.pathwayLocked') : undefined}
        disabled={disabled || published}
      />
      <NumberField
        label={t('fields.order')}
        value={draft.order}
        onChange={(order) => set({ order })}
        min={0}
        max={CONTENT_LIMITS.courseOrderMax}
        required
        hint={t('fields.orderHint', { max: CONTENT_LIMITS.courseOrderMax })}
        error={errorFor('order')}
        disabled={disabled}
      />
      <RadioGroup
        legend={t('fields.accessTier')}
        name={`${formId}-tier`}
        value={draft.accessTier}
        onValueChange={(value) => set({ accessTier: value as AccessTier })}
        error={errorFor('accessTier')}
        disabled={disabled}
        options={ACCESS_TIERS.map((tier) => ({
          value: tier,
          label: t(`fields.accessTierOptions.${tier}`),
          description: t(`fields.accessTierOptions.${tier}Description`),
        }))}
      />
    </>
  );
}
