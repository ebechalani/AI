import { COMPOSITE_ID_PATTERN } from '@/lib/schemas/common';

// Cursor paging in the URL for the school's lists (teachers, students, certificates): WS-C's
// pattern for any path. Firestore cursors only go forward, so every link carries the cursors of
// the pages before it (the trail) and its page number.

/** Joins the cursors of the earlier pages; never part of a uid or a certificate id. */
export const TRAIL_SEPARATOR = '.';

/**
 * How many earlier cursors the URL carries. A certificate id is up to ~130 characters, so 20 of
 * them keep the URL well below Node's 16 KB header limit.
 */
export const MAX_TRAIL = 20;

/** ARCHITECTURE.md 3.7: the School Teachers / Students / Certificates queries, 50 per page. */
export const PAGE_SIZE = 50;

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

/** `${path}?cursor=…&page=…&trail=a.b`, empty parts left out; `path` alone for page 1. */
export function pagedHref(path: string, paging: Paging): string {
  if (paging.cursor === null) return path;
  const params = new URLSearchParams({ cursor: paging.cursor });
  if (paging.page !== null && paging.page > 1) params.set('page', String(paging.page));
  if (paging.trail.length > 0) params.set('trail', paging.trail.join(TRAIL_SEPARATOR));
  return `${path}?${params.toString()}`;
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
 * Previous / next links and the page number. Previous from the oldest page the trail still knows
 * goes to page 1: the cursors in between are gone.
 */
export function pageLinks(
  path: string,
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
        : pagedHref(path, {
            cursor: previousCursor,
            trail: trail.slice(0, -1),
            page: page === undefined ? null : page - 1,
          }),
    nextHref:
      nextCursor === null
        ? null
        : pagedHref(path, {
            cursor: nextCursor,
            trail: nextTrail,
            page: page === undefined ? null : page + 1,
          }),
    page,
  };
}
