'use client';

import { useState } from 'react';
import { Rocket } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { enrollInCourseAction } from '@/actions/learning';
import { Button, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError } from '@/types/actions';
import { lessonHref } from './course-model';
import { useActionErrorMessage } from './use-action-error';

export interface EnrollButtonProps {
  courseId: string;
}

/** Enrols the student (idempotent on the server) and opens the first lesson. */
export function EnrollButton({ courseId }: EnrollButtonProps) {
  const t = useTranslations('learn');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const [pending, setPending] = useState(false);

  function report(error: ActionError) {
    switch (error.code) {
      case 'conflict':
        toast({ tone: 'warning', title: t('course.enroll.errors.conflict') });
        router.refresh();
        return;
      case 'forbidden':
        toast({ tone: 'danger', title: t('course.enroll.errors.forbidden') });
        return;
      case 'license_required':
        // The page then shows the licence alert instead of this button.
        toast({ tone: 'warning', title: tErrors('license_required') });
        router.refresh();
        return;
      case 'not_found':
        toast({ tone: 'danger', title: t('course.enroll.errors.notFound') });
        router.refresh();
        return;
      case 'unauthenticated':
        // requireRole sends the refreshed page to the login form.
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
        setPending(false);
        return;
      }
      router.refresh();
      const { firstLessonId } = result.data;
      if (firstLessonId !== null) {
        // The button keeps its spinner until the lesson page replaces this one.
        router.push(lessonHref(courseId, firstLessonId));
        return;
      }
      toast({ tone: 'success', title: t('course.enroll.success') });
      setPending(false);
    } catch {
      report({ code: 'internal' });
      setPending(false);
    }
  }

  return (
    <Button size="lg" fullWidth loading={pending} onClick={enroll}>
      {!pending && <Rocket aria-hidden="true" />}
      {t('course.enroll.action')}
    </Button>
  );
}
