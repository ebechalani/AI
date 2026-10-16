import { COMPOSITE_ID_PATTERN } from '@/lib/schemas/common';
import type { SchoolClass } from '@/types/school';

// The filters and the paging of /teacher/assessments as pure functions, so both teacher pages
// and the unit tests share them. Every href is locale-less (`Link` and `LinkButton` add it).

export const ASSESSMENTS_PATH = '/teacher/assessments';

/** The first value of a search parameter that may be repeated. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** The asked class when the teacher has it; else the first active class; else the first one. */
export function resolveClassId(
  raw: string | undefined,
  classes: readonly Pick<SchoolClass, 'id' | 'archived'>[],
): string | null {
  if (raw !== undefined && classes.some((cls) => cls.id === raw)) return raw;
  return (classes.find((cls) => !cls.archived) ?? classes[0])?.id ?? null;
}

/** The asked course when the class assigns it; anything else means "All courses" (null). */
export function resolveCourseId(
  raw: string | undefined,
  courseIds: readonly string[],
): string | null {
  return raw !== undefined && raw !== '' && courseIds.includes(raw) ? raw : null;
}

/** Joins the cursors of the earlier pages; never part of a composite id. */
export const TRAIL_SEPARATOR = '.';

/**
 * How many earlier cursors the URL carries. An attempt id is up to ~160 characters, so 20 of
 * them keep the URL under ~3.5 KB, well below Node's 16 KB header limit.
 */
export const MAX_TRAIL = 20;

/**
 * The cursor (the last attempt id of the previous page) and the cursors of the pages before it.
 * Anything malformed falls back to page 1; a trail without a cursor means nothing.
 */
export function parsePaging(
  rawCursor: string | undefined,
  rawTrail: string | undefined,
): { cursor: string | null; trail: string[] } {
  if (rawCursor === undefined || !COMPOSITE_ID_PATTERN.test(rawCursor)) {
    return { cursor: null, trail: [] };
  }
  if (rawTrail === undefined || rawTrail === '') return { cursor: rawCursor, trail: [] };
  const trail = rawTrail.split(TRAIL_SEPARATOR);
  const valid = trail.length <= MAX_TRAIL && trail.every((id) => COMPOSITE_ID_PATTERN.test(id));
  return { cursor: rawCursor, trail: valid ? trail : [] };
}

export interface AssessmentsQuery {
  classId: string;
  courseId: string | null;
  cursor?: string | null;
  trail?: readonly string[];
}

/** `/teacher/assessments?classId=…[&courseId=…][&cursor=…][&trail=a.b]`, empty parts left out. */
export function assessmentsHref(query: AssessmentsQuery): string {
  const params = new URLSearchParams({ classId: query.classId });
  if (query.courseId) params.set('courseId', query.courseId);
  if (query.cursor) {
    params.set('cursor', query.cursor);
    if (query.trail && query.trail.length > 0) {
      params.set('trail', query.trail.join(TRAIL_SEPARATOR));
    }
  }
  return `${ASSESSMENTS_PATH}?${params.toString()}`;
}

/**
 * Previous / next links and the page number. Firestore cursors only go forward, so the trail
 * carries the cursors of the pages before; once it is full (and may have been cut) the page
 * number is unknown and left out.
 */
export function pageLinks(
  query: Required<AssessmentsQuery>,
  nextCursor: string | null,
): { previousHref: string | null; nextHref: string | null; page: number | undefined } {
  const { cursor, trail } = query;
  const base = { classId: query.classId, courseId: query.courseId };
  const page = cursor === null ? 1 : trail.length < MAX_TRAIL ? trail.length + 2 : undefined;
  const nextTrail = cursor === null ? [] : [...trail, cursor].slice(-MAX_TRAIL);
  return {
    previousHref:
      cursor === null
        ? null
        : assessmentsHref({ ...base, cursor: trail.at(-1) ?? null, trail: trail.slice(0, -1) }),
    nextHref:
      nextCursor === null
        ? null
        : assessmentsHref({ ...base, cursor: nextCursor, trail: nextTrail }),
    page,
  };
}

export function attemptHref(attemptId: string): string {
  return `${ASSESSMENTS_PATH}/${attemptId}`;
}
