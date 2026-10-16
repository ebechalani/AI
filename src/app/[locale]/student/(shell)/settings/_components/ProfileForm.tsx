'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { updateProfileAction } from '@/actions/settings';
import { Alert, Button, FormField, Input, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { CONTENT_LIMITS } from '@/lib/limits';
import { parseInput } from '@/lib/schemas/common';
import { profilePatchSchema } from '@/lib/schemas/profile';
import type { ActionError } from '@/types/actions';
import { AvatarPicker } from './AvatarPicker';
import { isEmptyPatch, profilePatch } from './settings-model';
import { useActionErrorMessage, useValidationMessage } from './use-action-error';
import { useRefocusAfterPending } from './use-refocus';

export interface ProfileFormProps {
  /** The saved values; the form compares its draft with them. */
  displayName: string;
  avatarId: string;
}

interface FieldErrors {
  displayName?: string;
  avatarId?: string;
}

/** Display name and avatar. Only what changed is sent. */
export function ProfileForm({ displayName, avatarId }: ProfileFormProps) {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const validationMessage = useValidationMessage();
  const [draft, setDraft] = useState({ displayName, avatarId });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState(false);
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);
  const avatarsRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);
  useRefocusAfterPending(saveRef, pending);

  /** Shows the field messages and focuses the first invalid control; true when any was shown. */
  function showFieldErrors(errors: Record<string, string[]> | undefined): boolean {
    const next: FieldErrors = {
      displayName: validationMessage(errors?.displayName?.[0]),
      avatarId: validationMessage(errors?.avatarId?.[0]),
    };
    setFieldErrors(next);
    if (next.displayName) nameRef.current?.focus();
    else if (next.avatarId) {
      avatarsRef.current?.querySelector<HTMLInputElement>('input:checked, input')?.focus();
    }
    return next.displayName !== undefined || next.avatarId !== undefined;
  }

  function report(error: ActionError) {
    switch (error.code) {
      case 'validation':
        if (!showFieldErrors(error.fieldErrors)) setFormError(true);
        return;
      case 'unauthenticated':
        toast({ tone: 'danger', title: tErrors('unauthenticated') });
        router.refresh();
        return;
      default:
        toast({ tone: 'danger', title: errorMessage(error) });
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFormError(false);
    const patch = profilePatch({ displayName, avatarId }, draft);
    if (isEmptyPatch(patch)) {
      setFieldErrors({});
      toast({ tone: 'info', title: t('profile.noChanges') });
      return;
    }
    // The action's own schema: an invalid name never leaves the browser.
    const parsed = parseInput(profilePatchSchema, patch);
    if (!parsed.success) {
      if (!showFieldErrors(parsed.fieldErrors)) setFormError(true);
      return;
    }
    setFieldErrors({});
    setPending(true);
    try {
      const result = await updateProfileAction(parsed.data);
      setPending(false);
      if (!result.ok) {
        report(result.error);
        return;
      }
      toast({ tone: 'success', title: t('profile.saved') });
      // The top bar's name and avatar come from the session, read again on refresh; the new
      // props then equal the draft, so the form is clean without a reset.
      startTransition(() => router.refresh());
    } catch {
      setPending(false);
      report({ code: 'internal' });
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      {formError && <Alert tone="danger">{t('errors.form')}</Alert>}
      <FormField
        label={t('profile.name.label')}
        hint={t('profile.name.hint', {
          min: CONTENT_LIMITS.displayNameMinChars,
          max: CONTENT_LIMITS.displayNameMaxChars,
        })}
        required
        error={fieldErrors.displayName}
      >
        <Input
          ref={nameRef}
          name="displayName"
          autoComplete="nickname"
          maxLength={CONTENT_LIMITS.displayNameMaxChars}
          value={draft.displayName}
          onChange={(event) => {
            setDraft({ ...draft, displayName: event.target.value });
            // The message belongs to the value it was about.
            if (fieldErrors.displayName) setFieldErrors({ ...fieldErrors, displayName: undefined });
          }}
        />
      </FormField>
      <div ref={avatarsRef}>
        <AvatarPicker
          value={draft.avatarId}
          onChange={(id) => {
            setDraft({ ...draft, avatarId: id });
            if (fieldErrors.avatarId) setFieldErrors({ ...fieldErrors, avatarId: undefined });
          }}
          error={fieldErrors.avatarId}
        />
      </div>
      <div>
        <Button ref={saveRef} type="submit" loading={pending}>
          {tCommon('actions.saveChanges')}
        </Button>
      </div>
    </form>
  );
}
