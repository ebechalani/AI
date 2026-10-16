'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { unassignCourseAction } from '@/actions/classes';
import { Button, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError } from '@/types/actions';
import { ConfirmDialog } from './ConfirmDialog';
import { MAIN_CONTENT_ID } from './focus';
import { useActionErrorMessage } from './use-action-error';
import { useFocusAfterClose } from './use-focus-after-close';

export interface UnassignCourseButtonProps {
  classId: string;
  className: string;
  courseId: string;
  courseTitle: string;
}

/** Unassigns a course from the class; every enrollment and its progress stays. */
export function UnassignCourseButton({
  classId,
  className,
  courseId,
  courseTitle,
}: UnassignCourseButtonProps) {
  const t = useTranslations('classes');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const focusLater = useFocusAfterClose(open);

  function report(failure: ActionError) {
    switch (failure.code) {
      // The refresh takes this row (or the whole class) off the page, the dialog with it: close
      // first, then the message as a toast and the focus on <main>.
      case 'not_found':
      case 'forbidden':
        toast({
          tone: 'danger',
          title: failure.code === 'not_found' ? t('errors.classGone') : tErrors('forbidden'),
        });
        focusLater(MAIN_CONTENT_ID);
        setOpen(false);
        router.refresh();
        return;
      case 'unauthenticated':
        setError(tErrors('unauthenticated'));
        router.refresh();
        return;
      default:
        setError(errorMessage(failure));
    }
  }

  async function confirm() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await unassignCourseAction({ classId, courseId });
      if (!result.ok) {
        report(result.error);
        return;
      }
      toast({ tone: 'success', title: t('unassign.success', { course: courseTitle }) });
      // The row disappears with the refresh.
      focusLater('assigned-courses-title');
      setOpen(false);
      router.refresh();
    } catch {
      report({ code: 'internal' });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        aria-label={t('unassign.actionLabel', { course: courseTitle })}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {t('unassign.action')}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title={t('unassign.title', { course: courseTitle })}
        description={t('unassign.description', { className })}
        confirmLabel={t('unassign.confirm')}
        confirmVariant="danger"
        pending={pending}
        error={error}
        onConfirm={confirm}
      />
    </>
  );
}
