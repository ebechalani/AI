import { useRef, useState, type RefObject } from 'react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/types/common';
import { showErrorsAndFocus } from './focus';
import { errorsPerLocale, localeOfPath, orderedErrorPaths } from './translations';
import { useValidationMessage } from './use-action-error';
import type { FormFailure } from './use-editor-action';

// Field errors of a form that edits several languages (5.6): the first error in reading order
// decides the language shown, its field takes the focus, and the form alert counts the problems
// left in the other language. Paths no field shows go to the form alert.

export interface FormErrorsOptions {
  formRef: RefObject<HTMLElement | null>;
  language: Locale;
  setLanguage(locale: Locale): void;
  /** Path prefixes in reading order. */
  order: readonly string[];
  /** Whether a field of the form shows this path. */
  isShown(path: string): boolean;
  /** A message other than the generic validation text for this path, or undefined. */
  message?(key: string | undefined, path: string): string | undefined;
}

export interface FormErrors {
  /** The message under the field of `path`. */
  errorFor(path: string): string | undefined;
  failure: FormFailure | null;
  /** "2 problems in French." for the languages not shown, or null. */
  otherLanguageNote: string | null;
  alertRef: RefObject<HTMLDivElement | null>;
  /** Shows a parse's (or the server's) field errors and moves the focus. */
  show(fieldErrors: Record<string, string[]>): void;
  /** Shows a failure in the form alert and focuses it. */
  fail(failure: FormFailure): void;
  clear(): void;
}

export function useFormErrors(options: FormErrorsOptions): FormErrors {
  const t = useTranslations('courseEditor');
  const tCommon = useTranslations('common');
  const validationMessage = useValidationMessage();
  const alertRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<FormFailure | null>(null);
  const { formRef, language, setLanguage, order, isShown, message } = options;

  function show(fieldErrors: Record<string, string[]>) {
    const paths = orderedErrorPaths(fieldErrors, order);
    const shown = paths.filter(isShown);
    const next: Record<string, string> = {};
    for (const path of shown) {
      const key = fieldErrors[path]?.[0];
      next[path] = message?.(key, path) ?? validationMessage(key) ?? '';
    }
    const firstLocale = shown[0] === undefined ? null : localeOfPath(shown[0]);
    const visible = firstLocale ?? language;
    const elsewhere = shown.some((path) => {
      const locale = localeOfPath(path);
      return locale !== null && locale !== visible;
    });
    const unmatched = shown.length < paths.length;
    showErrorsAndFocus(
      () => {
        if (firstLocale !== null) setLanguage(firstLocale);
        setErrors(next);
        setFailure(unmatched || elsewhere ? { message: t('errors.form'), sessionEnded: false } : null);
      },
      formRef.current,
      () => alertRef.current,
    );
  }

  function fail(next: FormFailure) {
    showErrorsAndFocus(() => setFailure(next), null, () => alertRef.current);
  }

  function clear() {
    setErrors({});
    setFailure(null);
  }

  const counts = errorsPerLocale(Object.keys(errors));
  const notes = Object.entries(counts)
    .filter(([locale, count]) => locale !== language && (count ?? 0) > 0)
    .map(([locale, count]) =>
      t('errors.otherLanguage', { count: count ?? 0, language: tCommon(`locale.names.${locale}`) }),
    );

  return {
    errorFor: (path) => errors[path],
    failure,
    otherLanguageNote: notes.length > 0 ? notes.join(' ') : null,
    alertRef,
    show,
    fail,
    clear,
  };
}
