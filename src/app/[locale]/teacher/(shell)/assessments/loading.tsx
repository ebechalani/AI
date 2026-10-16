import { Skeleton, Spinner } from '@/components/ui';

/** The results list: the header, the filter card and the table. */
export default function TeacherAssessmentsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-1/2 max-w-sm" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <Skeleton className="h-24 w-full rounded-card" />
      <Skeleton className="h-72 w-full rounded-card" />
      <Spinner />
    </div>
  );
}
