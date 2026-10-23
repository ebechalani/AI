'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardTitle, RadioGroup, Switch } from '@/components/ui';
import { CONTENT_LIMITS } from '@/lib/limits';
import type { Locale } from '@/types/common';
import { REVEAL_ANSWERS, type RevealAnswers } from '@/types/quiz';
import { LanguageSwitch } from './LanguageSwitch';
import { NumberField } from './NumberField';
import type { QuizDraft } from './quiz-model';
import { TextField } from './TextField';
import type { TranslationState } from './translations';

const DEFAULT_ATTEMPTS = '3';

export interface QuizSettingsFieldsProps {
  draft: QuizDraft;
  set(patch: Partial<QuizDraft>): void;
  language: Locale;
  onLanguageChange(locale: Locale): void;
  states: Record<Locale, TranslationState>;
  errorFor(path: string): string | undefined;
  disabled: boolean;
  formId: string;
}

/** Title, instructions, pass mark, attempts, XP, shuffle and reveal rule (6.4). */
export function QuizSettingsFields({
  draft,
  set,
  language,
  onLanguageChange,
  states,
  errorFor,
  disabled,
  formId,
}: QuizSettingsFieldsProps) {
  const t = useTranslations('courseEditor');
  const [limitOn, setLimitOn] = useState(draft.maxAttempts !== '');
  const limited = limitOn || draft.maxAttempts !== '';
  const required = language === draft.defaultLocale;

  function setText(field: 'title' | 'instructions', value: string) {
    set({ text: { ...draft.text, [language]: { ...draft.text[language], [field]: value } } });
  }

  return (
    <Card className="gap-5 p-5 sm:p-6">
      <CardTitle as="h2" className="text-lg font-bold">
        {t('quiz.settingsTitle')}
      </CardTitle>
      <LanguageSwitch
        name={`${formId}-language`}
        value={language}
        onChange={onLanguageChange}
        defaultLocale={draft.defaultLocale}
        states={states}
        disabled={disabled}
      />
      <TextField
        label={t('fields.title')}
        locale={language}
        value={draft.text[language].title}
        onChange={(value) => setText('title', value)}
        required={required}
        max={CONTENT_LIMITS.titleChars}
        error={errorFor(`translations.${language}.title`)}
        disabled={disabled}
      />
      <TextField
        label={t('quiz.instructions')}
        locale={language}
        value={draft.text[language].instructions}
        onChange={(value) => setText('instructions', value)}
        multiline
        rows={3}
        max={CONTENT_LIMITS.quizInstructionsChars}
        error={errorFor(`translations.${language}.instructions`)}
        disabled={disabled}
      />
      <NumberField
        label={t('quiz.passingScore')}
        value={draft.passingScorePercent}
        onChange={(passingScorePercent) => set({ passingScorePercent })}
        min={0}
        max={100}
        required
        suffix="%"
        hint={t('quiz.passingScoreHint')}
        error={errorFor('passingScorePercent')}
        disabled={disabled}
      />
      <Switch
        label={t('quiz.limitAttempts')}
        checked={limited}
        disabled={disabled}
        onChange={(event) => {
          const on = event.target.checked;
          setLimitOn(on);
          set({ maxAttempts: on ? draft.maxAttempts || DEFAULT_ATTEMPTS : '' });
        }}
      />
      {limited && (
        <NumberField
          label={t('quiz.maxAttempts')}
          value={draft.maxAttempts}
          onChange={(maxAttempts) => set({ maxAttempts })}
          min={1}
          max={CONTENT_LIMITS.quizMaxAttemptsMax}
          required
          hint={t('quiz.maxAttemptsHint', { max: CONTENT_LIMITS.quizMaxAttemptsMax })}
          error={errorFor('maxAttempts')}
          disabled={disabled}
        />
      )}
      <NumberField
        label={t('quiz.xp')}
        value={draft.xpReward}
        onChange={(xpReward) => set({ xpReward })}
        min={0}
        max={CONTENT_LIMITS.xpRewardMax.quiz}
        required
        hint={t('quiz.xpHint', { max: CONTENT_LIMITS.xpRewardMax.quiz })}
        error={errorFor('xpReward')}
        disabled={disabled}
      />
      <Switch
        label={t('quiz.shuffle')}
        description={t('quiz.shuffleDescription')}
        checked={draft.shuffleQuestions}
        disabled={disabled}
        onChange={(event) => set({ shuffleQuestions: event.target.checked })}
      />
      <RadioGroup
        legend={t('quiz.reveal')}
        name={`${formId}-reveal`}
        value={draft.revealAnswers}
        disabled={disabled}
        error={errorFor('revealAnswers')}
        onValueChange={(value) => set({ revealAnswers: value as RevealAnswers })}
        options={REVEAL_ANSWERS.map((value) => ({
          value,
          label: t(`quiz.revealOptions.${value}`),
          description: t(`quiz.revealOptions.${value}Description`),
        }))}
      />
    </Card>
  );
}
