'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { ChatMessage, TutorMode } from '@/types/ai';
import { AIChatComposer, type ChatDraft } from './AIChatComposer';
import { AIChatMessages } from './AIChatMessages';

export type { ChatDraft };

export interface AIChatPanelProps {
  messages: ChatMessage[];
  mode: TutorMode;
  /** The modes offered, in display order. */
  modes: TutorMode[];
  /** The reply being received, shown after `messages`; null when none is. */
  streamingText: string | null;
  /** A request is in flight: sending is blocked and "thinking" shows until text arrives. */
  pending: boolean;
  /** Already translated; when set, the input is disabled and this is shown above it. */
  disabledReason?: string | null;
  remainingToday?: number | null;
  /** Puts text into the input for the user to edit and send (a lesson's starter prompt). */
  draft?: ChatDraft | null;
  onModeChange: (mode: TutorMode) => void;
  onSend: (text: string) => void;
  className?: string;
}

/**
 * The tutor conversation: mode choice, messages, input. Presentational: the container owns
 * the messages and talks to the server. It fills the height of its parent, which must have one.
 */
export function AIChatPanel({
  messages,
  mode,
  modes,
  streamingText,
  pending,
  disabledReason,
  remainingToday,
  draft,
  onModeChange,
  onSend,
  className,
}: AIChatPanelProps) {
  const t = useTranslations('domain');
  const groupName = useId();

  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-surface', className)}>
      <fieldset className="border-b border-border px-4 py-3">
        <legend className="float-start mb-2 w-full text-xs font-semibold text-ink-muted">
          {t('chat.modeLabel')}
        </legend>
        <div className="clear-both flex flex-wrap gap-1.5">
          {modes.map((option) => (
            <label key={option} className="cursor-pointer">
              <input
                type="radio"
                name={groupName}
                value={option}
                checked={option === mode}
                onChange={() => onModeChange(option)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  'inline-flex min-h-8 items-center rounded-full border border-border bg-surface px-2.5 text-xs font-semibold text-ink transition-colors',
                  'hover:border-brand-300 hover:bg-brand-50',
                  'peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white',
                  'peer-checked:hover:border-brand-700 peer-checked:hover:bg-brand-700',
                  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-600',
                )}
              >
                {t(`tutorModes.${option}`)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <AIChatMessages messages={messages} streamingText={streamingText} pending={pending} />

      <AIChatComposer
        pending={pending}
        disabledReason={disabledReason}
        remainingToday={remainingToday}
        draft={draft}
        onSend={onSend}
      />
    </div>
  );
}
