import { Skeleton, Spinner } from '@/components/ui';

/** One AI Lab tool: the header, the form beside the "how it works" card, then the results. */
export default function StudentAiLabToolLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-48" />
        <Skeleton lines={2} className="max-w-2xl" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton className="h-56 w-full rounded-card" />
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
      <Spinner />
    </div>
  );
}
