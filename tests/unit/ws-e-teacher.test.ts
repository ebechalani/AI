import { describe, expect, it } from 'vitest';
import {
  academyPanelState,
  assignPanelState,
  groupLessonsByModule,
  isAssignable,
  lessonStates,
  progressByCourse,
  resolveCourseTab,
  resumeLesson,
  schoolTabCourses,
  splitPathways,
} from '@/components/teacher/courses-model';
import {
  classNameMap,
  classTotals,
  DASHBOARD_LIMITS,
  firstName,
  splitClasses,
} from '@/components/teacher/dashboard-model';
import type { Module, Pathway } from '@/types';
import { course, enrollment, lesson, NOW, schoolClass } from './services-fixtures';

// The pure models of the teacher dashboard (dashboard-model.ts) and course pages
// (courses-model.ts).

describe('dashboard model', () => {
  const classes = [
    schoolClass({ id: 'a', name: 'A', studentCount: 3, assignedCourseIds: ['k1', 'k2'] }),
    schoolClass({ id: 'b', name: 'B', archived: true, studentCount: 9, assignedCourseIds: ['k9'] }),
    schoolClass({ id: 'c', name: 'C', studentCount: 4, assignedCourseIds: ['k2', 'k3'] }),
  ];

  it('splits active and archived classes, keeping their order', () => {
    const { active, archived } = splitClasses(classes);
    expect(active.map((cls) => cls.id)).toEqual(['a', 'c']);
    expect(archived.map((cls) => cls.id)).toEqual(['b']);
  });

  it('sums the students and counts each course once', () => {
    expect(classTotals(splitClasses(classes).active)).toEqual({
      classes: 2,
      students: 7,
      courses: 3,
    });
    expect(classTotals([])).toEqual({ classes: 0, students: 0, courses: 0 });
  });

  it('names every class, archived ones included', () => {
    expect(classNameMap(classes)).toEqual({ a: 'A', b: 'B', c: 'C' });
  });

  it('greets with the first name', () => {
    expect(firstName('Nadia Demo')).toBe('Nadia');
    expect(firstName('  Sam ')).toBe('Sam');
    expect(firstName('')).toBe('');
  });

  it('shows six classes, five reviews and ten attempts', () => {
    expect(DASHBOARD_LIMITS).toEqual({ classes: 6, pending: 5, attempts: 10 });
  });
});

function pathway(fields: Partial<Pathway> & { id: string }): Pathway {
  return {
    order: 1,
    audience: 'student',
    kind: 'age_band',
    ageMin: null,
    ageMax: null,
    icon: 'Brain',
    accent: 'brand',
    status: 'published',
    publishedCourseCount: 1,
    defaultLocale: 'en',
    translations: { en: { title: fields.id, tagline: '', description: '', topics: [] } },
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  } as Pathway;
}

describe('resolveCourseTab', () => {
  it.each([
    ['academy', true, 'academy'],
    ['mine', false, 'mine'],
    ['school', true, 'school'],
    ['school', false, 'catalog'],
    [undefined, true, 'catalog'],
    ['nope', true, 'catalog'],
  ] as const)('%s (school: %s) → %s', (param, hasSchool, expected) => {
    expect(resolveCourseTab(param, hasSchool)).toBe(expected);
  });
});

describe('splitPathways', () => {
  it('separates the audiences and drops pathways without published courses', () => {
    const { student, academy } = splitPathways([
      pathway({ id: 'ai-creator', order: 2 }),
      pathway({ id: 'ai-explorer', order: 1 }),
      pathway({ id: 'ai-engineer', order: 3, publishedCourseCount: 0 }),
      pathway({ id: 'teacher-academy', order: 7, audience: 'teacher' }),
    ]);
    expect(student.map((p) => p.id)).toEqual(['ai-explorer', 'ai-creator']);
    expect(academy.map((p) => p.id)).toEqual(['teacher-academy']);
  });
});

