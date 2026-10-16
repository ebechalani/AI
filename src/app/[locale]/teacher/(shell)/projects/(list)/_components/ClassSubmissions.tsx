import { FolderOpen, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ProjectCard } from '@/components/domain';
import { allViewHref, pageHrefs } from '@/components/projects/projects-model';
import { Alert, EmptyState, LinkButton, Pagination } from '@/components/ui';
import type { Page, SchoolClass, Submission } from '@/types';
import { ClassFilterForm } from './ClassFilterForm';

export interface ClassSubmissionsProps {
  classes: SchoolClass[];
  /** The selected class. */
  cls: SchoolClass;
  trail: string[];
  /** The page that was read, or null when the link's cursors were unusable. */
  page: Page<Submission> | null;
}

/** Every submission of one class, newest first, 50 per page (SPEC-D 9.3). */
export function ClassSubmissions({ classes, cls, trail, page }: ClassSubmissionsProps) {
  const t = useTranslations('review');
  const name = cls.archived ? t('all.archived', { name: cls.name }) : cls.name;

  let body;
  if (page === null) {
    body = (
      <Alert
        tone="warning"
        live="off"
        action={
          <LinkButton href={allViewHref(cls.id, [])} variant="secondary" size="sm">
            <RotateCcw aria-hidden="true" />
            {t('all.firstPage')}
          </LinkButton>
        }
      >
        {t('all.staleCursor')}
      </Alert>
    );
  } else if (page.items.length === 0) {
    body = (
      <EmptyState
        icon={<FolderOpen />}
        titleAs="h3"
        title={t('all.empty.title')}
        description={t('all.empty.description')}
      />
    );
  } else {
    const hrefs = pageHrefs(cls.id, trail, page.nextCursor);
    body = (
      <>
        <p className="text-base text-ink-muted">{t('all.newestFirst')}</p>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {page.items.map((submission) => (
            <li key={submission.id} className="min-w-0">
              <ProjectCard
                submission={submission}
                href={`/teacher/projects/${submission.id}`}
                showStudent
              />
            </li>
          ))}
        </ul>
        {(hrefs.previousHref !== null || hrefs.nextHref !== null) && (
          <Pagination
            previousHref={hrefs.previousHref}
            nextHref={hrefs.nextHref}
            page={hrefs.page}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <ClassFilterForm classes={classes} classId={cls.id} />
      <section aria-labelledby="class-submissions" className="flex min-w-0 flex-col gap-4">
        {/* The cards' titles are h3: the class name is the h2 between them and the page's h1. */}
        <h2 id="class-submissions" className="text-xl font-bold break-words text-ink">
          {name}
        </h2>
        {body}
      </section>
    </div>
  );
}
