'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { addStudentsAction } from '@/actions/classes';
import { Alert, Button, Dialog, FormField, Select, Textarea } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { addStudentsInputSchema } from '@/lib/schemas/class';
import { parseInput } from '@/lib/schemas/common';
import type { ActionError } from '@/types/actions';
import type { AgeBand } from '@/types/common';
import { parseStudentNames, studentLineErrors, type StudentCredential } from './class-model';
import { DIALOG_TEXT } from './dialog';
import { showErrorsAndFocus } from './focus';
import { useActionErrorMessage, useValidationMessage } from './use-action-error';

export interface AddStudentsFormProps {
  open: boolean;
  /**
   * `stale`: a failure may have changed the class (some accounts created, the class full,
   * archived or gone); the owner refreshes the page now that the message has been read.
   */
  onClose: (stale: boolean) => void;
  classId: string;
  className: string;
  allowedBands: AgeBand[];
  defaultBand: AgeBand;
  capacityLeft: number;
  /** After a success, with the only copy of the passwords. */
  onCreated: (credentials: StudentCredential[]) => void;
}

/**
 * The add-students dialog: one name per line and an age group. The owner mounts it with a new
 * `key` for every opening, so the names start empty each time.
 */
export function AddStudentsForm({
  open,
  onClose,
  classId,
  className,
  allowedBands,
  defaultBand,
  capacityLeft,
  onCreated,
}: AddStudentsFormProps) {
  const t = useTranslations('classes');
  const tCommon = useTranslations('common');
  const tDomain = useTranslations('domain');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const errorMessage = useActionErrorMessage();
  const validationMessage = useValidationMessage();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('');
  const [ageBand, setAgeBand] = useState<AgeBand>(defaultBand);
  const [namesError, setNamesError] = useState<string | undefined>(undefined);
  const [problems, setProblems] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [stale, setStale] = useState(false);
  const names = parseStudentNames(text);
  const close = () => onClose(stale);

  function showProblems(list: string[], fieldError?: string) {
    showErrorsAndFocus(
      () => {
        setNamesError(fieldError);
        setProblems(list);
      },
      formRef.current,
      () => errorRef.current,
    );
  }

  /** The schema's errors, by line of the names typed, then those of the form as a whole. */
  function validationProblems(fieldErrors: Record<string, string[]>): string[] {
    const { form, lines } = studentLineErrors(fieldErrors);
    return [
      ...lines.map(({ line, keys }) =>
        t('addStudents.lineError', {
          line,
          name: names[line - 1] ?? '',
          message: validationMessage(keys[0]) ?? '',
        }),
      ),
      ...form.map((key) => validationMessage(key) ?? ''),
    ];
  }

  function report(error: ActionError) {
    if (error.code === 'validation' && error.fieldErrors !== undefined) {
      showProblems(validationProblems(error.fieldErrors));
      return;
    }
    const messages: Partial<Record<ActionError['code'], string>> = {
      forbidden: t('addStudents.errors.forbidden'),
      conflict: t('addStudents.errors.conflict'),
      not_found: t('errors.classGone'),
      internal: t('addStudents.errors.partial'),
      unauthenticated: tErrors('unauthenticated'),
    };
    showProblems([messages[error.code] ?? errorMessage(error)]);
    if (error.code === 'unauthenticated') {
      router.refresh();
    } else if (error.code in messages) {
      // No credentials to show: the roster and the card will show what exists now. Not yet,
      // though: a class that became full (or blocked, archived, gone) no longer renders the
      // button that owns this dialog, and the refresh would take the message away with it.
      setStale(true);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (names.length === 0) {
      showProblems([], t('addStudents.errors.noNames'));
      return;
    }
    if (names.length > capacityLeft) {
      showProblems([], t('addStudents.errors.tooMany', { max: capacityLeft }));
      return;
    }
    const input = { classId, students: names.map((displayName) => ({ displayName, ageBand })) };
    const parsed = parseInput(addStudentsInputSchema, input);
    if (!parsed.success) {
      showProblems(validationProblems(parsed.fieldErrors));
      return;
    }
    setNamesError(undefined);
    setProblems([]);
    setPending(true);
    try {
      const result = await addStudentsAction(input);
      setPending(false);
      if (!result.ok) {
        report(result.error);
        return;
      }
      onCreated(result.data.credentials);
    } catch {
      setPending(false);
      report({ code: 'internal' });
    }
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={t('addStudents.dialogTitle', { className })}
      size="lg"
      className={DIALOG_TEXT}
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending}>
            {tCommon('actions.cancel')}
          </Button>
          <Button type="submit" form={formId} loading={pending}>
            {t('addStudents.submit', { count: names.length })}
          </Button>
        </>
      }
    >
      <form id={formId} ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <FormField label={t('addStudents.names')} hint={t('addStudents.namesHint')} error={namesError}>
            <Textarea
              name="names"
              rows={8}
              value={text}
              onChange={(event) => setText(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              disabled={pending}
              data-autofocus
            />
          </FormField>
          {/* Not a live region: it would be read out on every keystroke. */}
          <p className="text-sm text-ink-muted">
            {t('addStudents.namesCount', { count: names.length, max: capacityLeft })}
          </p>
        </div>
        <FormField label={t('addStudents.ageBand')}>
          <Select
            name="ageBand"
            value={ageBand}
            onChange={(event) => setAgeBand(event.target.value as AgeBand)}
            disabled={pending || allowedBands.length === 1}
            options={allowedBands.map((band) => ({
              value: band,
              label: tDomain(`ageBands.${band}`),
            }))}
          />
        </FormField>
        {problems.length > 0 && (
          <div ref={errorRef} tabIndex={-1} className="outline-none">
            <Alert tone="danger">
              {problems.length === 1 ? (
                problems[0]
              ) : (
                <ul className="list-disc ps-5">
                  {problems.map((problem, index) => (
                    <li key={index}>{problem}</li>
                  ))}
                </ul>
              )}
            </Alert>
          </div>
        )}
        {pending && (
          <p role="status" className="text-sm text-ink-muted">
            {t('addStudents.creating')}
          </p>
        )}
      </form>
    </Dialog>
  );
}
