import { beforeEach, describe, expect, it, vi } from 'vitest';
import { suggestReview, type AiReviewInput, type AiReviewOutput } from '@/lib/ai/grading';
import { AiError } from '@/lib/ai/types';
import { SYSTEM_ACTOR, type Actor } from '@/lib/auth/actor';
import { canViewAiReview, canViewSubmission } from '@/lib/auth/authz';
import { checkAndCountAiUsage, recordAiBlocked, recordAiTokens } from '@/lib/data/ai-usage';
import { writeAudit } from '@/lib/data/audit';
import { getChallenge } from '@/lib/data/challenges';
import { getCourse } from '@/lib/data/courses';
import { getEnrollment } from '@/lib/data/enrollments';
import {
  checkAndCountUpload,
  deleteFile,
  getFile,
  getOwnFiles,
  registerFile,
} from '@/lib/data/files';
import { getProject } from '@/lib/data/projects';
import {
  addReview,
  createSubmission,
  getAiReview,
  getSubmission,
  listReviews,
  markAiReturned,
  markAiReviewed,
  removeAttachment,
  saveAiReview,
  setAiReviewPending,
  setAiReviewSkipped,
} from '@/lib/data/submissions';
import { getUser } from '@/lib/data/users';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from '@/lib/errors';
import { clearDownloadTokens, deleteObject, statObject } from '@/lib/firebase/storage-admin';
import { onSubmissionAccepted } from '@/lib/gamification/events';
import { AI_LIMITS } from '@/lib/limits';
import { getCourseAccess } from '@/lib/services/access';
import { resolveClassContext } from '@/lib/services/classroom';
import { weightedScore } from '@/lib/services/internal-common';
import {
  deleteAttachment,
  generateAiReview,
  getFileForDownload,
  getSubmissionForViewer,
  regenerateAiReview,
  registerUpload,
  reviewSubmission,
  submitWork,
} from '@/lib/services/project-flow';
import type { AiReview, Course, FileRecord, Submission, SubmitWorkInput } from '@/types';
import {
  aiReview,
  challenge,
  course,
  enrollment,
  FILE_ID,
  fileRecord,
  outcome,
  profile,
  project,
  session,
  submission,
} from './services-fixtures';

// services/project-flow over mocked repositories, Storage and AI layer: the upload
// registration steps of 5.2, the submission rules of 3.4, the AI review flow of 8.4 and 9.4
// (usage, skipped, failed, the unsupervised closing), the review gating of 10.3 and the repair
// paths of getSubmissionForViewer. Submissions keep their authorization answer (one the actor
// cannot see is not found), so the no-oracle rule is exercised too.

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(() => {
    throw new Error('Firestore was reached.');
  }),
}));
vi.mock('@/lib/ai/grading', () => ({ suggestReview: vi.fn() }));
vi.mock('@/lib/ai/index', () => ({ getAiProvider: vi.fn(() => ({ id: 'mock' })) }));
vi.mock('@/lib/data/ai-usage', () => ({
  checkAndCountAiUsage: vi.fn(),
  recordAiBlocked: vi.fn(),
  recordAiTokens: vi.fn(),
}));
vi.mock('@/lib/data/audit', () => ({ writeAudit: vi.fn() }));
vi.mock('@/lib/data/challenges', () => ({ getChallenge: vi.fn() }));
vi.mock('@/lib/data/courses', () => ({ getCourse: vi.fn() }));
vi.mock('@/lib/data/enrollments', () => ({ getEnrollment: vi.fn() }));
vi.mock('@/lib/data/files', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/data/files')>()),
  checkAndCountUpload: vi.fn(),
  deleteFile: vi.fn(),
  getFile: vi.fn(),
  getOwnFiles: vi.fn(),
  registerFile: vi.fn(),
}));
vi.mock('@/lib/data/projects', () => ({ getProject: vi.fn() }));
vi.mock('@/lib/data/submissions', () => ({
  addReview: vi.fn(),
  createSubmission: vi.fn(),
  getAiReview: vi.fn(),
  getSubmission: vi.fn(),
  listReviews: vi.fn(),
  markAiReturned: vi.fn(),
  markAiReviewed: vi.fn(),
  removeAttachment: vi.fn(),
  saveAiReview: vi.fn(),
  setAiReviewPending: vi.fn(),
  setAiReviewSkipped: vi.fn(),
}));
vi.mock('@/lib/data/users', () => ({ getUser: vi.fn() }));
vi.mock('@/lib/firebase/storage-admin', () => ({
  clearDownloadTokens: vi.fn(),
  deleteObject: vi.fn(),
  statObject: vi.fn(),
}));
vi.mock('@/lib/gamification/events', () => ({ onSubmissionAccepted: vi.fn() }));
vi.mock('@/lib/services/access', () => ({ getCourseAccess: vi.fn() }));
vi.mock('@/lib/services/classroom', () => ({ resolveClassContext: vi.fn() }));

const student = session('student', 'student-1', 'school-a', ['class-a']);
const loner = session('student', 'student-9');
const teacher = session('teacher', 'teacher-1', 'school-a', ['class-a']);
const otherTeacher = session('teacher', 'teacher-2', 'school-a', ['class-b']);
const schoolAdmin = session('school_admin', 'admin-a', 'school-a');
const platformAdmin = session('platform_admin', 'root');

const studentCourse = course({ id: 'course-1' });
const projectP1 = project({ id: 'p1', courseId: 'course-1' });
const openChallenge = challenge({ id: 'ch-1' });

interface World {
  submissions: Map<string, Submission>;
  aiReviews: Map<string, AiReview>;
  usageAllowed: boolean;
}
let world: World;

function store(doc: Submission): Submission {
  world.submissions.set(doc.id, doc);
  return doc;
}

function patch(submissionId: string, fields: Partial<Submission>): Submission {
  const current = world.submissions.get(submissionId);
  if (current === undefined) throw new NotFoundError(`submissions/${submissionId}`);
  return store({ ...current, ...fields });
}

function readyOutput(fields: Partial<AiReviewOutput> = {}): AiReviewOutput {
  const criterion = (score: number) => ({ score, comment: 'ok' });
  return {
    criteria: {
      creativity: criterion(80),
      technicalQuality: criterion(60),
      understanding: criterion(70),
      responsibleAi: criterion(90),
    },
    overallSuggestedScore: 75,
    writtenFeedback: 'Nice work.',
    strengths: ['Clear'],
    improvements: ['More tests'],
    confidence: 'medium',
    limitations: [],
    flags: [],
    provider: 'mock',
    model: 'mock-1',
    promptVersion: 'grading-1',
    usage: { inputTokens: 120, outputTokens: 60 },
    ...fields,
  };
}

