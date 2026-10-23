import { Skeleton, Spinner } from '@/components/ui';

/** The assign page: header, then a few catalog sections. */
export default function SchoolAssignCourseLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>
      {[0, 1, 2].map((section) => (
        <div key={section} className="flex flex-col gap-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-20 w-full rounded-card" />
        </div>
      ))}
      <Spinner />
    </div>
  );
}
