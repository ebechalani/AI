'use client';

import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { HARDWARE_CAPABILITIES, type HardwareCapability } from '@/types/hardware';
import type { PlatformOption } from './rows';

export interface HardwareFieldsProps {
  platforms: readonly PlatformOption[];
  platformIds: string[];
  capabilities: HardwareCapability[];
  onPlatformsChange(ids: string[]): void;
  onCapabilitiesChange(capabilities: HardwareCapability[]): void;
  platformsError?: string;
  capabilitiesError?: string;
  disabled: boolean;
}

function toggle<T>(list: T[], value: T, on: boolean): T[] {
  return on ? (list.includes(value) ? list : [...list, value]) : list.filter((item) => item !== value);
}

/** The robotics platforms a course uses and the capabilities it needs (6.2.4). */
export function HardwareFields({
  platforms,
  platformIds,
  capabilities,
  onPlatformsChange,
  onCapabilitiesChange,
  platformsError,
  capabilitiesError,
  disabled,
}: HardwareFieldsProps) {
  const t = useTranslations('courseEditor');
  const locale = useLocale();
  const platformsErrorId = useId();
  const capabilitiesErrorId = useId();
  // Active platforms, plus any retired one the course still names.
  const shown = platforms.filter((platform) => platform.isActive || platformIds.includes(platform.id));

  return (
    <>
      {shown.length > 0 && (
        <fieldset
          tabIndex={-1}
          className="min-w-0 rounded-control"
          aria-invalid={platformsError ? true : undefined}
          aria-describedby={platformsError ? platformsErrorId : undefined}
        >
          <legend className="sr-only">{t('details.hardwareLegend')}</legend>
          {platformsError && (
            <p id={platformsErrorId} className="mb-2 text-sm font-medium text-danger">
              {platformsError}
            </p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {shown.map((platform) => {
              const name = pickTranslation(platform.translations, locale, platform.defaultLocale).name;
              return (
                <Checkbox
                  key={platform.id}
                  label={platform.isActive ? name : t('fields.platformRetired', { platform: name })}
                  checked={platformIds.includes(platform.id)}
                  disabled={disabled}
                  onChange={(event) =>
                    onPlatformsChange(toggle(platformIds, platform.id, event.target.checked))
                  }
                />
              );
            })}
          </div>
        </fieldset>
      )}
      <fieldset
        tabIndex={-1}
        className="min-w-0 rounded-control"
        aria-invalid={capabilitiesError ? true : undefined}
        aria-describedby={capabilitiesError ? capabilitiesErrorId : undefined}
      >
        <legend className="mb-2 text-sm font-semibold text-ink">{t('fields.capabilities')}</legend>
        {capabilitiesError && (
          <p id={capabilitiesErrorId} className="mb-2 text-sm font-medium text-danger">
            {capabilitiesError}
          </p>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          {HARDWARE_CAPABILITIES.map((capability) => (
            <Checkbox
              key={capability}
              label={t(`details.capabilities.${capability}`)}
              checked={capabilities.includes(capability)}
              disabled={disabled}
              onChange={(event) =>
                onCapabilitiesChange(toggle(capabilities, capability, event.target.checked))
              }
            />
          ))}
        </div>
      </fieldset>
    </>
  );
}
