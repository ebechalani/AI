import { useLocale, useTranslations } from 'next-intl';
import { FormField, Input, RadioGroup } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { CONTENT_LIMITS } from '@/lib/limits';
import type { Quiz, QuizAnswer, QuizQuestion } from '@/types/quiz';
import { ChoiceCheckboxes } from './ChoiceCheckboxes';
import { choose, toggle, write, type Draft } from './quiz-model';

/** A change to the runner's draft, applied by the runner to its current draft. */
export type DraftUpdate = (draft: Draft) => Draft;

export interface QuestionFieldProps {
  quiz: Quiz;
  question: QuizQuestion;
  answer: QuizAnswer | undefined;
  /** Without it the control is disabled and empty (the preview). */
  onChange?: (update: DraftUpdate) => void;
}

/** The answer control of one question: radio cards, checkbox cards or a short text field. */
export function QuestionField({ quiz, question, answer, onChange }: QuestionFieldProps) {
  const t = useTranslations('quiz');
  const locale = useLocale();
  const prompt = pickTranslation(question.translations, locale, quiz.defaultLocale).prompt;
  const name = `${quiz.id}-${question.id}`;
  const disabled = onChange === undefined;
  const legend = (
    <span className="block text-base font-semibold whitespace-pre-line text-ink sm:text-lg">
      {prompt}
    </span>
  );

  if (question.type === 'short_answer') {
    return (
      <FormField
        label={legend}
        hint={t('answer.shortHint', { max: CONTENT_LIMITS.quizAnswerChars })}
      >
        <Input
          name={name}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="next"
          maxLength={CONTENT_LIMITS.quizAnswerChars}
          value={disabled ? '' : (answer?.text ?? '')}
          disabled={disabled}
          onChange={
            onChange
              ? (event) => {
                  const text = event.target.value;
                  onChange((draft) => write(draft, question, text));
                }
              : undefined
          }
        />
      </FormField>
    );
  }

  const options = question.options.map((option) => {
    const text = pickTranslation(option.translations, locale, quiz.defaultLocale).text ?? '';
    // A true/false option may carry no text of its own: the platform's words stand in.
    const fallback =
      question.type === 'true_false' && (option.id === 'true' || option.id === 'false')
        ? t(option.id === 'true' ? 'answer.true' : 'answer.false')
        : '';
    return {
      value: option.id,
      label: <span className="whitespace-pre-line">{text.trim() !== '' ? text : fallback}</span>,
      disabled,
    };
  });

  if (question.type === 'multiple_answer') {
    return (
      <ChoiceCheckboxes
        legend={legend}
        hint={t('answer.chooseAll')}
        name={name}
        options={options}
        values={disabled ? [] : (answer?.selectedOptionIds ?? [])}
        onToggle={
          onChange
            ? (id, checked) => onChange((draft) => toggle(draft, question, id, checked))
            : undefined
        }
        disabled={disabled}
      />
    );
  }

  return (
    <RadioGroup
      variant="card"
      legend={legend}
      name={name}
      options={options}
      // Never undefined: RadioGroup is controlled only while `value` is defined.
      value={disabled ? '' : (answer?.selectedOptionIds[0] ?? '')}
      onValueChange={
        onChange ? (id) => onChange((draft) => choose(draft, question, id)) : undefined
      }
      hint={t('answer.chooseOne')}
      disabled={disabled}
    />
  );
}
