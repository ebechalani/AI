import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminShortcuts } from '@/components/admin/AdminShortcuts';
import { ADMIN_PATHS } from '@/components/admin/paths';
import { PlatformStatsGrid } from '@/components/admin/PlatformStatsGrid';
import { PageHeader } from '@/components/layout';
import { Card, CardBody, LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { getPlatformStats } from '@/lib/data/analytics';

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('platform_admin');
  const tNav = await getTranslations('nav');
  return { title: tNav('platform_admin.dashboard') };
}

// The platform admin's dashboard (ARCHITECTURE.md 6.7): the ten platform numbers and one card
// per section. Every number may be 0 on a fresh platform; a first-school card then leads on.
export default async function AdminDashboardPage() {
  const session = await requireRole('platform_admin');
  const [stats, t, tNav] = await Promise.all([
    getPlatformStats(session),
    getTranslations('admin'),
    getTranslations('nav'),
  ]);

  return (
    <>
      <PageHeader title={tNav('platform_admin.dashboard')} description={t('dashboard.description')} />
      <div className="flex flex-col gap-8">
        {stats.schools === 0 && (
          <Card tone="brand">
            <CardBody className="flex flex-col items-start gap-3">
              <h2 className="text-xl font-semibold text-ink">{t('dashboard.start.title')}</h2>
              <p className="max-w-2xl text-ink-muted">{t('dashboard.start.description')}</p>
              <LinkButton href={ADMIN_PATHS.schools}>{t('dashboard.start.action')}</LinkButton>
            </CardBody>
          </Card>
        )}
        <PlatformStatsGrid stats={stats} />
        <AdminShortcuts />
      </div>
    </>
  );
}
