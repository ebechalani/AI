import { CONTENT_LIMITS } from '@/lib/limits';

// Which `courseEditor.conflicts.*` message a `conflict` answer means (3.2), and whether the page
// is stale and must be refreshed. The caller describes what it sent.

export type ConflictContext =
  | { action: 'updateCourse'; reason: 'pathwayLocked' | 'audienceHasProjects' | 'generic' }
  | { action: 'createModule' }
  | { action: 'createLesson' }
  | { action: 'deleteModule'; hasLessons: boolean }
  /** A lesson or a block. */
  | { action: 'deleteStructure' }
  | { action: 'deleteQuiz' | 'deleteProject'; linked: boolean }
  | { action: 'reorder' }
  | {
      action: 'saveBlock';
      creating: boolean;
      blockCount: number;
      link: 'quiz' | 'project' | null;
      teacherCourse: boolean;
    }
  | { action: 'other' };

export type ConflictKey =
  | 'pathwayLocked'
  | 'audienceHasProjects'
  | 'generic'
  | 'tooManyModules'
  | 'moduleHasLessons'
  | 'locked'
  | 'tooManyLessons'
  | 'staleOrder'
  | 'tooManyBlocks'
  | 'quizInUse'
  | 'projectInUse'
  | 'teacherCourseProject'
  | 'quizLinked'
  | 'projectLinked';

export const CONFLICT_KEYS: readonly ConflictKey[] = [
  'pathwayLocked',
  'audienceHasProjects',
  'generic',
  'tooManyModules',
  'moduleHasLessons',
  'locked',
  'tooManyLessons',
  'staleOrder',
  'tooManyBlocks',
  'quizInUse',
  'projectInUse',
  'teacherCourseProject',
  'quizLinked',
  'projectLinked',
];

export interface ConflictMessage {
  /** Under `courseEditor.`. */
  key: `conflicts.${ConflictKey}`;
  refresh: boolean;
  values?: { max: number };
}

function message(key: ConflictKey, refresh: boolean, max?: number): ConflictMessage {
  return { key: `conflicts.${key}`, refresh, ...(max !== undefined && { values: { max } }) };
}

export function conflictMessageKey(context: ConflictContext): ConflictMessage {
  switch (context.action) {
    case 'updateCourse':
      return message(context.reason, context.reason === 'generic');
    case 'createModule':
      return message('tooManyModules', false, CONTENT_LIMITS.modulesPerCourse);
    case 'createLesson':
      return message('tooManyLessons', false, CONTENT_LIMITS.lessonsPerModule);
    case 'deleteModule':
      return context.hasLessons ? message('moduleHasLessons', false) : message('locked', true);
    case 'deleteStructure':
      return message('locked', true);
    case 'deleteQuiz':
      return context.linked ? message('quizLinked', false) : message('locked', true);
    case 'deleteProject':
      return context.linked ? message('projectLinked', false) : message('locked', true);
    case 'reorder':
      return message('staleOrder', true);
    case 'saveBlock':
      if (context.creating && context.blockCount >= CONTENT_LIMITS.blocksPerLesson) {
        return message('tooManyBlocks', false, CONTENT_LIMITS.blocksPerLesson);
      }
      if (context.link === 'project' && context.teacherCourse) {
        return message('teacherCourseProject', false);
      }
      if (context.link === 'quiz') return message('quizInUse', true);
      if (context.link === 'project') return message('projectInUse', true);
      return message('generic', true);
    default:
      return message('generic', true);
  }
}

/** The message of a `not_found` answer (3.1): the item, or the uploaded file, is gone. */
export function goneMessageKey(kind: 'gone' | 'mediaGone'): 'errors.gone' | 'errors.mediaGone' {
  return kind === 'mediaGone' ? 'errors.mediaGone' : 'errors.gone';
}
