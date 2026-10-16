'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createClassAction } from '@/actions/classes';
import { Button, useToast, type ButtonSize, type ButtonVariant } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError } from '@/types/actions';
import { ClassFormDialog } from './ClassFormDialog';
import { useActionErrorMessage } from './use-action-error';

export interface CreateClassButtonProps {
  /** session.schoolId === null: the age-group hint names the 13+ rule. */
  schoolless: boolean;
  /** The new class opens at `${classHrefBase}/${classId}`. */
  classHrefBase: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

/** "New class": a dialog with the class details, then the new class's page. */
export function CreateClassButton({
  schoolless,
  classHrefBase,
  variant,
  size,
  fullWidth,
}: CreateClassButtonProps) {
  const t = useTranslations('classes');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const [open, setOpen] = useState(false);
  // A new key for every opening: the fields start empty each time.
  const [session, setSession] = useState(0);

  function errorText(error: ActionError): string {
    if (error.code === 'conflict') return t('create.errors.conflict');
    if (error.code === 'unauthenticated') {
      router.refresh();
      return tErrors('unauthenticated');
    }
    return errorMessage(error);
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        onClick={() => {
          setSession((value) => value + 1);
          setOpen(true);
        }}
      >
        <Plus aria-hidden="true" />
        {t('create.action')}
      </Button>
      <ClassFormDialog
        key={session}
        open={open}
        onClose={() => setOpen(false)}
        title={t('create.title')}
        description={t('create.description')}
        submitLabel={t('create.submit')}
        initialValues={{ name: '', gradeLabel: '', ageBand: schoolless ? '13-15' : '11-12' }}
        schoolless={schoolless}
        errorText={errorText}
        save={async (payload) => {
          const result = await createClassAction(payload);
          if (!result.ok) return result.error;
          setOpen(false);
          toast({ tone: 'success', title: t('create.success', { name: payload.name.trim() }) });
          router.push(`${classHrefBase}/${result.data.classId}`);
          router.refresh();
          return null;
        }}
      />
    </>
  );
}
