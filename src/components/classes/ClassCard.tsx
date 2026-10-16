import { BookOpen, KeyRound, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, Chip } from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import type { IsoDateString } from '@/types/common';
import type { SchoolClass } from '@/types/school';
import { joinCodeState } from './class-model';

export interface ClassCardProps {
  cls: SchoolClass;
  /** Locale-less path of the class page. */
  href: string;
  /** The request's time, for the join code's state. */
  now: IsoDateString;
  viewerUid: string;
  className?: string;
}

/** One active class in a grid: one link (the whole card), its size and its join code. */
export function ClassCard({ cls, href, now, viewerUid, className }: ClassCardProps) {
  const t = useTranslations('classes');
  const codeOpen = joinCodeState(cls, now).kind === 'open';

  return (
    <Card as="article" interactive className={cn('h-full gap-3 p-5', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="text-lg leading-snug font-semibold break-words text-ink">
          <Link href={href} className="rounded-sm after:absolute after:inset-0 after:rounded-card">
            {cls.name}
          </Link>
        </h3>
        {cls.gradeLabel && (
          <p className="text-sm break-words text-ink-muted">{cls.gradeLabel}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip icon={<Users aria-hidden="true" />}>
          {t('card.students', { count: cls.studentCount })}
        </Chip>
        <Chip icon={<BookOpen aria-hidden="true" />}>
          {t('card.courses', { count: cls.assignedCourseIds.length })}
        </Chip>
        {codeOpen ? (
          <Chip tone="success" icon={<KeyRound aria-hidden="true" />}>
            {t('card.codeOpen')}
          </Chip>
        ) : (
          <Chip icon={<KeyRound aria-hidden="true" />}>{t('card.codeClosed')}</Chip>
        )}
        {cls.ownerUid !== viewerUid && <Chip tone="accent">{t('card.coTeacher')}</Chip>}
      </div>
    </Card>
  );
}
