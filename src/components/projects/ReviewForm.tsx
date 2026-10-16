'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Alert, Button, FormField, RadioGroup, Textarea } from '@/components/ui';
import { CONTENT_LIMITS } from '@/lib/limits';
import type { AiReview, ReviewDecision, RubricKey, Submission } from '@/types/project';
import { CriteriaInputs } from './CriteriaInputs';
import { focusInView, revealChoiceCard } from './focus';
import {
  criteriaDraftFrom,
  initialDecision,
  rubricRows,
  type ApproveBlock,
  type CriteriaDraft,
  type ReviewField,
} from './review-model';
import { SessionEndedAlert } from './SessionEndedAlert';
import { useValidationMessage } from './use-action-error';
import { useReviewSubmission, type ReviewAlert } from './use-review-submission';

export interface ReviewFormProps {
  submission: Submission;
  aiReview: AiReview | null;
  approveBlock: ApproveBlock | null;
  /** Someone else decided first, or the suggestion changed (the panel shows it). */
  onConflict: () => void;
}

const DECISIONS: readonly ReviewDecision[] = ['approve', 'modify', 'return'];

function isDecision(value: string): value is ReviewDecision {
  return (DECISIONS as readonly string[]).includes(value);
}

function ReviewAlertView({ alert }: { alert: ReviewAlert }) {
  const t = useTranslations('review');
  if (alert === 'session') {
    return (
      <SessionEndedAlert
        description={t('form.errors.sessionEnded')}
        loginLabel={t('form.errors.loginAgain')}
      />
    );
  }
  return (
    <Alert tone="danger">
      {alert === 'not_found' ? t('form.errors.notFound') : t('form.errors.form')}
    </Alert>
  );
}

