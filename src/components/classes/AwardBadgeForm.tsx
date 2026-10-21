'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Award } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { awardBadgeAction } from '@/actions/classes';
import { Button, Card, CardTitle, FormField, Select, Textarea, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { CONTENT_LIMITS } from '@/lib/limits';
import { awardBadgeInputSchema } from '@/lib/schemas/class';
import { parseInput } from '@/lib/schemas/common';
import type { ActionError, ActionResult } from '@/types/actions';
import {
  focusedElement,
  settleAndRestoreFocus,
  showErrorsAndFocus,
  stillThere,
} from './focus';
import { useActionErrorMessage, useValidationMessage } from './use-action-error';

export interface AwardBadgeFormProps {
  studentUid: string;
  studentName: string;
  /** Active manual badges in `order`, names resolved by the page. */
  options: { id: string; name: string; held: boolean }[];
}

type Field = 'badgeId' | 'note';

const TITLE_ID = 'award-badge-title';

/**
 * The whole card in every state, so it stays mounted when a refresh turns the form into the
 * "already has every badge" text (the seed's only manual badge always does).
 */
export function AwardBadgeForm({ studentUid, studentName, options }: AwardBadgeFormProps) {
  const t = useTranslations('classes');
  const tErrors = useTranslations('errors');
  const tValidation = useTranslations('validation');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const validationMessage = useValidationMessage();
  const formRef = useRef<HTMLFormElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const [badgeId, setBadgeId] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [pending, setPending] = useState(false);
  const allHeld = options.length > 0 && options.every((option) => option.held);

  function showFieldErrors(fieldErrors: Record<string, string[]>) {
    showErrorsAndFocus(
      () =>
        setErrors({
          badgeId: validationMessage(fieldErrors.badgeId?.[0]),
          note: validationMessage(fieldErrors.note?.[0]),
        }),
      formRef.current,
    );
  }

  function report(error: ActionError) {
    switch (error.code) {
      case 'validation':
        if (error.fieldErrors !== undefined) showFieldErrors(error.fieldErrors);
        else toast({ tone: 'danger', title: errorMessage(error) });
        return;
      case 'conflict':
        toast({ tone: 'warning', title: t('badge.errors.conflict') });
        router.refresh();
        return;
      case 'not_found':
        toast({ tone: 'danger', title: t('badge.errors.notFound') });
        router.refresh();
        return;
      case 'unauthenticated':
        toast({ tone: 'danger', title: tErrors('unauthenticated') });
        router.refresh();
        return;
      default:
        toast({ tone: 'danger', title: errorMessage(error) });
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    // Checked first: the schema answers `invalid` for an empty id.
    if (badgeId === '') {
      showErrorsAndFocus(() => setErrors({ badgeId: tValidation('required') }), formRef.current);
      return;
    }
    const input = { studentUid, badgeId, note: note.trim() === '' ? null : note };
    const parsed = parseInput(awardBadgeInputSchema, input);
    if (!parsed.success) {
      showFieldErrors(parsed.fieldErrors);
      return;
    }
    setErrors({});
    // The fields and the button are disabled while saving, which drops the focus to <body>.
    const focused = focusedElement();
    setPending(true);
    let result: ActionResult<{ awarded: boolean }>;
    try {
      result = await awardBadgeAction(input);
    } catch {
      result = { ok: false, error: { code: 'internal' } };
    }
    if (!result.ok) {
      // Enabled again first: a field error then takes the focus, else it comes back (7.3).
      settleAndRestoreFocus(
        () => setPending(false),
        () => stillThere(focused, submitRef.current),
      );
      report(result.error);
      return;
    }
    const badge = options.find((option) => option.id === badgeId)?.name ?? '';
    if (result.data.awarded) {
      toast({ tone: 'success', title: t('badge.awarded', { badge, name: studentName }) });
      setBadgeId('');
      setNote('');
      setPending(false);
      // The form may be gone after the refresh: the card's heading keeps the focus.
      document.getElementById(TITLE_ID)?.focus();
    } else {
      toast({ tone: 'info', title: t('badge.alreadyHeld', { name: studentName }) });
      settleAndRestoreFocus(
        () => setPending(false),
        () => stillThere(focused, submitRef.current),
      );
    }
    router.refresh();
  }

  let body;
  if (options.length === 0) {
    body = <p className="text-sm text-ink-muted">{t('badge.noneAvailable')}</p>;
  } else if (allHeld) {
    body = <p className="text-sm text-ink-muted">{t('badge.allHeld', { name: studentName })}</p>;
  } else {
    body = (
      <form ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormField label={t('badge.badge')} error={errors.badgeId} required>
          <Select
            name="badgeId"
            value={badgeId}
            onChange={(event) => setBadgeId(event.target.value)}
            disabled={pending}
            placeholder={t('badge.placeholder')}
            options={options.map((option) => ({
              value: option.id,
              label: option.held ? t('badge.held', { badge: option.name }) : option.name,
              disabled: option.held,
            }))}
          />
        </FormField>
        <FormField
          label={t('badge.note')}
          hint={t('badge.noteHint', { max: CONTENT_LIMITS.badgeNoteChars })}
          error={errors.note}
          optional
        >
          <Textarea
            name="note"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={CONTENT_LIMITS.badgeNoteChars}
            disabled={pending}
          />
        </FormField>
        <div>
          <Button ref={submitRef} type="submit" variant="secondary" loading={pending}>
            {!pending && <Award aria-hidden="true" />}
            {t('badge.submit')}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <Card className="gap-3 p-5 sm:p-6">
      <CardTitle
        as="h2"
        id={TITLE_ID}
        tabIndex={-1}
        className="rounded-sm text-lg"
      >
        {t('badge.title')}
      </CardTitle>
      <p className="text-sm text-ink-muted">{t('badge.description', { name: studentName })}</p>
      {body}
    </Card>
  );
}
