'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useTimeZone, useTranslations } from 'next-intl';
import { assignCourseAction } from '@/actions/classes';
import {
  Alert,
  Button,
  Dialog,
  FormField,
  Input,
  useToast,
  type ButtonVariant,
} from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError } from '@/types/actions';
import type { IsoDateString } from '@/types/common';
import { dueDateToInput, dueDateToIso, isoToDateInput } from './class-model';
import { DIALOG_TEXT } from './dialog';
import { MAIN_CONTENT_ID, showErrorsAndFocus } from './focus';
import { useActionErrorMessage, useValidationMessage } from './use-action-error';
import { useFocusAfterClose } from './use-focus-after-close';

export interface AssignCourseDialogProps {
  classId: string;
  className: string;
  courseId: string;
  courseTitle: string;
  mode: 'assign' | 'dueDate';
  /** null in 'assign' mode. */
  currentDueAt: IsoDateString | null;
  triggerLabel: string;
  triggerAriaLabel?: string;
  /** Default 'primary' to assign, 'secondary' for the due date. */
  triggerVariant?: ButtonVariant;
  /**
   * 'assign' mode: id of a stable element of the row (its title link) to focus after a success,
   * because the refresh replaces this trigger with the "Assigned" chip.
   */
  focusAfterSuccessId?: string;
}

interface DueDateFieldsProps {
  formId: string;
  mode: 'assign' | 'dueDate';
  initialValue: string;
  fieldError: string | undefined;
  formError: string | null;
  disabled: boolean;
  onSubmit: (value: string, form: HTMLFormElement) => void;
}

/** Mounted only while the dialog is open, so it may read the clock while rendering. */
function DueDateFields({
  formId,
  mode,
  initialValue,
  fieldError,
  formError,
  disabled,
  onSubmit,
}: DueDateFieldsProps) {
  const t = useTranslations('classes');
  const timeZone = useTimeZone();
  const [value, setValue] = useState(initialValue);
  // A picker hint, not a rule: the server accepts a past date.
  const today = isoToDateInput(new Date().toISOString(), timeZone);

  return (
    <form
      id={formId}
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit(value, event.currentTarget);
      }}
    >
      <FormField
        label={t('dueDate.label')}
        hint={mode === 'assign' ? t('assign.dueDateHint') : t('dueDate.hint')}
        error={fieldError}
        optional
      >
        <Input
          type="date"
          name="dueAt"
          value={value}
          min={today}
          onChange={(event) => setValue(event.target.value)}
          disabled={disabled}
          data-autofocus
        />
      </FormField>
      {mode === 'dueDate' && initialValue !== '' && (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setValue('')} disabled={disabled}>
            {t('dueDate.clear')}
          </Button>
        </div>
      )}
      {formError !== null && (
        <div data-form-error tabIndex={-1} className="outline-none">
          <Alert tone="danger">{formError}</Alert>
        </div>
      )}
    </form>
  );
}

/** Assigns a course to a class, or changes the due date of an assigned one. */
export function AssignCourseDialog({
  classId,
  className,
  courseId,
  courseTitle,
  mode,
  currentDueAt,
  triggerLabel,
  triggerAriaLabel,
  triggerVariant,
  focusAfterSuccessId,
}: AssignCourseDialogProps) {
  const t = useTranslations('classes');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const tValidation = useTranslations('validation');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const validationMessage = useValidationMessage();
  const formId = useId();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const focusLater = useFocusAfterClose(open);

  function show(field: string | undefined, form: string | null) {
    showErrorsAndFocus(
      () => {
        setFieldError(field);
        setFormError(form);
      },
      formRef.current,
      () => formRef.current?.querySelector<HTMLElement>('[data-form-error]') ?? null,
    );
  }

  /**
   * A failure after which the refresh may take this dialog's owner off the page (the class
   * archived or gone, the course withdrawn): close first, then the message as a toast (it
   * lives in the layout) and the focus on `<main>`, then the refresh.
   */
  function leave(tone: 'warning' | 'danger', title: string) {
    toast({ tone, title });
    focusLater(MAIN_CONTENT_ID);
    setOpen(false);
    router.refresh();
  }

  function report(error: ActionError) {
    switch (error.code) {
      case 'validation': {
        const key = error.fieldErrors?.dueAt?.[0];
        if (key !== undefined) show(validationMessage(key), null);
        else show(undefined, errorMessage(error));
        return;
      }
      case 'license_required':
        show(undefined, t('assign.errors.license'));
        return;
      case 'conflict':
        leave('warning', t('assign.errors.conflict'));
        return;
      case 'not_found':
        leave('danger', t('assign.errors.notFound'));
        return;
      case 'forbidden':
        show(undefined, t('assign.errors.forbidden'));
        return;
      case 'unauthenticated':
        show(undefined, tErrors('unauthenticated'));
        router.refresh();
        return;
      default:
        show(undefined, errorMessage(error));
    }
  }

  async function submit(value: string, form: HTMLFormElement) {
    if (pending) return;
    formRef.current = form;
    const dueAt = dueDateToIso(value);
    if (dueAt === undefined) {
      show(tValidation('invalid_date'), null);
      return;
    }
    setFieldError(undefined);
    setFormError(null);
    setPending(true);
    try {
      const result = await assignCourseAction({ classId, courseId, dueAt });
      if (!result.ok) {
        // Enabled again before the error takes the focus (a disabled field cannot).
        setPending(false);
        report(result.error);
        return;
      }
      toast({
        tone: 'success',
        title:
          mode === 'assign'
            ? t('assign.success', { course: courseTitle, className })
            : t('dueDate.saved'),
      });
      if (focusAfterSuccessId !== undefined) focusLater(focusAfterSuccessId);
      setOpen(false);
      router.refresh();
    } catch {
      setPending(false);
      report({ code: 'internal' });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant={triggerVariant ?? (mode === 'assign' ? 'primary' : 'secondary')}
        aria-label={triggerAriaLabel}
        onClick={() => {
          setFieldError(undefined);
          setFormError(null);
          setOpen(true);
        }}
      >
        {triggerLabel}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={
          mode === 'assign'
            ? t('assign.dialogTitle', { course: courseTitle })
            : t('dueDate.title', { course: courseTitle })
        }
        description={mode === 'assign' ? t('assign.dialogDescription', { className }) : undefined}
        size="sm"
        className={DIALOG_TEXT}
        dismissible={!pending}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              {tCommon('actions.cancel')}
            </Button>
            <Button type="submit" form={formId} loading={pending}>
              {mode === 'assign' ? t('assign.submit') : t('dueDate.submit')}
            </Button>
          </>
        }
      >
        <DueDateFields
          formId={formId}
          mode={mode}
          initialValue={dueDateToInput(currentDueAt)}
          fieldError={fieldError}
          formError={formError}
          disabled={pending}
          onSubmit={submit}
        />
      </Dialog>
    </>
  );
}
