'use client';

import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FormField, RadioGroup, Select } from '@/components/ui';
import { ML_ACTIVITY_HOSTS } from '@/lib/learning/ml-activity';
import { CONTENT_LIMITS } from '@/lib/limits';
import {
  ML_ACCESS_MODES,
  ML_CODE_TOOLS,
  ML_PROJECT_TYPES,
  type MlAccessMode,
  type MlCodeTool,
  type MlProjectType,
} from '@/types/content';
import { TextField } from '../TextField';
import { BlockTextField } from './BlockTextField';
import { withData, type BlockDataProps, type BlockTextProps } from './types';

export function MlActivityData({
  draft,
  onChange,
  errors,
  disabled,
}: BlockDataProps<'ml_activity'>) {
  const t = useTranslations('courseEditor');
  const locale = useLocale();
  const name = useId();
  const hosts = new Intl.ListFormat(locale, { type: 'conjunction' }).format(ML_ACTIVITY_HOSTS);
  return (
    <>
      <TextField
        label={t('blocks.ml.url')}
        value={draft.data.url}
        onChange={(url) => onChange(withData(draft, { url }))}
        required
        type="url"
        inputMode="url"
        max={CONTENT_LIMITS.embedUrlChars}
        hint={t('blocks.ml.urlHint', { hosts })}
        error={errors('data.url')}
        disabled={disabled}
      />
      <TextField
        label={t('blocks.ml.worksheetUrl')}
        value={draft.data.worksheetUrl}
        onChange={(worksheetUrl) => onChange(withData(draft, { worksheetUrl }))}
        type="url"
        inputMode="url"
        max={CONTENT_LIMITS.embedUrlChars}
        hint={t('blocks.ml.worksheetUrlHint')}
        error={errors('data.worksheetUrl')}
        disabled={disabled}
      />
      <FormField
        label={t('blocks.ml.projectType')}
        error={errors('data.projectType')}
        className="max-w-xs"
      >
        <Select
          value={draft.data.projectType}
          disabled={disabled}
          onChange={(event) =>
            onChange(withData(draft, { projectType: event.target.value as MlProjectType }))
          }
          options={ML_PROJECT_TYPES.map((type) => ({
            value: type,
            label: t(`blocks.ml.projectTypes.${type}`),
          }))}
        />
      </FormField>
      <FormField
        label={t('blocks.ml.codeTool')}
        error={errors('data.codeTool')}
        className="max-w-xs"
      >
        <Select
          value={draft.data.codeTool}
          disabled={disabled}
          onChange={(event) =>
            onChange(withData(draft, { codeTool: event.target.value as MlCodeTool }))
          }
          options={ML_CODE_TOOLS.map((tool) => ({
            value: tool,
            label: t(`blocks.ml.codeTools.${tool}`),
          }))}
        />
      </FormField>
      {/* A ready-trained model needs no login and no project, so learners never see the access
          mode (MlActivityBlock); it stays stored, and comes back if the type changes again. */}
      {draft.data.projectType !== 'pretrained' && (
        <RadioGroup
          legend={t('blocks.ml.access')}
          name={name}
          value={draft.data.access}
          disabled={disabled}
          error={errors('data.access')}
          onValueChange={(value) => onChange(withData(draft, { access: value as MlAccessMode }))}
          options={ML_ACCESS_MODES.map((access) => ({
            value: access,
            label: t(`blocks.ml.accessModes.${access}`),
            description: t(`blocks.ml.accessModes.${access}Description`),
          }))}
        />
      )}
    </>
  );
}

export function MlActivityText(form: BlockTextProps<'ml_activity'>) {
  const t = useTranslations('courseEditor');
  return (
    <>
      <BlockTextField
        form={form}
        field="title"
        label={t('blocks.ml.title')}
        max={CONTENT_LIMITS.titleChars}
      />
      <BlockTextField
        form={form}
        field="instructions"
        label={t('blocks.ml.instructions')}
        max={CONTENT_LIMITS.activityInstructionsChars}
        multiline
        rows={6}
        hint={t('blocks.ml.instructionsHint')}
      />
      <BlockTextField
        form={form}
        field="bringBack"
        label={t('blocks.ml.bringBack')}
        max={CONTENT_LIMITS.hintChars}
        multiline
        rows={3}
        hint={t('blocks.ml.bringBackHint')}
      />
      <BlockTextField
        form={form}
        field="hint"
        label={t('blocks.ml.hint')}
        max={CONTENT_LIMITS.hintChars}
        multiline
        rows={3}
      />
    </>
  );
}
