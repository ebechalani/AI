import 'server-only';
import { z } from 'zod';
import { AI_LIMITS, CONTENT_LIMITS, SUBMISSION_LIMITS } from '@/lib/limits';
import type { AgeBand, FileKind, Locale, SubmissionType } from '@/types/common';
import {
  AI_CONFIDENCES,
  AI_REVIEW_FLAGS,
  RUBRIC_KEYS,
  type AiConfidence,
  type AiReviewFlag,
  type RubricKey,
} from '@/types/project';
import { getAiProvider } from './index';
import {
  buildGradingSystemPrompt,
  GRADING_BLOCK_INTROS,
  GRADING_BLOCKS,
  GRADING_CLOSING_LINE,
  GRADING_LIMITATIONS,
  GRADING_PROMPT_VERSION,
  GRADING_SCHEMA_NAME,
} from './prompts/grading';
import {
  checkOutput,
  containsRedaction,
  looksLikePromptInjection,
  sanitizeUserText,
  wrapUntrusted,
} from './safety';
import { AiError, type AiObjectResult, type AiStopReason, type AiUsage } from './types';

export interface AiReviewInput {
  locale: Locale;
  ageBand: AgeBand;
  projectTitle: string;
  projectBrief: string;
  requirements: string;
  rubric: { key: RubricKey; weight: number }[];
  submission: {
    title: string;
    description: string;
    type: SubmissionType;
    text: string | null;
    code: string | null;
    codeLanguage: string | null;
    /** Hostname only, never the full URL. */
    linkHost: string | null;
    /** Kind and size only; never file names. */
    attachments: { kind: FileKind; sizeBytes: number }[];
    /** True when text or code exceeded the review budget. */
    truncated: boolean;
  };
}

export interface AiReviewOutput {
  /** 0–100 per criterion. */
  criteria: Record<RubricKey, { score: number; comment: string }>;
  /** round(Σ score × weight / 100), computed here; never taken from the model. */
  overallSuggestedScore: number;
  /** Addressed to the student, in `locale`. */
  writtenFeedback: string;
  /** At most 3. */
  strengths: string[];
  /** At most 3. */
  improvements: string[];
  confidence: AiConfidence;
  limitations: string[];
  flags: AiReviewFlag[];
  provider: string;
  model: string;
  promptVersion: string;
  usage: AiUsage;
}

// --- What the model returns ---------------------------------------------------------------------

const MAX_LIST_ITEMS = 3;
const MAX_MODEL_LIMITATIONS = 5;

const criterionSchema = z.object({
  score: z.number().min(0).max(100),
  comment: z.string().trim().min(1),
});

/**
 * The object asked of the provider. It has no overall score: that is computed from the rubric
 * weights. List lengths are not enforced here but cut afterwards, so one item too many does
 * not turn a usable review into a failed one.
 */
export const aiReviewModelSchema = z.object({
  criteria: z.object({
    creativity: criterionSchema,
    technicalQuality: criterionSchema,
    understanding: criterionSchema,
    responsibleAi: criterionSchema,
  } satisfies Record<RubricKey, typeof criterionSchema>),
  writtenFeedback: z.string().trim().min(1),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  confidence: z.enum(AI_CONFIDENCES),
  limitations: z.array(z.string()),
  flags: z.array(z.enum(AI_REVIEW_FLAGS)),
});

export type AiReviewModelOutput = z.infer<typeof aiReviewModelSchema>;

// --- What leaves the server ---------------------------------------------------------------------

interface PreparedReview {
  content: string;
  truncated: boolean;
  /** There is text or code to judge, not just a title, a link or files. */
  hasReviewableContent: boolean;
  hasAttachments: boolean;
  hasLink: boolean;
  personalData: boolean;
  promptInjection: boolean;
}

const oneLine = (text: string): string => text.replace(/\s+/g, ' ').trim();

// Sanitize before cutting: cutting first could leave half an address that no longer matches.
function fit(value: string | null, maxChars: number): { text: string; wasCut: boolean } {
  const clean = sanitizeUserText(value ?? '').trim();
  return clean.length > maxChars
    ? { text: clean.slice(0, maxChars), wasCut: true }
    : { text: clean, wasCut: false };
}

