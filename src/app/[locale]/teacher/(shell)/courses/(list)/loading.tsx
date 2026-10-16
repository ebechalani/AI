import { Skeleton, Spinner } from '@/components/ui';

/**
 * The course lists: header, the tab row, then a grid of cards. In the `(list)` group, so a
 * course page shows its own skeleton straight away.
 */
export default function TeacherCoursesLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-full max-w-lg" />
      </div>
      <div className="flex flex-wrap gap-3">
        {[0, 1, 2, 3].map((tab) => (
          <Skeleton key={tab} className="h-9 w-28" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((card) => (
          <Skeleton key={card} className="h-72 w-full rounded-card" />
        ))}
      </div>
      <Spinner />
    </div>
  );
}
