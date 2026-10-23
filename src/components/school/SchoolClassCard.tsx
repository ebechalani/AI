import { BookOpen, KeyRound, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { joinCodeState } from '@/components/classes/class-model';
import { Card, Chip } from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import type { IsoDateString } from '@/types/common';
import type { SchoolClass } from '@/types/school';
import { schoolClassPath } from './paths';

export interface SchoolClassCardProps {
  cls: SchoolClass;
  /** The class's teachers, the owner first. */
  teacherNames: string[];
  /** The request's time, for the join code's state. */
  now: IsoDateString;
  /** The school has turned join codes off: no code works, whatever the class's own switch says. */
  joinCodesOff: boolean;
  className?: string;
}

/** One active class in the grid: one link (the whole card), its teachers, size and join code. */
export function SchoolClassCard({
  cls,
  teacherNames,
  now,
  joinCodesOff,
  className,
}: SchoolClassCardProps) {
  const t = useTranslations('school');
  const locale = useLocale();
  const names = new Intl.ListFormat(locale, { type: 'conjunction' }).format(teacherNames);
  const codeOpen = !joinCodesOff && joinCodeState(cls, now).kind === 'open';

  return (
    <Card as="article" interactive className={cn('h-full gap-3 p-5', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="text-lg leading-snug font-semibold break-words text-ink">
          <Link
            href={schoolClassPath(cls.id)}
            className="rounded-sm after:absolute after:inset-0 after:rounded-card"
          >
            {cls.name}
          </Link>
        </h3>
        {cls.gradeLabel && <p className="text-sm break-words text-ink-muted">{cls.gradeLabel}</p>}
      </div>
      <p className="text-sm break-words text-ink">
        {t('classes.teachers', { count: teacherNames.length, names })}
      </p>
      <div className="flex flex-wrap gap-2">
        <Chip icon={<Users aria-hidden="true" />}>
          {t('classes.students', { count: cls.studentCount })}
        </Chip>
        <Chip icon={<BookOpen aria-hidden="true" />}>
          {t('classes.courses', { count: cls.assignedCourseIds.length })}
        </Chip>
        {codeOpen ? (
          <Chip tone="success" icon={<KeyRound aria-hidden="true" />}>
            {t('classes.codeOpen')}
          </Chip>
        ) : (
          <Chip icon={<KeyRound aria-hidden="true" />}>{t('classes.codeClosed')}</Chip>
        )}
      </div>
    </Card>
  );
}
