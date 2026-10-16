import 'server-only';
import {
  FieldValue,
  type DocumentReference,
  type Query,
  type Transaction,
} from 'firebase-admin/firestore';
import { assertSystem, isSystem, type Actor } from '@/lib/auth/actor';
import {
  assertCan,
  canReviewSubmission,
  canViewAiReview,
  canViewSubmission,
  hasRole,
  isPlatformAdmin,
} from '@/lib/auth/authz';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { getAdminDb } from '@/lib/firebase/admin';
import { collections, docIds } from '@/lib/firebase/collections';
import {
  createdNow,
  fromQuery,
  fromSnapshot,
  fromSnapshotOrNull,
  serverTimestamp,
  updatedNow,
} from '@/lib/firebase/converters';
import { AI_LIMITS, FILE_ID_PATTERN, SUBMISSION_LIMITS } from '@/lib/limits';
import type { FileRef, Locale, Localized, Page, PageRequest, SubmissionType } from '@/types/common';
import type { Enrollment, ProjectSummaryEntry } from '@/types/learning';
import type {
  AiReview,
  AiReviewStatus,
  CriteriaScores,
  ReviewDecision,
  RubricWeight,
  Submission,
  SubmissionContent,
  SubmissionStatus,
  SubmissionTarget,
  TeacherReview,
} from '@/types/project';
import {
  assertCanReadClassRecords,
  assertCompositeId,
  assertId,
  assertTeachesAll,
  byNewest,
  clampLimit,
  isAlreadyExists,
  isMissingDocument,
  isSelf,
  isSelfOrAdmin,
  readPage,
  requireSession,
  updateExisting,
} from './internal-content';

// Submissions for projects and challenges, with their teacher reviews and AI reviews. The
// state machine is in ARCHITECTURE.md 3.4; this module owns `enrollments.projectSummary` and
// `challenges.submissionCount` (3.6).

/**
 * Built by services/project-flow.submitWork, which has checked the project or challenge, the
 * allowed submission type and the ownership of the files. The repository numbers the
 * attempt and enforces "one open attempt at a time".
 */
export interface NewSubmission {
  studentUid: string;
  /** Snapshot of the student's display name. */
  studentName: string;
  /** From classroom.resolveClassContext; `classId: null` = unsupervised. */
  classId: string | null;
  schoolId: string | null;
  target: SubmissionTarget;
  /** Project submissions: `project.lessonId`. null for a challenge entry. */
  lessonId: string | null;
  /** Snapshot of the project's or challenge's title, every locale. */
  contextTitle: Localized<{ title: string }>;
  /** Snapshot of the project's or challenge's rubric. */
  rubric: RubricWeight[];
  /**
   * The attempt the student is replacing, as their form knew it. ConflictError when it names
   * an attempt other than the stored latest one; null is accepted whatever is stored, and the
   * document always records the stored latest attempt.
   */
  previousSubmissionId: string | null;
  title: string;
  description: string;
  type: SubmissionType;
  content: SubmissionContent;
  /** The student's own registered, unattached submission files (data/files.toFileRef). */
  attachments: FileRef[];
  locale: Locale;
}

/**
 * Built by services/project-flow.reviewSubmission. `criteria` and `score` are what becomes the
 * grade: the AI suggestion's for 'approve', the teacher's own for 'modify', null for 'return'.
 * The reviewer is the actor.
 */
export interface NewReview {
  decision: ReviewDecision;
  criteria: CriteriaScores | null;
  score: number | null;
  feedback: string;
  /** The AI suggestion the teacher was looking at. */
  aiReviewId: string | null;
}

export type NewAiReview = Omit<AiReview, 'id' | 'submissionId' | 'createdAt'>;

function submissionDoc(submissionId: string): DocumentReference {
  assertCompositeId(submissionId);
  return collections.submissions().doc(submissionId);
}

// No existence oracle (4.4): a submission the actor may not see reads as missing.
function assertVisible(
  actor: Actor,
  submission: Submission | null,
  ref: DocumentReference,
): asserts submission is Submission {
  if (submission === null || !canViewSubmission(actor, submission)) {
    throw new NotFoundError(`${ref.path} does not exist.`);
  }
}

