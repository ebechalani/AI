import { randomInt } from 'node:crypto';
import { CONTENT_LIMITS, JOIN_CODE, USERNAME_PATTERN } from '@/lib/limits';

// Private to src/lib/services: the generated credentials of username accounts
// (provisioning.provisionStudents, resetStudentPassword). Pure, so it is unit-tested directly.

const USERNAME_MAX_CHARS = 30;
const USERNAME_MIN_CHARS = 3;
/** Room left for the digits a collision appends. */
const SUFFIX_MAX_DIGITS = 4;
const USERNAME_BASE_MAX_CHARS = USERNAME_MAX_CHARS - SUFFIX_MAX_DIGITS;
const FALLBACK_USERNAME = 'student';

/**
 * The username a display name suggests: ASCII letters and digits, lower-cased, words joined by
 * a dot ("Léa Martin" → "lea.martin"). Always matches USERNAME_PATTERN with room for a suffix.
 */
export function usernameBase(displayName: string): string {
  const words = displayName
    .normalize('NFKD')
    .replace(/[\u{0300}-\u{036f}]/gu, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word !== '');
  let base = words.join('.');
  if (base === '') base = FALLBACK_USERNAME;
  if (base.length > USERNAME_BASE_MAX_CHARS) {
    base = base.slice(0, USERNAME_BASE_MAX_CHARS).replace(/\.+$/, '');
  }
  if (base.length < USERNAME_MIN_CHARS) base = base.padEnd(USERNAME_MIN_CHARS, '1');
  if (!USERNAME_PATTERN.test(base)) throw new Error('Could not derive a username.');
  return base;
}

/**
 * The username to try on the n-th attempt: the base itself first, then the base with random
 * digits (two, then three, then four) when an earlier candidate was taken.
 */
export function usernameCandidate(base: string, attempt: number): string {
  if (attempt <= 0) return base;
  const digits = Math.min(SUFFIX_MAX_DIGITS, 1 + Math.ceil(attempt / 2));
  const suffix = randomInt(0, 10 ** digits)
    .toString()
    .padStart(digits, '0');
  return `${base}${suffix}`;
}

/** The join-code alphabet, lower-cased: no i, l, o, 0 or 1, which children misread. */
const PASSWORD_ALPHABET = JOIN_CODE.alphabet.toLowerCase();
const PASSWORD_GROUPS = 3;
const PASSWORD_GROUP_CHARS = 4;

/** `xxxx-xxxx-xxxx`: 31^12 possibilities, readable aloud in a classroom. */
export function generatePassword(): string {
  const groups: string[] = [];
  for (let group = 0; group < PASSWORD_GROUPS; group += 1) {
    let chars = '';
    for (let index = 0; index < PASSWORD_GROUP_CHARS; index += 1) {
      chars += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)];
    }
    groups.push(chars);
  }
  const password = groups.join('-');
  if (password.length < CONTENT_LIMITS.passwordMinChars) {
    throw new Error('Generated password is shorter than the minimum.');
  }
  return password;
}
