'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Bot } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types/ai';
import { RichText } from './RichText';

// How close to the end the reader must be for a growing reply to keep the view pinned there.
const STICK_DISTANCE_PX = 80;

function AssistantBubble({ children, name }: { children: ReactNode; name: string }) {
  return (
    <div className="flex items-start gap-2">
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand-600 to-accent-700 text-white"
      >
        <Bot className="size-4" />
      </span>
      <div className="max-w-[calc(100%-2.25rem)] min-w-0 rounded-2xl rounded-ss-md border border-border bg-surface-muted px-3.5 py-2.5">
        <span className="sr-only">{name}: </span>
        {children}
      </div>
    </div>
  );
}

export interface AIChatMessagesProps {
  messages: ChatMessage[];
  /** The reply being received; null when none is. */
  streamingText: string | null;
  pending: boolean;
}

export function AIChatMessages({ messages, streamingText, pending }: AIChatMessagesProps) {
  const t = useTranslations('domain');
  const scrollRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const assistantName = t('chat.assistantName');
  const isEmpty = messages.length === 0 && streamingText === null && !pending;

  // A new message always scrolls into view.
  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    stick.current = true;
    box.scrollTop = box.scrollHeight;
  }, [messages.length]);

  // A growing reply follows only while the reader has not scrolled up to read earlier text.
  useEffect(() => {
    const box = scrollRef.current;
    if (box && stick.current) box.scrollTop = box.scrollHeight;
  }, [streamingText, pending]);

  return (
    <div
      ref={scrollRef}
      role="group"
      aria-label={t('chat.conversation')}
      // Focusable so the conversation can be scrolled from the keyboard.
      tabIndex={0}
      onScroll={(event) => {
        const box = event.currentTarget;
        stick.current = box.scrollHeight - box.scrollTop - box.clientHeight < STICK_DISTANCE_PX;
      }}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 focus-visible:-outline-offset-2"
    >
      {isEmpty && (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
          <span
            aria-hidden="true"
            className="flex size-12 items-center justify-center rounded-full bg-brand-100 text-brand-600"
          >
            <Bot className="size-6" />
          </span>
          <p className="max-w-xs text-sm text-ink-muted">{t('chat.empty')}</p>
        </div>
      )}

      {/* Finished messages only: a screen reader hears each one once, not every streamed chunk. */}
      <div role="log" aria-live="polite" className="flex flex-col gap-4">
        {messages.map((message) =>
          message.role === 'user' ? (
            <div
              key={message.id}
              className={cn(
                'ms-auto max-w-[85%] rounded-2xl rounded-ee-md bg-brand-600 px-3.5 py-2.5',
                'text-sm leading-relaxed break-words whitespace-pre-wrap text-white',
              )}
            >
              <span className="sr-only">{t('chat.userName')}: </span>
              {message.content}
            </div>
          ) : (
            <AssistantBubble key={message.id} name={assistantName}>
              <RichText markdown={message.content} size="sm" />
            </AssistantBubble>
          ),
        )}
      </div>

      {(pending || streamingText !== null) && (
        <div className={cn(messages.length > 0 && 'mt-4')}>
          {streamingText ? (
            <div aria-hidden="true">
              <AssistantBubble name={assistantName}>
                <RichText markdown={streamingText} size="sm" />
              </AssistantBubble>
            </div>
          ) : (
            <AssistantBubble name={assistantName}>
              <span role="status" className="flex items-center gap-2 text-sm text-ink-muted">
                <span aria-hidden="true" className="flex gap-1">
                  <span className="size-1.5 animate-pulse rounded-full bg-brand-500" />
                  <span className="size-1.5 animate-pulse rounded-full bg-brand-500 [animation-delay:200ms]" />
                  <span className="size-1.5 animate-pulse rounded-full bg-brand-500 [animation-delay:400ms]" />
                </span>
                {t('chat.thinking')}
              </span>
            </AssistantBubble>
          )}
        </div>
      )}
    </div>
  );
}
