import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { fileSize, fileTypeLabel } from '@/components/lesson/blocks/file-meta';
import { PLACEHOLDER_VIDEO_ID, videoPlayback } from '@/components/lesson/blocks/video-source';
import { summarizeCompletion } from '@/components/lesson/completion-model';
import {
  buildChecklist,
  canEnrollFromPreview,
  lessonHrefs,
  lessonPosition,
  own,
  shortLabel,
  stepperStages,
  toRuntime,
  visibleBlocks,
} from '@/components/lesson/lesson-model';
import type {
  LessonBlock,
  LessonCompletionResult,
  LessonPlayerData,
  LessonStage,
  MediaRef,
} from '@/types';
import {
  NOW,
  badge,
  certificate,
  course,
  enrollment,
  lesson,
  outcome,
  progress,
  project,
  quiz,
  reflectionBlock,
  richTextBlock,
} from './services-fixtures';

// The pure modules of the lesson player (WS-B "player"): what it derives from LessonPlayerData,
// the completion summary, the video and file helpers, and the hygiene of the lesson catalogs.

const COURSE = 'course-1';
const LESSON = 'l1';

function block(
  id: string,
  type: LessonBlock['type'],
  stage: LessonStage,
  data: Record<string, unknown> = {},
  order = 0,
): LessonBlock {
  return {
    id,
    courseId: COURSE,
    lessonId: LESSON,
    type,
    stage,
    order,
    defaultLocale: 'en',
    translations: { en: {} },
    data,
    createdAt: NOW,
    updatedAt: NOW,
  } as unknown as LessonBlock;
}

const rich = (id: string, stage: LessonStage, order = 0) =>
  ({ ...richTextBlock(id, COURSE, LESSON), stage, order }) as LessonBlock;
const ai = (id: string, stage: LessonStage = 'ask_ai') =>
  block(id, 'ai_activity', stage, { tutorMode: 'explain', labToolId: null });
const quizBlock = (id: string, quizId: string) => block(id, 'quiz', 'check', { quizId });
const projectBlock = (id: string, projectId: string) =>
  block(id, 'project', 'build', { projectId });
const reflection = (id: string, minLength: number, prompt = 'Reflect') =>
  ({
    ...reflectionBlock(id, COURSE, LESSON, minLength),
    translations: { en: { prompt }, fr: { prompt: `FR ${prompt}` } },
  }) as LessonBlock;

function playerData(fields: Partial<LessonPlayerData> = {}): LessonPlayerData {
  const theLesson = lesson({ id: LESSON, courseId: COURSE });
  return {
    course: course({ id: COURSE }),
    modules: [],
    lessons: [theLesson],
    lesson: theLesson,
    blocks: [],
    enrollment: enrollment({ userUid: 'stu-1', courseId: COURSE }),
    progress: null,
    quizzes: {},
    latestAttempts: {},
    attemptsRemaining: {},
    projects: {},
    latestSubmissions: {},
    previousLessonId: null,
    nextLessonId: null,
    readOnly: false,
    tutorEnabled: true,
    ...fields,
  };
}

describe('visibleBlocks and stepperStages', () => {
  const blocks = [
    reflection('b6', 20),
    rich('b1', 'discover'),
    ai('b5'),
    quizBlock('b4', 'q1'),
    projectBlock('b3', 'p1'),
    rich('b2', 'learn'),
  ];

  it('lists the stages with blocks in lesson-flow order, then earn', () => {
    expect(stepperStages(visibleBlocks(blocks, true))).toEqual([
      'discover',
      'learn',
      'ask_ai',
      'build',
      'check',
      'reflect',
      'earn',
    ]);
  });

  it('keeps every block when the tutor is enabled', () => {
    expect(visibleBlocks(blocks, true)).toHaveLength(blocks.length);
  });

  it('drops AI activities when the tutor is off, and their stage with them', () => {
    const shown = visibleBlocks(blocks, false);
    expect(shown.map((b) => b.id)).toEqual(['b6', 'b1', 'b4', 'b3', 'b2']);
    expect(stepperStages(shown)).not.toContain('ask_ai');
  });

  it('keeps a stage that holds more than the AI activity', () => {
    const shown = visibleBlocks([ai('a1', 'try'), rich('r1', 'try')], false);
    expect(stepperStages(shown)).toEqual(['try', 'earn']);
  });

  it('always keeps quiz and project blocks', () => {
    const shown = visibleBlocks([quizBlock('q', 'q1'), projectBlock('p', 'p1')], false);
    expect(shown).toHaveLength(2);
  });

  it('has only earn for a lesson without blocks', () => {
    expect(stepperStages([])).toEqual(['earn']);
  });
});

