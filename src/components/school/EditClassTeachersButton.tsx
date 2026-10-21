'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { setClassTeachersAction } from '@/actions/school';
import { Alert, Button, Checkbox, Dialog, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { parseInput } from '@/lib/schemas/common';
import { setClassTeachersInputSchema } from '@/lib/schemas/school';
import type { ActionError, ActionResult } from '@/types/actions';
import {
  teachersPayload,
  toggleTeacher,
  type TeacherPicker,
} from './class-admin-model';
import { DIALOG_TEXT } from './dialog';
import { MAIN_CONTENT_ID, showErrorsAndFocus } from './focus';
import { useActionErrorMessage } from './use-action-error';
import { useFocusAfterClose } from './use-focus-after-close';

export interface EditClassTeachersButtonProps {
  classId: string;
  className: string;
  /** Rendered only while the owner is active (`picker.ownerDisabled` false). */
  picker: TeacherPicker;
}

interface TeachersDialogProps extends EditClassTeachersButtonProps {
  open: boolean;
  onClose: () => void;
  /** Called for a `not_found`: the dialog closes and the focus goes to <main>. */
  onGone: () => void;
}

/** The checkbox list; mounted with a new key per opening, so it starts at `picker.initial`. */
function TeachersDialog({ classId, className, picker, open, onClose, onGone }: TeachersDialogProps) {
  const t = useTranslations('school');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const formId = useId();
  const alertRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string[]>(picker.initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const owner = picker.options.find((option) => option.locked);
  const ownerUid = owner?.uid ?? '';
  const full = selected.length >= picker.max;
  const list = new Intl.ListFormat(locale, { type: 'conjunction' });
  const droppedNames = list.format(
    picker.dropped.map((name) => name ?? t('class.teachers.unknown')),
  );

  function showError(message: string) {
    showErrorsAndFocus(() => setError(message), null, () => alertRef.current);
  }

  function report(failure: ActionError) {
    switch (failure.code) {
      case 'validation': {
        const keys = failure.fieldErrors?.teacherUids ?? [];
        if (keys.includes('invalid_choice')) showError(t('class.teachers.errors.invalid'));
        else if (keys.includes('too_many')) {
          showError(t('class.teachers.errors.tooMany', { max: picker.max }));
        } else showError(t('shared.form'));
        return;
      }
      case 'conflict':
        showError(t('class.teachers.errors.conflict'));
        return;
      case 'not_found':
        toast({ tone: 'danger', title: t('shared.classGone') });
        onGone();
        router.refresh();
        return;
      case 'unauthenticated':
        showError(tErrors('unauthenticated'));
        router.refresh();
        return;
      default:
        showError(errorMessage(failure));
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const parsed = parseInput(setClassTeachersInputSchema, {
      classId,
      teacherUids: teachersPayload(selected, ownerUid),
    });
    if (!parsed.success) {
      report({ code: 'validation', fieldErrors: parsed.fieldErrors });
      return;
    }
    setError(null);
    setPending(true);
    let result: ActionResult<null>;
    try {
      result = await setClassTeachersAction(parsed.data);
    } catch {
      result = { ok: false, error: { code: 'internal' } };
    }
    setPending(false);
    if (!result.ok) {
      report(result.error);
      return;
    }
    onClose();
    toast({ tone: 'success', title: t('class.teachers.saved', { className }) });
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('class.teachers.dialogTitle', { className })}
      description={t('class.teachers.dialogDescription', { max: picker.max })}
      size="md"
      className={DIALOG_TEXT}
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {tCommon('actions.cancel')}
          </Button>
          <Button type="submit" form={formId} loading={pending}>
            {t('class.teachers.submit')}
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <fieldset className="flex min-w-0 flex-col gap-3">
          <legend className="sr-only">{t('class.teachers.legend')}</legend>
          {picker.options.map((option) =>
            option.locked ? (
              <Checkbox
                key={option.uid}
                checked
                readOnly
                disabled
                label={t('class.teachers.ownerLocked', { name: option.name })}
              />
            ) : (
              <Checkbox
                key={option.uid}
                name="teacherUids"
                value={option.uid}
                checked={selected.includes(option.uid)}
                disabled={pending || (full && !selected.includes(option.uid))}
                onChange={() =>
                  setSelected((current) =>
                    toggleTeacher(current, option.uid, ownerUid, picker.max),
                  )
                }
                label={option.name}
              />
            ),
          )}
        </fieldset>
        <p role="status" className="text-sm font-medium text-ink-muted">
          {t('class.teachers.count', { count: selected.length, max: picker.max })}
        </p>
        {picker.options.length <= 1 && (
          <p className="text-sm text-ink-muted">{t('class.teachers.noOthers')}</p>
        )}
        {picker.dropped.length > 0 && (
          <Alert tone="info" live="off">
            {t('class.teachers.dropped', { names: droppedNames })}
          </Alert>
        )}
        {error !== null && (
          <div ref={alertRef} tabIndex={-1} className="outline-none">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}
      </form>
    </Dialog>
  );
}

/** "Change teachers": the owner stays; up to four co-teachers among the school's active teachers. */
export function EditClassTeachersButton(props: EditClassTeachersButtonProps) {
  const t = useTranslations('school');
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(0);
  const focusLater = useFocusAfterClose(open);

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setOpening((value) => value + 1);
          setOpen(true);
        }}
      >
        {t('class.teachers.change')}
      </Button>
      <TeachersDialog
        key={opening}
        {...props}
        open={open}
        onClose={() => setOpen(false)}
        onGone={() => {
          focusLater(MAIN_CONTENT_ID);
          setOpen(false);
        }}
      />
    </>
  );
}
