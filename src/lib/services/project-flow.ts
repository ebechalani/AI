import 'server-only';
import { suggestReview, type AiReviewInput } from '@/lib/ai/grading';
import { getAiProvider } from '@/lib/ai/index';
import { GRADING_PROMPT_VERSION } from '@/lib/ai/prompts/grading';
import { sanitizeUserText } from '@/lib/ai/safety';
import { AiError } from '@/lib/ai/types';
import { SYSTEM_ACTOR, type Actor, type Session } from '@/lib/auth/actor';
import {
  assertCan,
  assertRole,
  canEditCourse,
  canReviewSubmission,
  canViewAiReview,
  hasRole,
  isPlatformAdmin,
} from '@/lib/auth/authz';
import {
  checkAndCountAiUsage,
  recordAiBlocked,
  recordAiTokens,
  type AiUsageSubject,
} from '@/lib/data/ai-usage';
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
  toFileRef,
  toMediaRef,
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
  type NewAiReview,
} from '@/lib/data/submissions';
import { getUser } from '@/lib/data/users';
import { ConflictError, NotFoundError, RateLimitError, ValidationError } from '@/lib/errors';
import { clearDownloadTokens, deleteObject, statObject } from '@/lib/firebase/storage-admin';
import {
  authorMediaPath,
  checkUpload,
  isPublicMediaPath,
  officialMediaPath,
  userUploadPath,
} from '@/lib/firebase/storage-paths';
import { onSubmissionAccepted } from '@/lib/gamification/events';
import { pickTranslation } from '@/lib/i18n/content';
import { getChallengePhase } from '@/lib/learning/challenge-phase';
import { AI_LIMITS, FILE_ID_PATTERN } from '@/lib/limits';
import { parseInput } from '@/lib/schemas/common';
import {
  registerUploadInputSchema,
  reviewInputSchema,
  submitWorkInputSchema,
} from '@/lib/schemas/submission';
import type {
  AgeBand,
  FileRecord,
  FileRef,
  Locale,
  Localized,
  MediaRef,
  SubmissionType,
} from '@/types/common';
import type { GamificationOutcome } from '@/types/gamification';
import type { RegisterUploadInput, ReviewInput, SubmitWorkInput } from '@/types/inputs';
import type {
  AiReview,
  AiReviewFlag,
  CriteriaScores,
  RubricKey,
  RubricWeight,
  Submission,
  SubmissionStatus,
  TeacherReview,
} from '@/types/project';
import { getCourseAccess } from './access';
import { resolveClassContext } from './classroom';
import {
  applyEffects,
  orNullIfMissing,
  requireCourseAccess,
  requireSessionActor,
  titleSnapshot,
  weightedScore,
} from './internal-common';

// Uploads, submissions, AI review and teacher review (ARCHITECTURE.md 3.4, 5.2, 8.4, 9.4,
// 10.3). The AI review is a suggestion stored next to the submission; only reviewSubmission,
// called by a teacher, writes a grade. In the unsupervised flow (no class) the suggestion
// closes the attempt instead.

const ACCEPTED: readonly SubmissionStatus[] = ['approved', 'ai_reviewed'];

/** With one of these the unsupervised flow returns the work instead of accepting it (3.4). */
const REJECTING_FLAGS: readonly AiReviewFlag[] = [
  'off_topic',
  'unsafe_content',
  'possible_prompt_injection',
];

// --- Uploads -----------------------------------------------------------------------------------

/**
 * The server's half of an upload (5.2): the storage path is built from the session, the
 * object's real type and size are read back from Storage, the daily quota is counted, the
 * download token is removed and `files/{fileId}` is created. An object that fails a check is
 * deleted again.
 */
