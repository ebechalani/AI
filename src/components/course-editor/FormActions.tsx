'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';

export interface FormActionsProps {
  /** The submit button's form, when the row sits outside the form element. */
  form?: string;
  saveLabel: string;
  pending: boolean;
  /** Discard (disabled while clean), or a plain Cancel when `cancelLabel` is given. */
  onDiscard?: () => void;
  discardLabel?: string;
  discardDisabled?: boolean;
}

/** Save and discard, at the end of a form (sticky nowhere). */
export function FormActions({
  form,
  saveLabel,
  pending,
  onDiscard,
  discardLabel,
  discardDisabled,
}: FormActionsProps) {
  const t = useTranslations('courseEditor');
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="submit" form={form} loading={pending}>
        {saveLabel}
      </Button>
      {onDiscard && (
        <Button variant="secondary" onClick={onDiscard} disabled={discardDisabled || pending}>
          {discardLabel ?? t('details.discard')}
        </Button>
      )}
    </div>
  );
}
