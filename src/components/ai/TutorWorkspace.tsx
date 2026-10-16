'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FormField, Select } from '@/components/ui';
import { TutorPanel } from './TutorPanel';

export interface TutorCourseOption {
  id: string;
  title: string;
}

export interface TutorWorkspaceProps {
  /** The learner's courses, most recently active first. */
  courses: TutorCourseOption[];
  initialCourseId: string | null;
}

/** /student/tutor: the course the conversation is about, and the tutor in a sized frame. */
export function TutorWorkspace({ courses, initialCourseId }: TutorWorkspaceProps) {
  const t = useTranslations('tutor');
  const [courseId, setCourseId] = useState(initialCourseId);

  return (
    <div className="flex flex-col gap-4">
      {courses.length > 0 && (
        <FormField
          label={t('page.contextLabel')}
          hint={t('page.contextHint')}
          className="sm:max-w-md"
        >
          <Select
            value={courseId ?? ''}
            onChange={(event) => setCourseId(event.target.value === '' ? null : event.target.value)}
            options={[
              { value: '', label: t('page.contextGeneral') },
              ...courses.map((course) => ({ value: course.id, label: course.title })),
            ]}
          />
        </FormField>
      )}
      {/* Phones: the viewport between the top bar and the bottom bar, so the thread keeps room
          next to the wrapped mode chips. From `sm` the header and the frame share one screen. */}
      <div className="h-[calc(100dvh-8rem)] min-h-[30rem] overflow-hidden rounded-card border border-border bg-surface shadow-sm sm:h-[calc(100dvh-25rem)] sm:min-h-[22rem] lg:h-[calc(100dvh-21rem)] lg:min-h-[28rem]">
        {/* Another course starts another conversation. */}
        <TutorPanel key={courseId ?? 'general'} courseId={courseId ?? undefined} variant="page" />
      </div>
    </div>
  );
}
