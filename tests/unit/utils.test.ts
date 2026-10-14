import { describe, expect, it } from 'vitest';
import { assertNever, cn, formatDate } from '@/lib/utils';

describe('cn', () => {
  it('joins class names and drops falsy values', () => {
    expect(cn('a', false, null, undefined, ['b', { c: true, d: false }])).toBe('a b c');
  });
});

describe('formatDate', () => {
  const iso = '2026-03-05T14:30:00.000Z';

  it('formats in the given locale and time zone', () => {
    expect(formatDate(iso, 'en', 'date', 'UTC')).toBe('Mar 5, 2026');
    expect(formatDate(iso, 'fr', 'dateLong', 'UTC')).toBe('5 mars 2026');
    expect(formatDate(iso, 'en', 'time', 'Asia/Beirut')).toMatch(/^4:30\sPM$/);
    expect(formatDate(new Date(iso), 'fr', 'dateTime', 'UTC')).toContain('14:30');
  });

  it('returns an empty string for a value that is not a date', () => {
    expect(formatDate('not a date', 'en')).toBe('');
  });
});

describe('assertNever', () => {
  it('throws with the value it was given', () => {
    expect(() => assertNever('surprise' as never)).toThrowError('Unexpected value: "surprise"');
  });
});
