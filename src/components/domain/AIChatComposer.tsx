'use client';

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { SendHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Alert, IconButton } from '@/components/ui';
import { CONTROL_CLASSES } from '@/components/ui/control';
import { AI_LIMITS } from '@/lib/limits';
import { cn } from '@/lib/utils';

export interface ChatDraft {
  text: string;
  /** A new value puts `text` into the input, even when the text is the same as last time. */
  nonce: number;
}

export interface AIChatComposerProps {
  pending: boolean;
  disabledReason?: string | null;
  remainingToday?: number | null;
  draft?: ChatDraft | null;
  onSend: (text: string) => void;
}

export function AIChatComposer({
  pending,
  disabledReason,
  remainingToday,
  draft,
  onSend,
}: AIChatComposerProps) {
  const t = useTranslations('domain');
  const inputId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const [appliedNonce, setAppliedNonce] = useState<number | null>(null);
  const disabled = Boolean(disabledReason);
  const canSend = !disabled && !pending && text.trim() !== '';

  // A new draft replaces what is in the input (state adjusted while rendering, not in an effect).
  if (draft && draft.nonce !== appliedNonce) {
    setAppliedNonce(draft.nonce);
    setText(draft.text.slice(0, AI_LIMITS.tutorRequest.userMessageChars));
  }

  // A frame later: on a narrow screen the slide-over that opens with the same request first
  // moves focus to its close button and remembers where focus came from.
  useEffect(() => {
    if (appliedNonce === null) return;
    const frame = requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
    return () => cancelAnimationFrame(frame);
  }, [appliedNonce]);

  function send() {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    send();
  }

  // Enter sends, Shift+Enter breaks the line; Enter that confirms an IME composition does neither.
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    send();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 border-t border-border px-4 py-3">
      {disabledReason && (
        <Alert tone="warning" live="polite">
          {disabledReason}
        </Alert>
      )}
      <div className="flex items-end gap-2">
        <label htmlFor={inputId} className="sr-only">
          {t('chat.inputLabel')}
        </label>
        <textarea
          ref={inputRef}
          id={inputId}
          rows={2}
          value={text}
          maxLength={AI_LIMITS.tutorRequest.userMessageChars}
          placeholder={t('chat.placeholder')}
          disabled={disabled}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
          // Grows with its content where the browser supports it; two rows elsewhere.
          className={cn(
            CONTROL_CLASSES,
            'field-sizing-content max-h-40 resize-none py-2.5 leading-snug',
          )}
        />
        <IconButton
          type="submit"
          variant="primary"
          aria-label={t('chat.send')}
          disabled={!canSend}
          loading={pending}
        >
          <SendHorizontal className="rtl:-scale-x-100" />
        </IconButton>
      </div>
      <div className="flex flex-col gap-0.5 text-xs text-ink-muted">
        {remainingToday != null && (
          <p className="font-medium">{t('chat.remainingToday', { count: remainingToday })}</p>
        )}
        <p>{t('chat.disclaimer')}</p>
      </div>
    </form>
  );
}
