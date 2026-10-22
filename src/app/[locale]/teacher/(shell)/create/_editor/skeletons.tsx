import { Skeleton, Spinner } from '@/components/ui';

// The loading states of the editor routes (2.1). Skeletons are hidden from screen readers; the
// Spinner says "Loading…" once.

function Header() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-9 w-2/3 max-w-md" />
      <Skeleton className="h-5 w-full max-w-sm" />
    </div>
  );
}

/** A list page: header with its button, then rows. */
export function ListSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex w-full max-w-md flex-col gap-3">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-full" />
        </div>
        <Skeleton className="h-11 w-36" />
      </div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-24 w-full rounded-card" />
        ))}
      </div>
      <Spinner />
    </div>
  );
}

/** The course page: header, the status panel aside, the tabs. */
export function CourseSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Header />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-start-3 lg:row-start-1">
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2 lg:col-start-1 lg:row-start-1">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-40 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
        </div>
      </div>
      <Spinner />
    </div>
  );
}

/** The lesson page: header, the blocks, the details aside. */
export function LessonSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Header />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-32 w-full rounded-card" />
          <Skeleton className="h-32 w-full rounded-card" />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <Skeleton className="h-72 w-full rounded-card" />
          <Skeleton className="h-32 w-full rounded-card" />
        </div>
      </div>
      <Spinner />
    </div>
  );
}

/** A quiz or project editor: header and one long form. */
export function FormSkeleton() {
  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <Header />
      <Skeleton className="h-11 w-40" />
      <Skeleton className="h-96 w-full rounded-card" />
      <Skeleton className="h-64 w-full rounded-card" />
      <Spinner />
    </div>
  );
}
