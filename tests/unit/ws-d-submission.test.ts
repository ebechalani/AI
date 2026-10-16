import { describe, expect, it } from 'vitest';
import {
  canAddAttachment,
  FIELD_ORDER,
  fieldOf,
  initialDraft,
  isFileType,
  seedFrom,
  sentAttachments,
  splitFieldErrors,
  successTarget,
  toSubmitInput,
  type SubmissionDraft,
} from '@/components/projects/submission-form-model';
import {
  acceptAttribute,
  kindLimits,
  pickKind,
  precheck,
  registerInput,
  toActionError,
  uploadErrorView,
  type UploadErrorView,
} from '@/components/projects/upload-model';
import { ConflictError, ForbiddenError, RateLimitError, ValidationError } from '@/lib/errors';
import { parseInput } from '@/lib/schemas/common';
import { registerUploadInputSchema, submitWorkInputSchema } from '@/lib/schemas/submission';
import type { ActionError, FileKind, FileRef, SubmissionTarget } from '@/types';
import { FILE_ID, submission } from './services-fixtures';

// The submission form's model and FileUpload's rules (SPEC-D 5.1–5.3): how a draft becomes
// the action's input, where server errors go, and what the browser checks before an upload.

const TARGET: SubmissionTarget = { context: 'project', courseId: 'course-1', projectId: 'p1' };

function ref(fileId: string, kind: FileKind = 'image', fileName = 'page-1.png'): FileRef {
  return { fileId, kind, fileName, contentType: 'image/png', sizeBytes: 1234 };
}

function uuid(n: number): string {
  return `0f8fad5b-d9cb-469f-a165-70867728950${n.toString(16)}`;
}

function draft(fields: Partial<SubmissionDraft> = {}): SubmissionDraft {
  return { ...initialDraft(['text', 'code', 'link', 'image'], null), title: 'My work', ...fields };
}

// --- The draft -------------------------------------------------------------------------------

describe('initialDraft', () => {
  it('starts empty on the first allowed type', () => {
    expect(initialDraft(['link', 'text'], null)).toEqual({
      type: 'link',
      title: '',
      description: '',
      text: '',
      code: '',
      codeLanguage: '',
      linkUrl: '',
      attachments: [],
    });
  });

  it('starts a new version from the returned attempt, without its files', () => {
    const returned = submission({
      id: 's1',
      type: 'code',
      title: 'Bot',
      description: 'About',
      content: { text: null, code: 'print(1)', codeLanguage: 'python', linkUrl: null },
      attachments: [ref(FILE_ID)],
    });
    expect(initialDraft(['text', 'code'], seedFrom(returned))).toMatchObject({
      type: 'code',
      title: 'Bot',
      description: 'About',
      code: 'print(1)',
      codeLanguage: 'python',
      text: '',
      attachments: [],
    });
  });

  it('falls back to the first allowed type when the seed’s type is no longer allowed, and keeps the text', () => {
    const seed = seedFrom(submission({ id: 's1', type: 'image', title: 'Kept' }));
    const result = initialDraft(['link', 'text'], seed);
    expect(result.type).toBe('link');
    expect(result.title).toBe('Kept');
    expect(result.text).toBe('Some text');
  });
});

describe('toSubmitInput', () => {
  const filled = draft({
    text: 'A story',
    code: '  indented()\n',
    codeLanguage: 'python',
    linkUrl: '  https://example.com/work  ',
    attachments: [ref(uuid(1)), ref(uuid(2), 'pdf', 'notes.pdf')],
  });

  it('sends only the selected type’s content', () => {
    expect(toSubmitInput({ ...filled, type: 'text' }, TARGET, null).content).toEqual({
      text: 'A story',
      code: null,
      codeLanguage: null,
      linkUrl: null,
    });
    expect(toSubmitInput({ ...filled, type: 'code' }, TARGET, null).content).toEqual({
      text: null,
      code: '  indented()\n',
      codeLanguage: 'python',
      linkUrl: null,
    });
    expect(toSubmitInput({ ...filled, type: 'link' }, TARGET, null).content).toEqual({
      text: null,
      code: null,
      codeLanguage: null,
      linkUrl: 'https://example.com/work',
    });
  });

  it('turns a blank link into null and an empty language into null', () => {
    expect(
      toSubmitInput(draft({ type: 'link', linkUrl: '   ' }), TARGET, null).content.linkUrl,
    ).toBeNull();
    expect(
      toSubmitInput(draft({ type: 'code', code: 'x' }), TARGET, null).content.codeLanguage,
    ).toBeNull();
  });

  it('sends the files of the selected kind only, and none for text, code and link', () => {
    expect(toSubmitInput({ ...filled, type: 'image' }, TARGET, null).fileIds).toEqual([uuid(1)]);
    expect(toSubmitInput({ ...filled, type: 'pdf' }, TARGET, null).fileIds).toEqual([uuid(2)]);
    expect(toSubmitInput({ ...filled, type: 'text' }, TARGET, null).fileIds).toEqual([]);
  });

  it('carries the target, the previous attempt and the title as typed', () => {
    const input = toSubmitInput(draft({ title: ' Spaced ' }), TARGET, 'stu_p_c_p_1');
    expect(input.target).toEqual(TARGET);
    expect(input.previousSubmissionId).toBe('stu_p_c_p_1');
    expect(input.title).toBe(' Spaced ');
  });

  it.each([
    ['text', { type: 'text' as const, text: 'A story' }],
    ['code', { type: 'code' as const, code: 'print(1)', codeLanguage: 'python' }],
    ['link', { type: 'link' as const, linkUrl: 'https://example.com' }],
    ['image', { type: 'image' as const, attachments: [ref(FILE_ID)] }],
  ])('gives the schema a valid %s draft', (_type, fields) => {
    expect(
      parseInput(submitWorkInputSchema, toSubmitInput(draft(fields), TARGET, null)).success,
    ).toBe(true);
  });

  it.each([
    ['text', 'content.text'],
    ['image', 'fileIds'],
  ] as const)('reports an empty %s draft on %s', (type, path) => {
    const parsed = parseInput(submitWorkInputSchema, toSubmitInput(draft({ type }), TARGET, null));
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.fieldErrors[path]).toEqual(['content_required']);
  });
});

