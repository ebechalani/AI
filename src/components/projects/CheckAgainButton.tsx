'use client';

import { useEffect, useRef, useTransition } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { focusInView, focusWasLost } from './focus';

export interface CheckAgainButtonProps {
  label: string;
}

/**
 * Reads the page again (a review on its way). When the state did not change, the button stays
 * and gets focus back; when it did, the button is gone and the section's heading takes focus.
 */
export function CheckAgainButton({ label }: CheckAgainButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
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

  return (
    <Button
      ref={buttonRef}
      variant="secondary"
      size="sm"
      loading={isPending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {!isPending && <RefreshCw aria-hidden="true" />}
      {label}
    </Button>
  );
}
