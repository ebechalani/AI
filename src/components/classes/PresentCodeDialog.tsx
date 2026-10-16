'use client';

import { useTranslations } from 'next-intl';
import { Button, Dialog } from '@/components/ui';
import { joinCodeGroups, spokenCode } from './class-model';
import { DIALOG_TEXT } from './dialog';

export interface PresentCodeDialogProps {
  open: boolean;
  onClose: () => void;
  className: string;
  joinCode: string;
  /** The absolute `/join` URL without the query, computed by the opener's click handler. */
  joinUrl: string;
}

/** The join code, large, for a projector or a shared screen. */
export function PresentCodeDialog({
  open,
  onClose,
  className,
  joinCode,
  joinUrl,
}: PresentCodeDialogProps) {
  const t = useTranslations('classes');
  const tCommon = useTranslations('common');
  const [first, second] = joinCodeGroups(joinCode);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('joinCode.presentTitle', { className })}
      size="lg"
      className={DIALOG_TEXT}
      footer={
        <Button variant="secondary" onClick={onClose} data-autofocus>
          {tCommon('actions.close')}
        </Button>
      }
    >
      <div className="flex flex-col items-center gap-6 py-4 text-center">
        <p className="text-lg break-all text-ink">
          {t('joinCode.presentInstructions', { url: joinUrl })}
        </p>
        <p
          translate="no"
          className="font-mono text-4xl font-bold tracking-[0.2em] text-ink sm:text-6xl lg:text-8xl"
        >
          <span className="sr-only">
            {t('joinCode.codeLabel', { className, code: spokenCode(joinCode) })}
          </span>
          <span aria-hidden="true" className="flex flex-wrap justify-center gap-x-4">
            <span>{first}</span>
            <span>{second}</span>
          </span>
        </p>
      </div>
    </Dialog>
  );
}