async function loadVisible(actor: Actor, submissionId: string): Promise<Submission> {
  const ref = submissionDoc(submissionId);
  const submission = fromSnapshotOrNull<Submission>(await ref.get());
  assertVisible(actor, submission, ref);
  return submission;
}

function isStaff(actor: Actor): boolean {
  return hasRole(actor, 'teacher', 'school_admin', 'platform_admin');
}

// --- Reads -------------------------------------------------------------------------------------

export async function getSubmission(actor: Actor, submissionId: string): Promise<Submission> {
  return loadVisible(actor, submissionId);
}

// How far back a list that is filtered in memory looks.
const FILTERED_READ_LIMIT = 200;

/**
 * Newest first. The student sees all their submissions. A teacher must name a class they
 * teach and sees the work that class reviews; a school admin sees that of their school.
 */
export async function listSubmissionsForStudent(
  actor: Actor,
  studentUid: string,
  opts?: { limit?: number; classId?: string; context?: 'project' | 'challenge' },
): Promise<Submission[]> {
  assertId(studentUid);
  const { classId, context } = opts ?? {};
  const limit = opts?.limit === undefined ? null : clampLimit(opts.limit);
  if (classId !== undefined) assertId(classId);

  const self = isSelf(actor, studentUid);
  const teacher = !self && !isSystem(actor) && actor.role === 'teacher';
  const schoolAdmin = !self && !isSystem(actor) && actor.role === 'school_admin';
  if (teacher) {
    if (classId === undefined) throw new ForbiddenError('A teacher lists submissions per class.');
    await assertCanReadClassRecords(actor, classId);
  } else {
    assertCan(isSelfOrAdmin(actor, studentUid) || schoolAdmin, 'submissions.list');
  }

  const submissions = collections.submissions();
  let query: Query;
  let filterInMemory = schoolAdmin;
  if (classId !== undefined && !self) {
    query = submissions
      .where('classId', '==', classId)
      .where('studentUid', '==', studentUid)
      .orderBy('submittedAt', 'desc');
    filterInMemory ||= context !== undefined;
  } else if (context !== undefined) {
    // Equality only (3.7): no index is spent on it, and the order is made here.
    const snapshot = await submissions
      .where('studentUid', '==', studentUid)
      .where('context', '==', context)
      .get();
    const found = fromQuery<Submission>(snapshot)
      .filter((submission) => !schoolAdmin || canViewSubmission(actor, submission))
      .sort(byNewest((submission) => submission.submittedAt));
    return limit === null ? found : found.slice(0, limit);
  } else {
    query = submissions.where('studentUid', '==', studentUid).orderBy('submittedAt', 'desc');
  }

  if (!filterInMemory) {
    return fromQuery<Submission>(await (limit === null ? query : query.limit(limit)).get());
  }
  const found = fromQuery<Submission>(await query.limit(FILTERED_READ_LIMIT).get()).filter(
    (submission) =>
      (context === undefined || submission.context === context) &&
      (!schoolAdmin || canViewSubmission(actor, submission)),
  );
  return limit === null ? found : found.slice(0, limit);
}

function latestChallengeEntry(studentUid: string, challengeId: string): Query {
  return collections
    .submissions()
    .where('studentUid', '==', studentUid)
    .where('challengeId', '==', challengeId)
    .orderBy('attemptNumber', 'desc')
    .limit(1);
}

function projectSummaryOf(enrollment: Enrollment, projectId: string): ProjectSummaryEntry | null {
  const summary = enrollment.projectSummary ?? {};
  return Object.hasOwn(summary, projectId) ? summary[projectId]! : null;
}