describe('lessonHrefs and lessonPosition', () => {
  it('builds the links from the ids the service computed', () => {
    expect(lessonHrefs('/student/learn/courses/c/lessons', 'm1-l1', 'm2-l1')).toEqual({
      previousHref: '/student/learn/courses/c/lessons/m1-l1',
      nextHref: '/student/learn/courses/c/lessons/m2-l1',
    });
  });

  it('answers null at either end of the course', () => {
    expect(lessonHrefs('/preview/c/lessons', null, 'l2')).toEqual({
      previousHref: null,
      nextHref: '/preview/c/lessons/l2',
    });
    expect(lessonHrefs('/preview/c/lessons', 'l1', null).nextHref).toBeNull();
  });

  it('places the lesson in the sorted outline, 1-based', () => {
    const lessons = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    expect(lessonPosition(lessons, 'b')).toEqual({ current: 2, total: 4 });
    expect(lessonPosition(lessons, 'a')).toEqual({ current: 1, total: 4 });
  });
});

describe('toRuntime', () => {
  it('maps the saved responses to their text and copies the server flags', () => {
    const runtime = toRuntime(
      playerData({
        readOnly: true,
        tutorEnabled: false,
        progress: progress({
          id: LESSON,
          userUid: 'stu-1',
          courseId: COURSE,
          responses: { b4: { text: 'say [hi]', updatedAt: NOW } },
        }),
      }),
    );
    expect(runtime).toMatchObject({
      courseId: COURSE,
      lessonId: LESSON,
      readOnly: true,
      tutorEnabled: false,
      responses: { b4: 'say [hi]' },
    });
  });

  it('has no responses without a progress document', () => {
    expect(toRuntime(playerData()).responses).toEqual({});
  });
});

describe('own', () => {
  it('never reads the prototype', () => {
    expect(own({}, 'constructor')).toBeUndefined();
    expect(own({ a: 1 }, 'a')).toBe(1);
  });
});

