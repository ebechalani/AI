'use client';

import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui';
import { HARDWARE_CAPABILITIES, type HardwareCapability } from '@/types/hardware';
import {
  SECTION_LEGEND,
  toggleItem,
  type ChallengeFieldsProps,
  type PlatformChoice,
} from './challenge-fields';
import { CheckboxFieldset } from './CheckboxFieldset';

export interface ChallengeHardwareFieldsProps extends ChallengeFieldsProps {
  platforms: PlatformChoice[];
}

/** The capabilities a kit needs and the kits recommended for the challenge (both optional). */
export function ChallengeHardwareFields({
  values,
  onChange,
  errors,
  disabled,
  platforms,
}: ChallengeHardwareFieldsProps) {
  const t = useTranslations('admin');

  return (
    <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-5">
      <legend className={SECTION_LEGEND}>{t('challenges.form.hardwareLegend')}</legend>
      <CheckboxFieldset
        legend={t('challenges.form.capabilities')}
        hint={t('challenges.form.capabilitiesHint')}
        error={errors.requiredCapabilities}
        gridClassName="grid grid-cols-2 sm:grid-cols-3"
      >
        {HARDWARE_CAPABILITIES.map((capability, index) => (
          <Checkbox
            key={capability}
            name="requiredCapabilities"
            value={capability}
            label={t(`challenges.form.capabilityNames.${capability}`)}
            checked={values.requiredCapabilities.includes(capability)}
            invalid={index === 0 && errors.requiredCapabilities !== undefined}
            onChange={(event) =>
              onChange({
                ...values,
                requiredCapabilities: toggleItem<HardwareCapability>(
                  values.requiredCapabilities,
                  capability,
                  event.target.checked,
                ),
              })
            }
          />
        ))}
      </CheckboxFieldset>
      {platforms.length > 0 && (
        <CheckboxFieldset
          legend={t('challenges.form.platforms')}
          error={errors.hardwarePlatformIds}
          gridClassName="grid sm:grid-cols-2"
        >
          {platforms.map((platform, index) => (
            <Checkbox
              key={platform.id}
              name="hardwarePlatformIds"
              value={platform.id}
              label={platform.name}
              description={platform.vendor ?? undefined}
              checked={values.hardwarePlatformIds.includes(platform.id)}
              invalid={index === 0 && errors.hardwarePlatformIds !== undefined}
              onChange={(event) =>
                onChange({
                  ...values,
                  hardwarePlatformIds: toggleItem(
                    values.hardwarePlatformIds,
                    platform.id,
                    event.target.checked,
                  ),
                })
              }
            />
          ))}
        </CheckboxFieldset>
      )}
    </fieldset>
  );
}
