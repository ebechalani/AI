import type { Role } from '@/types/common';

// For showing and hiding controls only. The security boundary is the server: runAction's role
// gate and the predicates of authz.ts, which also look at the resource.

export type Capability =
  | 'learn'
  | 'quiz.take'
  | 'project.submit'
  | 'tutor.use'
  | 'lab.use'
  | 'challenge.submit'
  | 'class.manage'
  | 'student.manage'
  | 'course.assign'
  | 'progress.view'
  | 'submission.review'
  | 'certificate.issue'
  | 'course.author'
  | 'teacher.manage'
  | 'school.analytics'
  | 'license.view'
  | 'school.settings'
  | 'platform.manage';

// The permissions matrix of ARCHITECTURE.md 4.2, one row per role.
export const ROLE_CAPABILITIES: Record<Role, readonly Capability[]> = {
  student: ['learn', 'quiz.take', 'project.submit', 'tutor.use', 'lab.use', 'challenge.submit'],
  // 'learn', 'quiz.take' and 'tutor.use' are for Teacher Academy courses.
  teacher: [
    'learn',
    'quiz.take',
    'tutor.use',
    'class.manage',
    'student.manage',
    'course.assign',
    'progress.view',
    'submission.review',
    'certificate.issue',
    'course.author',
  ],
  // Reads submissions of the school but does not grade them, and issues no certificates.
  school_admin: [
    'class.manage',
    'student.manage',
    'course.assign',
    'progress.view',
    'teacher.manage',
    'school.analytics',
    'license.view',
    'school.settings',
  ],
  // Everything managerial, nothing a learner does.
  platform_admin: [
    'class.manage',
    'student.manage',
    'course.assign',
    'progress.view',
    'submission.review',
    'certificate.issue',
    'course.author',
    'teacher.manage',
    'school.analytics',
    'license.view',
    'school.settings',
    'platform.manage',
  ],
};

export function hasCapability(role: Role, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}
