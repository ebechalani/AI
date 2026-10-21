import { Bot } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CourseCard } from '@/components/domain';
import { Alert, EmptyState } from '@/components/ui';
import type { Course } from '@/types/content';
import { PageSection } from './PageSection';

export interface RoboticsCoursesProps {
  /** Published official robotics courses for students, in course order; null when the read failed. */
  courses: readonly Course[] | null;
}

export function RoboticsCourses({ courses }: RoboticsCoursesProps) {
  const t = useTranslations('robotics');
  return (
    <PageSection
      id="robotics-courses"
      title={t('courses.title')}
      description={t('courses.description')}
    >
      {courses === null ? (
        <Alert tone="warning" live="off">
          {t('sectionError')}
        </Alert>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={<Bot />}
          title={t('courses.empty.title')}
          description={t('courses.empty.description')}
        />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <li key={course.id} className="min-w-0">
              <CourseCard course={course} href={`/student/learn/courses/${course.id}`} />
            </li>
          ))}
        </ul>
      )}
    </PageSection>
  );
}
