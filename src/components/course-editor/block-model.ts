import { pickTranslation } from '@/lib/i18n/content';
import { groupBlocksByStage } from '@/lib/learning/stages';
import type { TutorMode } from '@/types/ai';
import type { Locale, Localized, MediaRef } from '@/types/common';
import {
  BLOCK_TYPES,
  type BlockTextMap,
  type BlockType,
  type CodeLanguage,
  type Course,
  type EmbedAspectRatio,
  type LessonBlock,
  type LessonStage,
  type MlAccessMode,
  type MlCodeTool,
  type MlProjectType,
  type VideoSource,
} from '@/types/content';
import type { BlockInput, BlockInputOf } from '@/types/inputs';
import { moveId } from './outline-model';
import type { ProjectRow, QuizRow } from './rows';
import { extraLocales, textDraftFrom, textDraftTo, type TextDraft } from './translations';
import { extractVideoId, formatDuration, parseDuration } from './video-model';

// A block form's draft (6.3): the language-neutral data as the author types it, and every
// translatable field of every editable language.

export type TextFieldOf<T extends BlockType> = keyof BlockTextMap[T] & string;

export interface DataDraftMap {
  rich_text: Record<string, never>;
  /** '' before an upload. */
  image: { fileId: string; media: MediaRef | null };
  /** videoId: what the author typed (an id or a URL); duration 'm:ss' | 'h:mm:ss' | ''. */
  video: {
    source: VideoSource;
    videoId: string;
    fileId: string;
    media: MediaRef | null;
    duration: string;
  };
  file: { fileId: string; media: MediaRef | null };
  /** '' = none chosen. */
  quiz: { quizId: string };
  code_activity: { language: CodeLanguage; starterCode: string };
  /** '' = no lab tool. */
  ai_activity: { tutorMode: TutorMode; labToolId: string };
  embed: { url: string; aspectRatio: EmbedAspectRatio };
  reflection: { minLength: string };
  project: { projectId: string };
  /** worksheetUrl: '' = no worksheet. */
  ml_activity: {
    url: string;
    worksheetUrl: string;
    projectType: MlProjectType;
    codeTool: MlCodeTool;
    access: MlAccessMode;
  };
}

export type BlockDraftOf<T extends BlockType> = {
  type: T;
  stage: LessonStage;
  defaultLocale: Locale;
  text: TextDraft<TextFieldOf<T>>;
  extra: Localized<unknown>;
  data: DataDraftMap[T];
};

export type BlockDraft = { [T in BlockType]: BlockDraftOf<T> }[BlockType];

export const TEXT_FIELDS: { [T in BlockType]: readonly TextFieldOf<T>[] } = {
  rich_text: ['heading', 'body'],
  image: ['alt', 'caption'],
  video: ['title', 'caption', 'transcript'],
  file: ['label', 'description'],
  quiz: ['intro'],
  code_activity: ['instructions', 'hint'],
  ai_activity: ['instructions', 'starterPrompt'],
  embed: ['title', 'caption'],
  reflection: ['prompt'],
  project: ['intro'],
  ml_activity: ['title', 'instructions', 'bringBack', 'hint'],
};

export const NULLABLE_TEXT: { [T in BlockType]: readonly TextFieldOf<T>[] } = {
  rich_text: ['heading'],
  image: ['caption'],
  video: ['caption', 'transcript'],
  file: ['description'],
  quiz: ['intro'],
  code_activity: ['hint'],
  ai_activity: ['starterPrompt'],
  embed: ['caption'],
  reflection: [],
  project: ['intro'],
  ml_activity: ['bringBack', 'hint'],
};

/** The fields the schema requires in the block's default language. */
export const REQUIRED_TEXT: { [T in BlockType]: readonly TextFieldOf<T>[] } = {
  rich_text: ['body'],
  image: ['alt'],
  video: ['title'],
  file: ['label'],
  quiz: [],
  code_activity: ['instructions'],
  ai_activity: ['instructions'],
  embed: ['title'],
  reflection: ['prompt'],
  project: [],
  ml_activity: ['title', 'instructions'],
};

export const DEFAULT_STAGE: Record<BlockType, LessonStage> = {
  rich_text: 'learn',
  image: 'learn',
  video: 'watch',
  file: 'learn',
  quiz: 'check',
  code_activity: 'try',
  ai_activity: 'ask_ai',
  embed: 'try',
  reflection: 'reflect',
  project: 'build',
  ml_activity: 'try',
};

function textOf<T extends BlockType>(
  type: T,
  translations: Localized<BlockTextMap[T]>,
): TextDraft<TextFieldOf<T>> {
  return textDraftFrom(
    translations as Localized<Partial<Record<TextFieldOf<T>, string | null>>>,
    TEXT_FIELDS[type],
  );
}

