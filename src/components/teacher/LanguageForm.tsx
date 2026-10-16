'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { updateProfileAction } from '@/actions/settings';
import {
  focusedElement,
  settleAndRestoreFocus,
  stillThere,
} from '@/components/classes/focus';
import { useActionErrorMessage } from '@/components/classes/use-action-error';
import { Button, Card, FormField, Select, useToast } from '@/components/ui';
import { LOCALE_LABELS, LOCALES } from '@/lib/i18n/config';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import type { ActionResult } from '@/types/actions';
import type { Locale } from '@/types/common';

export interface LanguageFormProps {
  /** The saved preference (`session.locale`). */
  locale: Locale;
}

/** The language RoboHolic uses for the teacher; saving it also switches the interface. */
export function LanguageForm({ locale: saved }: LanguageFormProps) {
  const t = useTranslations('teacher');
  const tErrors = useTranslations('errors');
  const current = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const submitRef = useRef<HTMLButtonElement>(null);
  const [locale, setLocale] = useState<Locale>(saved);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    // The select or the button: both are disabled while saving, which drops the focus to
    // <body>; it comes back once they are enabled again (7.3). A new language loads the page
    // again in that language, so the focus starts from the top there.
    const focused = focusedElement();
    setPending(true);
    let result: ActionResult<unknown>;
    try {
      result = await updateProfileAction({ locale });
    } catch {
      result = { ok: false, error: { code: 'internal' } };
    }
    if (!result.ok) {
      // The interface language does not change.
      if (result.error.code === 'unauthenticated') {
        toast({ tone: 'danger', title: tErrors('unauthenticated') });
        router.refresh();
      } else {
        toast({ tone: 'danger', title: errorMessage(result.error) });
      }
    } else {
      toast({ tone: 'success', title: t('settings.language.saved') });
      if (locale !== current) router.replace(pathname, { locale });
      router.refresh();
    }
    settleAndRestoreFocus(
      () => setPending(false),
      () => stillThere(focused, submitRef.current),
    );
  }

  return (
    <Card as="section" aria-labelledby="language-title" className="gap-4 p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 id="language-title" className="text-lg leading-snug font-bold text-ink">
          {t('settings.language.title')}
        </h2>
        <p className="text-sm text-ink-muted">{t('settings.language.description')}</p>
      </div>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormField label={t('settings.language.label')}>
          <Select
            name="locale"
            value={locale}
            onChange={(event) => setLocale(event.target.value as Locale)}
            disabled={pending}
          >
            {LOCALES.map((option) => (
              <option key={option} value={option} lang={option}>
                {LOCALE_LABELS[option]}
              </option>
            ))}
          </Select>
        </FormField>
        <div>
          <Button ref={submitRef} type="submit" variant="secondary" loading={pending}>
            {t('settings.language.submit')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
