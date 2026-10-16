'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Alert, Button, FormField, Input, Textarea } from '@/components/ui';
import { SUBMISSION_LIMITS } from '@/lib/limits';
import type { FileRef, SubmissionType } from '@/types/common';
import { AttachmentsField } from './AttachmentsField';
import { focusInView } from './focus';
import { SessionEndedAlert } from './SessionEndedAlert';
import type { SubmissionFormProps } from './SubmissionForm';
import { SubmissionContentFields } from './SubmissionContentFields';
import {
  initialDraft,
  isFileType,
  sentAttachments,
  type FormField as DraftField,
  type SubmissionDraft,
  type SubmissionSeed,
} from './submission-form-model';
import { SubmissionTypeField } from './SubmissionTypeField';
import { useValidationMessage } from './use-action-error';
import { useSubmitWork, type FormAlert } from './use-submit-work';

export interface SubmissionEditorProps extends SubmissionFormProps {
  /** The returned attempt a new version starts from (WS-D's own pages), or null. */
  seed: SubmissionSeed | null;
  /** Called after the success toast, before the refresh or push. */
  onSubmitted?: (submissionId: string) => void;
}

function FormAlertView({ alert }: { alert: FormAlert }) {
  const t = useTranslations('projects');
  if (alert === 'session') {
    return (
      <SessionEndedAlert
        description={t('form.errors.sessionEnded')}
        loginLabel={t('form.errors.loginAgain')}
      />
    );
  }
  if (alert === 'conflict') return <Alert tone="warning">{t('form.errors.conflict')}</Alert>;
  if (alert === 'not_found') return <Alert tone="danger">{t('form.errors.notFound')}</Alert>;
  return <Alert tone="danger">{t('form.errors.form')}</Alert>;
}

/**
 * The submission form (SPEC-D 5.3): type, title, the work itself, files, description. The draft
 * lives here until it is sent; a refresh of the page does not reset it.
 */
export function SubmissionEditor({
  target,
  allowedTypes,
  previousSubmissionId,
  seed,
  onSubmitted,
}: SubmissionEditorProps) {
  const t = useTranslations('projects');
  const validationMessage = useValidationMessage();
  const baseId = useId();
  const ids = {
    type: `${baseId}-type`,
    title: `${baseId}-title`,
    description: `${baseId}-description`,
    text: `${baseId}-text`,
    code: `${baseId}-code`,
    codeLanguage: `${baseId}-language`,
    linkUrl: `${baseId}-link`,
    files: `${baseId}-files`,
  } satisfies Record<DraftField, string>;
  const [draft, setDraft] = useState<SubmissionDraft>(() => initialDraft(allowedTypes, seed));
  const formRef = useRef<HTMLFormElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  function focusField(field: DraftField) {
    const element = document.getElementById(ids[field]);
    if (element === null) return;
    // A group (type cards, files) is focused on its chosen radio, or its own wrapper.
    const control =
      field === 'type'
        ? (element.querySelector<HTMLElement>('input:checked') ?? element)
        : element;
    focusInView(control);
  }

  const { pending, fieldErrors, formAlert, submit, clearFieldError } = useSubmitWork({
    target,
    previousSubmissionId: previousSubmissionId ?? null,
    onSubmitted,
    formRef,
    submitRef,
    alertRef,
    focusField,
  });

  const errors: Partial<Record<DraftField, string>> = {};
  for (const [field, key] of Object.entries(fieldErrors) as [DraftField, string][]) {
    errors[field] = validationMessage(key);
  }

  function update(field: Exclude<DraftField, 'type' | 'files'>, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
  }

  function setType(type: SubmissionType) {
    // Every field keeps its value: switching back finds the work where it was.
    setDraft((current) => ({ ...current, type }));
    clearFieldError('type');
  }

  function addFile(file: FileRef) {
    setDraft((current) => ({ ...current, attachments: [...current.attachments, file] }));
    clearFieldError('files');
  }

  function removeFile(fileId: string) {
    setDraft((current) => ({
      ...current,
      attachments: current.attachments.filter((file) => file.fileId !== fileId),
    }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(draft);
  }

  return (
    <form
      ref={formRef}
      noValidate
      aria-label={t('form.label')}
      onSubmit={onSubmit}
      className="flex max-w-3xl min-w-0 flex-col gap-5"
    >
      {formAlert !== null && (
        <div ref={alertRef} tabIndex={-1} className="rounded-control">
          <FormAlertView alert={formAlert} />
        </div>
      )}
      <Alert tone="info" live="off">
        {t('form.privacy')}
      </Alert>

      <SubmissionTypeField
        allowedTypes={allowedTypes}
        value={draft.type}
        onChange={setType}
        error={errors.type}
        containerId={ids.type}
      />

      <FormField
        id={ids.title}
        label={t('form.title.label')}
        hint={t('form.title.hint', { max: SUBMISSION_LIMITS.titleChars })}
        error={errors.title}
        required
      >
        <Input
          name="title"
          maxLength={SUBMISSION_LIMITS.titleChars}
          autoComplete="off"
          value={draft.title}
          onChange={(event) => update('title', event.target.value)}
        />
      </FormField>

      {isFileType(draft.type) ? (
        <AttachmentsField
          kind={draft.type}
          files={sentAttachments(draft)}
          onAdd={addFile}
          onRemove={removeFile}
          error={errors.files}
          listId={ids.files}
        />
      ) : (
        <SubmissionContentFields
          type={draft.type}
          values={draft}
          onChange={update}
          errors={errors}
          ids={ids}
        />
      )}

      <FormField
        id={ids.description}
        label={t('form.description.label')}
        hint={t('form.description.hint', { max: SUBMISSION_LIMITS.descriptionChars })}
        error={errors.description}
        optional
      >
        <Textarea
          name="description"
          rows={4}
          maxLength={SUBMISSION_LIMITS.descriptionChars}
          value={draft.description}
          onChange={(event) => update('description', event.target.value)}
        />
      </FormField>

      <div>
        <Button
          ref={submitRef}
          type="submit"
          loading={pending}
          className="w-full sm:w-auto"
        >
          {!pending && <Send aria-hidden="true" />}
          {previousSubmissionId ? t('form.resubmit') : t('form.submit')}
        </Button>
      </div>
    </form>
  );
}
