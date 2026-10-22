import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import type { PlatformChoice } from '@/components/admin/challenge-fields';
import { ChallengeForm } from '@/components/admin/ChallengeForm';
import { ADMIN_PATHS } from '@/components/admin/paths';
import { schoolChoices } from '@/components/admin/school-model';
import { PageHeader } from '@/components/layout';
import { requireRole } from '@/lib/auth/session';
import { listHardwarePlatforms } from '@/lib/data/hardware';
import { pickTranslation } from '@/lib/i18n/content';
import { listAllSchools } from '../../_lib/load';

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('platform_admin');
  const t = await getTranslations('admin');
  return { title: t('challenges.form.newTitle') };
}

// A new challenge, saved as a draft (ARCHITECTURE.md 6.7): the editor with the active kits.
export default async function AdminNewChallengePage() {
  const session = await requireRole('platform_admin');
  const now = new Date().toISOString();
  const [schools, platforms, locale, t, tNav] = await Promise.all([
    listAllSchools(),
    listHardwarePlatforms(session, { activeOnly: true }),
    getLocale(),
    getTranslations('admin'),
    getTranslations('nav'),
  ]);
  const kits: PlatformChoice[] = platforms.map((platform) => ({
    id: platform.id,
    name: pickTranslation(platform.translations, locale, platform.defaultLocale).name,
    vendor: platform.vendor,
  }));

  return (
    <>
      <PageHeader
        title={t('challenges.form.newTitle')}
        description={t('challenges.form.newDescription')}
        breadcrumbs={[
          { label: tNav('platform_admin.challenges'), href: ADMIN_PATHS.challenges },
          { label: t('challenges.form.newTitle') },
        ]}
      />
      <ChallengeForm
        mode="create"
        challengeId={null}
        status={null}
        initial={null}
        schools={schoolChoices(schools, locale)}
        platforms={kits}
        currentCover={null}
        now={now}
      />
    </>
  );
}
