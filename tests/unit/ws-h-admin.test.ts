import { describe, expect, it } from 'vitest';
import {
  emptyLicense,
  emptySubscription,
  endsSubscriptionAccess,
  licensePayload,
  licenseValues,
  periodEnded,
  plansFor,
  subscriptionCoverage,
  subscriptionPayload,
  subscriptionTone,
  subscriptionValues,
  suspendsLicense,
  withPlan,
} from '@/components/admin/billing-model';
import {
  challengePayload,
  challengeTitle,
  challengeTransitions,
  challengeValues,
  claimsChallengePath,
  emptyChallenge,
  filterChallenges,
  firstErrorLocale,
  focusAfterTransition,
  parseStatusFilter,
  rubricTotal,
  transitionNeedsConfirm,
  transitionTarget,
} from '@/components/admin/challenge-model';
import {
  addYear,
  dateInputToIso,
  isoToDateInput,
  isoToLocalInput,
  localInputToIso,
  safeTimeZone,
} from '@/components/admin/dates';
import {
  firstError,
  numberInput,
  unclaimedPaths,
  unprefixFieldErrors,
} from '@/components/admin/field-errors';
import { MAIN_CONTENT_ID } from '@/components/admin/focus';
import { listHref, pageLinks, parsePaging } from '@/components/admin/paging';
import {
  adminChallengeEntriesPath,
  adminChallengePath,
  adminSchoolPath,
  firstParam,
  idParam,
  userCertificatesPath,
  usersPath,
  userSubscriptionsPath,
} from '@/components/admin/paths';
import {
  countsTowardSeats,
  licenseState,
  regionName,
  schoolChoices,
  schoolPatch,
  schoolPayload,
  seatSummary,
  settingsPayload,
} from '@/components/admin/school-model';
import {
  hasLearnerLinks,
  isRoleUnchanged,
  parseRole,
  ROLE_TABS,
  roleChangeEffects,
  roleChangePayload,
  roleOptions,
  schoolRule,
  signInIdentifier,
  staffRolesAllowed,
  userRowPermissions,
} from '@/components/admin/user-model';
import {
  challengeInputSchema,
  licenseInputSchema,
  subscriptionInputSchema,
} from '@/lib/schemas/admin';
import { parseInput } from '@/lib/schemas/common';
import type { License, Subscription } from '@/types/billing';
import { challenge, profile, school } from './services-fixtures';

// The pure models of the platform admin area (SPEC-H section 4).

const START = '2026-10-01T00:00:00.000Z';
const END = '2027-10-01T00:00:00.000Z';

describe('paths', () => {
  it('builds every admin URL', () => {
    expect(adminSchoolPath('s1')).toBe('/admin/schools/s1');
    expect(adminChallengePath('c1')).toBe('/admin/challenges/c1');
    expect(adminChallengeEntriesPath('c1')).toBe('/admin/challenges/c1/entries');
    expect(usersPath('teacher')).toBe('/admin/users?role=teacher');
    expect(userCertificatesPath('a b')).toBe('/admin/certificates?user=a%20b');
    expect(userSubscriptionsPath('u1')).toBe('/admin/subscriptions?user=u1');
  });

  it('ignores forged ids and repeated parameters', () => {
    expect(idParam('a/b')).toBeUndefined();
    expect(idParam('..')).toBeUndefined();
    expect(idParam('')).toBeUndefined();
    expect(idParam('demo-student')).toBe('demo-student');
    expect(firstParam(['a', 'b'])).toBe('a');
    expect(firstParam(undefined)).toBeUndefined();
  });
});

