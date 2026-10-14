import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LOCALES } from '@/lib/i18n/config';
import { isNavItemActive, NAV_ITEMS, PROFILE_ITEMS, roleHome } from '@/lib/navigation/nav-config';
import { ROLES, type Role } from '@/types/common';

// The navigation of each role, item for item as the owner's brief lists it (sections 5–7;
// the platform admin list is ARCHITECTURE.md 6.7).
const EXPECTED: Record<Role, { nav: string[]; profile: string[] }> = {
  student: {
    nav: ['home', 'learn', 'aiLab', 'robotics', 'challenges', 'projects', 'tutor'],
    profile: ['achievements', 'certificates', 'settings'],
  },
  teacher: {
    nav: ['dashboard', 'classes', 'courses', 'create', 'assessments', 'projects', 'reports'],
    profile: ['settings'],
  },
  school_admin: {
    nav: [
      'dashboard',
      'teachers',
      'students',
      'classes',
      'courses',
      'analytics',
      'certificates',
      'licenses',
      'settings',
    ],
    profile: [],
  },
  platform_admin: {
    nav: [
      'dashboard',
      'schools',
      'users',
      'subscriptions',
      'courses',
      'certificates',
      'challenges',
    ],
    profile: [],
  },
};

function navMessages(locale: string): Record<string, Record<string, string>> {
  const file = path.join(import.meta.dirname, '..', '..', 'src', 'messages', locale, 'nav.json');
  return JSON.parse(readFileSync(file, 'utf8')) as Record<string, Record<string, string>>;
}

describe('NAV_ITEMS and PROFILE_ITEMS', () => {
  it.each(ROLES)('%s: lists the items of the brief in display order', (role) => {
    expect(NAV_ITEMS[role].map((item) => item.key)).toEqual(EXPECTED[role].nav);
    expect(PROFILE_ITEMS[role].map((item) => item.key)).toEqual(EXPECTED[role].profile);
  });

  it.each(ROLES)('%s: the first item is the home of the area and every item lies in it', (role) => {
    const home = roleHome(role);
    expect(NAV_ITEMS[role][0].href).toBe(home);
    for (const item of [...NAV_ITEMS[role], ...PROFILE_ITEMS[role]]) {
      expect(item.href === home || item.href.startsWith(`${home}/`)).toBe(true);
      expect(item.icon).toMatch(/^[A-Z][A-Za-z0-9]*$/);
    }
  });

  it.each(LOCALES)('%s: every item has a label nav.<role>.<key>', (locale) => {
    const messages = navMessages(locale);
    for (const role of ROLES) {
      for (const item of [...NAV_ITEMS[role], ...PROFILE_ITEMS[role]]) {
        expect(messages[role]?.[item.key], `nav.${role}.${item.key}`).toEqual(expect.any(String));
      }
    }
  });
});

describe('isNavItemActive', () => {
  const home = NAV_ITEMS.student[0];
  const projects = NAV_ITEMS.teacher.find((item) => item.key === 'projects')!;

  it('marks the home item on its own page only', () => {
    expect(isNavItemActive('/student', home, 'student')).toBe(true);
    expect(isNavItemActive('/student/learn', home, 'student')).toBe(false);
    expect(isNavItemActive('/student/projects/abc', home, 'student')).toBe(false);
  });

  it('marks a section on its page and on the pages below it', () => {
    expect(isNavItemActive('/teacher/projects', projects, 'teacher')).toBe(true);
    expect(isNavItemActive('/teacher/projects/sub1', projects, 'teacher')).toBe(true);
    expect(isNavItemActive('/teacher/projects-archive', projects, 'teacher')).toBe(false);
    expect(isNavItemActive('/teacher', projects, 'teacher')).toBe(false);
  });
});
