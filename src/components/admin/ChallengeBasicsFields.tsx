'use client';

import { useTranslations } from 'next-intl';
import { FormField, Input, RadioGroup, Select } from '@/components/ui';
import { CONTENT_LIMITS } from '@/lib/limits';
import { CHALLENGE_TYPES, type ChallengeScope, type ChallengeType } from '@/types/challenge';
import { LEARNING_AREAS, type LearningArea } from '@/types/common';
import { SECTION_LEGEND, type ChallengeFieldsProps } from './challenge-fields';
import type { SchoolChoice } from './school-model';

export interface ChallengeBasicsFieldsProps extends ChallengeFieldsProps {
  schools: SchoolChoice[];
}

/** Type, learning area, who can take part (and which school), ages and the XP reward. */
export function ChallengeBasicsFields({
  values,
  onChange,
  errors,
  disabled,
  schools,
}: ChallengeBasicsFieldsProps) {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tDomain = useTranslations('domain');

  return (
    <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-4">
      <legend className={SECTION_LEGEND}>{t('challenges.form.basicsLegend')}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="challenge-type" label={t('challenges.form.type')} error={errors.type} required>
          <Select
            name="type"
            value={values.type}
            onChange={(event) => onChange({ ...values, type: event.target.value as ChallengeType })}
            options={CHALLENGE_TYPES.map((type) => ({
              value: type,
              label: tDomain(`challenge.types.${type}`),
            }))}
          />
        </FormField>
        <FormField id="challenge-area" label={t('challenges.form.area')} error={errors.area} required>
          <Select
            name="area"
            value={values.area}
            onChange={(event) => onChange({ ...values, area: event.target.value as LearningArea })}
            options={LEARNING_AREAS.map((area) => ({ value: area, label: tDomain(`areas.${area}`) }))}
          />
        </FormField>
      </div>
      <RadioGroup
        legend={t('challenges.form.scopeLegend')}
        name="scope"
        variant="card"
        value={values.scope}
        onValueChange={(value) => onChange({ ...values, scope: value as ChallengeScope })}
        error={errors.scope}
        options={[
          {
            value: 'global',
            label: t('challenges.form.scopeGlobal'),
            description: t('challenges.form.scopeGlobalDescription'),
          },
          {
            value: 'school',
            label: t('challenges.form.scopeSchool'),
            description: t('challenges.form.scopeSchoolDescription'),
          },
        ]}
      />
      {values.scope === 'school' && (
        <FormField
          id="challenge-schoolId"
          label={t('challenges.form.school')}
          error={errors.schoolId}
          required
        >
          <Select
            name="schoolId"
            value={values.schoolId}
            onChange={(event) => onChange({ ...values, schoolId: event.target.value })}
            placeholder={tCommon('actions.select')}
            options={schools.map((school) => ({
              value: school.id,
              label: school.suspended
                ? t('shared.suspendedSchoolOption', { name: school.name })
                : t('shared.schoolOption', { name: school.name }),
            }))}
          />
        </FormField>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="challenge-ageMin"
          label={t('challenges.form.ageMin')}
          hint={t('challenges.form.agesHint')}
          error={errors.ageMin}
          optional
        >
          <Input
            type="number"
            inputMode="numeric"
            name="ageMin"
            min={CONTENT_LIMITS.ageMin}
            max={CONTENT_LIMITS.ageMax}
            value={values.ageMin}
            onChange={(event) => onChange({ ...values, ageMin: event.target.value })}
            className="w-32"
          />
        </FormField>
        <FormField id="challenge-ageMax" label={t('challenges.form.ageMax')} error={errors.ageMax} optional>
          <Input
            type="number"
            inputMode="numeric"
            name="ageMax"
            min={CONTENT_LIMITS.ageMin}
            max={CONTENT_LIMITS.ageMax}
            value={values.ageMax}
            onChange={(event) => onChange({ ...values, ageMax: event.target.value })}
            className="w-32"
          />
        </FormField>
      </div>
      <FormField
        id="challenge-xpReward"
        label={t('challenges.form.xpReward')}
        hint={t('challenges.form.xpRewardHint', { max: CONTENT_LIMITS.xpRewardMax.challenge })}
        error={errors.xpReward}
        required
      >
        <Input
          type="number"
          inputMode="numeric"
          name="xpReward"
          min={0}
          max={CONTENT_LIMITS.xpRewardMax.challenge}
          value={values.xpReward}
          onChange={(event) => onChange({ ...values, xpReward: event.target.value })}
          className="w-32"
        />
      </FormField>
    </fieldset>
  );
}
