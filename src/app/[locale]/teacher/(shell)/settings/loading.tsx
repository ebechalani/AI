import { Skeleton, Spinner } from '@/components/ui';

/** Settings: header, then the profile, language, account and certificates cards. */
export default function TeacherSettingsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-96 w-full rounded-card" />
        <div className="flex flex-col gap-6">
          <Skeleton className="h-44 w-full rounded-card" />
          <Skeleton className="h-44 w-full rounded-card" />
        </div>
      </div>
      <Skeleton className="h-40 w-full rounded-card" />
      <Spinner />
    </div>
  );
}
