import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  BadgeCollection,
  badgeCollection,
  LevelSummary,
  StatsGrid,
  XP_HISTORY_LIMIT,
  XpHistory,
  xpHistoryRows,
} from '@/components/achievements';
import { PageHeader } from '@/components/layout';
import { requireRole } from '@/lib/auth/session';
import { listBadges, listUserBadges } from '@/lib/data/badges';
import { getUser } from '@/lib/data/users';
import { listXpEntries } from '@/lib/data/xp';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('student.achievements') };
}

// A section read that fails leaves its section with a notice instead of failing the page. A
// redirect or notFound() thrown inside is not an error and passes through.
async function settle<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    unstable_rethrow(error);
    console.error('[student achievements]', error);
    return null;
  }
}

// Achievements (ARCHITECTURE.md 6.4, 3.7 "Achievements"): level, progress counters, badges
// earned and still to earn, and the latest XP rewards. The profile is the core of the page.
export default async function StudentAchievementsPage() {
  const session = await requireRole('student');
  const [profile, badges, awards, entries, t, tNav] = await Promise.all([
    getUser(session, session.uid),
    settle(listBadges(session)),
    settle(listUserBadges(session, session.uid)),
    settle(listXpEntries(session, session.uid, XP_HISTORY_LIMIT)),
    getTranslations('achievements'),
    getTranslations('nav'),
  ]);
  const collection = badges === null || awards === null ? null : badgeCollection(badges, awards);
  const history = entries === null ? null : xpHistoryRows(entries, badges ?? []);

  return (
    <>
      <PageHeader title={tNav('student.achievements')} description={t('description')} />
      <div className="flex flex-col gap-10">
        <LevelSummary xp={profile.xpTotal} />
        <StatsGrid stats={profile.stats} />
        <BadgeCollection collection={collection} />
        <XpHistory rows={history} />
      </div>
    </>
  );
}
