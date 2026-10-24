import { describe, expect, it } from 'vitest';
import {
  availableBlockTypes,
  blockDraftToInput,
  blockLink,
  blockSummary,
  blockToDraft,
  DEFAULT_STAGE,
  linkChoices,
  newBlockDraft,
  reorderWithinStage,
} from '@/components/course-editor/block-model';
import { extractVideoId, formatDuration, parseDuration } from '@/components/course-editor/video-model';
import { toBlockFields } from '@/lib/data/course-derive';
import { parseInput } from '@/lib/schemas/common';
import { blockInputSchema } from '@/lib/schemas/course';
import type { MediaRef } from '@/types/common';
import { BLOCK_TYPES, type BlockType, type LessonBlock } from '@/types/content';
import type { BlockInput } from '@/types/inputs';
import { SEED_COURSES } from '../../scripts/seed/content';

// The block editor's model (SPEC-F 4.8, 4.9): a stored block reads into a draft and back
// without loss, so an edit that changes nothing saves exactly what was stored.

const NOW = '2026-10-02T08:00:00.000Z';
const media: MediaRef = {
  fileId: '0f8fad5b-d9cb-469f-a165-70867728950e',
  storagePath: 'course-media/authors/u/0f8fad5b-d9cb-469f-a165-70867728950e/a.png',
  fileName: 'a.png',
  contentType: 'image/png',
  sizeBytes: 10,
  width: 1,
  height: 1,
};

function stored(input: BlockInput, id = 'b', order = 0, files = new Map<string, MediaRef>()): LessonBlock {
  return { ...toBlockFields(input, files), id, courseId: 'c', lessonId: 'l', order, createdAt: NOW, updatedAt: NOW } as LessonBlock;
}

describe('seed round trip', () => {
  it('reads every seed block into a draft and back without loss', () => {
    let count = 0;
    for (const seed of SEED_COURSES) {
      for (const courseModule of seed.modules) {
        for (const lesson of courseModule.lessons) {
          lesson.blocks.forEach((block, order) => {
            const { id, ...input } = block;
            expect(blockDraftToInput(blockToDraft(stored(input, id, order))), `${seed.id}/${lesson.id}/${id}`).toEqual(input);
            count += 1;
          });
        }
      }
    }
    expect(count).toBeGreaterThan(50);
  });

  it('round-trips media blocks to { fileId } inputs', () => {
    const files = new Map([[media.fileId, media]]);
    const image: BlockInput = { type: 'image', stage: 'learn', defaultLocale: 'en', translations: { en: { alt: 'A', caption: null } }, data: { fileId: media.fileId } };
    const file: BlockInput = { type: 'file', stage: 'learn', defaultLocale: 'en', translations: { en: { label: 'L', description: 'D' } }, data: { fileId: media.fileId } };
    const video: BlockInput = { type: 'video', stage: 'watch', defaultLocale: 'en', translations: { en: { title: 'V', caption: null, transcript: null } }, data: { source: 'file', videoId: null, fileId: media.fileId, durationSeconds: 90 } };
    for (const input of [image, file, video]) {
      const draft = blockToDraft(stored(input, 'b', 0, files));
      expect(blockDraftToInput(draft)).toEqual(input);
    }
    const draft = blockToDraft(stored(image, 'b', 0, files));
    expect(draft.type === 'image' && draft.data.media).toEqual(media);
  });

  it('keeps an entry in a language the UI does not edit', () => {
    const input: BlockInput = {
      type: 'reflection', stage: 'reflect', defaultLocale: 'en',
      translations: { en: { prompt: 'P' }, ar: { prompt: 'ع' } },
      data: { minLength: 20 },
    };
    expect(blockDraftToInput(blockToDraft(stored(input)))).toEqual(input);
  });
});

