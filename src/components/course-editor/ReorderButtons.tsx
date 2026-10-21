'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { IconButton } from '@/components/ui';

export interface ReorderButtonsProps {
  /** The item's name in the labels ("Move “{name}” up"). */
  name: string;
  index: number;
  count: number;
  onMove(delta: -1 | 1): void;
  disabled?: boolean;
  /** The buttons' ids are `${idPrefix}-up` and `${idPrefix}-down` (the list refocuses them). */
  idPrefix: string;
}

/** The keyboard way to reorder: the one at an edge is disabled. */
export function ReorderButtons({ name, index, count, onMove, disabled, idPrefix }: ReorderButtonsProps) {
  const t = useTranslations('courseEditor');
  return (
    <span className="inline-flex shrink-0 items-center">
      <IconButton
        id={`${idPrefix}-up`}
        aria-label={t('reorder.up', { name })}
        disabled={disabled || index === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUp />
      </IconButton>
      <IconButton
        id={`${idPrefix}-down`}
        aria-label={t('reorder.down', { name })}
        disabled={disabled || index >= count - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDown />
      </IconButton>
    </span>
  );
}

/** Which button keeps the focus after a move: the same one, or the other at an edge. */
export function focusAfterMove(idPrefix: string, delta: -1 | 1, newIndex: number, count: number): string {
  if (delta === -1) return newIndex === 0 ? `${idPrefix}-down` : `${idPrefix}-up`;
  return newIndex >= count - 1 ? `${idPrefix}-up` : `${idPrefix}-down`;
}
