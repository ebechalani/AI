'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { RadioGroup } from '@/components/ui';
import type { AgeBand } from '@/types/common';

export interface AgeBandFieldProps {
  legend: string;
  /** The bands the form may offer; the server applies the same rule (section 1.5). */
  bands: readonly AgeBand[];
  value: AgeBand | '';
  onChange: (value: AgeBand) => void;
  hint?: ReactNode;
  error?: string;
}

/** One card per age band, labelled from the shared vocabulary (`domain.ageBands`). */
export function AgeBandField({ legend, bands, value, onChange, hint, error }: AgeBandFieldProps) {
  const t = useTranslations('domain');
  return (
    <RadioGroup
      legend={legend}
      name="ageBand"
      orientation="horizontal"
      variant="card"
      required
      options={bands.map((band) => ({ value: band, label: t(`ageBands.${band}`) }))}
      value={value}
      onValueChange={(next) => onChange(next as AgeBand)}
      hint={hint}
      error={error}
    />
  );
}
