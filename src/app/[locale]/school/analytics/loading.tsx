import { STAT_GRID } from '@/components/school/DashboardStats';
import { Skeleton, Spinner } from '@/components/ui';

/** Analytics: header, four stat tiles, then the usage and classes tables. */
export default function SchoolAnalyticsLoading() {
  return (
    <div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-full max-w-sm" />
      </div>
      <div className={`mt-8 ${STAT_GRID}`}>
        {[0, 1, 2, 3].map((tile) => (
          <Skeleton key={tile} className="h-28 w-full rounded-card" />
        ))}
      </div>
      {[0, 1].map((block) => (
        <div key={block} className="mt-10 flex flex-col gap-4">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-full max-w-md" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      ))}
      <Spinner className="mt-8" />
    </div>
  );
}
