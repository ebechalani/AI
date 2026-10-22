'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createBlockAction, updateBlockAction } from '@/actions/course-editor';
import { useToast } from '@/components/ui';
import { blockInputSchema } from '@/lib/schemas/course';
import { parseInput } from '@/lib/schemas/common';
import type { Locale } from '@/types/common';
import type { BlockType, LessonBlock } from '@/types/content';
import { BlockForm } from './BlockForm';
import type { BlockFormContext } from './block-forms/types';
import { blockDraftToInput, blockLink, blockToDraft, newBlockDraft } from './block-model';
import { useEditorEvents } from './editor-events';
import { focusSyncNotice } from './SyncNotice';
import { EDITABLE_LOCALES } from './translations';
import { useEditorAction } from './use-editor-action';
import { useFormErrors } from './use-form-errors';
import { useServerSync } from './use-server-sync';
import { useRegisterDirty } from './unsaved-changes';

const ORDER = ['stage', 'data', 'translations'];
const SHOWN = new RegExp(
  `^(stage|data\\.[a-zA-Z]+|translations\\.(${EDITABLE_LOCALES.join('|')})\\.[a-zA-Z]+)$`,
);

export interface BlockEditorSlotProps {
  /** The stored block (or its snapshot when `orphan`); null for a new block. */
  block: LessonBlock | null;
  newType: BlockType | null;
  /** The block disappeared from the lesson while this form was open. */
  orphan: boolean;
  context: BlockFormContext;
  /** The lesson's block count (the limit message of a create). */
  blockCount: number;
  /** The course's language, for a new block. */
  defaultLocale: Locale;
  formId: string;
  labelledBy?: string;
  onClose(): void;
  /** After a save (the owner closes the slot, refreshes and focuses the block). */
  onSaved(blockId: string): void;
  onDirtyChange(dirty: boolean): void;
}

/** The open block's state (6.3.2): draft, sync, language, errors, submit. Renders `BlockForm`. */
export function BlockEditorSlot({
  block,
  newType,
  orphan,
  context,
  blockCount,
  defaultLocale,
  formId,
  labelledBy,
  onClose,
  onSaved,
  onDirtyChange,
}: BlockEditorSlotProps) {
  const t = useTranslations('courseEditor');
  const { toast } = useToast();
  const { run, refreshing } = useEditorAction();
  const events = useEditorEvents();
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const conflictRef = useRef<HTMLDivElement>(null);
  const serverDraft = block ? blockToDraft(block) : newBlockDraft(newType ?? 'rich_text', defaultLocale);
  const sync = useServerSync(serverDraft, { refreshing });
  const { draft, dirty, conflict } = sync;
  const [language, setLanguage] = useState<Locale>(serverDraft.defaultLocale);
  const [pending, setPending] = useState(false);
  useRegisterDirty('block-editor', dirty);
  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);
  const errors = useFormErrors({
    formRef,
    alertRef,
    language,
    setLanguage,
    order: ORDER,
    isShown: (path) => SHOWN.test(path),
    message: (key, path) => {
      if (key !== 'invalid' && key !== 'required') return undefined;
      if (path === 'data.fileId') return t('blocks.errors.fileRequired');
      if (path === 'data.quizId') return t('blocks.errors.quizRequired');
      if (path === 'data.projectId') return t('blocks.errors.projectRequired');
      return undefined;
    },
  });
  const creating = block === null || orphan;

  async function submit() {
    if (pending) return;
    if (events.pending) {
      focusSyncNotice();
      return;
    }
    if (conflict) {
      conflictRef.current?.focus();
      return;
    }
    const input = blockDraftToInput(draft);
    const parsed = parseInput(blockInputSchema, input);
    if (!parsed.success) {
      errors.show(parsed.fieldErrors);
      return;
    }
    errors.clear();
    setPending(true);
    const { courseId, lessonId } = context;
    const result = await run(
      async () => {
        if (creating) return createBlockAction({ courseId, lessonId, input });
        const saved = await updateBlockAction({ courseId, lessonId, blockId: block.id, input });
        return saved.ok ? { ok: true as const, data: { blockId: block.id } } : saved;
      },
      {
        context: {
          action: 'saveBlock',
          creating,
          blockCount,
          link: blockLink(draft)?.kind ?? null,
          teacherCourse: context.teacherCourse,
        },
        report: errors.fail,
        onFieldErrors: errors.show,
      },
    );
    setPending(false);
    if (!result.ok) return;
    sync.markSaved();
    toast({ tone: 'success', title: creating ? t('blocks.created') : t('blocks.saved') });
    onSaved(result.data.blockId);
  }

  return (
    <BlockForm
      formId={formId}
      formRef={formRef}
      labelledBy={labelledBy}
      draft={draft}
      onChange={sync.setDraft}
      language={language}
      onLanguageChange={setLanguage}
      errors={errors.errorFor}
      context={context}
      pending={pending}
      dirty={dirty}
      failure={errors.failure}
      alertRef={alertRef}
      note={errors.otherLanguageNote}
      conflict={conflict}
      conflictRef={conflictRef}
      onTakeTheirs={sync.takeTheirs}
      onKeepMine={sync.keepMine}
      orphan={orphan}
      onSubmit={() => void submit()}
      onCancel={onClose}
    />
  );
}