describe('course lists', () => {
  it('offers on "My school" the published courses of colleagues only', () => {
    const courses = [
      course({ id: 'mine', ownerUid: 'teacher-1' }),
      course({ id: 'draft', ownerUid: 'teacher-2', status: 'draft' }),
      course({ id: 'shared', ownerUid: 'teacher-2' }),
    ];
    expect(schoolTabCourses(courses, 'teacher-1').map((c) => c.id)).toEqual(['shared']);
  });

  it('assigns only published student courses', () => {
    expect(isAssignable({ audience: 'student', status: 'published' })).toBe(true);
    expect(isAssignable({ audience: 'teacher', status: 'published' })).toBe(false);
    expect(isAssignable({ audience: 'student', status: 'draft' })).toBe(false);
    expect(isAssignable({ audience: 'student', status: 'archived' })).toBe(false);
  });

  it('maps each course to its progress', () => {
    expect(
      progressByCourse([
        enrollment({ userUid: 't', courseId: 'k1', progressPercent: 25 }),
        enrollment({ userUid: 't', courseId: 'k2', progressPercent: 100 }),
      ]),
    ).toEqual({ k1: 25, k2: 100 });
  });
});

describe('resume and outline', () => {
  const lessons = ['l1', 'l2', 'l3'].map((id) => lesson({ id, courseId: 'k1' }));
  const progress = (completedLessonIds: string[], lastLessonId: string | null) =>
    enrollment({ userUid: 't', courseId: 'k1', completedLessonIds, lastLessonId });

  it('picks the lesson to open', () => {
    expect(resumeLesson([], null)).toBeNull();
    expect(resumeLesson(lessons, null)).toEqual({ lessonId: 'l1', kind: 'start' });
    expect(resumeLesson(lessons, progress([], null))).toEqual({ lessonId: 'l1', kind: 'start' });
    expect(resumeLesson(lessons, progress(['l1'], 'l2'))).toEqual({
      lessonId: 'l2',
      kind: 'continue',
    });
    expect(resumeLesson(lessons, progress(['l1'], 'l1'))).toEqual({
      lessonId: 'l2',
      kind: 'continue',
    });
    expect(resumeLesson(lessons, progress(['l1', 'l2', 'l3'], 'l3'))).toEqual({
      lessonId: 'l1',
      kind: 'review',
    });
  });

  it('marks completed, resume, next and todo lessons', () => {
    const resumed = progress(['l1'], 'l2');
    expect([...lessonStates(lessons, resumed, resumeLesson(lessons, resumed))]).toEqual([
      ['l1', 'completed'],
      ['l2', 'resume'],
      ['l3', 'todo'],
    ]);
    const fresh = progress(['l1'], 'l1');
    expect(lessonStates(lessons, fresh, resumeLesson(lessons, fresh)).get('l2')).toBe('next');
    const done = progress(['l1', 'l2', 'l3'], 'l3');
    expect([...lessonStates(lessons, done, resumeLesson(lessons, done)).values()]).toEqual([
      'completed',
      'completed',
      'completed',
    ]);
  });

  it('groups lessons by module and drops an empty module', () => {
    const moduleOf = (id: string): Module =>
      ({
        id,
        courseId: 'k1',
        order: 0,
        lessonCount: 0,
        defaultLocale: 'en',
        translations: { en: { title: id, description: '' } },
        createdAt: NOW,
        updatedAt: NOW,
      }) as Module;
    const groups = groupLessonsByModule(
      [moduleOf('m1'), moduleOf('m2'), moduleOf('m3')],
      [
        lesson({ id: 'a', courseId: 'k1', moduleId: 'm1' }),
        lesson({ id: 'b', courseId: 'k1', moduleId: 'm3' }),
      ],
    );
    expect(groups.map((group) => [group.module.id, group.number, group.lessons.length])).toEqual([
      ['m1', 1, 1],
      ['m3', 3, 1],
    ]);
  });
});

describe('panel states', () => {
  const published = { status: 'published' } as const;

  it('decides the Teacher Academy panel', () => {
    expect(academyPanelState(published, { status: 'completed' }, false)).toBe('completed');
    expect(academyPanelState(published, { status: 'active' }, false)).toBe('active');
    expect(academyPanelState(published, null, false)).toBe('locked');
    expect(academyPanelState({ status: 'draft' }, null, true)).toBe('draft');
    expect(academyPanelState(published, null, true)).toBe('enroll');
  });

  it('decides the assign panel', () => {
    expect(assignPanelState({ status: 'draft' }, false, 0)).toBe('locked');
    expect(assignPanelState({ status: 'draft' }, true, 0)).toBe('notPublished');
    expect(assignPanelState(published, true, 0)).toBe('noClasses');
    expect(assignPanelState(published, true, 2)).toBe('ready');
  });
});