export async function registerUpload(
  actor: Actor,
  input: RegisterUploadInput,
): Promise<{ file: FileRef; media: MediaRef | null }> {
  const session = requireSessionActor(actor, 'upload.register');
  assertRole(actor, 'student', 'teacher', 'platform_admin');
  const parsed = parseInput(registerUploadInputSchema, input);
  if (!parsed.success) throw new ValidationError('Invalid upload.', parsed.fieldErrors);
  const data = parsed.data;
  const { fileId, kind, fileName } = data;

  let storagePath: string;
  let courseId: string | null = null;
  if (data.purpose === 'submission') {
    storagePath = userUploadPath(session.uid, kind, fileId, fileName);
  } else {
    assertRole(actor, 'teacher', 'platform_admin');
    courseId = data.courseId;
    if (courseId === null) {
      // Media without a course (challenge covers) is official media.
      assertCan(isPlatformAdmin(actor), 'media.official');
      storagePath = officialMediaPath(fileId, fileName);
    } else {
      const course = await getCourse(actor, courseId);
      assertCan(canEditCourse(actor, course), 'course.edit');
      storagePath =
        course.isOfficial && isPlatformAdmin(actor)
          ? officialMediaPath(fileId, fileName)
          : authorMediaPath(session.uid, fileId, fileName);
    }
  }

  const object = await statObject(storagePath);
  if (object === null) throw new NotFoundError(`Nothing was uploaded to ${storagePath}.`);
  const problem = checkUpload(kind, {
    contentType: object.contentType,
    sizeBytes: object.sizeBytes,
    fileName,
  });
  if (problem !== null) {
    await deleteObject(storagePath);
    throw new ValidationError(`Upload refused: ${problem}.`, { file: [problem] });
  }
  const quota = await checkAndCountUpload(actor, object.sizeBytes);
  if (!quota.allowed) {
    await deleteObject(storagePath);
    throw new RateLimitError(null, `users/${session.uid} has used today's upload quota.`);
  }
  await clearDownloadTokens(storagePath);

  const record = await registerFile(SYSTEM_ACTOR, {
    id: fileId,
    ownerUid: session.uid,
    schoolId: session.schoolId,
    purpose: data.purpose,
    kind,
    storagePath,
    fileName,
    contentType: object.contentType,
    sizeBytes: object.sizeBytes,
    width: kind === 'image' ? (data.width ?? null) : null,
    height: kind === 'image' ? (data.height ?? null) : null,
    courseId,
  });
  return {
    file: toFileRef(record),
    media: data.purpose === 'course_media' ? toMediaRef(record) : null,
  };
}

// --- Submitting --------------------------------------------------------------------------------

interface SubmissionTargetDefinition {
  courseId: string | null;
  lessonId: string | null;
  contextTitle: Localized<{ title: string }>;
  rubric: RubricWeight[];
  allowedSubmissionTypes: SubmissionType[];
}

/**
 * A student submits work for a project of a course they are enrolled in, or an entry to an
 * open challenge. One open attempt at a time and at most ten, enforced by the repository's
 * transaction. The class that reviews the work is resolved by classroom.resolveClassContext.
 */