/** The student's latest attempt at a project (through the enrollment) or a challenge. */
export async function getLatestSubmission(
  actor: Actor,
  studentUid: string,
  target: { courseId: string; projectId: string } | { challengeId: string },
): Promise<Submission | null> {
  assertId(studentUid);
  let submission: Submission | null = null;
  if ('challengeId' in target) {
    assertId(target.challengeId);
    const snapshot = await latestChallengeEntry(studentUid, target.challengeId).get();
    submission = fromQuery<Submission>(snapshot)[0] ?? null;
  } else {
    assertId(target.courseId);
    assertId(target.projectId);
    const enrollment = fromSnapshotOrNull<Enrollment>(
      await collections.enrollments().doc(docIds.enrollment(studentUid, target.courseId)).get(),
    );
    const latestId =
      enrollment === null
        ? null
        : projectSummaryOf(enrollment, target.projectId)?.latestSubmissionId;
    if (latestId) {
      submission = fromSnapshotOrNull<Submission>(await submissionDoc(latestId).get());
    }
  }

  // No existence oracle (4.4): a submission the actor may not see is answered exactly like
  // no submission at all. Staff get null either way, so a teacher cannot tell whether a
  // student outside their classes has submitted; anyone else may not ask about this student.
  if (submission !== null && canViewSubmission(actor, submission)) return submission;
  if (!isSelfOrAdmin(actor, studentUid) && !isStaff(actor)) {
    throw new NotFoundError(`users/${studentUid} has no submission the actor may see.`);
  }
  return null;
}

function reviewQueue(classIds: string[]): Query {
  return collections
    .submissions()
    .where('classId', 'in', classIds)
    .where('status', '==', 'submitted' satisfies SubmissionStatus);
}

const REVIEW_QUEUE_LIMIT = { default: 200, max: 500 } as const;

/** Work waiting for a review in the classes the actor teaches, oldest first. */
export async function listReviewQueue(
  actor: Actor,
  classIds: string[],
  opts?: { limit?: number },
): Promise<Submission[]> {
  const taught = assertTeachesAll(actor, classIds);
  if (taught.length === 0) return [];
  const limit = clampLimit(opts?.limit, REVIEW_QUEUE_LIMIT.default, REVIEW_QUEUE_LIMIT.max);
  const snapshot = await reviewQueue(taught).orderBy('submittedAt').limit(limit).get();
  return fromQuery<Submission>(snapshot);
}

export async function countReviewQueue(actor: Actor, classIds: string[]): Promise<number> {
  const taught = assertTeachesAll(actor, classIds);
  if (taught.length === 0) return 0;
  const snapshot = await reviewQueue(taught).count().get();
  return snapshot.data().count;
}

/** Every submission a class reviews or reviewed, newest first, 50 per page. */
export async function listSubmissionsForClass(
  actor: Actor,
  classId: string,
  page?: PageRequest,
): Promise<Page<Submission>> {
  await assertCanReadClassRecords(actor, classId);
  const query = collections
    .submissions()
    .where('classId', '==', classId)
    .orderBy('submittedAt', 'desc');
  return readPage<Submission>(
    query,
    collections.submissions(),
    page,
    (data) => data.classId === classId,
  );
}

/** The entries of a challenge, for the platform admin's list. */
export async function listSubmissionsForChallenge(
  actor: Actor,
  challengeId: string,
  page?: PageRequest,
): Promise<Page<Submission>> {
  assertCan(isPlatformAdmin(actor), 'challenge.entries.list');
  assertId(challengeId);
  const query = collections
    .submissions()
    .where('challengeId', '==', challengeId)
    .orderBy('submittedAt', 'desc');
  return readPage<Submission>(
    query,
    collections.submissions(),
    page,
    (data) => data.challengeId === challengeId,
  );
}

// --- Creating ------------------------------------------------------------------------------------

// A new attempt is accepted when there is none yet, or when the latest one was returned, and
// never beyond the cap. 'approved' and 'ai_reviewed' are final.
function assertMaySubmit(attempts: number, latestStatus: SubmissionStatus | null): void {
  if (latestStatus !== null && latestStatus !== 'returned') {
    throw new ConflictError(
      `The latest attempt is '${latestStatus}'; only a returned one is redone.`,
    );
  }
  if (attempts >= SUBMISSION_LIMITS.maxAttempts) {
    throw new ConflictError('No attempt is left for this work.');
  }
}

