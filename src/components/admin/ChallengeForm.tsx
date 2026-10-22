'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useLocale, useTimeZone, useTranslations } from 'next-intl';
import { upsertChallengeAction } from '@/actions/admin';
import { Alert, Button, Card, CardBody, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { challengeInputSchema } from '@/lib/schemas/admin';
import { parseInput } from '@/lib/schemas/common';
import type { ActionError, ActionResult } from '@/types/actions';
import type { ChallengeStatus } from '@/types/challenge';
import type { IsoDateString, Locale, MediaRef } from '@/types/common';
import type { ChallengeErrors, PlatformChoice } from './challenge-fields';
import {
  challengePayload,
  claimsChallengePath,
  emptyChallenge,
  type ChallengeFormValues,
} from './challenge-model';
import { ChallengeBasicsFields } from './ChallengeBasicsFields';
import { ChallengeCoverField } from './ChallengeCoverField';
import { ChallengeDatesFields } from './ChallengeDatesFields';
import { ChallengeEntryFields } from './ChallengeEntryFields';
import { ChallengeHardwareFields } from './ChallengeHardwareFields';
import { ChallengeTextFields } from './ChallengeTextFields';
import { safeTimeZone } from './dates';
import { unprefixFieldErrors } from './field-errors';
import { settleAndRestoreFocus, showErrorsAndFocus } from './focus';
import { adminChallengePath } from './paths';
import type { SchoolChoice } from './school-model';
import { useActionErrorMessage, useValidationMessage } from './use-action-error';

export interface ChallengeFormProps {
  mode: 'create' | 'edit';
  challengeId: string | null;
  status: ChallengeStatus | null;
  /** The stored challenge's values; null for a new one. */
  initial: ChallengeFormValues | null;
  schools: SchoolChoice[];
  platforms: PlatformChoice[];
  currentCover: MediaRef | null;
  /** The server's clock, so the defaults of a new challenge render the same on both sides. */
  now: IsoDateString;
}

/**
 * The challenge editor (ARCHITECTURE.md 6.7): six sections, validated with the shared schema
 * before `upsertChallengeAction`. A create opens the new draft's page; an edit stays, keeping
 * the form's state across the refresh (a status change made meanwhile never discards edits).
 */
export function ChallengeForm({
  mode,
  challengeId,
  status,
  initial,
  schools,
  platforms,
  currentCover,
  now,
}: ChallengeFormProps) {
  const t = useTranslations('admin');
  const tErrors = useTranslations('errors');
  const locale = useLocale() as Locale;
  const tz = safeTimeZone(useTimeZone());
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const validationMessage = useValidationMessage();
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const [values, setValues] = useState<ChallengeFormValues>(
    () => initial ?? emptyChallenge(now, tz, locale),
  );
  const [cover, setCover] = useState<MediaRef | null>(currentCover);
  const [errors, setErrors] = useState<ChallengeErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const coverIsNew =
    values.coverImageFileId !== null && values.coverImageFileId !== currentCover?.fileId;

  function messageFor(path: string, key: string | undefined): string | undefined {
    if (path === 'schoolId' && key === 'invalid_choice') return t('challenges.form.errors.school');
    if (path === 'hardwarePlatformIds' && key === 'invalid_choice') {
      return t('challenges.form.errors.platforms');
    }
    if (path === 'coverImageFileId') return t('challenges.form.errors.cover');
    return validationMessage(key);
  }

  function showFieldErrors(fieldErrors: Record<string, string[]>) {
    const next: ChallengeErrors = {};
    let unknown = false;
    for (const [path, keys] of Object.entries(unprefixFieldErrors(fieldErrors, 'input.'))) {
      if (!claimsChallengePath(path)) {
        unknown = true;
        continue;
      }
      // `rubric.2.weight` and `rubric` both show under the rubric; a list's item errors
      // (`hardwarePlatformIds.0`) under their list.
      const field = path.startsWith('translations.') ? path : (path.split('.')[0] ?? path);
      next[field] ??= messageFor(field, keys[0]) ?? '';
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
    const show = (message: string) =>
      showErrorsAndFocus(() => setFormError(message), null, () => alertRef.current);
    switch (error.code) {
      case 'validation':
        showFieldErrors(error.fieldErrors ?? { _form: ['invalid'] });
        return;
      case 'not_found':
        show(t('challenges.form.errors.notFound'));
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
    const parsed = parseInput(challengeInputSchema, challengePayload(values, tz));
    if (!parsed.success) {
      showFieldErrors(parsed.fieldErrors);
      return;
    }
    setErrors({});
    setFormError(null);
    setPending(true);
    let result: ActionResult<{ challengeId: string }>;
    try {
      result = await upsertChallengeAction({ challengeId, input: parsed.data });
    } catch {
      result = { ok: false, error: { code: 'internal' } };
    }
    if (!result.ok) {
      setPending(false);
      report(result.error);
      return;
    }
    if (mode === 'create') {
      // The new draft's page replaces this one: the button stays busy until it does.
      toast({ tone: 'success', title: t('challenges.form.created') });
      router.replace(adminChallengePath(result.data.challengeId));
      router.refresh();
      return;
    }
    settleAndRestoreFocus(
      () => setPending(false),
      () => submitRef.current,
    );
    toast({ tone: 'success', title: t('challenges.form.saved') });
    router.refresh();
  }

  const fields = { values, onChange: setValues, errors, disabled: pending };

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="flex max-w-4xl flex-col gap-6">
      <Card as="section">
        <CardBody>
          <ChallengeBasicsFields {...fields} schools={schools} />
        </CardBody>
      </Card>
      <Card as="section">
        <CardBody>
          <ChallengeDatesFields {...fields} timeZone={tz} />
        </CardBody>
      </Card>
      <Card as="section">
        <CardBody>
          <ChallengeEntryFields {...fields} />
        </CardBody>
      </Card>
      <Card as="section">
        <CardBody>
          <ChallengeHardwareFields {...fields} platforms={platforms} />
        </CardBody>
      </Card>
      <Card as="section">
        <CardBody>
          <ChallengeCoverField
            cover={values.coverImageFileId === null ? null : cover}
            isNew={coverIsNew}
            error={errors.coverImageFileId}
            disabled={pending}
            onUploaded={({ file, media }) => {
              setValues({ ...values, coverImageFileId: file.fileId });
              setCover(media);
            }}
            onRemove={() => {
              setValues({ ...values, coverImageFileId: null });
              setCover(null);
            }}
          />
        </CardBody>
      </Card>
      <Card as="section">
        <CardBody>
          <ChallengeTextFields {...fields} />
        </CardBody>
      </Card>
      {status === 'published' && (
        <Alert tone="info" live="off">
          {t('challenges.form.publishedHint')}
        </Alert>
      )}
      {formError !== null && (
        <div ref={alertRef} tabIndex={-1} className="outline-none">
          <Alert tone="danger">{formError}</Alert>
        </div>
      )}
      <div>
        <Button ref={submitRef} type="submit" size="lg" loading={pending}>
          {t(mode === 'create' ? 'challenges.form.submitCreate' : 'challenges.form.submitEdit')}
        </Button>
      </div>
    </form>
  );
}
