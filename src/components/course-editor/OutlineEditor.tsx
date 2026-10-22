'use client';

import { useState } from 'react';
import { LayoutList, Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { reorderModulesAction } from '@/actions/course-editor';
import { Button, EmptyState } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { CONTENT_LIMITS } from '@/lib/limits';
import type { Locale } from '@/types/common';
import { usePendingFocus } from './focus';
import { ModuleDialog } from './ModuleDialog';
import { ModuleSection } from './ModuleSection';
import { anchors, type EditorMode } from './paths';
import { rowReorder } from './row-reorder';
import { byId, type LessonRow, type ModuleRow } from './rows';
import { useEditorAction } from './use-editor-action';
import { useReorderList } from './use-reorder-list';
import { useSortable } from './use-sortable';

export interface OutlineEditorProps {
  courseId: string;
  mode: EditorMode;
  defaultLocale: Locale;
  /** By order. */
  modules: ModuleRow[];
  /** By module, then by order. */
  lessons: LessonRow[];
  locked: boolean;
}

/** The course's modules and lessons (6.2.3): add, reorder, open, delete. */
export function OutlineEditor({
  courseId,
  mode,
  defaultLocale,
  modules,
  lessons,
  locked,
}: OutlineEditorProps) {
  const t = useTranslations('courseEditor');
  const locale = useLocale();
  const { refresh } = useEditorAction();
  const focusLater = usePendingFocus();
  const [opening, setOpening] = useState(0);
  const [open, setOpen] = useState(false);
  const modulesById = byId(modules);
  const list = useReorderList({
    ids: modules.map((module) => module.id),
    save: (orderedIds) => reorderModulesAction({ courseId, orderedIds }),
    nameOf: (id) => {
      const row = modulesById[id];
      return row ? pickTranslation(row.translations, locale, row.defaultLocale).title : '';
    },
  });
  const sortable = useSortable({ ids: list.order, onMove: list.moveTo, disabled: list.busy });
  const atLimit = modules.length >= CONTENT_LIMITS.modulesPerCourse;

  function openDialog() {
    setOpening((n) => n + 1);
    setOpen(true);
  }

  function onModuleDeleted(moduleId: string) {
    const index = list.order.indexOf(moduleId);
    const neighbour = list.order[index + 1] ?? list.order[index - 1];
    focusLater(neighbour === undefined ? anchors.outline : anchors.module(neighbour));
    refresh();
  }

  const addButton = (
    <Button variant="secondary" disabled={atLimit} onClick={openDialog}>
      <Plus aria-hidden="true" />
      {t('outline.addModule')}
    </Button>
  );

  return (
    <section aria-labelledby={`${anchors.outline}-title`} className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2
          id={anchors.outline}
          tabIndex={-1}
          className="rounded-sm text-xl font-bold text-ink"
          aria-describedby={`${anchors.outline}-count`}
        >
          <span id={`${anchors.outline}-title`}>{t('outline.title')}</span>
        </h2>
        <p id={`${anchors.outline}-count`} className="text-sm text-ink-muted">
          {t('outline.moduleCount', { count: modules.length, max: CONTENT_LIMITS.modulesPerCourse })}
        </p>
      </div>
      {modules.length === 0 ? (
        <EmptyState
          icon={<LayoutList />}
          titleAs="h3"
          title={t('outline.empty.title')}
          description={t('outline.empty.description')}
          action={addButton}
        />
      ) : (
        <>
          <ol aria-busy={list.busy} className="flex flex-col gap-4">
            {list.order.map((moduleId, index) => {
              const row = modulesById[moduleId];
              if (row === undefined) return null;
              return (
                <ModuleSection
                  key={moduleId}
                  module={row}
                  position={index + 1}
                  count={list.order.length}
                  lessons={lessons.filter((lesson) => lesson.moduleId === moduleId)}
                  courseId={courseId}
                  mode={mode}
                  defaultLocale={defaultLocale}
                  locked={locked}
                  reorder={rowReorder(list, sortable, moduleId, `module-${moduleId}-move`)}
                  attach={sortable.itemRef(moduleId)}
                  dropSlot={sortable.indicatorSlot}
                  onDeleted={onModuleDeleted}
                />
              );
            })}
          </ol>
          <div className="flex flex-wrap items-center gap-3">
            {addButton}
            {atLimit && (
              <p className="text-sm text-ink-muted">
                {t('outline.moduleLimit', { max: CONTENT_LIMITS.modulesPerCourse })}
              </p>
            )}
          </div>
        </>
      )}
      <div role="status" aria-live="polite" className="sr-only">
        {list.announcement}
      </div>
      {opening > 0 && (
        <ModuleDialog
          key={opening}
          open={open}
          onClose={() => setOpen(false)}
          courseId={courseId}
          module={null}
          defaultLocale={defaultLocale}
          onSaved={(moduleId) => {
            setOpen(false);
            focusLater(anchors.module(moduleId));
            refresh();
          }}
        />
      )}
    </section>
  );
}
