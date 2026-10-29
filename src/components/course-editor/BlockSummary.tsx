'use client';

import type { ReactNode } from 'react';
import {
  AlignLeft,
  AppWindow,
  Bot,
  BrainCircuit,
  Clapperboard,
  Code,
  Hammer,
  Image,
  ListChecks,
  NotebookPen,
  Paperclip,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { deleteBlockAction } from '@/actions/course-editor';
import { ConfirmDialog } from '@/components/classes/ConfirmDialog';
import { Button, Chip, useToast } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Locale } from '@/types/common';
import type { BlockType, LessonBlock } from '@/types/content';
import { DragHandle } from './DragHandle';
import { DropIndicator } from './DropIndicator';
import { anchors } from './paths';
import { ReorderButtons } from './ReorderButtons';
import type { RowReorder } from './row-reorder';
import { useConfirmedAction } from './use-confirmed-action';

const ICONS: Record<BlockType, LucideIcon> = {
  rich_text: AlignLeft,
  image: Image,
  video: Clapperboard,
  file: Paperclip,
  quiz: ListChecks,
  code_activity: Code,
  ai_activity: Bot,
  embed: AppWindow,
  reflection: NotebookPen,
  project: Hammer,
  ml_activity: BrainCircuit,
};

export interface BlockSummaryProps {
  block: LessonBlock;
  /** 1-based, inside its stage. */
  position: number;
  count: number;
  summary: string;
  /** The linked quiz's or project's title. */
  linkedTitle: string | null;
  /** The editable language the block lacks a translation in. */
  untranslated: Locale | null;
  open: boolean;
  formId: string;
  locked: boolean;
  courseId: string;
  lessonId: string;
  onEdit(): void;
  onDeleted(blockId: string): void;
  reorder: RowReorder;
  attach(element: HTMLElement | null): void;
  dropSlot: number | null;
  /** The open editor, rendered under the summary. */
  children?: ReactNode;
}

/** One block of a stage (6.3.2): its type, a line of its text, reorder, edit and delete. */
export function BlockSummary({
  block,
  position,
  count,
  summary,
  linkedTitle,
  untranslated,
  open,
  formId,
  locked,
  courseId,
  lessonId,
  onEdit,
  onDeleted,
  reorder,
  attach,
  dropSlot,
  children,
}: BlockSummaryProps) {
  const t = useTranslations('courseEditor');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const remove = useConfirmedAction();
  const Icon = ICONS[block.type];
  const type = t(`blocks.types.${block.type}.label`);
  const name = t('blocks.reorderName', { type, position });
  const linked = block.type === 'quiz' || block.type === 'project';
  const headingId = anchors.block(block.id);

  return (
    <li
      ref={attach}
      className={cn('relative flex flex-col gap-3 py-3', reorder.dragging && 'opacity-60')}
    >
      <DropIndicator slot={dropSlot} index={position - 1} count={count} />
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <DragHandle handle={reorder.handle} disabled={reorder.busy} />
        <Icon aria-hidden="true" className="mt-3 size-5 shrink-0 text-ink-muted" />
        <div className="flex min-w-0 flex-1 basis-48 flex-col gap-1 py-2">
          <h4 id={headingId} tabIndex={-1} className="rounded-sm text-sm font-bold text-ink">
            {type}
          </h4>
          <p className="line-clamp-2 text-sm break-words text-ink-muted">
            {summary === '' ? t('blocks.noText') : summary}
          </p>
          {(linkedTitle !== null || untranslated !== null) && (
            <div className="flex flex-wrap gap-1.5">
              {linkedTitle !== null && <Chip tone="brand">{t('blocks.linked', { title: linkedTitle })}</Chip>}
              {untranslated !== null && (
                <Chip>{t('blocks.untranslated', { language: t(`languageNames.${untranslated}`) })}</Chip>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <ReorderButtons
            name={name}
            index={position - 1}
            count={count}
            onMove={reorder.step}
            disabled={reorder.busy}
            idPrefix={`block-${block.id}-move`}
          />
          <Button
            id={anchors.blockEdit(block.id)}
            size="sm"
            variant="secondary"
            aria-expanded={open}
            aria-controls={open ? formId : undefined}
            aria-label={t('blocks.editLabel', { type, position })}
            onClick={onEdit}
          >
            {tCommon('actions.edit')}
          </Button>
          {!locked && (
            <Button
              size="sm"
              variant="ghost"
              className="text-danger hover:bg-danger/10"
              aria-label={t('blocks.deleteLabel', { type, position })}
              onClick={remove.show}
            >
              {tCommon('actions.delete')}
            </Button>
          )}
        </div>
      </div>
      {children}
      {!locked && (
        <ConfirmDialog
          open={remove.open}
          onClose={remove.close}
          title={t('blocks.deleteTitle', { type })}
          description={linked ? t('blocks.deleteLinkedDescription') : t('blocks.deleteDescription')}
          confirmLabel={tCommon('actions.delete')}
          confirmVariant="danger"
          pending={remove.pending}
          error={remove.error}
          onConfirm={() =>
            remove.confirm(
              () => deleteBlockAction({ courseId, lessonId, blockId: block.id }),
              {
                context: { action: 'deleteStructure' },
                onSuccess: () => {
                  toast({ tone: 'success', title: t('blocks.deleted') });
                  onDeleted(block.id);
                },
              },
            )
          }
        />
      )}
    </li>
  );
}