describe('paging', () => {
  it('parses the cursor, the trail and the page, falling back to page 1', () => {
    expect(parsePaging(undefined, 'a.b', '3')).toEqual({ cursor: null, trail: [], page: null });
    expect(parsePaging('bad cursor', undefined)).toEqual({ cursor: null, trail: [], page: null });
    expect(parsePaging('u9', 'u1.u5', '3')).toEqual({ cursor: 'u9', trail: ['u1', 'u5'], page: 3 });
    const long = Array.from({ length: 21 }, (_, i) => `u${i}`).join('.');
    expect(parsePaging('u9', long, '3').trail).toEqual([]);
    expect(parsePaging('u9', 'u1', '0').page).toBeNull();
    expect(parsePaging('u9', 'u1', '01').page).toBeNull();
    expect(parsePaging('u9', 'u1', '1234567').page).toBeNull();
  });

  it('builds hrefs in parameter order with the paging last', () => {
    expect(listHref('/admin/users', { role: 'student' }, { cursor: 'u9', trail: ['u1'], page: 3 })).toBe(
      '/admin/users?role=student&cursor=u9&page=3&trail=u1',
    );
    expect(listHref('/admin/schools', {})).toBe('/admin/schools');
    expect(listHref('/admin/subscriptions', { tab: 'licenses', school: null })).toBe(
      '/admin/subscriptions?tab=licenses',
    );
    expect(listHref('/admin/users', { role: 'student' }, { cursor: null, trail: ['x'], page: 2 })).toBe(
      '/admin/users?role=student',
    );
  });

  it('links the previous and next pages (WS-C semantics)', () => {
    const first = pageLinks('/admin/users', { role: 'student' }, parsePaging(), 'u50');
    expect(first).toEqual({
      previousHref: null,
      nextHref: '/admin/users?role=student&cursor=u50&page=2',
      page: 1,
    });
    const second = pageLinks('/admin/users', { role: 'student' }, parsePaging('u50', undefined, '2'), 'u100');
    expect(second).toEqual({
      previousHref: '/admin/users?role=student',
      nextHref: '/admin/users?role=student&cursor=u100&page=3&trail=u50',
      page: 2,
    });
    const last = pageLinks('/admin/users', { role: 'student' }, parsePaging('u100', 'u50', '3'), null);
    expect(last).toEqual({
      previousHref: '/admin/users?role=student&cursor=u50&page=2',
      nextHref: null,
      page: 3,
    });
    const cut = Array.from({ length: 20 }, (_, i) => `u${i}`);
    const deep = pageLinks('/admin/users', {}, { cursor: 'u99', trail: cut, page: null }, 'u120');
    expect(deep.page).toBeUndefined();
    expect(deep.nextHref).not.toContain('page=');
    const carried = pageLinks('/admin/users', {}, { cursor: 'u99', trail: cut, page: 40 }, 'u120');
    expect(carried.page).toBe(40);
    expect(carried.nextHref).toContain('page=41');
  });
});

describe('dates', () => {
  it('round-trips in UTC and in Beirut across the October change', () => {
    expect(localInputToIso('2026-10-16T12:00', 'UTC')).toBe('2026-10-16T12:00:00.000Z');
    expect(isoToLocalInput('2026-10-16T12:00:00.000Z', 'UTC')).toBe('2026-10-16T12:00');
    expect(localInputToIso('2026-10-20T09:00', 'Asia/Beirut')).toBe('2026-10-20T06:00:00.000Z');
    expect(isoToLocalInput('2026-10-20T06:00:00.000Z', 'Asia/Beirut')).toBe('2026-10-20T09:00');
    expect(localInputToIso('2026-10-26T09:00', 'Asia/Beirut')).toBe('2026-10-26T07:00:00.000Z');
  });

  it('lands a skipped hour one gap later and picks one instant of an ambiguous one', () => {
    expect(localInputToIso('2026-03-08T02:30', 'America/New_York')).toBe('2026-03-08T07:30:00.000Z');
    expect(localInputToIso('2026-03-29T00:30', 'Asia/Beirut')).toBe('2026-03-28T22:30:00.000Z');
    const ambiguous = localInputToIso('2026-11-01T01:30', 'America/New_York');
    expect(ambiguous).not.toBeNull();
    expect(isoToLocalInput(ambiguous, 'America/New_York')).toBe('2026-11-01T01:30');
  });

  it('refuses blank, malformed and impossible values', () => {
    expect(localInputToIso('', 'UTC')).toBeNull();
    expect(localInputToIso('2026-13-01T00:00', 'UTC')).toBeNull();
    expect(localInputToIso('2026-02-30T10:00', 'UTC')).toBeNull();
    expect(isoToLocalInput(null, 'UTC')).toBe('');
    expect(isoToLocalInput('nope', 'UTC')).toBe('');
    expect(isoToDateInput('2026-10-16T23:30:00.000Z', 'Asia/Beirut')).toBe('2026-10-17');
  });

  it('builds day starts, adds a year and falls back to UTC', () => {
    expect(dateInputToIso('2027-09-16', 'UTC')).toBe('2027-09-16T00:00:00.000Z');
    expect(dateInputToIso('2027-09-16', 'Asia/Beirut')).toBe('2027-09-15T21:00:00.000Z');
    expect(dateInputToIso('', 'UTC')).toBeNull();
    expect(addYear('2028-02-29')).toBe('2029-02-28');
    expect(addYear('2026-10-16')).toBe('2027-10-16');
    expect(addYear('')).toBe('');
    expect(safeTimeZone('Mars/Base')).toBe('UTC');
    expect(safeTimeZone(undefined)).toBe('UTC');
    expect(safeTimeZone('Asia/Beirut')).toBe('Asia/Beirut');
  });
});