describe('buildChecklist', () => {
  const theLesson = lesson({
    id: LESSON,
    courseId: COURSE,
    quizIds: ['q1'],
    projectIds: ['p1'],
    reflectionBlockIds: ['r1'],
  });
  const quizzes = { q1: quiz({ id: 'q1', courseId: COURSE, maxAttempts: 2 }) };
  const projects = { p1: project({ id: 'p1', courseId: COURSE }) };
  const blocks = [quizBlock('bq', 'q1'), projectBlock('bp', 'p1'), reflection('r1', 20)];

  function checklist(fields: Partial<LessonPlayerData> = {}, locale = 'en') {
    return buildChecklist(
      playerData({ lesson: theLesson, lessons: [theLesson], blocks, quizzes, projects, ...fields }),
      locale,
    );
  }

  const withResponse = (text: string) =>
    progress({
      id: LESSON,
      userUid: 'stu-1',
      courseId: COURSE,
      responses: { r1: { text, updatedAt: NOW } },
    });

  it('lists quiz, project and reflection in that order, with labels and anchors', () => {
    expect(checklist()).toEqual([
      { kind: 'quiz', id: 'q1', anchor: 'block-bq', label: 'Quiz q1', done: false },
      { kind: 'project', id: 'p1', anchor: 'block-bp', label: 'Project p1', done: false },
      {
        kind: 'reflection',
        id: 'r1',
        anchor: 'block-r1',
        label: 'Reflect',
        minLength: 20,
        done: false,
      },
    ]);
  });

  it('takes labels in the viewer’s locale', () => {
    const items = checklist({}, 'fr');
    expect(items[2]?.label).toBe('FR Reflect');
  });

  it('marks a passed quiz done, and one whose attempts are used up', () => {
    const passed = enrollment({
      userUid: 'stu-1',
      courseId: COURSE,
      quizSummary: { q1: { attempts: 1, passed: true, bestPercent: 90, lastPercent: 90 } },
    });
    expect(checklist({ enrollment: passed })[0]?.done).toBe(true);

    const exhausted = enrollment({
      userUid: 'stu-1',
      courseId: COURSE,
      quizSummary: { q1: { attempts: 2, passed: false, bestPercent: 40, lastPercent: 40 } },
    });
    expect(checklist({ enrollment: exhausted })[0]?.done).toBe(true);

    const tried = enrollment({
      userUid: 'stu-1',
      courseId: COURSE,
      quizSummary: { q1: { attempts: 1, passed: false, bestPercent: 40, lastPercent: 40 } },
    });
    expect(checklist({ enrollment: tried })[0]?.done).toBe(false);
  });

  it('marks a submitted project done, whatever its review', () => {
    const submitted = enrollment({
      userUid: 'stu-1',
      courseId: COURSE,
      projectSummary: {
        p1: { attempts: 1, latestSubmissionId: 's1', latestStatus: 'submitted' },
      },
    });
    expect(checklist({ enrollment: submitted })[1]?.done).toBe(true);
  });

  it('measures a reflection by its trimmed length against minLength', () => {
    expect(checklist({ progress: withResponse('too short') })[2]?.done).toBe(false);
    expect(checklist({ progress: withResponse(`   ${'x'.repeat(19)}   `) })[2]?.done).toBe(false);
    expect(checklist({ progress: withResponse('x'.repeat(20)) })[2]?.done).toBe(true);
  });

  it('marks everything done once the lesson is completed', () => {
    const completed = progress({
      id: LESSON,
      userUid: 'stu-1',
      courseId: COURSE,
      status: 'completed',
      completedAt: NOW,
    });
    expect(checklist({ progress: completed }).every((item) => item.done)).toBe(true);
  });

  it('survives a missing definition or block: empty label, no anchor, no crash', () => {
    const items = checklist({ quizzes: {}, projects: {}, blocks: [] });
    expect(items.map((item) => [item.label, item.anchor])).toEqual([
      ['', null],
      ['', null],
      ['', null],
    ]);
    expect(items[2]?.minLength).toBe(0);
  });

  it('treats a quiz id like "constructor" as an ordinary missing id', () => {
    const odd = lesson({ id: LESSON, courseId: COURSE, quizIds: ['constructor'] });
    const items = buildChecklist(playerData({ lesson: odd, lessons: [odd] }), 'en');
    expect(items).toEqual([
      { kind: 'quiz', id: 'constructor', anchor: null, label: '', done: false },
    ]);
  });

  it('works for a visitor without an enrollment', () => {
    expect(checklist({ enrollment: null }).every((item) => !item.done)).toBe(true);
  });
});

describe('shortLabel', () => {
  it('keeps a short prompt and cuts a long one to 80 characters with an ellipsis', () => {
    expect(shortLabel('  Where did you meet AI today?  ')).toBe('Where did you meet AI today?');
    const cut = shortLabel('word '.repeat(40));
    expect(Array.from(cut).length).toBeLessThanOrEqual(80);
    expect(cut).not.toMatch(/\s…$/);
    expect(cut.endsWith('…')).toBe(true);
    expect(Array.from(shortLabel('x'.repeat(80)))).toHaveLength(80);
  });
});

describe('canEnrollFromPreview', () => {
  it('lets a student enrol in a student course and a teacher in a teacher course only', () => {
    expect(canEnrollFromPreview('student', 'student')).toBe(true);
    expect(canEnrollFromPreview('teacher', 'teacher')).toBe(true);
    expect(canEnrollFromPreview('student', 'teacher')).toBe(false);
    expect(canEnrollFromPreview('teacher', 'student')).toBe(false);
    expect(canEnrollFromPreview('school_admin', 'student')).toBe(false);
    expect(canEnrollFromPreview('platform_admin', 'teacher')).toBe(false);
  });
});