// A full URL routinely carries a child's name or school in its path, so only the host is kept
// even when a caller passes more.
function toHostname(value: string | null): string | null {
  const trimmed = value?.trim() ?? '';
  if (trimmed === '') return null;
  try {
    return new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`).hostname || null;
  } catch {
    return null;
  }
}

function formatSize(bytes: number): string {
  const kilobytes = Math.max(0, bytes) / 1024;
  return kilobytes < 1024
    ? `${Math.max(1, Math.round(kilobytes))} KB`
    : `${(kilobytes / 1024).toFixed(1)} MB`;
}

/**
 * Builds the user message. The service that calls suggestReview already sanitizes and cuts
 * the submission (ARCHITECTURE.md 8.4); the same rules are applied again here, so the
 * guarantees hold for every caller: redacted text, a fixed budget, the hostname of a link and
 * the kind and size of attachments, nothing else.
 */
function prepareReview(input: AiReviewInput): PreparedReview {
  const { submission } = input;
  const budget = AI_LIMITS.reviewInput;

  const title = oneLine(fit(submission.title, SUBMISSION_LIMITS.titleChars).text);
  const description = fit(submission.description, budget.description);
  const text = fit(submission.text, budget.text);
  const code = fit(submission.code, budget.code);
  const codeLanguage = oneLine(
    fit(submission.codeLanguage, SUBMISSION_LIMITS.codeLanguageChars).text,
  );
  const linkHost = toHostname(submission.linkHost);
  const attachments = submission.attachments
    .slice(0, SUBMISSION_LIMITS.maxAttachments)
    .map(({ kind, sizeBytes }) => `${kind} (${formatSize(sizeBytes)})`);
  const truncated = submission.truncated || description.wasCut || text.wasCut || code.wasCut;

  const assignment = [
    `Title: ${oneLine(fit(input.projectTitle, CONTENT_LIMITS.titleChars).text)}`,
    `Brief:\n${fit(input.projectBrief, CONTENT_LIMITS.projectBriefChars).text}`,
    `Requirements:\n${fit(input.requirements, CONTENT_LIMITS.projectBriefChars).text}`,
  ].join('\n');

  const weights = RUBRIC_KEYS.map((key) => {
    const weight = input.rubric.find((entry) => entry.key === key)?.weight ?? 0;
    return `${key} ${weight}`;
  }).join(', ');

  const details = [
    `Type: ${submission.type}`,
    ...(codeLanguage === '' ? [] : [`Code language: ${codeLanguage}`]),
    ...(linkHost === null ? [] : [`Link host: ${linkHost} (the page itself is not included)`]),
    `Attached files, not included: ${attachments.length > 0 ? attachments.join(', ') : 'none'}`,
    `Shortened: ${truncated ? 'yes, only the first part of the work is included below' : 'no'}`,
  ].join('\n');

  const block = (intro: string, name: string, body: string): string[] => [
    intro,
    wrapUntrusted(name, body),
    '',
  ];

  const content = [
    ...block(GRADING_BLOCK_INTROS.assignment, GRADING_BLOCKS.assignment, assignment),
    GRADING_BLOCK_INTROS.weights,
    weights,
    '',
    ...block(GRADING_BLOCK_INTROS.details, GRADING_BLOCKS.details, details),
    ...block(GRADING_BLOCK_INTROS.title, GRADING_BLOCKS.title, title),
    ...block(GRADING_BLOCK_INTROS.description, GRADING_BLOCKS.description, description.text),
    ...(text.text === '' ? [] : block(GRADING_BLOCK_INTROS.text, GRADING_BLOCKS.text, text.text)),
    ...(code.text === '' ? [] : block(GRADING_BLOCK_INTROS.code, GRADING_BLOCKS.code, code.text)),
    GRADING_CLOSING_LINE,
  ].join('\n');

  const sent = [title, description.text, text.text, code.text, codeLanguage];
  const written = [submission.title, submission.description, submission.text, submission.code];

  return {
    content,
    truncated,
    hasReviewableContent: text.text !== '' || code.text !== '',
    hasAttachments: attachments.length > 0,
    hasLink: linkHost !== null,
    personalData: sent.some(containsRedaction),
    promptInjection: written.some((field) => field !== null && looksLikePromptInjection(field)),
  };
}

// --- Result -------------------------------------------------------------------------------------

/** round(Σ score × weight / 100). A criterion the rubric does not list weighs nothing. */
export function computeOverallScore(
  criteria: Record<RubricKey, { score: number }>,
  rubric: { key: RubricKey; weight: number }[],
): number {
  const total = rubric.reduce((sum, { key, weight }) => sum + criteria[key].score * weight, 0);
  return Math.max(0, Math.min(100, Math.round(total / 100)));
}

function tidyList(items: string[], max: number): string[] {
  return [...new Set(items.map((item) => item.trim()).filter((item) => item !== ''))].slice(0, max);
}

function lowerOf(a: AiConfidence, b: AiConfidence): AiConfidence {
  return AI_CONFIDENCES.indexOf(a) <= AI_CONFIDENCES.indexOf(b) ? a : b;
}

const FAILURE_BY_STOP_REASON: Record<Exclude<AiStopReason, 'end'>, AiError['reason']> = {
  max_tokens: 'incomplete',
  refusal: 'refused',
  error: 'provider_error',
};

/**
 * Suggests rubric scores and feedback for one submission. The result is a suggestion: only a
 * teacher's review writes a grade.
 *
 * Throws AiError when no usable review came back (`incomplete` for a reply that hit the
 * provider cap, `invalid_output`, `blocked`, `refused`, `provider_error`); `error.usage` holds
 * the tokens the failed call consumed. The caller records a failed AI review.
 */
export async function suggestReview(input: AiReviewInput): Promise<AiReviewOutput> {
  const prepared = prepareReview(input);
  const provider = getAiProvider();

  let result: AiObjectResult<AiReviewModelOutput>;
  try {
    result = await provider.generateObject({
      purpose: 'review',
      system: buildGradingSystemPrompt({ locale: input.locale, ageBand: input.ageBand }),
      messages: [{ role: 'user', content: prepared.content }],
      maxOutputTokens: AI_LIMITS.maxOutputTokens.review,
      schema: aiReviewModelSchema,
      schemaName: GRADING_SCHEMA_NAME,
    });
  } catch (error) {
    if (error instanceof AiError) throw error;
    throw new AiError('provider_error', { cause: error });
  }

  const { usage } = result;
  if (result.stopReason !== 'end') {
    throw new AiError(FAILURE_BY_STOP_REASON[result.stopReason], { usage });
  }
  // The provider validated against the schema; this layer does not rely on it.
  const parsed = aiReviewModelSchema.safeParse(result.object);
  if (!parsed.success) throw new AiError('invalid_output', { usage, cause: parsed.error });
  const model = parsed.data;

  const criterion = (key: RubricKey): { score: number; comment: string } => ({
    score: Math.round(model.criteria[key].score),
    comment: model.criteria[key].comment,
  });
  const criteria: AiReviewOutput['criteria'] = {
    creativity: criterion('creativity'),
    technicalQuality: criterion('technicalQuality'),
    understanding: criterion('understanding'),
    responsibleAi: criterion('responsibleAi'),
  };
  const strengths = tidyList(model.strengths, MAX_LIST_ITEMS);
  const improvements = tidyList(model.improvements, MAX_LIST_ITEMS);
  const modelLimitations = tidyList(model.limitations, MAX_MODEL_LIMITATIONS);

  const shown = [
    model.writtenFeedback,
    ...RUBRIC_KEYS.map((key) => criteria[key].comment),
    ...strengths,
    ...improvements,
    ...modelLimitations,
  ].join('\n');
  const check = checkOutput(shown, 'review');
  if (!check.ok) {
    throw new AiError(check.reason === 'banned_pattern' ? 'blocked' : 'invalid_output', { usage });
  }

  const texts = GRADING_LIMITATIONS[input.locale];
  const limitations = tidyList(
    [
      ...modelLimitations,
      ...(prepared.truncated ? [texts.truncated] : []),
      ...(prepared.hasAttachments ? [texts.attachmentsNotReviewed] : []),
      ...(prepared.hasLink ? [texts.linkNotOpened] : []),
      ...(prepared.hasReviewableContent ? [] : [texts.nothingToReview]),
    ],
    Number.POSITIVE_INFINITY,
  );

  const flagged = new Set<AiReviewFlag>(model.flags);
  if (prepared.personalData) flagged.add('possible_personal_data');
  if (prepared.promptInjection) flagged.add('possible_prompt_injection');

  let confidence = model.confidence;
  if (prepared.truncated) confidence = lowerOf(confidence, 'medium');
  if (!prepared.hasReviewableContent) confidence = 'low';

  return {
    criteria,
    overallSuggestedScore: computeOverallScore(criteria, input.rubric),
    writtenFeedback: model.writtenFeedback,
    strengths,
    improvements,
    confidence,
    limitations,
    flags: AI_REVIEW_FLAGS.filter((flag) => flagged.has(flag)),
    provider: provider.id,
    model: result.model,
    promptVersion: GRADING_PROMPT_VERSION,
    usage,
  };
}
