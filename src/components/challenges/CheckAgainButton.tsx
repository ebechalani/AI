'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { ENTRY_HEADING_ID } from './EntryHeading';

function focusWasLost(): boolean {
  const active = document.activeElement;
  return active === null || active === document.body;
}

export interface CheckAgainButtonProps {
  /** Announced after a check that changed nothing. */
  stillPendingLabel: string;
}

/**
 * Reads the page again while an entry waits for its review. When nothing changed, the button
 * stays, gets its focus back and says so; when the panel changed, the button is gone with the
 * old state (the panel keys it, so React never hands it to the next state) and the entry
 * panel's heading takes focus.
 */
export function CheckAgainButton({ stillPendingLabel }: CheckAgainButtonProps) {
  const t = useTranslations('challenges');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // How many checks ran: the "still waiting" line shows once one has finished, and is emptied
  // while the next one runs, so each one is announced again.
  const [checks, setChecks] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasPending = useRef(false);
  const checked = useRef(false);

  useEffect(() => {
    if (isPending) {
      wasPending.current = true;
      return;
    }
    if (!wasPending.current) return;
    wasPending.current = false;
    // A loading button is disabled, which drops its focus.
    if (focusWasLost()) buttonRef.current?.focus();
  }, [isPending]);

  // Unmounted by a check that changed the panel: the focus goes to its heading. Only after a
  // check by this instance, never when the page simply goes away.
  useEffect(
    () => () => {
      if (!checked.current) return;
      window.setTimeout(() => {
        if (focusWasLost()) document.getElementById(ENTRY_HEADING_ID)?.focus();
      }, 0);
    },
    [],
  );

  function check() {
    if (isPending) return;
    checked.current = true;
    setChecks((count) => count + 1);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <Button ref={buttonRef} variant="secondary" size="sm" loading={isPending} onClick={check}>
        {!isPending && <RefreshCw aria-hidden="true" />}
        {t('entry.checkAgain')}
      </Button>
      {/* Always mounted, so the message is announced when its text arrives. */}
      <p role="status" className="text-sm text-ink">
        {checks > 0 && !isPending ? stillPendingLabel : ''}
      </p>
    </div>
  );
}