describe('summarizeCompletion', () => {
  const active = enrollment({ userUid: 'stu-1', courseId: COURSE });
  const finished = enrollment({
    userUid: 'stu-1',
    courseId: COURSE,
    status: 'completed',
    progressPercent: 100,
    completedAt: NOW,
    certificateId: 'stu-1_course-1',
  });
  const result = (fields: Partial<LessonCompletionResult>): LessonCompletionResult => ({
    completed: true,
    missing: { quizIds: [], projectIds: [], reflectionBlockIds: [] },
    enrollment: active,
    gamification: outcome(),
    ...fields,
  });

  it('reports the XP of a fresh completion', () => {
    expect(summarizeCompletion(result({}), false)).toEqual({
      xpAwarded: 50,
      rewardsPending: false,
      leveledUp: false,
      level: 1,
      newBadges: [],
      certificateId: null,
      courseJustCompleted: false,
    });
  });

  it('marks rewards pending when no outcome came back (failed handler or already completed)', () => {
    const summary = summarizeCompletion(result({ gamification: null }), false);
    expect(summary).toMatchObject({ xpAwarded: 0, rewardsPending: true, level: null });
  });

  it('is not pending for an outcome that awarded nothing (the ledger entry already existed)', () => {
    const summary = summarizeCompletion(result({ gamification: outcome({ xpAwarded: 0 }) }), false);
    expect(summary).toMatchObject({ xpAwarded: 0, rewardsPending: false });
  });

  it('passes the level-up and the new badges on', () => {
    const won = badge({ id: 'ai-explorer' });
    const summary = summarizeCompletion(
      result({ gamification: outcome({ leveledUp: true, level: 2, newBadges: [won] }) }),
      false,
    );
    expect(summary).toMatchObject({ leveledUp: true, level: 2, newBadges: [won] });
  });

  it('names the certificate only when this lesson finished the course', () => {
    const issued = certificate({ id: 'cert-1' });
    const fromOutcome = summarizeCompletion(
      result({ enrollment: finished, gamification: outcome({ certificate: issued }) }),
      false,
    );
    expect(fromOutcome).toMatchObject({ courseJustCompleted: true, certificateId: 'cert-1' });

    const fromEnrollment = summarizeCompletion(result({ enrollment: finished }), false);
    expect(fromEnrollment.certificateId).toBe('stu-1_course-1');

    const before = summarizeCompletion(
      result({ enrollment: finished, gamification: outcome({ certificate: issued }) }),
      true,
    );
    expect(before).toMatchObject({ courseJustCompleted: false, certificateId: null });
  });

  it('has no certificate when the finished course issues none', () => {
    const summary = summarizeCompletion(
      result({ enrollment: { ...finished, certificateId: null } }),
      false,
    );
    expect(summary).toMatchObject({ courseJustCompleted: true, certificateId: null });
  });
});

describe('videoPlayback', () => {
  const media: MediaRef = {
    fileId: 'file-123',
    storagePath: 'course-media/school/s1/file-123/clip.mp4',
    fileName: 'clip.mp4',
    contentType: 'video/mp4',
    sizeBytes: 1000,
    width: null,
    height: null,
  };

  it('shows the seed placeholders as unavailable', () => {
    expect(PLACEHOLDER_VIDEO_ID.test('RoboHolic01')).toBe(true);
    expect(videoPlayback({ source: 'youtube', videoId: 'RoboHolic01', media: null })).toEqual({
      kind: 'unavailable',
    });
  });

  it('embeds a YouTube id through youtube-nocookie', () => {
    expect(videoPlayback({ source: 'youtube', videoId: 'dQw4w9WgXcQ', media: null })).toEqual({
      kind: 'embed',
      src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    });
  });

  it('embeds a Vimeo id', () => {
    expect(videoPlayback({ source: 'vimeo', videoId: '76979871', media: null })).toEqual({
      kind: 'embed',
      src: 'https://player.vimeo.com/video/76979871',
    });
  });

  it('is unavailable without an id', () => {
    expect(videoPlayback({ source: 'vimeo', videoId: null, media: null }).kind).toBe('unavailable');
    expect(videoPlayback({ source: 'youtube', videoId: '', media: null }).kind).toBe('unavailable');
  });

  it('plays an uploaded file through the file route, or is unavailable without one', () => {
    expect(videoPlayback({ source: 'file', videoId: null, media })).toEqual({
      kind: 'file',
      src: '/api/files/file-123',
    });
    expect(videoPlayback({ source: 'file', videoId: null, media: null }).kind).toBe('unavailable');
  });
});

