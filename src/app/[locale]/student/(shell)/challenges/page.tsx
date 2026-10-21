import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { Trophy } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import {
  ChallengePhaseSection,
  enteredChallengeIds,
  groupByPhase,
  latestEntries,
  MyEntries,
} from '@/components/challenges';
import { PageHeader } from '@/components/layout';
import { PageSection } from '@/components/robotics';
import { Alert, EmptyState, LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listChallengesForUser } from '@/lib/data/challenges';
import { listSubmissionsForStudent } from '@/lib/data/submissions';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('student.challenges') };
}

// A section read that fails leaves its section with a notice instead of failing the page. A
// redirect or notFound() thrown inside is not an error and passes through.
async function settle<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    unstable_rethrow(error);
    console.error('[student challenges]', error);
    return null;
  }
}

// The Challenge Arena (ARCHITECTURE.md 6.4, 3.7 "Student Challenges"): open, upcoming and closed
// challenges, and the student's own entries. The challenges are the core of the page; the
// entries settle to a section notice.
export default async function StudentChallengesPage() {
  const session = await requireRole('student');
  const now = new Date().toISOString();
  const [challenges, entries, t, tNav] = await Promise.all([
    listChallengesForUser(session),
    settle(listSubmissionsForStudent(session, session.uid, { context: 'challenge' })),
    getTranslations('challenges'),
    getTranslations('nav'),
  ]);
  const groups = groupByPhase(challenges, now);
  const entered = entries === null ? new Set<string>() : enteredChallengeIds(entries);
  const mine = entries === null ? null : latestEntries(entries);
  const entriesError = (
    <Alert tone="warning" live="off">
      {t('sectionError')}
    </Alert>
  );

  return (
    <>
      <PageHeader title={tNav('student.challenges')} description={t('description')} />
      {challenges.length === 0 && (mine === null || mine.length === 0) ? (
        <div className="flex flex-col gap-6">
          <EmptyState
            icon={<Trophy />}
            titleAs="h2"
            title={t('empty.title')}
            description={t('empty.description')}
            action={
              <LinkButton href="/student/learn" variant="secondary">
                {t('empty.action')}
              </LinkButton>
            }
          />
          {mine === null && entriesError}
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          <ChallengePhaseSection
            phase="open"
            challenges={groups.open}
            now={now}
            entered={entered}
          />
          <ChallengePhaseSection
            phase="upcoming"
            challenges={groups.upcoming}
            now={now}
            entered={entered}
          />
          {mine === null ? (
            <PageSection id="challenges-mine" title={t('myEntries.title')}>
              {entriesError}
            </PageSection>
          ) : (
            mine.length > 0 && <MyEntries entries={mine} />
          )}
          {groups.closed.length > 0 && (
            <ChallengePhaseSection
              phase="closed"
              challenges={groups.closed}
              now={now}
              entered={entered}
            />
          )}
        </div>
      )}
    </>
  );
}
