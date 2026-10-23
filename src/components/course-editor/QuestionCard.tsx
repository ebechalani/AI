'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/components/classes/ConfirmDialog';
import { Button, Card, Chip, FormField, Select } from '@/components/ui';
import { CONTENT_LIMITS } from '@/lib/limits';
import { cn } from '@/lib/utils';
import type { Locale } from '@/types/common';
import { QUESTION_TYPES, type QuestionType } from '@/types/quiz';
import { AcceptedAnswersField } from './AcceptedAnswersField';
import { DragHandle } from './DragHandle';
import { DropIndicator } from './DropIndicator';
import { NumberField } from './NumberField';
import { OptionsField } from './OptionsField';
import { anchors } from './paths';
import {
  changeQuestionType,
  typeChangeLosesWork,
  type QuestionDraft,
  type TrueFalseTexts,
} from './quiz-model';
import { ReorderButtons } from './ReorderButtons';
import { TextField } from './TextField';
import type { SortableHandleProps } from './use-sortable';

export interface QuestionCardProps {
  question: QuestionDraft;
  /** 1-based. */
  position: number;
  count: number;
  language: Locale;
  defaultLocale: Locale;
  tf: TrueFalseTexts;
  /** Relative to the question ('type', 'translations.en.prompt', 'options.0…'). */
  errorFor(path: string): string | undefined;
  errorUnder(prefix: string): string | undefined;
  onChange(question: QuestionDraft): void;
  onMove(delta: -1 | 1): void;
  onRemove(): void;
  newKey(): string;
  disabled: boolean;
  handle: SortableHandleProps;
  attach(element: HTMLElement | null): void;
  dragging: boolean;
  dropSlot: number | null;
}

/** One question of the quiz (6.4): type, points, prompt, answers, explanation. */
export function QuestionCard({
  question,
  position,
  count,
  language,
  defaultLocale,
  tf,
  errorFor,
  errorUnder,
  onChange,
  onMove,
  onRemove,
  newKey,
  disabled,
  handle,
  attach,
  dragging,
  dropSlot,
}: QuestionCardProps) {
  const t = useTranslations('courseEditor');
  const baseId = useId();
  const [pendingType, setPendingType] = useState<QuestionType | null>(null);
  const headingId = anchors.question(question.key);
  const required = language === defaultLocale;

  function chooseType(type: QuestionType) {
    if (type === question.type) return;
    if (typeChangeLosesWork(question, type)) {
      setPendingType(type);
      return;
    }
    onChange(changeQuestionType(question, type, tf, newKey));
  }

  function setLocalized(field: 'prompt' | 'explanation' | 'accepted', value: string) {
    onChange({ ...question, [field]: { ...question[field], [language]: value } });
  }

  return (
    <li ref={attach} className={cn('relative', dragging && 'opacity-60')}>
      <DropIndicator slot={dropSlot} index={position - 1} count={count} />
      <Card as="section" aria-labelledby={headingId} className="gap-5 p-4 sm:p-5">
        <div className="flex flex-wrap items-start gap-2">
          <DragHandle handle={handle} disabled={disabled} className="-ms-2" />
          <div className="flex min-w-0 flex-1 basis-40 flex-wrap items-center gap-2 py-2">
            <h3 id={headingId} tabIndex={-1} className="rounded-sm text-base font-bold text-ink">
              {t('quiz.questionHeading', { position })}
            </h3>
            <Chip>{t(`quiz.types.${question.type}`)}</Chip>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <ReorderButtons
              name={t('quiz.questionName', { position })}
              index={position - 1}
              count={count}
              onMove={onMove}
              disabled={disabled}
              idPrefix={`question-${question.key}-move`}
            />
            {count > 1 && (
              <Button
                size="sm"
                variant="ghost"
                className="text-danger hover:bg-danger/10"
                disabled={disabled}
                onClick={onRemove}
              >
                {t('quiz.removeQuestion')}
              </Button>
            )}
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
          <FormField label={t('quiz.type')} error={errorFor('type')}>
            <Select
              value={question.type}
              disabled={disabled}
              onChange={(event) => chooseType(event.target.value as QuestionType)}
              options={QUESTION_TYPES.map((type) => ({ value: type, label: t(`quiz.types.${type}`) }))}
            />
          </FormField>
          <NumberField
            label={t('quiz.points')}
            value={question.points}
            onChange={(points) => onChange({ ...question, points })}
            min={1}
            max={CONTENT_LIMITS.questionPointsMax}
            required
            hint={t('quiz.pointsHint', { max: CONTENT_LIMITS.questionPointsMax })}
            error={errorFor('points')}
            disabled={disabled}
          />
        </div>
        <TextField
          id={`q-${question.key}-prompt`}
          label={t('quiz.prompt')}
          locale={language}
          value={question.prompt[language] ?? ''}
          onChange={(value) => setLocalized('prompt', value)}
          required={required}
          multiline
          rows={3}
          max={CONTENT_LIMITS.questionPromptChars}
          error={errorFor(`translations.${language}.prompt`)}
          disabled={disabled}
        />
        {question.type === 'short_answer' ? (
          <AcceptedAnswersField
            questionKey={question.key}
            language={language}
            defaultLocale={defaultLocale}
            value={question.accepted[language] ?? ''}
            onChange={(value) => setLocalized('accepted', value)}
            error={errorUnder(`acceptedAnswers.${language}`)}
            disabled={disabled}
          />
        ) : (
          <OptionsField
            questionKey={question.key}
            type={question.type}
            options={question.options}
            correct={question.correct}
            language={language}
            defaultLocale={defaultLocale}
            onChange={(options, correct) => onChange({ ...question, options, correct })}
            errorFor={errorFor}
            newKey={newKey}
            disabled={disabled}
          />
        )}
        <TextField
          id={`${baseId}-explanation`}
          label={t('quiz.explanation')}
          locale={language}
          value={question.explanation[language] ?? ''}
          onChange={(value) => setLocalized('explanation', value)}
          multiline
          rows={2}
          max={CONTENT_LIMITS.explanationChars}
          hint={t('quiz.explanationHint')}
          error={errorFor(`explanation.${language}.text`)}
          disabled={disabled}
        />
      </Card>
      <ConfirmDialog
        open={pendingType !== null}
        onClose={() => setPendingType(null)}
        title={t('quiz.typeChangeTitle')}
        description={t('quiz.typeChangeDescription')}
        confirmLabel={t('quiz.typeChangeConfirm')}
        confirmVariant="danger"
        pending={false}
        error={null}
        onConfirm={() => {
          if (pendingType !== null) onChange(changeQuestionType(question, pendingType, tf, newKey));
          setPendingType(null);
        }}
      />
    </li>
  );
}
