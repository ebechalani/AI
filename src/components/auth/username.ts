import { USERNAME_PATTERN } from '@/lib/limits';

const MAX_SUGGESTION_CHARS = 26;

/**
 * A username proposed from a display name, the way staff-provisioned accounts are named:
 * accents dropped, lower-cased, words joined by a dot. Returns '' when nothing usable is left,
 * so the field stays empty rather than holding a value the schema would refuse.
 */
export function suggestUsername(displayName: string): string {
  const candidate = displayName
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, MAX_SUGGESTION_CHARS)
    .replace(/\.+$/, '');
  return USERNAME_PATTERN.test(candidate) ? candidate : '';
}