describe('field-errors', () => {
  it('strips the prefix, collapses duplicates and finds unclaimed paths', () => {
    expect(unprefixFieldErrors({ 'input.name': ['required'], seatsTotal: ['too_small'] }, 'input.')).toEqual({
      name: ['required'],
      seatsTotal: ['too_small'],
    });
    expect(unprefixFieldErrors({ 'input.name': ['required'], name: ['too_long'] }, 'input.')).toEqual({
      name: ['required', 'too_long'],
    });
    expect(unprefixFieldErrors(undefined, 'input.')).toEqual({});
    expect(firstError({ name: ['required', 'too_long'] }, 'name')).toBe('required');
    expect(firstError({}, 'name')).toBeUndefined();
    expect(unclaimedPaths({ name: ['x'], _form: ['y'] }, (path) => path === 'name')).toEqual(['_form']);
  });

  it('reads an empty number field as NaN, never 0', () => {
    expect(numberInput('')).toBeNaN();
    expect(numberInput('  ')).toBeNaN();
    expect(Number('  ')).toBe(0);
    expect(numberInput(' 30 ')).toBe(30);
    expect(numberInput('2.5')).toBe(2.5);
    expect(numberInput('abc')).toBeNaN();
  });
});

function licenseOf(fields: Partial<License> & { id: string }): License {
  return {
    schoolId: 'school-a',
    subscriptionId: null,
    name: 'Licence',
    seatsTotal: 20,
    scope: { type: 'all_official' },
    startsAt: START,
    endsAt: END,
    status: 'active',
    createdByUid: 'admin-1',
    createdAt: START,
    updatedAt: START,
    ...fields,
  };
}

function subscriptionOf(fields: Partial<Subscription> & { id: string }): Subscription {
  return {
    ownerType: 'user',
    ownerId: 'u1',
    plan: 'individual_yearly',
    status: 'active',
    currentPeriodStart: START,
    currentPeriodEnd: END,
    courseIds: [],
    provider: 'manual',
    providerCustomerId: null,
    providerSubscriptionId: null,
    notes: null,
    createdByUid: 'admin-1',
    createdAt: START,
    updatedAt: START,
    ...fields,
  };
}