export async function createSubmission(actor: Actor, input: NewSubmission): Promise<Submission> {
  assertSystem(actor);
  const { studentUid, target } = input;
  assertId(studentUid);
  if (input.attachments.length > SUBMISSION_LIMITS.maxAttachments) {
    throw new ValidationError('Too many attachments.', { fileIds: ['too_many_files'] });
  }
  const fileRefs = [...new Set(input.attachments.map((attachment) => attachment.fileId))].map(
    (fileId) => {
      if (!FILE_ID_PATTERN.test(fileId)) throw new NotFoundError('Malformed file id.');
      return collections.files().doc(fileId);
    },
  );
  if (fileRefs.length !== input.attachments.length) {
    throw new ValidationError('A file is attached twice.', { fileIds: ['duplicate'] });
  }

  const submissions = collections.submissions();
  let submissionId: string;
  try {
    submissionId = await getAdminDb().runTransaction(async (tx) => {
      let attemptNumber: number;
      let previousSubmissionId: string | null;
      let ref: DocumentReference;
      let countIn: () => void;

      if (target.context === 'project') {
        const { courseId, projectId } = target;
        assertId(courseId);
        assertId(projectId);
        const enrollmentRef = collections
          .enrollments()
          .doc(docIds.enrollment(studentUid, courseId));
        const summary = projectSummaryOf(
          fromSnapshot<Enrollment>(await tx.get(enrollmentRef)),
          projectId,
        );
        assertMaySubmit(summary?.attempts ?? 0, summary?.latestStatus ?? null);
        attemptNumber = (summary?.attempts ?? 0) + 1;
        previousSubmissionId = summary?.latestSubmissionId ?? null;
        ref = submissions.doc(
          docIds.projectSubmission(studentUid, courseId, projectId, attemptNumber),
        );
        countIn = () =>
          tx.update(enrollmentRef, {
            [`projectSummary.${projectId}`]: {
              attempts: attemptNumber,
              latestSubmissionId: ref.id,
              latestStatus: 'submitted',
            } satisfies ProjectSummaryEntry,
            lastActivityAt: serverTimestamp(),
            ...updatedNow(),
          });
      } else {
        const { challengeId } = target;
        assertId(challengeId);
        const latest =
          fromQuery<Submission>(await tx.get(latestChallengeEntry(studentUid, challengeId)))[0] ??
          null;
        assertMaySubmit(latest?.attemptNumber ?? 0, latest?.status ?? null);
        attemptNumber = (latest?.attemptNumber ?? 0) + 1;
        previousSubmissionId = latest?.id ?? null;
        ref = submissions.doc(docIds.challengeSubmission(studentUid, challengeId, attemptNumber));
        // The challenge counts students who entered, not attempts.
        countIn = () => {
          if (attemptNumber > 1) return;
          tx.update(collections.challenges().doc(challengeId), {
            submissionCount: FieldValue.increment(1),
            ...updatedNow(),
          });
        };
      }
      if (
        input.previousSubmissionId !== null &&
        input.previousSubmissionId !== previousSubmissionId
      ) {
        throw new ConflictError('The attempt being replaced is not the latest one.');
      }

      const files = fileRefs.length > 0 ? await tx.getAll(...fileRefs) : [];
      for (const file of files) {
        const attachable =
          file.get('ownerUid') === studentUid &&
          file.get('purpose') === 'submission' &&
          file.get('submissionId') === null;
        if (!attachable) throw new ConflictError(`${file.ref.path} cannot be attached.`);
      }

      tx.create(ref, {
        studentUid,
        studentName: input.studentName,
        schoolId: input.schoolId,
        classId: input.classId,
        context: target.context,
        courseId: target.context === 'project' ? target.courseId : null,
        lessonId: target.context === 'project' ? input.lessonId : null,
        projectId: target.context === 'project' ? target.projectId : null,
        challengeId: target.context === 'challenge' ? target.challengeId : null,
        contextTitle: input.contextTitle,
        attemptNumber,
        previousSubmissionId,
        title: input.title,
        description: input.description,
        type: input.type,
        content: {
          text: input.content.text,
          linkUrl: input.content.linkUrl,
          code: input.content.code,
          codeLanguage: input.content.codeLanguage,
        },
        attachments: input.attachments.map((attachment) => ({
          fileId: attachment.fileId,
          kind: attachment.kind,
          fileName: attachment.fileName,
          contentType: attachment.contentType,
          sizeBytes: attachment.sizeBytes,
        })),
        locale: input.locale,
        status: 'submitted' satisfies SubmissionStatus,
        aiReviewStatus: 'pending' satisfies AiReviewStatus,
        latestAiReviewId: null,
        aiRegenerations: 0,
        rubric: input.rubric,
        finalScore: null,
        finalCriteria: null,
        finalFeedback: null,
        reviewedByUid: null,
        reviewedAt: null,
        xpAwarded: 0,
        // Nothing is owed to the student until the work is accepted (9.4).
        effectsApplied: true,
        submittedAt: serverTimestamp(),
        ...createdNow(),
      });
      countIn();
      for (const fileRef of fileRefs) tx.update(fileRef, { submissionId: ref.id });
      return ref.id;
    });
  } catch (error) {
    // Two submissions sent at the same moment: the second finds the attempt number taken.
    if (isAlreadyExists(error)) throw new ConflictError('This attempt was already submitted.');
    throw error;
  }
  return fromSnapshot<Submission>(await submissionDoc(submissionId).get());
}

