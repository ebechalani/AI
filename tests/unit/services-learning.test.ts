import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SYSTEM_ACTOR } from '@/lib/auth/actor';
import { getCourse, getCourseOutline, getLesson, listBlocks } from '@/lib/data/courses';
import {
  applyLessonCompletion,
  createEnrollment,
  getEnrollment,
  getLessonProgress,
  markLessonStarted,
  saveBlockResponse,
} from '@/lib/data/enrollments';
import { getProject } from '@/lib/data/projects';
import { getLatestAttempt, getQuiz } from '@/lib/data/quizzes';
import { getSchool } from '@/lib/data/schools';
import { getSubmission } from '@/lib/data/submissions';
import { ConflictError, ForbiddenError, LicenseRequiredError, NotFoundError } from '@/lib/errors';
import { onLessonCompleted, onQuizPassed } from '@/lib/gamification/events';
import { getCourseAccess } from '@/lib/services/access';
import { resolveClassContext } from '@/lib/services/classroom';
import {
  completeLesson,
  enrollSelf,
  getLessonPlayerData,
  saveResponse,
  startLesson,
} from '@/lib/services/learning';
import {
  attempt,
  course,
  enrollment,
  lesson,
  outcome,
  progress,
  project,
  quiz,
  reflectionBlock,
  richTextBlock,
  school,
  session,
  submission,
} from './services-fixtures';

// services/learning over mocked repositories: who may enrol and where the enrollment is
// supervised, the read-only decision of the player (7.6), the completion rule of 9.4 and the
// repair of pending gamification effects. The repositories run against the emulator in
// tests/integration.

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(() => {
    throw new Error('Firestore was reached.');
  }),
}));
vi.mock('@/lib/data/courses', () => ({
  getCourse: vi.fn(),
  getCourseOutline: vi.fn(),
  getLesson: vi.fn(),
  listBlocks: vi.fn(),
}));
vi.mock('@/lib/data/enrollments', () => ({
  applyLessonCompletion: vi.fn(),
  createEnrollment: vi.fn(),
  getEnrollment: vi.fn(),
  getLessonProgress: vi.fn(),
  markLessonStarted: vi.fn(),
  saveBlockResponse: vi.fn(),
}));
vi.mock('@/lib/data/projects', () => ({ getProject: vi.fn() }));
vi.mock('@/lib/data/quizzes', () => ({ getLatestAttempt: vi.fn(), getQuiz: vi.fn() }));
vi.mock('@/lib/data/schools', () => ({ getSchool: vi.fn() }));
vi.mock('@/lib/data/submissions', () => ({ getSubmission: vi.fn() }));
vi.mock('@/lib/gamification/events', () => ({
  onLessonCompleted: vi.fn(),
  onQuizPassed: vi.fn(),
}));
vi.mock('@/lib/services/access', () => ({ getCourseAccess: vi.fn() }));
vi.mock('@/lib/services/classroom', () => ({ resolveClassContext: vi.fn() }));

const student = session('student', 'student-1', 'school-a', ['class-a']);
const teacher = session('teacher', 'teacher-1', 'school-a', ['class-a']);
const schoolAdmin = session('school_admin', 'admin-a', 'school-a');
const platformAdmin = session('platform_admin', 'root');

