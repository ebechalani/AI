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

/** A page number a link carries: a positive integer of at most six digits. */
const PAGE_PATTERN = /^[1-9]\d{0,5}$/;

export interface Paging {
  /** The last attempt id of the previous page; null on page 1. */
  cursor: string | null;
  /** The cursors of the pages before, oldest first (the oldest ones may have been cut). */
  trail: string[];
  /** The page number the link carried; null when absent, malformed or on page 1. */
  page: number | null;
}

/**
 * The cursor, the cursors of the pages before it and the page number from the URL. Anything
 * malformed falls back to page 1; a trail or a page number without a cursor means nothing.
 */
export function parsePaging(
  rawCursor: string | undefined,
  rawTrail: string | undefined,
  rawPage?: string | undefined,
): Paging {
  if (rawCursor === undefined || !COMPOSITE_ID_PATTERN.test(rawCursor)) {
    return { cursor: null, trail: [], page: null };
  }
  const page = rawPage !== undefined && PAGE_PATTERN.test(rawPage) ? Number(rawPage) : null;
  if (rawTrail === undefined || rawTrail === '') return { cursor: rawCursor, trail: [], page };
  const trail = rawTrail.split(TRAIL_SEPARATOR);
  const valid = trail.length <= MAX_TRAIL && trail.every((id) => COMPOSITE_ID_PATTERN.test(id));
  return { cursor: rawCursor, trail: valid ? trail : [], page };
}

export interface AssessmentsQuery {
  classId: string;
  courseId: string | null;
  cursor?: string | null;
  trail?: readonly string[];
  /** The page number, carried with a cursor only (page 1 has no cursor). */
  page?: number | null;
}

/**
 * `/teacher/assessments?classId=…[&courseId=…][&cursor=…][&page=…][&trail=a.b]`, empty parts
 * left out.
 */
export function assessmentsHref(query: AssessmentsQuery): string {
  const params = new URLSearchParams({ classId: query.classId });
  if (query.courseId) params.set('courseId', query.courseId);
  if (query.cursor) {
    params.set('cursor', query.cursor);
    if (query.page != null && query.page > 1) params.set('page', String(query.page));
    if (query.trail && query.trail.length > 0) {
      params.set('trail', query.trail.join(TRAIL_SEPARATOR));
    }
  }
  return `${ASSESSMENTS_PATH}?${params.toString()}`;
}

/**
 * The number of the page a cursor opens. The trail holds every earlier cursor until it has been
 * cut, so a page is at least `trail.length + 2`; the number the link carried says how many were
 * cut. Without it a full trail may have been cut, and the number is unknown.
 */
function pageNumber(trailLength: number, carried: number | null): number | undefined {
  const least = trailLength + 2;
  if (carried !== null && carried >= least) return carried;
  return trailLength < MAX_TRAIL ? least : undefined;
}

/**
 * Previous / next links and the page number. Firestore cursors only go forward, so the trail
 * carries the cursors of the pages before (the last MAX_TRAIL of them) and every link carries its
 * page number, which stays right after the trail was cut. Previous from the oldest page the
 * trail still knows goes to page 1: the cursors in between are gone.
 */
export function pageLinks(
  query: Required<AssessmentsQuery>,
  nextCursor: string | null,
): { previousHref: string | null; nextHref: string | null; page: number | undefined } {
  const { cursor, trail } = query;
  const base = { classId: query.classId, courseId: query.courseId };
  const page = cursor === null ? 1 : pageNumber(trail.length, query.page);
  const nextTrail = cursor === null ? [] : [...trail, cursor].slice(-MAX_TRAIL);
  const previousCursor = cursor === null ? null : (trail.at(-1) ?? null);
  return {
    previousHref:
      cursor === null
        ? null
        : assessmentsHref({
            ...base,
            cursor: previousCursor,
            trail: trail.slice(0, -1),
            page: page === undefined ? null : page - 1,
          }),
    nextHref:
      nextCursor === null
        ? null
        : assessmentsHref({
            ...base,
            cursor: nextCursor,
            trail: nextTrail,
            page: page === undefined ? null : page + 1,
          }),
    page,
  };
}

export function attemptHref(attemptId: string): string {
  return `${ASSESSMENTS_PATH}/${attemptId}`;
}
