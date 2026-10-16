'use client';

import { useEffect, useRef, useState } from 'react';
import { File as FileIcon, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { SUBMISSION_LIMITS } from '@/lib/limits';
import type { FileKind, FileRef } from '@/types/common';
import { FileUpload } from './FileUpload';
import { focusInView, focusWasLost } from './focus';
import { fileSize, fileTypeLabel } from './projects-model';

export interface AttachmentsFieldProps {
  kind: FileKind;
  /** The files of the selected kind, in the order they were added. */
  files: FileRef[];
  onAdd: (file: FileRef) => void;
  onRemove: (fileId: string) => void;
  error?: string;
  /** The list's wrapper: the form focuses it after a files error. */
  listId: string;
}

/** The files of a file-type submission, not sent yet: the list, Remove, and FileUpload. */
export function AttachmentsField({
  kind,
  files,
  onAdd,
  onRemove,
  error,
  listId,
}: AttachmentsFieldProps) {
  const t = useTranslations('projects');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const legendId = `${listId}-legend`;
  const hintId = `${listId}-hint`;
  const errorId = `${listId}-error`;
  const listRef = useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = useState('');
  // After a removal, focus goes to the next file's Remove button, else to the list.
  const [focusAfterRemove, setFocusAfterRemove] = useState<{ index: number } | null>(null);
  const canAdd = files.length < SUBMISSION_LIMITS.maxAttachments;
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });

  useEffect(() => {
    if (focusAfterRemove === null) return;
    const list = listRef.current;
    const buttons = list?.querySelectorAll<HTMLButtonElement>('button[data-remove]') ?? [];
    focusInView(buttons[focusAfterRemove.index] ?? buttons[buttons.length - 1] ?? list ?? null);
  }, [focusAfterRemove]);

  // The upload control gives way to "maximum reached" with the fifth file: focus, which was on
  // its button, goes to the list.
  const couldAdd = useRef(canAdd);
  useEffect(() => {
    const filledUp = couldAdd.current && !canAdd;
    couldAdd.current = canAdd;
    if (filledUp && focusWasLost(null)) focusInView(listRef.current);
  }, [canAdd]);

  function remove(file: FileRef, index: number) {
    onRemove(file.fileId);
    setAnnouncement(t('form.files.removed', { name: file.fileName }));
    setFocusAfterRemove({ index });
  }

  return (
    <fieldset
      className="flex min-w-0 flex-col gap-3"
      aria-describedby={error ? `${errorId} ${hintId}` : hintId}
    >
      <legend id={legendId} className="mb-1.5 text-sm font-semibold text-ink">
        {t('form.files.label')}
      </legend>
      <p id={hintId} className="-mt-1 text-sm text-ink-muted">
        {t('form.files.hint', { max: SUBMISSION_LIMITS.maxAttachments })}
      </p>
      <div
        id={listId}
        ref={listRef}
        tabIndex={-1}
        aria-labelledby={legendId}
        className="rounded-control"
      >
        {files.length === 0 ? (
          <p className="text-sm text-ink-muted">{t('form.files.empty')}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-control border border-border">
            {files.map((file, index) => {
              const size = fileSize(file.sizeBytes);
              const sizeLabel = tCommon(`units.${size.unit}`, { value: number.format(size.value) });
              const type = fileTypeLabel(file.fileName, file.contentType);
              return (
                <li key={file.fileId} className="flex flex-wrap items-center gap-3 px-3 py-2">
                  <FileIcon aria-hidden="true" className="size-5 shrink-0 text-ink-muted" />
                  <div className="flex min-w-0 flex-1 basis-40 flex-col">
                    <span className="text-sm font-medium break-all text-ink">{file.fileName}</span>
                    <span className="text-xs text-ink-muted">
                      {type ? t('attachments.meta', { type, size: sizeLabel }) : sizeLabel}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    data-remove=""
                    aria-label={t('form.files.removeName', { name: file.fileName })}
                    onClick={() => remove(file, index)}
                  >
                    <X aria-hidden="true" />
                    {tCommon('actions.remove')}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      {canAdd ? (
        <FileUpload
          purpose="submission"
          kinds={[kind]}
          onUploaded={({ file }) => onAdd(file)}
        />
      ) : (
        <p className="text-sm text-ink-muted">
          {t('form.files.limitReached', { max: SUBMISSION_LIMITS.maxAttachments })}
        </p>
      )}
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </fieldset>
  );
}
