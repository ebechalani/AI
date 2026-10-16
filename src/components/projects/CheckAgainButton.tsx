'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { focusInView, focusWasLost } from './focus';

export interface CheckAgainButtonProps {
  label: string;
  /** Shown and announced when the page was read again and the review is still on its way. */
  stillPendingLabel: string;
}

/**
 * Reads the page again (a review on its way). When the state did not change, the button stays,
 * gets focus back and says so (a status message, WCAG 4.1.3); when it did, the button is gone
 * and the section's heading takes focus.
 */
export function CheckAgainButton({ label, stillPendingLabel }: CheckAgainButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // How many checks ran: the message shows once the first has finished, and is emptied while
  // the next one runs, so each one is announced again.
  const [checks, setChecks] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (isPending) {
      wasPending.current = true;
      return;
    }
    if (!wasPending.current) return;
    wasPending.current = false;
    if (focusWasLost(null)) focusInView(buttonRef.current);
  }, [isPending]);

  function check() {
    if (isPending) return;
    setChecks((count) => count + 1);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <Button ref={buttonRef} variant="secondary" size="sm" loading={isPending} onClick={check}>
        {!isPending && <RefreshCw aria-hidden="true" />}
        {label}
      </Button>
      {/* Always mounted, so the message is announced when its text arrives. */}
      <p role="status" className="text-sm text-ink">
        {checks > 0 && !isPending ? stillPendingLabel : ''}
      </p>
    </div>
  );
}