export async function submitWork(
  actor: Actor,
  input: SubmitWorkInput & { locale: Locale },
): Promise<Submission> {
  const session = requireSessionActor(actor, 'work.submit');
  assertRole(actor, 'student');
  const { locale, ...work } = input;
  const parsed = parseInput(submitWorkInputSchema, work);
  if (!parsed.success) throw new ValidationError('Invalid submission.', parsed.fieldErrors);
  const data = parsed.data;
  const { target } = data;

  let definition: SubmissionTargetDefinition;
  if (target.context === 'project') {
    const [course, enrollment] = await Promise.all([
      getCourse(actor, target.courseId),
      getEnrollment(actor, session.uid, target.courseId),
    ]);
    if (enrollment === null) {
      throw new NotFoundError(
        `users/${session.uid} is not enrolled in courses/${target.courseId}.`,
      );
    }
    await requireCourseAccess(actor, course);
    const project = await getProject(actor, target.courseId, target.projectId);
    // A project no lesson shows cannot be reached by a learner (3.6, 9.5).
    if (project.lessonId === null) {
      throw new ConflictError(`projects/${project.id} is not part of a lesson.`);
    }
    definition = {
      courseId: target.courseId,
      lessonId: project.lessonId,
      contextTitle: titleSnapshot(project.translations),
      rubric: project.rubric,
      allowedSubmissionTypes: project.allowedSubmissionTypes,
    };
  } else {
    const challenge = await getChallenge(actor, target.challengeId);
    if (getChallengePhase(challenge, new Date()) !== 'open') {
      throw new ConflictError(`challenges/${challenge.id} is not open for entries.`);
    }
    definition = {
      courseId: null,
      lessonId: null,
      contextTitle: titleSnapshot(challenge.translations),
      rubric: challenge.rubric,
      allowedSubmissionTypes: challenge.allowedSubmissionTypes,
    };
  }
  if (!definition.allowedSubmissionTypes.includes(data.type)) {
    throw new ValidationError('This kind of work is not accepted here.', {
      type: ['invalid_choice'],
    });
  }

  // A file of someone else reads as missing; a file already attached, or course media, is a
  // conflict. The repository checks the same inside its transaction.
  const files = await getOwnFiles(actor, data.fileIds);
  for (const file of files) {
    if (file.purpose !== 'submission' || file.submissionId !== null) {
      throw new ConflictError(`files/${file.id} cannot be attached.`);
    }
  }

  const context = await resolveClassContext(session.uid, definition.courseId);
  return createSubmission(SYSTEM_ACTOR, {
    studentUid: session.uid,
    studentName: session.displayName,
    classId: context.classId,
    schoolId: context.schoolId,
    target,
    lessonId: definition.lessonId,
    contextTitle: definition.contextTitle,
    rubric: definition.rubric,
    previousSubmissionId: data.previousSubmissionId,
    title: data.title,
    description: data.description,
    type: data.type,
    content: data.content,
    attachments: files.map(toFileRef),
    locale,
  });
}

/**
 * Removes an attachment: the reference on the submission, the file record, then the object.
 * The owner may do it while the work is still waiting for a review; a teacher who reviews the
 * submission (or a platform admin) at any time, with an audit entry.
 */
export async function deleteAttachment(
  actor: Actor,
  submissionId: string,
  fileId: string,
): Promise<void> {
  const session = requireSessionActor(actor, 'attachment.delete');
  const submission = await getSubmission(actor, submissionId);
  const owner = submission.studentUid === session.uid;
  const reviewer = canReviewSubmission(actor, submission);
  assertCan(reviewer || (owner && submission.status === 'submitted'), 'attachment.delete');
  if (!submission.attachments.some((attachment) => attachment.fileId === fileId)) {
    throw new NotFoundError(`submissions/${submissionId} has no attachment ${fileId}.`);
  }

  const file = await orNullIfMissing(getFile(SYSTEM_ACTOR, fileId));
  await removeAttachment(SYSTEM_ACTOR, submissionId, fileId);
  await deleteFile(SYSTEM_ACTOR, fileId);
  if (file !== null) await deleteObject(file.storagePath);
  if (!owner) {
    await writeAudit(actor, {
      action: 'file.deleted',
      targetType: 'file',
      targetId: fileId,
      schoolId: submission.schoolId,
      meta: { submissionId, studentUid: submission.studentUid },
    });
  }
}

// --- Acceptance effects ------------------------------------------------------------------------

/** The XP an accepted submission earns, from its project or challenge, and the ledger ref. */
async function acceptedReward(
  submission: Submission,
): Promise<{ refId: string; xpReward: number }> {
  if (submission.context === 'project') {
    if (submission.courseId === null || submission.projectId === null) {
      throw new Error(`submissions/${submission.id} names no project.`);
    }
    const project = await getProject(SYSTEM_ACTOR, submission.courseId, submission.projectId);
    return { refId: project.id, xpReward: project.xpReward };
  }
  if (submission.challengeId === null) {
    throw new Error(`submissions/${submission.id} names no challenge.`);
  }
  const challenge = await getChallenge(SYSTEM_ACTOR, submission.challengeId);
  return { refId: challenge.id, xpReward: challenge.xpReward };
}

