// The pure rules behind the project pages and the lesson block (SPEC-D 5.1): how attempts are
// grouped and described to the student, when a new version may be sent, the links to files and
// the parameters of the teacher's lists. No React here, so the unit tests can run it.

import { pickTranslation } from '@/lib/i18n/content';
import { AI_LIMITS, SUBMISSION_LIMITS } from '@/lib/limits';
import { COMPOSITE_ID_PATTERN } from '@/lib/schemas/common';
import type { Challenge } from '@/types/challenge';
import type { FileKind } from '@/types/common';
import type { AiReview, Project, Submission, SubmissionTarget } from '@/types/project';
import type { SchoolClass } from '@/types/school';

// --- Files -------------------------------------------------------------------------------------

/** Kinds the browser shows itself; the files route keeps its own copy of this list. */
export const INLINE_KINDS: readonly FileKind[] = ['image', 'audio', 'video', 'pdf'];

/**
 * The files route for one file. `download` asks the route for an attachment disposition: the
 * `download` attribute alone is ignored after the production redirect to Storage. The route
 * authorizes on its own (6.9), so the submission id is an optional hint it does not need.
 */
export function attachmentHref(
  fileId: string,
  submissionId: string | null,
  opts: { download?: boolean } = {},
): string {
  const query = new URLSearchParams();
  if (submissionId !== null) query.set('submission', submissionId);
  if (opts.download === true) query.set('download', '1');
  const search = query.toString();
  return `/api/files/${encodeURIComponent(fileId)}${search === '' ? '' : `?${search}`}`;
}

const KB = 1024;
const MB = 1024 * KB;

export interface FileSize {
  /** The `common.units` key the value goes into. */
  unit: 'kilobytes' | 'megabytes';
  /** Rounded to one decimal; the caller formats it for the locale. */
  value: number;
}

function oneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Kilobytes below one megabyte, megabytes from there; a non-empty file is never "0 KB". */
export function fileSize(sizeBytes: number): FileSize {
  const bytes = Number.isFinite(sizeBytes) ? Math.max(0, sizeBytes) : 0;
  const kilobytes = oneDecimal(bytes / KB);
  if (kilobytes < 1024) {
    return { unit: 'kilobytes', value: bytes > 0 && kilobytes === 0 ? 0.1 : kilobytes };
  }
  return { unit: 'megabytes', value: oneDecimal(bytes / MB) };
}

// Content types whose subtype says nothing a learner recognises.
const GENERIC_SUBTYPES = new Set(['octet-stream', 'x-binary']);
// Subtypes whose usual extension is the better-known name.
const SUBTYPE_NAMES: Record<string, string> = { plain: 'TXT', mpeg: 'MP3', jpeg: 'JPG' };

/**
 * A short upper-case type: the extension ("PNG", "PDF", "SB3"), else the content type's subtype,
 * else '' (the meta line then shows the size alone).
 */
export function fileTypeLabel(fileName: string, contentType: string): string {
  const extension = /\.([A-Za-z0-9]{1,10})$/.exec(fileName)?.[1];
  if (extension) return extension.toUpperCase();
  const subtype = contentType.split(';')[0]?.split('/')[1]?.trim().toLowerCase() ?? '';
  if (subtype === '' || GENERIC_SUBTYPES.has(subtype)) return '';
  const last = (subtype.split(/[.+]/).pop() ?? subtype).replace(/^x-/, '');
  return Object.hasOwn(SUBTYPE_NAMES, last) ? SUBTYPE_NAMES[last]! : last.toUpperCase();
}

// --- Targets -----------------------------------------------------------------------------------

type TargetFields = Pick<Submission, 'context' | 'courseId' | 'projectId' | 'challengeId'>;

/** What the submission answers; null when the stored ids are incomplete. */
export function targetOf(s: TargetFields): SubmissionTarget | null {
  if (s.context === 'project') {
    return s.courseId !== null && s.projectId !== null
      ? { context: 'project', courseId: s.courseId, projectId: s.projectId }
      : null;
  }
  return s.challengeId !== null ? { context: 'challenge', challengeId: s.challengeId } : null;
}

/** One key per project or challenge; a submission without a target stands alone. */
export function targetKey(s: TargetFields & Pick<Submission, 'id'>): string {
  const target = targetOf(s);
  if (target === null) return `s/${s.id}`;
  return target.context === 'project'
    ? `p/${target.courseId}/${target.projectId}`
    : `c/${target.challengeId}`;
}

