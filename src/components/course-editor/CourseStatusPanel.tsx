'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { setCourseStatusAction } from '@/actions/course-editor';
import { ConfirmDialog } from '@/components/classes/ConfirmDialog';
import { StatusChip } from '@/components/domain';
import { Alert, Button, Card, CardTitle, useToast, type ButtonVariant } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import type { Course } from '@/types/content';
import { usePendingFocus } from './focus';
import {
  statusActions,
  statusExplanation,
  targetStatus,
  type Readiness,
  type StatusAction,
} from './outline-model';
import type { EditorMode } from './paths';
import { ReadinessList, type ReadinessTitles } from './ReadinessList';
import { useEditorAction } from './use-editor-action';

const NOT_READY_ID = 'course-not-ready';

const VARIANT: Record<StatusAction, ButtonVariant> = {
  publish: 'primary',
  unpublish: 'secondary',
  archive: 'secondary',
  restore: 'secondary',
};

export interface CourseStatusPanelProps {
  course: Course;
  mode: EditorMode;
  readiness: Readiness;
  titles: ReadinessTitles;
  /** The official course's pathway, in the UI language; null when it has none. */
  pathwayTitle: string | null;
}

/** The course's status, the buttons that change it, and the readiness list (6.2.2). */
export function CourseStatusPanel({
  course,
  mode,
  readiness,
  titles,
  pathwayTitle,
}: CourseStatusPanelProps) {
  const t = useTranslations('courseEditor');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { toast } = useToast();
  const { run, refresh } = useEditorAction();
  const focusLater = usePendingFocus();
  const [action, setAction] = useState<StatusAction | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notReady, setNotReady] = useState(false);
  const title = pickTranslation(course.translations, locale, course.defaultLocale).title;
  const official = course.isOfficial;
  const explanation = statusExplanation(course);
  const showNotReady = notReady && readiness.blockers.length > 0 && course.status !== 'published';

  function label(next: StatusAction): string {
    switch (next) {
      case 'publish':
        return tCommon('actions.publish');
      case 'unpublish':
        return t('status.unpublish');
      case 'archive':
        return tCommon('actions.archive');
      case 'restore':
        return t('status.restore');
    }
  }

  function explanationText(): string {
    if (explanation === 'publishedOfficial') {
      return pathwayTitle === null
        ? t('status.explanation.publishedOfficialNoPathway')
        : t('status.explanation.publishedOfficial', { pathway: pathwayTitle });
    }
    if (explanation === 'publishedForTeachers') {
      return t('status.explanation.publishedForTeachers', { visibility: course.visibility });
    }
    return t(`status.explanation.${explanation}`);
  }

  function description(next: StatusAction): string {
    if (official && next !== 'restore') return t(`status.confirm.${next}.descriptionOfficial`);
    if (next === 'publish') {
      return t('status.confirm.publish.description', {
        audience: course.audience,
        visibility: course.visibility,
      });
    }
    return t(`status.confirm.${next}.description`);
  }

  function showReadinessProblem() {
    setNotReady(true);
    focusLater(NOT_READY_ID);
  }

  function choose(next: StatusAction) {
    if (next === 'publish' && readiness.blockers.length > 0) {
      showReadinessProblem();
      return;
    }
    setError(null);
    setAction(next);
  }

  async function confirm() {
    if (action === null || pending) return;
    const current = action;
    setPending(true);
    setError(null);
    const result = await run(
      () => setCourseStatusAction({ courseId: course.id, status: targetStatus(current) }),
      {
        report: (failure) => setError(failure.message),
        onFieldErrors: (fieldErrors) => {
          if (fieldErrors.status === undefined) {
            setError(t('errors.form'));
            return;
          }
          // The server found the course not ready (another tab emptied a lesson): the refresh
          // brings the readiness list up to date.
          setAction(null);
          showReadinessProblem();
          refresh();
        },
      },
    );
    setPending(false);
    if (!result.ok) {
      if (result.error.code === 'not_found' || result.error.code === 'forbidden') setAction(null);
      return;
    }
    setAction(null);
    setNotReady(false);
    toast({ tone: 'success', title: t(`status.toast.${current}`) });
    refresh();
  }

  return (
    <Card className="gap-4 p-5 sm:p-6">
      <div className="flex flex-col gap-2">
        <CardTitle as="h2" className="text-lg font-bold">
          {t('status.title')}
        </CardTitle>
        <div>
          <StatusChip status={course.status} size="md" />
        </div>
        <p className="text-sm break-words text-ink-muted">{explanationText()}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {statusActions(course.status).map((next) => (
          <Button key={next} variant={VARIANT[next]} onClick={() => choose(next)}>
            {label(next)}
          </Button>
        ))}
      </div>
      {showNotReady && (
        <div id={NOT_READY_ID} tabIndex={-1} className="rounded-control outline-none">
          <Alert tone="danger">{t('status.notReady')}</Alert>
        </div>
      )}
      <ReadinessList
        readiness={readiness}
        titles={titles}
        mode={mode}
        courseId={course.id}
        status={course.status}
      />
      <ConfirmDialog
        open={action !== null}
        onClose={() => {
          if (!pending) setAction(null);
        }}
        title={action === null ? '' : t(`status.confirm.${action}.title`, { course: title })}
        description={action === null ? '' : description(action)}
        confirmLabel={action === null ? '' : label(action)}
        confirmVariant={action === 'unpublish' || action === 'archive' ? 'danger' : 'primary'}
        pending={pending}
        error={error}
        onConfirm={confirm}
      />
    </Card>
  );
}
