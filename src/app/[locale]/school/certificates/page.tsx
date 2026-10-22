import type { Metadata } from 'next';
import { Award } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { pageLinks, PAGE_SIZE, parsePaging } from '@/components/school/paging';
import { firstParam, SCHOOL_PATHS } from '@/components/school/paths';
import { requireSchoolId } from '@/components/school/school-model';
import { SchoolCertificatesTable } from '@/components/school/SchoolCertificatesTable';
import { EmptyState, Pagination } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listCertificatesForSchool } from '@/lib/data/certificates';
import { pageOrFirst } from '../_lib/load';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('school_admin');
  const tNav = await getTranslations('nav');
  return { title: tNav('school_admin.certificates') };
}

// Every certificate earned in the school (ARCHITECTURE.md 6.6, 3.7 "School Certificates"):
// latest first, 50 per page, each opening WS-J's printable certificate. Read-only.
export default async function SchoolCertificatesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole('school_admin');
  const schoolId = requireSchoolId(session);
  const raw = await searchParams;
  const paging = parsePaging(firstParam(raw.cursor), firstParam(raw.trail), firstParam(raw.page));
  const result = await pageOrFirst(
    () => listCertificatesForSchool(session, schoolId, { limit: PAGE_SIZE, cursor: paging.cursor }),
    SCHOOL_PATHS.certificates,
  );
  const t = await getTranslations('school');
  const tNav = await getTranslations('nav');
  const links = pageLinks(SCHOOL_PATHS.certificates, paging, result.nextCursor);

  return (
    <>
      <PageHeader
        title={tNav('school_admin.certificates')}
        description={t('certificates.description')}
      />
      {result.items.length === 0 && paging.cursor === null ? (
        <EmptyState
          icon={<Award />}
          titleAs="h2"
          title={t('certificates.empty.title')}
          description={t('certificates.empty.description')}
        />
      ) : (
        <>
          <SchoolCertificatesTable certificates={result.items} />
          {(links.previousHref !== null || links.nextHref !== null) && (
            <Pagination
              previousHref={links.previousHref}
              nextHref={links.nextHref}
              page={links.page}
              className="mt-6"
            />
          )}
        </>
      )}
    </>
  );
}