describe('school-model', () => {
  it('builds the payloads', () => {
    expect(schoolPayload({ name: 'A', country: 'lb', city: '  ', defaultLocale: 'en' })).toEqual({
      name: 'A',
      country: 'lb',
      city: null,
      defaultLocale: 'en',
    });
    expect(settingsPayload({ aiEnabled: true, aiDailyMessageLimit: '', joinCodesEnabled: false })).toEqual({
      aiEnabled: true,
      aiDailyMessageLimit: null,
      joinCodesEnabled: false,
    });
    expect(settingsPayload({ aiEnabled: true, aiDailyMessageLimit: ' 30 ', joinCodesEnabled: true }).aiDailyMessageLimit).toBe(30);
    expect(settingsPayload({ aiEnabled: true, aiDailyMessageLimit: 'abc', joinCodesEnabled: true }).aiDailyMessageLimit).toBeNaN();
    const patch = schoolPatch(
      { name: 'A', country: 'LB', city: 'Beirut', defaultLocale: 'fr' },
      { aiEnabled: false, aiDailyMessageLimit: '10', joinCodesEnabled: true },
    );
    expect(Object.keys(patch).sort()).toEqual(['city', 'country', 'defaultLocale', 'name', 'settings']);
  });

  it('names regions and survives malformed codes', () => {
    expect(regionName('LB', 'fr')).toBe('Liban');
    expect(regionName('LB', 'en')).toBe('Lebanon');
    expect(regionName('L1', 'en')).toBe('L1');
  });

  it('derives the licence state with its boundaries', () => {
    const license = licenseOf({ id: 'l' });
    expect(licenseState(license, '2026-12-01T00:00:00.000Z')).toBe('active');
    expect(licenseState(license, '2026-09-01T00:00:00.000Z')).toBe('upcoming');
    expect(licenseState(license, '2028-01-01T00:00:00.000Z')).toBe('expired');
    expect(licenseState(license, END)).toBe('expired');
    expect(licenseState(license, START)).toBe('active');
    expect(licenseState({ ...license, status: 'suspended' }, START)).toBe('suspended');
    expect(countsTowardSeats(license, '2026-09-01T00:00:00.000Z')).toBe(true);
    expect(countsTowardSeats({ ...license, status: 'suspended' }, START)).toBe(false);
    expect(countsTowardSeats(license, END)).toBe(false);
  });

  it('summarises the seats', () => {
    expect(seatSummary(3, [], START)).toEqual({ used: 3, total: 0, over: false, noLicense: true, percent: 0 });
    const summary = seatSummary(25, [licenseOf({ id: 'a' }), licenseOf({ id: 'b', status: 'suspended' })], START);
    expect(summary).toEqual({ used: 25, total: 20, over: true, noLicense: false, percent: 100 });
    expect(seatSummary(5, [licenseOf({ id: 'a' })], START).percent).toBe(25);
  });

  it('sorts the school choices by name', () => {
    const choices = schoolChoices(
      [school({ id: 'b', name: 'Zed' }), school({ id: 'a', name: 'école', status: 'suspended' })],
      'fr',
    );
    expect(choices).toEqual([
      { id: 'a', name: 'école', suspended: true },
      { id: 'b', name: 'Zed', suspended: false },
    ]);
  });
});