const work = (fields: Partial<SubmitWorkInput> = {}): SubmitWorkInput & { locale: 'en' } => ({
  target: { context: 'project', courseId: 'course-1', projectId: 'p1' },
  title: 'My robot',
  description: 'It follows a line.',
  type: 'text',
  content: { text: 'I built a line follower.', linkUrl: null, code: null, codeLanguage: null },
  fileIds: [],
  previousSubmissionId: null,
  locale: 'en',
  ...fields,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  world = { submissions: new Map(), aiReviews: new Map(), usageAllowed: true };

  vi.mocked(getCourse).mockResolvedValue(studentCourse);
  vi.mocked(getCourseAccess).mockResolvedValue({ allowed: true, via: 'free' });
  vi.mocked(getEnrollment).mockImplementation(async (_actor, userUid, courseId) =>
    userUid === 'student-1' || userUid === 'student-9'
      ? enrollment({ userUid, courseId, classId: userUid === 'student-1' ? 'class-a' : null })
      : null,
  );
  vi.mocked(getProject).mockResolvedValue(projectP1);
  vi.mocked(getChallenge).mockResolvedValue(openChallenge);
  vi.mocked(getOwnFiles).mockResolvedValue([]);
  vi.mocked(resolveClassContext).mockImplementation(async (uid) =>
    uid === 'student-1'
      ? { classId: 'class-a', schoolId: 'school-a' }
      : { classId: null, schoolId: null },
  );
  vi.mocked(getUser).mockImplementation(async (_actor, uid) =>
    profile({ id: uid, schoolId: uid === 'student-1' ? 'school-a' : null }),
  );

  vi.mocked(getSubmission).mockImplementation(async (actor: Actor, submissionId: string) => {
    const found = world.submissions.get(submissionId);
    if (found === undefined || !canViewSubmission(actor, found)) {
      throw new NotFoundError(`submissions/${submissionId}`);
    }
    return found;
  });
  vi.mocked(getAiReview).mockImplementation(async (actor, submissionId, aiReviewId) => {
    const found = world.submissions.get(submissionId);
    if (found === undefined || !canViewSubmission(actor, found)) throw new NotFoundError('s');
    if (!canViewAiReview(actor, found)) throw new ForbiddenError('ai');
    const review = world.aiReviews.get(aiReviewId);
    if (review === undefined) throw new NotFoundError(`aiReviews/${aiReviewId}`);
    return review;
  });
  vi.mocked(listReviews).mockResolvedValue([]);
  vi.mocked(createSubmission).mockImplementation(async (_actor, input) =>
    store(
      submission({
        id:
          input.target.context === 'project'
            ? `${input.studentUid}_p_${input.target.courseId}_${input.target.projectId}_1`
            : `${input.studentUid}_c_${input.target.challengeId}_1`,
        studentUid: input.studentUid,
        studentName: input.studentName,
        classId: input.classId,
        schoolId: input.schoolId,
        context: input.target.context,
        courseId: input.target.context === 'project' ? input.target.courseId : null,
        projectId: input.target.context === 'project' ? input.target.projectId : null,
        challengeId: input.target.context === 'challenge' ? input.target.challengeId : null,
        lessonId: input.lessonId,
        contextTitle: input.contextTitle,
        rubric: input.rubric,
        title: input.title,
        description: input.description,
        type: input.type,
        content: input.content,
        attachments: input.attachments,
        locale: input.locale,
      }),
    ),
  );
  vi.mocked(saveAiReview).mockImplementation(async (_actor, submissionId, review) => {
    const id = `ai-${world.aiReviews.size + 1}`;
    const saved: AiReview = { ...review, id, submissionId, createdAt: '2026-10-02T08:05:00.000Z' };
    world.aiReviews.set(id, saved);
    patch(submissionId, { latestAiReviewId: id, aiReviewStatus: review.status });
    return saved;
  });
  vi.mocked(setAiReviewSkipped).mockImplementation(async (_actor, submissionId) => {
    patch(submissionId, { aiReviewStatus: 'skipped' });
  });
  vi.mocked(setAiReviewPending).mockImplementation(async (_actor, submissionId) => {
    const current = world.submissions.get(submissionId)!;
    if (current.aiRegenerations >= AI_LIMITS.review.maxRegenerations) {
      if (current.aiReviewStatus === 'pending') patch(submissionId, { aiReviewStatus: 'failed' });
      throw new ConflictError('limit');
    }
    patch(submissionId, {
      aiReviewStatus: 'pending',
      aiRegenerations: current.aiRegenerations + 1,
    });
  });
  vi.mocked(markAiReviewed).mockImplementation(async (_actor, submissionId) => {
    const current = world.submissions.get(submissionId)!;
    if (current.classId !== null) throw new ConflictError('supervised');
    return patch(submissionId, { status: 'ai_reviewed', effectsApplied: false });
  });
  vi.mocked(markAiReturned).mockImplementation(async (_actor, submissionId) =>
    patch(submissionId, { status: 'returned' }),
  );
  vi.mocked(addReview).mockImplementation(async (actor, submissionId, input) => {
    const accepted = input.decision !== 'return';
    return patch(submissionId, {
      status: accepted ? 'approved' : 'returned',
      finalScore: input.score,
      finalCriteria: input.criteria,
      finalFeedback: input.feedback,
      reviewedByUid: 'uid' in actor ? actor.uid : null,
      effectsApplied: !accepted,
    });
  });
  vi.mocked(onSubmissionAccepted).mockImplementation(async (_uid, ctx) => {
    patch(ctx.submissionId, { effectsApplied: true, xpAwarded: ctx.xpReward });
    return outcome({ xpAwarded: ctx.xpReward });
  });
  vi.mocked(checkAndCountAiUsage).mockImplementation(async () =>
    world.usageAllowed
      ? { allowed: true, reason: 'ok', remainingToday: 4, retryAfterSeconds: null }
      : { allowed: false, reason: 'limit', remainingToday: 0, retryAfterSeconds: 3600 },
  );
  vi.mocked(suggestReview).mockResolvedValue(readyOutput());

  vi.mocked(statObject).mockResolvedValue({
    contentType: 'image/png',
    sizeBytes: 2048,
    createdAt: '2026-10-02T08:00:00.000Z',
  });
  vi.mocked(checkAndCountUpload).mockResolvedValue({ allowed: true });
  vi.mocked(registerFile).mockImplementation(async (_actor, input) =>
    fileRecord({ ...input, submissionId: null, createdAt: '2026-10-02T08:00:00.000Z' }),
  );
});

// --- registerUpload ----------------------------------------------------------------------------

