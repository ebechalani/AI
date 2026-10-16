'use client';

import { useId, useRef, type ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Alert, Button, ProgressBar, Spinner } from '@/components/ui';
import type { FileKind, FilePurpose, FileRef, MediaRef } from '@/types/common';
import { SessionEndedAlert } from './SessionEndedAlert';
import {
  acceptAttribute,
  kindLimits,
  type UploadErrorView,
  type UploadTarget,
} from './upload-model';
import { useActionErrorMessage, useValidationMessage } from './use-action-error';
import { useFileUpload } from './use-file-upload';

export interface FileUploadProps {
  purpose: FilePurpose;
  kinds: FileKind[];
  /** For `course_media`: the course the media belongs to; null = official media without a course. */
  courseId?: string | null;
  official?: boolean;
  /** Called once the file is registered (uploadFile() then registerUploadAction). */
  onUploaded: (result: { file: FileRef; media: MediaRef | null }) => void;
}

const MB = 1024 * 1024;

function UploadError({ view }: { view: UploadErrorView }) {
  const t = useTranslations('projects');
  const validationMessage = useValidationMessage();
  const errorMessage = useActionErrorMessage();
  if (view.kind === 'session') {
    return <SessionEndedAlert loginLabel={t('form.errors.loginAgain')} live="assertive" />;
  }
  const message =
    view.kind === 'validation'
      ? validationMessage(view.key)
      : view.kind === 'projects'
        ? t(view.key)
        : errorMessage(view.error);
  return (
    <Alert tone="danger" live="assertive">
      {message}
    </Alert>
  );
}

/**
 * The one upload control of the app (ARCHITECTURE.md 7.7): one file per choice, checked in the
 * browser first, uploaded to Storage, then registered by the server. The result is reported
 * through `onUploaded`; the control itself keeps no list.
 */
export function FileUpload({ purpose, kinds, courseId, official, onUploaded }: FileUploadProps) {
  const t = useTranslations('projects');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const hintId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const target: UploadTarget =
    purpose === 'submission'
      ? { purpose: 'submission' }
      : { purpose: 'course_media', courseId: courseId ?? null, official: official ?? false };
  const { state, announcement, succeeded, start } = useFileUpload({
    target,
    kinds,
    onUploaded,
    doneMessage: (name) => t('upload.done', { name }),
    containerRef,
    buttonRef,
  });
  const busy = state.phase === 'uploading' || state.phase === 'registering';
  const list = new Intl.ListFormat(locale, { type: 'disjunction' });
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    // The same file can be chosen again after a failure.
    input.value = '';
    if (file !== undefined) void start(file);
  }

  return (
    <div ref={containerRef} className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-col items-start gap-1.5">
        <Button
          ref={buttonRef}
          variant="secondary"
          loading={busy}
          aria-describedby={hintId}
          onClick={() => inputRef.current?.click()}
        >
          {!busy && <Upload aria-hidden="true" />}
          {succeeded ? t('upload.chooseAnother') : t('upload.choose')}
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          accept={acceptAttribute(kinds)}
          onChange={onChange}
        />
        <div id={hintId} className="flex flex-col text-sm text-ink-muted">
          {kindLimits(kinds).map((limit) => (
            <span key={limit.kind}>
              {t('upload.limit', {
                types: list.format(limit.types),
                size: tCommon('units.megabytes', { value: number.format(limit.maxBytes / MB) }),
              })}
            </span>
          ))}
        </div>
      </div>

      {state.phase === 'uploading' && (
        <div className="flex flex-col gap-1.5">
          <p aria-hidden="true" className="text-sm break-all text-ink">
            {t('upload.uploading', { name: state.name })}
          </p>
          <ProgressBar
            value={state.percent}
            label={t('upload.uploading', { name: state.name })}
            showValue
          />
        </div>
      )}
      {state.phase === 'registering' && (
        <p className="flex items-center gap-2 text-sm break-all text-ink">
          <Spinner size="sm" label={t('upload.registering', { name: state.name })} />
          <span aria-hidden="true">{t('upload.registering', { name: state.name })}</span>
        </p>
      )}
      {state.phase === 'error' && <UploadError view={state.view} />}

      {/* Always mounted, so the success is announced when its text arrives. */}
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
