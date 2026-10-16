import { Skeleton, Spinner } from '@/components/ui';

/** One attempt: the header, four stat cards and the questions. */
export default function TeacherAttemptLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-2/3 max-w-md" />
        <Skeleton className="h-5 w-full max-w-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-card" />
        ))}
      </div>
      <div className="flex max-w-3xl flex-col gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-40 w-full rounded-card" />
        ))}
      </div>
      <Spinner />
    </div>
  );
}
