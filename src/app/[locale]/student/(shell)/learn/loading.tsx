import { Skeleton, Spinner } from '@/components/ui';

/** The Learn page: the header, then a heading and a grid of cards. */
export default function StudentLearnLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-1/2 max-w-xs" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <Skeleton className="h-7 w-48" />
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-64 w-full rounded-card" />
        ))}
      </div>
      <Spinner />
    </div>
  );
}