describe('user-model', () => {
  it('parses roles and knows the school rule', () => {
    expect(parseRole('student', ROLE_TABS, 'teacher')).toBe('student');
    expect(parseRole('bogus', ROLE_TABS, 'teacher')).toBe('teacher');
    expect(parseRole(undefined, ROLE_TABS, 'teacher')).toBe('teacher');
    expect(schoolRule('school_admin')).toBe('required');
    expect(schoolRule('platform_admin')).toBe('none');
    expect(schoolRule('student')).toBe('optional');
  });

  it('builds the payload and detects an unchanged choice', () => {
    expect(roleChangePayload('u1', { role: 'platform_admin', schoolId: 's1' })).toEqual({
      uid: 'u1',
      role: 'platform_admin',
      schoolId: null,
    });
    const user = profile({ id: 'u1', role: 'teacher', schoolId: 's1' });
    expect(isRoleUnchanged(user, { role: 'teacher', schoolId: 's1' })).toBe(true);
    expect(isRoleUnchanged(user, { role: 'teacher', schoolId: null })).toBe(false);
    expect(isRoleUnchanged(profile({ id: 'p', role: 'platform_admin' }), { role: 'platform_admin', schoolId: 's1' })).toBe(true);
  });

  it('lists the effects of a role change', () => {
    expect(roleChangeEffects(profile({ id: 'a', role: 'student', classIds: ['c1', 'c2'] }), { role: 'teacher', schoolId: null })).toEqual(['signOut', 'leaveClasses']);
    expect(roleChangeEffects(profile({ id: 'b', role: 'teacher', verifiedEducator: true }), { role: 'school_admin', schoolId: 'x' })).toEqual(['signOut', 'loseVerification', 'schoolAdmin']);
    expect(roleChangeEffects(profile({ id: 'c', role: 'teacher', schoolId: 'x' }), { role: 'teacher', schoolId: null })).toEqual(['signOut', 'leaveSchool']);
    expect(roleChangeEffects(profile({ id: 'd', role: 'student' }), { role: 'student', schoolId: 'x' })).toEqual(['signOut', 'joinSchool']);
    expect(roleChangeEffects(profile({ id: 'e', role: 'teacher', schoolId: 'x' }), { role: 'platform_admin', schoolId: 'x' })).toEqual(['signOut', 'fullAccess', 'leaveSchool']);
    expect(roleChangeEffects(profile({ id: 'f', role: 'teacher' }), { role: 'teacher', schoolId: null })).toEqual([]);
  });

  it('gives each row its controls, none for the viewer', () => {
    expect(userRowPermissions(profile({ id: 'me', role: 'platform_admin' }), 'me')).toEqual({ self: true, changeRole: false, status: null, verify: null });
    expect(userRowPermissions(profile({ id: 't', role: 'teacher', verifiedEducator: true }), 'me')).toEqual({ self: false, changeRole: true, status: 'disable', verify: 'unverify' });
    expect(userRowPermissions(profile({ id: 's', role: 'student' }), 'me').verify).toBeNull();
    expect(userRowPermissions(profile({ id: 'd', role: 'teacher', status: 'disabled' }), 'me')).toEqual({ self: false, changeRole: true, status: 'enable', verify: 'verify' });
  });

  it('knows the identifier and the learner links', () => {
    expect(signInIdentifier({ email: 'a@b.c', username: null })).toEqual({ kind: 'email', value: 'a@b.c' });
    expect(signInIdentifier({ email: null, username: 'lea.demo' })).toEqual({ kind: 'username', value: 'lea.demo' });
    expect(signInIdentifier({ email: null, username: null })).toEqual({ kind: 'none', value: null });
    expect(hasLearnerLinks('student')).toBe(true);
    expect(hasLearnerLinks('teacher')).toBe(true);
    expect(hasLearnerLinks('school_admin')).toBe(false);
  });

  it('offers staff roles to adult email accounts only', () => {
    expect(staffRolesAllowed({ ageBand: 'adult', email: 'a@b.c' })).toBe(true);
    expect(staffRolesAllowed({ ageBand: 'adult', email: null })).toBe(false);
    expect(staffRolesAllowed({ ageBand: '13-15', email: 'a@b.c' })).toBe(false);
    const minor = roleOptions(profile({ id: 'm', role: 'student', ageBand: '13-15' }));
    expect(minor.filter((o) => !o.disabled).map((o) => o.role)).toEqual(['student']);
    const pupilAdmin = roleOptions(profile({ id: 'p', role: 'school_admin', email: null, username: 'x.y' }));
    expect(pupilAdmin.find((o) => o.role === 'school_admin')?.disabled).toBe(false);
    expect(pupilAdmin.find((o) => o.role === 'teacher')?.disabled).toBe(true);
    const adult = roleOptions(profile({ id: 'a', role: 'student', ageBand: 'adult' }));
    expect(adult.every((o) => !o.disabled)).toBe(true);
  });
});

