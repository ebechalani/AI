import { useLocale, useTranslations } from 'next-intl';
import { Card, Chip } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import type { Submission } from '@/types/project';
import { useDateFormat } from './format';
import { StatusChip } from './StatusChip';

export interface ProjectCardProps {
  submission: Submission;
  /** Locale-less path. */
  href: string;
  /** Adds the student's name: for a teacher's lists. */
  showStudent?: boolean;
  className?: string;
}

/** One submitted piece of work: what it answers, where it stands, and its grade once it has one. */
export function ProjectCard({
  submission,
  href,
  showStudent = false,
  className,
}: ProjectCardProps) {
  const locale = useLocale();
  const t = useTranslations('domain');
  const formatDate = useDateFormat();
  const context = pickTranslation(submission.contextTitle, locale, submission.locale);

  return (
    <Card as="article" interactive className={cn('h-full gap-3 p-5', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Chip>{t(`project.kinds.${submission.context}`)}</Chip>
        <StatusChip status={submission.status} />
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-base leading-snug font-semibold break-words text-ink">
          <Link href={href} className="rounded-sm after:absolute after:inset-0 after:rounded-card">
            {submission.title}
          </Link>
        </h3>
        {context.title && <p className="text-sm text-ink-muted">{context.title}</p>}
        {showStudent && (
          <p className="text-sm font-medium text-ink">
            {t('project.by', { name: submission.studentName })}
          </p>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-2 pt-1">
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-ink-muted">
          <span>{t('project.submittedOn', { date: formatDate(submission.submittedAt) })}</span>
          {submission.attemptNumber > 1 && (
            <span>{t('project.attempt', { number: submission.attemptNumber })}</span>
          )}
          <span>{t(`submissionTypes.${submission.type}`)}</span>
        </p>
        {submission.finalScore !== null && (
          <p className="text-sm font-semibold text-ink tabular-nums">
            {t('project.score', { score: submission.finalScore })}
          </p>
        )}
      </div>
    </Card>
  );
}
