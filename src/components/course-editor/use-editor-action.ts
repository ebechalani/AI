import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError, ActionResult } from '@/types/actions';
import { useEditorEvents } from './editor-events';
import { conflictMessageKey, type ConflictContext } from './errors-model';
import { sessionLost } from './session-probe';
import { stripInputPrefix } from './translations';
import { useActionErrorMessage } from './use-action-error';

// The one place that turns an action's answer into messages, refreshes and field errors (3.1).

/** What `FormAlert` renders. */
export interface FormFailure {
  message: string;
  sessionEnded: boolean;
}

export interface EditorActionOptions {
  /** Which `conflict` message applies; default `{ action: 'other' }`. */
  context?: ConflictContext;
  /** Where a failure goes: a danger toast, or an inline `FormAlert` (dialogs and forms). */
  report: 'toast' | ((failure: FormFailure) => void);
  /** `validation` with field errors, the `input.` / `patch.` prefix already stripped. */
  onFieldErrors?: (fieldErrors: Record<string, string[]>) => void;
  /**
   * `gone` (default): "deleted elsewhere" and a refresh. `mediaGone`: the uploaded file is not
   * media of this course, no refresh. `report`: nothing is shown and nothing refreshed; the
   * caller handles `not_found` itself (a deleted quiz or project being edited, 3.1).
   */
  notFound?: 'gone' | 'mediaGone' | 'report';
}

export interface EditorAction {
  run<T>(
    call: () => Promise<ActionResult<T>>,
    options: EditorActionOptions,
  ): Promise<ActionResult<T>>;
  /** Tells the other tabs, then refreshes this page. */
  refresh(): void;
  /** The refresh transition is running. */
  refreshing: boolean;
}

export function useEditorAction(): EditorAction {
  const t = useTranslations('courseEditor');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const events = useEditorEvents();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const [refreshing, startTransition] = useTransition();

  function refresh() {
    events.saved();
    startTransition(() => router.refresh());
  }

  async function run<T>(
    call: () => Promise<ActionResult<T>>,
    options: EditorActionOptions,
  ): Promise<ActionResult<T>> {
    let result: ActionResult<T>;
    try {
      result = await call();
    } catch {
      // A call that throws may still mean the session ended (session-probe.ts).
      result = {
        ok: false,
        error: { code: (await sessionLost()) ? 'unauthenticated' : 'internal' },
      };
    }
    if (result.ok) return result;

    const error: ActionError = result.error;
    const deliver = (message: string, sessionEnded = false) => {
      if (options.report === 'toast') toast({ tone: 'danger', title: message });
      else options.report({ message, sessionEnded });
    };

    switch (error.code) {
      case 'validation':
        if (error.fieldErrors !== undefined && options.onFieldErrors !== undefined) {
          options.onFieldErrors(stripInputPrefix(error.fieldErrors));
        } else {
          deliver(t('errors.form'));
        }
        break;
      case 'conflict': {
        const conflict = conflictMessageKey(options.context ?? { action: 'other' });
        deliver(t(conflict.key, conflict.values));
        if (conflict.refresh) refresh();
        break;
      }
      case 'not_found': {
        const mode = options.notFound ?? 'gone';
        if (mode === 'report') break;
        deliver(t(mode === 'mediaGone' ? 'errors.mediaGone' : 'errors.gone'));
        if (mode === 'gone') refresh();
        break;
      }
      case 'forbidden':
        deliver(tErrors('forbidden'));
        refresh();
        break;
      case 'unauthenticated':
        // No refresh: it would send the author to the login page and drop every draft.
        deliver(tErrors('unauthenticated'), true);
        break;
      default:
        deliver(errorMessage(error));
    }
    return result;
  }

  return { run, refresh, refreshing };
}