describe('billing-model', () => {
  it('offers the plans of an owner type, keeping a stored one', () => {
    expect(plansFor('school')).toEqual(['school_annual']);
    expect(plansFor('school', 'course_purchase')).toEqual(['school_annual', 'course_purchase']);
    expect(plansFor('user')).toEqual(['individual_monthly', 'individual_yearly', 'course_purchase', 'teacher_training']);
    expect(plansFor('user', 'course_purchase')).toHaveLength(4);
  });

  it('starts an empty subscription and drops courses with the plan', () => {
    const user = emptySubscription({ kind: 'fixed', ownerType: 'user', ownerId: 'u1', name: 'Sue' }, '2026-10-16');
    expect(user).toMatchObject({ ownerType: 'user', ownerId: 'u1', plan: 'individual_monthly', status: 'active', periodStart: '2026-10-16', periodEnd: '2027-10-16', courseIds: [], notes: '' });
    const school = emptySubscription({ kind: 'school' }, '2026-10-16');
    expect(school).toMatchObject({ ownerType: 'school', ownerId: '', plan: 'school_annual' });
    const picked = { ...user, plan: 'course_purchase' as const, courseIds: ['c1'] };
    expect(withPlan(picked, 'individual_yearly').courseIds).toEqual([]);
    expect(withPlan(picked, 'teacher_training').courseIds).toEqual(['c1']);
  });

  it('describes coverage, access and tones', () => {
    expect(subscriptionCoverage({ ownerType: 'school', plan: 'course_purchase', courseIds: ['c1'] })).toEqual({ kind: 'school' });
    expect(subscriptionCoverage({ ownerType: 'user', plan: 'individual_monthly', courseIds: [] })).toEqual({ kind: 'individual' });
    expect(subscriptionCoverage({ ownerType: 'user', plan: 'course_purchase', courseIds: ['c1'] })).toEqual({ kind: 'courses', courseIds: ['c1'] });
    expect(endsSubscriptionAccess('active', 'canceled', 'user')).toBe(true);
    expect(endsSubscriptionAccess('trialing', 'active', 'user')).toBe(false);
    expect(endsSubscriptionAccess('active', 'canceled', 'school')).toBe(false);
    expect(endsSubscriptionAccess(null, 'canceled', 'user')).toBe(false);
    expect(suspendsLicense('active', 'suspended')).toBe(true);
    expect(suspendsLicense('suspended', 'active')).toBe(false);
    expect(suspendsLicense(null, 'suspended')).toBe(false);
    expect(periodEnded({ status: 'active', currentPeriodEnd: END }, END)).toBe(true);
    expect(periodEnded({ status: 'active', currentPeriodEnd: END }, START)).toBe(false);
    expect(periodEnded({ status: 'canceled', currentPeriodEnd: END }, '2028-01-01T00:00:00.000Z')).toBe(false);
    expect(subscriptionTone('trialing')).toBe('accent');
    expect(subscriptionTone('past_due')).toBe('warning');
    expect(subscriptionTone('expired')).toBe('neutral');
  });

  it('builds a subscription payload the schema accepts', () => {
    const values = {
      ...emptySubscription({ kind: 'fixed', ownerType: 'user', ownerId: 'u1', name: 'Sue' }, '2026-10-16'),
      plan: 'course_purchase' as const,
      courseIds: ['my-first-ai-adventure'],
      notes: '  paid by card  ',
    };
    const payload = subscriptionPayload(values, 'Asia/Beirut');
    expect(payload).toEqual({
      ownerType: 'user',
      ownerId: 'u1',
      plan: 'course_purchase',
      status: 'active',
      currentPeriodStart: '2026-10-15T21:00:00.000Z',
      currentPeriodEnd: '2027-10-15T21:00:00.000Z',
      courseIds: ['my-first-ai-adventure'],
      notes: 'paid by card',
    });
    expect(parseInput(subscriptionInputSchema, payload).success).toBe(true);
    expect(subscriptionPayload({ ...values, plan: 'individual_yearly', notes: '' }, 'UTC')).toMatchObject({ courseIds: [], notes: null });
    const bad = subscriptionPayload({ ...values, periodEnd: 'nope' }, 'UTC');
    expect(bad.currentPeriodEnd).toBe('');
    const parsed = parseInput(subscriptionInputSchema, bad);
    expect(parsed.success ? null : parsed.fieldErrors.currentPeriodEnd).toEqual(['invalid_date']);
    const stored = subscriptionValues(subscriptionOf({ id: 's', notes: 'n', courseIds: ['c1'] }), 'UTC');
    expect(stored).toMatchObject({ periodStart: '2026-10-01', periodEnd: '2027-10-01', notes: 'n', courseIds: ['c1'] });
  });

  it('builds a licence payload the schema accepts and round-trips a licence', () => {
    const empty = emptyLicense('school-a', '2026-10-16');
    expect(empty).toMatchObject({ schoolId: 'school-a', name: '', seatsTotal: '', scopeType: 'all_official', startsOn: '2026-10-16', endsOn: '2027-10-16', status: 'active', subscriptionId: '' });
    expect(licensePayload(empty, 'UTC').seatsTotal).toBeNaN();
    const filled = { ...empty, name: 'Year', seatsTotal: '25', scopeType: 'pathways' as const, pathwayIds: ['ai-explorer'], subscriptionId: 'sub-1' };
    const payload = licensePayload(filled, 'UTC');
    expect(payload).toEqual({
      schoolId: 'school-a',
      subscriptionId: 'sub-1',
      name: 'Year',
      seatsTotal: 25,
      scope: { type: 'pathways', pathwayIds: ['ai-explorer'] },
      startsAt: '2026-10-16T00:00:00.000Z',
      endsAt: '2027-10-16T00:00:00.000Z',
      status: 'active',
    });
    expect(parseInput(licenseInputSchema, payload).success).toBe(true);
    expect(licensePayload({ ...filled, subscriptionId: '' }, 'UTC').subscriptionId).toBeNull();
    const license = licenseOf({ id: 'l', startsAt: '2026-10-15T21:00:00.000Z', endsAt: '2027-10-15T21:00:00.000Z', scope: { type: 'pathways', pathwayIds: ['a', 'b'] }, subscriptionId: 'sub-1' });
    const values = licenseValues(license, 'Asia/Beirut');
    expect(values).toMatchObject({ startsOn: '2026-10-16', endsOn: '2027-10-16', scopeType: 'pathways', pathwayIds: ['a', 'b'], subscriptionId: 'sub-1', seatsTotal: '20' });
    expect(licensePayload(values, 'Asia/Beirut')).toEqual({
      schoolId: license.schoolId,
      subscriptionId: 'sub-1',
      name: license.name,
      seatsTotal: 20,
      scope: { type: 'pathways', pathwayIds: ['a', 'b'] },
      startsAt: license.startsAt,
      endsAt: license.endsAt,
      status: 'active',
    });
  });
});

