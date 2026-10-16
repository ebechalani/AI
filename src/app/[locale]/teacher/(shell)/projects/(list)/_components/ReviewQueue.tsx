import { CircleCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ProjectCard } from '@/components/domain';
import { groupQueueByClass, QUEUE_LIMIT } from '@/components/projects/projects-model';
import { Alert, Chip, EmptyState, LinkButton } from '@/components/ui';
import type { SchoolClass, Submission } from '@/types';

export interface ReviewQueueProps {
  /** Oldest first, at most QUEUE_LIMIT. */
  queue: Submission[];
  classes: SchoolClass[];
  /** The All view of the default class, the way out of an empty queue. */
  allHref: string;
}

/** Work waiting for a review, by class, oldest first so nobody waits too long (SPEC-D 9.3). */
export function ReviewQueue({ queue, classes, allHref }: ReviewQueueProps) {
  const t = useTranslations('review');

  if (queue.length === 0) {
    return (
      <EmptyState
        icon={<CircleCheck />}
        title={t('queue.empty.title')}
        description={t('queue.empty.description')}
        action={<LinkButton href={allHref}>{t('queue.empty.action')}</LinkButton>}
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-base text-ink-muted">{t('queue.oldestFirst')}</p>
        {queue.length >= QUEUE_LIMIT && (
          <Alert tone="info" live="off">
            {t('queue.truncated', { count: queue.length })}
          </Alert>
        )}
      </div>
      {groupQueueByClass(queue, classes).map((group) => {
        const headingId = `queue-${group.classId || 'other'}`;
        const name =
          group.name === null
            ? t('queue.unknownClass')
            : group.archived
              ? t('all.archived', { name: group.name })
              : group.name;
        return (
          <section
            key={group.classId}
            aria-labelledby={headingId}
            className="flex min-w-0 flex-col gap-4"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 id={headingId} className="text-xl font-bold break-words text-ink">
                {name}
              </h2>
              <Chip tone="accent">{t('queue.classCount', { count: group.items.length })}</Chip>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map((submission) => (
                <li key={submission.id} className="min-w-0">
                  <ProjectCard
                    submission={submission}
                    href={`/teacher/projects/${submission.id}`}
                    showStudent
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
