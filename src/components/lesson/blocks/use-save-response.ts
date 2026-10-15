import { useState } from 'react';
import { saveBlockResponseAction } from '@/actions/learning';
import { useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError } from '@/types/actions';
import { useActionErrorMessage, useFieldError } from '../use-action-error';

// The save flow shared by the reflection and the code activity (SPEC 2.5): one action, a success
// toast and a refresh (the EARN checklist reads the saved answer), an inline field error for a
// rejected text, a danger toast for anything else.

// After these the page itself has changed (not enrolled any more, signed out): re-read it.
const REFRESH_ON: ReadonlySet<ActionError['code']> = new Set(['not_found', 'unauthenticated']);

export interface SaveResponseTarget {
  courseId: string;
  lessonId: string;
  blockId: string;
  /** The success toast's title, already translated. */
  savedMessage: string;
}

export function useSaveResponse({ courseId, lessonId, blockId, savedMessage }: SaveResponseTarget) {
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const fieldErrorOf = useFieldError();
  const [pending, setPending] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);

  /** Saves `text`; true when it was saved. */
  async function save(text: string): Promise<boolean> {
    if (pending) return false;
    setPending(true);
    setFieldError(undefined);
    let error: ActionError;
    try {
      const result = await saveBlockResponseAction({ courseId, lessonId, blockId, text });
      if (result.ok) {
        toast({ tone: 'success', title: savedMessage });
        router.refresh();
        return true;
      }
      error = result.error;
    } catch {
      error = { code: 'internal' };
    } finally {
      setPending(false);
    }

    const inline =
      error.code === 'validation' ? fieldErrorOf(error.fieldErrors, 'text') : undefined;
    if (inline !== undefined) {
      setFieldError(inline);
      return false;
    }
    toast({ tone: 'danger', title: errorMessage(error) });
    if (REFRESH_ON.has(error.code)) router.refresh();
    return false;
  }

  return { pending, fieldError, save };
}