describe('new drafts', () => {
  const EXPECTED: Record<BlockType, string[]> = {
    rich_text: ['translations.en.body'],
    image: ['data.fileId', 'translations.en.alt'],
    video: ['data.videoId', 'translations.en.title'],
    file: ['data.fileId', 'translations.en.label'],
    quiz: ['data.quizId'],
    code_activity: ['translations.en.instructions'],
    ai_activity: ['translations.en.instructions'],
    embed: ['data.url', 'translations.en.title'],
    reflection: ['translations.en.prompt'],
    project: ['data.projectId'],
    ml_activity: ['translations.en.instructions', 'translations.en.title'],
  };

  it.each(BLOCK_TYPES)('%s starts in its stage and fails only on what is required', (type) => {
    const draft = newBlockDraft(type, 'en');
    expect(draft.stage).toBe(DEFAULT_STAGE[type]);
    expect(draft.defaultLocale).toBe('en');
    const parsed = parseInput(blockInputSchema, blockDraftToInput(draft));
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(Object.keys(parsed.fieldErrors).sort()).toEqual(EXPECTED[type]);
  });

  it('has the defaults of 4.8', () => {
    expect(newBlockDraft('code_activity', 'fr').data).toEqual({ language: 'python', starterCode: '' });
    expect(newBlockDraft('ai_activity', 'en').data).toEqual({ tutorMode: 'explain', labToolId: '' });
    expect(newBlockDraft('embed', 'en').data).toEqual({ url: '', aspectRatio: '16:9' });
    expect(newBlockDraft('reflection', 'en').data).toEqual({ minLength: '0' });
    expect(newBlockDraft('video', 'en').data).toEqual({ source: 'youtube', videoId: '', fileId: '', media: null, duration: '' });
    expect(newBlockDraft('ml_activity', 'en').data).toEqual({
      url: 'https://machinelearningforkids.co.uk/#!/login',
      worksheetUrl: '',
      projectType: 'text',
      codeTool: 'scratch',
      access: 'try_it_now',
    });
  });

  it('stores an ml_activity without a worksheet as null and reads it back as ""', () => {
    const draft = newBlockDraft('ml_activity', 'en');
    if (draft.type !== 'ml_activity') throw new Error('type');
    draft.text.en.title = 'Teach a computer';
    draft.text.en.instructions = '1. Open the website.';
    const input = blockDraftToInput(draft);
    expect(input.data).toMatchObject({ worksheetUrl: null });
    expect(input.translations.en).toEqual({
      title: 'Teach a computer',
      instructions: '1. Open the website.',
      bringBack: null,
      hint: null,
    });
    expect(parseInput(blockInputSchema, input).success).toBe(true);
    const worksheet = 'https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-smartclassroom-tryitnow.pdf';
    const withWorksheet = { ...input, data: { ...input.data, worksheetUrl: worksheet } } as BlockInput;
    expect(blockToDraft(stored(input)).data).toMatchObject({ worksheetUrl: '' });
    expect(blockDraftToInput(blockToDraft(stored(withWorksheet)))).toEqual(withWorksheet);
  });
});

