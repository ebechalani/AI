'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useTimeZone, useTranslations } from 'next-intl';
import { upsertLicenseAction } from '@/actions/admin';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  FormField,
  Input,
  RadioGroup,
  Select,
  useToast,
} from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { CONTENT_LIMITS } from '@/lib/limits';
import { upsertLicenseInputSchema } from '@/lib/schemas/admin';
import { parseInput } from '@/lib/schemas/common';
import type { ActionError, ActionResult } from '@/types/actions';
import type { License, LicenseScope, LicenseStatus } from '@/types/billing';
import {
  emptyLicense,
  licensePayload,
  licenseValues,
  suspendsLicense,
  type PathwayChoice,
  type SubscriptionOption,
} from './billing-model';
import { CheckboxFieldset } from './CheckboxFieldset';
import { safeTimeZone } from './dates';
import { DIALOG_TEXT } from './dialog';
import { unprefixFieldErrors } from './field-errors';
import { showErrorsAndFocus } from './focus';
import type { SchoolChoice } from './school-model';
import { useActionErrorMessage, useValidationMessage } from './use-action-error';

export interface LicenseDialogProps {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  license?: License;
  schoolId: string | null;
  schoolName?: string;
  schools: SchoolChoice[];
  pathways: PathwayChoice[];
  subscriptionOptions: SubscriptionOption[] | null;
  /** Today ('YYYY-MM-DD') in the viewer's zone, taken when the dialog opened. */
  today: string;
}

type Field =
  | 'schoolId'
  | 'name'
  | 'seatsTotal'
  | 'scope'
  | 'pathwayIds'
  | 'startsOn'
  | 'endsOn'
  | 'status'
  | 'subscriptionId';
type Errors = Partial<Record<Field, string>>;

/**
 * A licence of a school (ARCHITECTURE.md 6.7): what it opens, how many seats, when, and the
 * subscription it is linked to (offered on the school's page only). Suspending an active licence
 * is confirmed by a warning and a danger submit: the whole school loses that access.
 */
