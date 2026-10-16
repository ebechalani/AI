import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { Route } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import {
  HardwareList,
  mainPathwayId,
  RoboticsChallenges,
  RoboticsCourses,
  RoboticsThemes,
  roboticsChallenges,
  studentRoboticsCourses,
} from '@/components/robotics';
import { LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listChallengesForUser } from '@/lib/data/challenges';
import { listPublishedCoursesByArea } from '@/lib/data/courses';
import { listHardwarePlatforms } from '@/lib/data/hardware';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('student.robotics') };
}

// A section read that fails leaves its section with a notice instead of failing the page. A
// redirect or notFound() thrown inside is not an error and passes through.
async function settle<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    unstable_rethrow(error);
    console.error('[student robotics]', error);
    return null;
  }
}

// AI Robotics (ARCHITECTURE.md 6.4, 3.7 "Student Robotics"): the robotics courses, the project
// themes they build, the open and upcoming robot challenges, and the supported hardware.
export default async function StudentRoboticsPage() {
  const session = await requireRole('student');
  const now = new Date().toISOString();
  const [courses, challenges, platforms, t, tNav] = await Promise.all([
    settle(listPublishedCoursesByArea('robotics')),
    settle(listChallengesForUser(session, { upcomingOrOpenOnly: true })),
    settle(listHardwarePlatforms(session, { activeOnly: true })),
    getTranslations('robotics'),
    getTranslations('nav'),
  ]);
  const studentCourses = courses === null ? null : studentRoboticsCourses(courses);
  const robotChallenges = challenges === null ? null : roboticsChallenges(challenges);
  const pathwayId = studentCourses === null ? null : mainPathwayId(studentCourses);

  return (
    <>
      <PageHeader
        title={tNav('student.robotics')}
        description={t('description')}
        actions={
          pathwayId && (
            <LinkButton href={`/student/learn/pathways/${pathwayId}`} variant="secondary">
              <Route aria-hidden="true" />
              {t('pathwayLink')}
            </LinkButton>
          )
        }
      />
      <div className="flex flex-col gap-10">
        <RoboticsCourses courses={studentCourses} />
        <RoboticsThemes courses={studentCourses} />
        <RoboticsChallenges challenges={robotChallenges} now={now} />
        <HardwareList platforms={platforms} courses={studentCourses ?? []} />
      </div>
    </>
  );
}