const studentCourse = course({ id: 'course-1', lessonCount: 3 });
const teacherCourse = course({
  id: 'academy-1',
  audience: 'teacher',
  pathwayId: 'teacher-academy',
});
const lessons = [
  lesson({ id: 'l1', courseId: 'course-1', order: 0 }),
  lesson({ id: 'l2', courseId: 'course-1', order: 1, quizIds: ['quiz-1'], projectIds: ['p1'] }),
  lesson({ id: 'l3', courseId: 'course-1', order: 2, reflectionBlockIds: ['r1'] }),
];
const enrolled = enrollment({ userUid: 'student-1', courseId: 'course-1', classId: 'class-a' });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(getCourseAccess).mockResolvedValue({ allowed: true, via: 'free' });
  vi.mocked(getCourse).mockImplementation(async (_actor, courseId) => {
    if (courseId === 'course-1') return studentCourse;
    if (courseId === 'academy-1') return teacherCourse;
    throw new NotFoundError(`courses/${courseId}`);
  });
  vi.mocked(getCourseOutline).mockResolvedValue({ course: studentCourse, modules: [], lessons });
  vi.mocked(getLesson).mockImplementation(async (_actor, _courseId, lessonId) => {
    const found = lessons.find((candidate) => candidate.id === lessonId);
    if (found === undefined) throw new NotFoundError(`lessons/${lessonId}`);
    return found;
  });
  vi.mocked(listBlocks).mockResolvedValue([]);
  vi.mocked(getEnrollment).mockResolvedValue(null);
  vi.mocked(getLessonProgress).mockResolvedValue(null);
  vi.mocked(getQuiz).mockImplementation(async (_actor, courseId, quizId) =>
    quiz({ id: quizId, courseId, maxAttempts: 2, lessonId: 'l2' }),
  );
  vi.mocked(getLatestAttempt).mockResolvedValue(null);
  vi.mocked(getProject).mockImplementation(async (_actor, courseId, projectId) =>
    project({ id: projectId, courseId }),
  );
  vi.mocked(getSchool).mockResolvedValue(school({ id: 'school-a' }));
  vi.mocked(resolveClassContext).mockResolvedValue({ classId: 'class-a', schoolId: 'school-a' });
  vi.mocked(createEnrollment).mockImplementation(async (_actor, input) => enrollment({ ...input }));
  vi.mocked(onLessonCompleted).mockResolvedValue(outcome());
  vi.mocked(onQuizPassed).mockResolvedValue(outcome({ xpAwarded: 100 }));
});

// --- enrollSelf ------------------------------------------------------------------------------

