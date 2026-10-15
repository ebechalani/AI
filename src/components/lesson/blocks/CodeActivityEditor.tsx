'use client';

import { useState, type FormEvent } from 'react';
import { RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, FormField, Textarea } from '@/components/ui';
import { CONTENT_LIMITS } from '@/lib/limits';
import { useSaveResponse } from './use-save-response';

export interface CodeActivityEditorProps {
  courseId: string;
  lessonId: string;
  blockId: string;
  starterCode: string;
  /** The saved code, else the starter code. Read once: a refresh does not reset the draft. */
  initialCode: string;
  hint: string | null;
  readOnly: boolean;
}

/** A monospace editor that saves the learner's code with saveBlockResponseAction. */
export function CodeActivityEditor({
  courseId,
  lessonId,
  blockId,
  starterCode,
  initialCode,
  hint,
  readOnly,
}: CodeActivityEditorProps) {
  const t = useTranslations('lesson');
  const [draft, setDraft] = useState(initialCode);
  const [savedCode, setSavedCode] = useState(initialCode);
  const { pending, fieldError, save } = useSaveResponse({
    courseId,
    lessonId,
    blockId,
    savedMessage: t('blocks.code.saved'),
  });
  const dirty = draft !== savedCode;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly || !dirty) return;
    const code = draft;
    if (await save(code)) setSavedCode(code);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      {hint && (
        <details className="rounded-control border border-border">
          <summary className="flex min-h-11 cursor-pointer items-center rounded-control px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50">
            {t('blocks.code.hint')}
          </summary>
          <p className="border-t border-border px-4 py-3 text-sm text-ink">{hint}</p>
        </details>
      )}
      <FormField label={t('blocks.code.editorLabel')} error={fieldError}>
        <Textarea
          name="code"
          rows={8}
          maxLength={CONTENT_LIMITS.blockResponseChars}
          readOnly={readOnly}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          dir="ltr"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          // Not text-sm: the control sets its own size (16px, so phones do not zoom in).
          className="font-mono"
        />
      </FormField>
      <p className="text-sm text-ink-muted">
        {readOnly ? t('blocks.code.preview') : t('blocks.code.notRun')}
      </p>
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-end gap-3">
          {dirty && <span className="text-sm text-ink-muted">{t('blocks.code.unsaved')}</span>}
          <Button
            variant="ghost"
            size="sm"
            disabled={pending || draft === starterCode}
            onClick={() => setDraft(starterCode)}
          >
            <RotateCcw aria-hidden="true" className="rtl:-scale-x-100" />
            {t('blocks.code.reset')}
          </Button>
          <Button type="submit" size="sm" loading={pending} disabled={!dirty}>
            {t('blocks.code.save')}
          </Button>
        </div>
      )}
    </form>
  );
}
