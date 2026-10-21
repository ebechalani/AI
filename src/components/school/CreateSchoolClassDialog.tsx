'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { createClassAction } from '@/actions/classes';
import {
  ClassFields,
  classPayload,
  type ClassField,
  type ClassFormValues,
} from '@/components/classes/ClassFields';
import { Alert, Button, Dialog, FormField, Select, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { classInputSchema } from '@/lib/schemas/class';
import { parseInput } from '@/lib/schemas/common';
import type { ActionError, ActionResult } from '@/types/actions';
import { DIALOG_TEXT } from './dialog';
import { showErrorsAndFocus } from './focus';
import { schoolClassPath } from './paths';
import { useActionErrorMessage, useValidationMessage } from './use-action-error';

export interface OwnerOption {
  value: string;
  label: string;
}

export interface CreateSchoolClassDialogProps {
  open: boolean;
  onClose: () => void;
  /** The active teachers of the school, by name. */
  teachers: OwnerOption[];
}

type Field = ClassField | 'ownerUid';
const CLASS_FIELDS: readonly string[] = ['name', 'gradeLabel', 'ageBand'];

/**
 * A class for one of the school's teachers: WS-E's class fields and the owner. The owner mounts
 * it with a new `key` for every opening, so the fields start empty each time.
 */
export function CreateSchoolClassDialog({ open, onClose, teachers }: CreateSchoolClassDialogProps) {
  const t = useTranslations('school');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const validationMessage = useValidationMessage();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<ClassFormValues>({
    name: '',
    gradeLabel: '',
    ageBand: '11-12',
  });
  // Preselected when the school has exactly one active teacher.
  const [ownerUid, setOwnerUid] = useState(teachers.length === 1 ? (teachers[0]?.value ?? '') : '');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function ownerMessage(key: string | undefined): string | undefined {
    return key === 'invalid_choice' ? t('classes.create.errors.ownerGone') : validationMessage(key);
  }

  function showFieldErrors(fieldErrors: Record<string, string[]>) {
    const next: Partial<Record<Field, string>> = {};
    let unknown = false;
    for (const [path, keys] of Object.entries(fieldErrors)) {
      if (CLASS_FIELDS.includes(path)) next[path as ClassField] = validationMessage(keys[0]);
      else if (path === 'ownerUid') next.ownerUid = ownerMessage(keys[0]);
      else unknown = true;
    }
    showErrorsAndFocus(
      () => {
        setErrors(next);
        setFormError(unknown ? t('shared.form') : null);
      },
      formRef.current,
      () => alertRef.current,
    );
  }

  function showFormError(message: string) {
    showErrorsAndFocus(() => setFormError(message), null, () => alertRef.current);
  }

  function report(error: ActionError) {
    switch (error.code) {
      case 'validation':
        showFieldErrors(error.fieldErrors ?? { _form: ['invalid'] });
        return;
      case 'not_found':
        showFormError(t('classes.create.errors.ownerGone'));
        return;
      case 'conflict':
        showFormError(t('classes.create.errors.conflict'));
        return;
      case 'unauthenticated':
        showFormError(tErrors('unauthenticated'));
        router.refresh();
        return;
      default:
        showFormError(errorMessage(error));
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const payload = { ...classPayload(values), ownerUid };
    const parsed = parseInput(classInputSchema, payload);
    if (ownerUid === '' || !parsed.success) {
      const fieldErrors = parsed.success ? {} : { ...parsed.fieldErrors };
      // The schema takes a missing owner (a teacher sends none); a school admin must choose one.
      if (ownerUid === '') fieldErrors.ownerUid = ['required'];
      showFieldErrors(fieldErrors);
      return;
    }
    setErrors({});
    setFormError(null);
    setPending(true);
    let result: ActionResult<{ classId: string }>;
    try {
      result = await createClassAction(parsed.data);
    } catch {
      result = { ok: false, error: { code: 'internal' } };
    }
    if (!result.ok) {
      setPending(false);
      report(result.error);
      return;
    }
    onClose();
    toast({ tone: 'success', title: t('classes.create.success', { name: parsed.data.name }) });
    router.push(schoolClassPath(result.data.classId));
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('classes.create.title')}
      description={t('classes.create.description')}
      size="md"
      className={DIALOG_TEXT}
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {tCommon('actions.cancel')}
          </Button>
          <Button type="submit" form={formId} loading={pending}>
            {t('classes.create.submit')}
          </Button>
        </>
      }
    >
      <form id={formId} ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <ClassFields
          values={values}
          onChange={setValues}
          errors={errors}
          schoolless={false}
          disabled={pending}
        />
        <FormField
          label={t('classes.create.owner')}
          hint={t('classes.create.ownerHint')}
          error={errors.ownerUid}
          required
        >
          <Select
            name="ownerUid"
            value={ownerUid}
            onChange={(event) => setOwnerUid(event.target.value)}
            options={teachers}
            placeholder={t('classes.create.ownerPlaceholder')}
            disabled={pending}
          />
        </FormField>
        {formError !== null && (
          <div ref={alertRef} tabIndex={-1} className="outline-none">
            <Alert tone="danger">{formError}</Alert>
          </div>
        )}
      </form>
    </Dialog>
  );
}
