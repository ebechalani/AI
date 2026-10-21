'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { updateProfileAction } from '@/actions/settings';
import { Button, RadioGroup, useToast } from '@/components/ui';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { LOCALE_LABELS, LOCALES } from '@/lib/i18n/config';
import type { ActionError } from '@/types/actions';
import type { Locale } from '@/types/common';
import { languagePlan } from './settings-model';
import { useActionErrorMessage, useValidationMessage } from './use-action-error';
import { useRefocusAfterPending } from './use-refocus';

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export interface LanguageFormProps {
  /** The language saved in the profile. */
  current: Locale;
}

/**
 * The language of the pages: saved in the profile, and the pages switch to it at once. It starts
 * on the language the page is in, so the form never contradicts the screen; when the profile
 * holds another one, a hint says which, and saving stores the one chosen.
 */
export function LanguageForm({ current }: LanguageFormProps) {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const pageLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const validationMessage = useValidationMessage();
  const [selected, setSelected] = useState<Locale>(isLocale(pageLocale) ? pageLocale : current);
  const [error, setError] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();
  // Saved without switching the page: the button keeps the focus. A switch loads the page again.
  const saveRef = useRef<HTMLButtonElement>(null);
  useRefocusAfterPending(saveRef, pending);

  function report(failure: ActionError) {
    switch (failure.code) {
      case 'validation':
        setError(validationMessage(failure.fieldErrors?.locale?.[0] ?? 'invalid'));
        return;
      case 'unauthenticated':
        toast({ tone: 'danger', title: tErrors('unauthenticated') });
        router.refresh();
        return;
      default:
        toast({ tone: 'danger', title: errorMessage(failure) });
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(undefined);
    const plan = languagePlan(selected, current, pageLocale);
    if (!plan.persist && plan.switchTo === null) {
      toast({ tone: 'info', title: t('language.noChanges') });
      return;
    }
    setPending(true);
    if (plan.persist) {
      try {
        const result = await updateProfileAction({ locale: selected });
        if (!result.ok) {
          setPending(false);
          report(result.error);
          return;
        }
      } catch {
        setPending(false);
        report({ code: 'internal' });
        return;
      }
    }
    if (plan.switchTo !== null) {
      // The page loads again in the new language, which is the confirmation; the button keeps
      // its spinner until then.
      router.replace(pathname, { locale: plan.switchTo });
      return;
    }
    setPending(false);
    toast({ tone: 'success', title: t('language.saved') });
    startTransition(() => router.refresh());
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      <RadioGroup
        legend={t('language.legend')}
        hideLegend
        name="locale"
        value={selected}
        onValueChange={(value) => {
          if (isLocale(value)) setSelected(value);
        }}
        options={LOCALES.map((code) => ({
          value: code,
          label: <span lang={code}>{LOCALE_LABELS[code]}</span>,
        }))}
        hint={
          current !== pageLocale
            ? t.rich('language.stored', {
                language: LOCALE_LABELS[current],
                lang: (chunks) => <span lang={current}>{chunks}</span>,
              })
            : undefined
        }
        error={error}
      />
      <div>
        <Button ref={saveRef} type="submit" loading={pending}>
          {tCommon('actions.save')}
        </Button>
      </div>
    </form>
  );
}
