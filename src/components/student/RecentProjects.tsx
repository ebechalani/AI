import { FolderKanban } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ProjectCard } from '@/components/domain';
import { EmptyState } from '@/components/ui';
import type { Submission } from '@/types/project';
import { SectionUnavailable } from './SectionUnavailable';

export interface RecentProjectsProps {
  /** The latest submissions (projects and challenge entries); null when they could not be read. */
  submissions: readonly Submission[] | null;
}

export function RecentProjects({ submissions }: RecentProjectsProps) {
  const t = useTranslations('student');

  if (submissions === null) return <SectionUnavailable />;
  if (submissions.length === 0) {
    return (
      <EmptyState
        icon={<FolderKanban />}
        title={t('projects.empty.title')}
        description={t('projects.empty.description')}
      />
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {submissions.map((submission) => (
        <li key={submission.id} className="min-w-0">
          <ProjectCard submission={submission} href={`/student/projects/${submission.id}`} />
        </li>
      ))}
    </ul>
  );
}
