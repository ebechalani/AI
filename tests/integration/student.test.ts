import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { SYSTEM_ACTOR } from '@/lib/auth/actor';
import { listUserBadges } from '@/lib/data/badges';
import { getCertificate, getCertificateByCode } from '@/lib/data/certificates';
import { applyLessonCompletion, getEnrollment, getLessonProgress } from '@/lib/data/enrollments';
import { getFile } from '@/lib/data/files';
import { getProject } from '@/lib/data/projects';
import { getLatestAttempt } from '@/lib/data/quizzes';
import { getSubmission } from '@/lib/data/submissions';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { collections, docIds, utcDayKey } from '@/lib/firebase/collections';
import { levelForXp } from '@/lib/gamification/levels';
import { CONTENT_LIMITS } from '@/lib/limits';
import { submitQuizAttempt } from '@/lib/services/assessment';
import {
  completeLesson,
  enrollSelf,
  getLessonPlayerData,
  saveResponse,
  startLesson,
} from '@/lib/services/learning';
import {
  generateAiReview,
  getSubmissionForViewer,
  registerUpload,
  submitWork,
} from '@/lib/services/project-flow';
import { completeSignup } from '@/lib/services/provisioning';
import type { Session, SignupInput, Submission } from '@/types';
import { resetEmulators, seedEmulators, signUpWithPassword } from './support/emulators';
import {
  attemptQuiz,
  buildOfficialCourse,
  CLEAN_STORY,
  CLIENT_KEY,
  DEMO_UID,
  ledgerIds,
  objectExists,
  PNG_BYTES,
  profileOf,
  projectTarget,
  putUserUpload,
  quizAnswers,
  REFLECTION_TEXT,
  refusal,
  respondToReflections,
  SEED_COURSE,
  SEED_PROJECT_ID,
  seedLesson,
  sessionFor,
  sessionOf,
  textWork,
  type BuiltCourse,
} from './support/world';

// The student flow of ARCHITECTURE.md 11.1 for an independent learner (section 1.5, path 1):
// no school and no class, so the AI review closes their work and the course certificate is
// issued by the system. The tests run in order and build on one another.

// provisioning imports the cookie helpers, whose module needs a Next.js request; nothing here
// starts a session (negative-session.test.ts does, with the request mocked).
vi.mock('@/lib/auth/session', () => ({ setSessionCookie: vi.fn(), clearSessionCookie: vi.fn() }));

const COURSE_ID = SEED_COURSE.id;
const PASSWORD = 'solo-password-1';

const SIGNUP: SignupInput = {
  displayName: 'Solo Learner',
  role: 'student',
  ageBand: '13-15',
  locale: 'en',
  acceptedTerms: true,
};

async function signUpStudent(
  email: string,
  displayName: string,
): Promise<{ session: Session; idToken: string }> {
  const { idToken } = await signUpWithPassword(email, PASSWORD);
  const profile = await completeSignup(
    idToken,
    { ...SIGNUP, displayName },
    { clientKey: CLIENT_KEY },
  );
  return { session: sessionOf(profile), idToken };
}

async function uploadUsageOf(uid: string): Promise<{ fileCount: number; bytes: number }> {
  const usage = await collections
    .uploadUsage()
    .doc(docIds.uploadUsage(uid, utcDayKey(new Date())))
    .get();
  return { fileCount: Number(usage.get('fileCount') ?? 0), bytes: Number(usage.get('bytes') ?? 0) };
}

