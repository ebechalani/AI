import { describe, expect, it } from 'vitest';
import { CONTENT_LIMITS, USERNAME_PATTERN } from '@/lib/limits';
import {
  generatePassword,
  usernameBase,
  usernameCandidate,
} from '@/lib/services/internal-credentials';

// The generated credentials of username accounts (services/provisioning).

describe('usernameBase', () => {
  it('lower-cases, strips accents and joins words with a dot', () => {
    expect(usernameBase('Léa Martin')).toBe('lea.martin');
    expect(usernameBase('  Omar   El-Sayed ')).toBe('omar.el.sayed');
    expect(usernameBase('Maya')).toBe('maya');
    expect(usernameBase('x.y_z')).toBe('x.y.z');
  });

  it('always yields a valid username with room for four digits', () => {
    const names = ['李明', 'A', 'Al', 'Jean-Baptiste de la Fontaine-Rousseau Junior', '!!!', '42'];
    for (const name of names) {
      const base = usernameBase(name);
      expect(base).toMatch(USERNAME_PATTERN);
      expect(base.length).toBeLessThanOrEqual(26);
    }
    expect(usernameBase('李明')).toBe('student');
    expect(usernameBase('Al')).toBe('al1');
  });

  it('never ends with a dot after truncation', () => {
    expect(usernameBase('Abcdefghijklmnopqrstuvwxy Zed')).toBe('abcdefghijklmnopqrstuvwxy');
  });
});

describe('usernameCandidate', () => {
  it('tries the base first, then the base with two to four digits', () => {
    expect(usernameCandidate('lea.martin', 0)).toBe('lea.martin');
    for (let attempt = 1; attempt < 8; attempt += 1) {
      const candidate = usernameCandidate('lea.martin', attempt);
      expect(candidate).toMatch(/^lea\.martin\d{2,4}$/);
      expect(candidate).toMatch(USERNAME_PATTERN);
    }
  });

  it('stays within the username length for the longest base', () => {
    const base = 'a'.repeat(26);
    for (let attempt = 1; attempt < 8; attempt += 1) {
      expect(usernameCandidate(base, attempt)).toMatch(USERNAME_PATTERN);
    }
  });
});

describe('generatePassword', () => {
  it('is three readable groups of four without ambiguous characters', () => {
    const password = generatePassword();
    expect(password).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);
    expect(password).not.toMatch(/[ilo01]/);
    expect(password.length).toBeGreaterThanOrEqual(CONTENT_LIMITS.passwordMinChars);
    expect(password.length).toBeLessThanOrEqual(CONTENT_LIMITS.passwordMaxChars);
  });

  it('differs between calls', () => {
    expect(new Set(Array.from({ length: 20 }, () => generatePassword())).size).toBe(20);
  });
});
