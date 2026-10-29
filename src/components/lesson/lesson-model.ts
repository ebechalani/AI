import { pickTranslation } from '@/lib/i18n/content';
import { getMissingForCompletion } from '@/lib/learning/lesson-completion';
import { groupBlocksByStage } from '@/lib/learning/stages';
import type { Audience, Role } from '@/types/common';
import type { LessonBlock, LessonStage } from '@/types/content';
import type { LessonPlayerData } from '@/types/learning';
import type { LessonRuntime } from './blocks/registry';

// What the lesson player derives from LessonPlayerData (ARCHITECTURE.md 7.6, 9.4). Pure, so the
// unit tests cover it without a renderer. `readOnly` and `tutorEnabled` are used only as the
// server returned them, never derived from the route or the role.

/** A chip of the stage stepper: a stage that has blocks, or the closing EARN step. */
export type StepperStage = LessonStage | 'earn';

/** The section that holds the checklist and the completion state; the stepper's last chip. */
export const EARN_ANCHOR = 'stage-earn';

export function stageAnchor(stage: StepperStage): string {
  return `stage-${stage}`;
}

export function blockAnchor(blockId: string): string {
  return `block-${blockId}`;
}

/** A record keyed by id, read without reaching the prototype (`constructor`, `__proto__`). */
export function own<T>(map: Record<string, T>, id: string): T | undefined {
  return Object.hasOwn(map, id) ? map[id] : undefined;
}

/**
 * The blocks the player shows. An AI activity is hidden when the tutor is not enabled (a
 * read-only preview, a school with `aiEnabled: false`), so its stage must not appear either.
 * Quiz and project blocks always stay: their own renderers handle read-only.
 */
export function visibleBlocks(
  blocks: readonly LessonBlock[],
  tutorEnabled: boolean,
): LessonBlock[] {
  return tutorEnabled ? [...blocks] : blocks.filter((block) => block.type !== 'ai_activity');
}

/** The stepper's chips: the stages that have shown blocks, in the fixed order, then EARN. */
export function stepperStages(shown: readonly LessonBlock[]): StepperStage[] {
  return [...groupBlocksByStage(shown).map((group) => group.stage), 'earn'];
}

/** What every block renderer receives. */
export function toRuntime(data: LessonPlayerData): LessonRuntime {
  const responses = data.progress?.responses ?? {};
  return {
    courseId: data.course.id,
    lessonId: data.lesson.id,
    readOnly: data.readOnly,
    tutorEnabled: data.tutorEnabled,
    audience: data.course.audience,
    responses: Object.fromEntries(
      Object.entries(responses).map(([blockId, response]) => [blockId, response.text]),
    ),
    quizzes: data.quizzes,
    latestAttempts: data.latestAttempts,
    attemptsRemaining: data.attemptsRemaining,
    projects: data.projects,
    latestSubmissions: data.latestSubmissions,
  };
}

export interface ChecklistItem {
  kind: 'quiz' | 'project' | 'reflection';
  id: string;
  /** The id of the element that shows the requirement, or null when no block shows it. */
  anchor: string | null;
  label: string;
  /** Reflections only: the length the answer needs. */
  minLength?: number;
  done: boolean;
}

const LABEL_CHARS = 80;

/** Cuts a label to at most 80 characters, the last of them an ellipsis. */
export function shortLabel(text: string): string {
  const characters = Array.from(text.trim());
  if (characters.length <= LABEL_CHARS) return characters.join('');
  return `${characters
    .slice(0, LABEL_CHARS - 1)
    .join('')
    .trimEnd()}…`;
}

/**
 * What "Complete lesson" waits for (9.4), one item per quiz, project and reflection of the
 * lesson, in that order. Every item is done once the lesson is completed.
 */
export function buildChecklist(data: LessonPlayerData, locale: string): ChecklistItem[] {
  const completed = data.progress?.status === 'completed';
  const missing = getMissingForCompletion({
    lesson: data.lesson,
    blocks: data.blocks,
    quizzes: data.quizzes,
    enrollment: data.enrollment ?? { quizSummary: {}, projectSummary: {} },
    responses: data.progress?.responses ?? {},
  });

  const anchorOf = (match: (block: LessonBlock) => boolean): string | null => {
    const block = data.blocks.find(match);
    return block === undefined ? null : blockAnchor(block.id);
  };

  const quizzes = data.lesson.quizIds.map((id): ChecklistItem => {
    const quiz = own(data.quizzes, id);
    return {
      kind: 'quiz',
      id,
      anchor: anchorOf((block) => block.type === 'quiz' && block.data.quizId === id),
      label: quiz ? pickTranslation(quiz.translations, locale, quiz.defaultLocale).title : '',
      done: completed || !missing.quizIds.includes(id),
    };
  });

  const projects = data.lesson.projectIds.map((id): ChecklistItem => {
    const project = own(data.projects, id);
    return {
      kind: 'project',
      id,
      anchor: anchorOf((block) => block.type === 'project' && block.data.projectId === id),
      label: project
        ? pickTranslation(project.translations, locale, project.defaultLocale).title
        : '',
      done: completed || !missing.projectIds.includes(id),
    };
  });

  const reflections = data.lesson.reflectionBlockIds.map((id): ChecklistItem => {
    const block = data.blocks.find((candidate) => candidate.id === id);
    const reflection = block?.type === 'reflection' ? block : undefined;
    return {
      kind: 'reflection',
      id,
      anchor: reflection ? blockAnchor(reflection.id) : null,
      label: reflection
        ? shortLabel(
            pickTranslation(reflection.translations, locale, reflection.defaultLocale).prompt,
          )
        : '',
      minLength: reflection?.data.minLength ?? 0,
      done: completed || !missing.reflectionBlockIds.includes(id),
    };
  });

  return [...quizzes, ...projects, ...reflections];
}

/**
 * Whether an unenrolled viewer of the preview could enrol in the course from its page: a
 * student in a student course, a teacher in a Teacher Academy course.
 */
export function canEnrollFromPreview(role: Role, audience: Audience): boolean {
  return (
    (role === 'student' && audience === 'student') || (role === 'teacher' && audience === 'teacher')
  );
}

/** "Lesson 2 of 4": 1-based place of the lesson in the sorted outline. */
export function lessonPosition(
  lessons: readonly { id: string }[],
  lessonId: string,
): { current: number; total: number } {
  return {
    current: lessons.findIndex((lesson) => lesson.id === lessonId) + 1,
    total: lessons.length,
  };
}

/** Previous and next lesson links, from the ids the service computed on the sorted outline. */
export function lessonHrefs(
  lessonBasePath: string,
  previousLessonId: string | null,
  nextLessonId: string | null,
): { previousHref: string | null; nextHref: string | null } {
  const href = (id: string | null) => (id === null ? null : `${lessonBasePath}/${id}`);
  return { previousHref: href(previousLessonId), nextHref: href(nextLessonId) };
}
