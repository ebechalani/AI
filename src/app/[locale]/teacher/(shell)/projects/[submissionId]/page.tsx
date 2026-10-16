import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UserRound } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { AiSuggestion } from '@/components/projects/AiSuggestion';
import { BriefDetails } from '@/components/projects/BriefDetails';
import { challengeBrief, projectBrief } from '@/components/projects/projects-model';
import { approveBlock } from '@/components/projects/review-model';
import { ReviewPanel } from '@/components/projects/ReviewPanel';
import { WorkSection } from '@/components/projects/WorkSection';
import { LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { isAppError } from '@/lib/errors';
import { pickTranslation } from '@/lib/i18n/content';
import { AI_LIMITS } from '@/lib/limits';
import { loadForTeacher, readDefinition } from './_components/load';
import { ReviewHistory } from './_components/ReviewHistory';
import { SubmissionSummary } from './_components/SubmissionSummary';

type Params = Promise<{ submissionId: string }>;

// "Ask for a new suggestion" runs the review inline, and so does a page load while a review is
// still pending after two minutes: up to four minutes on a real provider (SPEC-D 3.3).
export const maxDuration = 300;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { submissionId } = await params;
  try {
    const { submission } = await loadForTeacher(submissionId);
    return { title: submission.title };
  } catch (error) {
    if (isAppError(error)) return { title: (await getTranslations('nav'))('teacher.projects') };
    throw error;
  }
}

/** The submission, or the shell's not-found page outside the teacher's classes. */
async function viewOrNotFound(submissionId: string) {
  try {
    return await loadForTeacher(submissionId);
  } catch (error) {
    if (isAppError(error) && (error.code === 'not_found' || error.code === 'forbidden')) {
      notFound();
    }
    throw error;
  }
}

// The review screen (ARCHITECTURE.md 6.5, 8.4): the work, the AI suggestion and the teacher's
// decision. A teacher who can see the submission teaches its class, so may review it.
export default async function TeacherReviewPage({ params }: { params: Params }) {
  const session = await requireRole('teacher');
  const { submissionId } = await params;
  const { submission, aiReview, reviews } = await viewOrNotFound(submissionId);
  const [definition, locale, t, tNav, tDomain] = await Promise.all([
    readDefinition(session, submission),
    getLocale(),
    getTranslations('review'),
    getTranslations('nav'),
    getTranslations('domain'),
  ]);

  const brief =
    definition === null
      ? null
      : definition.kind === 'project'
        ? projectBrief(definition.project, locale)
        : challengeBrief(definition.challenge, locale);
  const allowedTypes =
    definition === null
      ? null
      : definition.kind === 'project'
        ? definition.project.allowedSubmissionTypes
        : definition.challenge.allowedSubmissionTypes;
  const contextTitle = pickTranslation(submission.contextTitle, locale, submission.locale).title;
  const kind = tDomain(`project.kinds.${submission.context}`);
  const { classId } = submission;
  const progressHref =
    classId !== null && session.classIds.includes(classId)
      ? `/teacher/classes/${classId}/students/${submission.studentUid}`
      : null;

  return (
    <>
      <PageHeader
        title={submission.title}
        description={contextTitle ? `${kind} · ${contextTitle}` : kind}
        breadcrumbs={[
          { label: tNav('teacher.projects'), href: '/teacher/projects' },
          { label: submission.title },
        ]}
        actions={
          progressHref !== null && (
            <LinkButton href={progressHref} variant="secondary">
              <UserRound aria-hidden="true" />
              {t('detail.studentProgress')}
            </LinkButton>
          )
        }
      />
      {/* Main before aside in the DOM: on a phone the teacher reads the work, then the
          suggestion, then decides. */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="flex min-w-0 flex-col gap-8">
          <SubmissionSummary submission={submission} />
          <BriefDetails
            title={t('detail.brief.title')}
            text={brief}
            allowedTypes={allowedTypes}
            unavailable={t('detail.brief.unavailable')}
          />
          <WorkSection submission={submission} title={t('detail.work.title')} canDelete />
          <ReviewHistory reviews={reviews} />
        </div>
        <aside className="flex min-w-0 flex-col gap-6">
          <AiSuggestion
            submission={submission}
            aiReview={aiReview}
            canRegenerate={submission.aiRegenerations < AI_LIMITS.review.maxRegenerations}
          />
          <ReviewPanel
            key={submission.id}
            submission={submission}
            aiReview={aiReview}
            latestReview={reviews[0] ?? null}
            approveBlock={approveBlock(submission, aiReview)}
          />
        </aside>
      </div>
    </>
  );
}
