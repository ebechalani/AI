'use client';

import { useId } from 'react';
import { CircleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/ui';
import { AVATAR_IDS } from '@/lib/avatars';

export interface AvatarPickerProps {
  value: string;
  onChange: (avatarId: string) => void;
  /** An already translated message. */
  error?: string;
}

/**
 * The twelve avatars as native radios drawn as tiles: one tab stop, the arrow keys move the
 * choice, and the checked tile carries the focus ring.
 */
export function AvatarPicker({ value, onChange, error }: AvatarPickerProps) {
  const t = useTranslations('settings');
  const name = useId();
  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;

  return (
    <fieldset
      aria-describedby={error ? `${hintId} ${errorId}` : hintId}
      aria-invalid={error ? true : undefined}
      className="min-w-0"
    >
      <legend className="text-sm font-semibold text-ink">{t('profile.avatar.legend')}</legend>
      <p id={hintId} className="mt-1 text-sm text-ink-muted">
        {t('profile.avatar.hint')}
      </p>
      {error && (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-danger">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
        {AVATAR_IDS.map((id) => (
          <label
            key={id}
            className="group relative flex min-w-0 cursor-pointer flex-col items-center gap-1 rounded-control border border-border p-2 text-center transition-colors hover:border-brand-300 has-[:checked]:border-2 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600"
          >
            <input
              type="radio"
              name={name}
              value={id}
              checked={value === id}
              onChange={() => onChange(id)}
              className="sr-only"
            />
            <Avatar avatarId={id} size="md" className="sm:size-14" />
            <span className="text-xs break-words text-ink">{t(`avatars.${id}`)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
