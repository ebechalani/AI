import { Skeleton, Spinner } from '@/components/ui';

/** A pathway: breadcrumbs and header, the overview card, then the course grid. */
export default function StudentPathwayLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-2/3 max-w-sm" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <Skeleton className="h-48 w-full rounded-card" />
      <Skeleton className="h-7 w-56" />
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-64 w-full rounded-card" />
        ))}
      </div>
      <Spinner />
    </div>
  );
}
