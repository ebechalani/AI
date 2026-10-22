'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { deleteModuleAction, reorderLessonsAction } from '@/actions/course-editor';
import { ConfirmDialog } from '@/components/classes/ConfirmDialog';
import { Button, Card, Chip, useToast } from '@/components/ui';
import { hasTranslation, pickTranslation } from '@/lib/i18n/content';
import { CONTENT_LIMITS } from '@/lib/limits';
import { cn } from '@/lib/utils';
import type { Locale } from '@/types/common';
import { DragHandle } from './DragHandle';
import { DropIndicator } from './DropIndicator';
import { usePendingFocus } from './focus';
import { LessonDialog } from './LessonDialog';
import { LessonRowItem } from './LessonRowItem';
import { ModuleDialog } from './ModuleDialog';
import { anchors, type EditorMode } from './paths';
import { ReorderButtons } from './ReorderButtons';
import { rowReorder, type RowReorder } from './row-reorder';
import { byId, type LessonRow, type ModuleRow } from './rows';
import { EDITABLE_LOCALES } from './translations';
import { useConfirmedAction } from './use-confirmed-action';
import { useEditorAction } from './use-editor-action';
import { useReorderList } from './use-reorder-list';
import { useSortable } from './use-sortable';

export interface ModuleSectionProps {
  module: ModuleRow;
  /** 1-based. */
  position: number;
  count: number;
  /** This module's lessons, by order. */
  lessons: LessonRow[];
  courseId: string;
  mode: EditorMode;
  /** The course's language, for a new lesson. */
  defaultLocale: Locale;
  locked: boolean;
  reorder: RowReorder;
  /** The row element's ref, read by the drag logic. */
  attach(element: HTMLElement | null): void;
  dropSlot: number | null;
  /** After a delete (the owner refreshes and moves the focus). */
  onDeleted(moduleId: string): void;
}

