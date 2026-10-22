'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { setUserRoleAction } from '@/actions/admin';
import { Alert, Button, Dialog, FormField, RadioGroup, Select, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { setUserRoleInputSchema } from '@/lib/schemas/admin';
import { parseInput } from '@/lib/schemas/common';
import type { ActionError, ActionResult } from '@/types/actions';
import type { Role } from '@/types/common';
import { DIALOG_TEXT } from './dialog';
import { showErrorsAndFocus } from './focus';
import { useSchoolChoices } from './school-choices';
import { useActionErrorMessage, useValidationMessage } from './use-action-error';
import { useFocusAfterClose } from './use-focus-after-close';
import {
  initialRoleChoice,
  isRoleUnchanged,
  roleChangeEffects,
  roleChangePayload,
  roleOptions,
  schoolRule,
  staffRolesAllowed,
  type RoleChoice,
  type UserRowData,
} from './user-model';

export interface ChangeRoleDialogProps {
  open: boolean;
  onClose: () => void;
  user: UserRowData;
  focusAfterRemovalId: string;
}

/**
 * A new role and school for an account, with what the change does spelled out before the
 * danger submit (ARCHITECTURE.md 11.2: destructive changes confirm first). Staff roles are
 * offered only to adult email accounts.
 */
export function ChangeRoleDialog({ open, onClose, user, focusAfterRemovalId }: ChangeRoleDialogProps) {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tDomain = useTranslations('domain');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const validationMessage = useValidationMessage();
  const schools = useSchoolChoices();
  const focusLater = useFocusAfterClose(open);
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const [choice, setChoice] = useState<RoleChoice>(() => initialRoleChoice(user));
  const [errors, setErrors] = useState<{ role?: string; schoolId?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [gone, setGone] = useState(false);

  const name = user.displayName;
  const rule = schoolRule(choice.role);
  const unchanged = isRoleUnchanged(user, choice);
  const effects = roleChangeEffects(user, choice);
  const schoolName = (id: string | null) =>
    id === null ? '' : (schools.find((school) => school.id === id)?.name ?? t('shared.unknownSchool'));
  const currentSchool = user.schoolId === null ? null : schoolName(user.schoolId);

  // The kit Dialog gives the initial focus to `[data-autofocus]`, which a RadioGroup's inputs
  // cannot carry: once the dialog has opened (its own effect runs showModal after this one), the
  // focus moves to the chosen role, the first field (ARCHITECTURE.md 7.3).
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLInputElement>('input[name="role"]:checked')?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  function close() {
    onClose();
    if (gone) router.refresh();
  }

  function showFieldErrors(fieldErrors: Record<string, string[]>) {
    const next: { role?: string; schoolId?: string } = {};
    let unknown = false;
    for (const [path, keys] of Object.entries(fieldErrors)) {
      if (path === 'role' || path === 'schoolId') next[path] = validationMessage(keys[0]);
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

  function report(error: ActionError) {
    const show = (message: string) =>
      showErrorsAndFocus(() => setFormError(message), null, () => alertRef.current);
    switch (error.code) {
      case 'validation':
        showFieldErrors(error.fieldErrors ?? { _form: ['invalid'] });
        return;
      case 'conflict':
        show(t('users.role.errors.conflict', { name }));
        return;
      case 'forbidden':
        show(t('users.role.errors.forbidden'));
        return;
      case 'not_found':
        setGone(true);
        show(t('users.role.errors.notFound'));
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
    if (pending || unchanged) return;
    const parsed = parseInput(setUserRoleInputSchema, roleChangePayload(user.id, choice));
    if (!parsed.success) {
      showFieldErrors(parsed.fieldErrors);
      return;
    }
    setErrors({});
    setFormError(null);
    setPending(true);
    let result: ActionResult<null>;
    try {
      result = await setUserRoleAction(parsed.data);
    } catch {
      result = { ok: false, error: { code: 'internal' } };
    }
    setPending(false);
    if (!result.ok) {
      report(result.error);
      return;
    }
    focusLater(focusAfterRemovalId);
    onClose();
    toast({
      tone: 'success',
      title: t('users.role.success', { name, role: tDomain(`roles.${parsed.data.role}`) }),
    });
    router.refresh();
  }

  const options = roleOptions(user).map(({ role, disabled }) => ({
    value: role,
    label: tDomain(`roles.${role}`),
    disabled,
  }));
  const schoolOptions = schools.map((school) => ({
    value: school.id,
    label: school.suspended
      ? t('shared.suspendedSchoolOption', { name: school.name })
      : t('shared.schoolOption', { name: school.name }),
  }));

  return (
    <Dialog
      open={open}
      onClose={close}
      title={t('users.role.title', { name })}
      description={
        currentSchool === null
          ? t('users.role.current', { role: tDomain(`roles.${user.role}`) })
          : t('users.role.currentWithSchool', { role: tDomain(`roles.${user.role}`), school: currentSchool })
      }
      size="md"
      className={DIALOG_TEXT}
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending}>
            {tCommon('actions.cancel')}
          </Button>
          <Button type="submit" form={formId} variant="danger" loading={pending} disabled={unchanged}>
            {t('users.role.submit')}
          </Button>
        </>
      }
    >
      <form id={formId} ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <RadioGroup
          legend={t('users.role.roleLegend')}
          name="role"
          options={options}
          value={choice.role}
          onValueChange={(value) => setChoice({ ...choice, role: value as Role })}
          hint={staffRolesAllowed(user) ? undefined : t('users.role.adultsOnly')}
          error={errors.role}
          disabled={pending}
        />
        {rule !== 'none' && (
          <FormField
            label={t('users.role.school')}
            hint={t(rule === 'required' ? 'users.role.schoolRequired' : 'users.role.schoolOptional')}
            error={errors.schoolId}
            required={rule === 'required'}
            optional={rule === 'optional'}
          >
            <Select
              name="schoolId"
              value={choice.schoolId ?? ''}
              onChange={(event) => setChoice({ ...choice, schoolId: event.target.value || null })}
              disabled={pending}
              placeholder={rule === 'required' ? tCommon('actions.select') : undefined}
              options={
                rule === 'optional'
                  ? [{ value: '', label: t('shared.noSchool') }, ...schoolOptions]
                  : schoolOptions
              }
            />
          </FormField>
        )}
        {unchanged ? (
          <p className="text-sm text-ink-muted">{t('users.role.unchanged')}</p>
        ) : (
          effects.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-ink">{t('users.role.effectsTitle')}</h3>
              <ul className="mt-1.5 list-disc space-y-1 ps-5 text-sm text-ink">
                {effects.map((effect) => (
                  <li key={effect}>
                    {t(`users.role.effects.${effect}`, {
                      name,
                      count: user.classIds.length,
                      school: schoolName(choice.schoolId),
                    })}
                  </li>
                ))}
              </ul>
            </div>
          )
        )}
        {formError !== null && (
          <div ref={alertRef} tabIndex={-1} className="outline-none">
            <Alert tone="danger">{formError}</Alert>
          </div>
        )}
      </form>
    </Dialog>
  );
}
