'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Alert, FormField, Select } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import { CONTENT_LIMITS } from '@/lib/limits';
import { linkChoices } from '../block-model';
import { editorPaths } from '../paths';
import { BlockTextField } from './BlockTextField';
import { LINK_CLASSES } from './QuizBlockFields';
import { withData, type BlockDataProps, type BlockTextProps } from './types';

export function ProjectBlockData({
  draft,
  onChange,
  errors,
  context,
  disabled,
}: BlockDataProps<'project'>) {
  const t = useTranslations('courseEditor');
  const locale = useLocale();
  const paths = editorPaths(context.mode);
  const choices = linkChoices(context.projects, context.currentLinkId);
  const { projectId } = draft.data;
  return (
    <div className="flex flex-col gap-3">
      {choices.length === 0 && (
        <Alert tone="info" live="off">
          {t('blocks.project.noneFree')}
        </Alert>
      )}
      <FormField label={t('blocks.project.choose')} required error={errors('data.projectId')}>
        <Select
          value={projectId}
          placeholder={t('blocks.project.placeholder')}
          disabled={disabled}
          onChange={(event) => onChange(withData(draft, { projectId: event.target.value }))}
          options={choices.map((project) => ({
            value: project.id,
            label: t('blocks.project.option', {
              title: pickTranslation(project.translations, locale, project.defaultLocale).title,
            }),
          }))}
        />
      </FormField>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {projectId !== '' && (
          <Link href={paths.project(context.courseId, projectId)} className={LINK_CLASSES}>
            {t('blocks.project.edit')}
          </Link>
        )}
        <Link href={paths.newProject(context.courseId, context.lessonId)} className={LINK_CLASSES}>
          {t('blocks.project.create')}
        </Link>
      </div>
    </div>
  );
}

export function ProjectBlockText(form: BlockTextProps<'project'>) {
  const t = useTranslations('courseEditor');
  return (
    <BlockTextField
      form={form}
      field="intro"
      label={t('blocks.project.intro')}
      max={CONTENT_LIMITS.blockIntroChars}
      multiline
      rows={3}
    />
  );
}