// --- Decisions -----------------------------------------------------------------------------------

/**
 * Reads the enrollment whose `projectSummary` mirrors this submission, and returns the write
 * that sets its `latestStatus`. Nothing is written for a challenge entry, or when a newer
 * attempt has taken the summary over.
 */
async function summaryStatusWrite(
  tx: Transaction,
  submission: Submission,
): Promise<(status: SubmissionStatus) => void> {
  const { courseId, projectId } = submission;
  if (submission.context !== 'project' || courseId === null || projectId === null) return () => {};
  const ref = collections.enrollments().doc(docIds.enrollment(submission.studentUid, courseId));
  const enrollment = fromSnapshotOrNull<Enrollment>(await tx.get(ref));
  if (enrollment === null) return () => {};
  if (projectSummaryOf(enrollment, projectId)?.latestSubmissionId !== submission.id)
    return () => {};
  return (status) =>
    tx.update(ref, { [`projectSummary.${projectId}.latestStatus`]: status, ...updatedNow() });
}

/**
 * A teacher's decision on work that is waiting ('submitted'): stores the review, copies it
 * onto the submission as the final grade and feedback, and for an accepted submission leaves
 * `effectsApplied: false` for onSubmissionAccepted to pick up.
 */
export async function addReview(
  actor: Actor,
  submissionId: string,
  input: NewReview,
): Promise<Submission> {
  const reviewer = requireSession(actor, 'Reviewing a submission');
  const accepted = input.decision !== 'return';
  if (accepted && (input.criteria === null || input.score === null)) {
    throw new ValidationError('An accepted submission needs its scores.', {
      criteria: ['required'],
    });
  }
  const criteria = accepted ? input.criteria : null;
  const score = accepted ? input.score : null;
  const status: SubmissionStatus = accepted ? 'approved' : 'returned';

  const ref = submissionDoc(submissionId);
  const reviewRef = collections.reviews(submissionId).doc();
  await getAdminDb().runTransaction(async (tx) => {
    const submission = fromSnapshotOrNull<Submission>(await tx.get(ref));
    assertVisible(actor, submission, ref);
    assertCan(canReviewSubmission(actor, submission), 'submission.review');
    if (submission.status !== 'submitted') {
      throw new ConflictError(`${ref.path} is '${submission.status}' and takes no review.`);
    }
    // An approval grades with the AI suggestion read before the transaction: a co-teacher may
    // have asked for a new one since (WS-D-4).
    if (
      input.decision === 'approve' &&
      (submission.aiReviewStatus !== 'ready' || submission.latestAiReviewId !== input.aiReviewId)
    ) {
      throw new ConflictError(`${ref.path} has a newer AI suggestion than the one approved.`);
    }
    const writeSummaryStatus = await summaryStatusWrite(tx, submission);

    tx.create(reviewRef, {
      reviewerUid: reviewer.uid,
      reviewerName: reviewer.displayName,
      decision: input.decision,
      criteria,
      score,
      feedback: input.feedback,
      aiReviewId: input.aiReviewId,
      createdAt: serverTimestamp(),
    });
    tx.update(ref, {
      status,
      finalScore: score,
      finalCriteria: criteria,
      finalFeedback: input.feedback,
      reviewedByUid: reviewer.uid,
      reviewedAt: serverTimestamp(),
      effectsApplied: accepted ? false : undefined,
      ...updatedNow(),
    });
    writeSummaryStatus(status);
  });
  return fromSnapshot<Submission>(await ref.get());
}

