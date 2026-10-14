import type { TutorMode } from './ai';
import type {
  Audience,
  IsoDateString,
  LearningArea,
  Locale,
  Localized,
  MediaRef,
  Timestamped,
} from './common';
import type { HardwareCapability } from './hardware';

export type PathwayKind = 'core' | 'robotics' | 'teacher_academy';
export type PathwayAccent = 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'blue' | 'slate';

export interface Pathway extends Timestamped {
  id: string;
  order: number;
  audience: Audience;
  kind: PathwayKind;
  ageMin: number | null;
  ageMax: number | null;
  /** lucide icon name. */
  icon: string;
  accent: PathwayAccent;
  status: 'draft' | 'published';
  publishedCourseCount: number;
  defaultLocale: Locale;
  translations: Localized<{
    title: string;
    tagline: string;
    description: string;
    topics: string[];
  }>;
}

export const COURSE_STATUSES = ['draft', 'published', 'archived'] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export type CourseVisibility = 'public' | 'school' | 'private';

export const ACCESS_TIERS = ['free', 'premium'] as const;
export type AccessTier = (typeof ACCESS_TIERS)[number];

export interface Course extends Timestamped {
  id: string;
  pathwayId: string | null;
  order: number;
  ownerUid: string;
  schoolId: string | null;
  isOfficial: boolean;
  status: CourseStatus;
  visibility: CourseVisibility;
  audience: Audience;
  area: LearningArea;
  tags: string[];
  ageMin: number | null;
  ageMax: number | null;
  estimatedMinutes: number;
  accessTier: AccessTier;
  certificateEnabled: boolean;
  coverImage: MediaRef | null;
  hardwarePlatformIds: string[];
  requiredCapabilities: HardwareCapability[];
  moduleCount: number;
  lessonCount: number;
  defaultLocale: Locale;
  translations: Localized<{
    title: string;
    summary: string;
    description: string;
    outcomes: string[];
  }>;
  publishedAt: IsoDateString | null;
}

export interface Module extends Timestamped {
  id: string;
  courseId: string;
  order: number;
  lessonCount: number;
  defaultLocale: Locale;
  translations: Localized<{ title: string; description: string }>;
}

export interface Lesson extends Timestamped {
  id: string;
  courseId: string;
  moduleId: string;
  order: number;
  estimatedMinutes: number;
  xpReward: number;
  blockCount: number;
  quizIds: string[];
  projectIds: string[];
  reflectionBlockIds: string[];
  /** The lesson's rich_text bodies, cut to a fixed length per locale, for the tutor. */
  tutorExcerpt: Localized<string>;
  defaultLocale: Locale;
  translations: Localized<{ title: string; summary: string }>;
}

export const BLOCK_TYPES = [
  'rich_text',
  'image',
  'video',
  'file',
  'quiz',
  'code_activity',
  'ai_activity',
  'embed',
  'reflection',
  'project',
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

// In lesson-flow order. EARN is not a stage of a block: it is the completion panel.
export const LESSON_STAGES = [
  'discover',
  'learn',
  'watch',
  'try',
  'ask_ai',
  'build',
  'check',
  'reflect',
] as const;
export type LessonStage = (typeof LESSON_STAGES)[number];

export const VIDEO_SOURCES = ['youtube', 'vimeo', 'file'] as const;
export type VideoSource = (typeof VIDEO_SOURCES)[number];

export const CODE_LANGUAGES = ['python', 'javascript', 'blocks'] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

export const EMBED_ASPECT_RATIOS = ['16:9', '4:3', '1:1'] as const;
export type EmbedAspectRatio = (typeof EMBED_ASPECT_RATIOS)[number];

/** The translatable part of each block type. */
export interface BlockTextMap {
  /** Markdown; no raw HTML, no images. */
  rich_text: { heading: string | null; body: string };
  image: { alt: string; caption: string | null };
  video: { title: string; caption: string | null; transcript: string | null };
  file: { label: string; description: string | null };
  quiz: { intro: string | null };
  code_activity: { instructions: string; hint: string | null };
  ai_activity: { instructions: string; starterPrompt: string | null };
  embed: { title: string; caption: string | null };
  reflection: { prompt: string };
  project: { intro: string | null };
}

/** The language-neutral part of each block type. */
export interface BlockDataMap {
  rich_text: Record<string, never>;
  image: { media: MediaRef };
  video: {
    source: VideoSource;
    videoId: string | null;
    media: MediaRef | null;
    durationSeconds: number | null;
  };
  file: { media: MediaRef };
  quiz: { quizId: string };
  code_activity: { language: CodeLanguage; starterCode: string };
  ai_activity: { tutorMode: TutorMode; labToolId: string | null };
  /** The host of `url` is one of EMBED_HOSTS. */
  embed: { url: string; aspectRatio: EmbedAspectRatio };
  reflection: { minLength: number };
  project: { projectId: string };
}

export type LessonBlockOf<T extends BlockType> = {
  id: string;
  courseId: string;
  lessonId: string;
  type: T;
  stage: LessonStage;
  order: number;
  defaultLocale: Locale;
  translations: Localized<BlockTextMap[T]>;
  data: BlockDataMap[T];
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type LessonBlock = { [T in BlockType]: LessonBlockOf<T> }[BlockType];

/** Modules sorted by `order`; lessons sorted by module, then by `order`. */
export interface CourseOutline {
  course: Course;
  modules: Module[];
  lessons: Lesson[];
}
