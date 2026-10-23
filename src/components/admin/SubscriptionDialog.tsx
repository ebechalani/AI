'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useTimeZone, useTranslations } from 'next-intl';
import { upsertSubscriptionAction } from '@/actions/admin';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  FormField,
  Input,
  Select,
  Textarea,
  useToast,
} from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { CONTENT_LIMITS } from '@/lib/limits';
import { upsertSubscriptionInputSchema } from '@/lib/schemas/admin';
import { parseInput } from '@/lib/schemas/common';
import type { ActionError, ActionResult } from '@/types/actions';
import {
  SUBSCRIPTION_STATUSES,
  type Subscription,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from '@/types/billing';
import {
  emptySubscription,
  endsSubscriptionAccess,
  isCourseScoped,
  plansFor,
  subscriptionPayload,
  subscriptionValues,
  withPlan,
  type CourseChoice,
  type OwnerChoice,
} from './billing-model';
import { CheckboxFieldset } from './CheckboxFieldset';
import { safeTimeZone } from './dates';
import { DIALOG_TEXT } from './dialog';
import { unprefixFieldErrors } from './field-errors';
import { showErrorsAndFocus } from './focus';
import type { SchoolChoice } from './school-model';
import { useActionErrorMessage, useValidationMessage } from './use-action-error';

export interface SubscriptionDialogProps {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  subscription?: Subscription;
  owner: OwnerChoice;
  ownerLabel: string;
  courses: CourseChoice[];
  schools: SchoolChoice[];
  /** Today ('YYYY-MM-DD') in the viewer's zone, taken when the dialog opened. */
  today: string;
}

type Field = 'ownerId' | 'plan' | 'status' | 'periodStart' | 'periodEnd' | 'courseIds' | 'notes';
type Errors = Partial<Record<Field, string>>;

/**
 * A subscription, entered by hand (ARCHITECTURE.md 6.7). The owner of an existing one never
 * changes; a school may only take the yearly plan (its access comes from its licences, 4.5).
 * Moving a person's subscription out of trial / active is confirmed by a warning and a danger
 * submit.
 */
export function SubscriptionDialog({
  open,
  onClose,
  mode,
  subscription,
  owner,
  ownerLabel,
  courses,
  schools,
  today,
}: SubscriptionDialogProps) {
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
    subscription !== undefined
      ? subscriptionValues(subscription, tz)
      : emptySubscription(owner, today),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const plans = plansFor(values.ownerType, subscription?.plan);
  const courseScoped = isCourseScoped(values.plan);
  const endsAccess = endsSubscriptionAccess(
    subscription?.status ?? null,
    values.status,
    values.ownerType,
  );
  const studentCourses = courses.filter((course) => course.audience === 'student');
  const teacherCourses = courses.filter((course) => course.audience === 'teacher');
  const atMax = values.courseIds.length >= CONTENT_LIMITS.courseIdsPerSubscription;

  function showFieldErrors(fieldErrors: Record<string, string[]>) {
    const next: Errors = {};
    let alert: string | null = null;
    for (const [path, keys] of Object.entries(unprefixFieldErrors(fieldErrors, 'input.'))) {
      const key = keys[0];
      const field = path.split('.')[0];
      switch (field) {
        case 'ownerId':
          if (owner.kind === 'fixed') alert = t('billing.subscriptionForm.errors.owner');
          else {
            next.ownerId =
              key === 'invalid_choice'
                ? t('billing.subscriptionForm.errors.owner')
                : validationMessage(key);
          }
          break;
        case 'plan':
          next.plan =
            key === 'invalid_choice'
              ? t('billing.subscriptionForm.errors.plan')
              : validationMessage(key);
          break;
        case 'status':
          next.status = validationMessage(key);
          break;
        case 'currentPeriodStart':
          next.periodStart = validationMessage(key);
          break;
        case 'currentPeriodEnd':
          next.periodEnd = validationMessage(key);
          break;
        case 'courseIds':
          if (key === 'invalid_choice') alert = t('billing.subscriptionForm.errors.courses');
          else next.courseIds = validationMessage(key);
          break;
        case 'notes':
          next.notes = validationMessage(key);
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
        show(t('billing.subscriptionForm.errors.notFound'));
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
    const parsed = parseInput(upsertSubscriptionInputSchema, {
      subscriptionId: subscription?.id ?? null,
      input: subscriptionPayload(values, tz),
    });
    if (!parsed.success) {
      showFieldErrors(parsed.fieldErrors);
      return;
    }
    setErrors({});
    setFormError(null);
    setPending(true);
    let result: ActionResult<{ subscriptionId: string }>;
    try {
      result = await upsertSubscriptionAction(parsed.data);
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
      title: t(mode === 'create' ? 'billing.subscriptionForm.created' : 'billing.subscriptionForm.saved'),
    });
    router.refresh();
  }

  function toggleCourse(id: string, checked: boolean) {
    setValues({
      ...values,
      courseIds: checked
        ? [...values.courseIds.filter((item) => item !== id), id]
        : values.courseIds.filter((item) => item !== id),
    });
  }

  const courseGroup = (legend: string, items: CourseChoice[], firstInvalid: boolean) =>
    items.length > 0 && (
      <fieldset className="min-w-0">
        <legend className="mb-1.5 text-sm text-ink-muted">{legend}</legend>
        <div className="flex flex-col gap-2">
          {items.map((course, index) => {
            const checked = values.courseIds.includes(course.id);
            return (
              <Checkbox
                key={course.id}
                name="courseIds"
                value={course.id}
                label={course.title}
                checked={checked}
                disabled={pending || (!checked && atMax)}
                invalid={firstInvalid && index === 0 && errors.courseIds !== undefined}
                onChange={(event) => toggleCourse(course.id, event.target.checked)}
              />
            );
          })}
        </div>
      </fieldset>
    );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        mode === 'create'
          ? t('billing.subscriptionForm.createTitle')
          : t('billing.subscriptionForm.editTitle', { owner: ownerLabel })
      }
      description={t('billing.subscriptionForm.description')}
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
            variant={endsAccess ? 'danger' : 'primary'}
            loading={pending}
          >
            {t(
              mode === 'create'
                ? 'billing.subscriptionForm.submitCreate'
                : 'billing.subscriptionForm.submitEdit',
            )}
          </Button>
        </>
      }
    >
      <form id={formId} ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        {owner.kind === 'fixed' ? (
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 text-sm">
            <dt className="text-ink-muted">{t('billing.subscriptionForm.owner')}</dt>
            <dd className="font-medium break-words text-ink">{ownerLabel}</dd>
          </dl>
        ) : (
          <div>
            <FormField
              id="subscription-ownerId"
              label={t('billing.subscriptionForm.school')}
              error={errors.ownerId}
              required
            >
              <Select
                name="ownerId"
                value={values.ownerId}
                onChange={(event) => setValues({ ...values, ownerId: event.target.value })}
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
            <p className="mt-2 text-sm text-ink-muted">{t('billing.subscriptionForm.userOwnerHint')}</p>
          </div>
        )}
        <FormField
          id="subscription-plan"
          label={t('billing.subscriptionForm.plan')}
          hint={t(
            values.ownerType === 'school'
              ? 'billing.subscriptionForm.schoolOwnerHint'
              : 'billing.subscriptionForm.planHint',
          )}
          error={errors.plan}
          required
        >
          <Select
            name="plan"
            value={values.plan}
            onChange={(event) => setValues(withPlan(values, event.target.value as SubscriptionPlan))}
            disabled={pending}
            options={plans.map((plan) => ({ value: plan, label: t(`billing.plans.${plan}`) }))}
            data-autofocus={owner.kind === 'fixed' ? true : undefined}
          />
        </FormField>
        <FormField
          id="subscription-status"
          label={t('billing.subscriptionForm.status')}
          hint={t('billing.subscriptionForm.statusHint')}
          error={errors.status}
          required
        >
          <Select
            name="status"
            value={values.status}
            onChange={(event) =>
              setValues({ ...values, status: event.target.value as SubscriptionStatus })
            }
            disabled={pending}
            options={SUBSCRIPTION_STATUSES.map((status) => ({
              value: status,
              label: t(`billing.subscriptionStatus.${status}`),
            }))}
          />
        </FormField>
        <div className="flex flex-col gap-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="subscription-periodStart"
              label={t('billing.subscriptionForm.periodStart')}
              error={errors.periodStart}
              required
            >
              <Input
                type="date"
                name="periodStart"
                value={values.periodStart}
                onChange={(event) => setValues({ ...values, periodStart: event.target.value })}
                disabled={pending}
              />
            </FormField>
            <FormField
              id="subscription-periodEnd"
              label={t('billing.subscriptionForm.periodEnd')}
              hint={t('billing.subscriptionForm.periodEndHint')}
              error={errors.periodEnd}
              required
            >
              <Input
                type="date"
                name="periodEnd"
                value={values.periodEnd}
                onChange={(event) => setValues({ ...values, periodEnd: event.target.value })}
                disabled={pending}
              />
            </FormField>
          </div>
          <p className="text-sm text-ink-muted">{t('shared.timeZone', { zone: tz })}</p>
        </div>
        {courseScoped && (
          <CheckboxFieldset
            legend={t('billing.subscriptionForm.courses')}
            hint={t('billing.subscriptionForm.coursesHint')}
            error={errors.courseIds}
            gridClassName="flex flex-col"
          >
            {courseGroup(t('billing.subscriptionForm.studentCourses'), studentCourses, true)}
            {courseGroup(
              t('billing.subscriptionForm.teacherCourses'),
              teacherCourses,
              studentCourses.length === 0,
            )}
          </CheckboxFieldset>
        )}
        <FormField
          id="subscription-notes"
          label={t('billing.subscriptionForm.notes')}
          hint={t('billing.subscriptionForm.notesHint', { max: CONTENT_LIMITS.notesChars })}
          error={errors.notes}
          optional
        >
          <Textarea
            name="notes"
            rows={3}
            maxLength={CONTENT_LIMITS.notesChars}
            value={values.notes}
            onChange={(event) => setValues({ ...values, notes: event.target.value })}
            disabled={pending}
          />
        </FormField>
        {endsAccess && (
          <Alert tone="warning" live="polite">
            {t('billing.subscriptionForm.endAccessWarning', { owner: ownerLabel })}
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
