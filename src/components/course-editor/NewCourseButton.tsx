'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, type ButtonSize } from '@/components/ui';
import type { Course } from '@/types/content';
import { NewCourseDialog } from './NewCourseDialog';
import type { EditorMode } from './paths';
import type { PathwayOption } from './rows';

export interface NewCourseButtonProps {
  mode: EditorMode;
  pathways?: PathwayOption[];
  /** Admin: what the default position in a pathway is computed from. */
  officialCourses?: Pick<Course, 'pathwayId' | 'order'>[];
  size?: ButtonSize;
}

/** "New course" and its dialog, mounted afresh at every opening. */
export function NewCourseButton({
  mode,
  pathways = [],
  officialCourses = [],
  size,
}: NewCourseButtonProps) {
  const t = useTranslations('courseEditor');
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(0);
  return (
    <>
      <Button
        size={size}
        onClick={() => {
          setOpening((count) => count + 1);
          setOpen(true);
        }}
      >
        <Plus aria-hidden="true" />
        {mode === 'admin' ? t('adminList.newCourse') : t('list.newCourse')}
      </Button>
      {opening > 0 && (
        <NewCourseDialog
          key={opening}
          open={open}
          onClose={() => setOpen(false)}
          mode={mode}
          pathways={pathways}
          officialCourses={officialCourses}
        />
      )}
    </>
  );
}
