import { Skeleton, Spinner } from '@/components/ui';

/**
 * The projects list: header, then two sections of cards. In the `(list)` group, so it wraps the
 * list only: a submission's page shows its own skeleton straight away.
 */
export default function StudentProjectsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-full max-w-xs sm:w-80" />
      </div>
      {[0, 1].map((section) => (
        <div key={section} className="flex flex-col gap-4">
          <Skeleton className="h-7 w-56" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((card) => (
              <Skeleton key={card} className="h-40 w-full rounded-card" />
            ))}
          </div>
        </div>
      ))}
      <Spinner />
    </div>
  );
}
