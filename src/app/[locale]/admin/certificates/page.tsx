import type { Metadata } from 'next';
import { ArrowLeft, Award } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { CertificatesTable } from '@/components/admin/CertificatesTable';
import { MAIN_CONTENT_ID } from '@/components/admin/ids';
import { LearnerCoursesTable } from '@/components/admin/LearnerCoursesTable';
import { ListPagination } from '@/components/admin/ListPagination';
import { pageLinks, PAGE_SIZE, parsePaging } from '@/components/admin/paging';
import { ADMIN_PATHS, firstParam, idParam } from '@/components/admin/paths';
import { hasLearnerLinks } from '@/components/admin/user-model';
import { PageHeader } from '@/components/layout';
import { EmptyState, LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listAllCertificates, listCertificatesForUser } from '@/lib/data/certificates';
import { getCourses } from '@/lib/data/courses';
import { listEnrollmentsForUser } from '@/lib/data/enrollments';
import type { Enrollment } from '@/types/learning';
import { pageOrFirst, userOrNotFound } from '../_lib/load';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  await requireRole('platform_admin');
  const raw = await searchParams;
  const userId = idParam(firstParam(raw.user));
  const [t, tNav] = await Promise.all([getTranslations('admin'), getTranslations('nav')]);
  if (userId === undefined) return { title: tNav('platform_admin.certificates') };
  const learner = await userOrNotFound(userId);
  return { title: t('certificates.learner.title', { name: learner.displayName }) };
}

// Every certificate (ARCHITECTURE.md 6.7, 9.5), or one learner's courses and certificates with
// WS-J's issue control, reached from their row on the Users page.
export default async function AdminCertificatesPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireRole('platform_admin');
  const raw = await searchParams;
  const userId = idParam(firstParam(raw.user));
  const [t, tNav] = await Promise.all([getTranslations('admin'), getTranslations('nav')]);

  if (userId === undefined) {
    const paging = parsePaging(firstParam(raw.cursor), firstParam(raw.trail), firstParam(raw.page));
    const page = await pageOrFirst(
      () => listAllCertificates(session, { limit: PAGE_SIZE, cursor: paging.cursor }),
      ADMIN_PATHS.certificates,
    );
    const links = pageLinks(ADMIN_PATHS.certificates, {}, paging, page.nextCursor);
    return (
      <>
        <PageHeader
          title={tNav('platform_admin.certificates')}
          description={t('certificates.description')}
        />
        <p className="mb-6 text-sm text-ink-muted">{t('certificates.issueHint')}</p>
        {page.items.length === 0 && paging.cursor === null ? (
          <EmptyState
            icon={<Award />}
            titleAs="h2"
            title={t('certificates.empty.title')}
            description={t('certificates.empty.description')}
          />
        ) : (
          <>
            <CertificatesTable certificates={page.items} showLearner focusAfterId={MAIN_CONTENT_ID} />
            <ListPagination {...links} />
          </>
        )}
      </>
    );
  }

  const learner = await userOrNotFound(userId);
  const isLearner = hasLearnerLinks(learner.role);
  const [enrollments, certificates] = await Promise.all([
    isLearner ? listEnrollmentsForUser(session, learner.id) : Promise.resolve<Enrollment[]>([]),
    listCertificatesForUser(session, learner.id),
  ]);
  const courses = await getCourses(
    session,
    enrollments.map((enrollment) => enrollment.courseId),
  );
  const rows = enrollments.map((enrollment) => ({
    enrollment,
    course: courses.find((course) => course.id === enrollment.courseId) ?? null,
  }));
  const name = learner.displayName;

  return (
    <>
      <PageHeader
        className="wrap-anywhere"
        title={t('certificates.learner.title', { name })}
        breadcrumbs={[
          { label: tNav('platform_admin.certificates'), href: ADMIN_PATHS.certificates },
          { label: name },
        ]}
        actions={
          <LinkButton href={ADMIN_PATHS.certificates} variant="secondary">
            <ArrowLeft aria-hidden="true" className="rtl:-scale-x-100" />
            {t('certificates.learner.back')}
          </LinkButton>
        }
      />
      <div className="flex flex-col gap-8">
        <section aria-labelledby="learner-courses-title" className="flex flex-col gap-4">
          <div>
            <h2 id="learner-courses-title" className="text-xl font-semibold text-ink">
              {t('certificates.learner.coursesTitle', { name })}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">{t('certificates.learner.coursesDescription')}</p>
          </div>
          {!isLearner ? (
            <p className="text-sm text-ink-muted">{t('certificates.learner.notLearner')}</p>
          ) : rows.length === 0 ? (
            <EmptyState
              variant="plain"
              titleAs="h3"
              title={t('certificates.learner.noCourses.title')}
              description={t('certificates.learner.noCourses.description')}
            />
          ) : (
            <LearnerCoursesTable learnerName={name} rows={rows} />
          )}
        </section>
        <section aria-labelledby="learner-certificates-title" className="flex flex-col gap-4">
          <h2
            id="learner-certificates-title"
            tabIndex={-1}
            className="rounded-sm text-xl font-semibold text-ink"
          >
            {t('certificates.learner.certificatesTitle')}
          </h2>
          {certificates.length === 0 ? (
            <EmptyState
              variant="plain"
              icon={<Award />}
              titleAs="h3"
              title={t('certificates.learner.noCertificates.title')}
              description={t('certificates.learner.noCertificates.description')}
            />
          ) : (
            <CertificatesTable
              certificates={certificates}
              showLearner={false}
              focusAfterId="learner-certificates-title"
            />
          )}
        </section>
      </div>
    </>
  );
}
