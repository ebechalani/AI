// Shared: the navigation of each role, in display order. Labels are `nav.<role>.<key>`.
// The lists follow the owner's brief (sections 5–7) item for item; the platform admin list is
// the one of ARCHITECTURE.md 6.7.

import { roleHome } from '@/lib/auth/roles';
import type { Role } from '@/types/common';

export { roleHome };

export interface NavItem {
  key: string;
  /** Locale-less path. */
  href: string;
  /** The name of a lucide-react icon component. */
  icon: string;
}

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  student: [
    { key: 'home', href: '/student', icon: 'House' },
    { key: 'learn', href: '/student/learn', icon: 'BookOpen' },
    { key: 'aiLab', href: '/student/ai-lab', icon: 'FlaskConical' },
    { key: 'robotics', href: '/student/robotics', icon: 'Bot' },
    { key: 'challenges', href: '/student/challenges', icon: 'Trophy' },
    { key: 'projects', href: '/student/projects', icon: 'FolderKanban' },
    { key: 'tutor', href: '/student/tutor', icon: 'MessageCircle' },
  ],
  teacher: [
    { key: 'dashboard', href: '/teacher', icon: 'LayoutDashboard' },
    { key: 'classes', href: '/teacher/classes', icon: 'Users' },
    { key: 'courses', href: '/teacher/courses', icon: 'BookOpen' },
    { key: 'create', href: '/teacher/create', icon: 'SquarePen' },
    { key: 'assessments', href: '/teacher/assessments', icon: 'ClipboardCheck' },
    { key: 'projects', href: '/teacher/projects', icon: 'FolderKanban' },
    { key: 'reports', href: '/teacher/reports', icon: 'ChartColumn' },
  ],
  school_admin: [
    { key: 'dashboard', href: '/school', icon: 'LayoutDashboard' },
    { key: 'teachers', href: '/school/teachers', icon: 'GraduationCap' },
    { key: 'students', href: '/school/students', icon: 'Users' },
    { key: 'classes', href: '/school/classes', icon: 'School' },
    { key: 'courses', href: '/school/courses', icon: 'BookOpen' },
    { key: 'analytics', href: '/school/analytics', icon: 'ChartLine' },
    { key: 'certificates', href: '/school/certificates', icon: 'Award' },
    { key: 'licenses', href: '/school/licenses', icon: 'KeyRound' },
    { key: 'settings', href: '/school/settings', icon: 'Settings' },
  ],
  platform_admin: [
    { key: 'dashboard', href: '/admin', icon: 'LayoutDashboard' },
    { key: 'schools', href: '/admin/schools', icon: 'Building2' },
    { key: 'users', href: '/admin/users', icon: 'Users' },
    { key: 'subscriptions', href: '/admin/subscriptions', icon: 'CreditCard' },
    { key: 'courses', href: '/admin/courses', icon: 'BookOpen' },
    { key: 'certificates', href: '/admin/certificates', icon: 'Award' },
    { key: 'challenges', href: '/admin/challenges', icon: 'Trophy' },
  ],
};

/** The user menu. A school admin's Settings is a main item; a platform admin has no settings page. */
export const PROFILE_ITEMS: Record<Role, NavItem[]> = {
  student: [
    { key: 'achievements', href: '/student/achievements', icon: 'Medal' },
    { key: 'certificates', href: '/student/certificates', icon: 'Award' },
    { key: 'settings', href: '/student/settings', icon: 'Settings' },
  ],
  teacher: [{ key: 'settings', href: '/teacher/settings', icon: 'Settings' }],
  school_admin: [],
  platform_admin: [],
};

/**
 * Whether `pathname` (locale-less, as usePathname() of the i18n navigation returns it) lies in
 * the section an item opens. A role's home item matches its own page only; otherwise it would
 * be active on every page of the area.
 */
export function isNavItemActive(pathname: string, item: NavItem, role: Role): boolean {
  if (pathname === item.href) return true;
  return item.href !== roleHome(role) && pathname.startsWith(`${item.href}/`);
}
