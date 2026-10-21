import { FolderKanban } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ProjectCard } from '@/components/domain';
import { EmptyState } from '@/components/ui';
import { submissionPath } from '@/components/teacher/paths';
import type { Submission } from '@/types/project';

export interface StudentSubmissionsProps {
  /** Newest first: projects and challenge entries made in this class. */
  submissions: Submission[];
}

export function StudentSubmissions({ submissions }: StudentSubmissionsProps) {
  const t = useTranslations('classes');
  return (
    <section aria-labelledby="student-submissions-title" className="flex min-w-0 flex-col gap-4">
      <h2 id="student-submissions-title" className="text-xl font-bold text-ink">
        {t('student.submissions.title')}
      </h2>
      {submissions.length === 0 ? (
        <EmptyState
          icon={<FolderKanban />}
          title={t('student.submissions.empty.title')}
          description={t('student.submissions.empty.description')}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {submissions.map((submission) => (
            <ProjectCard
              key={submission.id}
              submission={submission}
              href={submissionPath(submission.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