/** onSubmissionAccepted for an accepted submission; null when it failed and stays pending. */
async function settleAcceptance(submission: Submission): Promise<GamificationOutcome | null> {
  return applyEffects('onSubmissionAccepted', async () => {
    const reward = await acceptedReward(submission);
    return onSubmissionAccepted(submission.studentUid, {
      submissionId: submission.id,
      context: submission.context,
      refId: reward.refId,
      courseId: submission.courseId,
      xpReward: reward.xpReward,
    });
  });
}

// --- AI review ---------------------------------------------------------------------------------

function cut(text: string, max: number): { text: string; truncated: boolean } {
  return text.length > max
    ? { text: text.slice(0, max), truncated: true }
    : { text, truncated: false };
}

/** The hostname of a link, never the URL itself (8.4). */
function hostOf(url: string | null): string | null {
  if (url === null) return null;
  try {
    return new URL(url).hostname || null;
  } catch {
    return null;
  }
}

/** What leaves the server for a review (8.4): redacted, cut to the budget, no names or URLs. */
async function buildReviewInput(submission: Submission, ageBand: AgeBand): Promise<AiReviewInput> {
  const { locale } = submission;
  let about: { title: string; brief: string; requirements: string };
  if (submission.context === 'project') {
    if (submission.courseId === null || submission.projectId === null) {
      throw new Error(`submissions/${submission.id} names no project.`);
    }
    const project = await getProject(SYSTEM_ACTOR, submission.courseId, submission.projectId);
    const text = pickTranslation(project.translations, locale, project.defaultLocale);
    about = { title: text.title, brief: text.brief, requirements: text.requirements };
  } else {
    if (submission.challengeId === null) {
      throw new Error(`submissions/${submission.id} names no challenge.`);
    }
    const challenge = await getChallenge(SYSTEM_ACTOR, submission.challengeId);
    const text = pickTranslation(challenge.translations, locale, challenge.defaultLocale);
    about = {
      title: text.title,
      brief: text.description,
      requirements: text.submissionRequirements,
    };
  }

  const budget = AI_LIMITS.reviewInput;
  const description = cut(sanitizeUserText(submission.description), budget.description);
  const text =
    submission.content.text === null
      ? null
      : cut(sanitizeUserText(submission.content.text), budget.text);
  const code =
    submission.content.code === null
      ? null
      : cut(sanitizeUserText(submission.content.code), budget.code);
  return {
    locale,
    ageBand,
    projectTitle: about.title,
    projectBrief: about.brief,
    requirements: about.requirements,
    rubric: submission.rubric,
    submission: {
      title: sanitizeUserText(submission.title),
      description: description.text,
      type: submission.type,
      text: text?.text ?? null,
      code: code?.text ?? null,
      codeLanguage: submission.content.codeLanguage,
      linkHost: hostOf(submission.content.linkUrl),
      attachments: submission.attachments.map(({ kind, sizeBytes }) => ({ kind, sizeBytes })),
      truncated: description.truncated || text?.truncated === true || code?.truncated === true,
    },
  };
}

function failedReview(locale: Locale, error: AiError): NewAiReview {
  return {
    status: 'failed',
    provider: getAiProvider().id,
    model: 'unknown',
    promptVersion: GRADING_PROMPT_VERSION,
    locale,
    criteria: null,
    overallSuggestedScore: null,
    writtenFeedback: null,
    strengths: [],
    improvements: [],
    confidence: null,
    limitations: [],
    flags: [],
    error: error.reason,
    inputTokens: error.usage.inputTokens,
    outputTokens: error.usage.outputTokens,
  };
}

