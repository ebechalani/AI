// One JSON file per namespace and locale: src/messages/<locale>/<namespace>.json.
// The first five are foundation-owned; each of the others belongs to one workstream.
export const NAMESPACES = [
  'common',
  'nav',
  'errors',
  'validation',
  'domain',
  'home',
  'auth',
  'legal',
  'student',
  'learn',
  'lesson',
  'quiz',
  'assessments',
  'projects',
  'review',
  'teacher',
  'classes',
  'reports',
  'courseEditor',
  'school',
  'admin',
  'tutor',
  'aiLab',
  'robotics',
  'challenges',
  'achievements',
  'certificates',
  'settings',
] as const;

export type Namespace = (typeof NAMESPACES)[number];