describe('registerUpload', () => {
  const upload = {
    fileId: FILE_ID,
    kind: 'image' as const,
    fileName: 'photo.png',
    width: 640,
    height: 480,
  };

  it('registers a submission file under the session uid with what Storage reports', async () => {
    const result = await registerUpload(student, { ...upload, purpose: 'submission' });
    const path = `user-uploads/student-1/image/${FILE_ID}/photo.png`;
    expect(statObject).toHaveBeenCalledWith(path);
    expect(checkAndCountUpload).toHaveBeenCalledWith(student, 2048);
    expect(clearDownloadTokens).toHaveBeenCalledWith(path);
    expect(registerFile).toHaveBeenCalledWith(SYSTEM_ACTOR, {
      id: FILE_ID,
      ownerUid: 'student-1',
      schoolId: 'school-a',
      purpose: 'submission',
      kind: 'image',
      storagePath: path,
      fileName: 'photo.png',
      contentType: 'image/png',
      sizeBytes: 2048,
      width: 640,
      height: 480,
      courseId: null,
    });
    expect(result.file).toEqual({
      fileId: FILE_ID,
      kind: 'image',
      fileName: 'photo.png',
      contentType: 'image/png',
      sizeBytes: 2048,
    });
    expect(result.media).toBeNull();
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it('places course media of a teacher under the author prefix, of a platform admin under official', async () => {
    const own = course({
      id: 'course-t',
      isOfficial: false,
      ownerUid: 'teacher-1',
      schoolId: 'school-a',
    });
    vi.mocked(getCourse).mockResolvedValueOnce(own);
    const byTeacher = await registerUpload(teacher, {
      ...upload,
      purpose: 'course_media',
      courseId: 'course-t',
    });
    expect(byTeacher.media?.storagePath).toBe(
      `course-media/authors/teacher-1/${FILE_ID}/photo.png`,
    );
    expect(registerFile).toHaveBeenLastCalledWith(
      SYSTEM_ACTOR,
      expect.objectContaining({ purpose: 'course_media', courseId: 'course-t' }),
    );

    const byAdmin = await registerUpload(platformAdmin, {
      ...upload,
      purpose: 'course_media',
      courseId: 'course-1',
    });
    expect(byAdmin.media?.storagePath).toBe(`course-media/official/${FILE_ID}/photo.png`);

    const cover = await registerUpload(platformAdmin, {
      ...upload,
      purpose: 'course_media',
      courseId: null,
    });
    expect(cover.media?.storagePath).toBe(`course-media/official/${FILE_ID}/photo.png`);
  });

  it('refuses course media from a student, from a teacher on a course they do not own, and covers from a teacher', async () => {
    await expect(
      registerUpload(student, { ...upload, purpose: 'course_media', courseId: 'course-1' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      registerUpload(teacher, { ...upload, purpose: 'course_media', courseId: 'course-1' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      registerUpload(teacher, { ...upload, purpose: 'course_media', courseId: null }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(statObject).not.toHaveBeenCalled();
  });

  it('deletes an object that fails the type or size check, or the quota, and registers nothing', async () => {
    vi.mocked(statObject).mockResolvedValueOnce({
      contentType: 'text/html',
      sizeBytes: 10,
      createdAt: null,
    });
    await expect(
      registerUpload(student, { ...upload, purpose: 'submission' }),
    ).rejects.toMatchObject({
      code: 'validation',
      fieldErrors: { file: ['file_type_not_allowed'] },
    });
    vi.mocked(statObject).mockResolvedValueOnce({
      contentType: 'image/png',
      sizeBytes: 11 * 1024 * 1024,
      createdAt: null,
    });
    await expect(
      registerUpload(student, { ...upload, purpose: 'submission' }),
    ).rejects.toMatchObject({
      fieldErrors: { file: ['file_too_large'] },
    });
    vi.mocked(checkAndCountUpload).mockResolvedValueOnce({ allowed: false });
    await expect(
      registerUpload(student, { ...upload, purpose: 'submission' }),
    ).rejects.toBeInstanceOf(RateLimitError);
    expect(deleteObject).toHaveBeenCalledTimes(3);
    expect(registerFile).not.toHaveBeenCalled();
    expect(clearDownloadTokens).not.toHaveBeenCalled();
  });

  it('answers not found when nothing was uploaded, validation for a bad input, forbidden for admins', async () => {
    vi.mocked(statObject).mockResolvedValueOnce(null);
    await expect(
      registerUpload(student, { ...upload, purpose: 'submission' }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      registerUpload(student, { ...upload, fileName: '..', purpose: 'submission' }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      registerUpload(schoolAdmin, { ...upload, purpose: 'submission' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      registerUpload(SYSTEM_ACTOR, { ...upload, purpose: 'submission' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

// --- submitWork --------------------------------------------------------------------------------

describe('submitWork', () => {
  it('creates a project submission supervised by the class resolveClassContext names', async () => {
    const created = await submitWork(student, work());
    expect(resolveClassContext).toHaveBeenCalledWith('student-1', 'course-1');
    expect(createSubmission).toHaveBeenCalledWith(SYSTEM_ACTOR, {
      studentUid: 'student-1',
      studentName: 'Name of student-1',
      classId: 'class-a',
      schoolId: 'school-a',
      target: { context: 'project', courseId: 'course-1', projectId: 'p1' },
      lessonId: 'l1',
      contextTitle: { en: { title: 'Project p1' } },
      rubric: projectP1.rubric,
      previousSubmissionId: null,
      title: 'My robot',
      description: 'It follows a line.',
      type: 'text',
      content: { text: 'I built a line follower.', linkUrl: null, code: null, codeLanguage: null },
      attachments: [],
      locale: 'en',
    });
    expect(created.id).toBe('student-1_p_course-1_p1_1');
  });

  it("attaches the actor's own registered, unattached files", async () => {
    const file = fileRecord({ id: FILE_ID });
    vi.mocked(getOwnFiles).mockResolvedValue([file]);
    await submitWork(
      student,
      work({
        type: 'image',
        content: { text: null, linkUrl: null, code: null, codeLanguage: null },
        fileIds: [FILE_ID],
      }),
    );
    expect(getOwnFiles).toHaveBeenCalledWith(student, [FILE_ID]);
    expect(createSubmission).toHaveBeenCalledWith(
      SYSTEM_ACTOR,
      expect.objectContaining({
        attachments: [
          {
            fileId: FILE_ID,
            kind: 'image',
            fileName: 'photo.png',
            contentType: 'image/png',
            sizeBytes: 1234,
          },
        ],
      }),
    );

    vi.mocked(getOwnFiles).mockResolvedValue([{ ...file, submissionId: 'elsewhere' }]);
    await expect(
      submitWork(student, work({ type: 'image', fileIds: [FILE_ID] })),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('requires an enrollment, an allowed type and a project that a lesson shows', async () => {
    vi.mocked(getEnrollment).mockResolvedValueOnce(null);
    await expect(submitWork(student, work())).rejects.toBeInstanceOf(NotFoundError);

    vi.mocked(getProject).mockResolvedValueOnce({ ...projectP1, allowedSubmissionTypes: ['code'] });
    await expect(submitWork(student, work())).rejects.toMatchObject({
      code: 'validation',
      fieldErrors: { type: ['invalid_choice'] },
    });

    vi.mocked(getProject).mockResolvedValueOnce({ ...projectP1, lessonId: null });
    await expect(submitWork(student, work())).rejects.toBeInstanceOf(ConflictError);
    expect(createSubmission).not.toHaveBeenCalled();
  });

  it('enters an open challenge without a course, and refuses a closed one', async () => {
    const entry = work({ target: { context: 'challenge', challengeId: 'ch-1' } });
    const created = await submitWork(loner, entry);
    expect(resolveClassContext).toHaveBeenCalledWith('student-9', null);
    expect(createSubmission).toHaveBeenCalledWith(
      SYSTEM_ACTOR,
      expect.objectContaining({
        classId: null,
        schoolId: null,
        lessonId: null,
        contextTitle: { en: { title: 'Challenge ch-1' } },
        rubric: openChallenge.rubric,
      }),
    );
    expect(created.context).toBe('challenge');
    expect(getEnrollment).not.toHaveBeenCalled();

    vi.mocked(getChallenge).mockResolvedValueOnce(
      challenge({ id: 'ch-1', deadlineAt: '2026-10-01T12:00:00.000Z' }),
    );
    await expect(submitWork(loner, entry)).rejects.toBeInstanceOf(ConflictError);
  });

  it('is for students, with a well-formed input', async () => {
    await expect(submitWork(teacher, work())).rejects.toBeInstanceOf(ForbiddenError);
    await expect(submitWork(SYSTEM_ACTOR, work())).rejects.toBeInstanceOf(ForbiddenError);
    await expect(submitWork(student, work({ title: '' }))).rejects.toBeInstanceOf(ValidationError);
    await expect(
      submitWork(
        student,
        work({ content: { text: null, linkUrl: null, code: null, codeLanguage: null } }),
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

// --- deleteAttachment --------------------------------------------------------------------------

describe('deleteAttachment', () => {
  const attached = {
    fileId: FILE_ID,
    kind: 'image' as const,
    fileName: 'photo.png',
    contentType: 'image/png',
    sizeBytes: 1234,
  };

  beforeEach(() => {
    store(
      submission({ id: 's1', classId: 'class-a', schoolId: 'school-a', attachments: [attached] }),
    );
    vi.mocked(getFile).mockResolvedValue(fileRecord({ id: FILE_ID, submissionId: 's1' }));
  });

  it('lets the owner remove it while the work waits, without an audit entry', async () => {
    await deleteAttachment(student, 's1', FILE_ID);
    expect(removeAttachment).toHaveBeenCalledWith(SYSTEM_ACTOR, 's1', FILE_ID);
    expect(deleteFile).toHaveBeenCalledWith(SYSTEM_ACTOR, FILE_ID);
    expect(deleteObject).toHaveBeenCalledWith(`user-uploads/student-1/image/${FILE_ID}/photo.png`);
    expect(writeAudit).not.toHaveBeenCalled();

    patch('s1', { status: 'approved' });
    await expect(deleteAttachment(student, 's1', FILE_ID)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('lets the reviewing teacher remove it at any time, and audits it', async () => {
    patch('s1', { status: 'approved' });
    await deleteAttachment(teacher, 's1', FILE_ID);
    expect(deleteFile).toHaveBeenCalledWith(SYSTEM_ACTOR, FILE_ID);
    expect(writeAudit).toHaveBeenCalledWith(teacher, {
      action: 'file.deleted',
      targetType: 'file',
      targetId: FILE_ID,
      schoolId: 'school-a',
      meta: { submissionId: 's1', studentUid: 'student-1' },
    });
  });

  it('hides the submission from strangers and refuses a school admin or an unknown file', async () => {
    await expect(deleteAttachment(otherTeacher, 's1', FILE_ID)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(deleteAttachment(schoolAdmin, 's1', FILE_ID)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(
      deleteAttachment(student, 's1', '11111111-1111-1111-1111-111111111111'),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(removeAttachment).not.toHaveBeenCalled();
  });
});

// --- generateAiReview --------------------------------------------------------------------------

describe('generateAiReview', () => {
  it("reviews a pending submission with the student's usage counted, and stores the suggestion", async () => {
    store(submission({ id: 's1', classId: 'class-a', schoolId: 'school-a' }));
    await generateAiReview('s1');

    expect(checkAndCountAiUsage).toHaveBeenCalledWith(
      { uid: 'student-1', role: 'student', schoolId: 'school-a' },
      'review',
    );
    const input = vi.mocked(suggestReview).mock.calls[0]?.[0] as AiReviewInput;
    expect(input).toMatchObject({
      locale: 'en',
      ageBand: '11-12',
      projectTitle: 'Project p1',
      projectBrief: 'Build it',
      requirements: 'Explain it',
      submission: {
        title: 'My work',
        type: 'text',
        text: 'Some text',
        code: null,
        linkHost: null,
        truncated: false,
      },
    });
    expect(saveAiReview).toHaveBeenCalledWith(
      SYSTEM_ACTOR,
      's1',
      expect.objectContaining({
        status: 'ready',
        overallSuggestedScore: 75,
        confidence: 'medium',
        flags: [],
        error: null,
        inputTokens: 120,
        outputTokens: 60,
      }),
    );
    expect(recordAiTokens).toHaveBeenCalledWith(
      { uid: 'student-1', role: 'student', schoolId: 'school-a' },
      { inputTokens: 120, outputTokens: 60 },
    );
    // Supervised: the teacher decides; the attempt stays open.
    expect(markAiReviewed).not.toHaveBeenCalled();
    expect(world.submissions.get('s1')).toMatchObject({
      status: 'submitted',
      aiReviewStatus: 'ready',
    });
  });

  it('sends only redacted, budgeted content: hostname, attachment kinds and sizes, cut text', async () => {
    store(
      submission({
        id: 's1',
        classId: 'class-a',
        type: 'link',
        description: 'Mail me at kid@example.com',
        content: {
          text: 'x'.repeat(AI_LIMITS.reviewInput.text + 5),
          linkUrl: 'https://my.site.example/secret/path?x=1',
          code: null,
          codeLanguage: null,
        },
        attachments: [
          {
            fileId: FILE_ID,
            kind: 'pdf',
            fileName: 'lea-smith-school.pdf',
            contentType: 'application/pdf',
            sizeBytes: 99,
          },
        ],
      }),
    );
    await generateAiReview('s1');
    const input = vi.mocked(suggestReview).mock.calls[0]?.[0] as AiReviewInput;
    expect(input.submission.linkHost).toBe('my.site.example');
    expect(input.submission.attachments).toEqual([{ kind: 'pdf', sizeBytes: 99 }]);
    expect(input.submission.description).not.toContain('kid@example.com');
    expect(input.submission.text).toHaveLength(AI_LIMITS.reviewInput.text);
    expect(input.submission.truncated).toBe(true);
    expect(JSON.stringify(input)).not.toContain('lea-smith-school');
  });

  it('marks the review skipped when the usage check refuses, without calling the provider', async () => {
    store(submission({ id: 's1', classId: 'class-a' }));
    world.usageAllowed = false;
    await generateAiReview('s1');
    expect(suggestReview).not.toHaveBeenCalled();
    expect(setAiReviewSkipped).toHaveBeenCalledWith(SYSTEM_ACTOR, 's1');
    expect(world.submissions.get('s1')?.aiReviewStatus).toBe('skipped');
  });

  it('records a failed review with the tokens of the failed call, and counts a blocked reply', async () => {
    store(submission({ id: 's1', classId: null }));
    vi.mocked(suggestReview).mockRejectedValueOnce(
      new AiError('blocked', { usage: { inputTokens: 30, outputTokens: 7 } }),
    );
    await generateAiReview('s1');
    expect(saveAiReview).toHaveBeenCalledWith(
      SYSTEM_ACTOR,
      's1',
      expect.objectContaining({
        status: 'failed',
        provider: 'mock',
        error: 'blocked',
        criteria: null,
        inputTokens: 30,
        outputTokens: 7,
      }),
    );
    expect(recordAiBlocked).toHaveBeenCalledTimes(1);
    expect(recordAiTokens).toHaveBeenCalledWith(expect.anything(), {
      inputTokens: 30,
      outputTokens: 7,
    });
    // Unsupervised, but no usable review: the attempt stays open for a regeneration.
    expect(markAiReviewed).not.toHaveBeenCalled();
    expect(markAiReturned).not.toHaveBeenCalled();
    expect(world.submissions.get('s1')?.status).toBe('submitted');
  });

  it('closes an unsupervised attempt: accepted with XP when clean, returned when flagged', async () => {
    store(submission({ id: 's1', studentUid: 'student-9', classId: null }));
    await generateAiReview('s1');
    expect(markAiReviewed).toHaveBeenCalledWith(SYSTEM_ACTOR, 's1');
    expect(onSubmissionAccepted).toHaveBeenCalledWith('student-9', {
      submissionId: 's1',
      context: 'project',
      refId: 'p1',
      courseId: 'course-1',
      xpReward: 300,
    });
    expect(world.submissions.get('s1')).toMatchObject({
      status: 'ai_reviewed',
      effectsApplied: true,
      xpAwarded: 300,
    });

    store(submission({ id: 's2', studentUid: 'student-9', classId: null }));
    vi.mocked(suggestReview).mockResolvedValueOnce(readyOutput({ flags: ['off_topic'] }));
    await generateAiReview('s2');
    expect(markAiReturned).toHaveBeenCalledWith(SYSTEM_ACTOR, 's2');
    expect(onSubmissionAccepted).toHaveBeenCalledTimes(1);

    // A flag that only informs the teacher does not return unsupervised work.
    store(submission({ id: 's3', studentUid: 'student-9', classId: null }));
    vi.mocked(suggestReview).mockResolvedValueOnce(
      readyOutput({ flags: ['possible_personal_data'] }),
    );
    await generateAiReview('s3');
    expect(world.submissions.get('s3')?.status).toBe('ai_reviewed');
  });

  it('leaves an attempt that a class has started to review to its teacher', async () => {
    store(submission({ id: 's1', studentUid: 'student-9', classId: null }));
    vi.mocked(markAiReviewed).mockRejectedValueOnce(new ConflictError('supervised now'));
    await expect(generateAiReview('s1')).resolves.toBeUndefined();
    expect(onSubmissionAccepted).not.toHaveBeenCalled();
    expect(world.submissions.get('s1')?.aiReviewStatus).toBe('ready');
  });

  it('does nothing for a submission whose review is not pending or that is closed', async () => {
    store(submission({ id: 's1', aiReviewStatus: 'ready' }));
    store(submission({ id: 's2', status: 'approved' }));
    await generateAiReview('s1');
    await generateAiReview('s2');
    expect(checkAndCountAiUsage).not.toHaveBeenCalled();
    expect(suggestReview).not.toHaveBeenCalled();
  });

  it('never throws: an unexpected failure is logged and leaves the review pending', async () => {
    store(submission({ id: 's1' }));
    vi.mocked(getUser).mockRejectedValueOnce(new Error('Firestore down'));
    await expect(generateAiReview('s1')).resolves.toBeUndefined();
    await expect(generateAiReview('missing')).resolves.toBeUndefined();
    expect(world.submissions.get('s1')?.aiReviewStatus).toBe('pending');
    expect(console.error).toHaveBeenCalled();
  });
});

// --- regenerateAiReview ------------------------------------------------------------------------

describe('regenerateAiReview', () => {
  it('lets the owner of an unsupervised submission retry a failed or skipped review', async () => {
    store(
      submission({ id: 's1', studentUid: 'student-9', classId: null, aiReviewStatus: 'failed' }),
    );
    await regenerateAiReview(loner, 's1');
    expect(setAiReviewPending).toHaveBeenCalledWith(SYSTEM_ACTOR, 's1');
    expect(suggestReview).toHaveBeenCalledTimes(1);
    expect(world.submissions.get('s1')).toMatchObject({
      aiRegenerations: 1,
      status: 'ai_reviewed',
    });
  });

  it('refuses the owner while a review is under way or ready, and a supervised owner', async () => {
    store(
      submission({ id: 's1', studentUid: 'student-9', classId: null, aiReviewStatus: 'pending' }),
    );
    await expect(regenerateAiReview(loner, 's1')).rejects.toBeInstanceOf(ConflictError);
    store(
      submission({ id: 's2', classId: 'class-a', schoolId: 'school-a', aiReviewStatus: 'failed' }),
    );
    await expect(regenerateAiReview(student, 's2')).rejects.toBeInstanceOf(ForbiddenError);
    expect(setAiReviewPending).not.toHaveBeenCalled();
  });

  it('lets the reviewing teacher or a platform admin regenerate at any time, up to the limit', async () => {
    store(
      submission({ id: 's1', classId: 'class-a', schoolId: 'school-a', aiReviewStatus: 'ready' }),
    );
    await regenerateAiReview(teacher, 's1');
    await regenerateAiReview(platformAdmin, 's1');
    await regenerateAiReview(teacher, 's1');
    expect(suggestReview).toHaveBeenCalledTimes(3);
    await expect(regenerateAiReview(teacher, 's1')).rejects.toBeInstanceOf(ConflictError);
    expect(suggestReview).toHaveBeenCalledTimes(3);
  });

  it('hides the submission from a teacher of another class, refuses a school admin and a closed attempt', async () => {
    store(submission({ id: 's1', classId: 'class-a', schoolId: 'school-a' }));
    await expect(regenerateAiReview(otherTeacher, 's1')).rejects.toBeInstanceOf(NotFoundError);
    await expect(regenerateAiReview(schoolAdmin, 's1')).rejects.toBeInstanceOf(ForbiddenError);
    patch('s1', { status: 'approved' });
    await expect(regenerateAiReview(teacher, 's1')).rejects.toBeInstanceOf(ConflictError);
    await expect(regenerateAiReview(SYSTEM_ACTOR, 's1')).rejects.toBeInstanceOf(ForbiddenError);
  });
});

// --- getSubmissionForViewer --------------------------------------------------------------------

describe('getSubmissionForViewer', () => {
  it('shows the AI review to the reviewing teacher with the review history, never to a supervised student', async () => {
    const review = aiReview({ id: 'ai-1', submissionId: 's1' });
    world.aiReviews.set('ai-1', review);
    store(
      submission({
        id: 's1',
        classId: 'class-a',
        schoolId: 'school-a',
        aiReviewStatus: 'ready',
        latestAiReviewId: 'ai-1',
      }),
    );
    const forTeacher = await getSubmissionForViewer(teacher, 's1');
    expect(forTeacher.aiReview).toBe(review);
    expect(listReviews).toHaveBeenCalledWith(teacher, 's1');

    const forStudent = await getSubmissionForViewer(student, 's1');
    expect(forStudent.aiReview).toBeNull();
    expect(forStudent.reviews).toEqual([]);
    expect(listReviews).toHaveBeenCalledTimes(1);

    const forAdmin = await getSubmissionForViewer(schoolAdmin, 's1');
    expect(forAdmin.aiReview).toBeNull();
    expect(listReviews).toHaveBeenCalledTimes(2);
    await expect(getSubmissionForViewer(otherTeacher, 's1')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('shows the AI review to the owner of an unsupervised submission', async () => {
    world.aiReviews.set('ai-1', aiReview({ id: 'ai-1', submissionId: 's1' }));
    store(
      submission({
        id: 's1',
        studentUid: 'student-9',
        classId: null,
        status: 'ai_reviewed',
        aiReviewStatus: 'ready',
        latestAiReviewId: 'ai-1',
      }),
    );
    const view = await getSubmissionForViewer(loner, 's1');
    expect(view.aiReview?.id).toBe('ai-1');
    expect(view.reviews).toEqual([]);
  });

  it('repairs the effects of an accepted submission that were left pending', async () => {
    store(
      submission({
        id: 's1',
        classId: 'class-a',
        schoolId: 'school-a',
        status: 'approved',
        effectsApplied: false,
      }),
    );
    const view = await getSubmissionForViewer(teacher, 's1');
    expect(onSubmissionAccepted).toHaveBeenCalledWith(
      'student-1',
      expect.objectContaining({ submissionId: 's1', refId: 'p1', xpReward: 300 }),
    );
    expect(view.submission).toMatchObject({ effectsApplied: true, xpAwarded: 300 });

    store(
      submission({
        id: 's2',
        studentUid: 'student-9',
        status: 'ai_reviewed',
        effectsApplied: false,
      }),
    );
    vi.mocked(onSubmissionAccepted).mockRejectedValueOnce(new Error('ledger down'));
    const unrepaired = await getSubmissionForViewer(loner, 's2');
    expect(unrepaired.submission.effectsApplied).toBe(false);
  });

  it('runs a review again when it has been pending for more than two minutes, counting a regeneration', async () => {
    const stale = new Date(Date.now() - AI_LIMITS.reviewRetriggerAfterMs - 1000).toISOString();
    store(submission({ id: 's1', classId: 'class-a', schoolId: 'school-a', submittedAt: stale }));
    const view = await getSubmissionForViewer(teacher, 's1');
    expect(setAiReviewPending).toHaveBeenCalledWith(SYSTEM_ACTOR, 's1');
    expect(suggestReview).toHaveBeenCalledTimes(1);
    expect(view.submission).toMatchObject({ aiReviewStatus: 'ready', aiRegenerations: 1 });
    expect(view.aiReview?.status).toBe('ready');

    store(
      submission({
        id: 's2',
        classId: 'class-a',
        schoolId: 'school-a',
        submittedAt: new Date().toISOString(),
      }),
    );
    await getSubmissionForViewer(teacher, 's2');
    expect(suggestReview).toHaveBeenCalledTimes(1);
  });

  it('gives a review up as failed after three automatic retries', async () => {
    const stale = new Date(Date.now() - AI_LIMITS.reviewRetriggerAfterMs - 1000).toISOString();
    store(
      submission({
        id: 's1',
        classId: 'class-a',
        schoolId: 'school-a',
        submittedAt: stale,
        aiRegenerations: 3,
      }),
    );
    const view = await getSubmissionForViewer(teacher, 's1');
    expect(suggestReview).not.toHaveBeenCalled();
    expect(view.submission.aiReviewStatus).toBe('failed');
  });
});

// --- getFileForDownload ------------------------------------------------------------------------

describe('getFileForDownload', () => {
  const MEDIA_ID = '6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b';
  const OFFICIAL_ID = '9b2e4c1a-5d6f-4e7a-8b9c-0d1e2f3a4b5c';
  const UNKNOWN_ID = '11111111-1111-1111-1111-111111111111';
  const classmate = session('student', 'student-2', 'school-a', ['class-a']);
  const otherSchoolAdmin = session('school_admin', 'admin-b', 'school-b');
  const enrolledLearner = session('student', 'student-5');
  const stranger = session('student', 'student-6');
  const attached = {
    fileId: FILE_ID,
    kind: 'image' as const,
    fileName: 'photo.png',
    contentType: 'image/png',
    sizeBytes: 1234,
  };
  /** A private course of teacher-1; student-5 is enrolled in it. */
  const teacherCourse = course({
    id: 'course-t',
    isOfficial: false,
    ownerUid: 'teacher-1',
    schoolId: 'school-a',
    visibility: 'private',
    pathwayId: null,
  });

  let files: Map<string, FileRecord>;
  let courses: Map<string, Course>;

  beforeEach(() => {
    files = new Map(
      [
        fileRecord({ id: FILE_ID, submissionId: 's1' }),
        fileRecord({
          id: MEDIA_ID,
          ownerUid: 'teacher-1',
          schoolId: 'school-a',
          purpose: 'course_media',
          storagePath: `course-media/authors/teacher-1/${MEDIA_ID}/diagram.png`,
          fileName: 'diagram.png',
          courseId: 'course-t',
        }),
        fileRecord({
          id: OFFICIAL_ID,
          ownerUid: 'root',
          purpose: 'course_media',
          storagePath: `course-media/official/${OFFICIAL_ID}/robot.png`,
          fileName: 'robot.png',
          courseId: 'course-1',
        }),
      ].map((file) => [file.id, file]),
    );
    courses = new Map([
      ['course-t', teacherCourse],
      ['course-1', studentCourse],
    ]);
    store(
      submission({ id: 's1', classId: 'class-a', schoolId: 'school-a', attachments: [attached] }),
    );

    // The repositories as they answer: getFile for the owner, platform admins and the system.
    vi.mocked(getFile).mockImplementation(async (actor: Actor, fileId: string) => {
      const found = files.get(fileId);
      const allowed =
        found !== undefined &&
        (actor === SYSTEM_ACTOR ||
          ('uid' in actor && (actor.role === 'platform_admin' || actor.uid === found.ownerUid)));
      if (!allowed) throw new NotFoundError(`files/${fileId}`);
      return found;
    });
    vi.mocked(getCourse).mockImplementation(async (_actor, courseId) => {
      const found = courses.get(courseId);
      if (found === undefined) throw new NotFoundError(`courses/${courseId}`);
      return found;
    });
    vi.mocked(getCourseAccess).mockImplementation(async (actor, target) =>
      target.id === 'course-t' && 'uid' in actor && actor.uid !== 'student-5'
        ? { allowed: false, reason: 'not_visible' }
        : { allowed: true, via: 'free' },
    );
  });

  it('gives the owner their own file, read as the system', async () => {
    await expect(getFileForDownload(student, FILE_ID)).resolves.toMatchObject({
      id: FILE_ID,
      storagePath: `user-uploads/student-1/image/${FILE_ID}/photo.png`,
    });
    expect(getFile).toHaveBeenCalledWith(SYSTEM_ACTOR, FILE_ID);
    expect(getSubmission).not.toHaveBeenCalled();
  });

  it('gives a platform admin any file', async () => {
    await expect(getFileForDownload(platformAdmin, FILE_ID)).resolves.toMatchObject({
      id: FILE_ID,
    });
    await expect(getFileForDownload(platformAdmin, MEDIA_ID)).resolves.toMatchObject({
      id: MEDIA_ID,
    });
    expect(getCourseAccess).not.toHaveBeenCalled();
  });

  it('gives a submission file to the reviewing teacher and a school admin of the school', async () => {
    await expect(getFileForDownload(teacher, FILE_ID)).resolves.toMatchObject({ id: FILE_ID });
    expect(getSubmission).toHaveBeenCalledWith(teacher, 's1');
    await expect(getFileForDownload(schoolAdmin, FILE_ID)).resolves.toMatchObject({
      id: FILE_ID,
    });
  });

  it('hides a submission file from a classmate, another teacher and another school', async () => {
    for (const actor of [classmate, otherTeacher, otherSchoolAdmin, stranger]) {
      await expect(getFileForDownload(actor, FILE_ID)).rejects.toBeInstanceOf(NotFoundError);
    }
  });

  it('hides a removed or not yet attached file from staff, but not from its owner', async () => {
    patch('s1', { attachments: [] });
    await expect(getFileForDownload(teacher, FILE_ID)).rejects.toBeInstanceOf(NotFoundError);
    await expect(getFileForDownload(schoolAdmin, FILE_ID)).rejects.toBeInstanceOf(NotFoundError);
    await expect(getFileForDownload(student, FILE_ID)).resolves.toMatchObject({ id: FILE_ID });

    files.set(FILE_ID, fileRecord({ id: FILE_ID, submissionId: null }));
    patch('s1', { attachments: [attached] });
    await expect(getFileForDownload(teacher, FILE_ID)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('gives teacher-made course media to a learner the course lets in, not to a stranger', async () => {
    await expect(getFileForDownload(enrolledLearner, MEDIA_ID)).resolves.toMatchObject({
      id: MEDIA_ID,
    });
    expect(getCourse).toHaveBeenCalledWith(SYSTEM_ACTOR, 'course-t');
    expect(getCourseAccess).toHaveBeenCalledWith(enrolledLearner, teacherCourse);

    for (const actor of [stranger, classmate, otherTeacher]) {
      await expect(getFileForDownload(actor, MEDIA_ID)).rejects.toBeInstanceOf(NotFoundError);
    }
  });

  it('refuses course media of a premium course without a cover', async () => {
    vi.mocked(getCourseAccess).mockResolvedValue({ allowed: false, reason: 'license_required' });
    await expect(getFileForDownload(enrolledLearner, MEDIA_ID)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('lets whoever may edit the course reach its media, and nobody once the course is gone', async () => {
    // Uploaded by a platform admin for teacher-1's course (5.2: lands under the admin's uid).
    files.set(
      MEDIA_ID,
      fileRecord({
        id: MEDIA_ID,
        ownerUid: 'root',
        purpose: 'course_media',
        storagePath: `course-media/authors/root/${MEDIA_ID}/diagram.png`,
        courseId: 'course-t',
      }),
    );
    vi.mocked(getCourseAccess).mockResolvedValue({ allowed: false, reason: 'not_visible' });
    await expect(getFileForDownload(teacher, MEDIA_ID)).resolves.toMatchObject({ id: MEDIA_ID });
    expect(getCourseAccess).not.toHaveBeenCalled();

    courses.delete('course-t');
    await expect(getFileForDownload(teacher, MEDIA_ID)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('gives official media to any session without reading the course', async () => {
    for (const actor of [stranger, schoolAdmin, otherTeacher]) {
      await expect(getFileForDownload(actor, OFFICIAL_ID)).resolves.toMatchObject({
        id: OFFICIAL_ID,
      });
    }
    expect(getCourse).not.toHaveBeenCalled();
    expect(getCourseAccess).not.toHaveBeenCalled();
  });

  it('answers a malformed id with no read, and a missing file like a hidden one', async () => {
    for (const fileId of ['../etc/passwd', 'not-a-uuid', '', `${FILE_ID}x`]) {
      await expect(getFileForDownload(student, fileId)).rejects.toBeInstanceOf(NotFoundError);
    }
    expect(getFile).not.toHaveBeenCalled();

    const missing = await getFileForDownload(teacher, UNKNOWN_ID).catch((error: unknown) => error);
    expect(missing).toBeInstanceOf(NotFoundError);
    patch('s1', { attachments: [] });
    files.set(UNKNOWN_ID, fileRecord({ id: UNKNOWN_ID, submissionId: 's1' }));
    const hidden = await getFileForDownload(teacher, UNKNOWN_ID).catch((error: unknown) => error);
    expect(hidden).toBeInstanceOf(NotFoundError);
    expect((hidden as Error).message).toBe((missing as Error).message);
  });

  it('refuses the system actor: a download is always made by a person', async () => {
    await expect(getFileForDownload(SYSTEM_ACTOR, FILE_ID)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(getFile).not.toHaveBeenCalled();
  });
});

// --- reviewSubmission --------------------------------------------------------------------------

describe('reviewSubmission', () => {
  function withReview(
    fields: Partial<AiReview> = {},
    status: Submission['aiReviewStatus'] = 'ready',
  ) {
    world.aiReviews.set('ai-1', aiReview({ id: 'ai-1', submissionId: 's1', ...fields }));
    return store(
      submission({
        id: 's1',
        classId: 'class-a',
        schoolId: 'school-a',
        aiReviewStatus: status,
        latestAiReviewId: 'ai-1',
      }),
    );
  }
  const review = (
    decision: 'approve' | 'modify' | 'return',
    criteria: Record<string, number> | null = null,
  ) => ({
    submissionId: 's1',
    decision,
    criteria: criteria as never,
    feedback: 'Thanks for your work.',
  });

  it('approves by copying the AI suggestion as the grade, then awards the XP and audits', async () => {
    withReview();
    const result = await reviewSubmission(teacher, review('approve'));
    expect(addReview).toHaveBeenCalledWith(teacher, 's1', {
      decision: 'approve',
      criteria: { creativity: 80, technicalQuality: 60, understanding: 70, responsibleAi: 90 },
      score: 75,
      feedback: 'Thanks for your work.',
      aiReviewId: 'ai-1',
    });
    expect(onSubmissionAccepted).toHaveBeenCalledWith(
      'student-1',
      expect.objectContaining({
        submissionId: 's1',
        context: 'project',
        refId: 'p1',
        courseId: 'course-1',
        xpReward: 300,
      }),
    );
    expect(result.submission).toMatchObject({
      status: 'approved',
      finalScore: 75,
      effectsApplied: true,
    });
    expect(result.gamification).toEqual(outcome({ xpAwarded: 300 }));
    expect(writeAudit).toHaveBeenCalledWith(teacher, {
      action: 'submission.reviewed',
      targetType: 'submission',
      targetId: 's1',
      schoolId: 'school-a',
      meta: { decision: 'approve', score: 75, studentUid: 'student-1' },
    });
  });

  it('refuses to approve a flagged, low-confidence, failed or not yet ready suggestion', async () => {
    withReview({ flags: ['possible_personal_data'] });
    await expect(reviewSubmission(teacher, review('approve'))).rejects.toBeInstanceOf(
      ConflictError,
    );
    withReview({ confidence: 'low' });
    await expect(reviewSubmission(teacher, review('approve'))).rejects.toBeInstanceOf(
      ConflictError,
    );
    withReview({ status: 'failed', criteria: null, overallSuggestedScore: null }, 'failed');
    await expect(reviewSubmission(teacher, review('approve'))).rejects.toBeInstanceOf(
      ConflictError,
    );
    withReview({}, 'pending');
    await expect(reviewSubmission(teacher, review('approve'))).rejects.toBeInstanceOf(
      ConflictError,
    );
    store(
      submission({ id: 's1', classId: 'class-a', schoolId: 'school-a', aiReviewStatus: 'skipped' }),
    );
    await expect(reviewSubmission(teacher, review('approve'))).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(addReview).not.toHaveBeenCalled();
  });

  it('approves only the suggestion the teacher saw, when the input names one (WS-D-4)', async () => {
    withReview();
    // A co-teacher asked for a new suggestion after this teacher loaded the page.
    world.aiReviews.set(
      'ai-0',
      aiReview({ id: 'ai-0', submissionId: 's1', overallSuggestedScore: 40 }),
    );
    await expect(
      reviewSubmission(teacher, { ...review('approve'), aiReviewId: 'ai-0' }),
    ).rejects.toBeInstanceOf(ConflictError);
    // Nothing shown while one exists is not a suggestion either.
    await expect(
      reviewSubmission(teacher, { ...review('approve'), aiReviewId: null }),
    ).rejects.toBeInstanceOf(ConflictError);
    // Refused before any suggestion is read, and nothing is written.
    expect(getAiReview).not.toHaveBeenCalled();
    expect(addReview).not.toHaveBeenCalled();
    expect(writeAudit).not.toHaveBeenCalled();

    const result = await reviewSubmission(teacher, { ...review('approve'), aiReviewId: 'ai-1' });
    expect(addReview).toHaveBeenCalledWith(
      teacher,
      's1',
      expect.objectContaining({ decision: 'approve', score: 75, aiReviewId: 'ai-1' }),
    );
    expect(result.submission.status).toBe('approved');
  });

  it('keeps modify and return independent of which suggestion is the newest', async () => {
    withReview();
    const scores = { creativity: 50, technicalQuality: 50, understanding: 50, responsibleAi: 50 };
    await reviewSubmission(teacher, { ...review('modify', scores), aiReviewId: 'ai-0' });
    expect(addReview).toHaveBeenLastCalledWith(
      teacher,
      's1',
      expect.objectContaining({ decision: 'modify', score: 50, aiReviewId: 'ai-1' }),
    );
    withReview();
    await reviewSubmission(teacher, { ...review('return'), aiReviewId: null });
    expect(addReview).toHaveBeenLastCalledWith(
      teacher,
      's1',
      expect.objectContaining({ decision: 'return', aiReviewId: 'ai-1' }),
    );
  });

  it("grades a modification with the teacher's scores weighted by the submission's rubric", async () => {
    withReview();
    patch('s1', {
      rubric: [
        { key: 'creativity', weight: 50 },
        { key: 'understanding', weight: 50 },
      ],
    });
    const scores = { creativity: 90, technicalQuality: 10, understanding: 70, responsibleAi: 10 };
    const result = await reviewSubmission(platformAdmin, review('modify', scores));
    expect(addReview).toHaveBeenCalledWith(
      platformAdmin,
      's1',
      expect.objectContaining({
        decision: 'modify',
        criteria: scores,
        score: 80,
        aiReviewId: 'ai-1',
      }),
    );
    expect(result.submission.status).toBe('approved');
    expect(onSubmissionAccepted).toHaveBeenCalledTimes(1);
  });

  it('returns the work with feedback only, awarding nothing', async () => {
    withReview();
    const result = await reviewSubmission(teacher, review('return'));
    expect(addReview).toHaveBeenCalledWith(
      teacher,
      's1',
      expect.objectContaining({ decision: 'return', criteria: null, score: null }),
    );
    expect(result.submission.status).toBe('returned');
    expect(result.gamification).toBeNull();
    expect(onSubmissionAccepted).not.toHaveBeenCalled();
    expect(writeAudit).toHaveBeenCalledTimes(1);
  });

  it('is for the teacher of the class or a platform admin, on work that is still waiting', async () => {
    withReview();
    await expect(reviewSubmission(otherTeacher, review('return'))).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(reviewSubmission(schoolAdmin, review('return'))).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(reviewSubmission(student, review('return'))).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(reviewSubmission(SYSTEM_ACTOR, review('return'))).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    patch('s1', { status: 'returned' });
    await expect(reviewSubmission(teacher, review('return'))).rejects.toBeInstanceOf(ConflictError);
    await expect(
      reviewSubmission(teacher, { ...review('return'), feedback: '  ' }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(reviewSubmission(teacher, review('modify'))).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(addReview).not.toHaveBeenCalled();
  });

  it('still answers the review when the XP handler fails, leaving the effects pending', async () => {
    withReview();
    vi.mocked(onSubmissionAccepted).mockRejectedValueOnce(new Error('ledger down'));
    const result = await reviewSubmission(teacher, review('approve'));
    expect(result.submission).toMatchObject({ status: 'approved', effectsApplied: false });
    expect(result.gamification).toBeNull();
  });
});

// --- Pure helpers ------------------------------------------------------------------------------

describe('weightedScore', () => {
  const full = { creativity: 80, technicalQuality: 60, understanding: 70, responsibleAi: 90 };

  it('rounds the weighted sum over the rubric', () => {
    expect(
      weightedScore(full, [
        { key: 'creativity', weight: 25 },
        { key: 'technicalQuality', weight: 25 },
        { key: 'understanding', weight: 25 },
        { key: 'responsibleAi', weight: 25 },
      ]),
    ).toBe(75);
    expect(
      weightedScore(full, [
        { key: 'creativity', weight: 70 },
        { key: 'responsibleAi', weight: 30 },
      ]),
    ).toBe(83);
  });

  it('ignores criteria the rubric leaves out and scores an empty rubric 0', () => {
    expect(weightedScore(full, [{ key: 'technicalQuality', weight: 100 }])).toBe(60);
    expect(weightedScore(full, [])).toBe(0);
  });
});