describe('student flow: an independent learner in the seed course', () => {
  let admin: Session;
  let teacher: Session;
  let student: Session;
  let studentToken: string;
  let other: Session;
  let limited: BuiltCourse;
  let imageFileId: string;
  let submission: Submission;

  const lesson1 = seedLesson(0);
  const lesson2 = seedLesson(1);
  const lesson3 = seedLesson(2);
  const lesson4 = seedLesson(3);
  const quiz1 = lesson2.quizIds[0]!;
  const quiz2 = lesson4.quizIds[0]!;

  beforeAll(async () => {
    await resetEmulators();
    seedEmulators();
    admin = await sessionFor(DEMO_UID.admin);
    teacher = await sessionFor(DEMO_UID.teacher);
    ({ session: student, idToken: studentToken } = await signUpStudent(
      'solo.learner@example.test',
      'Solo Learner',
    ));
    ({ session: other } = await signUpStudent('other.learner@example.test', 'Other Learner'));
    limited = await buildOfficialCourse(admin, { title: 'Attempt limits', quizMaxAttempts: 1 });
  }, 240_000);

  it('self sign-up writes the profile once, with what the server derives', async () => {
    const profile = await profileOf(student.uid);
    expect(profile).toMatchObject({
      role: 'student',
      schoolId: null,
      classIds: [],
      email: 'solo.learner@example.test',
      username: null,
      ageBand: '13-15',
      consentBasis: 'self_13_plus',
      provisionedByUid: null,
      verifiedEducator: false,
      xpTotal: 0,
      level: 1,
    });
    await refusal(completeSignup(studentToken, SIGNUP, { clientKey: CLIENT_KEY }), ConflictError);
  });

  it('enrollSelf makes an unsupervised enrollment and is idempotent', async () => {
    const enrollment = await enrollSelf(student, COURSE_ID);
    expect(enrollment).toMatchObject({
      id: docIds.enrollment(student.uid, COURSE_ID),
      userUid: student.uid,
      courseId: COURSE_ID,
      classId: null,
      schoolId: null,
      source: 'self',
      status: 'active',
      completedLessonCount: 0,
      totalLessonCount: SEED_COURSE.lessons.length,
      certificateId: null,
    });
    const again = await enrollSelf(student, COURSE_ID);
    expect(again.startedAt).toBe(enrollment.startedAt);

    await refusal(enrollSelf(admin, COURSE_ID), ForbiddenError);
    await refusal(enrollSelf(teacher, COURSE_ID), ForbiddenError);
    await refusal(enrollSelf(student, 'no-such-course'), NotFoundError);
  });

  it("startLesson and saveResponse write the learner's own progress", async () => {
    await startLesson(student, COURSE_ID, lesson1.id);
    const started = await getLessonProgress(student, student.uid, COURSE_ID, lesson1.id);
    expect(started).toMatchObject({ status: 'in_progress', effectsApplied: true, responses: {} });
    expect((await getEnrollment(student, student.uid, COURSE_ID))?.lastLessonId).toBe(lesson1.id);

    const reflection = lesson1.reflections[0]!.blockId;
    const activity = lesson1.codeActivityIds[0]!;
    await saveResponse(student, COURSE_ID, lesson1.id, reflection, REFLECTION_TEXT);
    await saveResponse(student, COURSE_ID, lesson1.id, activity, 'print("hello")');
    const progress = await getLessonProgress(student, student.uid, COURSE_ID, lesson1.id);
    expect(progress?.responses[reflection]?.text).toBe(REFLECTION_TEXT);
    expect(progress?.responses[activity]?.text).toBe('print("hello")');

    await refusal(
      saveResponse(student, COURSE_ID, lesson1.id, lesson1.inertBlockId!, 'no'),
      NotFoundError,
    );
    const error = await refusal(
      saveResponse(
        student,
        COURSE_ID,
        lesson1.id,
        reflection,
        'x'.repeat(CONTENT_LIMITS.blockResponseChars + 1),
      ),
      ValidationError,
    );
    expect(error.fieldErrors).toEqual({ text: ['too_long'] });
  });

  it('submitQuizAttempt: a failed attempt hides the key, a pass earns the XP once', async () => {
    const failed = await attemptQuiz(student, COURSE_ID, quiz1, false);
    expect(failed.attempt).toMatchObject({
      attemptNumber: 1,
      passed: false,
      results: null,
      xpAwarded: 0,
      effectsApplied: true,
      classId: null,
    });
    expect(failed.correctOptionIds).toBeNull();
    expect(failed.explanations).toBeNull();
    expect(failed.attemptsRemaining).toBeNull();
    expect(failed.gamification).toBeNull();

    const passed = await attemptQuiz(student, COURSE_ID, quiz1, true);
    expect(passed.attempt).toMatchObject({ attemptNumber: 2, passed: true, scorePercent: 100 });
    expect(passed.attempt.results).not.toBeNull();
    expect(passed.correctOptionIds).not.toBeNull();
    expect(passed.gamification).toMatchObject({
      xpAwarded: SEED_COURSE.quizXp[quiz1],
      xpTotal: SEED_COURSE.quizXp[quiz1],
      newBadges: [],
      certificate: null,
    });

    const repeat = await attemptQuiz(student, COURSE_ID, quiz1, true);
    expect(repeat.attempt.attemptNumber).toBe(3);
    expect(repeat.attempt.xpAwarded).toBe(0);
    expect(repeat.gamification?.xpAwarded).toBe(0);

    const ledger = await ledgerIds(student.uid);
    expect(
      ledger.filter((id) => id === docIds.xpEntry('quiz', `${COURSE_ID}_${quiz1}`)),
    ).toHaveLength(1);
    const profile = await profileOf(student.uid);
    expect(profile.xpTotal).toBe(SEED_COURSE.quizXp[quiz1]);
    expect(profile.stats.quizzesPassed).toBe(1);
    const enrollment = await getEnrollment(student, student.uid, COURSE_ID);
    expect(enrollment?.quizSummary[quiz1]).toEqual({
      attempts: 3,
      passed: true,
      bestPercent: 100,
      lastPercent: 100,
    });
  });

  it('two concurrent submissions of the same attempt yield one attempt and one conflict', async () => {
    const answers = await quizAnswers(COURSE_ID, quiz2, true);
    const input = { courseId: COURSE_ID, quizId: quiz2, answers, locale: 'en' as const };
    const outcomes = await Promise.allSettled([
      submitQuizAttempt(student, input),
      submitQuizAttempt(student, input),
    ]);
    const fulfilled = outcomes.filter((outcome) => outcome.status === 'fulfilled');
    const rejected = outcomes.filter((outcome) => outcome.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]!.reason).toBeInstanceOf(ConflictError);

    const enrollment = await getEnrollment(student, student.uid, COURSE_ID);
    expect(enrollment?.quizSummary[quiz2]).toMatchObject({ attempts: 1, passed: true });
  });

  it('maxAttempts: a used-up quiz refuses another attempt, and the learner can still move on', async () => {
    const courseId = limited.course.id;
    await enrollSelf(other, courseId);
    await startLesson(other, courseId, limited.lessonId);

    const failed = await attemptQuiz(other, courseId, limited.quizId, false);
    expect(failed.attempt.passed).toBe(false);
    expect(failed.attemptsRemaining).toBe(0);
    // revealAnswers 'after_attempt': the key is shown even for a failed attempt.
    expect(failed.attempt.results).not.toBeNull();
    await refusal(attemptQuiz(other, courseId, limited.quizId, true), ConflictError);

    const blocked = await completeLesson(other, courseId, limited.lessonId);
    expect(blocked.completed).toBe(false);
    expect(blocked.missing).toEqual({
      quizIds: [],
      projectIds: [limited.projectId],
      reflectionBlockIds: [limited.reflectionBlockId],
    });

    await saveResponse(
      other,
      courseId,
      limited.lessonId,
      limited.reflectionBlockId,
      REFLECTION_TEXT,
    );
    const work = await submitWork(
      other,
      textWork(projectTarget(courseId, limited.projectId!), CLEAN_STORY),
    );
    const done = await completeLesson(other, courseId, limited.lessonId);
    expect(done.completed).toBe(true);
    expect(done.enrollment.status).toBe('completed');
    expect(done.enrollment.certificateId).toBeNull();
    expect(done.gamification?.certificate).toBeNull();

    // The accepted project was the last thing the certificate waited for.
    await generateAiReview(work.id);
    const enrollment = await getEnrollment(other, other.uid, courseId);
    expect(enrollment?.certificateId).toBe(docIds.certificate(other.uid, courseId));
    const certificate = await getCertificate(other, enrollment!.certificateId!);
    expect(certificate).toMatchObject({ status: 'issued', issuedBy: 'system', courseId });
  });

  it('registerUpload checks the object Storage holds, counts the quota and records the file', async () => {
    const { fileId, storagePath } = await putUserUpload(
      student.uid,
      'image',
      'story.png',
      PNG_BYTES,
      'image/png',
    );
    const registered = await registerUpload(student, {
      fileId,
      kind: 'image',
      fileName: 'story.png',
      purpose: 'submission',
      width: 1,
      height: 1,
    });
    expect(registered.media).toBeNull();
    expect(registered.file).toEqual({
      fileId,
      kind: 'image',
      fileName: 'story.png',
      contentType: 'image/png',
      sizeBytes: PNG_BYTES.length,
    });
    expect(await getFile(student, fileId)).toMatchObject({
      ownerUid: student.uid,
      schoolId: null,
      purpose: 'submission',
      storagePath,
      submissionId: null,
      width: 1,
      height: 1,
    });
    imageFileId = fileId;

    await refusal(
      registerUpload(student, {
        fileId: randomUUID(),
        kind: 'image',
        fileName: 'missing.png',
        purpose: 'submission',
      }),
      NotFoundError,
    );

    const text = await putUserUpload(
      student.uid,
      'image',
      'notes.png',
      Buffer.from('not an image'),
      'text/plain',
    );
    const error = await refusal(
      registerUpload(student, {
        fileId: text.fileId,
        kind: 'image',
        fileName: 'notes.png',
        purpose: 'submission',
      }),
      ValidationError,
    );
    expect(error.fieldErrors).toEqual({ file: ['file_type_not_allowed'] });
    expect(await objectExists(text.storagePath)).toBe(false);
    expect(await uploadUsageOf(student.uid)).toEqual({ fileCount: 1, bytes: PNG_BYTES.length });
  });

  it('submitWork attaches the file; a second open attempt and a foreign file are refused', async () => {
    const project = await getProject(SYSTEM_ACTOR, COURSE_ID, SEED_PROJECT_ID);
    submission = await submitWork(
      student,
      textWork(projectTarget(COURSE_ID, SEED_PROJECT_ID), CLEAN_STORY, { fileIds: [imageFileId] }),
    );
    expect(submission).toMatchObject({
      id: docIds.projectSubmission(student.uid, COURSE_ID, SEED_PROJECT_ID, 1),
      studentUid: student.uid,
      classId: null,
      schoolId: null,
      context: 'project',
      courseId: COURSE_ID,
      lessonId: lesson4.id,
      projectId: SEED_PROJECT_ID,
      attemptNumber: 1,
      status: 'submitted',
      aiReviewStatus: 'pending',
      aiRegenerations: 0,
      effectsApplied: true,
      xpAwarded: 0,
      rubric: project.rubric,
    });
    expect(submission.contextTitle.en?.title).toBe(project.translations.en?.title);
    expect(submission.attachments.map((attachment) => attachment.fileId)).toEqual([imageFileId]);
    expect((await getFile(student, imageFileId)).submissionId).toBe(submission.id);
    const enrollment = await getEnrollment(student, student.uid, COURSE_ID);
    expect(enrollment?.projectSummary[SEED_PROJECT_ID]).toEqual({
      attempts: 1,
      latestSubmissionId: submission.id,
      latestStatus: 'submitted',
    });

    await refusal(
      submitWork(student, textWork(projectTarget(COURSE_ID, SEED_PROJECT_ID))),
      ConflictError,
    );
    const foreign = await putUserUpload(other.uid, 'image', 'theirs.png', PNG_BYTES, 'image/png');
    await registerUpload(other, {
      fileId: foreign.fileId,
      kind: 'image',
      fileName: 'theirs.png',
      purpose: 'submission',
    });
    await refusal(
      submitWork(
        student,
        textWork(projectTarget(COURSE_ID, SEED_PROJECT_ID), CLEAN_STORY, {
          fileIds: [foreign.fileId],
        }),
      ),
      NotFoundError,
    );
    // The kind of work is checked before the open attempt is.
    const wrongType = await refusal(
      submitWork(
        student,
        textWork(projectTarget(COURSE_ID, SEED_PROJECT_ID), CLEAN_STORY, {
          type: 'code',
          content: { text: null, linkUrl: null, code: 'print(1)', codeLanguage: 'python' },
        }),
      ),
      ValidationError,
    );
    expect(wrongType.fieldErrors).toEqual({ type: ['invalid_choice'] });
  });

  it('generateAiReview on the mock provider closes the unsupervised attempt and pays its XP', async () => {
    await generateAiReview(submission.id);
    const view = await getSubmissionForViewer(student, submission.id);
    expect(view.submission).toMatchObject({
      status: 'ai_reviewed',
      aiReviewStatus: 'ready',
      aiRegenerations: 0,
      reviewedByUid: null,
      effectsApplied: true,
      xpAwarded: SEED_COURSE.projectXp[SEED_PROJECT_ID],
    });
    expect(view.submission.latestAiReviewId).not.toBeNull();
    expect(view.aiReview).toMatchObject({
      status: 'ready',
      provider: 'mock',
      confidence: 'high',
      flags: [],
      error: null,
    });
    expect(view.aiReview?.criteria).not.toBeNull();
    expect(view.reviews).toEqual([]);

    const expectedXp =
      SEED_COURSE.quizXp[quiz1]! +
      SEED_COURSE.quizXp[quiz2]! +
      SEED_COURSE.projectXp[SEED_PROJECT_ID]!;
    const profile = await profileOf(student.uid);
    expect(profile.xpTotal).toBe(expectedXp);
    expect(profile.level).toBe(levelForXp(expectedXp));
    expect(profile.stats.projectsAccepted).toBe(1);
    expect(await ledgerIds(student.uid)).toContain(
      docIds.xpEntry('project', `${COURSE_ID}_${SEED_PROJECT_ID}`),
    );
    const enrollment = await getEnrollment(student, student.uid, COURSE_ID);
    expect(enrollment?.projectSummary[SEED_PROJECT_ID]?.latestStatus).toBe('ai_reviewed');
    // The course is not completed yet, so nothing was certified.
    expect(enrollment?.certificateId).toBeNull();

    // A review that is not pending is left alone.
    await generateAiReview(submission.id);
    const unchanged = await getSubmission(student, submission.id);
    expect(unchanged.latestAiReviewId).toBe(view.submission.latestAiReviewId);
    expect(unchanged.aiRegenerations).toBe(0);
  });

  it('completeLesson reports what is missing, then completes the lesson and awards it', async () => {
    await startLesson(student, COURSE_ID, lesson3.id);
    const blocked = await completeLesson(student, COURSE_ID, lesson3.id);
    expect(blocked.completed).toBe(false);
    expect(blocked.gamification).toBeNull();
    expect(blocked.missing).toEqual({
      quizIds: [],
      projectIds: [],
      reflectionBlockIds: lesson3.reflections.map((reflection) => reflection.blockId),
    });
    expect(await getLessonProgress(student, student.uid, COURSE_ID, lesson3.id)).toMatchObject({
      status: 'in_progress',
    });

    await respondToReflections(student, COURSE_ID, lesson3);
    const done = await completeLesson(student, COURSE_ID, lesson3.id);
    expect(done.completed).toBe(true);
    expect(done.gamification).toMatchObject({ xpAwarded: lesson3.xpReward, leveledUp: false });
    expect(done.enrollment).toMatchObject({
      completedLessonIds: [lesson3.id],
      completedLessonCount: 1,
      progressPercent: 25,
      status: 'active',
    });
    expect(await getLessonProgress(student, student.uid, COURSE_ID, lesson3.id)).toMatchObject({
      status: 'completed',
      xpAwarded: lesson3.xpReward,
      effectsApplied: true,
    });

    const first = await completeLesson(student, COURSE_ID, lesson1.id);
    expect(first.completed).toBe(true);
    await respondToReflections(student, COURSE_ID, lesson2);
    const second = await completeLesson(student, COURSE_ID, lesson2.id);
    expect(second.completed).toBe(true);
    expect(second.enrollment).toMatchObject({ completedLessonCount: 3, progressPercent: 75 });

    // Completing a completed lesson again changes nothing and runs no handler.
    const again = await completeLesson(student, COURSE_ID, lesson1.id);
    expect(again).toMatchObject({ completed: true, gamification: null });
    const profile = await profileOf(student.uid);
    expect(profile.stats.lessonsCompleted).toBe(3);
    expect(profile.stats.coursesCompleted).toBe(0);
  });

  it('recovery: a completion whose handler never ran is repaired on the next read, certificate included', async () => {
    await startLesson(student, COURSE_ID, lesson4.id);
    await respondToReflections(student, COURSE_ID, lesson4);
    const before = await profileOf(student.uid);

    // The state transaction alone: what remains after a crash before onLessonCompleted (9.4).
    const outcome = await applyLessonCompletion(
      student,
      student.uid,
      COURSE_ID,
      lesson4.id,
      SEED_COURSE.lessons.length,
    );
    expect(outcome).toMatchObject({
      alreadyCompleted: false,
      effectsApplied: false,
      courseCompleted: true,
    });
    expect(outcome.enrollment).toMatchObject({
      status: 'completed',
      completedLessonCount: SEED_COURSE.lessons.length,
      progressPercent: 100,
      certificateId: null,
    });
    expect(outcome.enrollment.completedAt).not.toBeNull();
    expect((await profileOf(student.uid)).stats.coursesCompleted).toBe(1);

    const data = await getLessonPlayerData(student, COURSE_ID, lesson4.id);
    expect(data.readOnly).toBe(false);
    expect(data.tutorEnabled).toBe(true);
    expect(data.progress).toMatchObject({ status: 'completed', effectsApplied: true });
    expect(data.nextLessonId).toBeNull();
    expect(data.previousLessonId).toBe(lesson3.id);

    const badgeBonus = 100;
    const profile = await profileOf(student.uid);
    expect(profile.xpTotal).toBe(before.xpTotal + lesson4.xpReward + badgeBonus);
    expect(profile.level).toBe(levelForXp(profile.xpTotal));
    expect(profile.stats).toMatchObject({
      lessonsCompleted: 4,
      coursesCompleted: 1,
      badges: 1,
      certificates: 1,
    });
    const badges = await listUserBadges(student, student.uid);
    expect(badges.map((badge) => badge.badgeId)).toEqual([SEED_COURSE.pathwayId]);
    expect(badges[0]?.awardedBy).toBe('system');

    const enrollment = await getEnrollment(student, student.uid, COURSE_ID);
    expect(enrollment?.certificateId).toBe(docIds.certificate(student.uid, COURSE_ID));
    const certificate = await getCertificate(student, enrollment!.certificateId!);
    expect(certificate).toMatchObject({
      userUid: student.uid,
      recipientName: 'Solo Learner',
      courseId: COURSE_ID,
      pathwayId: SEED_COURSE.pathwayId,
      isOfficial: true,
      schoolId: null,
      schoolName: null,
      issuedBy: 'system',
      issuerName: 'RoboHolic AI',
      status: 'issued',
      revokedReason: null,
    });
    expect(certificate.verificationCode).toMatch(/^RH-[A-Z2-9]{10}$/);
    const verified = await getCertificateByCode(certificate.verificationCode);
    expect(verified).toMatchObject({ status: 'issued', isOfficial: true, schoolName: null });
    expect(verified).not.toHaveProperty('recipientName');
  });

  it('recovery: flags set to false by hand are repaired by a re-read without paying twice', async () => {
    const before = await profileOf(student.uid);
    const ledgerBefore = await ledgerIds(student.uid);

    const attemptRef = collections
      .quizAttempts()
      .doc(docIds.quizAttempt(student.uid, COURSE_ID, quiz1, 3));
    await attemptRef.update({ effectsApplied: false });
    const data = await getLessonPlayerData(student, COURSE_ID, lesson2.id);
    expect(data.latestAttempts[quiz1]?.effectsApplied).toBe(true);
    expect((await attemptRef.get()).get('effectsApplied')).toBe(true);
    expect((await getLatestAttempt(student, student.uid, COURSE_ID, quiz1))?.effectsApplied).toBe(
      true,
    );

    await collections.submissions().doc(submission.id).update({ effectsApplied: false });
    const view = await getSubmissionForViewer(student, submission.id);
    expect(view.submission).toMatchObject({
      effectsApplied: true,
      xpAwarded: SEED_COURSE.projectXp[SEED_PROJECT_ID],
    });

    const enrollmentId = docIds.enrollment(student.uid, COURSE_ID);
    await collections
      .lessonProgress(enrollmentId)
      .doc(lesson1.id)
      .update({ effectsApplied: false });
    const result = await completeLesson(student, COURSE_ID, lesson1.id);
    expect(result.completed).toBe(true);
    expect(result.gamification).toMatchObject({ xpAwarded: 0, newBadges: [], certificate: null });
    expect(await getLessonProgress(student, student.uid, COURSE_ID, lesson1.id)).toMatchObject({
      effectsApplied: true,
    });

    const after = await profileOf(student.uid);
    expect(after.xpTotal).toBe(before.xpTotal);
    expect(after.stats).toEqual(before.stats);
    expect(await ledgerIds(student.uid)).toEqual(ledgerBefore);
  });

  it('the XP ledger, the stats and the level add up', async () => {
    const expected = [
      ...SEED_COURSE.lessons.map((lesson) => docIds.xpEntry('lesson', `${COURSE_ID}_${lesson.id}`)),
      docIds.xpEntry('quiz', `${COURSE_ID}_${quiz1}`),
      docIds.xpEntry('quiz', `${COURSE_ID}_${quiz2}`),
      docIds.xpEntry('project', `${COURSE_ID}_${SEED_PROJECT_ID}`),
      docIds.xpEntry('badge', SEED_COURSE.pathwayId),
    ].sort();
    expect(await ledgerIds(student.uid)).toEqual(expected);

    const lessonXp = SEED_COURSE.lessons.reduce((sum, lesson) => sum + lesson.xpReward, 0);
    const total =
      lessonXp +
      SEED_COURSE.quizXp[quiz1]! +
      SEED_COURSE.quizXp[quiz2]! +
      SEED_COURSE.projectXp[SEED_PROJECT_ID]! +
      100;
    const profile = await profileOf(student.uid);
    expect(profile.xpTotal).toBe(total);
    expect(profile.level).toBe(levelForXp(total));
    expect(profile.stats).toEqual({
      lessonsCompleted: SEED_COURSE.lessons.length,
      quizzesPassed: 2,
      projectsAccepted: 1,
      challengesCompleted: 0,
      coursesCompleted: 1,
      badges: 1,
      certificates: 1,
    });
  });

  it('a teacher previews a student course read-only and cannot learn in it', async () => {
    const data = await getLessonPlayerData(teacher, COURSE_ID, lesson1.id);
    expect(data.readOnly).toBe(true);
    expect(data.enrollment).toBeNull();
    expect(data.progress).toBeNull();
    expect(data.tutorEnabled).toBe(false);
    await refusal(startLesson(teacher, COURSE_ID, lesson1.id), NotFoundError);
    await refusal(completeLesson(teacher, COURSE_ID, lesson1.id), NotFoundError);
  });
});
