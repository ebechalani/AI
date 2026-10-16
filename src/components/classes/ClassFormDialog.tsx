'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Alert, Button, Dialog } from '@/components/ui';
import { classInputSchema } from '@/lib/schemas/class';
import { parseInput } from '@/lib/schemas/common';
import type { ActionError } from '@/types/actions';
import {
  ClassFields,
  classPayload,
  type ClassField,
  type ClassFormValues,
} from './ClassFields';
import { DIALOG_TEXT } from './dialog';
import { showErrorsAndFocus } from './focus';
import { useValidationMessage } from './use-action-error';

const FIELDS: readonly ClassField[] = ['name', 'gradeLabel', 'ageBand'];

export interface ClassFormDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  submitLabel: string;
  initialValues: ClassFormValues;
  schoolless: boolean;
  /** Runs the action with the validated payload; null after a success (the owner closed it). */
  save: (payload: ReturnType<typeof classPayload>) => Promise<ActionError | null>;
  /** The inline message of a failure other than a field-level `validation`. */
  errorText: (error: ActionError) => string;
}

/**
 * The create and edit dialogs of a class. The owner mounts it with a new `key` for every
 * opening, so the fields start from `initialValues` each time.
 */
export function ClassFormDialog({
  open,
  onClose,
  title,
  description,
  submitLabel,
  initialValues,
  schoolless,
  save,
  errorText,
}: ClassFormDialogProps) {
  const t = useTranslations('classes');
  const tCommon = useTranslations('common');
  const validationMessage = useValidationMessage();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Partial<Record<ClassField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function showFieldErrors(fieldErrors: Record<string, string[]>) {
    const next: Partial<Record<ClassField, string>> = {};
    let unknown = false;
    for (const [path, keys] of Object.entries(fieldErrors)) {
      if ((FIELDS as readonly string[]).includes(path)) {
        next[path as ClassField] = validationMessage(keys[0]);
      } else {
        unknown = true;
      }
    }
    showErrorsAndFocus(
      () => {
        setErrors(next);
        setFormError(unknown ? t('errors.form') : null);
      },
      formRef.current,
      () => errorRef.current,
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const payload = classPayload(values);
    const parsed = parseInput(classInputSchema, payload);
    if (!parsed.success) {
      showFieldErrors(parsed.fieldErrors);
      return;
    }
    setErrors({});
    setFormError(null);
    setPending(true);
    let error: ActionError | null;
    try {
      error = await save(payload);
    } catch {
      error = { code: 'internal' };
    }
    setPending(false);
    if (error === null) return;
    if (error.code === 'validation' && error.fieldErrors !== undefined) {
      showFieldErrors(error.fieldErrors);
      return;
    }
    const message = errorText(error);
    showErrorsAndFocus(() => setFormError(message), null, () => errorRef.current);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="md"
      className={DIALOG_TEXT}
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {tCommon('actions.cancel')}
          </Button>
          <Button type="submit" form={formId} loading={pending}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id={formId} ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <ClassFields
          values={values}
          onChange={setValues}
          errors={errors}
          schoolless={schoolless}
          disabled={pending}
        />
        {formError !== null && (
          <div ref={errorRef} tabIndex={-1} className="outline-none">
            <Alert tone="danger">{formError}</Alert>
          </div>
        )}
      </form>
    </Dialog>
  );
}