function draftOf<T extends BlockType>(
  block: { type: T; stage: LessonStage; defaultLocale: Locale; translations: Localized<BlockTextMap[T]> },
  data: DataDraftMap[T],
): BlockDraftOf<T> {
  return {
    type: block.type,
    stage: block.stage,
    defaultLocale: block.defaultLocale,
    text: textOf(block.type, block.translations),
    extra: extraLocales(block.translations),
    data,
  };
}

/** The stored block as a form draft; the media come from the stored MediaRefs. */
export function blockToDraft(block: LessonBlock): BlockDraft {
  switch (block.type) {
    case 'rich_text':
      return draftOf(block, {});
    case 'image':
      return draftOf(block, { fileId: block.data.media.fileId, media: block.data.media });
    case 'video':
      return draftOf(block, {
        source: block.data.source,
        videoId: block.data.videoId ?? '',
        fileId: block.data.media?.fileId ?? '',
        media: block.data.media,
        duration: formatDuration(block.data.durationSeconds),
      });
    case 'file':
      return draftOf(block, { fileId: block.data.media.fileId, media: block.data.media });
    case 'quiz':
      return draftOf(block, { quizId: block.data.quizId });
    case 'code_activity':
      return draftOf(block, {
        language: block.data.language,
        starterCode: block.data.starterCode,
      });
    case 'ai_activity':
      return draftOf(block, {
        tutorMode: block.data.tutorMode,
        labToolId: block.data.labToolId ?? '',
      });
    case 'embed':
      return draftOf(block, { url: block.data.url, aspectRatio: block.data.aspectRatio });
    case 'reflection':
      return draftOf(block, { minLength: String(block.data.minLength) });
    case 'project':
      return draftOf(block, { projectId: block.data.projectId });
    case 'ml_activity': {
      const { url, worksheetUrl, projectType, codeTool, access } = block.data;
      return draftOf(block, {
        url,
        worksheetUrl: worksheetUrl ?? '',
        projectType,
        codeTool,
        access,
      });
    }
  }
}

const NEW_DATA: { [T in BlockType]: DataDraftMap[T] } = {
  rich_text: {},
  image: { fileId: '', media: null },
  video: { source: 'youtube', videoId: '', fileId: '', media: null, duration: '' },
  file: { fileId: '', media: null },
  quiz: { quizId: '' },
  code_activity: { language: 'python', starterCode: '' },
  ai_activity: { tutorMode: 'explain', labToolId: '' },
  embed: { url: '', aspectRatio: '16:9' },
  reflection: { minLength: '0' },
  project: { projectId: '' },
  // "Try it now" has no address of its own: it is a button on the site's login page.
  ml_activity: {
    url: 'https://machinelearningforkids.co.uk/#!/login',
    worksheetUrl: '',
    projectType: 'text',
    codeTool: 'scratch',
    access: 'try_it_now',
  },
};

function newDraftOf<T extends BlockType>(type: T, defaultLocale: Locale): BlockDraftOf<T> {
  return {
    type,
    stage: DEFAULT_STAGE[type],
    defaultLocale,
    text: textOf(type, {}),
    extra: {},
    data: { ...NEW_DATA[type] },
  };
}

export function newBlockDraft(type: BlockType, defaultLocale: Locale): BlockDraft {
  return newDraftOf(type, defaultLocale) as BlockDraft;
}

function inputOf<T extends BlockType>(
  draft: BlockDraftOf<T>,
  data: BlockInputOf<T>['data'],
): BlockInputOf<T> {
  return {
    type: draft.type,
    stage: draft.stage,
    defaultLocale: draft.defaultLocale,
    translations: textDraftTo(draft.text, {
      fields: TEXT_FIELDS[draft.type],
      nullable: NULLABLE_TEXT[draft.type],
      defaultLocale: draft.defaultLocale,
      extra: draft.extra,
    }) as Localized<BlockTextMap[T]>,
    data,
  };
}

/**
 * The form's draft as the action's input. A missing file stays '' and a missing quiz or project
 * '' (the schema answers `invalid`, which the form reads as "upload a file first" / "choose").
 */
