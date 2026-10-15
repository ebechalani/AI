'use client';

import { useRef, useState, type FormEvent } from 'react';
import { CircleCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, Chip, FormField, Textarea } from '@/components/ui';
import { responseLength } from '@/lib/learning/lesson-completion';
import { CONTENT_LIMITS } from '@/lib/limits';
import { revealOnFocus } from '../focus';
import { useSaveResponse } from './use-save-response';

export interface ReflectionFormProps {
  courseId: string;
  lessonId: string;
  blockId: string;
  prompt: string;
  minLength: number;
  /** The saved answer, or an empty string. Read once: a refresh does not reset the draft. */
  initialText: string;
  readOnly: boolean;
}

/** The reflection's answer: a counter towards `minLength` and a Save button (saveBlockResponseAction). */
export function ReflectionForm({
  courseId,
  lessonId,
  blockId,
  prompt,
  minLength,
  initialText,
  readOnly,
}: ReflectionFormProps) {
  const t = useTranslations('lesson');
  const [draft, setDraft] = useState(initialText);
  const [savedText, setSavedText] = useState(initialText);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const { pending, fieldError, save } = useSaveResponse({
    courseId,
    lessonId,
    blockId,
    savedMessage: t('blocks.reflection.saved'),
    fieldRef,
  });
  const length = responseLength(draft);
  const dirty = draft !== savedText;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly || !dirty) return;
    const text = draft;
    if (await save(text)) setSavedText(text);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      <FormField
        label={prompt}
        hint={t('blocks.reflection.minLength', { min: minLength })}
        error={fieldError}
      >
        <Textarea
          ref={fieldRef}
          name="text"
          rows={5}
          maxLength={CONTENT_LIMITS.blockResponseChars}
          readOnly={readOnly}
          onFocus={readOnly ? revealOnFocus : undefined}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      </FormField>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {minLength > 0 && (
            // The hint above carries the rule; the counter is for the eye only.
            <span aria-hidden="true" className="text-sm text-ink-muted tabular-nums">
              {t('blocks.reflection.count', { count: length, min: minLength })}
            </span>
          )}
          {minLength > 0 && length >= minLength && (
            <Chip tone="success" icon={<CircleCheck aria-hidden="true" />}>
              {t('blocks.reflection.longEnough')}
            </Chip>
          )}
        </div>
        {readOnly ? (
          <p className="text-sm text-ink-muted">{t('blocks.reflection.preview')}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {dirty && (
              <span className="text-sm text-ink-muted">{t('blocks.reflection.unsaved')}</span>
            )}
            <Button type="submit" size="sm" loading={pending} disabled={!dirty}>
              {t('blocks.reflection.save')}
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}
