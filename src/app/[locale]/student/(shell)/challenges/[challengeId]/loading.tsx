import { Skeleton, Spinner } from '@/components/ui';

/** A challenge: breadcrumbs and title, the main column and the facts card. */
export default function StudentChallengeLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-9 w-3/4 max-w-lg" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-64 w-full rounded-card" />
          <Skeleton lines={6} />
        </div>
        <Skeleton className="h-72 w-full rounded-card lg:col-start-3 lg:row-start-1" />
      </div>
      <Spinner />
    </div>
  );
}
