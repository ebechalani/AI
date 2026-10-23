import { XP_RULES } from '@/lib/gamification/rules';
import type { Locale, Localized, SubmissionType } from '@/types/common';
import type { ProjectInput } from '@/types/inputs';
import { RUBRIC_KEYS, type Project, type ProjectKind, type RubricKey } from '@/types/project';
import { requiredNumber } from './course-model';
import { extraLocales, textDraftFrom, textDraftTo, type TextDraft } from './translations';

// The project editor's draft (6.5).

export type ProjectTextField = 'title' | 'brief' | 'requirements';
export const PROJECT_TEXT_FIELDS: readonly ProjectTextField[] = ['title', 'brief', 'requirements'];

export interface ProjectDraft {
  kind: ProjectKind;
  defaultLocale: Locale;
  text: TextDraft<ProjectTextField>;
  extra: Localized<unknown>;
  allowedSubmissionTypes: SubmissionType[];
  rubric: Record<RubricKey, { included: boolean; weight: string }>;
  /**
   * The stored order of the criteria, so an unchanged rubric saves exactly as it was read; a
   * criterion added later goes after them, in RUBRIC_KEYS order.
   */
  rubricOrder: RubricKey[];
  xpReward: string;
  requiredForCertificate: boolean;
}

export const NEW_PROJECT_WEIGHT = 25;

export function projectToDraft(project: Project): ProjectDraft {
  const rubric = {} as ProjectDraft['rubric'];
  for (const key of RUBRIC_KEYS) {
    const entry = project.rubric.find((criterion) => criterion.key === key);
    rubric[key] = { included: entry !== undefined, weight: String(entry?.weight ?? 0) };
  }
  return {
    kind: project.kind,
    defaultLocale: project.defaultLocale,
    text: textDraftFrom(project.translations, PROJECT_TEXT_FIELDS),
    extra: extraLocales(project.translations),
    allowedSubmissionTypes: project.allowedSubmissionTypes,
    rubric,
    rubricOrder: project.rubric.map((criterion) => criterion.key),
    xpReward: String(project.xpReward),
    requiredForCertificate: project.requiredForCertificate,
  };
}

/** A project with text answers, the four criteria at 25, 300 XP, not needed for the certificate. */
export function newProjectDraft(defaultLocale: Locale): ProjectDraft {
  const rubric = {} as ProjectDraft['rubric'];
  for (const key of RUBRIC_KEYS) rubric[key] = { included: true, weight: String(NEW_PROJECT_WEIGHT) };
  return {
    kind: 'project',
    defaultLocale,
    text: textDraftFrom({}, PROJECT_TEXT_FIELDS),
    extra: {},
    allowedSubmissionTypes: ['text'],
    rubric,
    rubricOrder: [...RUBRIC_KEYS],
    xpReward: String(XP_RULES.project),
    requiredForCertificate: false,
  };
}

function rubricKeysInOrder(draft: Pick<ProjectDraft, 'rubric' | 'rubricOrder'>): RubricKey[] {
  const ordered = [
    ...draft.rubricOrder,
    ...RUBRIC_KEYS.filter((key) => !draft.rubricOrder.includes(key)),
  ];
  return ordered.filter((key) => draft.rubric[key].included);
}

export function projectDraftToInput(draft: ProjectDraft): ProjectInput {
  return {
    kind: draft.kind,
    defaultLocale: draft.defaultLocale,
    translations: textDraftTo(draft.text, {
      fields: PROJECT_TEXT_FIELDS,
      defaultLocale: draft.defaultLocale,
      extra: draft.extra,
    }) as ProjectInput['translations'],
    allowedSubmissionTypes: draft.allowedSubmissionTypes,
    rubric: rubricKeysInOrder(draft).map((key) => ({
      key,
      weight: requiredNumber(draft.rubric[key].weight),
    })),
    xpReward: requiredNumber(draft.xpReward),
    requiredForCertificate: draft.requiredForCertificate,
  };
}

/** The included weights; a weight that is not a number counts 0. */
export function rubricTotal(rubric: ProjectDraft['rubric']): number {
  return RUBRIC_KEYS.reduce((total, key) => {
    const entry = rubric[key];
    if (!entry.included) return total;
    const weight = Number(entry.weight.trim() === '' ? Number.NaN : entry.weight);
    return Number.isFinite(weight) ? total + weight : total;
  }, 0);
}
