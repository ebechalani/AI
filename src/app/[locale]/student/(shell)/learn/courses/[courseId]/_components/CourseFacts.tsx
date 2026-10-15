import type { ReactNode } from 'react';
import { ArrowRight, Award, BookOpen, Clock, Shapes, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CertifiedBadge, useAgeRangeLabel, useDurationFormat } from '@/components/domain';
import { Card, Chip } from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';
import type { Course } from '@/types/content';

export interface CourseFactsProps {
  course: Course;
  /** From the outline, not the course's denormalized counts. */
  lessonCount: number;
  moduleCount: number;
}

// Each group is a dt followed by its dd(s), as the dl content model requires.
function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="flex items-center gap-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
        <span aria-hidden="true" className="text-brand-600 [&>svg]:size-4">
          {icon}
        </span>
        {label}
      </dt>
      {children}
    </div>
  );
}

function Value({ children }: { children: ReactNode }) {
  return <dd className="ps-6 font-medium break-words text-ink">{children}</dd>;
}

/** The course at a glance: size, duration, ages, area, and what finishing it brings. */
export function CourseFacts({ course, lessonCount, moduleCount }: CourseFactsProps) {
  const t = useTranslations('learn');
  const tDomain = useTranslations('domain');
  const formatDuration = useDurationFormat();
  const ageRange = useAgeRangeLabel()(course.ageMin, course.ageMax);
  const premium = course.accessTier === 'premium';

  return (
    <Card as="section" aria-labelledby="course-facts" className="gap-5 p-5 sm:p-6">
      <h2 id="course-facts" className="text-lg leading-snug font-bold text-ink">
        {t('course.facts.title')}
      </h2>

      <dl className="flex flex-col gap-4 text-sm">
        <Fact icon={<BookOpen />} label={t('course.facts.content')}>
          <Value>{tDomain('course.lessons', { count: lessonCount })}</Value>
          <Value>{tDomain('course.modules', { count: moduleCount })}</Value>
        </Fact>
        {course.estimatedMinutes > 0 && (
          <Fact icon={<Clock />} label={t('course.facts.duration')}>
            <Value>{formatDuration(course.estimatedMinutes)}</Value>
          </Fact>
        )}
        {ageRange && (
          <Fact icon={<Users />} label={t('course.facts.ages')}>
            <Value>{ageRange}</Value>
          </Fact>
        )}
        <Fact icon={<Shapes />} label={t('course.facts.area')}>
          <Value>{tDomain(`areas.${course.area}`)}</Value>
        </Fact>
      </dl>

      {(course.isOfficial || premium || course.certificateEnabled) && (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          {(course.isOfficial || premium) && (
            <div className="flex flex-wrap gap-2">
              {course.isOfficial && <CertifiedBadge />}
              {premium && <Chip tone="warning">{tDomain('course.premium')}</Chip>}
            </div>
          )}
          {course.certificateEnabled && (
            <p className="flex items-start gap-2 text-sm font-medium text-ink">
              <Award aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-600" />
              {t('course.facts.certificate')}
            </p>
          )}
        </div>
      )}

      {course.pathwayId !== null && (
        <Link
          href={`/student/learn/pathways/${course.pathwayId}`}
          className="inline-flex min-h-6 w-fit items-center gap-1 rounded-sm text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline"
        >
          {t('course.facts.pathway')}
          <ArrowRight aria-hidden="true" className="size-4 shrink-0 rtl:rotate-180" />
        </Link>
      )}
    </Card>
  );
}
