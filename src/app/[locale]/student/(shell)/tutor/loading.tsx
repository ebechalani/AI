import { Skeleton, Spinner } from '@/components/ui';

/** The tutor page: the header, the course selector and the conversation frame. */
export default function StudentTutorLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton lines={2} className="max-w-xl" />
      </div>
      <Skeleton className="h-11 w-full sm:max-w-md" />
      <Skeleton className="h-[26rem] w-full rounded-card" />
      <Spinner />
    </div>
  );
}
