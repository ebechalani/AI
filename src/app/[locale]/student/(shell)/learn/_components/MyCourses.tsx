import { BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CourseCard } from '@/components/domain';
import { EmptyState, LinkButton } from '@/components/ui';
import type { MyCourse } from './learn-model';

export interface MyCoursesProps {
  inProgress: MyCourse[];
  completed: MyCourse[];
}

const HEADING = 'text-xl font-bold text-ink';
const GRID = 'grid gap-6 sm:grid-cols-2 xl:grid-cols-3';

function CourseList({ id, title, items }: { id: string; title: string; items: MyCourse[] }) {
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-4">
      <h2 id={id} className={HEADING}>
        {title}
      </h2>
      <ul className={GRID}>
        {items.map(({ course, enrollment }) => (
          <li key={course.id} className="min-w-0">
            <CourseCard
              course={course}
              href={`/student/learn/courses/${course.id}`}
              progressPercent={enrollment.progressPercent}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The student's courses: one section per non-empty list, or a way to the catalog. */
export function MyCourses({ inProgress, completed }: MyCoursesProps) {
  const t = useTranslations('learn');

  if (inProgress.length === 0 && completed.length === 0) {
    return (
      <section aria-labelledby="learn-my-courses" className="flex min-w-0 flex-col gap-4">
        <h2 id="learn-my-courses" className={HEADING}>
          {t('myCourses.title')}
        </h2>
        <EmptyState
          icon={<BookOpen />}
          title={t('myCourses.empty.title')}
          description={t('myCourses.empty.description')}
          action={<LinkButton href="#pathways">{t('myCourses.empty.action')}</LinkButton>}
        />
      </section>
    );
  }

  return (
    <>
      {inProgress.length > 0 && (
        <CourseList id="learn-in-progress" title={t('myCourses.inProgress')} items={inProgress} />
      )}
      {completed.length > 0 && (
        <CourseList id="learn-completed" title={t('myCourses.completed')} items={completed} />
      )}
    </>
  );
}
