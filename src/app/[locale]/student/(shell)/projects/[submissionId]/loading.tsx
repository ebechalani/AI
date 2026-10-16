import { Skeleton, Spinner } from '@/components/ui';

/** One attempt: header, then the outcome and the work beside the facts card. */
export default function StudentSubmissionLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-9 w-3/4 max-w-lg" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <Skeleton className="h-28 w-full rounded-card" />
          <Skeleton className="h-64 w-full rounded-card" />
          <Skeleton lines={4} />
        </div>
        <div className="min-w-0 lg:col-start-3 lg:row-start-1">
          <Skeleton className="h-48 w-full rounded-card" />
        </div>
      </div>
      <Spinner />
    </div>
  );
}