/** One module of the outline (6.2.3): its header, its lessons, add / reorder / delete. */
export function ModuleSection({
  module,
  position,
  count,
  lessons,
  courseId,
  mode,
  defaultLocale,
  locked,
  reorder,
  attach,
  dropSlot,
  onDeleted,
}: ModuleSectionProps) {
  const t = useTranslations('courseEditor');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { toast } = useToast();
  const { refresh } = useEditorAction();
  const focusLater = usePendingFocus();
  const remove = useConfirmedAction();
  const [editOpening, setEditOpening] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [lessonOpening, setLessonOpening] = useState(0);
  const [lessonOpen, setLessonOpen] = useState(false);
  const text = pickTranslation(module.translations, locale, module.defaultLocale);
  const lessonsById = byId(lessons);
  const list = useReorderList({
    ids: lessons.map((lesson) => lesson.id),
    save: (orderedIds) => reorderLessonsAction({ courseId, moduleId: module.id, orderedIds }),
    nameOf: (id) => {
      const lesson = lessonsById[id];
      return lesson ? pickTranslation(lesson.translations, locale, lesson.defaultLocale).title : '';
    },
  });
  const sortable = useSortable({ ids: list.order, onMove: list.moveTo, disabled: list.busy });
  const untranslated = EDITABLE_LOCALES.filter(
    (candidate) => candidate !== module.defaultLocale && !hasTranslation(module.translations, candidate),
  );
  const atLimit = lessons.length >= CONTENT_LIMITS.lessonsPerModule;
  const headingId = anchors.module(module.id);

  function onLessonDeleted(lessonId: string) {
    const index = list.order.indexOf(lessonId);
    const neighbour = list.order[index + 1] ?? list.order[index - 1];
    focusLater(neighbour === undefined ? headingId : anchors.lesson(neighbour));
    refresh();
  }

  return (
    <li ref={attach} className={cn('relative', reorder.dragging && 'opacity-60')}>
      <DropIndicator slot={dropSlot} index={position - 1} count={count} />
      <Card className="gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start gap-2">
          <DragHandle handle={reorder.handle} disabled={reorder.busy} className="-ms-2" />
          <div className="flex min-w-0 flex-1 basis-56 flex-col gap-1.5">
            <h3
              id={headingId}
              tabIndex={-1}
              className="rounded-sm text-base leading-snug font-bold break-words text-ink"
            >
              {t('outline.moduleHeading', { position, title: text.title })}
            </h3>
            {text.description && (
              <p className="line-clamp-3 text-sm break-words text-ink-muted">{text.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Chip>{t('outline.lessonCount', { count: lessons.length })}</Chip>
              {untranslated.map((candidate) => (
                <Chip key={candidate}>
                  {t('outline.untranslated', { language: tCommon(`locale.names.${candidate}`) })}
                </Chip>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <ReorderButtons
              name={text.title}
              index={position - 1}
              count={count}
              onMove={reorder.step}
              disabled={reorder.busy}
              idPrefix={`module-${module.id}-move`}
            />
            <Button
              size="sm"
              variant="ghost"
              aria-label={t('module.editLabel', { module: text.title })}
              onClick={() => {
                setEditOpening((n) => n + 1);
                setEditOpen(true);
              }}
            >
              {tCommon('actions.edit')}
            </Button>
            {!locked && lessons.length === 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="text-danger hover:bg-danger/10"
                aria-label={t('module.deleteLabel', { module: text.title })}
                onClick={remove.show}
              >
                {tCommon('actions.delete')}
              </Button>
            )}
          </div>
        </div>
        {lessons.length === 0 ? (
          <p className="text-sm text-ink-muted">{t('outline.noLessons')}</p>
        ) : (
          <ol aria-busy={list.busy} className="flex flex-col">
            {list.order.map((lessonId, index) => {
              const lesson = lessonsById[lessonId];
              if (lesson === undefined) return null;
              return (
                <LessonRowItem
                  key={lessonId}
                  lesson={lesson}
                  position={index + 1}
                  count={list.order.length}
                  courseId={courseId}
                  mode={mode}
                  locked={locked}
                  reorder={rowReorder(list, sortable, lessonId, `lesson-${lessonId}-move`)}
                  attach={sortable.itemRef(lessonId)}
                  dropSlot={sortable.indicatorSlot}
                  onDeleted={onLessonDeleted}
                />
              );
            })}
          </ol>
        )}
        <div role="status" aria-live="polite" className="sr-only">
          {list.announcement}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            aria-label={t('outline.addLessonTo', { module: text.title })}
            disabled={atLimit}
            onClick={() => {
              setLessonOpening((n) => n + 1);
              setLessonOpen(true);
            }}
          >
            <Plus aria-hidden="true" />
            {t('outline.addLesson')}
          </Button>
          {atLimit && (
            <p className="text-sm text-ink-muted">
              {t('outline.lessonLimit', { max: CONTENT_LIMITS.lessonsPerModule })}
            </p>
          )}
        </div>
      </Card>
      {editOpening > 0 && (
        <ModuleDialog
          key={editOpening}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          courseId={courseId}
          module={module}
          defaultLocale={defaultLocale}
          onSaved={() => {
            setEditOpen(false);
            refresh();
          }}
        />
      )}
      {lessonOpening > 0 && (
        <LessonDialog
          key={lessonOpening}
          open={lessonOpen}
          onClose={() => setLessonOpen(false)}
          courseId={courseId}
          moduleId={module.id}
          moduleTitle={text.title}
          defaultLocale={defaultLocale}
          onCreated={(lessonId) => {
            setLessonOpen(false);
            focusLater(anchors.lesson(lessonId));
            refresh();
          }}
        />
      )}
      {!locked && (
        <ConfirmDialog
          open={remove.open}
          onClose={remove.close}
          title={t('module.deleteTitle', { module: text.title })}
          description={t('module.deleteDescription')}
          confirmLabel={tCommon('actions.delete')}
          confirmVariant="danger"
          pending={remove.pending}
          error={remove.error}
          onConfirm={() =>
            remove.confirm(() => deleteModuleAction({ courseId, moduleId: module.id }), {
              context: { action: 'deleteModule', hasLessons: lessons.length > 0 },
              onSuccess: () => {
                toast({ tone: 'success', title: t('module.deleted') });
                onDeleted(module.id);
              },
            })
          }
        />
      )}
    </li>
  );
}
