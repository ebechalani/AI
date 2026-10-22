'use client';

import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { reorderBlocksAction } from '@/actions/course-editor';
import { pickTranslation, hasTranslation } from '@/lib/i18n/content';
import { groupBlocksByStage } from '@/lib/learning/stages';
import type { Locale, Localized } from '@/types/common';
import type { LessonBlock, LessonStage } from '@/types/content';
import { blockLink, blockSummary } from './block-model';
import { BlockSummary } from './BlockSummary';
import { usePendingFocus } from './focus';
import { anchors } from './paths';
import { rowReorder } from './row-reorder';
import { byId, type CourseLookups } from './rows';
import { EDITABLE_LOCALES } from './translations';
import { useEditorAction } from './use-editor-action';
import { useReorderList } from './use-reorder-list';
import { useSortable } from './use-sortable';

export interface BlockStageGroupProps {
  stage: LessonStage;
  /** This stage's blocks, by order. */
  blocks: LessonBlock[];
  /** Every block of the lesson: a reorder sends the full list (4.8). */
  allBlocks: LessonBlock[];
  courseId: string;
  lessonId: string;
  lookups: CourseLookups;
  locked: boolean;
  /** The block whose editor is open, if it is in this stage. */
  openBlockId: string | null;
  formId: string;
  onEdit(block: LessonBlock): void;
  /** The open editor of `openBlockId`. */
  slot: ReactNode;
}

function linkedTitleOf(block: LessonBlock, lookups: CourseLookups, locale: string): string | null {
  const link = blockLink(block);
  if (link === null) return null;
  const row = link.kind === 'quiz' ? lookups.quizzes[link.id] : lookups.projects[link.id];
  return row ? pickTranslation(row.translations, locale, row.defaultLocale).title : null;
}

function untranslatedOf(block: LessonBlock): Locale | null {
  return (
    EDITABLE_LOCALES.find(
      (locale) =>
        locale !== block.defaultLocale &&
        !hasTranslation(block.translations as Localized<object>, locale),
    ) ?? null
  );
}

/** One stage's blocks, sortable inside the stage (6.3.2, 5.5). */
export function BlockStageGroup({
  stage,
  blocks,
  allBlocks,
  courseId,
  lessonId,
  lookups,
  locked,
  openBlockId,
  formId,
  onEdit,
  slot,
}: BlockStageGroupProps) {
  const t = useTranslations('courseEditor');
  const tDomain = useTranslations('domain');
  const locale = useLocale();
  const { refresh } = useEditorAction();
  const focusLater = usePendingFocus();
  const blocksById = byId(blocks);
  const list = useReorderList({
    ids: blocks.map((block) => block.id),
    save: (stageOrder) =>
      reorderBlocksAction({
        courseId,
        lessonId,
        // The order inside this stage changed; the other stages are sent as stored.
        orderedIds: groupBlocksByStage(allBlocks).flatMap((group) =>
          group.stage === stage ? stageOrder : group.blocks.map((block) => block.id),
        ),
      }),
    nameOf: (id) => {
      const block = blocksById[id];
      return block
        ? t('blocks.reorderName', {
            type: t(`blocks.types.${block.type}.label`),
            position: blocks.indexOf(block) + 1,
          })
        : '';
    },
  });
  const sortable = useSortable({ ids: list.order, onMove: list.moveTo, disabled: list.busy });
  const titleId = `lesson-stage-${stage}`;

  function onDeleted(blockId: string) {
    const index = list.order.indexOf(blockId);
    const neighbour = list.order[index + 1] ?? list.order[index - 1];
    focusLater(neighbour === undefined ? anchors.blocks : anchors.block(neighbour));
    refresh();
  }

  return (
    <section aria-labelledby={titleId} className="flex min-w-0 flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <h3 id={titleId} className="text-base font-bold text-ink">
          {tDomain(`stages.${stage}`)}
        </h3>
        <span className="text-sm text-ink-muted">{t('blocks.stageCount', { count: blocks.length })}</span>
      </div>
      <ol aria-busy={list.busy} className="flex flex-col divide-y divide-border">
        {list.order.map((blockId, index) => {
          const block = blocksById[blockId];
          if (block === undefined) return null;
          const open = blockId === openBlockId;
          return (
            <BlockSummary
              key={blockId}
              block={block}
              position={index + 1}
              count={list.order.length}
              summary={blockSummary(block, locale, lookups)}
              linkedTitle={linkedTitleOf(block, lookups, locale)}
              untranslated={untranslatedOf(block)}
              open={open}
              formId={formId}
              locked={locked}
              courseId={courseId}
              lessonId={lessonId}
              onEdit={() => onEdit(block)}
              onDeleted={onDeleted}
              reorder={rowReorder(list, sortable, blockId, `block-${blockId}-move`)}
              attach={sortable.itemRef(blockId)}
              dropSlot={sortable.indicatorSlot}
            >
              {open ? slot : null}
            </BlockSummary>
          );
        })}
      </ol>
      <div role="status" aria-live="polite" className="sr-only">
        {list.announcement}
      </div>
    </section>
  );
}
