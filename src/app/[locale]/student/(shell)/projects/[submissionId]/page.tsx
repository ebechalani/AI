import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, Trophy } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { AiFeedback } from '@/components/projects/AiFeedback';
import { BriefDetails } from '@/components/projects/BriefDetails';
import { CheckAgainButton } from '@/components/projects/CheckAgainButton';
import { OutcomeNotice } from '@/components/projects/OutcomeNotice';
import {
  challengeBrief,
  latestArg,
  projectBrief,
  resubmitState,
  showsAiFeedback,
  studentOutcome,
  targetOf,
} from '@/components/projects/projects-model';
import { RegenerateAiReviewButton } from '@/components/projects/RegenerateAiReviewButton';
import { seedFrom } from '@/components/projects/submission-form-model';
import { TeacherFeedback } from '@/components/projects/TeacherFeedback';
import { WorkSection } from '@/components/projects/WorkSection';
import { LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { getLatestSubmission } from '@/lib/data/submissions';
import { isAppError } from '@/lib/errors';
import { pickTranslation } from '@/lib/i18n/content';
import { getChallengePhase } from '@/lib/learning/challenge-phase';
import { AttemptFacts } from './_components/AttemptFacts';
import { loadForStudent, readDefinition } from './_components/load';
import { RefreshOnce } from './_components/RefreshOnce';
import { ResubmitSection } from './_components/ResubmitSection';

type Params = Promise<{ submissionId: string }>;

// "Ask Robo AI again" and a review still pending after two minutes both run the review inline,
// which can take up to four minutes on a real provider (SPEC-D 3.3).
export const maxDuration = 300;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { submissionId } = await params;
  try {
    const { submission } = await loadForStudent(submissionId);
    return { title: submission.title };
  } catch (error) {
    if (isAppError(error)) return { title: (await getTranslations('nav'))('student.projects') };
    throw error;
  }
}

/** The submission, or the shell's not-found page for a missing, malformed or hidden id. */
async function viewOrNotFound(submissionId: string) {
  try {
    return await loadForStudent(submissionId);
  } catch (error) {
    if (isAppError(error) && (error.code === 'not_found' || error.code === 'forbidden')) {
      notFound();
    }
    throw error;
  }
}

// One attempt at a project or a challenge (ARCHITECTURE.md 6.4, 3.7 "submission detail"): where
// it stands, the feedback, a new version when it was returned, and the work itself.
export default async function StudentSubmissionPage({ params }: { params: Params }) {
  const session = await requireRole('student');
  const { submissionId } = await params;
  const { submission, aiReview, updatedDuringRead } = await viewOrNotFound(submissionId);
  const target = targetOf(submission);
  const returned = submission.status === 'returned';
  const [definition, latest, locale, t, tNav, tDomain] = await Promise.all([
    readDefinition(session, submission),
    // Only returned work can get a new version, and only from its latest attempt.
    returned && target !== null
      ? getLatestSubmission(session, session.uid, latestArg(target))
      : Promise.resolve(null),
    getLocale(),
    getTranslations('projects'),
    getTranslations('nav'),
    getTranslations('domain'),
  ]);

  const outcome = studentOutcome(submission);
  const latestId = latest?.id ?? null;
  const challenge = definition?.kind === 'challenge' ? definition.challenge : null;
  const project = definition?.kind === 'project' ? definition.project : null;
  const allowedTypes = (project ?? challenge)?.allowedSubmissionTypes ?? [];
  const resubmit = resubmitState({
    submission,
    latestId,
    definitionAvailable: challenge !== null || (project !== null && project.lessonId !== null),
    challengeOpen: challenge === null ? null : getChallengePhase(challenge, new Date()) === 'open',
  });
  const brief =
    project !== null
      ? projectBrief(project, locale)
      : challenge !== null
        ? challengeBrief(challenge, locale)
        : null;

  const contextTitle = pickTranslation(submission.contextTitle, locale, submission.locale).title;
  const kind = tDomain(`project.kinds.${submission.context}`);
  const { courseId, lessonId, challengeId } = submission;
  const actions =
    submission.context === 'project' && courseId !== null && lessonId !== null ? (
      <LinkButton
        href={`/student/learn/courses/${courseId}/lessons/${lessonId}`}
        variant="secondary"
      >
        <ArrowLeft aria-hidden="true" className="rtl:rotate-180" />
        {t('detail.backToLesson')}
      </LinkButton>
    ) : submission.context === 'challenge' && challengeId !== null ? (
      <LinkButton href={`/student/challenges/${challengeId}`} variant="secondary">
        <Trophy aria-hidden="true" />
        {t('detail.openChallenge')}
      </LinkButton>
    ) : undefined;
  const canDelete = submission.status === 'submitted';
  const teacherReviewed =
    submission.status === 'approved' || (returned && submission.reviewedByUid !== null);

  return (
    <>
      {updatedDuringRead && <RefreshOnce />}
      <PageHeader
        title={submission.title}
        description={contextTitle ? `${kind} · ${contextTitle}` : kind}
        breadcrumbs={[
          { label: tNav('student.projects'), href: '/student/projects' },
          { label: submission.title },
        ]}
        actions={actions}
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-2">
          <OutcomeNotice
            outcome={outcome}
            headingLevel="h2"
            retryHint
            focusKey={`${submission.id}/${submission.status}/${submission.aiReviewStatus}/${submission.aiRegenerations}`}
          >
            {outcome.kind === 'ai_pending' && (
              <CheckAgainButton
                label={t('outcome.checkAgain')}
                stillPendingLabel={t('outcome.aiPending.still')}
              />
            )}
            {outcome.kind === 'ai_unavailable' && outcome.retriesLeft > 0 && (
              <RegenerateAiReviewButton submissionId={submission.id} audience="student" />
            )}
          </OutcomeNotice>
          {teacherReviewed && <TeacherFeedback submission={submission} />}
          {aiReview !== null && showsAiFeedback(submission, aiReview) && (
            <AiFeedback aiReview={aiReview} submission={submission} />
          )}
          <BriefDetails
            title={t('detail.brief.title')}
            text={brief}
            allowedTypes={definition === null ? null : allowedTypes}
            unavailable={t('detail.brief.unavailable')}
          />
          {returned && resubmit !== 'not_returned' && (
            <ResubmitSection
              state={resubmit}
              submissionId={submission.id}
              target={target}
              allowedTypes={allowedTypes}
              seed={seedFrom(submission)}
              latestId={latestId}
            />
          )}
          <WorkSection
            submission={submission}
            title={t('detail.work.title')}
            canDelete={canDelete}
            hint={canDelete ? t('attachments.ownerHint') : null}
          />
        </div>
        <aside className="min-w-0 lg:col-start-3 lg:row-start-1">
          <AttemptFacts submission={submission} />
        </aside>
      </div>
    </>
  );
}
