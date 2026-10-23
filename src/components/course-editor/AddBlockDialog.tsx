'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Dialog, RadioGroup } from '@/components/ui';
import type { BlockType } from '@/types/content';
import { DIALOG_TEXT } from './dialog';

export interface AddBlockDialogProps {
  open: boolean;
  onClose(): void;
  /** `availableBlockTypes(course)`. */
  types: BlockType[];
  onChoose(type: BlockType): void;
}

/** Chooses the type of a new block (6.3.2). Mounted afresh at every opening. */
export function AddBlockDialog({ open, onClose, types, onChoose }: AddBlockDialogProps) {
  const t = useTranslations('courseEditor');
  const tCommon = useTranslations('common');
  const name = useId();
  const [type, setType] = useState<BlockType>(types[0] ?? 'rich_text');
  const groupRef = useRef<HTMLDivElement>(null);

  // The kit's RadioGroup takes no autofocus marker: once the dialog has opened (its own effect
  // runs showModal before this one), the focus moves to the chosen type, the first field (7.3).
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      groupRef.current?.querySelector<HTMLInputElement>('input[type="radio"]:checked')?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('blocks.add')}
      size="md"
      className={DIALOG_TEXT}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {tCommon('actions.cancel')}
          </Button>
          <Button onClick={() => onChoose(type)}>{t('blocks.addConfirm')}</Button>
        </>
      }
    >
      <div ref={groupRef}>
        <RadioGroup
          legend={t('blocks.chooseType')}
          name={name}
          variant="card"
          value={type}
          onValueChange={(value) => setType(value as BlockType)}
          options={types.map((candidate) => ({
            value: candidate,
            label: t(`blocks.types.${candidate}.label`),
            description: t(`blocks.types.${candidate}.description`),
          }))}
        />
      </div>
    </Dialog>
  );
}
