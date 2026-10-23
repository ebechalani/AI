'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { updateSchoolAction } from '@/actions/admin';
import { Alert, Button, Dialog, FormField, Input, Switch, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { AI_LIMITS } from '@/lib/limits';
import { updateSchoolInputSchema } from '@/lib/schemas/admin';
import { parseInput } from '@/lib/schemas/common';
import type { ActionError, ActionResult } from '@/types/actions';
import type { School } from '@/types/school';
import { DIALOG_TEXT } from './dialog';
import { unprefixFieldErrors } from './field-errors';
import { showErrorsAndFocus } from './focus';
import { isUnknownCountry, schoolPatch, schoolValues, settingsValues } from './school-model';
import { SchoolFields, type SchoolField } from './SchoolFields';
import { useActionErrorMessage, useValidationMessage } from './use-action-error';

export interface EditSchoolDialogProps {
  open: boolean;
  onClose: () => void;
  school: School;
}

type Field = SchoolField | 'aiDailyMessageLimit';
const FIELD_PATHS: Record<string, Field> = {
  name: 'name',
  country: 'country',
  city: 'city',
  defaultLocale: 'defaultLocale',
  'settings.aiDailyMessageLimit': 'aiDailyMessageLimit',
};

/** The profile and the features of a school; `settings` is replaced as a whole on save. */
export function EditSchoolDialog({ open, onClose, school }: EditSchoolDialogProps) {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const validationMessage = useValidationMessage();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState(() => schoolValues(school));
  const [settings, setSettings] = useState(() => settingsValues(school.settings));
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function showFieldErrors(fieldErrors: Record<string, string[]>) {
    const next: Partial<Record<Field, string>> = {};
    let unknown = false;
    for (const [path, keys] of Object.entries(unprefixFieldErrors(fieldErrors, 'patch.'))) {
      const field = FIELD_PATHS[path];
      if (field !== undefined) next[field] = validationMessage(keys[0]);
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

  function report(error: ActionError) {
    switch (error.code) {
      case 'validation':
        showFieldErrors(error.fieldErrors ?? { _form: ['invalid'] });
        return;
      case 'not_found':
        showErrorsAndFocus(() => setFormError(t('shared.schoolGone')), null, () => alertRef.current);
        return;
      case 'unauthenticated':
        showErrorsAndFocus(() => setFormError(tErrors('unauthenticated')), null, () => alertRef.current);
        router.refresh();
        return;
      default:
        showErrorsAndFocus(() => setFormError(errorMessage(error)), null, () => alertRef.current);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const parsed = parseInput(updateSchoolInputSchema, {
      schoolId: school.id,
      patch: schoolPatch(values, settings),
    });
    // An unassigned code is refused when the admin changes it (the schema checks the shape
    // only); a school saved earlier with one can still be edited until the code is touched.
    const unknownCountry =
      isUnknownCountry(values.country) && values.country.trim().toUpperCase() !== school.country;
    if (!parsed.success || unknownCountry) {
      showFieldErrors({
        ...(parsed.success ? {} : parsed.fieldErrors),
        ...(unknownCountry ? { 'patch.country': ['invalid'] } : {}),
      });
      return;
    }
    setErrors({});
    setFormError(null);
    setPending(true);
    let result: ActionResult<null>;
    try {
      result = await updateSchoolAction(parsed.data);
    } catch {
      result = { ok: false, error: { code: 'internal' } };
    }
    setPending(false);
    if (!result.ok) {
      report(result.error);
      return;
    }
    onClose();
    toast({ tone: 'success', title: t('schools.edit.success', { name: parsed.data.patch.name ?? school.name }) });
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('schools.edit.title', { name: school.name })}
      size="lg"
      className={DIALOG_TEXT}
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {tCommon('actions.cancel')}
          </Button>
          <Button type="submit" form={formId} loading={pending}>
            {t('schools.edit.submit')}
          </Button>
        </>
      }
    >
      <form id={formId} ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
        <fieldset className="flex min-w-0 flex-col gap-5">
          <legend className="mb-3 text-base font-semibold text-ink">
            {t('schools.edit.profileLegend')}
          </legend>
          <SchoolFields
            values={values}
            onChange={setValues}
            errors={errors}
            disabled={pending}
            idPrefix="edit-school"
          />
        </fieldset>
        <fieldset className="flex min-w-0 flex-col gap-5">
          <legend className="mb-3 text-base font-semibold text-ink">
            {t('schools.edit.featuresLegend')}
          </legend>
          <Switch
            name="aiEnabled"
            label={t('schools.edit.aiEnabled')}
            description={t('schools.edit.aiEnabledDescription')}
            checked={settings.aiEnabled}
            onChange={(event) => setSettings({ ...settings, aiEnabled: event.target.checked })}
            disabled={pending}
          />
          <FormField
            id="edit-school-aiLimit"
            label={t('schools.edit.aiLimit')}
            hint={t('schools.edit.aiLimitHint', {
              min: AI_LIMITS.schoolDailyMessageLimit.min,
              max: AI_LIMITS.schoolDailyMessageLimit.max,
              count: AI_LIMITS.tutor.student.perDay,
            })}
            error={errors.aiDailyMessageLimit}
            optional
          >
            <Input
              type="number"
              inputMode="numeric"
              name="aiDailyMessageLimit"
              min={AI_LIMITS.schoolDailyMessageLimit.min}
              max={AI_LIMITS.schoolDailyMessageLimit.max}
              value={settings.aiDailyMessageLimit}
              onChange={(event) => setSettings({ ...settings, aiDailyMessageLimit: event.target.value })}
              disabled={pending}
              className="w-32"
            />
          </FormField>
          <Switch
            name="joinCodesEnabled"
            label={t('schools.edit.joinCodes')}
            description={t('schools.edit.joinCodesDescription')}
            checked={settings.joinCodesEnabled}
            onChange={(event) => setSettings({ ...settings, joinCodesEnabled: event.target.checked })}
            disabled={pending}
          />
        </fieldset>
        {formError !== null && (
          <div ref={alertRef} tabIndex={-1} className="outline-none">
            <Alert tone="danger">{formError}</Alert>
          </div>
        )}
      </form>
    </Dialog>
  );
}