describe('field errors', () => {
  it.each([
    ['type', 'type'],
    ['title', 'title'],
    ['description', 'description'],
    ['content.text', 'text'],
    ['content.code', 'code'],
    ['content.codeLanguage', 'codeLanguage'],
    ['content.linkUrl', 'linkUrl'],
    ['fileIds', 'files'],
    ['fileIds.3', 'files'],
  ])('routes %s to %s', (path, field) => {
    expect(fieldOf(path)).toBe(field);
  });

  it.each(['_form', 'target', 'target.challengeId', 'previousSubmissionId', 'content'])(
    'keeps %s at the form level',
    (path) => {
      expect(fieldOf(path)).toBeNull();
    },
  );

  it('keeps the first key per field and gathers the form-level keys once', () => {
    expect(
      splitFieldErrors({
        title: ['required', 'too_long'],
        'fileIds.0': ['invalid'],
        fileIds: ['too_many_files'],
        _form: ['invalid'],
        'target.challengeId': ['invalid'],
      }),
    ).toEqual({ fields: { title: 'required', files: 'invalid' }, form: ['invalid'] });
    expect(splitFieldErrors(undefined)).toEqual({ fields: {}, form: [] });
  });

  it('focuses fields in their order on screen: the language before the code', () => {
    expect(FIELD_ORDER.indexOf('codeLanguage')).toBeLessThan(FIELD_ORDER.indexOf('code'));
    expect(FIELD_ORDER[0]).toBe('type');
    expect(FIELD_ORDER.at(-1)).toBe('description');
  });
});

describe('attachments', () => {
  it('knows the file types', () => {
    expect(['image', 'audio', 'video', 'pdf', 'file'].every((t) => isFileType(t as FileKind))).toBe(
      true,
    );
    expect(isFileType('text')).toBe(false);
    expect(isFileType('link')).toBe(false);
  });

  it('counts only the files of the selected kind, up to five', () => {
    const four = [1, 2, 3, 4].map((n) => ref(uuid(n)));
    expect(canAddAttachment(draft({ type: 'image', attachments: four }))).toBe(true);
    const five = [...four, ref(uuid(5))];
    expect(canAddAttachment(draft({ type: 'image', attachments: five }))).toBe(false);
    expect(sentAttachments(draft({ type: 'pdf', attachments: five }))).toEqual([]);
    expect(canAddAttachment(draft({ type: 'pdf', attachments: five }))).toBe(true);
  });
});

describe('successTarget', () => {
  it('opens the new attempt when sent from the returned attempt’s page', () => {
    expect(successTarget('/student/projects/old_1', 'old_1', 'old_2')).toEqual({
      kind: 'push',
      href: '/student/projects/old_2',
    });
  });

  it('refreshes everywhere else', () => {
    expect(successTarget('/student/learn/courses/c/lessons/l', 'old_1', 'old_2')).toEqual({
      kind: 'refresh',
    });
    expect(successTarget('/student/projects/old_1', null, 'new_1')).toEqual({ kind: 'refresh' });
    expect(successTarget('/student/challenges/ch', null, 'new_1')).toEqual({ kind: 'refresh' });
  });
});

// --- FileUpload --------------------------------------------------------------------------------