export function LicenseDialog({
  open,
  onClose,
  mode,
  license,
  schoolId,
  schoolName,
  schools,
  pathways,
  subscriptionOptions,
  today,
}: LicenseDialogProps) {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const tz = safeTimeZone(useTimeZone());
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const validationMessage = useValidationMessage();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState(() =>
    license !== undefined ? licenseValues(license, tz) : emptyLicense(schoolId ?? '', today),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const pickSchool = mode === 'create' && schoolId === null;
  const suspends = suspendsLicense(license?.status ?? null, values.status);

  function showFieldErrors(fieldErrors: Record<string, string[]>) {
    const next: Errors = {};
    let alert: string | null = null;
    for (const [path, keys] of Object.entries(unprefixFieldErrors(fieldErrors, 'input.'))) {
      const key = keys[0];
      if (path.startsWith('scope.pathwayIds')) {
        next.pathwayIds =
          key === 'invalid_choice' ? t('billing.licenseForm.errors.pathways') : validationMessage(key);
        continue;
      }
      switch (path) {
        case 'schoolId':
          if (pickSchool) next.schoolId = validationMessage(key);
          else alert = t('billing.licenseForm.errors.notFound');
          break;
        case 'name':
          next.name = validationMessage(key);
          break;
        case 'seatsTotal':
          next.seatsTotal = validationMessage(key);
          break;
        case 'scope':
          next.scope = validationMessage(key);
          break;
        case 'startsAt':
          next.startsOn = validationMessage(key);
          break;
        case 'endsAt':
          next.endsOn = validationMessage(key);
          break;
        case 'status':
          next.status = validationMessage(key);
          break;
        case 'subscriptionId':
          if (key === 'invalid_choice' || subscriptionOptions === null) {
            alert = t('billing.licenseForm.errors.subscription');
          } else {
            next.subscriptionId = validationMessage(key);
          }
          break;
        default:
          alert = alert ?? t('shared.form');
      }
    }
    showErrorsAndFocus(
      () => {
        setErrors(next);
        setFormError(alert);
      },
      formRef.current,
      () => alertRef.current,
    );
  }

  function report(error: ActionError) {
    const show = (message: string) =>
      showErrorsAndFocus(() => setFormError(message), null, () => alertRef.current);
    switch (error.code) {
      case 'validation':
        showFieldErrors(error.fieldErrors ?? { _form: ['invalid'] });
        return;
      case 'not_found':
        show(t('billing.licenseForm.errors.notFound'));
        return;
      case 'unauthenticated':
        show(tErrors('unauthenticated'));
        router.refresh();
        return;
      default:
        show(errorMessage(error));
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const parsed = parseInput(upsertLicenseInputSchema, {
      licenseId: license?.id ?? null,
      input: licensePayload(values, tz),
    });
    if (!parsed.success) {
      showFieldErrors(parsed.fieldErrors);
      return;
    }
    setErrors({});
    setFormError(null);
    setPending(true);
    let result: ActionResult<{ licenseId: string }>;
    try {
      result = await upsertLicenseAction(parsed.data);
    } catch {
      result = { ok: false, error: { code: 'internal' } };
    }
    setPending(false);
    if (!result.ok) {
      report(result.error);
      return;
    }
    onClose();
    toast({
      tone: 'success',
      title: t(mode === 'create' ? 'billing.licenseForm.created' : 'billing.licenseForm.saved'),
    });
    router.refresh();
  }

  function togglePathway(id: string, checked: boolean) {
    setValues({
      ...values,
      pathwayIds: checked
        ? [...values.pathwayIds.filter((item) => item !== id), id]
        : values.pathwayIds.filter((item) => item !== id),
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        mode === 'create'
          ? t('billing.licenseForm.createTitle')
          : t('billing.licenseForm.editTitle', { name: license?.name ?? '' })
      }
      description={t('billing.licenseForm.description')}
      size="lg"
      className={DIALOG_TEXT}
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {tCommon('actions.cancel')}
          </Button>
          <Button
            type="submit"
            form={formId}
            variant={suspends ? 'danger' : 'primary'}
            loading={pending}
          >
            {t(mode === 'create' ? 'billing.licenseForm.submitCreate' : 'billing.licenseForm.submitEdit')}
          </Button>
        </>
      }
    >
      <form id={formId} ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        {pickSchool ? (
          <FormField
            id="license-schoolId"
            label={t('billing.licenseForm.school')}
            error={errors.schoolId}
            required
          >
            <Select
              name="schoolId"
              value={values.schoolId}
              onChange={(event) => setValues({ ...values, schoolId: event.target.value })}
              disabled={pending}
              placeholder={tCommon('actions.select')}
              options={schools.map((school) => ({
                value: school.id,
                label: school.suspended
                  ? t('shared.suspendedSchoolOption', { name: school.name })
                  : t('shared.schoolOption', { name: school.name }),
              }))}
              data-autofocus
            />
          </FormField>
        ) : (
          schoolName !== undefined && (
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 text-sm">
              <dt className="text-ink-muted">{t('billing.licenseForm.school')}</dt>
              <dd className="font-medium break-words text-ink">{schoolName}</dd>
            </dl>
          )
        )}
        <FormField
          id="license-name"
          label={t('billing.licenseForm.name')}
          hint={t('billing.licenseForm.nameHint')}
          error={errors.name}
          required
        >
          <Input
            name="name"
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
            autoComplete="off"
            maxLength={CONTENT_LIMITS.licenseNameChars}
            disabled={pending}
            data-autofocus={pickSchool ? undefined : true}
          />
        </FormField>
        <FormField
          id="license-seatsTotal"
          label={t('billing.licenseForm.seats')}
          hint={t('billing.licenseForm.seatsHint')}
          error={errors.seatsTotal}
          required
        >
          <Input
            type="number"
            inputMode="numeric"
            name="seatsTotal"
            min={1}
            max={CONTENT_LIMITS.seatsMax}
            value={values.seatsTotal}
            onChange={(event) => setValues({ ...values, seatsTotal: event.target.value })}
            disabled={pending}
            className="w-32"
          />
        </FormField>
        <RadioGroup
          legend={t('billing.licenseForm.scopeLegend')}
          name="scopeType"
          variant="card"
          value={values.scopeType}
          onValueChange={(value) => setValues({ ...values, scopeType: value as LicenseScope['type'] })}
          error={errors.scope}
          disabled={pending}
          options={[
            {
              value: 'all_official',
              label: t('billing.licenseForm.scopeAll'),
              description: t('billing.licenseForm.scopeAllDescription'),
            },
            {
              value: 'pathways',
              label: t('billing.licenseForm.scopePathways'),
              description: t('billing.licenseForm.scopePathwaysDescription'),
            },
          ]}
        />
        {values.scopeType === 'pathways' && (
          <CheckboxFieldset
            legend={t('billing.licenseForm.pathwaysLegend')}
            error={errors.pathwayIds}
            disabled={pending}
            gridClassName="grid sm:grid-cols-2"
          >
            {pathways.map((pathway, index) => (
              <Checkbox
                key={pathway.id}
                name="pathwayIds"
                value={pathway.id}
                label={pathway.title}
                checked={values.pathwayIds.includes(pathway.id)}
                invalid={index === 0 && errors.pathwayIds !== undefined}
                onChange={(event) => togglePathway(pathway.id, event.target.checked)}
              />
            ))}
          </CheckboxFieldset>
        )}
        <div className="flex flex-col gap-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="license-startsOn"
              label={t('billing.licenseForm.startsOn')}
              error={errors.startsOn}
              required
            >
              <Input
                type="date"
                name="startsOn"
                value={values.startsOn}
                onChange={(event) => setValues({ ...values, startsOn: event.target.value })}
                disabled={pending}
              />
            </FormField>
            <FormField
              id="license-endsOn"
              label={t('billing.licenseForm.endsOn')}
              hint={t('billing.licenseForm.endsOnHint')}
              error={errors.endsOn}
              required
            >
              <Input
                type="date"
                name="endsOn"
                value={values.endsOn}
                onChange={(event) => setValues({ ...values, endsOn: event.target.value })}
                disabled={pending}
              />
            </FormField>
          </div>
          <p className="text-sm text-ink-muted">{t('shared.timeZone', { zone: tz })}</p>
        </div>
        <RadioGroup
          legend={t('billing.licenseForm.statusLegend')}
          name="status"
          orientation="horizontal"
          value={values.status}
          onValueChange={(value) => setValues({ ...values, status: value as LicenseStatus })}
          error={errors.status}
          disabled={pending}
          options={[
            { value: 'active', label: t('billing.licenseForm.statusActive') },
            {
              value: 'suspended',
              label: t('billing.licenseForm.statusSuspended'),
              description: t('billing.licenseForm.statusSuspendedDescription'),
            },
          ]}
        />
        {subscriptionOptions !== null && (
          <FormField
            id="license-subscriptionId"
            label={t('billing.licenseForm.subscription')}
            error={errors.subscriptionId}
            optional
          >
            <Select
              name="subscriptionId"
              value={values.subscriptionId}
              onChange={(event) => setValues({ ...values, subscriptionId: event.target.value })}
              disabled={pending}
              options={[
                { value: '', label: t('billing.licenseForm.subscriptionNone') },
                ...subscriptionOptions,
              ]}
            />
          </FormField>
        )}
        {suspends && (
          <Alert tone="warning" live="polite">
            {t('billing.licenseForm.suspendWarning')}
          </Alert>
        )}
        {formError !== null && (
          <div ref={alertRef} tabIndex={-1} className="outline-none">
            <Alert tone="danger">{formError}</Alert>
          </div>
        )}
      </form>
    </Dialog>
  );
}
