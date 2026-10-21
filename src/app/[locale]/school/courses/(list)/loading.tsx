import { Skeleton, Spinner } from '@/components/ui';

/**
 * The courses list: header, then two sections of course cards. In the `(list)` group, so a
 * course page shows its own skeleton straight away.
 */
export default function SchoolCoursesLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>
      {[0, 1].map((section) => (
        <div key={section} className="flex flex-col gap-4">
          <Skeleton className="h-7 w-56" />
          <div className="grid gap-3 lg:grid-cols-2">
            {[0, 1, 2, 3].map((card) => (
              <Skeleton key={card} className="h-32 w-full rounded-card" />
            ))}
          </div>
        </div>
      ))}
      <Spinner />
    </div>
  );
}
