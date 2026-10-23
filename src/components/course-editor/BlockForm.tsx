'use client';

import type { FormEvent, RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { Alert, Button, Card, FormField, Select } from '@/components/ui';
import type { Locale } from '@/types/common';
import { LESSON_STAGES, type LessonStage } from '@/types/content';
import { blockFormsOf } from './block-forms/registry';
import type { BlockFormContext } from './block-forms/types';
import type { BlockDraft } from './block-model';
import { ConflictAlert } from './ConflictAlert';
import { FormActions } from './FormActions';
import { FormAlert } from './FormAlert';
import { LanguageSwitch } from './LanguageSwitch';
import { translationStates, type TextDraft } from './translations';
import type { FormFailure } from './use-editor-action';

export interface BlockFormProps {
  formId: string;
  formRef: RefObject<HTMLFormElement | null>;
  /** The block heading's id (an edit). */
  labelledBy?: string;
  draft: BlockDraft;
  onChange(draft: BlockDraft): void;
  language: Locale;
  onLanguageChange(locale: Locale): void;
  errors(path: string): string | undefined;
  context: BlockFormContext;
  pending: boolean;
  dirty: boolean;
  failure: FormFailure | null;
  alertRef: RefObject<HTMLDivElement | null>;
  /** "2 problems in French." */
  note: string | null;
  conflict: boolean;
  conflictRef: RefObject<HTMLDivElement | null>;
  onTakeTheirs(): void;
  onKeepMine(): void;
  /** The block was deleted elsewhere while this form was open (5.4). */
  orphan: boolean;
  onSubmit(): void;
  onCancel(): void;
}

/** Stage, data, language and text of one block (6.3.3). */
export function BlockForm({
  formId,
  formRef,
  labelledBy,
  draft,
  onChange,
  language,
  onLanguageChange,
  errors,
  context,
  pending,
  dirty,
  failure,
  alertRef,
  note,
  conflict,
  conflictRef,
  onTakeTheirs,
  onKeepMine,
  orphan,
  onSubmit,
  onCancel,
}: BlockFormProps) {
  const t = useTranslations('courseEditor');
  const tCommon = useTranslations('common');
  const tDomain = useTranslations('domain');
  const { Data, Text } = blockFormsOf(draft.type);
  const shared = { draft, onChange, errors, context, disabled: pending };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form id={formId} ref={formRef} noValidate aria-labelledby={labelledBy} onSubmit={submit}>
      <Card tone="muted" className="gap-5 p-4 sm:p-5">
        {orphan && (
          <Alert
            tone="danger"
            action={
              <div className="flex flex-wrap gap-2">
                {dirty ? (
                  <>
                    <Button size="sm" type="submit" loading={pending}>
                      {t('blocks.saveAsNew')}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={onCancel} disabled={pending}>
                      {t('blocks.discard')}
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="secondary" onClick={onCancel}>
                    {tCommon('actions.close')}
                  </Button>
                )}
              </div>
            }
          >
            {t('blocks.orphan')}
          </Alert>
        )}
        {conflict && (
          <ConflictAlert ref={conflictRef} onTakeTheirs={onTakeTheirs} onKeepMine={onKeepMine} />
        )}
        <FormField
          label={t('blocks.stage')}
          hint={t('blocks.stageHint')}
          error={errors('stage')}
          id={`${formId}-stage`}
          className="max-w-xs"
        >
          <Select
            value={draft.stage}
            disabled={pending}
            onChange={(event) => onChange({ ...draft, stage: event.target.value as LessonStage })}
            options={LESSON_STAGES.map((stage) => ({ value: stage, label: tDomain(`stages.${stage}`) }))}
          />
        </FormField>
        {Data && <Data {...shared} />}
        <LanguageSwitch
          name={`${formId}-language`}
          value={language}
          onChange={onLanguageChange}
          defaultLocale={draft.defaultLocale}
          states={translationStates(draft.text as TextDraft<string>, draft.defaultLocale)}
          disabled={pending}
        />
        <Text {...shared} locale={language} required={language === draft.defaultLocale} />
        <FormAlert ref={alertRef} failure={failure}>
          {note && <p className="mt-1">{note}</p>}
        </FormAlert>
        {!orphan && (
          <FormActions
            saveLabel={t('blocks.save')}
            pending={pending}
            onDiscard={onCancel}
            discardLabel={tCommon('actions.cancel')}
          />
        )}
      </Card>
    </form>
  );
}
