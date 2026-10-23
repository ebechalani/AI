'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Alert, FormField, Select } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import { CONTENT_LIMITS } from '@/lib/limits';
import { linkChoices } from '../block-model';
import { editorPaths } from '../paths';
import { BlockTextField } from './BlockTextField';
import { withData, type BlockDataProps, type BlockTextProps } from './types';

export const LINK_CLASSES =
  'rounded-sm text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800';

export function QuizBlockData({ draft, onChange, errors, context, disabled }: BlockDataProps<'quiz'>) {
  const t = useTranslations('courseEditor');
  const locale = useLocale();
  const paths = editorPaths(context.mode);
  const choices = linkChoices(context.quizzes, context.currentLinkId);
  const { quizId } = draft.data;
  return (
    <div className="flex flex-col gap-3">
      {choices.length === 0 && (
        <Alert tone="info" live="off">
          {t('blocks.quiz.noneFree')}
        </Alert>
      )}
      <FormField label={t('blocks.quiz.choose')} required error={errors('data.quizId')}>
        <Select
          value={quizId}
          placeholder={t('blocks.quiz.placeholder')}
          disabled={disabled}
          onChange={(event) => onChange(withData(draft, { quizId: event.target.value }))}
          options={choices.map((quiz) => ({
            value: quiz.id,
            label: t('blocks.quiz.option', {
              title: pickTranslation(quiz.translations, locale, quiz.defaultLocale).title,
              count: quiz.questionCount,
            }),
          }))}
        />
      </FormField>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {quizId !== '' && (
          <Link href={paths.quiz(context.courseId, quizId)} className={LINK_CLASSES}>
            {t('blocks.quiz.edit')}
          </Link>
        )}
        <Link href={paths.newQuiz(context.courseId, context.lessonId)} className={LINK_CLASSES}>
          {t('blocks.quiz.create')}
        </Link>
      </div>
    </div>
  );
}

export function QuizBlockText(form: BlockTextProps<'quiz'>) {
  const t = useTranslations('courseEditor');
  return (
    <BlockTextField
      form={form}
      field="intro"
      label={t('blocks.quiz.intro')}
      max={CONTENT_LIMITS.blockIntroChars}
      multiline
      rows={3}
    />
  );
}
