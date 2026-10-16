import type { Metadata } from 'next';
import { FolderKanban } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { groupStudentSubmissions } from '@/components/projects/projects-model';
import { EmptyState, LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listSubmissionsForStudent } from '@/lib/data/submissions';
import { StudentProjectSections } from './_components/StudentProjectSections';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('student.projects') };
}

// Everything the student has sent, projects and challenge entries (ARCHITECTURE.md 3.7
// "Student Projects"): returned work first, then work waiting for feedback, then accepted work.
export default async function StudentProjectsPage() {
  const session = await requireRole('student');
  const [submissions, t, tNav] = await Promise.all([
    listSubmissionsForStudent(session, session.uid),
    getTranslations('projects'),
    getTranslations('nav'),
  ]);

  return (
    <>
      <PageHeader title={tNav('student.projects')} description={t('list.description')} />
      {submissions.length === 0 ? (
        <EmptyState
          icon={<FolderKanban />}
          title={t('list.empty.title')}
          description={t('list.empty.description')}
          action={<LinkButton href="/student/learn">{t('list.empty.action')}</LinkButton>}
        />
      ) : (
        <StudentProjectSections groups={groupStudentSubmissions(submissions)} />
      )}
    </>
  );
}
