'use client';

import { useCallback, useState } from 'react';
import { Blocks, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/components/classes/ConfirmDialog';
import { Button, Card, EmptyState } from '@/components/ui';
import { groupBlocksByStage } from '@/lib/learning/stages';
import { CONTENT_LIMITS } from '@/lib/limits';
import type { Audience, Locale } from '@/types/common';
import type { BlockType, LessonBlock } from '@/types/content';
import { AddBlockDialog } from './AddBlockDialog';
import { BlockEditorSlot } from './BlockEditorSlot';
import type { BlockFormContext } from './block-forms/types';
import { availableBlockTypes, blockLink } from './block-model';
import { BlockStageGroup } from './BlockStageGroup';
import { usePendingFocus } from './focus';
import { anchors, type EditorMode } from './paths';
import { byId, type ProjectRow, type QuizRow } from './rows';
import { useEditorAction } from './use-editor-action';

type Open =
  | { kind: 'edit'; blockId: string; snapshot: LessonBlock }
  | { kind: 'new'; type: BlockType };

export interface BlockListProps {
  courseId: string;
  mode: EditorMode;
  lessonId: string;
  lessonTitle: string;
  audience: Audience;
  defaultLocale: Locale;
  official: boolean;
  /** By order. */
  blocks: LessonBlock[];
  quizzes: QuizRow[];
  projects: ProjectRow[];
  locked: boolean;
}

function formIdOf(open: Open): string {
  return open.kind === 'edit' ? `block-form-${open.blockId}` : 'block-form-new';
}

/** The lesson's blocks by stage, with one editor open at a time (6.3.2). */
export function BlockList({
  courseId,
  mode,
  lessonId,
  audience,
  defaultLocale,
  official,
  blocks,
  quizzes,
  projects,
  locked,
}: BlockListProps) {
  const t = useTranslations('courseEditor');
  const { refresh } = useEditorAction();
  const focusLater = usePendingFocus();
  const [open, setOpen] = useState<Open | null>(null);
  const [slotDirty, setSlotDirty] = useState(false);
  const [discarding, setDiscarding] = useState<Open | 'add' | null>(null);
  const [addOpening, setAddOpening] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const onDirtyChange = useCallback((dirty: boolean) => setSlotDirty(dirty), []);
  const blocksById = byId(blocks);
  const lookups = { quizzes: byId(quizzes), projects: byId(projects) };
  const groups = groupBlocksByStage(blocks);
  const atLimit = blocks.length >= CONTENT_LIMITS.blocksPerLesson;

  // The open block was deleted elsewhere: a clean form simply closes, a dirty one stays as an
  // orphan (5.4). Decided while rendering, from the refreshed props.
  const orphan = open?.kind === 'edit' && blocksById[open.blockId] === undefined;
  if (orphan && !slotDirty) setOpen(null);

  function showEditor(next: Open) {
    setOpen(next);
    focusLater(`${formIdOf(next)}-stage`);
  }

  function requestEditor(next: Open | 'add') {
    if (open !== null && slotDirty) {
      setDiscarding(next);
      return;
    }
    if (next === 'add') {
      setAddOpening((n) => n + 1);
      setAddOpen(true);
    } else {
      showEditor(next);
    }
  }

  function confirmDiscard() {
    const next = discarding;
    setDiscarding(null);
    if (next === null) return;
    setOpen(null);
    if (next === 'add') {
      setAddOpening((n) => n + 1);
      setAddOpen(true);
    } else {
      showEditor(next);
    }
  }

  function onSaved(blockId: string) {
    setOpen(null);
    focusLater(anchors.block(blockId));
    refresh();
  }

  const openBlock =
    open?.kind === 'edit' ? (blocksById[open.blockId] ?? open.snapshot) : null;
  const context: BlockFormContext = {
    courseId,
    lessonId,
    mode,
    official,
    quizzes,
    projects,
    currentLinkId: openBlock ? (blockLink(openBlock)?.id ?? null) : null,
    teacherCourse: audience === 'teacher',
  };

  const slot =
    open === null || (orphan && !slotDirty) ? null : (
      <BlockEditorSlot
        key={open.kind === 'edit' ? open.blockId : 'new'}
        block={openBlock}
        newType={open.kind === 'new' ? open.type : null}
        orphan={orphan}
        context={context}
        blockCount={blocks.length}
        defaultLocale={defaultLocale}
        formId={formIdOf(open)}
        labelledBy={open.kind === 'edit' ? anchors.block(open.blockId) : `${formIdOf(open)}-title`}
        onClose={() => setOpen(null)}
        onSaved={onSaved}
        onDirtyChange={onDirtyChange}
      />
    );
  const detached = open !== null && (open.kind === 'new' || orphan);

  const addButton = (
    <Button disabled={atLimit} onClick={() => requestEditor('add')}>
      <Plus aria-hidden="true" />
      {t('blocks.add')}
    </Button>
  );

  return (
    <section aria-labelledby={`${anchors.blocks}-title`} className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id={anchors.blocks} tabIndex={-1} className="rounded-sm text-xl font-bold text-ink">
            <span id={`${anchors.blocks}-title`}>{t('blocks.title')}</span>
          </h2>
          <p className="text-sm text-ink-muted">
            {t('blocks.count', { count: blocks.length, max: CONTENT_LIMITS.blocksPerLesson })}
          </p>
        </div>
        {blocks.length > 0 && addButton}
      </div>
      {atLimit && (
        <p className="text-sm text-ink-muted">{t('blocks.limit', { max: CONTENT_LIMITS.blocksPerLesson })}</p>
      )}
      {blocks.length === 0 && !detached && (
        <EmptyState
          icon={<Blocks />}
          titleAs="h3"
          title={t('blocks.empty.title')}
          description={t('blocks.empty.description')}
          action={addButton}
        />
      )}
      {groups.map((group) => (
        <BlockStageGroup
          key={group.stage}
          stage={group.stage}
          blocks={group.blocks}
          allBlocks={blocks}
          courseId={courseId}
          lessonId={lessonId}
          lookups={lookups}
          locked={locked}
          openBlockId={open?.kind === 'edit' && !orphan ? open.blockId : null}
          formId={open === null ? '' : formIdOf(open)}
          onEdit={(block) => requestEditor({ kind: 'edit', blockId: block.id, snapshot: block })}
          slot={slot}
        />
      ))}
      {detached && open !== null && (
        <Card className="gap-4 p-4 sm:p-5">
          <h3 id={`${formIdOf(open)}-title`} className="text-base font-bold text-ink">
            {open.kind === 'new'
              ? t('blocks.newTitle', { type: t(`blocks.types.${open.type}.label`) })
              : t(`blocks.types.${open.snapshot.type}.label`)}
          </h3>
          {slot}
        </Card>
      )}
      {addOpening > 0 && (
        <AddBlockDialog
          key={addOpening}
          open={addOpen}
          onClose={() => setAddOpen(false)}
          types={availableBlockTypes({ audience })}
          onChoose={(type) => {
            setAddOpen(false);
            showEditor({ kind: 'new', type });
          }}
        />
      )}
      <ConfirmDialog
        open={discarding !== null}
        onClose={() => setDiscarding(null)}
        title={t('blocks.discardTitle')}
        description={t('blocks.discardDescription')}
        confirmLabel={t('blocks.discard')}
        confirmVariant="danger"
        pending={false}
        error={null}
        onConfirm={confirmDiscard}
      />
    </section>
  );
}
