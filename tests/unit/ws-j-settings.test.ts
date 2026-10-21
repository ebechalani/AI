import { describe, expect, it } from 'vitest';
import {
  accountIdentifier,
  isEmptyPatch,
  languagePlan,
  profilePatch,
} from '@/app/[locale]/student/(shell)/settings/_components/settings-model';

// The Settings page's pure model (ARCHITECTURE.md 6.4 "Settings").

const saved = { displayName: 'Sam Demo', avatarId: 'rocket' };

describe('profilePatch', () => {
  it('sends only what changed', () => {
    expect(profilePatch(saved, { ...saved })).toEqual({});
    expect(profilePatch(saved, { ...saved, displayName: '  Sam Demo ' })).toEqual({});
    expect(profilePatch(saved, { ...saved, avatarId: 'atom' })).toEqual({ avatarId: 'atom' });
    expect(profilePatch(saved, { displayName: 'Sam D.', avatarId: 'atom' })).toEqual({
      displayName: 'Sam D.',
      avatarId: 'atom',
    });
  });

  it('tells an empty patch', () => {
    expect(isEmptyPatch({})).toBe(true);
    expect(isEmptyPatch({ locale: 'fr' })).toBe(false);
    expect(isEmptyPatch({ avatarId: 'atom' })).toBe(false);
  });
});

describe('languagePlan', () => {
  it('persists a new stored language and switches when the page differs', () => {
    expect(languagePlan('en', 'en', 'en')).toEqual({ persist: false, switchTo: null });
    expect(languagePlan('fr', 'en', 'en')).toEqual({ persist: true, switchTo: 'fr' });
    expect(languagePlan('fr', 'en', 'fr')).toEqual({ persist: true, switchTo: null });
    expect(languagePlan('en', 'en', 'fr')).toEqual({ persist: false, switchTo: 'en' });
  });
});

describe('accountIdentifier', () => {
  it('prefers the username, then the email', () => {
    expect(accountIdentifier({ username: 'lea.demo', email: 'x@example.test' })).toEqual({
      kind: 'username',
      value: 'lea.demo',
    });
    expect(accountIdentifier({ username: null, email: 'sam@example.test' })).toEqual({
      kind: 'email',
      value: 'sam@example.test',
    });
    expect(accountIdentifier({ username: null, email: null })).toBeNull();
  });
});
