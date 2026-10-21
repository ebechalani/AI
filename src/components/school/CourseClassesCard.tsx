import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';
import type { SchoolClass } from '@/types/school';
import { schoolClassPath } from './paths';

/** The school's active classes that follow the course. */
export function CourseClassesCard({ classes }: { classes: SchoolClass[] }) {
  const t = useTranslations('school');

  return (
    <Card as="section" aria-labelledby="course-classes-title" className="gap-3 p-5 sm:p-6">
      <h2 id="course-classes-title" className="text-lg leading-snug font-bold text-ink">
        {t('course.classes.title')}
      </h2>
      {classes.length === 0 ? (
        <p className="text-sm text-ink-muted">{t('course.classes.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {classes.map((cls) => (
            <li key={cls.id}>
              <Link
                href={schoolClassPath(cls.id)}
                className="rounded-sm font-medium break-words text-ink underline-offset-4 hover:text-brand-700 hover:underline"
              >
                {cls.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
