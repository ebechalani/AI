'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { setChallengeStatusAction } from '@/actions/admin';
import { ConfirmDialog } from '@/components/classes/ConfirmDialog';
import { Button, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError, ActionResult } from '@/types/actions';
import type { ChallengeStatus } from '@/types/challenge';
import {
  challengeTransitions,
  focusAfterTransition,
  isDestructiveTransition,
  transitionNeedsConfirm,
  transitionTarget,
  type ChallengeTransition,
  type StatusFilter,
} from './challenge-model';
import { settleAndRestoreFocus } from './focus';
import { useActionErrorMessage } from './use-action-error';
import { useFocusAfterClose } from './use-focus-after-close';

export interface ChallengeStatusButtonsProps {
  challengeId: string;
  title: string;
  status: ChallengeStatus;
  /** "Every student" / "The students of X", already translated by the owner. */
  audience: string;
  /** The opening and the deadline, formatted. */
  start: string;
  end: string;
  pastDeadline: boolean;
  /** The element that takes the focus once the pressed button is replaced. */
  focusId: string;
  filter: StatusFilter;
  size?: 'sm' | 'md';
}

const DONE_KEYS: Record<ChallengeTransition, string> = {
  publish: 'published',
  unpublish: 'unpublished',
  archive: 'archived',
  restore: 'restored',
};

/**
 * Publish, move back to draft, archive or restore a challenge (ARCHITECTURE.md 6.7). Publish
 * and the two destructive transitions are confirmed; restore runs at once. After a success the
 * focus goes to the row's title (or the page's main content when the list's filter hides the
 * row), since the pressed button is replaced by others.
 */
export function ChallengeStatusButtons({
  challengeId,
  title,
  status,
  audience,
  start,
  end,
  pastDeadline,
  focusId,
  filter,
  size = 'sm',
}: ChallengeStatusButtonsProps) {
  const t = useTranslations('admin');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const restoreRef = useRef<HTMLButtonElement>(null);
  const [confirming, setConfirming] = useState<ChallengeTransition | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gone, setGone] = useState(false);
  const focusLater = useFocusAfterClose(confirming !== null);

  function close() {
    setConfirming(null);
    if (gone) router.refresh();
  }

  async function run(transition: ChallengeTransition): Promise<ActionResult<null>> {
    try {
      return await setChallengeStatusAction({ challengeId, status: transitionTarget(transition) });
    } catch {
      return { ok: false, error: { code: 'internal' } };
    }
  }

  function failureText(failure: ActionError): string {
    switch (failure.code) {
      case 'not_found':
        return t('shared.challengeGone');
      case 'unauthenticated':
        router.refresh();
        return tErrors('unauthenticated');
      default:
        return errorMessage(failure);
    }
  }

  function succeed(transition: ChallengeTransition) {
    toast({ tone: 'success', title: t(`challenges.transitions.${DONE_KEYS[transition]}`, { title }) });
    router.refresh();
  }

  async function confirm() {
    if (pending || confirming === null) return;
    const transition = confirming;
    setPending(true);
    setError(null);
    const result = await run(transition);
    setPending(false);
    if (!result.ok) {
      if (result.error.code === 'not_found') setGone(true);
      setError(failureText(result.error));
      return;
    }
    focusLater(focusAfterTransition(filter, transition, focusId));
    setConfirming(null);
    succeed(transition);
  }

  async function restore() {
    if (pending) return;
    setPending(true);
    const result = await run('restore');
    settleAndRestoreFocus(
      () => setPending(false),
      () => restoreRef.current,
    );
    if (!result.ok) {
      toast({ tone: 'danger', title: failureText(result.error) });
      if (result.error.code === 'not_found') router.refresh();
      return;
    }
    // No dialog closes here: move the focus now, before the refresh replaces this button.
    document.getElementById(focusAfterTransition(filter, 'restore', focusId))?.focus();
    succeed('restore');
  }

  const shown = confirming ?? 'publish';
  const dialog =
    shown === 'publish'
        ? {
            title: t('challenges.transitions.publishTitle', { title }),
            description: [
              t('challenges.transitions.publishDescription', { audience, start, end }),
              pastDeadline ? t('challenges.transitions.pastDeadline') : null,
            ]
              .filter((part) => part !== null)
              .join(' '),
            confirmLabel: t('challenges.transitions.publishConfirm'),
            variant: 'primary' as const,
          }
        : shown === 'unpublish'
          ? {
              title: t('challenges.transitions.unpublishTitle', { title }),
              description: t('challenges.transitions.unpublishDescription'),
              confirmLabel: t('challenges.transitions.unpublishConfirm'),
              variant: 'danger' as const,
            }
          : {
              title: t('challenges.transitions.archiveTitle', { title }),
              description: t('challenges.transitions.archiveDescription'),
              confirmLabel: t('challenges.transitions.archiveConfirm'),
              variant: 'danger' as const,
            };

  return (
    <>
      {challengeTransitions(status).map((transition) => (
        <Button
          key={transition}
          ref={transition === 'restore' ? restoreRef : undefined}
          size={size}
          variant={
            transition === 'publish'
              ? 'primary'
              : isDestructiveTransition(transition)
                ? 'ghost'
                : 'secondary'
          }
          loading={transition === 'restore' && pending && confirming === null}
          aria-label={t(`challenges.transitions.${transition}Label`, { title })}
          onClick={() => {
            if (transitionNeedsConfirm(transition)) {
              setError(null);
              setConfirming(transition);
            } else {
              void restore();
            }
          }}
        >
          {t(`challenges.transitions.${transition}`)}
        </Button>
      ))}
      <ConfirmDialog
        open={confirming !== null}
        onClose={close}
        title={dialog.title}
        description={dialog.description}
        confirmLabel={dialog.confirmLabel}
        confirmVariant={dialog.variant}
        pending={pending && confirming !== null}
        error={error}
        onConfirm={confirm}
      />
    </>
  );
}
