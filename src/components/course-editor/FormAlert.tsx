'use client';

import type { ReactNode, Ref } from 'react';
import { Alert } from '@/components/ui';
import { SessionEndedAlert } from './SessionEndedAlert';
import type { FormFailure } from './use-editor-action';

/**
 * A form's or dialog's failure: a danger `Alert`, or the session-ended alert. `ref` is the
 * focusable wrapper, focused when no field is marked invalid.
 */
export function FormAlert({
  ref,
  failure,
  action,
  children,
}: {
  ref?: Ref<HTMLDivElement>;
  failure: FormFailure | null;
  /** A button under the text ("Save it as a new quiz"). */
  action?: ReactNode;
  /** More text under the message ("2 problems in French."). */
  children?: ReactNode;
}) {
  if (failure === null) return null;
  return (
    <div ref={ref} tabIndex={-1} className="rounded-control outline-none">
      {failure.sessionEnded ? (
        <SessionEndedAlert />
      ) : (
        <Alert tone="danger" action={action}>
          <p>{failure.message}</p>
          {children}
        </Alert>
      )}
    </div>
  );
}