describe('enrollSelf', () => {
  it('enrols a student with the class context of resolveClassContext', async () => {
    const result = await enrollSelf(student, 'course-1');
    expect(resolveClassContext).toHaveBeenCalledWith('student-1', 'course-1');
    expect(createEnrollment).toHaveBeenCalledWith(SYSTEM_ACTOR, {
      userUid: 'student-1',
      courseId: 'course-1',
      classId: 'class-a',
      schoolId: 'school-a',
      source: 'self',
      totalLessonCount: 3,
    });
    expect(result.id).toBe('student-1_course-1');
  });

  it("gives a teacher's Teacher Academy enrollment no supervising class", async () => {
    await enrollSelf(teacher, 'academy-1');
    expect(resolveClassContext).not.toHaveBeenCalled();
    expect(createEnrollment).toHaveBeenCalledWith(
      SYSTEM_ACTOR,
      expect.objectContaining({ userUid: 'teacher-1', classId: null, schoolId: 'school-a' }),
    );
  });

  it('refuses a teacher in a student course and a student in a teacher course', async () => {
    await expect(enrollSelf(teacher, 'course-1')).rejects.toBeInstanceOf(ForbiddenError);
    await expect(enrollSelf(student, 'academy-1')).rejects.toBeInstanceOf(ForbiddenError);
    expect(createEnrollment).not.toHaveBeenCalled();
  });

  it('refuses admins and the system', async () => {
    await expect(enrollSelf(schoolAdmin, 'course-1')).rejects.toBeInstanceOf(ForbiddenError);
    await expect(enrollSelf(platformAdmin, 'course-1')).rejects.toBeInstanceOf(ForbiddenError);
    await expect(enrollSelf(SYSTEM_ACTOR, 'course-1')).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('maps the access answers: not visible is not found, premium needs a licence', async () => {
    vi.mocked(getCourseAccess).mockResolvedValueOnce({ allowed: false, reason: 'not_visible' });
    await expect(enrollSelf(student, 'course-1')).rejects.toBeInstanceOf(NotFoundError);
    vi.mocked(getCourseAccess).mockResolvedValueOnce({
      allowed: false,
      reason: 'license_required',
    });
    await expect(enrollSelf(student, 'course-1')).rejects.toBeInstanceOf(LicenseRequiredError);
  });

  it('refuses a course that is not published', async () => {
    vi.mocked(getCourse).mockResolvedValueOnce(course({ id: 'course-1', status: 'draft' }));
    await expect(enrollSelf(student, 'course-1')).rejects.toBeInstanceOf(ConflictError);
  });
});

// --- getLessonPlayerData ---------------------------------------------------------------------

describe('getLessonPlayerData', () => {
  it('lets an enrolled student learn, with quizzes, attempts, projects and neighbours', async () => {
    vi.mocked(getEnrollment).mockResolvedValue({
      ...enrolled,
      quizSummary: { 'quiz-1': { attempts: 1, passed: false, bestPercent: 40, lastPercent: 40 } },
      projectSummary: {
        p1: {
          attempts: 1,
          latestSubmissionId: 'student-1_p_course-1_p1_1',
          latestStatus: 'submitted',
        },
      },
    });
    const failed = attempt({
      userUid: 'student-1',
      courseId: 'course-1',
      quizId: 'quiz-1',
      passed: false,
      results: null,
    });
    vi.mocked(getLatestAttempt).mockResolvedValue(failed);
    const open = submission({ id: 'student-1_p_course-1_p1_1' });
    vi.mocked(getSubmission).mockResolvedValue(open);

    const data = await getLessonPlayerData(student, 'course-1', 'l2');

    expect(data.readOnly).toBe(false);
    expect(data.tutorEnabled).toBe(true);
    expect(data.lesson.id).toBe('l2');
    expect(data.previousLessonId).toBe('l1');
    expect(data.nextLessonId).toBe('l3');
    expect(Object.keys(data.quizzes)).toEqual(['quiz-1']);
    expect(data.latestAttempts['quiz-1']).toBe(failed);
    expect(data.attemptsRemaining['quiz-1']).toBe(1);
    expect(data.projects.p1?.id).toBe('p1');
    expect(data.latestSubmissions.p1).toBe(open);
    expect(getLatestAttempt).toHaveBeenCalledWith(student, 'student-1', 'course-1', 'quiz-1');
    expect(getSubmission).toHaveBeenCalledWith(student, 'student-1_p_course-1_p1_1');
    expect(onQuizPassed).not.toHaveBeenCalled();
  });

  it('is read-only without an enrollment, and reads no attempt or submission', async () => {
    const data = await getLessonPlayerData(student, 'course-1', 'l2');
    expect(data.readOnly).toBe(true);
    expect(data.tutorEnabled).toBe(false);
    expect(data.enrollment).toBeNull();
    expect(data.latestAttempts['quiz-1']).toBeNull();
    expect(data.attemptsRemaining['quiz-1']).toBe(2);
    expect(data.latestSubmissions.p1).toBeNull();
    expect(getLatestAttempt).not.toHaveBeenCalled();
    expect(getSubmission).not.toHaveBeenCalled();
    expect(getSchool).not.toHaveBeenCalled();
  });

  it('is read-only for a teacher in a student course and for admins, even when enrolled', async () => {
    vi.mocked(getEnrollment).mockResolvedValue(
      enrollment({ userUid: 'teacher-1', courseId: 'course-1' }),
    );
    expect((await getLessonPlayerData(teacher, 'course-1', 'l1')).readOnly).toBe(true);
    vi.mocked(getEnrollment).mockResolvedValue(
      enrollment({ userUid: 'root', courseId: 'course-1' }),
    );
    const admin = await getLessonPlayerData(platformAdmin, 'course-1', 'l1');
    expect(admin.readOnly).toBe(true);
    expect(admin.tutorEnabled).toBe(false);
  });

  it('switches the tutor off when the school has aiEnabled false', async () => {
    vi.mocked(getEnrollment).mockResolvedValue(enrolled);
    vi.mocked(getSchool).mockResolvedValue(
      school({
        id: 'school-a',
        settings: { aiEnabled: false, aiDailyMessageLimit: null, joinCodesEnabled: true },
      }),
    );
    const data = await getLessonPlayerData(student, 'course-1', 'l1');
    expect(data.readOnly).toBe(false);
    expect(data.tutorEnabled).toBe(false);
  });

  it('answers not found for a lesson outside the course and for a hidden course', async () => {
    await expect(getLessonPlayerData(student, 'course-1', 'nope')).rejects.toBeInstanceOf(
      NotFoundError,
    );
    vi.mocked(getCourseAccess).mockResolvedValueOnce({ allowed: false, reason: 'not_visible' });
    await expect(getLessonPlayerData(student, 'course-1', 'l1')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('repairs a completed lesson whose effects are pending, telling the handler about the course', async () => {
    const completedAt = '2026-10-02T09:00:00.000Z';
    vi.mocked(getEnrollment).mockResolvedValue({ ...enrolled, status: 'completed', completedAt });
    vi.mocked(getLessonProgress).mockResolvedValue(
      progress({
        id: 'l1',
        userUid: 'student-1',
        courseId: 'course-1',
        status: 'completed',
        effectsApplied: false,
        completedAt,
      }),
    );
    const data = await getLessonPlayerData(student, 'course-1', 'l1');
    expect(onLessonCompleted).toHaveBeenCalledWith('student-1', {
      courseId: 'course-1',
      lessonId: 'l1',
      xpReward: 50,
      courseCompleted: true,
    });
    expect(data.progress?.effectsApplied).toBe(true);
  });

  it('repairs a passed attempt whose effects are pending and keeps the flag when that fails', async () => {
    vi.mocked(getEnrollment).mockResolvedValue({
      ...enrolled,
      quizSummary: { 'quiz-1': { attempts: 1, passed: true, bestPercent: 100, lastPercent: 100 } },
    });
    const pending = attempt({
      userUid: 'student-1',
      courseId: 'course-1',
      quizId: 'quiz-1',
      effectsApplied: false,
    });
    vi.mocked(getLatestAttempt).mockResolvedValue(pending);

    const repaired = await getLessonPlayerData(student, 'course-1', 'l2');
    expect(onQuizPassed).toHaveBeenCalledWith('student-1', {
      attemptId: pending.id,
      courseId: 'course-1',
      quizId: 'quiz-1',
      xpReward: 100,
    });
    expect(repaired.latestAttempts['quiz-1']?.effectsApplied).toBe(true);

    vi.mocked(onQuizPassed).mockRejectedValueOnce(new Error('ledger down'));
    const stillPending = await getLessonPlayerData(student, 'course-1', 'l2');
    expect(stillPending.latestAttempts['quiz-1']?.effectsApplied).toBe(false);
  });

  it('does not repair on behalf of a read-only viewer', async () => {
    vi.mocked(getEnrollment).mockResolvedValue(
      enrollment({ userUid: 'teacher-1', courseId: 'course-1' }),
    );
    vi.mocked(getLessonProgress).mockResolvedValue(
      progress({
        id: 'l1',
        userUid: 'teacher-1',
        courseId: 'course-1',
        status: 'completed',
        effectsApplied: false,
      }),
    );
    await getLessonPlayerData(teacher, 'course-1', 'l1');
    expect(onLessonCompleted).not.toHaveBeenCalled();
  });
});

// --- startLesson / saveResponse -------------------------------------------------------------

describe('startLesson and saveResponse', () => {
  it("starts a lesson in the actor's own name", async () => {
    await startLesson(student, 'course-1', 'l1');
    expect(markLessonStarted).toHaveBeenCalledWith(student, 'student-1', 'course-1', 'l1');
    await expect(startLesson(SYSTEM_ACTOR, 'course-1', 'l1')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(startLesson(schoolAdmin, 'course-1', 'l1')).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('saves a response only for a reflection or code-activity block of the lesson', async () => {
    vi.mocked(listBlocks).mockResolvedValue([
      richTextBlock('b1', 'course-1', 'l3'),
      reflectionBlock('r1', 'course-1', 'l3', 20),
    ]);
    await saveResponse(student, 'course-1', 'l3', 'r1', 'I learned a lot today.');
    expect(saveBlockResponse).toHaveBeenCalledWith(
      student,
      'student-1',
      'course-1',
      'l3',
      'r1',
      'I learned a lot today.',
    );
    await expect(saveResponse(student, 'course-1', 'l3', 'b1', 'x')).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(saveResponse(student, 'course-1', 'l3', 'zz', 'x')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

// --- completeLesson -------------------------------------------------------------------------

describe('completeLesson', () => {
  const completion = (courseCompleted: boolean) => ({
    alreadyCompleted: false,
    effectsApplied: false,
    courseCompleted,
    enrollment: { ...enrolled, completedLessonIds: ['l2'], completedLessonCount: 1 },
  });

  it('requires an enrollment and a learner of the course', async () => {
    await expect(completeLesson(student, 'course-1', 'l1')).rejects.toBeInstanceOf(NotFoundError);
    vi.mocked(getEnrollment).mockResolvedValue(
      enrollment({ userUid: 'teacher-1', courseId: 'course-1' }),
    );
    await expect(completeLesson(teacher, 'course-1', 'l1')).rejects.toBeInstanceOf(ForbiddenError);
    expect(applyLessonCompletion).not.toHaveBeenCalled();
  });

  it('reports what is missing: a quiz not passed, a project never submitted, a short reflection', async () => {
    vi.mocked(getEnrollment).mockResolvedValue(enrolled);
    const blocked = await completeLesson(student, 'course-1', 'l2');
    expect(blocked.completed).toBe(false);
    expect(blocked.missing).toEqual({
      quizIds: ['quiz-1'],
      projectIds: ['p1'],
      reflectionBlockIds: [],
    });

    vi.mocked(listBlocks).mockResolvedValue([reflectionBlock('r1', 'course-1', 'l3', 20)]);
    vi.mocked(getLessonProgress).mockResolvedValue(
      progress({
        id: 'l3',
        userUid: 'student-1',
        courseId: 'course-1',
        responses: { r1: { text: 'too short', updatedAt: '2026-10-02T08:00:00.000Z' } },
      }),
    );
    const reflection = await completeLesson(student, 'course-1', 'l3');
    expect(reflection.missing.reflectionBlockIds).toEqual(['r1']);
    expect(applyLessonCompletion).not.toHaveBeenCalled();
  });

  it('lets a learner move on from a quiz whose attempts are used up', async () => {
    vi.mocked(getEnrollment).mockResolvedValue({
      ...enrolled,
      quizSummary: { 'quiz-1': { attempts: 2, passed: false, bestPercent: 40, lastPercent: 40 } },
      projectSummary: { p1: { attempts: 1, latestSubmissionId: 'x', latestStatus: 'submitted' } },
    });
    vi.mocked(applyLessonCompletion).mockResolvedValue(completion(false));
    const result = await completeLesson(student, 'course-1', 'l2');
    expect(result.completed).toBe(true);
    expect(applyLessonCompletion).toHaveBeenCalledWith(student, 'student-1', 'course-1', 'l2', 3);
    // A passed quiz needs no definition read; an exhausted one does.
    expect(getQuiz).toHaveBeenCalledTimes(1);
  });

  it('completes the lesson and awards it, passing on whether the course was completed', async () => {
    vi.mocked(getEnrollment).mockResolvedValue(enrolled);
    vi.mocked(applyLessonCompletion).mockResolvedValue(completion(true));
    const result = await completeLesson(student, 'course-1', 'l1');
    expect(result.completed).toBe(true);
    expect(result.missing).toEqual({ quizIds: [], projectIds: [], reflectionBlockIds: [] });
    expect(result.enrollment.completedLessonIds).toEqual(['l2']);
    expect(onLessonCompleted).toHaveBeenCalledWith('student-1', {
      courseId: 'course-1',
      lessonId: 'l1',
      xpReward: 50,
      courseCompleted: true,
    });
    expect(result.gamification).toEqual(outcome());
  });

  it('answers the current state for a completed lesson, repairing pending effects only', async () => {
    vi.mocked(getEnrollment).mockResolvedValue(enrolled);
    vi.mocked(getLessonProgress).mockResolvedValue(
      progress({ id: 'l2', userUid: 'student-1', courseId: 'course-1', status: 'completed' }),
    );
    vi.mocked(applyLessonCompletion).mockResolvedValue({
      alreadyCompleted: true,
      effectsApplied: true,
      courseCompleted: false,
      enrollment: enrolled,
    });
    const settled = await completeLesson(student, 'course-1', 'l2');
    expect(settled.completed).toBe(true);
    expect(settled.gamification).toBeNull();
    expect(onLessonCompleted).not.toHaveBeenCalled();
    // The requirements are not re-checked for a lesson that is already completed.
    expect(getQuiz).not.toHaveBeenCalled();

    vi.mocked(applyLessonCompletion).mockResolvedValue({
      alreadyCompleted: true,
      effectsApplied: false,
      courseCompleted: true,
      enrollment: enrolled,
    });
    const repaired = await completeLesson(student, 'course-1', 'l2');
    expect(onLessonCompleted).toHaveBeenCalledWith(
      'student-1',
      expect.objectContaining({ lessonId: 'l2', courseCompleted: true }),
    );
    expect(repaired.gamification).toEqual(outcome());
  });

  it('still reports the completion when the gamification handler fails', async () => {
    vi.mocked(getEnrollment).mockResolvedValue(enrolled);
    vi.mocked(applyLessonCompletion).mockResolvedValue(completion(false));
    vi.mocked(onLessonCompleted).mockRejectedValueOnce(new Error('ledger down'));
    const result = await completeLesson(student, 'course-1', 'l1');
    expect(result.completed).toBe(true);
    expect(result.gamification).toBeNull();
  });
});
