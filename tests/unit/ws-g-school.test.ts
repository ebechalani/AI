import { describe, expect, it } from 'vitest';
import {
  classTeacherNames,
  classTeachers,
  ownerOptions,
  splitClasses,
  teacherPicker,
  teachersPayload,
  toggleTeacher,
} from '@/components/school/class-admin-model';
import {
  classesWithCourse,
  firstLessonId,
  groupLessons,
  isAssignable,
  isAssignableSchoolCourse,
  splitCatalog,
  usageByCourse,
} from '@/components/school/course-admin-model';
import { MAX_TRAIL, pagedHref, pageLinks, parsePaging } from '@/components/school/paging';
import {
  certificatePath,
  firstParam,
  invitePath,
  previewLessonPath,
  SCHOOL_PATHS,
  schoolAssignPath,
  schoolClassPath,
  schoolCoursePath,
} from '@/components/school/paths';
import {
  activeClassesOf,
  canSendPasswordEmail,
  classIndex,
  classRefsFor,
  studentActions,
  teacherStatusAction,
} from '@/components/school/people-model';
import {
  completionRate,
  countsTowardSeats,
  currentLicense,
  daysUntil,
  DEFAULT_DAILY_MESSAGES,
  featuresPayload,
  featuresValues,
  isExpiringSoon,
  licenseState,
  onboardingSteps,
  profilePayload,
  regionName,
  requireSchoolId,
  seatSummary,
  seatSummaryFromLicenses,
} from '@/components/school/school-model';
import { parseInput } from '@/lib/schemas/common';
import { updateSchoolSettingsInputSchema } from '@/lib/schemas/school';
import type { CourseUsageRow } from '@/types/analytics';
import type { License } from '@/types/billing';
import type { Module, Pathway } from '@/types/content';
import { course, lesson, NOW, profile, schoolClass } from './services-fixtures';

// The pure models of the school admin's area (SPEC-G section 5): URLs, cursor paging, licences
// and seats, the dashboard's numbers, the settings payloads, who may do what on the people lists,
// the class teachers picker and the catalog as the admin sees it.

const DAY = 24 * 60 * 60 * 1000;
const now = new Date(NOW);
const inDays = (days: number, minusMinutes = 0) =>
  new Date(now.getTime() + days * DAY - minusMinutes * 60_000).toISOString();

