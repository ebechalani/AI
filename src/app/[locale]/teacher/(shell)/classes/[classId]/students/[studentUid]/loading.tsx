import { Skeleton, Spinner } from '@/components/ui';

/** A student: header, the summary card and actions, then progress, quizzes and projects. */
export default function TeacherClassStudentLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-9 w-56" />
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-start-3 lg:row-start-1">
          <Skeleton className="h-40 w-full rounded-card" />
          <Skeleton className="h-32 w-full rounded-card" />
        </div>
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2 lg:col-start-1 lg:row-start-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-44 w-full rounded-card" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-40 w-full rounded-card" />
        </div>
      </div>
      <Spinner />
    </div>
  );
}
