import { Pagination } from '@/components/ui';

export interface ListPaginationProps {
  previousHref: string | null;
  nextHref: string | null;
  page: number | undefined;
}

/** The previous / next links of a paged list; nothing when the list fits on one page. */
export function ListPagination({ previousHref, nextHref, page }: ListPaginationProps) {
  if (previousHref === null && nextHref === null) return null;
  return (
    <div className="mt-6 flex justify-center">
      <Pagination
        previousHref={previousHref}
        nextHref={nextHref}
        page={page}
        className="w-full max-w-md"
      />
    </div>
  );
}