/** The unsupervised flow accepts work that has content and that no rejecting flag marks (3.4). */
function isAcceptableUnsupervised(submission: Submission, review: NewAiReview): boolean {
  if (review.status !== 'ready') return false;
  if (review.flags.some((flag) => REJECTING_FLAGS.includes(flag))) return false;
  const { content } = submission;
  return (
    (content.text !== null && content.text.trim() !== '') ||
    (content.code !== null && content.code.trim() !== '') ||
    content.linkUrl !== null ||
    submission.attachments.length > 0
  );
}

// No teacher exists, so the suggestion closes the attempt. The repository refuses when a class
// has started to review the work in the meantime; then it is the teacher's.
async function closeUnsupervised(submission: Submission, review: NewAiReview): Promise<void> {
  try {
    if (isAcceptableUnsupervised(submission, review)) {
      const accepted = await markAiReviewed(SYSTEM_ACTOR, submission.id);
      await settleAcceptance(accepted);
    } else {
      await markAiReturned(SYSTEM_ACTOR, submission.id);
    }
  } catch (error) {
    if (!(error instanceof ConflictError)) throw error;
  }
}

async function runAiReview(submissionId: string): Promise<void> {
  const submission = await getSubmission(SYSTEM_ACTOR, submissionId);
  if (submission.status !== 'submitted' || submission.aiReviewStatus !== 'pending') return;

  const student = await getUser(SYSTEM_ACTOR, submission.studentUid);
  const subject: AiUsageSubject = {
    uid: student.id,
    role: student.role,
    schoolId: student.schoolId,
  };
  const usage = await checkAndCountAiUsage(subject, 'review');
  if (!usage.allowed) {
    await setAiReviewSkipped(SYSTEM_ACTOR, submissionId);
    return;
  }

  const input = await buildReviewInput(submission, student.ageBand);
  let review: NewAiReview;
  try {
    const output = await suggestReview(input);
    review = {
      status: 'ready',
      provider: output.provider,
      model: output.model,
      promptVersion: output.promptVersion,
      locale: submission.locale,
      criteria: output.criteria,
      overallSuggestedScore: output.overallSuggestedScore,
      writtenFeedback: output.writtenFeedback,
      strengths: output.strengths,
      improvements: output.improvements,
      confidence: output.confidence,
      limitations: output.limitations,
      flags: output.flags,
      error: null,
      inputTokens: output.usage.inputTokens,
      outputTokens: output.usage.outputTokens,
    };
  } catch (error) {
    if (!(error instanceof AiError)) throw error;
    review = failedReview(submission.locale, error);
    if (error.reason === 'blocked') await recordAiBlocked(subject);
  }
  await saveAiReview(SYSTEM_ACTOR, submissionId, review);
  await recordAiTokens(subject, {
    inputTokens: review.inputTokens,
    outputTokens: review.outputTokens,
  });

  // Without a usable review the attempt stays open: the owner may regenerate (3.4).
  if (submission.classId === null && review.status === 'ready') {
    await closeUnsupervised(submission, review);
  }
}

/**
 * System work, started by submitWork's caller after the response and by the two regeneration
 * paths: runs the AI review of a submission whose review is 'pending'. The student's AI usage
 * is checked and counted first; when it is refused the status becomes 'skipped'. A failed
 * call is recorded as a 'failed' review. Never throws: an unexpected failure is logged and
 * leaves the status 'pending', which getSubmissionForViewer picks up again (9.4).
 */
export async function generateAiReview(submissionId: string): Promise<void> {
  try {
    await runAiReview(submissionId);
  } catch (error) {
    console.error(`[services/project-flow] AI review of ${submissionId} did not finish`, error);
  }
}

/**
 * One more generation (9.4): 'pending' and the counter, or false at the limit, where the
 * repository has given the review up as 'failed'.
 */
async function startRegeneration(submissionId: string): Promise<boolean> {
  try {
    await setAiReviewPending(SYSTEM_ACTOR, submissionId);
    return true;
  } catch (error) {
    if (error instanceof ConflictError) return false;
    throw error;
  }
}

/**
 * A teacher who reviews the submission, a platform admin, or the owner of an unsupervised
 * submission whose review failed or was skipped, asks for another suggestion; at most three
 * per submission (ConflictError beyond). The review runs before this returns.
 */
