import { Skeleton, Spinner } from '@/components/ui';

/**
 * The dashboard: header, four stat tiles, then the activity and the aside. In the `(dashboard)`
 * group, so the other school pages never flash it (school/loading.tsx stays the generic one).
 */
export default function SchoolDashboardLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-full max-w-sm" />
      </div>
      <div className="grid grid-cols-1 gap-4 min-[440px]:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((tile) => (
          <Skeleton key={tile} className="h-28 w-full rounded-card" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-start-3 lg:row-start-1">
          <Skeleton className="h-48 w-full rounded-card" />
          <Skeleton className="h-48 w-full rounded-card" />
        </div>
        <div className="min-w-0 lg:col-span-2 lg:col-start-1 lg:row-start-1">
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      </div>
      <Spinner />
    </div>
  );
}
