import { useEffect, useState, type RefObject } from 'react';
import { saveBlockResponseAction } from '@/actions/learning';
import { useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError } from '@/types/actions';
import { focusInView, focusWasLost, hasKeyboardFocus } from '../focus';
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
  /** The answer's field: keyboard focus resumes there when saving took it away. */
  fieldRef: RefObject<HTMLTextAreaElement | null>;
}

export function useSaveResponse({
  courseId,
  lessonId,
  blockId,
  savedMessage,
  fieldRef,
}: SaveResponseTarget) {
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const fieldErrorOf = useFieldError();
  const [pending, setPending] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [refocus, setRefocus] = useState(0);

  // A loading button is natively disabled, and Save stays disabled once the draft is saved, so a
  // save made from the keyboard drops focus to the page (WCAG 2.4.3). It resumes in the field,
  // after the render that settled the button. A touch or mouse save leaves focus alone, so a
  // phone does not open its keyboard.
  useEffect(() => {
    if (refocus === 0) return;
    const field = fieldRef.current;
    if (field !== null && focusWasLost(field.form)) focusInView(field);
  }, [refocus, fieldRef]);

  /** Saves `text`; true when it was saved. */
  async function save(text: string): Promise<boolean> {
    if (pending) return false;
    const fromKeyboard = hasKeyboardFocus(document.activeElement);
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
      if (fromKeyboard) setRefocus((count) => count + 1);
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
