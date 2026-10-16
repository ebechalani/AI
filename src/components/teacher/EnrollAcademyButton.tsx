'use client';

import { useRef, useState } from 'react';
import { Rocket } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { enrollInCourseAction } from '@/actions/learning';
import { settleAndRestoreFocus } from '@/components/classes/focus';
import { useActionErrorMessage } from '@/components/classes/use-action-error';
import { Button, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError } from '@/types/actions';
import { lessonPath } from './paths';

export interface EnrollAcademyButtonProps {
  courseId: string;
}

/** Enrols the teacher in a Teacher Academy course (idempotent) and opens the first lesson. */
export function EnrollAcademyButton({ courseId }: EnrollAcademyButtonProps) {
  const t = useTranslations('teacher');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState(false);

  function report(error: ActionError) {
    switch (error.code) {
      case 'conflict':
        toast({ tone: 'warning', title: t('course.academyPanel.errors.conflict') });
        router.refresh();
        return;
      case 'forbidden':
        toast({ tone: 'danger', title: t('course.academyPanel.errors.forbidden') });
        return;
      case 'license_required':
        toast({ tone: 'warning', title: tErrors('license_required') });
        router.refresh();
        return;
      case 'not_found':
        toast({ tone: 'danger', title: t('course.academyPanel.errors.notFound') });
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

  async function enroll() {
    if (pending) return;
    setPending(true);
    try {
      const result = await enrollInCourseAction({ courseId });
      if (!result.ok) {
        report(result.error);
        // The loading button was disabled, which dropped the focus: it takes it back (7.3).
        settleAndRestoreFocus(() => setPending(false), () => buttonRef.current);
        return;
      }
      const { firstLessonId } = result.data;
      if (firstLessonId !== null) {
        // The spinner stays until the lesson page replaces this one.
        router.push(lessonPath(courseId, firstLessonId));
        router.refresh();
        return;
      }
      toast({ tone: 'success', title: t('course.academyPanel.enrolled') });
      // The refresh replaces this button with the progress state.
      document.getElementById('academy-panel-title')?.focus();
      setPending(false);
      router.refresh();
    } catch {
      report({ code: 'internal' });
      settleAndRestoreFocus(() => setPending(false), () => buttonRef.current);
    }
  }

  return (
    <Button ref={buttonRef} size="lg" fullWidth loading={pending} onClick={enroll}>
      {!pending && <Rocket aria-hidden="true" />}
      {t('course.academyPanel.enroll')}
    </Button>
  );
}
