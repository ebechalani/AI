import { COMPOSITE_ID_PATTERN } from '@/lib/schemas/common';

// Cursor paging carried in the URL, the WS-C pattern (src/components/quiz/assessments-model.ts)
// made generic over the path and its other parameters: every admin list (schools, users,
// subscriptions, licenses, certificates, entries) pages the same way. Every href is locale-less.

/** The Admin lists default page size (ARCHITECTURE.md 3.7). */
export const PAGE_SIZE = 50;

/** Joins the cursors of the earlier pages; never part of a uid or a composite id. */
export const TRAIL_SEPARATOR = '.';

/** How many earlier cursors the URL carries (20 composite ids keep it well under 16 KB). */
export const MAX_TRAIL = 20;

/** A page number a link carries: a positive integer of at most six digits. */
const PAGE_PATTERN = /^[1-9]\d{0,5}$/;

export interface Paging {
  /** The last id of the previous page; null on page 1. */
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
export function parsePaging(rawCursor?: string, rawTrail?: string, rawPage?: string): Paging {
  if (rawCursor === undefined || !COMPOSITE_ID_PATTERN.test(rawCursor)) {
    return { cursor: null, trail: [], page: null };
  }
  const page = rawPage !== undefined && PAGE_PATTERN.test(rawPage) ? Number(rawPage) : null;
  if (rawTrail === undefined || rawTrail === '') return { cursor: rawCursor, trail: [], page };
  const trail = rawTrail.split(TRAIL_SEPARATOR);
  const valid = trail.length <= MAX_TRAIL && trail.every((id) => COMPOSITE_ID_PATTERN.test(id));
  return { cursor: rawCursor, trail: valid ? trail : [], page };
}

/** The other query parameters of a list; empty, null and undefined values are left out. */
export type QueryParams = Readonly<Record<string, string | null | undefined>>;

/**
 * `${path}?…`: the non-empty `params` in insertion order, then the cursor, the page number
 * (above 1 only) and the trail when there is a cursor; `path` alone when nothing is left.
 */
export function listHref(path: string, params: QueryParams, paging?: Paging): string {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(name, value);
  }
  if (paging && paging.cursor) {
    query.set('cursor', paging.cursor);
    if (paging.page !== null && paging.page > 1) query.set('page', String(paging.page));
    if (paging.trail.length > 0) query.set('trail', paging.trail.join(TRAIL_SEPARATOR));
  }
  const text = query.toString();
  return text === '' ? path : `${path}?${text}`;
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
 * carries the cursors of the pages before (the last MAX_TRAIL of them) and every link carries
 * its page number, which stays right after the trail was cut. Previous from the oldest page the
 * trail still knows goes to page 1: the cursors in between are gone.
 */
export function pageLinks(
  path: string,
  params: QueryParams,
  paging: Paging,
  nextCursor: string | null,
): { previousHref: string | null; nextHref: string | null; page: number | undefined } {
  const { cursor, trail } = paging;
  const page = cursor === null ? 1 : pageNumber(trail.length, paging.page);
  const nextTrail = cursor === null ? [] : [...trail, cursor].slice(-MAX_TRAIL);
  const previousCursor = cursor === null ? null : (trail.at(-1) ?? null);
  return {
    previousHref:
      cursor === null
        ? null
        : listHref(path, params, {
            cursor: previousCursor,
            trail: trail.slice(0, -1),
            page: page === undefined ? null : page - 1,
          }),
    nextHref:
      nextCursor === null
        ? null
        : listHref(path, params, {
            cursor: nextCursor,
            trail: nextTrail,
            page: page === undefined ? null : page + 1,
          }),
    page,
  };
}