describe('pickKind', () => {
  it('lets the order of the kinds decide an ambiguous extension', () => {
    expect(pickKind(['audio', 'video'], { name: 'clip.mp4', type: 'video/mp4' })).toBe('audio');
    expect(pickKind(['video'], { name: 'clip.mp4', type: 'video/mp4' })).toBe('video');
  });

  it('reads extensions case-insensitively and accepts a typeless notebook as a file', () => {
    expect(pickKind(['image'], { name: 'IMG.JPEG', type: '' })).toBe('image');
    expect(pickKind(['file'], { name: 'notes.ipynb', type: '' })).toBe('file');
  });

  it.each(['drawing.svg', 'page.html', 'setup.exe'])('refuses %s', (name) => {
    expect(pickKind(['image', 'file', 'pdf'], { name, type: '' })).toBeNull();
  });
});

describe('precheck', () => {
  it('refuses a file over the kind’s limit', () => {
    const size = 11 * 1024 * 1024;
    expect(precheck(['image'], { name: 'big.png', type: 'image/png', size })).toEqual({
      problem: 'file_too_large',
    });
  });

  it('refuses a type the kinds do not take', () => {
    expect(precheck(['image'], { name: 'notes.txt', type: 'text/plain', size: 10 })).toEqual({
      problem: 'file_type_not_allowed',
    });
  });

  it('accepts a small image', () => {
    expect(precheck(['image'], { name: 'a.png', type: 'image/png', size: 10 })).toEqual({
      kind: 'image',
    });
  });
});

describe('the picker and its hint', () => {
  it('accepts the extensions, then the content types', () => {
    const accept = acceptAttribute(['image']).split(',');
    expect(accept).toContain('.png');
    expect(accept).toContain('image/png');
    expect(accept.indexOf('.png')).toBeLessThan(accept.indexOf('image/png'));
  });

  it('lists the types once, upper-case, with the size limit', () => {
    expect(kindLimits(['image'])).toEqual([
      { kind: 'image', types: ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF'], maxBytes: 10_485_760 },
    ]);
  });
});

describe('registerInput', () => {
  const uploaded = { fileId: FILE_ID, fileName: 'page-1.png', width: 10, height: 20 };

  it('registers learner work without a course', () => {
    const input = registerInput({ purpose: 'submission' }, 'image', uploaded);
    expect(input).toEqual({ purpose: 'submission', ...uploaded, kind: 'image' });
    expect(parseInput(registerUploadInputSchema, input).success).toBe(true);
  });

  it('carries the course of course media, null included, and never `official`', () => {
    const own = registerInput(
      { purpose: 'course_media', courseId: 'course-1', official: false },
      'image',
      uploaded,
    );
    expect(own).toMatchObject({ purpose: 'course_media', courseId: 'course-1' });
    const official = registerInput(
      { purpose: 'course_media', courseId: null, official: true },
      'image',
      uploaded,
    );
    expect(official).toMatchObject({ courseId: null });
    expect('official' in official).toBe(false);
    expect(parseInput(registerUploadInputSchema, official).success).toBe(true);
  });
});

describe('upload errors', () => {
  it('turns what uploadFile() throws into action errors', () => {
    expect(toActionError(new ValidationError('x', { file: ['file_too_large'] }))).toEqual({
      code: 'validation',
      fieldErrors: { file: ['file_too_large'] },
    });
    expect(toActionError(new ForbiddenError())).toEqual({ code: 'forbidden' });
    expect(toActionError(new Error('network'))).toEqual({ code: 'internal' });
  });

  it.each<[ActionError, 'upload' | 'register', UploadErrorView]>([
    [
      { code: 'validation', fieldErrors: { file: ['file_type_not_allowed'] } },
      'upload',
      { kind: 'validation', key: 'file_type_not_allowed' },
    ],
    [
      { code: 'validation', fieldErrors: { fileName: ['x'] } },
      'register',
      { kind: 'validation', key: 'file_name_invalid' },
    ],
    [
      { code: 'validation', fieldErrors: { file: ['made_up'] } },
      'register',
      { kind: 'validation', key: 'invalid' },
    ],
    [{ code: 'validation' }, 'register', { kind: 'validation', key: 'invalid' }],
    [{ code: 'forbidden' }, 'upload', { kind: 'projects', key: 'upload.errors.refused' }],
    [{ code: 'forbidden' }, 'register', { kind: 'error', error: { code: 'forbidden' } }],
    [{ code: 'rate_limited' }, 'register', { kind: 'projects', key: 'upload.errors.quota' }],
    [{ code: 'not_found' }, 'register', { kind: 'projects', key: 'upload.errors.notStored' }],
    [{ code: 'conflict' }, 'register', { kind: 'projects', key: 'upload.errors.retry' }],
    [{ code: 'unauthenticated' }, 'upload', { kind: 'session' }],
    [{ code: 'internal' }, 'upload', { kind: 'error', error: { code: 'internal' } }],
  ])('shows %o at the %s stage as %o', (error, stage, view) => {
    expect(uploadErrorView(error, stage)).toEqual(view);
  });

  it('keeps the codes of the server errors it does not recognise', () => {
    expect(toActionError(new RateLimitError(null))).toEqual({ code: 'rate_limited' });
    expect(toActionError(new ConflictError())).toEqual({ code: 'conflict' });
  });
});
