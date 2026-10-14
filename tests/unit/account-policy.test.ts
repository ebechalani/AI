import { describe, expect, it } from 'vitest';
import { SELF_SIGNUP_AGE_BANDS, studentAccountPolicy } from '@/lib/auth/account-policy';
import {
  identifierToEmail,
  isUsernameAccountEmail,
  isValidUsername,
  STUDENT_EMAIL_DOMAIN,
  usernameToEmail,
} from '@/lib/auth/username';
import * as limits from '@/lib/limits';
import { AGE_BANDS, type AgeBand } from '@/types';

const UNDER_13: AgeBand[] = ['8-10', '11-12'];
const OVER_13: AgeBand[] = ['13-15', '16-18', 'adult'];

const schoolClass = { schoolId: 's1' };
const soloClass = { schoolId: null };

describe('studentAccountPolicy', () => {
  it('covers every age band in these tests', () => {
    expect([...UNDER_13, ...OVER_13]).toEqual([...AGE_BANDS]);
  });

  describe('a class of an active school', () => {
    it.each(AGE_BANDS)('allows %s on the consent of the school', (ageBand) => {
      for (const ownerVerifiedEducator of [true, false]) {
        expect(
          studentAccountPolicy(schoolClass, { schoolActive: true, ownerVerifiedEducator }, ageBand),
        ).toEqual({ allowed: true, consentBasis: 'school' });
      }
    });
  });

  describe('a class of a suspended school', () => {
    it.each(AGE_BANDS)('refuses %s, verified owner or not', (ageBand) => {
      for (const ownerVerifiedEducator of [true, false]) {
        expect(
          studentAccountPolicy(
            schoolClass,
            { schoolActive: false, ownerVerifiedEducator },
            ageBand,
          ),
        ).toEqual({ allowed: false, reason: 'school_inactive' });
      }
    });
  });

  describe('a class without a school, owned by a verified educator', () => {
    const ctx = { schoolActive: false, ownerVerifiedEducator: true };

    it.each(UNDER_13)('refuses %s: under 13 needs a school', (ageBand) => {
      expect(studentAccountPolicy(soloClass, ctx, ageBand)).toEqual({
        allowed: false,
        reason: 'under_13_requires_school',
      });
    });

    it('allows 13 and over on the learner’s own consent', () => {
      expect(studentAccountPolicy(soloClass, ctx, '13-15')).toEqual({
        allowed: true,
        consentBasis: 'self_13_plus',
      });
      expect(studentAccountPolicy(soloClass, ctx, '16-18')).toEqual({
        allowed: true,
        consentBasis: 'self_13_plus',
      });
      expect(studentAccountPolicy(soloClass, ctx, 'adult')).toEqual({
        allowed: true,
        consentBasis: 'adult',
      });
    });

    it('ignores schoolActive, which has no meaning without a school', () => {
      expect(studentAccountPolicy(soloClass, { ...ctx, schoolActive: true }, '8-10')).toEqual({
        allowed: false,
        reason: 'under_13_requires_school',
      });
    });
  });

  describe('a class without a school, owned by an unverified teacher', () => {
    it.each(AGE_BANDS)('refuses %s', (ageBand) => {
      for (const schoolActive of [true, false]) {
        expect(
          studentAccountPolicy(soloClass, { schoolActive, ownerVerifiedEducator: false }, ageBand),
        ).toEqual({ allowed: false, reason: 'educator_not_verified' });
      }
    });
  });

  it('never allows an under-13 account outside an active school', () => {
    for (const cls of [schoolClass, soloClass]) {
      for (const schoolActive of [true, false]) {
        for (const ownerVerifiedEducator of [true, false]) {
          for (const ageBand of UNDER_13) {
            const decision = studentAccountPolicy(
              cls,
              { schoolActive, ownerVerifiedEducator },
              ageBand,
            );
            expect(decision.allowed).toBe(cls.schoolId !== null && schoolActive);
          }
        }
      }
    }
  });
});

describe('SELF_SIGNUP_AGE_BANDS', () => {
  it('is the list of lib/limits, re-exported, and starts at 13', () => {
    expect(SELF_SIGNUP_AGE_BANDS).toBe(limits.SELF_SIGNUP_AGE_BANDS);
    expect(SELF_SIGNUP_AGE_BANDS).toEqual(OVER_13);
  });
});

describe('usernames', () => {
  it('the synthetic domain can never receive mail', () => {
    expect(STUDENT_EMAIL_DOMAIN).toBe('student.roboholic.invalid');
  });

  it('identifierToEmail appends the domain only when there is no @', () => {
    expect(identifierToEmail('lea.m')).toBe('lea.m@student.roboholic.invalid');
    expect(identifierToEmail('  Lea.M ')).toBe('lea.m@student.roboholic.invalid');
    expect(identifierToEmail('Teacher@School.example')).toBe('teacher@school.example');
    expect(usernameToEmail('sam_7')).toBe('sam_7@student.roboholic.invalid');
  });

  it('isUsernameAccountEmail recognises only the synthetic domain', () => {
    expect(isUsernameAccountEmail('lea.m@student.roboholic.invalid')).toBe(true);
    expect(isUsernameAccountEmail('LEA.M@STUDENT.ROBOHOLIC.INVALID')).toBe(true);
    expect(isUsernameAccountEmail('lea@school.example')).toBe(false);
    expect(isUsernameAccountEmail('lea@evilstudent.roboholic.invalid')).toBe(false);
    expect(isUsernameAccountEmail('student.roboholic.invalid')).toBe(false);
    expect(isUsernameAccountEmail(null)).toBe(false);
    expect(isUsernameAccountEmail(undefined)).toBe(false);
  });

  it('isValidUsername follows USERNAME_PATTERN', () => {
    expect(isValidUsername('lea.m')).toBe(true);
    expect(isValidUsername('sam_7-b')).toBe(true);
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidUsername('Lea')).toBe(false);
    expect(isValidUsername('lea m')).toBe(false);
    expect(isValidUsername('lea@m')).toBe(false);
    expect(isValidUsername('a'.repeat(31))).toBe(false);
  });
});
