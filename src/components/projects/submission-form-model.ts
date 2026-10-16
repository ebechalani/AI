// The submission form's draft and how it becomes a SubmitWorkInput (SPEC-D 5.1, 5.3). Pure, for
// the unit tests.

import { SUBMISSION_LIMITS } from '@/lib/limits';
import { FILE_KINDS, type FileKind, type FileRef, type SubmissionType } from '@/types/common';
import type { SubmitWorkInput } from '@/types/inputs';
import type { Submission, SubmissionContent, SubmissionTarget } from '@/types/project';

export interface SubmissionDraft {
  type: SubmissionType;
  title: string;
  description: string;
  text: string;
  code: string;
  codeLanguage: string;
  linkUrl: string;
  /** Files of any kind; only those of the selected type are sent. */
  attachments: FileRef[];
}

/** What a new version starts from: the returned attempt's own words (its files stay with it). */
export interface SubmissionSeed {
  title: string;
  description: string;
  type: SubmissionType;
  content: SubmissionContent;
}

export function seedFrom(s: Submission): SubmissionSeed {
  return { title: s.title, description: s.description, type: s.type, content: { ...s.content } };
}

export function initialDraft(
  allowedTypes: readonly SubmissionType[],
  seed: SubmissionSeed | null,
): SubmissionDraft {
  const type =
    seed !== null && allowedTypes.includes(seed.type) ? seed.type : (allowedTypes[0] ?? 'text');
  return {
    type,
    title: seed?.title ?? '',
    description: seed?.description ?? '',
    text: seed?.content.text ?? '',
    code: seed?.content.code ?? '',
    codeLanguage: seed?.content.codeLanguage ?? '',
    linkUrl: seed?.content.linkUrl ?? '',
    attachments: [],
  };
}

export function isFileType(type: SubmissionType): type is FileKind {
  return (FILE_KINDS as readonly string[]).includes(type);
}

/** The attachments that go with the selected type: none for text, code and link. */
export function sentAttachments(d: SubmissionDraft): FileRef[] {
  const { type } = d;
  return isFileType(type) ? d.attachments.filter((file) => file.kind === type) : [];
}

/**
 * Only the selected type's content is sent: text as typed, code untrimmed (indentation counts),
 * the link trimmed. Title and description go as typed; the schema trims them.
 */
export function toSubmitInput(
  d: SubmissionDraft,
  target: SubmissionTarget,
  previousSubmissionId: string | null,
): SubmitWorkInput {
  const link = d.linkUrl.trim();
  return {
    target,
    title: d.title,
    description: d.description,
    type: d.type,
    content: {
      text: d.type === 'text' ? d.text : null,
      code: d.type === 'code' ? d.code : null,
      codeLanguage: d.type === 'code' && d.codeLanguage !== '' ? d.codeLanguage : null,
      linkUrl: d.type === 'link' && link !== '' ? link : null,
    },
    fileIds: sentAttachments(d).map((file) => file.fileId),
    previousSubmissionId,
  };
}

export type FormField =
  'type' | 'title' | 'description' | 'text' | 'code' | 'codeLanguage' | 'linkUrl' | 'files';

const FIELD_BY_PATH: Record<string, FormField> = {
  type: 'type',
  title: 'title',
  description: 'description',
  'content.text': 'text',
  'content.code': 'code',
  'content.codeLanguage': 'codeLanguage',
  'content.linkUrl': 'linkUrl',
  fileIds: 'files',
};

/** The field a `fieldErrors` path belongs to; null for problems shown at the form level. */
export function fieldOf(path: string): FormField | null {
  if (Object.hasOwn(FIELD_BY_PATH, path)) return FIELD_BY_PATH[path]!;
  return /^fileIds\.\d+$/.test(path) ? 'files' : null;
}

/** The first validation key per field, and every key that belongs to no field. */
export function splitFieldErrors(fieldErrors: Record<string, string[]> | undefined): {
  fields: Partial<Record<FormField, string>>;
  form: string[];
} {
  const fields: Partial<Record<FormField, string>> = {};
  const form: string[] = [];
  for (const [path, keys] of Object.entries(fieldErrors ?? {})) {
    const key = keys[0];
    if (key === undefined) continue;
    const field = fieldOf(path);
    if (field === null) {
      if (!form.includes(key)) form.push(key);
    } else {
      fields[field] ??= key;
    }
  }
  return { fields, form };
}

/** The order of the fields on screen: the first invalid one in this order gets focus. */
export const FIELD_ORDER: readonly FormField[] = [
  'type',
  'title',
  'text',
  'codeLanguage',
  'code',
  'linkUrl',
  'files',
  'description',
];

export function canAddAttachment(d: SubmissionDraft): boolean {
  return sentAttachments(d).length < SUBMISSION_LIMITS.maxAttachments;
}

/**
 * After a successful send: a new version sent from the returned attempt's page opens the new
 * attempt's page; everywhere else (the lesson, a challenge page) the page is refreshed.
 */
export function successTarget(
  pathname: string,
  previousSubmissionId: string | null,
  newId: string,
): { kind: 'push'; href: string } | { kind: 'refresh' } {
  if (previousSubmissionId !== null && pathname === `/student/projects/${previousSubmissionId}`) {
    return { kind: 'push', href: `/student/projects/${newId}` };
  }
  return { kind: 'refresh' };
}
