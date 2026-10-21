import { useTranslations } from 'next-intl';
import { ProjectCard } from '@/components/domain';
import { PageSection } from '@/components/robotics/PageSection';
import type { Submission } from '@/types/project';

export interface MyEntriesProps {
  /** The latest entry to each challenge, newest first. */
  entries: readonly Submission[];
}

/** The student's own entries; each card opens the entry with its feedback (WS-D's page). */
export function MyEntries({ entries }: MyEntriesProps) {
  const t = useTranslations('challenges');
  return (
    <PageSection
      id="challenges-mine"
      title={t('myEntries.title')}
      description={t('myEntries.description')}
    >
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => (
          <li key={entry.id} className="min-w-0">
            {/* The card names the challenge from the entry's own title snapshot. */}
            <ProjectCard submission={entry} href={`/student/projects/${entry.id}`} />
          </li>
        ))}
      </ul>
    </PageSection>
  );
}
