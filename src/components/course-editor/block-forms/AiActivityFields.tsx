'use client';

import { useTranslations } from 'next-intl';
import { FormField, Select } from '@/components/ui';
import { CONTENT_LIMITS } from '@/lib/limits';
import { LAB_TOOL_IDS, TUTOR_MODES, type TutorMode } from '@/types/ai';
import { BlockTextField } from './BlockTextField';
import { withData, type BlockDataProps, type BlockTextProps } from './types';

export function AiActivityData({ draft, onChange, errors, context, disabled }: BlockDataProps<'ai_activity'>) {
  const t = useTranslations('courseEditor');
  const tDomain = useTranslations('domain');
  return (
    <>
      <FormField label={t('blocks.ai.mode')} error={errors('data.tutorMode')} className="max-w-xs">
        <Select
          value={draft.data.tutorMode}
          disabled={disabled}
          onChange={(event) => onChange(withData(draft, { tutorMode: event.target.value as TutorMode }))}
          options={TUTOR_MODES.map((mode) => ({ value: mode, label: tDomain(`tutorModes.${mode}`) }))}
        />
      </FormField>
      {!context.teacherCourse && (
        <FormField
          label={t('blocks.ai.labTool')}
          hint={t('blocks.ai.labToolHint')}
          error={errors('data.labToolId')}
          className="max-w-xs"
        >
          <Select
            value={draft.data.labToolId}
            disabled={disabled}
            onChange={(event) => onChange(withData(draft, { labToolId: event.target.value }))}
            options={[
              { value: '', label: t('blocks.ai.noLabTool') },
              ...LAB_TOOL_IDS.map((id) => ({ value: id, label: t(`blocks.ai.labTools.${id}`) })),
            ]}
          />
        </FormField>
      )}
    </>
  );
}

export function AiActivityText(form: BlockTextProps<'ai_activity'>) {
  const t = useTranslations('courseEditor');
  return (
    <>
      <BlockTextField
        form={form}
        field="instructions"
        label={t('blocks.ai.instructions')}
        max={CONTENT_LIMITS.activityInstructionsChars}
        multiline
        rows={5}
      />
      <BlockTextField
        form={form}
        field="starterPrompt"
        label={t('blocks.ai.starterPrompt')}
        max={CONTENT_LIMITS.starterPromptChars}
        multiline
        rows={3}
        hint={t('blocks.ai.starterPromptHint')}
      />
    </>
  );
}