/** The third argument of data/submissions.getLatestSubmission. */
export function latestArg(
  t: SubmissionTarget,
): { courseId: string; projectId: string } | { challengeId: string } {
  return t.context === 'project'
    ? { courseId: t.courseId, projectId: t.projectId }
    : { challengeId: t.challengeId };
}

// --- The student's list ------------------------------------------------------------------------

export interface StudentGroups {
  returned: Submission[];
  submitted: Submission[];
  accepted: Submission[];
  earlier: Submission[];
}

/**
 * The latest attempt at each project or challenge goes to the section of its status; every
 * older attempt goes to `earlier`. The input order (newest first) is kept in every section.
 */
export function groupStudentSubmissions(submissions: readonly Submission[]): StudentGroups {
  const latest = new Map<string, Submission>();
  for (const submission of submissions) {
    const key = targetKey(submission);
    const known = latest.get(key);
    if (known === undefined || submission.attemptNumber > known.attemptNumber) {
      latest.set(key, submission);
    }
  }
  const groups: StudentGroups = { returned: [], submitted: [], accepted: [], earlier: [] };
  for (const submission of submissions) {
    if (latest.get(targetKey(submission)) !== submission) {
      groups.earlier.push(submission);
    } else if (submission.status === 'returned') {
      groups.returned.push(submission);
    } else if (submission.status === 'submitted') {
      groups.submitted.push(submission);
    } else {
      groups.accepted.push(submission);
    }
  }
  return groups;
}

// --- What the student is told ------------------------------------------------------------------

export type StudentOutcome =
  | { kind: 'waiting_teacher' }
  | { kind: 'ai_pending' }
  | { kind: 'ai_unavailable'; reason: 'failed' | 'skipped'; retriesLeft: number }
  | { kind: 'approved' }
  | { kind: 'ai_reviewed' }
  | { kind: 'returned_teacher' }
  | { kind: 'returned_ai' };

/** The `projects.outcome.<key>` message group of each outcome. */
export const OUTCOME_KEYS = {
  waiting_teacher: 'waitingTeacher',
  ai_pending: 'aiPending',
  ai_unavailable: 'aiUnavailable',
  approved: 'approved',
  ai_reviewed: 'aiReviewed',
  returned_teacher: 'returnedTeacher',
  returned_ai: 'returnedAi',
} as const satisfies Record<StudentOutcome['kind'], string>;

/**
 * Where the attempt stands, in the student's words. Supervised work (a class reviews it) never
 * mentions the AI, whatever its review status: the teacher decides.
 */
export function studentOutcome(s: Submission): StudentOutcome {
  switch (s.status) {
    case 'approved':
      return { kind: 'approved' };
    case 'ai_reviewed':
      return { kind: 'ai_reviewed' };
    case 'returned':
      return { kind: s.reviewedByUid !== null ? 'returned_teacher' : 'returned_ai' };
    case 'submitted':
      if (s.classId !== null) return { kind: 'waiting_teacher' };
      if (s.aiReviewStatus === 'failed' || s.aiReviewStatus === 'skipped') {
        return {
          kind: 'ai_unavailable',
          reason: s.aiReviewStatus,
          retriesLeft: Math.max(0, AI_LIMITS.review.maxRegenerations - s.aiRegenerations),
        };
      }
      return { kind: 'ai_pending' };
  }
}

/**
 * The AI feedback card appears once the AI has closed the attempt, never next to "Robo AI is
 * reading your work". Only the owner of unsupervised work ever receives an AI review.
 */
export function showsAiFeedback(s: Submission, ai: AiReview | null): boolean {
  return ai?.status === 'ready' && (s.status === 'ai_reviewed' || s.status === 'returned');
}

export type ResubmitState =
  'allowed' | 'not_returned' | 'not_latest' | 'no_attempts' | 'closed' | 'unavailable';

/** Whether a new version of this attempt may be sent from its page, in the rule order. */
export function resubmitState(a: {
  submission: Submission;
  latestId: string | null;
  definitionAvailable: boolean;
  challengeOpen: boolean | null;
}): ResubmitState {
  const { submission } = a;
  if (submission.status !== 'returned') return 'not_returned';
  if (a.latestId !== null && a.latestId !== submission.id) return 'not_latest';
  if (submission.attemptNumber >= SUBMISSION_LIMITS.maxAttempts) return 'no_attempts';
  if (a.challengeOpen === false) return 'closed';
  if (!a.definitionAvailable) return 'unavailable';
  return 'allowed';
}

export type BlockState = 'preview' | 'submit' | 'resubmit' | 'no_attempts' | 'status_only';

