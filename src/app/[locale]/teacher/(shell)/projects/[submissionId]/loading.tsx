import { Skeleton, Spinner } from '@/components/ui';

/** The review screen: header, then the work beside the suggestion and the decision. */
export default function TeacherReviewLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-9 w-3/4 max-w-lg" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Skeleton className="h-40 w-full rounded-card" />
          <Skeleton className="h-16 w-full rounded-card" />
          <Skeleton lines={5} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <Skeleton className="h-72 w-full rounded-card" />
          <Skeleton className="h-96 w-full rounded-card" />
        </div>
      </div>
      <Spinner />
    </div>
  );
}
