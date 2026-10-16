import { Skeleton, Spinner } from '@/components/ui';

/** Robotics: the header, the course grid, the three themes and the hardware cards. */
export default function StudentRoboticsLoading() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-64 w-full rounded-card" />
          <Skeleton className="h-64 w-full rounded-card" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-40 w-full rounded-card" />
        <Skeleton className="h-40 w-full rounded-card" />
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-56 w-full rounded-card" />
        <Skeleton className="h-56 w-full rounded-card" />
        <Skeleton className="h-56 w-full rounded-card" />
      </div>
      <Spinner />
    </div>
  );
}