describe('challenge-model', () => {
  const NOW = '2026-10-16T12:34:56.000Z';

  it('starts a new challenge at the next full hour for a week', () => {
    const values = emptyChallenge(NOW, 'UTC', 'fr');
    expect(values.startAt).toBe('2026-10-16T13:00');
    expect(values.deadlineAt).toBe('2026-10-23T13:00');
    expect(values.xpReward).toBe('500');
    expect(rubricTotal(values)).toBe(100);
    expect(Object.keys(values.translations).sort()).toEqual(['en', 'fr']);
    expect(values.defaultLocale).toBe('fr');
    expect(values).toMatchObject({ type: 'weekly', scope: 'global', area: 'ai', allowedSubmissionTypes: ['text'], coverImageFileId: null });
    expect(emptyChallenge(NOW, 'Asia/Beirut', 'en').startAt).toBe('2026-10-16T16:00');
  });

  it('builds the payload the schema checks', () => {
    const base = emptyChallenge(NOW, 'UTC', 'en');
    base.translations.en = { title: ' Poster ', description: 'Make one', submissionRequirements: 'An image', prizes: '' };
    const payload = challengePayload(base, 'UTC');
    expect(payload.translations).toEqual({
      en: { title: 'Poster', description: 'Make one', submissionRequirements: 'An image', prizes: null },
    });
    expect(payload.rubric).toEqual([
      { key: 'creativity', weight: 25 },
      { key: 'technicalQuality', weight: 25 },
      { key: 'understanding', weight: 25 },
      { key: 'responsibleAi', weight: 25 },
    ]);
    expect(payload.schoolId).toBeNull();
    expect(parseInput(challengeInputSchema, payload).success).toBe(true);

    const noXp = parseInput(challengeInputSchema, challengePayload({ ...base, xpReward: '' }, 'UTC'));
    expect(noXp.success ? null : noXp.fieldErrors.xpReward).toEqual(['invalid_number']);

    const blankWeight = { ...base, rubric: { ...base.rubric, understanding: { enabled: true, weight: '' } } };
    const weight = parseInput(challengeInputSchema, challengePayload(blankWeight, 'UTC'));
    expect(weight.success ? null : weight.fieldErrors['rubric.2.weight']).toEqual(['invalid_number']);

    const blankDefault = parseInput(challengeInputSchema, challengePayload(emptyChallenge(NOW, 'UTC', 'en'), 'UTC'));
    expect(blankDefault.success ? null : blankDefault.fieldErrors['translations.en.title']).toEqual(['default_locale_required']);

    const scoped = parseInput(challengeInputSchema, challengePayload({ ...base, scope: 'school', schoolId: '' }, 'UTC'));
    expect(scoped.success ? null : scoped.fieldErrors.schoolId).toEqual(['required']);
    expect(challengePayload({ ...base, scope: 'global', schoolId: 'school-a' }, 'UTC').schoolId).toBeNull();
    expect(challengePayload({ ...base, scope: 'school', schoolId: 'school-a' }, 'UTC').schoolId).toBe('school-a');

    const order = { ...base, rubric: { creativity: { enabled: false, weight: '' }, technicalQuality: { enabled: true, weight: '40' }, understanding: { enabled: true, weight: '60' }, responsibleAi: { enabled: false, weight: '10' } } };
    expect(challengePayload(order, 'UTC').rubric).toEqual([
      { key: 'technicalQuality', weight: 40 },
      { key: 'understanding', weight: 60 },
    ]);
    expect(rubricTotal(order)).toBe(100);
    expect(rubricTotal({ rubric: { ...order.rubric, understanding: { enabled: true, weight: '' } } })).toBe(40);
  });

  it('round-trips a stored challenge', () => {
    const stored = challenge({
      id: 'c1',
      ageMin: 10,
      ageMax: 14,
      translations: {
        en: { title: 'Poster', description: 'Make one', submissionRequirements: 'An image', prizes: 'Fame' },
        fr: { title: 'Affiche', description: 'Fais-en une', submissionRequirements: 'Une image', prizes: null },
      },
    });
    const values = challengeValues(stored, 'Asia/Beirut');
    expect(values.rubric.creativity).toEqual({ enabled: true, weight: '50' });
    expect(values.rubric.technicalQuality).toEqual({ enabled: false, weight: '' });
    expect(values.translations.fr?.prizes).toBe('');
    expect(values.ageMin).toBe('10');
    const payload = challengePayload(values, 'Asia/Beirut');
    expect(payload).toEqual({
      type: stored.type,
      scope: stored.scope,
      schoolId: null,
      area: stored.area,
      ageMin: 10,
      ageMax: 14,
      startAt: stored.startAt,
      deadlineAt: stored.deadlineAt,
      allowedSubmissionTypes: stored.allowedSubmissionTypes,
      rubric: stored.rubric,
      xpReward: stored.xpReward,
      coverImageFileId: null,
      hardwarePlatformIds: [],
      requiredCapabilities: [],
      defaultLocale: 'en',
      translations: stored.translations,
    });
  });

  it('knows the transitions and where the focus goes', () => {
    expect(challengeTransitions('draft')).toEqual(['publish', 'archive']);
    expect(challengeTransitions('published')).toEqual(['unpublish', 'archive']);
    expect(challengeTransitions('archived')).toEqual(['restore']);
    expect(transitionTarget('publish')).toBe('published');
    expect(transitionTarget('unpublish')).toBe('draft');
    expect(transitionTarget('restore')).toBe('draft');
    expect(transitionTarget('archive')).toBe('archived');
    expect(transitionNeedsConfirm('restore')).toBe(false);
    expect(transitionNeedsConfirm('archive')).toBe(true);
    expect(focusAfterTransition('all', 'publish', 'row')).toBe('row');
    expect(focusAfterTransition('draft', 'publish', 'row')).toBe(MAIN_CONTENT_ID);
    expect(focusAfterTransition('archived', 'restore', 'row')).toBe(MAIN_CONTENT_ID);
    expect(focusAfterTransition('published', 'publish', 'row')).toBe('row');
  });

  it('filters, titles and claims paths', () => {
    expect(parseStatusFilter('draft')).toBe('draft');
    expect(parseStatusFilter('open')).toBe('all');
    const all = [challenge({ id: 'a', status: 'draft' }), challenge({ id: 'b', status: 'published' })];
    expect(filterChallenges(all, 'draft').map((c) => c.id)).toEqual(['a']);
    expect(filterChallenges(all, 'all')).toHaveLength(2);
    expect(challengeTitle(challenge({ id: 'c' }), 'fr')).toBe('Challenge c');
    expect(challengeTitle({ defaultLocale: 'en', translations: { en: { title: '  ', description: '', submissionRequirements: '', prizes: null } } }, 'en')).toBeNull();
    expect(firstErrorLocale(['rubric', 'translations.fr.title'])).toBe('fr');
    expect(firstErrorLocale(['rubric'])).toBeNull();
    expect(claimsChallengePath('rubric.1.weight')).toBe(true);
    expect(claimsChallengePath('translations.en.title')).toBe(true);
    expect(claimsChallengePath('translations')).toBe(false);
    expect(claimsChallengePath('_form')).toBe(false);
    expect(claimsChallengePath('hardwarePlatformIds')).toBe(true);
  });
});
