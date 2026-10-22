'use client';

import { useId, useState } from 'react';
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
    </Dialog>
  );
}