export async function regenerateAiReview(actor: Actor, submissionId: string): Promise<void> {
  const session = requireSessionActor(actor, 'ai_review.regenerate');
  const submission = await getSubmission(actor, submissionId);
  const reviewer = canReviewSubmission(actor, submission);
  const owner = submission.classId === null && submission.studentUid === session.uid;
  assertCan(reviewer || owner, 'ai_review.regenerate');
  if (submission.status !== 'submitted') {
    throw new ConflictError(`submissions/${submissionId} is '${submission.status}'.`);
  }
  if (
    !reviewer &&
    submission.aiReviewStatus !== 'failed' &&
    submission.aiReviewStatus !== 'skipped'
  ) {
    throw new ConflictError(`submissions/${submissionId} has a review under way or ready.`);
  }
  await setAiReviewPending(SYSTEM_ACTOR, submissionId);
  await generateAiReview(submissionId);
}

// --- Viewing -----------------------------------------------------------------------------------

/**
 * The submission as its viewer may see it: with the latest AI review for whoever passes
 * canViewAiReview, and the teacher reviews for staff. On the way it finishes what an
 * interrupted run left behind (9.4): the effects of an accepted submission, and an AI review
 * still 'pending' two minutes after submission, which is generated again (one regeneration;
 * after three the status becomes 'failed').
 */
export async function getSubmissionForViewer(
  actor: Actor,
  submissionId: string,
): Promise<{ submission: Submission; aiReview: AiReview | null; reviews: TeacherReview[] }> {
  const session = requireSessionActor(actor, 'submission.view');
  let submission = await getSubmission(actor, submissionId);

  if (!submission.effectsApplied && ACCEPTED.includes(submission.status)) {
    const outcome = await settleAcceptance(submission);
    if (outcome !== null) submission = await getSubmission(actor, submissionId);
  }
  if (
    submission.status === 'submitted' &&
    submission.aiReviewStatus === 'pending' &&
    Date.now() - Date.parse(submission.submittedAt) > AI_LIMITS.reviewRetriggerAfterMs
  ) {
    if (await startRegeneration(submissionId)) await generateAiReview(submissionId);
    submission = await getSubmission(actor, submissionId);
  }

  const staff =
    hasRole(actor, 'teacher', 'school_admin', 'platform_admin') &&
    session.uid !== submission.studentUid;
  const [aiReview, reviews] = await Promise.all([
    submission.latestAiReviewId !== null && canViewAiReview(actor, submission)
      ? getAiReview(actor, submissionId, submission.latestAiReviewId)
      : null,
    staff ? listReviews(actor, submissionId) : [],
  ]);
  return { submission, aiReview, reviews };
}

// --- Downloads ---------------------------------------------------------------------------------

/**
 * Whether a session other than the owner or a platform admin may download the file (6.9): a
 * submission file for whoever may view the submission that still lists it (canViewSubmission:
 * the reviewing teacher, a school admin of the school); course media for any session when it
 * is official (public anyway), else for whoever may edit the course or open it (getCourseAccess
 * applies canViewCourse first, so the media of a private course is as private as the course).
 */
async function mayDownload(session: Session, file: FileRecord): Promise<boolean> {
  if (file.purpose === 'submission') {
    if (file.submissionId === null) return false;
    const submission = await orNullIfMissing(getSubmission(session, file.submissionId));
    return (
      submission !== null &&
      submission.attachments.some((attachment) => attachment.fileId === file.id)
    );
  }
  if (isPublicMediaPath(file.storagePath)) return true;
  if (file.courseId === null) return false;
  const course = await orNullIfMissing(getCourse(SYSTEM_ACTOR, file.courseId));
  if (course === null) return false;
  return canEditCourse(session, course) || (await getCourseAccess(session, course)).allowed;
}

