import { CourseCard } from '@/components/domain';
import type { Course } from '@/types/content';
import { coursePath } from './paths';

export interface CourseGridProps {
  courses: Course[];
  /** courseId → progress, for the courses the teacher is enrolled in. */
  progress?: Record<string, number>;
}

export function CourseGrid({ courses, progress }: CourseGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          href={coursePath(course.id)}
          progressPercent={progress?.[course.id]}
        />
      ))}
    </div>
  );
}
