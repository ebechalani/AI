'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { createSchoolAction } from '@/actions/admin';
import { Alert, Button, Dialog, FormField, Input, Spinner, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { CONTENT_LIMITS } from '@/lib/limits';
import { createSchoolInputSchema } from '@/lib/schemas/admin';
import { parseInput } from '@/lib/schemas/common';
import type { ActionError, ActionResult } from '@/types/actions';
import type { Locale } from '@/types/common';
import { DIALOG_TEXT } from './dialog';
import { showErrorsAndFocus } from './focus';
import { sendPasswordEmail } from './password-email';
import { adminSchoolPath } from './paths';
import { EMPTY_SCHOOL, schoolPayload, type SchoolFormValues } from './school-model';
import { SchoolFields, type SchoolField } from './SchoolFields';
import { useActionErrorMessage, useValidationMessage } from './use-action-error';

export interface CreateSchoolDialogProps {
  open: boolean;
  onClose: () => void;
}

type AdminField = 'adminDisplayName' | 'adminEmail';
type Errors = Partial<Record<SchoolField | AdminField, string>>;

const SCHOOL_FIELDS: readonly SchoolField[] = ['name', 'country', 'city', 'defaultLocale'];
const ADMIN_FIELDS: readonly AdminField[] = ['adminDisplayName', 'adminEmail'];

/** form → sending (the school exists, the email is on its way) → emailFailed (only on failure). */
type Phase = 'form' | 'sending' | 'emailFailed';

/**
 * A school and its first administrator (ARCHITECTURE.md 1.5 path 6): `createSchoolAction`, then
 * the password email from the browser. Once the school exists the form is never shown again;
 * a success opens the school's page, and closing after a failed email refreshes the list.
 */
export function CreateSchoolDialog({ open, onClose }: CreateSchoolDialogProps) {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const validationMessage = useValidationMessage();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const [school, setSchool] = useState<SchoolFormValues>({ ...EMPTY_SCHOOL, defaultLocale: locale });
  const [admin, setAdmin] = useState<Record<AdminField, string>>({ adminDisplayName: '', adminEmail: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('form');
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<{ schoolId: string; school: string; email: string } | null>(null);
  const [reason, setReason] = useState('');

  function close() {
    onClose();
    if (created !== null) router.refresh();
  }

  function showFieldErrors(fieldErrors: Record<string, string[]>) {
    const next: Errors = {};
    let unknown = false;
    for (const [path, keys] of Object.entries(fieldErrors)) {
      const field = path.startsWith('school.') ? path.slice('school.'.length) : path;
      if (
        (SCHOOL_FIELDS as readonly string[]).includes(field) ||
        (ADMIN_FIELDS as readonly string[]).includes(field)
      ) {
        next[field as SchoolField | AdminField] = validationMessage(keys[0]);
      } else {
        unknown = true;
      }
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

  function report(error: ActionError) {
    switch (error.code) {
      case 'validation':
        showFieldErrors(error.fieldErrors ?? { _form: ['invalid'] });
        return;
      case 'conflict':
        showErrorsAndFocus(
          () => {
            setErrors({ adminEmail: t('schools.create.errors.conflict') });
            setFormError(null);
          },
          formRef.current,
        );
        return;
      case 'unauthenticated':
        showErrorsAndFocus(() => setFormError(tErrors('unauthenticated')), null, () => alertRef.current);
        router.refresh();
        return;
      default:
        showErrorsAndFocus(() => setFormError(errorMessage(error)), null, () => alertRef.current);
    }
  }

  function openSchool(schoolId: string) {
    router.push(adminSchoolPath(schoolId));
    router.refresh();
  }

  /** The school exists: send the email; on success the new school's page opens. */
  async function sendEmail(account: { schoolId: string; school: string; email: string }) {
    const failure = await sendPasswordEmail(account.email);
    if (failure === null) {
      toast({
        tone: 'success',
        title: t('schools.create.success', { school: account.school, email: account.email }),
      });
      onClose();
      openSchool(account.schoolId);
      return;
    }
    showErrorsAndFocus(
      () => {
        setReason(errorMessage(failure));
        setPhase('emailFailed');
        setPending(false);
      },
      null,
      () => alertRef.current,
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || phase !== 'form') return;
    const parsed = parseInput(createSchoolInputSchema, {
      school: schoolPayload(school),
      adminDisplayName: admin.adminDisplayName,
      adminEmail: admin.adminEmail,
    });
    if (!parsed.success) {
      showFieldErrors(parsed.fieldErrors);
      return;
    }
    setErrors({});
    setFormError(null);
    setPending(true);
    let result: ActionResult<{ schoolId: string; adminEmail: string }>;
    try {
      result = await createSchoolAction(parsed.data);
    } catch {
      result = { ok: false, error: { code: 'internal' } };
    }
    if (!result.ok) {
      setPending(false);
      report(result.error);
      return;
    }
    const account = {
      schoolId: result.data.schoolId,
      school: parsed.data.school.name,
      email: result.data.adminEmail,
    };
    setCreated(account);
    setPhase('sending');
    await sendEmail(account);
  }

  async function retry() {
    if (pending || created === null) return;
    setPending(true);
    await sendEmail(created);
  }

  const sending = phase === 'sending';
  const footer =
    phase === 'emailFailed' && created !== null ? (
      <>
        <Button variant="secondary" onClick={() => openSchool(created.schoolId)} disabled={pending}>
          {t('schools.create.openSchool')}
        </Button>
        <Button loading={pending} onClick={retry}>
          {t('schools.create.retry')}
        </Button>
      </>
    ) : (
      <>
        <Button variant="secondary" onClick={close} disabled={pending}>
          {tCommon('actions.cancel')}
        </Button>
        <Button type="submit" form={formId} loading={pending}>
          {t('schools.create.submit')}
        </Button>
      </>
    );

  return (
    <Dialog
      open={open}
      onClose={close}
      title={t('schools.create.title')}
      description={t('schools.create.description')}
      size="lg"
      className={DIALOG_TEXT}
      // An Escape mid-send would close the dialog with the school created and no word on the
      // email: closed only by its buttons until the email has been sent or has failed.
      dismissible={!pending && !sending}
      footer={footer}
    >
      {phase === 'emailFailed' && created !== null ? (
        <div ref={alertRef} tabIndex={-1} className="outline-none">
          <Alert tone="warning" title={t('schools.create.emailFailed.title')}>
            {t('schools.create.emailFailed.description', {
              school: created.school,
              email: created.email,
              reason,
            })}
          </Alert>
        </div>
      ) : (
        <form id={formId} ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
          <fieldset className="flex min-w-0 flex-col gap-5">
            <legend className="mb-3 text-base font-semibold text-ink">
              {t('schools.create.schoolLegend')}
            </legend>
            <SchoolFields
              values={school}
              onChange={setSchool}
              errors={errors}
              disabled={pending}
              idPrefix="new-school"
            />
          </fieldset>
          <fieldset className="flex min-w-0 flex-col gap-5">
            <legend className="mb-3 text-base font-semibold text-ink">
              {t('schools.create.adminLegend')}
            </legend>
            <FormField label={t('schools.create.adminName')} error={errors.adminDisplayName} required>
              <Input
                name="adminDisplayName"
                value={admin.adminDisplayName}
                onChange={(event) => setAdmin({ ...admin, adminDisplayName: event.target.value })}
                autoComplete="off"
                maxLength={CONTENT_LIMITS.displayNameMaxChars}
                disabled={pending}
              />
            </FormField>
            <FormField
              label={t('schools.create.adminEmail')}
              hint={t('schools.create.adminEmailHint')}
              error={errors.adminEmail}
              required
            >
              <Input
                type="email"
                name="adminEmail"
                value={admin.adminEmail}
                onChange={(event) => setAdmin({ ...admin, adminEmail: event.target.value })}
                autoComplete="off"
                maxLength={CONTENT_LIMITS.emailChars}
                disabled={pending}
              />
            </FormField>
          </fieldset>
          {sending && created !== null && (
            <p className="flex items-center gap-3 text-sm font-medium text-ink" aria-live="polite">
              <Spinner size="sm" label={tCommon('labels.loading')} />
              <span>{t('schools.create.sending', { school: created.school, email: created.email })}</span>
            </p>
          )}
          {formError !== null && (
            <div ref={alertRef} tabIndex={-1} className="outline-none">
              <Alert tone="danger">{formError}</Alert>
            </div>
          )}
        </form>
      )}
    </Dialog>
  );
}