/** What the lesson's project block shows below the brief. */
export function blockState(latest: Submission | null, readOnly: boolean): BlockState {
  if (readOnly) return 'preview';
  if (latest === null) return 'submit';
  if (latest.status === 'returned') {
    return latest.attemptNumber < SUBMISSION_LIMITS.maxAttempts ? 'resubmit' : 'no_attempts';
  }
  return 'status_only';
}

// --- Briefs ------------------------------------------------------------------------------------

export interface BriefText {
  title: string;
  brief: string;
  requirements: string;
}

export function projectBrief(project: Project, locale: string): BriefText {
  const text = pickTranslation(project.translations, locale, project.defaultLocale);
  return {
    title: text.title ?? '',
    brief: text.brief ?? '',
    requirements: text.requirements ?? '',
  };
}

export function challengeBrief(challenge: Challenge, locale: string): BriefText {
  const text = pickTranslation(challenge.translations, locale, challenge.defaultLocale);
  return {
    title: text.title ?? '',
    brief: text.description ?? '',
    requirements: text.submissionRequirements ?? '',
  };
}

// --- The teacher's lists -----------------------------------------------------------------------

/** How many submissions the review queue shows at most (listReviewQueue's default limit, 3.7). */
export const QUEUE_LIMIT = 200;

export interface QueueGroup {
  classId: string;
  /** null for a class the teacher's class list does not name. */
  name: string | null;
  archived: boolean;
  items: Submission[];
}

/**
 * The queue by class, in the order of `classes` (by name), each group oldest first like the
 * queue. Work of a class missing from `classes` comes last, one group per class id.
 */
export function groupQueueByClass(
  queue: readonly Submission[],
  classes: readonly SchoolClass[],
): QueueGroup[] {
  const byClass = new Map<string, Submission[]>();
  for (const submission of queue) {
    const classId = submission.classId ?? '';
    const items = byClass.get(classId);
    if (items === undefined) byClass.set(classId, [submission]);
    else items.push(submission);
  }
  const groups: QueueGroup[] = [];
  for (const cls of classes) {
    const items = byClass.get(cls.id);
    if (items === undefined) continue;
    groups.push({ classId: cls.id, name: cls.name, archived: cls.archived, items });
    byClass.delete(cls.id);
  }
  for (const [classId, items] of byClass) {
    groups.push({ classId, name: null, archived: false, items });
  }
  return groups;
}

/** The longest trail of page cursors a link may carry. */
export const MAX_TRAIL = 20;

export interface ReviewListParams {
  view: 'queue' | 'all';
  classId: string | null;
  /** The cursors of the pages before the current one, oldest first. */
  trail: string[];
  /** The `cursors` parameter was unusable. */
  staleLink: boolean;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** `/teacher/projects?view=all&class=…&cursors=…`, read defensively. */
export function parseReviewListParams(
  sp: Record<string, string | string[] | undefined>,
  classes: readonly SchoolClass[],
): ReviewListParams {
  const view = first(sp.view) === 'all' ? 'all' : 'queue';
  const asked = first(sp.class);
  const chosen =
    classes.find((cls) => cls.id === asked) ??
    classes.find((cls) => !cls.archived) ??
    classes[0] ??
    null;

  const raw = first(sp.cursors);
  let trail: string[] = [];
  let staleLink = false;
  if (raw !== undefined && raw !== '') {
    const parts = raw.split('.');
    if (parts.length <= MAX_TRAIL && parts.every((part) => COMPOSITE_ID_PATTERN.test(part))) {
      trail = parts;
    } else {
      staleLink = true;
    }
  }
  return { view, classId: chosen?.id ?? null, trail, staleLink };
}

/** The All view of one class, at the page that `trail` leads to. */
export function allViewHref(classId: string, trail: readonly string[]): string {
  const query = new URLSearchParams({ view: 'all', class: classId });
  if (trail.length > 0) query.set('cursors', trail.join('.'));
  return `/teacher/projects?${query.toString()}`;
}

/** Previous and next links of the All view: Firestore cursors only go forward. */
export function pageHrefs(
  classId: string,
  trail: readonly string[],
  nextCursor: string | null,
): { previousHref: string | null; nextHref: string | null; page: number } {
  return {
    previousHref: trail.length === 0 ? null : allViewHref(classId, trail.slice(0, -1)),
    nextHref:
      nextCursor === null || trail.length >= MAX_TRAIL
        ? null
        : allViewHref(classId, [...trail, nextCursor]),
    page: trail.length + 1,
  };
}
