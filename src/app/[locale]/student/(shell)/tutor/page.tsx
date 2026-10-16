import type { Metadata } from 'next';
import { BotOff } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { TutorWorkspace } from '@/components/ai/TutorWorkspace';
import { PageHeader } from '@/components/layout';
import { EmptyState, LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { loadTutorPage } from './_components/load';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('student.tutor') };
}

// The full-page tutor (ARCHITECTURE.md 6.4, 8.3): a general conversation, or one about a
// course the learner is enrolled in.
export default async function StudentTutorPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string | string[] }>;
}) {
  const session = await requireRole('student');
  const [{ course }, locale, t, tNav] = await Promise.all([
    searchParams,
    getLocale(),
    getTranslations('tutor'),
    getTranslations('nav'),
  ]);
  const data = await loadTutorPage(session, locale, course);

  if (!data.aiEnabled) {
    return (
      <>
        <PageHeader title={tNav('student.tutor')} />
        <EmptyState
          icon={<BotOff />}
          title={t('disabled.title')}
          description={t('disabled.description')}
          action={<LinkButton href="/student/learn">{t('disabled.action')}</LinkButton>}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title={tNav('student.tutor')} description={t('page.description')} />
      <TutorWorkspace courses={data.courses} initialCourseId={data.initialCourseId} />
    </>
  );
}
