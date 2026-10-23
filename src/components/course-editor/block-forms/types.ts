import type { ComponentType } from 'react';
import type { Locale } from '@/types/common';
import type { BlockType } from '@/types/content';
import type { BlockDraft, BlockDraftOf, DataDraftMap, TextFieldOf } from '../block-model';
import type { EditorMode } from '../paths';
import type { ProjectRow, QuizRow } from '../rows';

// The contract of one block type's form (6.3.4): a language-neutral `Data` part and a `Text`
// part rendered once per language. Adding a block type is one file and one registry line.

export interface BlockFormContext {
  courseId: string;
  lessonId: string;
  mode: EditorMode;
  /** Uploads go to the official media prefix (1.2). */
  official: boolean;
  quizzes: QuizRow[];
  projects: ProjectRow[];
  /** The quiz or project this block already uses (kept in the choices). */
  currentLinkId: string | null;
  /** A course for teachers: no AI Lab tool (the lab is a student area). */
  teacherCourse: boolean;
}

export interface BlockDataProps<T extends BlockType> {
  draft: BlockDraftOf<T>;
  onChange(next: BlockDraftOf<T>): void;
  errors(path: string): string | undefined;
  context: BlockFormContext;
  disabled: boolean;
}

export interface BlockTextProps<T extends BlockType> extends BlockDataProps<T> {
  locale: Locale;
  /** The shown language is the block's default one. */
  required: boolean;
}

export interface BlockForms<T extends BlockType> {
  Data: ComponentType<BlockDataProps<T>> | null;
  Text: ComponentType<BlockTextProps<T>>;
}

/** The draft with one text field of one language replaced. */
export function withText<T extends BlockType>(
  draft: BlockDraftOf<T>,
  locale: Locale,
  field: TextFieldOf<T>,
  value: string,
): BlockDraftOf<T> {
  return {
    ...draft,
    text: { ...draft.text, [locale]: { ...draft.text[locale], [field]: value } },
  };
}

/** The draft with part of its data replaced. */
export function withData<T extends BlockType>(
  draft: BlockDraftOf<T>,
  data: Partial<DataDraftMap[T]>,
): BlockDraftOf<T> {
  return { ...draft, data: { ...draft.data, ...data } };
}

/** The registry's loose view of any block form, for the dispatch in `BlockForm`. */
export interface AnyBlockForms {
  Data: ComponentType<BlockDataProps<BlockType> & { draft: BlockDraft }> | null;
  Text: ComponentType<BlockTextProps<BlockType> & { draft: BlockDraft }>;
}
