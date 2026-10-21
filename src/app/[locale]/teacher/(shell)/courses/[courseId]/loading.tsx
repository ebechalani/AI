import { Skeleton, Spinner } from '@/components/ui';

/** A course: breadcrumbs and header, then the panel column and the main column. */
export default function TeacherCourseLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-9 w-3/4 max-w-lg" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-start-3 lg:row-start-1">
          <Skeleton className="h-56 w-full rounded-card" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2 lg:col-start-1 lg:row-start-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton lines={3} />
          <Skeleton className="h-72 w-full rounded-card" />
          <Skeleton className="h-72 w-full rounded-card" />
        </div>
      </div>
      <Spinner />
    </div>
  );
}
