'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { ChatDraft } from '@/components/domain';
import type { TutorOpenRequest } from '@/components/layout';
import { useToast } from '@/components/ui';
import type { TutorMode, TutorTurn } from '@/types/ai';
import {
  abandonTurn,
  appendReplyText,
  blockFor,
  buildHistory,
  failureOf,
  finishTurn,
  initialTutorState,
  readTutorEvents,
  replaceReply,
  resetThread,
  setBlock,
  startTurn,
  toReplaceKey,
  TUTOR_ENDPOINT,
  type TutorChatState,
  type TutorReplaceKey,
} from './tutor-model';

export interface TutorChat {
  state: TutorChatState;
  /** For AIChatPanel's `draft` prop. */
  draft: ChatDraft | null;
  /** For the toolbar's role="status"; '' when there is nothing to announce. */
  announcement: string;
  send(text: string): void;
  setMode(mode: TutorMode): void;
  /** A new conversation; focuses the composer and announces it. */
  reset(): void;
  offerDraft(text: string): void;
}

/**
 * Keyboard focus fell, or is about to fall, to the page: the input it was in has just been
 * disabled (the browser moves focus off a disabled element only at its next rendering update).
 */
function focusWasLost(): boolean {
  const active = document.activeElement;
  return (
    active === null ||
    active === document.body ||
    !active.isConnected ||
    active.matches(':disabled')
  );
}

/**
 * The tutor conversation of one panel (ARCHITECTURE.md 7.4, 8.3): sends the thread to
 * POST /api/ai/tutor, reads the NDJSON reply, and keeps the limits the route reports. Requests
 * start in event handlers only; effects only clean up (timers, the request in flight) and keep
 * keyboard focus in the panel when a block disables the input.
 */
export function useTutorChat(options: {
  courseId: string | null;
  lessonId: string | null;
  defaultMode: TutorMode;
  /** useTutorBridge().request, applied once per nonce. */
  request: TutorOpenRequest | null;
  /** The panel's root (tabIndex -1): holds keyboard focus while a block disables the input. */
  panelRef: RefObject<HTMLDivElement | null>;
}): TutorChat {
  const { courseId, lessonId, request, panelRef } = options;
  const t = useTranslations('tutor');
  const tDomain = useTranslations('domain');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const { toast } = useToast();
  const [state, setState] = useState(() => initialTutorState(options.defaultMode));
  const [draft, setDraft] = useState<ChatDraft | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [appliedNonce, setAppliedNonce] = useState<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A bridge request switches the mode and puts its starter prompt in the composer, never
  // sending it (state adjusted while rendering, as AIChatComposer does with its draft).
  if (request !== null && request.nonce !== appliedNonce) {
    setAppliedNonce(request.nonce);
    setState((current) => ({ ...current, mode: request.mode }));
    const starter = request.starterPrompt;
    if (starter !== null) {
      setDraft((current) => ({ text: starter, nonce: (current?.nonce ?? 0) + 1 }));
    } else {
      setAnnouncement(t('modeChanged', { mode: tDomain(`tutorModes.${request.mode}`) }));
    }
  }

  useEffect(
    () => () => {
      controllerRef.current?.abort();
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );

  // A block disables the input. When focus was in it, the panel takes it once the block is
  // rendered, so the next Tab stays in the tutor; the composer's Alert says why.
  const blockKind = state.block?.kind ?? null;
  useEffect(() => {
    if (blockKind === null) return;
    const frame = requestAnimationFrame(() => {
      if (focusWasLost()) panelRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [blockKind, panelRef]);

  function offerDraft(text: string) {
    setDraft((current) => ({ text, nonce: (current?.nonce ?? 0) + 1 }));
  }

  /** `text`: the question taken back, which goes back into the input when the wait is over. */
  function startCooldown(seconds: number, text: string) {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      // Focus still on the panel (or lost): a new draft refocuses the input once it is enabled.
      const resume = focusWasLost() || document.activeElement === panelRef.current;
      setState((current) =>
        current.block?.kind === 'cooldown' ? setBlock(current, null) : current,
      );
      if (resume) offerDraft(text);
    }, seconds * 1000);
  }

  /** The request failed before any reply: the question goes back into the composer. */
  function takeBack(text: string) {
    setState((current) => abandonTurn(current).state);
    offerDraft(text);
  }

  async function exchange(text: string, messages: TutorTurn[], controller: AbortController) {
    let response: Response;
    try {
      response = await fetch(TUTOR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: state.mode, courseId, lessonId, locale, messages }),
        signal: controller.signal,
        cache: 'no-store',
      });
    } catch {
      if (controller.signal.aborted) return;
      takeBack(text);
      toast({ tone: 'danger', title: navigator.onLine ? t('sendFailed') : tErrors('offline') });
      return;
    }

    if (!response.ok || response.body === null) {
      const failure = failureOf(response.status, await response.json().catch(() => null));
      if (controller.signal.aborted) return;
      takeBack(text);
      const block = blockFor(failure);
      if (block === null) {
        toast({ tone: 'danger', title: t('sendFailed') });
        return;
      }
      setState((current) => setBlock(current, block));
      if (block.kind === 'cooldown') startCooldown(block.seconds, text);
      return;
    }

    // Local copies of what the stream said: React state is not readable inside this loop.
    let shown = '';
    let replaced: TutorReplaceKey | null = null;
    const note = `\n\n*${t('cutShort')}*`;
    try {
      for await (const event of readTutorEvents(response.body)) {
        if (event.type === 'text') {
          if (replaced !== null) continue;
          shown += event.text;
          setState((current) => appendReplyText(current, event.text));
        } else if (event.type === 'replace') {
          const key = toReplaceKey(event.messageKey);
          replaced = key;
          shown = '';
          setState((current) => replaceReply(current, key));
        } else {
          const content =
            replaced !== null
              ? t(replaced)
              : shown.trim() === ''
                ? t('unavailable')
                : event.cutShort
                  ? shown + note
                  : shown;
          setState((current) =>
            finishTurn(current, { content, remainingToday: event.remainingToday }),
          );
          return;
        }
      }
    } catch {
      if (controller.signal.aborted) return;
    }
    if (controller.signal.aborted) return;
    // The stream ended without `done`: the server counted the message, so nothing is put back.
    const content =
      replaced !== null ? t(replaced) : shown.trim() === '' ? t('unavailable') : shown + note;
    setState((current) => finishTurn(current, { content, remainingToday: null }));
  }

  function send(text: string) {
    const question = text.trim();
    if (question === '' || state.reply !== null || state.block !== null) return;
    if (controllerRef.current !== null) return;
    const messages = buildHistory(state, question);
    setState((current) => startTurn(current, question));
    setAnnouncement('');
    const controller = new AbortController();
    controllerRef.current = controller;
    void exchange(question, messages, controller).finally(() => {
      if (controllerRef.current === controller) controllerRef.current = null;
    });
  }

  function reset() {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState(resetThread);
    offerDraft('');
    setAnnouncement(t('newChatStarted'));
  }

  return {
    state,
    draft,
    announcement,
    send,
    setMode: (mode) => setState((current) => ({ ...current, mode })),
    reset,
    offerDraft,
  };
}