describe('fileTypeLabel and fileSize', () => {
  it('names the type by the extension, else by the content type', () => {
    expect(fileTypeLabel('worksheet.pdf', 'application/pdf')).toBe('PDF');
    expect(fileTypeLabel('robot.sb3', 'application/x.scratch.sb3')).toBe('SB3');
    expect(fileTypeLabel('notes', 'text/plain')).toBe('TXT');
    expect(fileTypeLabel('photo', 'image/png')).toBe('PNG');
    expect(fileTypeLabel('odd', 'application/constructor')).toBe('CONSTRUCTOR');
    expect(fileTypeLabel('archive', 'application/x-zip')).toBe('ZIP');
    expect(fileTypeLabel('blob', 'application/octet-stream')).toBe('');
  });

  it('uses kilobytes below a megabyte and one decimal', () => {
    expect(fileSize(0)).toEqual({ unit: 'kilobytes', value: 0 });
    expect(fileSize(20)).toEqual({ unit: 'kilobytes', value: 0.1 });
    expect(fileSize(1536)).toEqual({ unit: 'kilobytes', value: 1.5 });
    expect(fileSize(500 * 1024)).toEqual({ unit: 'kilobytes', value: 500 });
  });

  it('switches to megabytes once the kilobytes would read 1024', () => {
    expect(fileSize(1024 * 1024 - 1)).toEqual({ unit: 'megabytes', value: 1 });
    expect(fileSize(2.25 * 1024 * 1024)).toEqual({ unit: 'megabytes', value: 2.3 });
    expect(fileSize(Number.NaN)).toEqual({ unit: 'kilobytes', value: 0 });
  });
});

// --- Catalog hygiene (SPEC 1.7) ----------------------------------------------------------------

const MESSAGES_DIR = path.join(import.meta.dirname, '..', '..', 'src', 'messages');

function leaves(node: unknown, prefix = ''): [string, string][] {
  if (typeof node === 'string') return [[prefix, node]];
  if (typeof node !== 'object' || node === null) return [];
  return Object.entries(node).flatMap(([key, value]) =>
    leaves(value, prefix ? `${prefix}.${key}` : key),
  );
}

function rawCatalog(locale: string): string {
  return readFileSync(path.join(MESSAGES_DIR, locale, 'lesson.json'), 'utf8');
}

describe.each(['en', 'fr'])('lesson catalog (%s)', (locale) => {
  const entries = leaves(JSON.parse(rawCatalog(locale)));

  it('uses typographic apostrophes and balanced braces', () => {
    for (const [key, value] of entries) {
      expect(value, key).not.toMatch(/'/);
      expect(value, key).toMatch(/^[^{}]*(\{[^{}]*(\{[^{}]*\}[^{}]*)*\}[^{}]*)*$/);
    }
  });

  it('has the same keys as the English catalog', () => {
    const english = leaves(JSON.parse(rawCatalog('en'))).map(([key]) => key);
    expect(entries.map(([key]) => key)).toEqual(english);
  });

  it('writes French no-break spaces, as visible escapes', () => {
    if (locale !== 'fr') return;
    for (const [key, value] of entries) expect(value, key).not.toMatch(/\S [?!:;]/);
    const raw = rawCatalog('fr');
    expect(raw.includes(' ')).toBe(false);
    expect(raw).toContain('\\u00a0');
  });
});
