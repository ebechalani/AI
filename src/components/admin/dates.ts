import { DEFAULT_TIME_ZONE, toSupportedTimeZone } from '@/lib/i18n/time-zone';
import type { IsoDateString } from '@/types/common';

// Form dates are entered and shown in the viewer's time zone (`useTimeZone()`, the `tz` cookie
// of ARCHITECTURE.md 7.5) and stored as UTC ISO strings, so the tables (formatted with
// `useDateFormat`, same zone) show exactly what was typed. Pure: no Date.now(), no React.

const LOCAL_INPUT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const DATE_INPUT = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `toSupportedTimeZone(timeZone)`, or UTC when the zone is unknown or missing. */
export function safeTimeZone(timeZone: string | undefined): string {
  return toSupportedTimeZone(timeZone) ?? DEFAULT_TIME_ZONE;
}

interface WallParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let cached = formatters.get(timeZone);
  if (cached === undefined) {
    cached = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, cached);
  }
  return cached;
}

/** The wall-clock fields of the instant `t` in `timeZone`. */
function zonedParts(t: number, timeZone: string): WallParts {
  const fields: Record<string, number> = {};
  for (const part of formatter(timeZone).formatToParts(new Date(t))) {
    if (part.type !== 'literal') fields[part.type] = Number(part.value);
  }
  return {
    year: fields.year ?? 0,
    month: fields.month ?? 0,
    day: fields.day ?? 0,
    // Some engines print midnight as 24 even with hourCycle h23.
    hour: (fields.hour ?? 0) % 24,
    minute: fields.minute ?? 0,
    second: fields.second ?? 0,
  };
}

const pad = (value: number, width = 2) => String(value).padStart(width, '0');

function wallString(parts: WallParts): string {
  return `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

/** The zone's offset at `t`, in milliseconds (positive east of UTC). */
function offsetAt(t: number, timeZone: string): number {
  const p = zonedParts(t, timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - t;
}

function parseIso(iso: IsoDateString | null): number | null {
  if (iso === null) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

/** 'YYYY-MM-DDTHH:mm' (an <input type="datetime-local"> value) of `iso` in `timeZone`; '' for null or an unparsable value. */
export function isoToLocalInput(iso: IsoDateString | null, timeZone: string): string {
  const t = parseIso(iso);
  return t === null ? '' : wallString(zonedParts(t, timeZone));
}

/** 'YYYY-MM-DD' (an <input type="date"> value) of `iso` in `timeZone`; ''. */
export function isoToDateInput(iso: IsoDateString | null, timeZone: string): string {
  return isoToLocalInput(iso, timeZone).slice(0, 10);
}

/**
 * The instant whose wall-clock time in `timeZone` is `value` ('YYYY-MM-DDTHH:mm'), as an ISO
 * string; null for '', a malformed value or an impossible date ('2026-02-30T10:00'). A wall
 * time skipped by a DST change lands one gap later (New York 2026-03-08 02:30 → 03:30 EDT);
 * an ambiguous one gives the earlier of its two instants.
 */
export function localInputToIso(value: string, timeZone: string): IsoDateString | null {
  const match = LOCAL_INPUT.exec(value);
  if (match === null) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number) as [
    number,
    number,
    number,
    number,
    number,
  ];
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const utcWall = new Date(guess);
  if (
    utcWall.getUTCFullYear() !== year ||
    utcWall.getUTCMonth() !== month - 1 ||
    utcWall.getUTCDate() !== day ||
    utcWall.getUTCHours() !== hour ||
    utcWall.getUTCMinutes() !== minute
  ) {
    return null;
  }
  const t1 = guess - offsetAt(guess, timeZone);
  const t2 = guess - offsetAt(t1, timeZone);
  const matching = [t1, t2].filter((t) => wallString(zonedParts(t, timeZone)) === value);
  const result = matching.length > 0 ? Math.min(...matching) : Math.max(t1, t2);
  return new Date(result).toISOString();
}

/** The start of the day `value` ('YYYY-MM-DD') in `timeZone`, as an ISO string; null when malformed. */
export function dateInputToIso(value: string, timeZone: string): IsoDateString | null {
  if (!DATE_INPUT.test(value)) return null;
  return localInputToIso(`${value}T00:00`, timeZone);
}

/** 'YYYY-MM-DD' one calendar year later (Feb 29 → Feb 28); '' or a malformed value stays ''. */
export function addYear(dateInput: string): string {
  const match = DATE_INPUT.exec(dateInput);
  if (match === null) return '';
  const [year, month, day] = match.slice(1).map(Number) as [number, number, number];
  let next = new Date(Date.UTC(year + 1, month - 1, day));
  if (next.getUTCMonth() !== month - 1) next = new Date(Date.UTC(year + 1, month, 0));
  if (Number.isNaN(next.getTime())) return '';
  return `${pad(next.getUTCFullYear(), 4)}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}
