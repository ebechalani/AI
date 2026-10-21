'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { updateSchoolSettingsAction } from '@/actions/school';
import { Alert, Button, Card, FormField, Input, Switch, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { AI_LIMITS } from '@/lib/limits';
import { parseInput } from '@/lib/schemas/common';
import { updateSchoolSettingsInputSchema } from '@/lib/schemas/school';
import type { ActionResult } from '@/types/actions';
import type { SchoolSettings } from '@/types/school';
import { focusedElement, settleAndRestoreFocus, showErrorsAndFocus, stillThere } from './focus';
import {
  DEFAULT_DAILY_MESSAGES,
  featuresPayload,
  featuresValues,
  type FeaturesFormValues,
} from './school-model';
import { useSettingsFailure } from './settings-form';
import { useValidationMessage } from './use-action-error';

const LIMIT_PATH = 'settings.aiDailyMessageLimit';

/**
 * The AI switch, the tutor's daily limit and the join-code switch. The whole `settings` object
 * is sent with every save (`updateSchool` replaces it), so the limit field stays enabled while
 * AI is off: an invalid value must be fixable where its error shows.
 */
export function SchoolFeaturesForm({ settings }: { settings: SchoolSettings }) {
  const t = useTranslations('school');
  const router = useRouter();
  const { toast } = useToast();
  const validationMessage = useValidationMessage();
  const failureText = useSettingsFailure();
  const formRef = useRef<HTMLFormElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<FeaturesFormValues>(() => featuresValues(settings));
  const [limitError, setLimitError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function showFieldErrors(fieldErrors: Record<string, string[]>) {
    const unknown = Object.keys(fieldErrors).some((path) => path !== LIMIT_PATH);
    showErrorsAndFocus(
      () => {
        setLimitError(validationMessage(fieldErrors[LIMIT_PATH]?.[0]));
        setFormError(unknown ? t('shared.form') : null);
      },
      formRef.current,
      () => alertRef.current,
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const payload = featuresPayload(values);
    const parsed = parseInput(updateSchoolSettingsInputSchema, payload);
    if (!parsed.success) {
      showFieldErrors(parsed.fieldErrors);
      return;
    }
    setLimitError(undefined);
    setFormError(null);
    const focused = focusedElement();
    setPending(true);
    let result: ActionResult<null>;
    try {
      result = await updateSchoolSettingsAction(parsed.data);
    } catch {
      result = { ok: false, error: { code: 'internal' } };
    }
    settleAndRestoreFocus(
      () => setPending(false),
      () => stillThere(focused, submitRef.current),
    );
    if (!result.ok) {
      const error = result.error;
      if (error.code === 'validation') {
        showFieldErrors(error.fieldErrors ?? { _form: ['invalid'] });
        return;
      }
      showErrorsAndFocus(() => setFormError(failureText(error)), null, () => alertRef.current);
      if (error.code === 'unauthenticated') router.refresh();
      return;
    }
    // The stored values: ' 30 ' reads 30, an empty limit stays empty.
    setValues(featuresValues(parsed.data.settings ?? payload.settings));
    toast({ tone: 'success', title: t('settings.features.saved') });
    router.refresh();
  }

  return (
    <Card as="section" aria-labelledby="features-title" className="gap-4 p-5 sm:p-6">
      <h2 id="features-title" className="text-lg leading-snug font-bold text-ink">
        {t('settings.features.title')}
      </h2>
      <form ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
        <Switch
          name="aiEnabled"
          labelPosition="start"
          label={t('settings.features.ai')}
          description={t('settings.features.aiDescription')}
          checked={values.aiEnabled}
          onChange={(event) => setValues({ ...values, aiEnabled: event.target.checked })}
          disabled={pending}
        />
        <FormField
          label={t('settings.features.limit')}
          hint={t('settings.features.limitHint', {
            min: AI_LIMITS.schoolDailyMessageLimit.min,
            max: AI_LIMITS.schoolDailyMessageLimit.max,
            fallback: DEFAULT_DAILY_MESSAGES,
          })}
          error={limitError}
          optional
        >
          <Input
            name="aiDailyMessageLimit"
            inputMode="numeric"
            autoComplete="off"
            value={values.aiDailyMessageLimit}
            onChange={(event) => setValues({ ...values, aiDailyMessageLimit: event.target.value })}
            disabled={pending}
            className="max-w-40"
          />
        </FormField>
        <Switch
          name="joinCodesEnabled"
          labelPosition="start"
          label={t('settings.features.joinCodes')}
          description={t('settings.features.joinCodesDescription')}
          checked={values.joinCodesEnabled}
          onChange={(event) => setValues({ ...values, joinCodesEnabled: event.target.checked })}
          disabled={pending}
        />
        {formError !== null && (
          <div ref={alertRef} tabIndex={-1} className="outline-none">
            <Alert tone="danger">{formError}</Alert>
          </div>
        )}
        <div>
          <Button ref={submitRef} type="submit" loading={pending}>
            {t('settings.features.submit')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
