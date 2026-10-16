import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import {
  ChallengeBrief,
  ChallengeEntryPanel,
  ChallengeFacts,
  ChallengeStatusLine,
  challengeEntryState,
  challengeText,
} from '@/components/challenges';
import { MediaImage } from '@/components/domain';
import { PageHeader } from '@/components/layout';
import { requireRole } from '@/lib/auth/session';
import { getLatestSubmission } from '@/lib/data/submissions';
import { getChallengePhase } from '@/lib/learning/challenge-phase';
import { loadChallenge } from './_components/load';

type Params = Promise<{ challengeId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { challengeId } = await params;
  const { challenge } = await loadChallenge(challengeId);
  return { title: challengeText(challenge, await getLocale()).title };
}

// One challenge (ARCHITECTURE.md 6.4, 3.7 "Student Challenges" / "Challenge detail"): the
// brief, the key facts, and the student's entry with the submission form when one can be sent.
export default async function StudentChallengePage({ params }: { params: Params }) {
  const session = await requireRole('student');
  const { challengeId } = await params;
  const { challenge } = await loadChallenge(challengeId);
  const [latest, locale, tNav, tDomain] = await Promise.all([
    // Core: the entry panel depends on it.
    getLatestSubmission(session, session.uid, { challengeId: challenge.id }),
    getLocale(),
    getTranslations('nav'),
    getTranslations('domain'),
  ]);
  const now = new Date().toISOString();
  const phase = getChallengePhase(challenge, now);
  const state = challengeEntryState(challenge, phase, latest, now);
  const text = challengeText(challenge, locale);

  return (
    <>
      <PageHeader
        title={text.title}
        description={tDomain(`challenge.types.${challenge.type}`)}
        breadcrumbs={[
          { label: tNav('student.challenges'), href: '/student/challenges' },
          { label: text.title },
        ]}
      />
      {/* The facts come after the entry panel in the DOM, so on phones they follow it. */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-2">
          <ChallengeStatusLine challenge={challenge} phase={phase} />
          {challenge.coverImage && (
            <MediaImage
              media={challenge.coverImage}
              alt=""
              frame="16:9"
              priority
              sizes="(min-width: 1024px) 66vw, 100vw"
              className="rounded-card"
            />
          )}
          <ChallengeBrief challenge={challenge} text={text} />
          <ChallengeEntryPanel
            challengeId={challenge.id}
            state={state}
            allowedTypes={challenge.allowedSubmissionTypes}
          />
        </div>
        <aside className="min-w-0 lg:col-start-3 lg:row-start-1">
          <ChallengeFacts challenge={challenge} phase={phase} />
        </aside>
      </div>
    </>
  );
}
