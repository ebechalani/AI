import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import {
  ContinueLearning,
  continueItems,
  distinctPathwayIds,
  HomeSection,
  MyPathways,
  myPathways,
  ProgressOverview,
  RecentBadges,
  RecentCertificates,
  RecentProjects,
  StudentScrollPadding,
  UpcomingChallenges,
  withBadges,
} from '@/components/student';
import { requireRole } from '@/lib/auth/session';
import { getBadge, listUserBadges } from '@/lib/data/badges';
import { listCertificatesForUser } from '@/lib/data/certificates';
import { listChallengesForUser } from '@/lib/data/challenges';
import { getCourses } from '@/lib/data/courses';
import { listEnrollmentsForUser } from '@/lib/data/enrollments';
import { getPublishedPathway } from '@/lib/data/pathways';
import { listSubmissionsForStudent } from '@/lib/data/submissions';
import { getUser } from '@/lib/data/users';
import { NotFoundError } from '@/lib/errors';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('student.home') };
}

// A section read that fails leaves its section with a notice instead of failing the page. A
// redirect or notFound() thrown inside is not an error and passes through.
async function settle<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    unstable_rethrow(error);
    console.error('[student home]', error);
    return null;
  }
}

// A badge whose definition was removed is simply not shown.
function nullIfNotFound(error: unknown): null {
  if (error instanceof NotFoundError) return null;
  throw error;
}

export default async function StudentHomePage() {
  const session = await requireRole('student');
  const t = await getTranslations('student');
  const now = new Date().toISOString();

  // The reads of ARCHITECTURE.md 3.7 "Student Home", in three round trips. The profile, the
  // enrolments and their courses are the core of the page: when one fails, (shell)/error.tsx
  // shows. Every other section settles to null and shows its own notice.
  const [profile, enrollments, submissions, userBadges, certificates, challenges] =
    await Promise.all([
      getUser(session, session.uid),
      listEnrollmentsForUser(session, session.uid),
      settle(listSubmissionsForStudent(session, session.uid, { limit: 3 })),
      settle(listUserBadges(session, session.uid, { limit: 6 })),
      settle(listCertificatesForUser(session, session.uid, { limit: 3 })),
      settle(listChallengesForUser(session, { upcomingOrOpenOnly: true, limit: 3 })),
    ]);
  const [courses, badges] = await Promise.all([
    getCourses(
      session,
      enrollments.map((enrollment) => enrollment.courseId),
    ),
    // A UserBadge carries only the badge id; BadgeTile needs the definition.
    userBadges === null
      ? null
      : settle(
          Promise.all(
            userBadges.map((award) => getBadge(session, award.badgeId).catch(nullIfNotFound)),
          ),
        ),
  ]);
  // null for a pathway that is no longer published: it is left out of My Pathways.
  const pathways = await Promise.all(
    distinctPathwayIds(courses).map((pathwayId) => getPublishedPathway(pathwayId)),
  );

  const isNew = enrollments.length === 0;
  const earned = userBadges === null || badges === null ? null : withBadges(userBadges, badges);

  return (
    <>
      {/* Stopgap until foundation request WS-B-3 lands; delete it with the component then. */}
      <StudentScrollPadding />
      <PageHeader
        title={t(isNew ? 'welcome.titleNew' : 'welcome.title', { name: session.displayName })}
        description={t(isNew ? 'welcome.subtitleNew' : 'welcome.subtitle')}
      />
      <div className="flex flex-col gap-8">
        <ProgressOverview xp={profile.xpTotal} stats={profile.stats} />
        {/* Two columns only from xl: between lg and xl the sidebar leaves ~700 px, and a third
            of that is too narrow for badge tiles and certificate cards. The side column keeps
            at least 20.5rem, so a certificate's verification code stays on one line at 1280 px
            in French (2fr/1fr alone leaves it 299 px there and splits the code). */}
        <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(20.5rem,1fr)]">
          <div className="flex min-w-0 flex-col gap-8">
            <HomeSection
              id="home-continue"
              title={t('continue.title')}
              action={{ href: '/student/learn', label: t('continue.viewAll') }}
            >
              <ContinueLearning items={continueItems(enrollments, courses)} />
            </HomeSection>
            <HomeSection
              id="home-pathways"
              title={t('pathways.title')}
              action={{ href: '/student/learn', label: t('pathways.viewAll') }}
            >
              <MyPathways items={myPathways(enrollments, courses, pathways)} />
            </HomeSection>
            <HomeSection
              id="home-projects"
              title={t('projects.title')}
              action={{ href: '/student/projects', label: t('projects.viewAll') }}
            >
              <RecentProjects submissions={submissions} />
            </HomeSection>
            <HomeSection
              id="home-challenges"
              title={t('challenges.title')}
              action={{ href: '/student/challenges', label: t('challenges.viewAll') }}
            >
              <UpcomingChallenges challenges={challenges} now={now} />
            </HomeSection>
          </div>
          <div className="flex min-w-0 flex-col gap-8">
            <HomeSection
              id="home-badges"
              title={t('badges.title')}
              action={{ href: '/student/achievements', label: t('badges.viewAll') }}
            >
              <RecentBadges badges={earned} />
            </HomeSection>
            <HomeSection
              id="home-certificates"
              title={t('certificates.title')}
              action={{ href: '/student/certificates', label: t('certificates.viewAll') }}
            >
              <RecentCertificates certificates={certificates} />
            </HomeSection>
          </div>
        </div>
      </div>
    </>
  );
}
