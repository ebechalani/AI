'use client';

import { useLocale, useTranslations } from 'next-intl';
import { deleteLessonAction } from '@/actions/course-editor';
import { ConfirmDialog } from '@/components/classes/ConfirmDialog';
import { useDurationFormat } from '@/components/domain';
import { Button, Chip, useToast } from '@/components/ui';
import { hasTranslation, pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import { DragHandle } from './DragHandle';
import { DropIndicator } from './DropIndicator';
import { anchors, editorPaths, type EditorMode } from './paths';
import { ReorderButtons } from './ReorderButtons';
import type { RowReorder } from './row-reorder';
import type { LessonRow } from './rows';
import { EDITABLE_LOCALES } from './translations';
import { useConfirmedAction } from './use-confirmed-action';

export interface LessonRowItemProps {
  lesson: LessonRow;
  /** 1-based. */
  position: number;
  count: number;
  courseId: string;
  mode: EditorMode;
  /** Learners are enrolled: no delete. */
  locked: boolean;
  reorder: RowReorder;
  /** The row element's ref, read by the drag logic. */
  attach(element: HTMLElement | null): void;
  dropSlot: number | null;
  /** After a delete (the owner refreshes and moves the focus). */
  onDeleted(lessonId: string): void;
}

/** One lesson of a module (6.2.3): a link to its editor, its facts, reorder and delete. */
export function LessonRowItem({
  lesson,
  position,
  count,
  courseId,
  mode,
  locked,
  reorder,
  attach,
  dropSlot,
  onDeleted,
}: LessonRowItemProps) {
  const t = useTranslations('courseEditor');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const formatDuration = useDurationFormat();
  const { toast } = useToast();
  const remove = useConfirmedAction();
  const paths = editorPaths(mode);
  const title = pickTranslation(lesson.translations, locale, lesson.defaultLocale).title;
  const untranslated = EDITABLE_LOCALES.filter(
    (candidate) => candidate !== lesson.defaultLocale && !hasTranslation(lesson.translations, candidate),
  );
  const contents = {
    quizzes: lesson.quizIds.length,
    projects: lesson.projectIds.length,
    reflections: lesson.reflectionBlockIds.length,
  };
  const hasContents = contents.quizzes + contents.projects + contents.reflections > 0;

  return (
    <li
      ref={attach}
      className={cn(
        'relative flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border py-3',
        reorder.dragging && 'opacity-60',
      )}
    >
      <DropIndicator slot={dropSlot} index={position - 1} count={count} />
      <DragHandle handle={reorder.handle} disabled={reorder.busy} />
      <div className="flex min-w-0 flex-1 basis-56 flex-col gap-1">
        <Link
          id={anchors.lesson(lesson.id)}
          href={paths.lesson(courseId, lesson.id)}
          className="rounded-sm font-semibold break-words text-ink underline-offset-4 hover:text-brand-700 hover:underline"
        >
          {t('outline.lessonLink', { position, title })}
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
          {lesson.blockCount === 0 ? (
            <Chip tone="warning">{t('outline.noBlocks')}</Chip>
          ) : (
            <span>{t('outline.blockCount', { count: lesson.blockCount })}</span>
          )}
          <span>{formatDuration(lesson.estimatedMinutes)}</span>
          <span>{t('outline.xp', { xp: lesson.xpReward })}</span>
          {hasContents && <span>{t('outline.lessonContents', contents)}</span>}
          {untranslated.map((candidate) => (
            <Chip key={candidate}>
              {t('outline.untranslated', { language: t(`languageNames.${candidate}`) })}
            </Chip>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <ReorderButtons
          name={title}
          index={position - 1}
          count={count}
          onMove={reorder.step}
          disabled={reorder.busy}
          idPrefix={`lesson-${lesson.id}-move`}
        />
        {!locked && (
          <Button
            size="sm"
            variant="ghost"
            className="text-danger hover:bg-danger/10"
            aria-label={t('lesson.deleteLabel', { lesson: title })}
            onClick={remove.show}
          >
            {tCommon('actions.delete')}
          </Button>
        )}
      </div>
      {!locked && (
        <ConfirmDialog
          open={remove.open}
          onClose={remove.close}
          title={t('lesson.deleteTitle', { lesson: title })}
          description={t('lesson.deleteDescription', { blocks: lesson.blockCount })}
          confirmLabel={tCommon('actions.delete')}
          confirmVariant="danger"
          pending={remove.pending}
          error={remove.error}
          onConfirm={() =>
            remove.confirm(() => deleteLessonAction({ courseId, lessonId: lesson.id }), {
              context: { action: 'deleteStructure' },
              onSuccess: () => {
                toast({ tone: 'success', title: t('lesson.deleted') });
                onDeleted(lesson.id);
              },
            })
          }
        />
      )}
    </li>
  );
}
