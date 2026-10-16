'use client';

import { useRef, useState, useTransition, type RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { runLabToolAction } from '@/actions/ai';
import { useToast } from '@/components/ui';
import type { LabToolId } from '@/lib/ai/lab-tools';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError } from '@/types/actions';
import { useActionErrorMessage, useFieldError } from './errors';
import { keepRecent, labFailureOf, type LabRun } from './lab-model';

export interface LabRunApi {
  /** Newest first, at most KEPT_RUNS; kept for this visit only. */
  runs: LabRun[];
  pending: boolean;
  /** An already translated message for the prompt field. */
  fieldError: string | undefined;
  /** A lasting state for this visit: the day's limit, or the AI switched off. */
  block: 'limit' | 'disabled' | null;
  /** `option` is UI only: the action receives `{ toolId, prompt }`. */
  run(prompt: string, option: string | null): void;
  clearFieldError(): void;
  /** Receives focus after a run, so the new result is announced by its heading. */
  resultsHeadingRef: RefObject<HTMLHeadingElement | null>;
  /** The prompt field: focus goes back there after a problem. */
  promptRef: RefObject<HTMLTextAreaElement | null>;
}

/** Moves focus without leaving the element under the sticky bars (AppShell's scroll padding). */
function focusInView(element: HTMLElement | null, block: ScrollLogicalPosition = 'nearest'): void {
  if (element === null) return;
  element.focus({ preventScroll: true });
  element.scrollIntoView({ block, inline: 'nearest' });
}

/** Keyboard focus fell to the page (the loading button was natively disabled). */
function focusWasLost(): boolean {
  const active = document.activeElement;
  return active === null || active === document.body || !active.isConnected;
}

/**
 * One AI Lab tool's runs (ARCHITECTURE.md 8.5, SPEC-I 4.4): calls runLabToolAction, keeps the
 * last results of the visit, and shows a failure where it belongs (4.6).
 */
export function useLabRun(toolId: LabToolId): LabRunApi {
  const t = useTranslations('aiLab');
  const tErrors = useTranslations('errors');
  const tValidation = useTranslations('validation');
  const router = useRouter();
  const { toast } = useToast();
  const messageOf = useActionErrorMessage();
  const fieldErrorOf = useFieldError();
  const [pending, startTransition] = useTransition();
  const [runs, setRuns] = useState<LabRun[]>([]);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [block, setBlock] = useState<'limit' | 'disabled' | null>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const seqRef = useRef(0);

  function fail(error: ActionError) {
    const failure = labFailureOf(error);
    if (failure.kind === 'field') {
      setFieldError(fieldErrorOf(error.fieldErrors, 'prompt'));
      requestAnimationFrame(() => focusInView(promptRef.current));
      return;
    }
    if (failure.kind === 'limit' || failure.kind === 'disabled') {
      setBlock(failure.kind);
    } else {
      const offline = typeof navigator !== 'undefined' && !navigator.onLine;
      const title =
        error.code === 'internal'
          ? offline
            ? tErrors('offline')
            : t('unavailable')
          : messageOf(error);
      toast({ tone: 'danger', title });
    }
    // The loading button dropped keyboard focus to the page: resume in the prompt.
    requestAnimationFrame(() => {
      if (focusWasLost()) focusInView(promptRef.current);
    });
  }

  function run(prompt: string, option: string | null) {
    if (pending || block !== null) return;
    if (prompt.trim() === '') {
      setFieldError(tValidation('required'));
      focusInView(promptRef.current);
      return;
    }
    setFieldError(undefined);
    startTransition(async () => {
      let result: Awaited<ReturnType<typeof runLabToolAction>>;
      try {
        result = await runLabToolAction({ toolId, prompt });
      } catch {
        result = { ok: false, error: { code: 'internal' } };
      }
      if (!result.ok) {
        fail(result.error);
        return;
      }
      seqRef.current += 1;
      const entry: LabRun = { id: seqRef.current, prompt: prompt.trim(), option, result: result.data };
      setRuns((current) => keepRecent(current, entry));
      router.refresh();
      // `start`: the new result shows under its heading, not below the fold.
      requestAnimationFrame(() => focusInView(resultsHeadingRef.current, 'start'));
    });
  }

  return {
    runs,
    pending,
    fieldError,
    block,
    run,
    clearFieldError: () => setFieldError(undefined),
    resultsHeadingRef,
    promptRef,
  };
}
