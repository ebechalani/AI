import type { Metadata } from 'next';
import { getLocale, getTimeZone, getTranslations } from 'next-intl/server';
import type { PlatformChoice } from '@/components/admin/challenge-fields';
import { challengeTitle, challengeValues } from '@/components/admin/challenge-model';
import { ChallengeForm } from '@/components/admin/ChallengeForm';
import { ChallengeStatusCard } from '@/components/admin/ChallengeStatusCard';
import { ADMIN_PATHS } from '@/components/admin/paths';
import { schoolChoices, schoolNameIndex } from '@/components/admin/school-model';
import { PageHeader } from '@/components/layout';
import { requireRole } from '@/lib/auth/session';
import { listHardwarePlatforms } from '@/lib/data/hardware';
import { pickTranslation } from '@/lib/i18n/content';
import { formatDate } from '@/lib/utils';
import { challengeOrNotFound, listAllSchools } from '../../../_lib/load';

type Params = Promise<{ challengeId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  await requireRole('platform_admin');
  const { challengeId } = await params;
  const [challenge, locale, t] = await Promise.all([
    challengeOrNotFound(challengeId),
    getLocale(),
    getTranslations('admin'),
  ]);
  return { title: challengeTitle(challenge, locale) ?? t('challenges.untitled') };
}

// One challenge (ARCHITECTURE.md 6.7): its status with the transitions, then the editor with
// every kit it names (active or not) plus the active ones.
export default async function AdminChallengePage({ params }: { params: Params }) {
  const session = await requireRole('platform_admin');
  const { challengeId } = await params;
  const challenge = await challengeOrNotFound(challengeId);
  const now = new Date().toISOString();
  const [schools, platforms, locale, timeZone, t, tNav] = await Promise.all([
    listAllSchools(),
    listHardwarePlatforms(session, {}),
    getLocale(),
    getTimeZone(),
    getTranslations('admin'),
    getTranslations('nav'),
  ]);
  const title = challengeTitle(challenge, locale) ?? t('challenges.untitled');
  const schoolNames = schoolNameIndex(schools);
  const school =
    challenge.schoolId === null ? null : (schoolNames[challenge.schoolId] ?? t('shared.unknownSchool'));
  const audience =
    challenge.scope === 'school' && school !== null
      ? t('challenges.transitions.audienceSchool', { school })
      : t('challenges.transitions.audienceEveryone');
  const kits: PlatformChoice[] = platforms
    .filter((platform) => platform.isActive || challenge.hardwarePlatformIds.includes(platform.id))
    .map((platform) => ({
      id: platform.id,
      name: pickTranslation(platform.translations, locale, platform.defaultLocale).name,
      vendor: platform.vendor,
    }));

  return (
    <>
      <PageHeader
        className="wrap-anywhere"
        title={title}
        breadcrumbs={[
          { label: tNav('platform_admin.challenges'), href: ADMIN_PATHS.challenges },
          { label: title },
        ]}
      />
      <ChallengeStatusCard
        challenge={challenge}
        now={now}
        audience={audience}
        start={formatDate(challenge.startAt, locale, 'dateTime', timeZone)}
        end={formatDate(challenge.deadlineAt, locale, 'dateTime', timeZone)}
        title={title}
      />
      <ChallengeForm
        mode="edit"
        challengeId={challenge.id}
        status={challenge.status}
        initial={challengeValues(challenge, timeZone)}
        schools={schoolChoices(schools, locale)}
        platforms={kits}
        currentCover={challenge.coverImage}
        now={now}
      />
    </>
  );
}
