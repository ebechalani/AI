import { Skeleton, Spinner } from '@/components/ui';

/** The users list: header, the four role tabs, then the table. */
export default function AdminUsersLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex w-full max-w-md flex-col gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-full" />
      </div>
      <div className="flex flex-wrap gap-2">
        {[0, 1, 2, 3].map((tab) => (
          <Skeleton key={tab} className="h-9 w-28 rounded-control" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-card" />
      <Spinner />
    </div>
  );
}
