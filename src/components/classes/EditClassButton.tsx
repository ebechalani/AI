'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { updateClassAction } from '@/actions/classes';
import { Button, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError } from '@/types/actions';
import type { SchoolClass } from '@/types/school';
import { ClassFormDialog } from './ClassFormDialog';
import { MAIN_CONTENT_ID } from './focus';
import { useActionErrorMessage } from './use-action-error';
import { useFocusAfterClose } from './use-focus-after-close';

export interface EditClassButtonProps {
  cls: Pick<SchoolClass, 'id' | 'name' | 'gradeLabel' | 'ageBand' | 'schoolId'>;
}

/** Rename the class, or change its grade or age group (never the join code from here). */
export function EditClassButton({ cls }: EditClassButtonProps) {
  const t = useTranslations('classes');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const focusLater = useFocusAfterClose(open);

  /**
   * The class was archived or is gone: the refresh takes this button, and the dialog with it,
   * off the page. So the dialog closes first, the message goes to a toast (it lives in the
   * layout), and the focus to `<main>`, before the refresh.
   */
  function leave(error: ActionError): boolean {
    if (error.code !== 'conflict' && error.code !== 'not_found') return false;
    toast(
      error.code === 'conflict'
        ? { tone: 'warning', title: t('errors.archived') }
        : { tone: 'danger', title: t('errors.classGone') },
    );
    focusLater(MAIN_CONTENT_ID);
    setOpen(false);
    router.refresh();
    return true;
  }

  function errorText(error: ActionError): string {
    switch (error.code) {
      case 'unauthenticated':
        router.refresh();
        return tErrors('unauthenticated');
      default:
        return errorMessage(error);
    }
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          setSession((value) => value + 1);
          setOpen(true);
        }}
      >
        <Pencil aria-hidden="true" />
        {t('edit.action')}
      </Button>
      <ClassFormDialog
        key={session}
        open={open}
        onClose={() => setOpen(false)}
        title={t('edit.title')}
        submitLabel={t('edit.submit')}
        initialValues={{ name: cls.name, gradeLabel: cls.gradeLabel ?? '', ageBand: cls.ageBand }}
        schoolless={cls.schoolId === null}
        errorText={errorText}
        save={async (payload) => {
          const result = await updateClassAction({ classId: cls.id, ...payload });
          if (!result.ok) return leave(result.error) ? null : result.error;
          setOpen(false);
          toast({ tone: 'success', title: t('edit.success') });
          router.refresh();
          return null;
        }}
      />
    </>
  );
}
