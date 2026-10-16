import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ProjectCard } from '@/components/domain';
import { Chip } from '@/components/ui';
import type { StudentGroups } from '@/components/projects/projects-model';
import type { Submission } from '@/types/project';

const HEADING = 'text-xl font-bold text-ink';
const GRID = 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3';

function Cards({ items }: { items: Submission[] }) {
  return (
    <ul className={GRID}>
      {items.map((submission) => (
        <li key={submission.id} className="min-w-0">
          <ProjectCard submission={submission} href={`/student/projects/${submission.id}`} />
        </li>
      ))}
    </ul>
  );
}

function Section({
  id,
  title,
  hint,
  items,
}: {
  id: string;
  title: string;
  hint?: string;
  items: Submission[];
}) {
  const t = useTranslations('projects');
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 id={id} className={HEADING}>
            {title}
          </h2>
          <Chip>{t('list.sections.count', { count: items.length })}</Chip>
        </div>
        {hint && <p className="text-sm text-ink-muted">{hint}</p>}
      </div>
      <Cards items={items} />
    </section>
  );
}

/** The student's work by where it stands; older attempts folded away at the end (SPEC-D 7.2). */
export function StudentProjectSections({ groups }: { groups: StudentGroups }) {
  const t = useTranslations('projects');
  return (
    <div className="flex min-w-0 flex-col gap-10">
      <Section
        id="projects-returned"
        title={t('list.sections.returned')}
        hint={t('list.sections.returnedHint')}
        items={groups.returned}
      />
      <Section id="projects-submitted" title={t('list.sections.submitted')} items={groups.submitted} />
      <Section id="projects-accepted" title={t('list.sections.accepted')} items={groups.accepted} />
      {groups.earlier.length > 0 && (
        // The summary holds an h2, so the cards' h3 do not sit under "Accepted".
        <details className="group min-w-0">
          <summary className="flex w-fit cursor-pointer list-none items-center gap-2 rounded-control [&::-webkit-details-marker]:hidden">
            <ChevronDown
              aria-hidden="true"
              className="size-5 shrink-0 text-ink-muted transition-transform group-open:rotate-180"
            />
            <h2 className="inline text-lg font-semibold text-ink">
              {t('list.sections.earlier', { count: groups.earlier.length })}
            </h2>
          </summary>
          <div className="mt-4">
            <Cards items={groups.earlier} />
          </div>
        </details>
      )}
    </div>
  );
}