function license(fields: Partial<License> & { id: string }): License {
  return {
    schoolId: 'school-a',
    subscriptionId: null,
    name: `Licence ${fields.id}`,
    seatsTotal: 10,
    scope: { type: 'all_official' },
    startsAt: inDays(-30),
    endsAt: inDays(300),
    status: 'active',
    createdByUid: 'root',
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

// The fixture's three shapes: the active one counts, the expired and the suspended ones do not.
const annual = license({ id: 'annual', seatsTotal: 3, endsAt: inDays(20) });
const old = license({ id: 'old', seatsTotal: 10, startsAt: inDays(-400), endsAt: inDays(-35) });
const suspended = license({
  id: 'paths',
  seatsTotal: 2,
  status: 'suspended',
  scope: { type: 'pathways', pathwayIds: ['ai-explorer', 'ai-robotics'] },
});

describe('paths', () => {
  it('builds every school URL', () => {
    expect(SCHOOL_PATHS.dashboard).toBe('/school');
    expect(schoolClassPath('c1')).toBe('/school/classes/c1');
    expect(schoolAssignPath('c1')).toBe('/school/classes/c1/assign');
    expect(schoolCoursePath('my-first-ai-adventure')).toBe('/school/courses/my-first-ai-adventure');
    expect(previewLessonPath('c', 'm1-l1')).toBe('/preview/c/lessons/m1-l1');
    expect(certificatePath('demo-lea_my-first-ai-adventure')).toBe(
      '/certificates/demo-lea_my-first-ai-adventure',
    );
  });

  it('builds the invite link from the localized join path', () => {
    expect(invitePath('/fr/join', 'RBHDEM23')).toBe('/fr/join?code=RBHDEM23');
    expect(invitePath('/en/join', 'A&B')).toBe('/en/join?code=A%26B');
  });

  it('takes the first value of a repeated search parameter', () => {
    expect(firstParam('a')).toBe('a');
    expect(firstParam(['a', 'b'])).toBe('a');
    expect(firstParam(undefined)).toBeUndefined();
  });
});

describe('paging', () => {
  const PATH = '/school/teachers';
  const twenty = Array.from({ length: MAX_TRAIL }, (_, index) => `c${index + 1}`);

  it('parses page 1 without a cursor, whatever the trail and the page say', () => {
    expect(parsePaging()).toEqual({ cursor: null, trail: [], page: null });
    expect(parsePaging(undefined, 'c1.c2', '3')).toEqual({ cursor: null, trail: [], page: null });
    expect(parsePaging('not a cursor!')).toEqual({ cursor: null, trail: [], page: null });
  });

  it('accepts a certificate id as a cursor', () => {
    expect(parsePaging('demo-lea_my-first-ai-adventure')).toEqual({
      cursor: 'demo-lea_my-first-ai-adventure',
      trail: [],
      page: null,
    });
  });

  it('drops a trail with a bad id or too many entries, and a malformed page number', () => {
    expect(parsePaging('c3', 'c1.bad id', '3')).toEqual({ cursor: 'c3', trail: [], page: 3 });
    expect(parsePaging('c22', [...twenty, 'c21'].join('.'), '23').trail).toEqual([]);
    expect(parsePaging('c3', 'c1.c2', '3')).toEqual({ cursor: 'c3', trail: ['c1', 'c2'], page: 3 });
    expect(parsePaging('c3', 'c1', '0').page).toBeNull();
    expect(parsePaging('c3', 'c1', '01').page).toBeNull();
    expect(parsePaging('c3', 'c1', '1234567').page).toBeNull();
    expect(parsePaging('c3', '', '2')).toEqual({ cursor: 'c3', trail: [], page: 2 });
  });

  it('links page 1 to page 2 only', () => {
    expect(pageLinks(PATH, parsePaging(), 'c1')).toEqual({
      previousHref: null,
      nextHref: `${PATH}?cursor=c1&page=2`,
      page: 1,
    });
    expect(pageLinks(PATH, parsePaging(), null)).toEqual({
      previousHref: null,
      nextHref: null,
      page: 1,
    });
  });

  it('links page 3 back to page 2 and forward to page 4 with the trail', () => {
    expect(pageLinks(PATH, { cursor: 'c2', trail: ['c1'], page: 3 }, 'c3')).toEqual({
      previousHref: `${PATH}?cursor=c1&page=2`,
      nextHref: `${PATH}?cursor=c3&page=4&trail=c1.c2`,
      page: 3,
    });
    // A page number below what the trail proves is replaced by the trail's.
    expect(pageLinks(PATH, { cursor: 'c2', trail: ['c1'], page: 1 }, null).page).toBe(3);
  });

  it('keeps the trail at 20 cursors and forgets the page number once it was cut', () => {
    const links = pageLinks(PATH, { cursor: 'c21', trail: twenty, page: 22 }, 'c22');
    const next = new URL(links.nextHref!, 'http://x');
    expect(next.searchParams.get('trail')!.split('.')).toEqual([...twenty.slice(1), 'c21']);
    expect(next.searchParams.get('page')).toBe('23');
    expect(links.page).toBe(22);
    // Without a carried number, a full trail may have been cut: the page is unknown.
    expect(pageLinks(PATH, { cursor: 'c21', trail: twenty, page: null }, null).page).toBeUndefined();
  });

  it('leaves empty parts out of a href', () => {
    expect(pagedHref(PATH, { cursor: null, trail: [], page: null })).toBe(PATH);
    expect(pagedHref(PATH, { cursor: 'c1', trail: [], page: null })).toBe(`${PATH}?cursor=c1`);
    expect(pagedHref(PATH, { cursor: 'c1', trail: [], page: 1 })).toBe(`${PATH}?cursor=c1`);
    expect(pagedHref(PATH, { cursor: 'c2', trail: ['c1'], page: 3 })).toBe(
      `${PATH}?cursor=c2&page=3&trail=c1`,
    );
  });
});

describe('school-model: session and licences', () => {
  it('requires the admin’s school', () => {
    expect(requireSchoolId({ schoolId: 'school-a' })).toBe('school-a');
    expect(() => requireSchoolId({ schoolId: null })).toThrow();
  });

  it('derives the licence state at its boundaries', () => {
    const l = license({ id: 'l', startsAt: inDays(0), endsAt: inDays(30) });
    expect(licenseState(l, now)).toBe('active');
    expect(licenseState(l, inDays(30))).toBe('expired');
    expect(licenseState(l, inDays(31))).toBe('expired');
    expect(licenseState(l, inDays(-1))).toBe('upcoming');
    expect(licenseState({ ...l, status: 'suspended' }, now)).toBe('suspended');
    expect(licenseState({ ...l, status: 'suspended' }, inDays(40))).toBe('suspended');
    expect(licenseState({ ...l, status: 'suspended' }, inDays(-5))).toBe('suspended');
  });

  it('counts the seats of active licences that have not ended, upcoming ones included', () => {
    expect(countsTowardSeats(annual, now)).toBe(true);
    expect(countsTowardSeats(license({ id: 'u', startsAt: inDays(5), endsAt: inDays(50) }), now)).toBe(
      true,
    );
    expect(countsTowardSeats(old, now)).toBe(false);
    expect(countsTowardSeats(suspended, now)).toBe(false);
  });

  it('counts whole days up to the end, rounded up', () => {
    expect(daysUntil(inDays(20, 1), now)).toBe(20);
    expect(daysUntil(inDays(20), now)).toBe(20);
    // A date just passed rounds up to zero (as -0, which a plural prints as "0").
    expect(daysUntil(inDays(0, 1), now) + 0).toBe(0);
    expect(daysUntil(inDays(-35), now)).toBe(-35);
  });

  it('warns 30 days before an active licence ends', () => {
    expect(isExpiringSoon(license({ id: 'a', endsAt: inDays(30) }), now)).toBe(true);
    expect(isExpiringSoon(license({ id: 'b', endsAt: inDays(31) }), now)).toBe(false);
    expect(isExpiringSoon(old, now)).toBe(false);
    expect(
      isExpiringSoon(license({ id: 'c', startsAt: inDays(5), endsAt: inDays(20) }), now),
    ).toBe(false);
  });

  it('picks the active licence that ends last', () => {
    const later = license({ id: 'later', endsAt: inDays(200) });
    expect(currentLicense([annual, old, later, suspended], now)).toBe(later);
    expect(currentLicense([old, suspended], now)).toBeNull();
    expect(currentLicense([], now)).toBeNull();
  });

  it('summarises the seats', () => {
    expect(seatSummary(5, 3)).toEqual({ used: 5, total: 3, over: true, noLicense: false, percent: 100 });
    expect(seatSummary(3, 0)).toEqual({ used: 3, total: 0, over: false, noLicense: true, percent: 0 });
    expect(seatSummary(3, 100)).toEqual({ used: 3, total: 100, over: false, noLicense: false, percent: 3 });
    expect(seatSummaryFromLicenses(3, [annual, old, suspended], now)).toEqual(seatSummary(3, 3));
  });
});

describe('school-model: dashboard and settings', () => {
  it('shows no completion rate without an enrollment', () => {
    expect(completionRate({ enrollments: 0, completionRatePercent: 0 })).toBeNull();
    expect(completionRate({ enrollments: 6, completionRatePercent: 17 })).toBe(17);
  });

  it('lists the onboarding steps in order', () => {
    expect(onboardingSteps({ teachers: 0, classes: 0 })).toEqual(['teachers', 'classes']);
    expect(onboardingSteps({ teachers: 1, classes: 0 })).toEqual(['classes']);
    expect(onboardingSteps({ teachers: 0, classes: 1 })).toEqual(['teachers']);
    expect(onboardingSteps({ teachers: 1, classes: 1 })).toEqual([]);
  });

  it('builds the profile payload with a null city for a blank one, untrimmed otherwise', () => {
    expect(profilePayload({ name: ' Demo ', city: '  ', defaultLocale: 'en' })).toEqual({
      name: ' Demo ',
      city: null,
      defaultLocale: 'en',
    });
    expect(profilePayload({ name: 'Demo', city: ' Beirut ', defaultLocale: 'fr' }).city).toBe(
      ' Beirut ',
    );
  });

  it('builds the features payload for the schema to judge', () => {
    const base = { aiEnabled: true, joinCodesEnabled: false };
    expect(featuresPayload({ ...base, aiDailyMessageLimit: '' })).toEqual({
      settings: { aiEnabled: true, aiDailyMessageLimit: null, joinCodesEnabled: false },
    });
    expect(featuresPayload({ ...base, aiDailyMessageLimit: ' 30 ' }).settings.aiDailyMessageLimit).toBe(
      30,
    );
    expect(featuresPayload({ ...base, aiDailyMessageLimit: 'abc' }).settings.aiDailyMessageLimit).toBeNaN();
    const key = (text: string) => {
      const parsed = parseInput(
        updateSchoolSettingsInputSchema,
        featuresPayload({ ...base, aiDailyMessageLimit: text }),
      );
      return parsed.success ? 'ok' : parsed.fieldErrors['settings.aiDailyMessageLimit']?.[0];
    };
    expect(key('abc')).toBe('invalid_number');
    expect(key('2.5')).toBe('invalid_integer');
    expect(key('500')).toBe('too_big');
    expect(key('0')).toBe('too_small');
    expect(key('')).toBe('ok');
    expect(key(' 30 ')).toBe('ok');
  });

  it('reads the form values back from the settings', () => {
    expect(
      featuresValues({ aiEnabled: false, aiDailyMessageLimit: null, joinCodesEnabled: true }),
    ).toEqual({ aiEnabled: false, aiDailyMessageLimit: '', joinCodesEnabled: true });
    expect(
      featuresValues({ aiEnabled: true, aiDailyMessageLimit: 30, joinCodesEnabled: true })
        .aiDailyMessageLimit,
    ).toBe('30');
    expect(DEFAULT_DAILY_MESSAGES).toBe(60);
  });

  it('names a country in the page’s language and keeps a code Intl refuses', () => {
    expect(regionName('LB', 'en')).toBe('Lebanon');
    expect(regionName('LB', 'fr')).toBe('Liban');
    expect(regionName('??', 'en')).toBe('??');
  });
});

describe('people-model', () => {
  it('offers disable or enable on a teacher', () => {
    expect(teacherStatusAction({ status: 'active' })).toBe('disable');
    expect(teacherStatusAction({ status: 'disabled' })).toBe('enable');
  });

  it('offers the right actions on a student', () => {
    expect(studentActions({ status: 'active', username: 'lea.demo' })).toEqual({
      status: 'disable',
      resetPassword: true,
    });
    expect(studentActions({ status: 'disabled', username: 'lea.demo' })).toEqual({
      status: 'enable',
      resetPassword: true,
    });
    expect(studentActions({ status: 'active', username: null })).toEqual({
      status: null,
      resetPassword: false,
    });
    expect(studentActions({ status: 'disabled', username: null })).toEqual({
      status: 'enable',
      resetPassword: false,
    });
  });

  it('sends a password email only to an active teacher with an address', () => {
    expect(canSendPasswordEmail({ status: 'active', email: 'a@b.test' })).toBe(true);
    expect(canSendPasswordEmail({ status: 'disabled', email: 'a@b.test' })).toBe(false);
    expect(canSendPasswordEmail({ status: 'active', email: null })).toBe(false);
    expect(canSendPasswordEmail({ status: 'active', email: '' })).toBe(false);
  });

  const classes = [
    schoolClass({ id: 'a', name: 'Zeta', teacherUids: ['t1', 't2'] }),
    schoolClass({ id: 'b', name: 'Alpha', archived: true, teacherUids: ['t2'] }),
    schoolClass({ id: 'c', name: 'Beta', teacherUids: ['t2'] }),
    schoolClass({ id: 'd', name: 'Gamma', teacherUids: ['t1'] }),
  ];

  it('lists a person’s classes, active first, by name, each once, unknown ones dropped', () => {
    const index = classIndex(classes);
    expect(index.get('b')).toEqual({ id: 'b', name: 'Alpha', archived: true });
    expect(classRefsFor(['b', 'a', 'c', 'a', 'unknown'], index).map((ref) => ref.name)).toEqual([
      'Beta',
      'Zeta',
      'Alpha',
    ]);
    expect(classRefsFor([], index)).toEqual([]);
  });

  it('lists the active classes a teacher teaches', () => {
    expect(activeClassesOf('t2', classes).map((ref) => ref.name)).toEqual(['Beta', 'Zeta']);
    expect(activeClassesOf('t1', classes).map((ref) => ref.name)).toEqual(['Gamma', 'Zeta']);
    expect(activeClassesOf('nobody', classes)).toEqual([]);
  });
});

describe('class-admin-model', () => {
  const tara = profile({ id: 'tara', role: 'teacher', displayName: 'Tara Teacher' });
  const theo = profile({ id: 'theo', role: 'teacher', displayName: 'Theo Second' });
  const nina = profile({ id: 'nina', role: 'teacher', displayName: 'Nina New' });
  const tina = profile({ id: 'tina', role: 'teacher', displayName: 'Tina Gone', status: 'disabled' });
  const teachers = [theo, tina, nina, tara];
  const index = new Map(teachers.map((teacher) => [teacher.id, teacher]));

  it('splits the active and the archived classes', () => {
    const active = schoolClass({ id: 'a' });
    const archived = schoolClass({ id: 'b', archived: true });
    expect(splitClasses([archived, active])).toEqual({ active: [active], archived: [archived] });
  });

  it('offers the active teachers by name as owners', () => {
    expect(ownerOptions(teachers)).toEqual([
      { value: 'nina', label: 'Nina New' },
      { value: 'tara', label: 'Tara Teacher' },
      { value: 'theo', label: 'Theo Second' },
    ]);
  });

  it('lists a class’s teachers: owner first, by name, former teachers last', () => {
    const cls = { ownerUid: 'tara', teacherUids: ['tara', 'theo', 'ghost', 'tina'] };
    expect(classTeachers(cls, index)).toEqual([
      { uid: 'tara', name: 'Tara Teacher', owner: true, disabled: false },
      { uid: 'theo', name: 'Theo Second', owner: false, disabled: false },
      { uid: 'tina', name: 'Tina Gone', owner: false, disabled: true },
      { uid: 'ghost', name: null, owner: false, disabled: false },
    ]);
    expect(classTeacherNames(cls, index)).toEqual(['Tara Teacher', 'Theo Second', 'Tina Gone']);
  });

  it('builds the picker: active teachers, the owner locked, disabled and unknown ones dropped', () => {
    const picker = teacherPicker({ ownerUid: 'tara', teacherUids: ['tara', 'tina', 'ghost'] }, teachers);
    expect(picker.options).toEqual([
      { uid: 'tara', name: 'Tara Teacher', checked: true, locked: true },
      { uid: 'nina', name: 'Nina New', checked: false, locked: false },
      { uid: 'theo', name: 'Theo Second', checked: false, locked: false },
    ]);
    expect(picker.initial).toEqual(['tara']);
    expect(picker.dropped).toEqual(['Tina Gone', null]);
    expect(picker.ownerDisabled).toBe(false);
    expect(picker.max).toBe(5);
  });

  it('checks the current active co-teachers', () => {
    const picker = teacherPicker({ ownerUid: 'tara', teacherUids: ['tara', 'theo'] }, teachers);
    expect(picker.initial).toEqual(['tara', 'theo']);
    expect(picker.options.find((option) => option.uid === 'theo')?.checked).toBe(true);
    expect(picker.dropped).toEqual([]);
  });

  it('flags a disabled or missing owner and never lists the owner as dropped', () => {
    const disabledOwner = teacherPicker({ ownerUid: 'tina', teacherUids: ['tina', 'theo'] }, teachers);
    expect(disabledOwner.ownerDisabled).toBe(true);
    expect(disabledOwner.dropped).toEqual([]);
    expect(disabledOwner.options.map((option) => option.uid)).toEqual(['nina', 'tara', 'theo']);
    const missingOwner = teacherPicker({ ownerUid: 'ghost', teacherUids: ['ghost'] }, teachers);
    expect(missingOwner.ownerDisabled).toBe(true);
    expect(missingOwner.dropped).toEqual([]);
    expect(missingOwner.initial).toEqual([]);
  });

  it('toggles a teacher without unchecking the owner or exceeding the limit', () => {
    expect(toggleTeacher(['tara', 'theo'], 'tara', 'tara', 5)).toEqual(['tara', 'theo']);
    expect(toggleTeacher(['tara', 'theo'], 'theo', 'tara', 5)).toEqual(['tara']);
    expect(toggleTeacher(['tara'], 'nina', 'tara', 5)).toEqual(['tara', 'nina']);
    expect(toggleTeacher(['a', 'b', 'c', 'd', 'e'], 'f', 'a', 5)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('puts the owner first in the payload, each uid once', () => {
    expect(teachersPayload(['theo', 'tara', 'theo'], 'tara')).toEqual(['tara', 'theo']);
    expect(teachersPayload([], 'tara')).toEqual(['tara']);
  });
});

describe('course-admin-model', () => {
  function pathway(fields: Partial<Pathway> & { id: string }): Pathway {
    return {
      order: 1,
      audience: 'student',
      kind: 'core',
      ageMin: null,
      ageMax: null,
      icon: 'Sparkles',
      accent: 'violet',
      status: 'published',
      publishedCourseCount: 1,
      defaultLocale: 'en',
      translations: { en: { title: fields.id, tagline: '', description: '', topics: [] } },
      createdAt: NOW,
      updatedAt: NOW,
      ...fields,
    };
  }

  function module(fields: Partial<Module> & { id: string }): Module {
    return {
      courseId: 'c',
      order: 0,
      lessonCount: 0,
      defaultLocale: 'en',
      translations: { en: { title: fields.id, description: '' } },
      createdAt: NOW,
      updatedAt: NOW,
      ...fields,
    };
  }

  it('splits the catalog by audience, in order, without empty pathways', () => {
    const pathways = [
      pathway({ id: 'teacher-academy', order: 5, audience: 'teacher' }),
      pathway({ id: 'ai-creator', order: 2 }),
      pathway({ id: 'ai-explorer', order: 1 }),
      pathway({ id: 'empty', order: 0, publishedCourseCount: 0 }),
    ];
    const { student, academy } = splitCatalog(pathways);
    expect(student.map((p) => p.id)).toEqual(['ai-explorer', 'ai-creator']);
    expect(academy.map((p) => p.id)).toEqual(['teacher-academy']);
  });

  it('indexes the usage rows by course', () => {
    const row: CourseUsageRow = {
      courseId: 'c1',
      course: course({ id: 'c1' }),
      enrollments: 3,
      completed: 1,
      completionRatePercent: 33,
    };
    expect(usageByCourse([row]).get('c1')).toBe(row);
    expect(usageByCourse([]).size).toBe(0);
  });

  it('offers only published student courses, and shared ones from the school', () => {
    expect(isAssignable({ audience: 'student', status: 'published' })).toBe(true);
    expect(isAssignable({ audience: 'teacher', status: 'published' })).toBe(false);
    expect(isAssignable({ audience: 'student', status: 'draft' })).toBe(false);
    expect(isAssignable({ audience: 'student', status: 'archived' })).toBe(false);
    expect(
      isAssignableSchoolCourse({ audience: 'student', status: 'published', visibility: 'private' }),
    ).toBe(false);
    expect(
      isAssignableSchoolCourse({ audience: 'student', status: 'published', visibility: 'school' }),
    ).toBe(true);
    expect(
      isAssignableSchoolCourse({ audience: 'student', status: 'draft', visibility: 'school' }),
    ).toBe(false);
  });

  it('finds the first lesson', () => {
    expect(firstLessonId({ lessons: [] })).toBeNull();
    expect(
      firstLessonId({ lessons: [lesson({ id: 'm1-l1', courseId: 'c' }), lesson({ id: 'm1-l2', courseId: 'c' })] }),
    ).toBe('m1-l1');
  });

  it('groups the lessons by module in order, orphans last', () => {
    const modules = [module({ id: 'm2', order: 2 }), module({ id: 'm1', order: 1 })];
    const lessons = [
      lesson({ id: 'm2-l1', courseId: 'c', moduleId: 'm2', order: 1 }),
      lesson({ id: 'm1-l2', courseId: 'c', moduleId: 'm1', order: 2 }),
      lesson({ id: 'lost', courseId: 'c', moduleId: 'gone', order: 1 }),
      lesson({ id: 'm1-l1', courseId: 'c', moduleId: 'm1', order: 1 }),
    ];
    const groups = groupLessons(modules, lessons);
    expect(groups.map((group) => group.module?.id ?? null)).toEqual(['m1', 'm2', null]);
    expect(groups.map((group) => group.lessons.map((l) => l.id))).toEqual([
      ['m1-l1', 'm1-l2'],
      ['m2-l1'],
      ['lost'],
    ]);
    expect(groupLessons(modules, [])).toEqual([
      { module: modules[1], lessons: [] },
      { module: modules[0], lessons: [] },
    ]);
  });

  it('lists the active classes that follow a course, by name', () => {
    const classes = [
      schoolClass({ id: 'z', name: 'Zeta', assignedCourseIds: ['c1'] }),
      schoolClass({ id: 'a', name: 'Alpha', assignedCourseIds: ['c1'], archived: true }),
      schoolClass({ id: 'b', name: 'Beta', assignedCourseIds: ['c1', 'c2'] }),
      schoolClass({ id: 'g', name: 'Gamma', assignedCourseIds: ['c2'] }),
    ];
    expect(classesWithCourse(classes, 'c1').map((cls) => cls.name)).toEqual(['Beta', 'Zeta']);
    expect(classesWithCourse(classes, 'c3')).toEqual([]);
  });
});
