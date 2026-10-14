import 'server-only';
import {
  FieldValue,
  Timestamp,
  type DocumentSnapshot,
  type QuerySnapshot,
} from 'firebase-admin/firestore';
import { NotFoundError } from '@/lib/errors';
import type { IsoDateString } from '@/types/common';

// --- Reading: Firestore → domain types ---------------------------------------------------------

export function toIso(value: Timestamp | Date): IsoDateString {
  return (value instanceof Timestamp ? value.toDate() : value).toISOString();
}

export function toIsoOrNull(value: Timestamp | Date | null | undefined): IsoDateString | null {
  return value === null || value === undefined ? null : toIso(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/** Replaces every Timestamp, at any depth of maps and arrays, by its ISO string. */
export function convertTimestamps(value: unknown): unknown {
  if (value instanceof Timestamp) return toIso(value);
  if (Array.isArray(value)) return value.map(convertTimestamps);
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, convertTimestamps(entry)]),
    );
  }
  return value;
}

/**
 * A document as its domain type (ARCHITECTURE.md 10.1): the stored fields with every Timestamp
 * as an ISO string, plus `id`, plus the parent ids of a subcollection document, which the
 * caller passes as `parents` (`{ courseId }`, `{ submissionId }`, …).
 *
 * T is asserted, not checked: the repository that wrote the document vouches for its shape.
 * Throws NotFoundError when the document does not exist.
 */
export function fromSnapshot<T>(snapshot: DocumentSnapshot, parents?: Record<string, string>): T {
  const document = fromSnapshotOrNull<T>(snapshot, parents);
  if (document === null) throw new NotFoundError(`${snapshot.ref.path} does not exist.`);
  return document;
}

export function fromSnapshotOrNull<T>(
  snapshot: DocumentSnapshot,
  parents?: Record<string, string>,
): T | null {
  const data = snapshot.data();
  if (data === undefined) return null;
  return { ...(convertTimestamps(data) as object), ...parents, id: snapshot.id } as T;
}

export function fromQuery<T>(snapshot: QuerySnapshot, parents?: Record<string, string>): T[] {
  return snapshot.docs.map((document) => fromSnapshot<T>(document, parents));
}

// --- Writing: domain values → Firestore --------------------------------------------------------

export function toTimestamp(value: IsoDateString | Date): Timestamp {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) throw new Error('Not a date: cannot convert to a Timestamp.');
  return Timestamp.fromDate(date);
}

export function toTimestampOrNull(
  value: IsoDateString | Date | null | undefined,
): Timestamp | null {
  return value === null || value === undefined ? null : toTimestamp(value);
}

/** The server's clock at commit time; every `createdAt` and `updatedAt` is written with it. */
export function serverTimestamp(): FieldValue {
  return FieldValue.serverTimestamp();
}

/** For a new document: `{ ...fields, ...createdNow() }`. */
export function createdNow(): { createdAt: FieldValue; updatedAt: FieldValue } {
  return { createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
}

/** For an update: `{ ...patch, ...updatedNow() }`. */
export function updatedNow(): { updatedAt: FieldValue } {
  return { updatedAt: serverTimestamp() };
}
