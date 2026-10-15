import { GraduationCap, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/layout';
import { EmptyState, LinkButton } from '@/components/ui';
import type { ForbiddenCourseView } from './course-model';

export interface CourseUnavailableProps {
  view: ForbiddenCourseView;
  /** The course title, known for a published Teacher Academy course only. */
  title: string | null;
}

/** A course the student may not open: a Teacher Academy course, or one that is not open. */
export function CourseUnavailable({ view, title }: CourseUnavailableProps) {
  const t = useTranslations('learn');
  const tNav = useTranslations('nav');
  const teacherOnly = view === 'teacherOnly' && title !== null;
  const heading = teacherOnly ? title : t('course.unavailable.heading');

  return (
    <>
      <PageHeader
        title={heading}
        breadcrumbs={[{ label: tNav('student.learn'), href: '/student/learn' }, { label: heading }]}
      />
      <EmptyState
        icon={teacherOnly ? <GraduationCap /> : <Lock />}
        title={teacherOnly ? t('course.teacherOnly.title') : t('course.unavailable.title')}
        description={
          teacherOnly
            ? t('course.teacherOnly.description', { title })
            : t('course.unavailable.description')
        }
        action={<LinkButton href="/student/learn">{t('course.back')}</LinkButton>}
      />
    </>
  );
}
