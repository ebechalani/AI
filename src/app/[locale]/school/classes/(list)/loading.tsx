import { Skeleton, Spinner } from '@/components/ui';

/**
 * The classes list: header and its button, then a grid of cards. In the `(list)` group, so a
 * class page shows its own skeleton straight away.
 */
export default function SchoolClassesLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex w-full max-w-md flex-col gap-3">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-full" />
        </div>
        <Skeleton className="h-11 w-36" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((card) => (
          <Skeleton key={card} className="h-40 w-full rounded-card" />
        ))}
      </div>
      <Spinner />
    </div>
  );
}