describe('video', () => {
  it('stores the extracted id and the duration in seconds', () => {
    const draft = newBlockDraft('video', 'en');
    if (draft.type !== 'video') throw new Error('type');
    draft.data.videoId = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10';
    draft.data.duration = '3:32';
    draft.text.en.title = 'V';
    expect(blockDraftToInput(draft).data).toEqual({ source: 'youtube', videoId: 'dQw4w9WgXcQ', fileId: null, durationSeconds: 212 });
    draft.data.duration = '1:02:03';
    expect(blockDraftToInput(draft).data).toMatchObject({ durationSeconds: 3723 });
    draft.data.duration = '4:75';
    const parsed = parseInput(blockInputSchema, blockDraftToInput(draft));
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.fieldErrors).toEqual({ 'data.durationSeconds': ['invalid_number'] });
  });

  it('extracts ids from the usual link shapes', () => {
    expect(extractVideoId('youtube', 'dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('youtube', 'https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('youtube', 'http://m.youtube.com/watch?v=dQw4w9WgXcQ&list=x')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('youtube', 'https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('youtube', 'https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('youtube', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('youtube', 'https://vimeo.com/76979871')).toBeNull();
    expect(extractVideoId('youtube', 'dQw4w9WgXc')).toBeNull();
    expect(extractVideoId('vimeo', '76979871')).toBe('76979871');
    expect(extractVideoId('vimeo', 'https://vimeo.com/76979871')).toBe('76979871');
    expect(extractVideoId('vimeo', 'https://vimeo.com/channels/staffpicks/76979871')).toBe('76979871');
    expect(extractVideoId('vimeo', 'https://player.vimeo.com/video/76979871')).toBe('76979871');
    expect(extractVideoId('vimeo', 'https://example.com/76979871')).toBeNull();
    expect(extractVideoId('vimeo', '')).toBeNull();
  });

  it('formats and parses durations', () => {
    expect(formatDuration(null)).toBe('');
    expect(formatDuration(59)).toBe('0:59');
    expect(formatDuration(212)).toBe('3:32');
    expect(formatDuration(3723)).toBe('1:02:03');
    expect(parseDuration('')).toBeNull();
    expect(parseDuration('45')).toBe(45);
    expect(parseDuration('1:02:03')).toBe(3723);
    expect(parseDuration('4:75')).toBeNaN();
    expect(parseDuration('x')).toBeNaN();
  });
});

describe('order and choices', () => {
  const blocks = [
    { id: 'a', stage: 'learn', order: 0 },
    { id: 'b', stage: 'try', order: 3 },
    { id: 'c', stage: 'try', order: 4 },
    { id: 'd', stage: 'reflect', order: 7 },
  ] as const;

  it('reorders inside a stage only and flattens in stage order', () => {
    expect(reorderWithinStage(blocks, 'c', 0)).toEqual(['a', 'c', 'b', 'd']);
    expect(reorderWithinStage(blocks, 'c', 9)).toEqual(['a', 'b', 'c', 'd']);
    expect(reorderWithinStage(blocks, 'b', 1)).toEqual(['a', 'c', 'b', 'd']);
    expect(reorderWithinStage(blocks, 'a', 3)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('offers the right types and links', () => {
    expect(availableBlockTypes({ audience: 'teacher' })).toEqual(BLOCK_TYPES.filter((t) => t !== 'project'));
    expect(availableBlockTypes({ audience: 'student' })).toEqual([...BLOCK_TYPES]);
    const rows = [
      { id: 'q1', lessonId: 'l1' },
      { id: 'q2', lessonId: null },
      { id: 'q3', lessonId: 'l9' },
    ];
    expect(linkChoices(rows, 'q3').map((r) => r.id)).toEqual(['q2', 'q3']);
    expect(linkChoices(rows, null).map((r) => r.id)).toEqual(['q2']);
    expect(blockLink({ type: 'quiz', data: { quizId: 'q' } })).toEqual({ kind: 'quiz', id: 'q' });
    expect(blockLink({ type: 'project', data: { projectId: 'p' } })).toEqual({ kind: 'project', id: 'p' });
    expect(blockLink({ type: 'rich_text', data: {} })).toBeNull();
  });

  it('summarises a block in the UI language', () => {
    const lookups = {
      quizzes: { q1: { id: 'q1', lessonId: 'l', questionCount: 1, defaultLocale: 'en' as const, translations: { en: { title: 'Robot check' }, fr: { title: 'Contrôle robot' } } } },
      projects: {},
    };
    const text = stored({
      type: 'rich_text', stage: 'learn', defaultLocale: 'en',
      translations: { en: { heading: null, body: `# Title\n\nSome **bold** [link](https://x.y) text ${'x'.repeat(200)}` } },
      data: {},
    });
    const summary = blockSummary(text, 'en', lookups);
    expect(summary.startsWith('Title Some bold link text')).toBe(true);
    expect(summary.length).toBe(120);
    expect(summary.endsWith('…')).toBe(true);
    const quizBlock = stored({ type: 'quiz', stage: 'check', defaultLocale: 'en', translations: {}, data: { quizId: 'q1' } });
    expect(blockSummary(quizBlock, 'fr', lookups)).toBe('Contrôle robot');
    expect(blockSummary(quizBlock, 'en', lookups)).toBe('Robot check');
    const empty = stored({ type: 'quiz', stage: 'check', defaultLocale: 'en', translations: {}, data: { quizId: 'zz' } });
    expect(blockSummary(empty, 'en', lookups)).toBe('');
    const ml = stored({
      type: 'ml_activity', stage: 'try', defaultLocale: 'en',
      translations: {
        en: { title: 'Teach a computer', instructions: 'Steps', bringBack: null, hint: null },
        fr: { title: 'Apprends à un ordinateur', instructions: 'Étapes', bringBack: null, hint: null },
      },
      data: { url: 'https://machinelearningforkids.co.uk/#!/login', worksheetUrl: null, projectType: 'text', codeTool: 'scratch', access: 'try_it_now' },
    });
    expect(blockSummary(ml, 'fr', lookups)).toBe('Apprends à un ordinateur');
  });
});
