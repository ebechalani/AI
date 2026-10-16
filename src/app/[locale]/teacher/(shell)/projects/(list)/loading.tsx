import { Skeleton, Spinner } from '@/components/ui';

/**
 * The teacher's projects: header, the two-link switch, then a grid of cards. In the `(list)`
 * group, so it wraps the list only: a review screen shows its own skeleton straight away.
 */
export default function TeacherProjectsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-11 w-56" />
        <Skeleton className="h-11 w-40" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((card) => (
            <Skeleton key={card} className="h-40 w-full rounded-card" />
          ))}
        </div>
      </div>
      <Spinner />
    </div>
  );
}