/** The history of teacher decisions, newest first. Staff only: never the student. */
export async function listReviews(actor: Actor, submissionId: string): Promise<TeacherReview[]> {
  const submission = await loadVisible(actor, submissionId);
  assertCan(isStaff(actor) && !isSelf(actor, submission.studentUid), 'submission.reviews.list');
  const snapshot = await collections.reviews(submissionId).orderBy('createdAt', 'desc').get();
  return fromQuery<TeacherReview>(snapshot, { submissionId });
}

// The unsupervised flow: no teacher exists, so the outcome of the AI review closes the
// attempt. It applies only while the submission is still open and still unsupervised; a
// student who joined a class in the meantime is now reviewed by its teacher.
async function closeUnsupervised(
  submissionId: string,
  status: Extract<SubmissionStatus, 'ai_reviewed' | 'returned'>,
): Promise<Submission> {
  const ref = submissionDoc(submissionId);
  await getAdminDb().runTransaction(async (tx) => {
    const submission = fromSnapshot<Submission>(await tx.get(ref));
    if (submission.classId !== null) {
      throw new ConflictError(`${ref.path} is reviewed by class ${submission.classId}.`);
    }
    if (submission.status === status && submission.reviewedByUid === null) return;
    if (submission.status !== 'submitted') {
      throw new ConflictError(`${ref.path} is '${submission.status}' and cannot be closed again.`);
    }
    const writeSummaryStatus = await summaryStatusWrite(tx, submission);

    tx.update(ref, {
      status,
      reviewedByUid: null,
      reviewedAt: serverTimestamp(),
      effectsApplied: status === 'ai_reviewed' ? false : undefined,
      ...updatedNow(),
    });
    writeSummaryStatus(status);
  });
  return fromSnapshot<Submission>(await ref.get());
}

/** Unsupervised acceptance: 'ai_reviewed', with `effectsApplied: false` until the XP is granted. */
export async function markAiReviewed(actor: Actor, submissionId: string): Promise<Submission> {
  assertSystem(actor);
  return closeUnsupervised(submissionId, 'ai_reviewed');
}

/** Unsupervised return: 'returned' with no reviewer; the student may submit again. */
export async function markAiReturned(actor: Actor, submissionId: string): Promise<Submission> {
  assertSystem(actor);
  return closeUnsupervised(submissionId, 'returned');
}

export async function markSubmissionEffectsApplied(
  actor: Actor,
  submissionId: string,
  xpAwarded: number,
): Promise<void> {
  assertSystem(actor);
  await updateExisting(submissionDoc(submissionId), {
    effectsApplied: true,
    xpAwarded,
    ...updatedNow(),
  });
}

// --- AI reviews ----------------------------------------------------------------------------------

export async function getAiReview(
  actor: Actor,
  submissionId: string,
  aiReviewId: string,
): Promise<AiReview> {
  const submission = await loadVisible(actor, submissionId);
  assertCan(canViewAiReview(actor, submission), 'submission.ai_review.view');
  assertId(aiReviewId);
  const snapshot = await collections.aiReviews(submissionId).doc(aiReviewId).get();
  return fromSnapshot<AiReview>(snapshot, { submissionId });
}

/** Stores the suggestion (or the failure) and makes it the submission's latest AI review. */
export async function saveAiReview(
  actor: Actor,
  submissionId: string,
  review: NewAiReview,
): Promise<AiReview> {
  assertSystem(actor);
  const submissionRef = submissionDoc(submissionId);
  const ref = collections.aiReviews(submissionId).doc();
  const batch = getAdminDb().batch();
  batch.create(ref, {
    status: review.status,
    provider: review.provider,
    model: review.model,
    promptVersion: review.promptVersion,
    locale: review.locale,
    criteria: review.criteria,
    overallSuggestedScore: review.overallSuggestedScore,
    writtenFeedback: review.writtenFeedback,
    strengths: review.strengths,
    improvements: review.improvements,
    confidence: review.confidence,
    limitations: review.limitations,
    flags: review.flags,
    error: review.error,
    inputTokens: review.inputTokens,
    outputTokens: review.outputTokens,
    createdAt: serverTimestamp(),
  });
  batch.update(submissionRef, {
    latestAiReviewId: ref.id,
    aiReviewStatus: review.status satisfies AiReviewStatus,
    ...updatedNow(),
  });
  try {
    await batch.commit();
  } catch (error) {
    if (isMissingDocument(error)) throw new NotFoundError(`${submissionRef.path} does not exist.`);
    throw error;
  }
  return fromSnapshot<AiReview>(await ref.get(), { submissionId });
}

