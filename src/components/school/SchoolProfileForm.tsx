'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { updateSchoolSettingsAction } from '@/actions/school';
import { Alert, Button, Card, FormField, Input, Select, useToast } from '@/components/ui';
import { LOCALE_LABELS, LOCALES } from '@/lib/i18n/config';
import { useRouter } from '@/lib/i18n/navigation';
import { CONTENT_LIMITS } from '@/lib/limits';
import { parseInput } from '@/lib/schemas/common';
import { updateSchoolSettingsInputSchema } from '@/lib/schemas/school';
import type { ActionResult } from '@/types/actions';
import type { Locale } from '@/types/common';
import type { School } from '@/types/school';
import { focusedElement, settleAndRestoreFocus, showErrorsAndFocus, stillThere } from './focus';
import { profilePayload, type ProfileFormValues } from './school-model';
import { useSettingsFailure } from './settings-form';
import { useValidationMessage } from './use-action-error';

export interface SchoolProfileFormProps {
  school: Pick<School, 'name' | 'city' | 'defaultLocale'>;
  /** The country's name in the page's language; read-only here. */
  countryName: string;
}

type Field = 'name' | 'city' | 'defaultLocale';
const FIELDS: readonly string[] = ['name', 'city', 'defaultLocale'];

/**
 * The school's name, city and default language. The values are set from the props once, never
 * by remounting on `updatedAt`: a save in the other form must not throw these edits away.
 */
export function SchoolProfileForm({ school, countryName }: SchoolProfileFormProps) {
  const t = useTranslations('school');
  const router = useRouter();
  const { toast } = useToast();
  const validationMessage = useValidationMessage();
  const failureText = useSettingsFailure();
  const formRef = useRef<HTMLFormElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<ProfileFormValues>({
    name: school.name,
    city: school.city ?? '',
    defaultLocale: school.defaultLocale,
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function showFieldErrors(fieldErrors: Record<string, string[]>) {
    const next: Partial<Record<Field, string>> = {};
    let unknown = false;
    for (const [path, keys] of Object.entries(fieldErrors)) {
      if (FIELDS.includes(path)) next[path as Field] = validationMessage(keys[0]);
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const parsed = parseInput(updateSchoolSettingsInputSchema, profilePayload(values));
    if (!parsed.success) {
      showFieldErrors(parsed.fieldErrors);
      return;
    }
    setErrors({});
    setFormError(null);
    // The fields are disabled while saving; the focus comes back to where it was (7.3).
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
    // The stored values: trimmed, a blank city empty.
    setValues({
      name: parsed.data.name ?? values.name,
      city: parsed.data.city ?? '',
      defaultLocale: parsed.data.defaultLocale ?? values.defaultLocale,
    });
    toast({ tone: 'success', title: t('settings.profile.saved') });
    router.refresh();
  }

  return (
    <Card as="section" aria-labelledby="profile-title" className="gap-4 p-5 sm:p-6">
      <h2 id="profile-title" className="text-lg leading-snug font-bold text-ink">
        {t('settings.profile.title')}
      </h2>
      <form ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <FormField
          label={t('settings.profile.name')}
          hint={t('settings.profile.nameHint')}
          error={errors.name}
          required
        >
          <Input
            name="name"
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
            maxLength={CONTENT_LIMITS.schoolNameMaxChars}
            autoComplete="organization"
            disabled={pending}
          />
        </FormField>
        <FormField label={t('settings.profile.city')} error={errors.city} optional>
          <Input
            name="city"
            value={values.city}
            onChange={(event) => setValues({ ...values, city: event.target.value })}
            maxLength={CONTENT_LIMITS.cityChars}
            autoComplete="address-level2"
            disabled={pending}
          />
        </FormField>
        <dl className="flex flex-col gap-1">
          <dt className="text-sm font-semibold text-ink">{t('settings.profile.country')}</dt>
          <dd className="text-ink">{countryName}</dd>
          <dd className="text-sm text-ink-muted">{t('settings.profile.countryHint')}</dd>
        </dl>
        <FormField
          label={t('settings.profile.language')}
          hint={t('settings.profile.languageHint')}
          error={errors.defaultLocale}
        >
          <Select
            name="defaultLocale"
            value={values.defaultLocale}
            onChange={(event) =>
              setValues({ ...values, defaultLocale: event.target.value as Locale })
            }
            options={LOCALES.map((locale) => ({ value: locale, label: LOCALE_LABELS[locale] }))}
            disabled={pending}
          />
        </FormField>
        {formError !== null && (
          <div ref={alertRef} tabIndex={-1} className="outline-none">
            <Alert tone="danger">{formError}</Alert>
          </div>
        )}
        <div>
          <Button ref={submitRef} type="submit" loading={pending}>
            {t('settings.profile.submit')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
