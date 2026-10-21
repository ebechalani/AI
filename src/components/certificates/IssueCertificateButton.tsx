'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Award } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, LinkButton, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { IssueCertificateDialog } from './IssueCertificateDialog';

export interface IssueCertificateButtonProps {
  studentUid: string;
  courseId: string;
  /**
   * The enrollment's certificate id (cleared when a certificate is revoked). When set, the
   * control links to that certificate — its page lets the issuing teacher or a platform admin
   * revoke it and issue a revoked one again — instead of issuing; when null it issues after a
   * confirmation, which also re-issues a revoked certificate. Keep the control mounted across
   * the refresh (pass the new id) so focus moves to the new link.
   */
  existingCertificateId: string | null;
}

/**
 * Issues a course certificate from a teacher's or an admin's list (ARCHITECTURE.md 7.7, 9.5).
 * Non-null `existingCertificateId` means an issued certificate (revocation clears it, and
 * issuing an issued one changes nothing), so the control is then a "View certificate" link; a
 * revoked certificate comes back through the null branch, where the service issues it again with
 * a new code. After its own success the control refreshes the page and, once the consumer
 * passes the new id, moves focus to the link; a consumer that swaps this control for something
 * else when the id arrives loses that focus move. Its name does not include the learner: in a
 * table the row header gives the context.
 */
export function IssueCertificateButton({
  studentUid,
  courseId,
  existingCertificateId,
}: IssueCertificateButtonProps) {
  const t = useTranslations('certificates');
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const linkRef = useRef<HTMLAnchorElement>(null);
  // Set only after this instance's own success, so a row that already holds a certificate
  // never steals focus on its first render.
  const focusView = useRef(false);

  useEffect(() => {
    if (existingCertificateId === null || !focusView.current) return;
    focusView.current = false;
    linkRef.current?.focus();
  }, [existingCertificateId]);

  if (existingCertificateId !== null) {
    return (
      <LinkButton
        ref={linkRef}
        href={`/certificates/${existingCertificateId}`}
        variant="secondary"
        size="sm"
      >
        <Award aria-hidden="true" />
        {t('issue.view')}
      </LinkButton>
    );
  }

  function issued() {
    setOpen(false);
    toast({ tone: 'success', title: t('issue.success') });
    focusView.current = true;
    startTransition(() => router.refresh());
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Award aria-hidden="true" />
        {t('issue.action')}
      </Button>
      <IssueCertificateDialog
        open={open}
        onClose={() => setOpen(false)}
        studentUid={studentUid}
        courseId={courseId}
        mode="issue"
        onIssued={issued}
      />
    </>
  );
}
