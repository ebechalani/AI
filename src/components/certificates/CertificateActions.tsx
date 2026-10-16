'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { ArrowLeft, Ban, Link2, Printer, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, LinkButton, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { CertificateStatus } from '@/types/gamification';
import { IssueCertificateDialog } from './IssueCertificateDialog';
import { RevokeCertificateDialog } from './RevokeCertificateDialog';

/** The id of `CertificateStatusNotice`, which takes focus after a revoke or a re-issue. */
const STATUS_ID = 'certificate-status';

export interface CertificateActionsProps {
  certificateId: string;
  studentUid: string;
  courseId: string;
  status: CertificateStatus;
  verifyUrl: string;
  /** An issued certificate, for its issuer or a platform admin. */
  canRevoke: boolean;
  /** A revoked certificate, for its issuer or a platform admin. */
  canReissue: boolean;
  backHref: string;
  backLabel: string;
}

/** The toolbar of the printable certificate; nothing of it is printed. */
export function CertificateActions({
  certificateId,
  studentUid,
  courseId,
  status,
  verifyUrl,
  canRevoke,
  canReissue,
  backHref,
  backLabel,
}: CertificateActionsProps) {
  const t = useTranslations('certificates');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { toast } = useToast();
  const [dialog, setDialog] = useState<'revoke' | 'reissue' | null>(null);
  const [, startTransition] = useTransition();
  // The toolbar stays mounted across the refresh: once the new status arrives, the notice that
  // states it takes focus (the button that was used is gone with the old status).
  const focusStatus = useRef(false);

  useEffect(() => {
    if (!focusStatus.current) return;
    focusStatus.current = false;
    document.getElementById(STATUS_ID)?.focus();
  }, [status]);

  async function copyLink() {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) throw new Error('no clipboard');
      await navigator.clipboard.writeText(verifyUrl);
      toast({ tone: 'success', title: tCommon('feedback.copied') });
    } catch {
      toast({ tone: 'warning', title: t('page.copyFailed') });
    }
  }

  function done(message: string) {
    setDialog(null);
    toast({ tone: 'success', title: message });
    focusStatus.current = true;
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <LinkButton href={backHref} variant="ghost" size="sm">
        <ArrowLeft aria-hidden="true" className="rtl:rotate-180" />
        {backLabel}
      </LinkButton>
      <div className="flex-1" />
      <Button variant="secondary" size="sm" onClick={copyLink}>
        <Link2 aria-hidden="true" />
        {t('page.copyLink')}
      </Button>
      {status === 'issued' && (
        <Button size="sm" onClick={() => window.print()}>
          <Printer aria-hidden="true" />
          {tCommon('actions.print')}
        </Button>
      )}
      {canRevoke && (
        <Button variant="danger" size="sm" onClick={() => setDialog('revoke')}>
          <Ban aria-hidden="true" />
          {t('revoke.action')}
        </Button>
      )}
      {canReissue && (
        <Button size="sm" onClick={() => setDialog('reissue')}>
          <RotateCcw aria-hidden="true" />
          {t('issue.reissueAction')}
        </Button>
      )}
      <RevokeCertificateDialog
        open={dialog === 'revoke'}
        onClose={() => setDialog(null)}
        certificateId={certificateId}
        onRevoked={() => done(t('revoke.success'))}
      />
      <IssueCertificateDialog
        open={dialog === 'reissue'}
        onClose={() => setDialog(null)}
        studentUid={studentUid}
        courseId={courseId}
        mode="reissue"
        onIssued={() => done(t('issue.success'))}
      />
    </div>
  );
}
