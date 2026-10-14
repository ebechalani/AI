import { clsx, type ClassValue } from 'clsx';

/** Joins class names, dropping falsy values. It does not resolve conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

const DATE_STYLES = {
  date: { dateStyle: 'medium' },
  dateLong: { dateStyle: 'long' },
  dateTime: { dateStyle: 'medium', timeStyle: 'short' },
  time: { timeStyle: 'short' },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

export type DateStyle = keyof typeof DATE_STYLES;

/**
 * Formats an ISO date string for display. Without `timeZone` the runtime's zone is used: the
 * visitor's in the browser, the server's (UTC on Vercel) in a server component. A client
 * component that also renders on the server passes one, or the two renders can disagree.
 * An unparsable value yields an empty string.
 */
export function formatDate(
  value: string | Date,
  locale: string,
  style: DateStyle = 'date',
  timeZone?: string,
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, { ...DATE_STYLES[style], timeZone }).format(date);
}

/** Exhaustiveness check: fails to compile when a union member is unhandled. */
export function assertNever(value: never, message = 'Unexpected value'): never {
  throw new Error(`${message}: ${JSON.stringify(value)}`);
}
