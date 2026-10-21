import { Skeleton, Spinner } from '@/components/ui';

/** Achievements: the level card, the counters, the badge grid and the XP history. */
export default function StudentAchievementsLoading() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>
      <Skeleton className="h-36 w-full rounded-card" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-card" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-44 w-full rounded-card" />
        ))}
      </div>
      <Skeleton lines={6} />
      <Spinner />
    </div>
  );
}
