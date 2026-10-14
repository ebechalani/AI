import { LOCALES } from '@/lib/i18n/config';

export type Locale = (typeof LOCALES)[number];

// Keyed by `string`, not `Locale`: a document may hold a language the UI has not enabled yet.
export type Localized<T> = { [locale: string]: T | undefined };

export type IsoDateString = string;

export interface Timestamped {
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export const ROLES = ['student', 'teacher', 'school_admin', 'platform_admin'] as const;
export type Role = (typeof ROLES)[number];

export const AGE_BANDS = ['8-10', '11-12', '13-15', '16-18', 'adult'] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export const LEARNING_AREAS = [
  'ai',
  'generative_ai',
  'coding',
  'robotics',
  'creativity',
  'innovation',
  'responsible_ai',
] as const;
export type LearningArea = (typeof LEARNING_AREAS)[number];

export const SUBMISSION_TYPES = [
  'text',
  'image',
  'audio',
  'video',
  'pdf',
  'file',
  'link',
  'code',
] as const;
export type SubmissionType = (typeof SUBMISSION_TYPES)[number];

// Every FileKind is also a SubmissionType: a submission of that type is made of uploaded files.
export const FILE_KINDS = ['image', 'audio', 'video', 'pdf', 'file'] as const;
export type FileKind = (typeof FILE_KINDS)[number];

export const AUDIENCES = ['student', 'teacher'] as const;
export type Audience = (typeof AUDIENCES)[number];

export interface MediaRef {
  fileId: string;
  storagePath: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
}

export interface FileRef {
  fileId: string;
  kind: FileKind;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export type FilePurpose = 'submission' | 'course_media';

/** `files/{fileId}`. Written once; only `submissionId` changes, when the file is attached. */
export interface FileRecord {
  id: string;
  ownerUid: string;
  schoolId: string | null;
  purpose: FilePurpose;
  kind: FileKind;
  storagePath: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  courseId: string | null;
  submissionId: string | null;
  createdAt: IsoDateString;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface PageRequest {
  limit?: number;
  cursor?: string | null;
}
