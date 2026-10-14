import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  CallToAction,
  Entrances,
  ForSchools,
  Hero,
  HowItWorks,
  PathwaysSection,
  ProjectBasedLearning,
  RoboticsSection,
  TeacherAcademySection,
} from '@/components/marketing';
import { listPublishedPathways } from '@/lib/data/pathways';
import { getPublicEnv } from '@/lib/env';
import { routing } from '@/lib/i18n/routing';
import type { Pathway } from '@/types/content';

// Reads the pathway catalog on every request (ARCHITECTURE.md 1.3).
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'home' });
  return { title: t('meta.title'), description: t('meta.description') };
}

// The shop window stays open when the catalog is unreachable: the pathway section then shows
// its own notice instead of the whole page failing.
async function loadPathways(): Promise<Pathway[] | null> {
  try {
    return await listPublishedPathways();
  } catch (error) {
    console.error('[home] the pathway catalog could not be read', error);
    return null;
  }
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const pathways = await loadPathways();
  const studentPathways = pathways?.filter((pathway) => pathway.audience === 'student') ?? null;
  const teacherPathway = pathways?.find((pathway) => pathway.audience === 'teacher') ?? null;
  const roboticsPathway = pathways?.find((pathway) => pathway.kind === 'robotics') ?? null;

  return (
    <>
      <Hero pathwayCount={pathways?.length ?? 0} />
      <Entrances />
      <PathwaysSection pathways={studentPathways} />
      <RoboticsSection pathway={roboticsPathway} />
      <TeacherAcademySection pathway={teacherPathway} />
      <HowItWorks />
      <ProjectBasedLearning />
      <ForSchools contactEmail={getPublicEnv().contactEmail} />
      <CallToAction />
    </>
  );
}