/** The teacher's decision (SPEC-D 10.3): approve the suggestion, grade, or return the work. */
export function ReviewForm({ submission, aiReview, approveBlock, onConflict }: ReviewFormProps) {
  const t = useTranslations('review');
  const validationMessage = useValidationMessage();
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const decisionId = `${baseId}-decision`;
  const criteriaId = `${baseId}-criteria`;
  const feedbackId = `${baseId}-feedback`;
  const idOf = (key: RubricKey) => `${baseId}-${key}`;
  const rows = rubricRows(submission.rubric);
  const [chosen, setDecision] = useState<ReviewDecision>(() => initialDecision(approveBlock));
  // A refresh can block "approve" after it was chosen (a new suggestion with points to check).
  const decision: ReviewDecision =
    chosen === 'approve' && approveBlock !== null ? 'modify' : chosen;
  const [criteria, setCriteria] = useState<CriteriaDraft>(() => criteriaDraftFrom(aiReview));
  const [feedback, setFeedback] = useState('');
  // The form stays mounted while the page is refreshed (Check again, a new suggestion): a new
  // suggestion seeds it again, as on a first load, except what the teacher has already changed.
  const suggestionId = aiReview?.id ?? null;
  const [seededFor, setSeededFor] = useState(suggestionId);
  const [decisionTouched, setDecisionTouched] = useState(false);
  const [criteriaTouched, setCriteriaTouched] = useState(false);
  if (seededFor !== suggestionId) {
    setSeededFor(suggestionId);
    if (!decisionTouched) setDecision(initialDecision(approveBlock));
    if (!criteriaTouched) setCriteria(criteriaDraftFrom(aiReview));
  }
  const formRef = useRef<HTMLFormElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLTextAreaElement>(null);

  function focusField(field: ReviewField) {
    const id =
      field === 'decision'
        ? decisionId
        : field === 'feedback'
          ? feedbackId
          : field === 'criteria'
            ? criteriaId
            : idOf(field);
    const element = document.getElementById(id);
    if (element === null) return;
    const control =
      field === 'decision' || field === 'criteria'
        ? (element.querySelector<HTMLElement>('input:checked, input:enabled') ?? element)
        : element;
    focusInView(control);
  }

  const { pending, errors, formAlert, submit, clearError } = useReviewSubmission({
    submissionId: submission.id,
    studentName: submission.studentName,
    criteriaOrder: rows.map((row) => row.key),
    formRef,
    submitRef,
    alertRef,
    focusField,
    onConflict,
  });
  const messages: Partial<Record<ReviewField, string>> = {};
  for (const [field, key] of Object.entries(errors) as [ReviewField, string][]) {
    messages[field] = validationMessage(key);
  }
  const suggestedFeedback = aiReview?.writtenFeedback ?? null;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit({ decision, criteria, feedback });
  }

  function copyAiFeedback() {
    if (suggestedFeedback === null) return;
    setFeedback(suggestedFeedback);
    clearError('feedback');
    focusInView(feedbackRef.current);
  }

  return (
    <form
      ref={formRef}
      noValidate
      aria-labelledby={titleId}
      onSubmit={onSubmit}
      className="flex min-w-0 flex-col gap-5 rounded-card border border-border bg-surface p-5 shadow-card sm:p-6"
    >
      <h2 id={titleId} className="text-lg font-semibold text-ink">
        {t('form.title')}
      </h2>
      {formAlert !== null && (
        <div ref={alertRef} tabIndex={-1} className="rounded-control">
          <ReviewAlertView alert={formAlert} />
        </div>
      )}

      <div id={decisionId} onFocus={revealChoiceCard}>
        <RadioGroup
          name="decision"
          variant="card"
          required
          legend={t('form.decision.legend')}
          value={decision}
          onValueChange={(value) => {
            if (!isDecision(value)) return;
            setDecision(value);
            setDecisionTouched(true);
            clearError('decision');
          }}
          error={messages.decision}
          options={DECISIONS.map((value) => ({
            value,
            label: t(`form.decision.${value}.label`),
            description:
              value === 'approve' && approveBlock !== null
                ? t(`form.approveBlocked.${approveBlock}`)
                : t(`form.decision.${value}.description`),
            disabled: value === 'approve' && approveBlock !== null,
          }))}
        />
      </div>

      {decision === 'approve' && aiReview?.overallSuggestedScore != null && (
        <p className="text-sm font-semibold text-ink">
          {t('form.approveScore', { score: aiReview.overallSuggestedScore })}
        </p>
      )}

      {decision === 'modify' && (
        <div id={criteriaId}>
          <CriteriaInputs
            rows={rows}
            rubric={submission.rubric}
            draft={criteria}
            onChange={(key, value) => {
              setCriteria((current) => ({ ...current, [key]: value }));
              setCriteriaTouched(true);
              clearError(key);
              clearError('criteria');
            }}
            errors={messages}
            idOf={idOf}
            legendId={`${criteriaId}-legend`}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <FormField
          id={feedbackId}
          label={t('form.feedback.label')}
          hint={t('form.feedback.hint', { max: CONTENT_LIMITS.feedbackChars })}
          error={messages.feedback}
          required
        >
          <Textarea
            ref={feedbackRef}
            name="feedback"
            rows={6}
            maxLength={CONTENT_LIMITS.feedbackChars}
            value={feedback}
            onChange={(event) => {
              setFeedback(event.target.value);
              clearError('feedback');
            }}
          />
        </FormField>
        {feedback === '' && suggestedFeedback !== null && (
          <div>
            <Button variant="ghost" size="sm" onClick={copyAiFeedback}>
              <Sparkles aria-hidden="true" />
              {t('form.feedback.useAi')}
            </Button>
          </div>
        )}
      </div>

      <div>
        <Button
          ref={submitRef}
          type="submit"
          loading={pending}
          variant={decision === 'return' ? 'secondary' : 'primary'}
          className="w-full sm:w-auto"
        >
          {t(`form.submit.${decision}`)}
        </Button>
      </div>
    </form>
  );
}
