import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  CertifiedBadge,
  StatusChip,
  useAgeRangeLabel,
  useDurationFormat,
} from '@/components/domain';
import { Card } from '@/components/ui';
import type { Course } from '@/types/content';

export interface CourseFactsProps {
  course: Course;
  /** From the outline, not the course's denormalized counts. */
  lessonCount: number;
  moduleCount: number;
  isOwner: boolean;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{label}</dt>
      {children}
    </div>
  );
}

function Value({ children }: { children: ReactNode }) {
  return <dd className="font-medium break-words text-ink">{children}</dd>;
}

/** The course at a glance, as a teacher plans with it. */
export function CourseFacts({ course, lessonCount, moduleCount, isOwner }: CourseFactsProps) {
  const t = useTranslations('teacher');
  const tDomain = useTranslations('domain');
  const formatDuration = useDurationFormat();
  const ageRange = useAgeRangeLabel()(course.ageMin, course.ageMax);

  return (
    <Card as="section" aria-labelledby="course-facts-title" className="gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="course-facts-title" className="text-lg leading-snug font-bold text-ink">
          {t('course.facts.title')}
        </h2>
        {course.isOfficial && <CertifiedBadge />}
      </div>
      <dl className="flex flex-col gap-3 text-sm">
        <Fact label={t('course.facts.area')}>
          <Value>{tDomain(`areas.${course.area}`)}</Value>
        </Fact>
        <Fact label={t('course.facts.ages')}>
          <Value>{ageRange ?? t('course.facts.agesNone')}</Value>
        </Fact>
        {course.estimatedMinutes > 0 && (
          <Fact label={t('course.facts.duration')}>
            <Value>{formatDuration(course.estimatedMinutes)}</Value>
          </Fact>
        )}
        <Fact label={t('course.facts.content')}>
          <Value>{tDomain('course.modules', { count: moduleCount })}</Value>
          <Value>{tDomain('course.lessons', { count: lessonCount })}</Value>
        </Fact>
        <Fact label={t('course.facts.audience')}>
          <Value>
            {course.audience === 'teacher'
              ? t('course.facts.forTeachers')
              : t('course.facts.forStudents')}
          </Value>
        </Fact>
        <Fact label={t('course.facts.certificate')}>
          <Value>
            {course.certificateEnabled
              ? t('course.facts.certificateYes')
              : t('course.facts.certificateNo')}
          </Value>
        </Fact>
        <Fact label={t('course.facts.access')}>
          <Value>
            {course.accessTier === 'premium' ? tDomain('course.premium') : t('course.facts.free')}
          </Value>
        </Fact>
        {isOwner && (
          <Fact label={t('course.facts.status')}>
            <dd>
              <StatusChip status={course.status} />
            </dd>
          </Fact>
        )}
      </dl>
    </Card>
  );
}
