'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { updateProfileAction } from '@/actions/settings';
import {
  focusedElement,
  settleAndRestoreFocus,
  showErrorsAndFocus,
  stillThere,
} from '@/components/classes/focus';
import {
  useActionErrorMessage,
  useValidationMessage,
} from '@/components/classes/use-action-error';
import { Avatar, Button, Card, FormField, Input, RadioGroup, useToast } from '@/components/ui';
import { AVATAR_IDS } from '@/lib/avatars';
import { useRouter } from '@/lib/i18n/navigation';
import { CONTENT_LIMITS } from '@/lib/limits';
import { parseInput } from '@/lib/schemas/common';
import { profilePatchSchema } from '@/lib/schemas/profile';
import type { ActionError, ActionResult } from '@/types/actions';

export interface ProfileFormProps {
  displayName: string;
  avatarId: string;
}

type Field = 'displayName' | 'avatarId';

/** The teacher's name and avatar, as students and colleagues see them. */
export function ProfileForm({ displayName: initialName, avatarId: initialAvatar }: ProfileFormProps) {
  const t = useTranslations('teacher');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const validationMessage = useValidationMessage();
  const formRef = useRef<HTMLFormElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const [displayName, setDisplayName] = useState(initialName);
  const [avatarId, setAvatarId] = useState(initialAvatar);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [pending, setPending] = useState(false);

  function showFieldErrors(fieldErrors: Record<string, string[]>) {
    showErrorsAndFocus(
      () =>
        setErrors({
          displayName: validationMessage(fieldErrors.displayName?.[0]),
          avatarId: validationMessage(fieldErrors.avatarId?.[0]),
        }),
      formRef.current,
    );
  }

  function report(error: ActionError) {
    if (error.code === 'validation' && error.fieldErrors !== undefined) {
      showFieldErrors(error.fieldErrors);
      return;
    }
    if (error.code === 'unauthenticated') {
      toast({ tone: 'danger', title: tErrors('unauthenticated') });
      router.refresh();
      return;
    }
    // Includes not_implemented: the form stays as typed.
    toast({ tone: 'danger', title: errorMessage(error) });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const parsed = parseInput(profilePatchSchema, { displayName, avatarId });
    if (!parsed.success) {
      showFieldErrors(parsed.fieldErrors);
      return;
    }
    setErrors({});
    // The name field (Enter) or the button: both are disabled while saving, which drops the
    // focus to <body>; it comes back here once the form is enabled again (7.3).
    const focused = focusedElement();
    setPending(true);
    let result: ActionResult<unknown>;
    try {
      result = await updateProfileAction(parsed.data);
    } catch {
      result = { ok: false, error: { code: 'internal' } };
    }
    settleAndRestoreFocus(
      () => setPending(false),
      () => stillThere(focused, submitRef.current),
    );
    if (!result.ok) {
      // After the fields are enabled: a field error then takes the focus.
      report(result.error);
      return;
    }
    toast({ tone: 'success', title: t('settings.profile.saved') });
    // The top bar reads the session again.
    router.refresh();
  }

  return (
    <Card as="section" aria-labelledby="profile-title" className="gap-4 p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 id="profile-title" className="text-lg leading-snug font-bold text-ink">
          {t('settings.profile.title')}
        </h2>
        <p className="text-sm text-ink-muted">{t('settings.profile.description')}</p>
      </div>
      <form ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <FormField
          label={t('settings.profile.displayName')}
          hint={t('settings.profile.displayNameHint')}
          error={errors.displayName}
          required
        >
          <Input
            name="displayName"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={CONTENT_LIMITS.displayNameMaxChars}
            autoComplete="name"
            disabled={pending}
          />
        </FormField>
        <RadioGroup
          legend={t('settings.profile.avatar')}
          name="avatarId"
          orientation="horizontal"
          variant="card"
          value={avatarId}
          onValueChange={setAvatarId}
          error={errors.avatarId}
          disabled={pending}
          options={AVATAR_IDS.map((id) => ({
            value: id,
            label: (
              <span className="flex items-center gap-2">
                <Avatar avatarId={id} size="sm" />
                {t(`settings.avatars.${id}`)}
              </span>
            ),
          }))}
        />
        <div>
          <Button ref={submitRef} type="submit" loading={pending}>
            {t('settings.profile.submit')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
