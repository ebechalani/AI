'use client';

import { useRef, useState } from 'react';
import { Copy, Link2, Presentation, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { regenerateJoinCodeAction, updateClassAction } from '@/actions/classes';
import { useDateFormat } from '@/components/domain';
import { Alert, Button, Card, CardTitle, Chip, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError } from '@/types/actions';
import { joinCodeGroups, spokenCode, type JoinCodeState, type JoinHint } from './class-model';
import { ConfirmDialog } from './ConfirmDialog';
import { MAIN_CONTENT_ID, settleAndRestoreFocus } from './focus';
import { PresentCodeDialog } from './PresentCodeDialog';
import { useActionErrorMessage } from './use-action-error';
import { useFocusAfterClose } from './use-focus-after-close';

export interface JoinCodePanelProps {
  classId: string;
  className: string;
  joinCode: string;
  /** Computed on the server with the request's time. */
  state: JoinCodeState;
  /** Locale-prefixed: `invitePath(getPathname({ href: JOIN_PATH, locale }), joinCode)`. */
  invitePath: string;
  hint: JoinHint;
  /** The class's school has turned join codes off. */
  schoolJoinCodesOff: boolean;
  /** No account can be created in this class either (`accountCreation(…).blocked !== null`). */
  creationBlocked: boolean;
}

type Busy = 'toggle' | 'close' | null;

// A chip truncates its text; a date in a narrow column wraps instead.
const WRAP = 'whitespace-normal [&>span]:whitespace-normal';

/** The class code: its state, open / extend / close, copy, show to the class, replace. */
export function JoinCodePanel({
  classId,
  className,
  joinCode,
  state,
  invitePath,
  hint,
  schoolJoinCodesOff,
  creationBlocked,
}: JoinCodePanelProps) {
  const t = useTranslations('classes');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const formatDate = useDateFormat();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [presentUrl, setPresentUrl] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const focusAfterConfirm = useFocusAfterClose(confirmOpen);

  if (schoolJoinCodesOff) {
    return (
      <Card className="gap-4 p-5 sm:p-6">
        <CardTitle as="h2" className="text-lg">
          {t('joinCode.title')}
        </CardTitle>
        <Alert tone="warning" live="off" title={t('joinCode.schoolOff.title')}>
          {/* "Add students" is no way in either when the card under this one is blocked. */}
          {creationBlocked
            ? t('joinCode.schoolOff.descriptionNoAdd')
            : t('joinCode.schoolOff.description')}
        </Alert>
      </Card>
    );
  }

  const [first, second] = joinCodeGroups(joinCode);
  const isOpen = state.kind === 'open';

  /** True when the refresh it starts takes this panel away (the class is archived or gone). */
  function reportToggle(error: ActionError): boolean {
    switch (error.code) {
      case 'conflict':
        toast({ tone: 'warning', title: t('errors.archived') });
        router.refresh();
        return true;
      case 'not_found':
        toast({ tone: 'danger', title: t('errors.classGone') });
        router.refresh();
        return true;
      case 'unauthenticated':
        toast({ tone: 'danger', title: tErrors('unauthenticated') });
        router.refresh();
        return true;
      default:
        toast({ tone: 'danger', title: errorMessage(error) });
        return false;
    }
  }

  async function setEnabled(enabled: boolean) {
    if (busy !== null) return;
    setBusy(enabled ? 'toggle' : 'close');
    let panelGone = false;
    try {
      const result = await updateClassAction({ classId, joinCodeEnabled: enabled });
      if (!result.ok) {
        panelGone = reportToggle(result.error);
        return;
      }
      const title = !enabled
        ? t('joinCode.closed')
        : isOpen
          ? t('joinCode.extended')
          : t('joinCode.opened');
      toast({ tone: 'success', title });
      router.refresh();
    } catch {
      panelGone = reportToggle({ code: 'internal' });
    } finally {
      // The pressed button was disabled while loading, which dropped the focus. The toggle is
      // the same element after the refresh ("Close the code" is gone then), so it takes the
      // focus back once it is enabled again (5.4, 7.3); `<main>` when the panel goes away.
      settleAndRestoreFocus(
        () => setBusy(null),
        () => (panelGone ? document.getElementById(MAIN_CONTENT_ID) : toggleRef.current),
      );
    }
  }

  async function copy(text: () => string) {
    try {
      if (!navigator.clipboard) throw new Error('No clipboard');
      await navigator.clipboard.writeText(text());
      toast({ tone: 'success', title: tCommon('feedback.copied') });
    } catch {
      toast({ tone: 'danger', title: t('joinCode.copyFailed') });
    }
  }

  function reportRegenerate(error: ActionError) {
    switch (error.code) {
      // The refresh takes this panel, and the dialog with it, off the page: close first, then
      // the message as a toast and the focus on <main>.
      case 'conflict':
      case 'not_found':
        toast(
          error.code === 'conflict'
            ? { tone: 'warning', title: t('errors.archived') }
            : { tone: 'danger', title: t('errors.classGone') },
        );
        focusAfterConfirm(MAIN_CONTENT_ID);
        setConfirmOpen(false);
        router.refresh();
        return;
      case 'unauthenticated':
        setRegenerateError(tErrors('unauthenticated'));
        router.refresh();
        return;
      default:
        setRegenerateError(errorMessage(error));
    }
  }

  async function regenerate() {
    if (regenerating) return;
    setRegenerating(true);
    setRegenerateError(null);
    try {
      const result = await regenerateJoinCodeAction({ classId });
      if (!result.ok) {
        reportRegenerate(result.error);
        return;
      }
      setConfirmOpen(false);
      toast({ tone: 'success', title: t('joinCode.regenerated', { code: result.data.joinCode }) });
      router.refresh();
    } catch {
      reportRegenerate({ code: 'internal' });
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <Card className="gap-4 p-5 sm:p-6">
      <CardTitle as="h2" className="text-lg">
        {t('joinCode.title')}
      </CardTitle>
      <div className="flex flex-col items-start gap-2">
        <p translate="no" className="font-mono text-3xl font-bold tracking-[0.2em] text-ink">
          <span className="sr-only">
            {t('joinCode.codeLabel', { className, code: spokenCode(joinCode) })}
          </span>
          {/* The halves wrap where the column is narrow (the lg aside at 1024 px). */}
          <span aria-hidden="true" className="flex flex-wrap gap-x-3">
            <span>{first}</span>
            <span>{second}</span>
          </span>
        </p>
        {state.kind === 'open' ? (
          <Chip tone="success" className={WRAP}>
            {t('joinCode.state.open', { date: formatDate(state.expiresAt, 'dateTime') })}
          </Chip>
        ) : state.kind === 'expired' ? (
          <Chip tone="warning" className={WRAP}>
            {t('joinCode.state.expired', { date: formatDate(state.expiredAt, 'dateTime') })}
          </Chip>
        ) : (
          <Chip>{t('joinCode.state.off')}</Chip>
        )}
      </div>
      <div className="flex flex-col gap-1 text-sm text-ink-muted">
        <p>{t(`joinCode.hint.${hint}`)}</p>
        <p>{t('joinCode.ttl')}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          ref={toggleRef}
          variant={isOpen ? 'secondary' : 'primary'}
          loading={busy === 'toggle'}
          disabled={busy !== null && busy !== 'toggle'}
          onClick={() => setEnabled(true)}
        >
          {isOpen ? t('joinCode.extend') : t('joinCode.open')}
        </Button>
        {isOpen && (
          <Button
            variant="secondary"
            loading={busy === 'close'}
            disabled={busy !== null && busy !== 'close'}
            onClick={() => setEnabled(false)}
          >
            {t('joinCode.close')}
          </Button>
        )}
        <Button variant="secondary" onClick={() => copy(() => joinCode)}>
          <Copy aria-hidden="true" />
          {t('joinCode.copyCode')}
        </Button>
        <Button
          variant="secondary"
          onClick={() => copy(() => new URL(invitePath, window.location.origin).href)}
        >
          <Link2 aria-hidden="true" />
          {t('joinCode.copyLink')}
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            setPresentUrl(new URL(invitePath.split('?')[0]!, window.location.origin).href)
          }
        >
          <Presentation aria-hidden="true" />
          {t('joinCode.present')}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setRegenerateError(null);
            setConfirmOpen(true);
          }}
        >
          <RefreshCw aria-hidden="true" />
          {t('joinCode.regenerate')}
        </Button>
      </div>
      <PresentCodeDialog
        open={presentUrl !== null}
        onClose={() => setPresentUrl(null)}
        className={className}
        joinCode={joinCode}
        joinUrl={presentUrl ?? ''}
      />
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('joinCode.regenerateTitle')}
        description={t('joinCode.regenerateDescription', { code: joinCode })}
        confirmLabel={t('joinCode.regenerateConfirm')}
        pending={regenerating}
        error={regenerateError}
        onConfirm={regenerate}
      />
    </Card>
  );
}
