import type { BlockType } from '@/types/content';
import { AiActivityData, AiActivityText } from './AiActivityFields';
import { CodeActivityData, CodeActivityText } from './CodeActivityFields';
import { EmbedData, EmbedText } from './EmbedFields';
import { FileData, FileText } from './FileFields';
import { ImageData, ImageText } from './ImageFields';
import { MlActivityData, MlActivityText } from './MlActivityFields';
import { ProjectBlockData, ProjectBlockText } from './ProjectBlockFields';
import { QuizBlockData, QuizBlockText } from './QuizBlockFields';
import { ReflectionData, ReflectionText } from './ReflectionFields';
import { RichTextText } from './RichTextFields';
import type { AnyBlockForms, BlockForms } from './types';
import { VideoData, VideoText } from './VideoFields';

/** One form per block type (6.3.4): adding a type is one file and one line here. */
export const BLOCK_FORMS: { [T in BlockType]: BlockForms<T> } = {
  rich_text: { Data: null, Text: RichTextText },
  image: { Data: ImageData, Text: ImageText },
  video: { Data: VideoData, Text: VideoText },
  file: { Data: FileData, Text: FileText },
  quiz: { Data: QuizBlockData, Text: QuizBlockText },
  code_activity: { Data: CodeActivityData, Text: CodeActivityText },
  ai_activity: { Data: AiActivityData, Text: AiActivityText },
  embed: { Data: EmbedData, Text: EmbedText },
  reflection: { Data: ReflectionData, Text: ReflectionText },
  project: { Data: ProjectBlockData, Text: ProjectBlockText },
  ml_activity: { Data: MlActivityData, Text: MlActivityText },
};

/**
 * The forms of a draft's type, typed loosely for the dispatch in `BlockForm`: the draft the
 * registry entry receives is the one of its own type (the registry is keyed by it).
 */
export function blockFormsOf(type: BlockType): AnyBlockForms {
  return BLOCK_FORMS[type] as unknown as AnyBlockForms;
}