/**
 * Starts a regeneration: 'pending' and one more on the counter. At the limit nothing is
 * counted; a review that was still 'pending' is given up as 'failed', so the submission does
 * not wait for ever, and the call fails with ConflictError.
 */
export async function setAiReviewPending(actor: Actor, submissionId: string): Promise<void> {
  assertSystem(actor);
  const ref = submissionDoc(submissionId);
  const started = await getAdminDb().runTransaction(async (tx) => {
    const submission = fromSnapshot<Submission>(await tx.get(ref));
    if (submission.aiRegenerations >= AI_LIMITS.review.maxRegenerations) {
      if (submission.aiReviewStatus === 'pending') {
        tx.update(ref, { aiReviewStatus: 'failed' satisfies AiReviewStatus, ...updatedNow() });
      }
      return false;
    }
    tx.update(ref, {
      aiReviewStatus: 'pending' satisfies AiReviewStatus,
      aiRegenerations: submission.aiRegenerations + 1,
      ...updatedNow(),
    });
    return true;
  });
  if (!started) throw new ConflictError(`${ref.path} has used its AI review regenerations.`);
}

export async function setAiReviewSkipped(actor: Actor, submissionId: string): Promise<void> {
  assertSystem(actor);
  await updateExisting(submissionDoc(submissionId), {
    aiReviewStatus: 'skipped' satisfies AiReviewStatus,
    ...updatedNow(),
  });
}

// --- Class context and attachments (system only) -------------------------------------------------

/**
 * Re-points an open submission at the class that now reviews it. A submission that has been
 * reviewed keeps the class it was reviewed in (3.4), so for those this does nothing.
 */
export async function setSubmissionClassContext(
  actor: Actor,
  submissionId: string,
  ctx: { classId: string | null; schoolId: string | null },
): Promise<void> {
  assertSystem(actor);
  const ref = submissionDoc(submissionId);
  await getAdminDb().runTransaction(async (tx) => {
    const submission = fromSnapshot<Submission>(await tx.get(ref));
    if (submission.status !== 'submitted') return;
    tx.update(ref, { classId: ctx.classId, schoolId: ctx.schoolId, ...updatedNow() });
  });
}

/**
 * The student's submissions still waiting for a review, newest first: all of them, or those
 * of one course; `classId` keeps the ones a given class reviews, or with null the
 * unsupervised ones.
 */
export async function listOpenSubmissionsForStudent(
  actor: Actor,
  studentUid: string,
  filter: { courseId?: string; classId?: string | null },
): Promise<Submission[]> {
  assertSystem(actor);
  assertId(studentUid);
  const own = collections.submissions().where('studentUid', '==', studentUid);
  let query: Query;
  if (filter.courseId === undefined) {
    query = own.orderBy('submittedAt', 'desc');
  } else {
    assertId(filter.courseId);
    query = own.where('courseId', '==', filter.courseId);
  }
  return fromQuery<Submission>(await query.get())
    .filter(
      (submission) =>
        submission.status === 'submitted' &&
        (filter.classId === undefined || submission.classId === filter.classId),
    )
    .sort(byNewest((submission) => submission.submittedAt));
}

/** Takes the file off the submission. The file record and the object are the caller's to delete. */
export async function removeAttachment(
  actor: Actor,
  submissionId: string,
  fileId: string,
): Promise<void> {
  assertSystem(actor);
  const ref = submissionDoc(submissionId);
  await getAdminDb().runTransaction(async (tx) => {
    const submission = fromSnapshot<Submission>(await tx.get(ref));
    const attachments = submission.attachments.filter((attachment) => attachment.fileId !== fileId);
    if (attachments.length === submission.attachments.length) return;
    tx.update(ref, { attachments, ...updatedNow() });
  });
}
