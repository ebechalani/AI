'use client';

import { useEffect, useRef, useState } from 'react';
import { CircleCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { completeLessonAction } from '@/actions/learning';
import { Button, Chip, Dialog, LinkButton, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import type { ActionError } from '@/types/actions';
import type { IsoDateString } from '@/types/common';
import { summarizeCompletion, type CompletionSummary } from './completion-model';
import { focusWasLost } from './focus';
import { LessonCompletePanel } from './LessonCompletePanel';
import { EARN_ANCHOR } from './lesson-model';
import { useActionErrorMessage } from './use-action-error';

// After these the page itself has changed (licence lapsed, not enrolled, signed out): the
// refresh shows the access state, the not-found page or the login redirect.
const REFRESH_ON: ReadonlySet<ActionError['code']> = new Set([
  'license_required',
  'not_found',
  'unauthenticated',
]);

export interface LessonCompleteControlProps {
  courseId: string;
  lessonId: string;
  completed: boolean;
  /** Checklist items still to do; the footer links to them. */
  missingCount: number;
  nextLessonHref: string | null;
  courseHref: string;
  /** The enrollment was already completed before this view: no "course completed" news. */
  courseCompletedBefore: boolean;
}

function revealEarnSection() {
  const section = document.getElementById(EARN_ANCHOR);
  if (section === null) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  section.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  section.focus({ preventScroll: true });
}

/**
 * "Complete lesson" and its result dialog (the EARN stage). It stays mounted once the lesson is
 * completed, so the dialog survives the refresh that turns the button into a chip.
 */
export function LessonCompleteControl({
  courseId,
  lessonId,
  completed,
  missingCount,
  nextLessonHref,
  courseHref,
  courseCompletedBefore,
}: LessonCompleteControlProps) {
  const t = useTranslations('lesson');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ summary: CompletionSummary; earnedAt: IsoDateString }>();
  const [open, setOpen] = useState(false);
  const controlRef = useRef<HTMLDivElement>(null);
  const [refocus, setRefocus] = useState(0);
  // Once this view completed the lesson, the button gives way to the "Lesson completed" chip.
  const done = completed || result !== undefined;

  // "Complete lesson" is disabled while the action runs, which drops focus to the page, and the
  // dialog then has nothing to give focus back to (WCAG 2.4.3). After the dialog or a failed
  // run, focus returns to this control in the sticky footer: the button, or the control itself
  // once it holds the chip (also while the refresh that swaps them is still on its way).
  useEffect(() => {
    if (refocus === 0) return;
    const control = controlRef.current;
    if (control === null) return;
    // Focusable itself only once done (below): then the button inside is on its way out too.
    const holdsChip = control.hasAttribute('tabindex');
    const active = document.activeElement;
    const onOldButton =
      holdsChip && active !== null && active !== control && control.contains(active);
    if (!focusWasLost(control) && !onOldButton) return;
    const target = holdsChip ? control : control.querySelector<HTMLElement>('button:enabled');
    target?.focus({ preventScroll: true });
  }, [refocus]);

  function closeDialog() {
    setOpen(false);
    setRefocus((count) => count + 1);
  }

  async function complete() {
    if (pending) return;
    setPending(true);
    let error: ActionError;
    try {
      const answer = await completeLessonAction({ courseId, lessonId });
      if (answer.ok && answer.data.completed) {
        setResult({
          summary: summarizeCompletion(answer.data, courseCompletedBefore),
          earnedAt: answer.data.enrollment.lastActivityAt,
        });
        setOpen(true);
        router.refresh();
        return;
      }
      if (answer.ok) {
        toast({
          tone: 'warning',
          title: t('notReady.title'),
          description: t('notReady.description'),
        });
        revealEarnSection();
        router.refresh();
        return;
      }
      error = answer.error;
    } catch {
      error = { code: 'internal' };
    } finally {
      setPending(false);
    }
    toast({ tone: 'danger', title: errorMessage(error) });
    setRefocus((count) => count + 1);
    if (REFRESH_ON.has(error.code)) router.refresh();
  }

  return (
    <>
      <div
        ref={controlRef}
        tabIndex={done ? -1 : undefined}
        className={cn('flex flex-col items-center', completed ? 'rounded-full' : 'rounded-control')}
      >
        {completed ? (
          <Chip tone="success" size="md" icon={<CircleCheck aria-hidden="true" />}>
            {t('footer.completed')}
          </Chip>
        ) : (
          <>
            <Button loading={pending} onClick={complete}>
              {t('footer.complete')}
            </Button>
            {missingCount > 0 && (
              <a
                href={`#${EARN_ANCHOR}`}
                className="inline-flex min-h-6 items-center text-xs font-medium text-ink-muted underline-offset-2 hover:text-ink hover:underline"
              >
                {t('footer.stepsLeft', { count: missingCount })}
              </a>
            )}
          </>
        )}
      </div>

      <Dialog
        open={open && result !== undefined}
        onClose={closeDialog}
        title={t('complete.title')}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={closeDialog}>
              {tCommon('actions.close')}
            </Button>
            <LinkButton href={courseHref} variant="secondary" onClick={() => setOpen(false)}>
              {t('complete.backToCourse')}
            </LinkButton>
            {nextLessonHref && (
              <LinkButton href={nextLessonHref} onClick={() => setOpen(false)} data-autofocus>
                {t('complete.next')}
              </LinkButton>
            )}
          </>
        }
      >
        {result && <LessonCompletePanel summary={result.summary} earnedAt={result.earnedAt} />}
      </Dialog>
    </>
  );
}