export function blockDraftToInput(draft: BlockDraft): BlockInput {
  switch (draft.type) {
    case 'rich_text':
      return inputOf(draft, {});
    case 'image':
      return inputOf(draft, { fileId: draft.data.fileId });
    case 'file':
      return inputOf(draft, { fileId: draft.data.fileId });
    case 'video': {
      const { source, videoId, fileId, duration } = draft.data;
      const durationSeconds = parseDuration(duration);
      return source === 'file'
        ? inputOf(draft, { source, videoId: null, fileId: fileId || null, durationSeconds })
        : inputOf(draft, {
            source,
            videoId: extractVideoId(source, videoId) ?? (videoId.trim() || null),
            fileId: null,
            durationSeconds,
          });
    }
    case 'quiz':
      return inputOf(draft, { quizId: draft.data.quizId });
    case 'code_activity':
      return inputOf(draft, {
        language: draft.data.language,
        starterCode: draft.data.starterCode,
      });
    case 'ai_activity':
      return inputOf(draft, {
        tutorMode: draft.data.tutorMode,
        labToolId: (draft.data.labToolId || null) as BlockInputOf<'ai_activity'>['data']['labToolId'],
      });
    case 'embed':
      return inputOf(draft, { url: draft.data.url, aspectRatio: draft.data.aspectRatio });
    case 'reflection':
      return inputOf(draft, { minLength: Number(draft.data.minLength.trim() || '0') });
    case 'project':
      return inputOf(draft, { projectId: draft.data.projectId });
    case 'ml_activity': {
      const { url, worksheetUrl, projectType, codeTool, access } = draft.data;
      return inputOf(draft, {
        url,
        worksheetUrl: worksheetUrl.trim() || null,
        projectType,
        codeTool,
        access,
      });
    }
  }
}

/** A course for teachers has no project blocks (teachers do not submit work). */
export function availableBlockTypes(course: Pick<Course, 'audience'>): BlockType[] {
  return BLOCK_TYPES.filter((type) => course.audience !== 'teacher' || type !== 'project');
}

/** The quiz or project a block (or a block draft) points at. */
export function blockLink(block: {
  type: BlockType;
  data: unknown;
}): { kind: 'quiz' | 'project'; id: string } | null {
  if (block.type === 'quiz') return { kind: 'quiz', id: (block.data as { quizId: string }).quizId };
  if (block.type === 'project') {
    return { kind: 'project', id: (block.data as { projectId: string }).projectId };
  }
  return null;
}

/** The rows no lesson uses, plus the current one (a block keeps its own), in the given order. */
export function linkChoices<R extends { id: string; lessonId: string | null }>(
  rows: readonly R[],
  currentId: string | null,
): R[] {
  return rows.filter((row) => row.lessonId === null || row.id === currentId);
}

const SUMMARY_MAX = 120;

function plainMarkdown(text: string): string {
  return text
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>`[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cut(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > SUMMARY_MAX ? `${clean.slice(0, SUMMARY_MAX - 1).trimEnd()}…` : clean;
}

function titleOf(
  row: { translations: Localized<{ title: string }>; defaultLocale: Locale } | undefined,
  locale: string,
): string {
  return row ? (pickTranslation(row.translations, locale, row.defaultLocale).title ?? '') : '';
}

/** The first useful text of a block in the UI locale, cut at 120 characters; '' when none. */
export function blockSummary(
  block: LessonBlock,
  locale: string,
  lookups: { quizzes: Record<string, QuizRow>; projects: Record<string, ProjectRow> },
): string {
  const text = (): Record<string, string | null> =>
    pickTranslation(
      block.translations as Localized<Record<string, string | null>>,
      locale,
      block.defaultLocale,
    );
  const value = (field: string): string => {
    const found = text()[field];
    return typeof found === 'string' ? found : '';
  };
  switch (block.type) {
    case 'rich_text': {
      const heading = value('heading');
      return cut(heading.trim() !== '' ? heading : plainMarkdown(value('body')));
    }
    case 'image':
      return cut(value('alt'));
    case 'video':
    case 'embed':
    case 'ml_activity':
      return cut(value('title'));
    case 'file':
      return cut(value('label'));
    case 'quiz':
      return cut(titleOf(lookups.quizzes[block.data.quizId], locale));
    case 'project':
      return cut(titleOf(lookups.projects[block.data.projectId], locale));
    case 'code_activity':
    case 'ai_activity':
      return cut(plainMarkdown(value('instructions')));
    case 'reflection':
      return cut(value('prompt'));
  }
}

/**
 * The full `orderedIds` for reorderBlocksAction after moving a block inside its own stage
 * (clamped): the player groups blocks by stage, so only the order inside a stage matters.
 */
export function reorderWithinStage(
  blocks: readonly Pick<LessonBlock, 'id' | 'stage' | 'order'>[],
  blockId: string,
  toIndexInStage: number,
): string[] {
  return groupBlocksByStage(blocks).flatMap((group) => {
    const ids = group.blocks.map((block) => block.id);
    return ids.includes(blockId) ? moveId(ids, blockId, toIndexInStage) : ids;
  });
}
