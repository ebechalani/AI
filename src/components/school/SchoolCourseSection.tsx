import { BookOpen } from 'lucide-react';
import type { CourseUsageRow } from '@/types/analytics';
import type { Course } from '@/types/content';
import { EmptyState } from '@/components/ui';
import { SchoolCourseItem } from './SchoolCourseItem';

export interface SchoolCourseSectionProps {
  id: string;
  title: string;
  description?: string;
  /** A titled group per pathway, or one untitled group. */
  groups: { title: string | null; courses: Course[] }[];
  usage: Map<string, CourseUsageRow>;
  showUsage: boolean;
  /** Teacher names by uid, for the "By …" line. */
  authors?: Record<string, string>;
  showStatus: boolean;
  /** Shown when no group holds a course. */
  empty?: { title: string; description: string };
}

/** A titled list of courses, grouped by pathway when the groups have titles. */
export function SchoolCourseSection({
  id,
  title,
  description,
  groups,
  usage,
  showUsage,
  authors,
  showStatus,
  empty,
}: SchoolCourseSectionProps) {
  const titleId = `${id}-title`;
  const filled = groups.filter((group) => group.courses.length > 0);

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={titleId} className="text-xl font-bold break-words text-ink">
          {title}
        </h2>
        {description && <p className="text-sm text-ink-muted">{description}</p>}
      </div>
      {filled.length === 0 ? (
        <EmptyState
          variant="plain"
          icon={<BookOpen />}
          title={empty?.title}
          description={empty?.description}
        />
      ) : (
        filled.map((group, index) => (
          <div key={group.title ?? index} className="flex flex-col gap-3">
            {group.title !== null && (
              <h3 className="text-lg font-semibold break-words text-ink">{group.title}</h3>
            )}
            <ul className="grid gap-3 lg:grid-cols-2">
              {group.courses.map((course) => (
                <SchoolCourseItem
                  key={course.id}
                  course={course}
                  usage={usage.get(course.id)}
                  showUsage={showUsage}
                  authorName={authors?.[course.ownerUid] ?? null}
                  showStatus={showStatus}
                  titleAs={group.title === null ? 'h3' : 'h4'}
                />
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
