// The details of an official course that a content release may replace (ARCHITECTURE.md 11.7):
// its texts, its estimated time and its tags. A release names the fingerprint of the details it
// replaces, so details a platform admin has edited in the app are never overwritten.

import { createHash } from 'node:crypto';
import type { Course } from '@/types/content';

export type CourseDetails = Pick<Course, 'translations' | 'estimatedMinutes' | 'tags'>;

export function courseDetailsOf(fields: CourseDetails): CourseDetails {
  return {
    translations: fields.translations,
    estimatedMinutes: fields.estimatedMinutes,
    tags: fields.tags,
  };
}

// Object keys sorted at every level, so the order in which Firestore returns a map's fields
// does not change the fingerprint.
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
}

/** A short, stable fingerprint of a course's details: the first 16 hex digits of a SHA-256. */
export function fingerprintCourseDetails(fields: CourseDetails): string {
  return createHash('sha256')
    .update(JSON.stringify(canonical(courseDetailsOf(fields))))
    .digest('hex')
    .slice(0, 16);
}