/**
 * For GET /api/files/[fileId] (6.9): the file record when the actor may download the file. The
 * record is read as the system, since data/files.getFile answers only the owner and platform
 * admins. Every refusal, a malformed id, a missing file or a removed attachment alike, is the
 * same NotFoundError, so the route gives away no existence oracle.
 */
export async function getFileForDownload(actor: Actor, fileId: string): Promise<FileRecord> {
  const session = requireSessionActor(actor, 'file.download');
  const hidden = new NotFoundError(`files/${fileId} does not exist.`);
  if (typeof fileId !== 'string' || !FILE_ID_PATTERN.test(fileId)) throw hidden;

  const file = await orNullIfMissing(getFile(SYSTEM_ACTOR, fileId));
  if (file === null) throw hidden;
  if (file.ownerUid === session.uid || isPlatformAdmin(actor)) return file;
  if (await mayDownload(session, file)) return file;
  throw hidden;
}

// --- Teacher review ----------------------------------------------------------------------------

function scoresOf(criteria: Record<RubricKey, { score: number }>): CriteriaScores {
  return {
    creativity: criteria.creativity.score,
    technicalQuality: criteria.technicalQuality.score,
    understanding: criteria.understanding.score,
    responsibleAi: criteria.responsibleAi.score,
  };
}

/**
 * A teacher's decision on work waiting in their review queue (10.3). `approve` takes the AI
 * suggestion's scores as the grade and is accepted only when that review is ready, carries no
 * flag and is not of low confidence (8.4); `modify` grades with the teacher's own criteria,
 * weighted by the submission's rubric; `return` records feedback only. An accepted submission
 * earns its XP here.
 */
export async function reviewSubmission(
  actor: Actor,
  input: ReviewInput,
): Promise<{ submission: Submission; gamification: GamificationOutcome | null }> {
  requireSessionActor(actor, 'submission.review');
  assertRole(actor, 'teacher', 'platform_admin');
  const parsed = parseInput(reviewInputSchema, input);
  if (!parsed.success) throw new ValidationError('Invalid review.', parsed.fieldErrors);
  const { submissionId, decision, feedback } = parsed.data;

  const submission = await getSubmission(actor, submissionId);
  assertCan(canReviewSubmission(actor, submission), 'submission.review');
  if (submission.status !== 'submitted') {
    throw new ConflictError(`submissions/${submissionId} is '${submission.status}'.`);
  }

  let criteria: CriteriaScores | null = null;
  let score: number | null = null;
  if (decision === 'approve') {
    const aiReview =
      submission.aiReviewStatus === 'ready' && submission.latestAiReviewId !== null
        ? await getAiReview(actor, submissionId, submission.latestAiReviewId)
        : null;
    if (
      aiReview === null ||
      aiReview.status !== 'ready' ||
      aiReview.flags.length > 0 ||
      aiReview.confidence === 'low' ||
      aiReview.criteria === null ||
      aiReview.overallSuggestedScore === null
    ) {
      throw new ConflictError(
        `submissions/${submissionId} has no AI suggestion that can be approved as is.`,
      );
    }
    criteria = scoresOf(aiReview.criteria);
    score = aiReview.overallSuggestedScore;
  } else if (decision === 'modify') {
    if (parsed.data.criteria === null) {
      throw new ValidationError('Scores are required.', { criteria: ['required'] });
    }
    criteria = parsed.data.criteria;
    score = weightedScore(criteria, submission.rubric);
  }

  const reviewed = await addReview(actor, submissionId, {
    decision,
    criteria,
    score,
    feedback,
    aiReviewId: submission.latestAiReviewId,
  });
  await writeAudit(actor, {
    action: 'submission.reviewed',
    targetType: 'submission',
    targetId: submissionId,
    schoolId: submission.schoolId,
    meta: { decision, score, studentUid: submission.studentUid },
  });
  if (decision === 'return') return { submission: reviewed, gamification: null };

  const gamification = await settleAcceptance(reviewed);
  return {
    submission: gamification === null ? reviewed : await getSubmission(actor, submissionId),
    gamification,
  };
}
