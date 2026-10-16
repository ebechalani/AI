import { Skeleton, Spinner } from '@/components/ui';

/** Reports: header, the filter card, four numbers, then the table. */
export default function TeacherReportsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-full max-w-lg" />
      </div>
      <Skeleton className="h-28 w-full rounded-card" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((stat) => (
          <Skeleton key={stat} className="h-24 w-full rounded-card" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-card" />
      <Spinner />
    </div>
  );
}
