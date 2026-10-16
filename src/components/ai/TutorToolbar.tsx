'use client';

import { RotateCcw, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, Chip, IconButton, Tooltip } from '@/components/ui';

export interface TutorToolbarProps {
  variant: 'panel' | 'page';
  canReset: boolean;
  onReset: () => void;
  showPrivacyTip: boolean;
  /** Read out by the role="status" region; '' when there is nothing to say. */
  announcement: string;
}

/** Above the conversation: the AI label (8.6), "New conversation" and the privacy tip. */
export function TutorToolbar({
  variant,
  canReset,
  onReset,
  showPrivacyTip,
  announcement,
}: TutorToolbarProps) {
  const t = useTranslations('tutor');
  return (
    <div className="flex shrink-0 flex-col gap-1.5 border-b border-border px-4 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Chip tone="brand" size="sm" icon={<Sparkles aria-hidden="true" />}>
          {t('aiLabel')}
        </Chip>
        {variant === 'page' ? (
          <Button variant="ghost" size="sm" onClick={onReset} disabled={!canReset}>
            <RotateCcw aria-hidden="true" />
            {t('newChat')}
          </Button>
        ) : (
          // The pane is narrow: an icon with a tooltip.
          <Tooltip content={t('newChat')} align="end">
            <IconButton aria-label={t('newChat')} size="sm" onClick={onReset} disabled={!canReset}>
              <RotateCcw />
            </IconButton>
          </Tooltip>
        )}
      </div>
      {showPrivacyTip && <p className="text-xs text-ink-muted">{t('privacyTip')}</p>}
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
