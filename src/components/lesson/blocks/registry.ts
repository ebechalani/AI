import type { ComponentType } from 'react';
import type { BlockType, LessonBlockOf } from '@/types/content';
import type { Project, Submission } from '@/types/project';
import type { Quiz, QuizAttempt } from '@/types/quiz';
import { AiActivityBlock } from './AiActivityBlock';
import { CodeActivityBlock } from './CodeActivityBlock';
import { EmbedBlock } from './EmbedBlock';
import { FileBlock } from './FileBlock';
import { ImageBlock } from './ImageBlock';
import { ProjectBlock } from './ProjectBlock';
import { QuizBlock } from './QuizBlock';
import { ReflectionBlock } from './ReflectionBlock';
import { RichTextBlock } from './RichTextBlock';
import { VideoBlock } from './VideoBlock';

/** What every block of a lesson receives from LessonPlayer (ARCHITECTURE.md 7.6). */
export interface LessonRuntime {
  courseId: string;
  lessonId: string;
  readOnly: boolean;
  tutorEnabled: boolean;
  /** By block id. */
  responses: Record<string, string>;
  quizzes: Record<string, Quiz>;
  /** The student projection of 3.4: no results. */
  latestAttempts: Record<string, QuizAttempt | null>;
  attemptsRemaining: Record<string, number | null>;
  projects: Record<string, Project>;
  latestSubmissions: Record<string, Submission | null>;
}

export interface BlockRendererProps<T extends BlockType = BlockType> {
  block: LessonBlockOf<T>;
  runtime: LessonRuntime;
}

export const BLOCK_RENDERERS: { [T in BlockType]: ComponentType<BlockRendererProps<T>> } = {
  rich_text: RichTextBlock,
  image: ImageBlock,
  video: VideoBlock,
  file: FileBlock,
  quiz: QuizBlock,
  code_activity: CodeActivityBlock,
  ai_activity: AiActivityBlock,
  embed: EmbedBlock,
  reflection: ReflectionBlock,
  project: ProjectBlock,
};
