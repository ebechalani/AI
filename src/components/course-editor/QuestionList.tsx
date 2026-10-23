'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, FormField, Select } from '@/components/ui';
import { CONTENT_LIMITS } from '@/lib/limits';
import type { Locale } from '@/types/common';
import { QUESTION_TYPES, type QuestionType } from '@/types/quiz';
import { usePendingFocus } from './focus';
import { moveId } from './outline-model';
import { anchors } from './paths';
import { QuestionCard } from './QuestionCard';
import { moveQuestion, newQuestion, type QuestionDraft, type TrueFalseTexts } from './quiz-model';
import { focusAfterMove } from './ReorderButtons';
import { useSortable } from './use-sortable';

export interface QuestionListProps {
  questions: QuestionDraft[];
  onChange(questions: QuestionDraft[]): void;
  language: Locale;
  defaultLocale: Locale;
  tf: TrueFalseTexts;
  /** The question's errors, relative to it. */
  errorsFor(index: number): {
    errorFor(path: string): string | undefined;
    errorUnder(prefix: string): string | undefined;
  };
  errorUnder(prefix: string): string | undefined;
  disabled: boolean;
}

function newKey(): string {
  return crypto.randomUUID();
}

/** The questions, reordered locally and saved with the quiz (6.4). */
export function QuestionList({
  questions,
  onChange,
  language,
  defaultLocale,
  tf,
  errorsFor,
  errorUnder,
  disabled,
}: QuestionListProps) {
  const t = useTranslations('courseEditor');
  const focusLater = usePendingFocus();
  const [type, setType] = useState<QuestionType>('multiple_choice');
  const [announcement, setAnnouncement] = useState('');
  const keys = questions.map((question) => question.key);
  const sortable = useSortable({
    ids: keys,
    disabled,
    onMove: (key, toIndex) => {
      const order = moveId(keys, key, toIndex);
      onChange(order.flatMap((k) => questions.filter((question) => question.key === k)));
      announce(key, order);
    },
  });
  const atLimit = questions.length >= CONTENT_LIMITS.questionsPerQuiz;
  const listError = errorUnder('questions');

  function announce(key: string, order: string[]) {
    const position = order.indexOf(key) + 1;
    setAnnouncement(
      t('reorder.moved', { name: t('quiz.questionName', { position }), position, count: order.length }),
    );
  }

  function step(key: string, delta: -1 | 1) {
    const next = moveQuestion(questions, key, delta);
    const index = next.findIndex((question) => question.key === key);
    if (index === keys.indexOf(key)) return;
    focusLater(focusAfterMove(`question-${key}-move`, delta, index, next.length));
    onChange(next);
    announce(key, next.map((question) => question.key));
  }

  function remove(key: string) {
    const index = keys.indexOf(key);
    const next = questions.filter((question) => question.key !== key);
    const neighbour = next[index] ?? next[index - 1];
    if (neighbour) focusLater(anchors.question(neighbour.key));
    onChange(next);
    setAnnouncement(t('quiz.removed', { position: index + 1 }));
  }

  function add() {
    const question = newQuestion(type, tf, newKey);
    onChange([...questions, question]);
    focusLater(`q-${question.key}-prompt`);
  }

  return (
    <section aria-labelledby={`${anchors.questions}-title`} className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id={anchors.questions} tabIndex={-1} className="rounded-sm text-xl font-bold text-ink">
          <span id={`${anchors.questions}-title`}>{t('quiz.questionsTitle')}</span>
        </h2>
        <p className="text-sm text-ink-muted">
          {t('quiz.questionCount', { count: questions.length, max: CONTENT_LIMITS.questionsPerQuiz })}
        </p>
      </div>
      {listError && <p className="text-sm font-medium text-danger">{listError}</p>}
      <ol className="flex flex-col gap-4">
        {questions.map((question, index) => {
          const errors = errorsFor(index);
          return (
            <QuestionCard
              key={question.key}
              question={question}
              position={index + 1}
              count={questions.length}
              language={language}
              defaultLocale={defaultLocale}
              tf={tf}
              errorFor={errors.errorFor}
              errorUnder={errors.errorUnder}
              onChange={(next) => onChange(questions.map((q) => (q.key === next.key ? next : q)))}
              onMove={(delta) => step(question.key, delta)}
              onRemove={() => remove(question.key)}
              newKey={newKey}
              disabled={disabled}
              handle={sortable.handleProps(question.key)}
              attach={sortable.itemRef(question.key)}
              dragging={sortable.draggingId === question.key}
              dropSlot={sortable.indicatorSlot}
            />
          );
        })}
      </ol>
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <FormField label={t('quiz.newQuestionType')} className="max-w-xs grow">
          <Select
            value={type}
            disabled={disabled}
            onChange={(event) => setType(event.target.value as QuestionType)}
            options={QUESTION_TYPES.map((candidate) => ({
              value: candidate,
              label: t(`quiz.types.${candidate}`),
            }))}
          />
        </FormField>
        <Button variant="secondary" disabled={disabled || atLimit} onClick={add}>
          <Plus aria-hidden="true" />
          {t('quiz.addQuestion')}
        </Button>
      </div>
    </section>
  );
}
