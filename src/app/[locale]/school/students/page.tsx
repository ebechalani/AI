import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { pageLinks, PAGE_SIZE, parsePaging } from '@/components/school/paging';
import { firstParam, SCHOOL_PATHS } from '@/components/school/paths';
import { classIndex, classRefsFor } from '@/components/school/people-model';
import { requireSchoolId } from '@/components/school/school-model';
import { StudentsTable } from '@/components/school/StudentsTable';
import { EmptyState, LinkButton, Pagination } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listClassesForSchool } from '@/lib/data/classes';
import { listSchoolUsers } from '@/lib/data/users';
import { pageOrFirst } from '../_lib/load';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('school_admin');
  const tNav = await getTranslations('nav');
  return { title: tNav('school_admin.students') };
}

// The students of the school (ARCHITECTURE.md 6.6, 3.7 "School Students" with WS-G-1): 50 per
// page by name, with their classes (archived ones marked). Students are added in their classes.
export default async function SchoolStudentsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireRole('school_admin');
  const schoolId = requireSchoolId(session);
  const raw = await searchParams;
  const paging = parsePaging(firstParam(raw.cursor), firstParam(raw.trail), firstParam(raw.page));
  const [result, classes] = await Promise.all([
    pageOrFirst(
      () =>
        listSchoolUsers(session, schoolId, 'student', { limit: PAGE_SIZE, cursor: paging.cursor }),
      SCHOOL_PATHS.students,
    ),
    listClassesForSchool(session, schoolId, { includeArchived: true }),
  ]);
  const t = await getTranslations('school');
  const tNav = await getTranslations('nav');

  const index = classIndex(classes);
  const classesByStudent = Object.fromEntries(
    result.items.map((student) => [student.id, classRefsFor(student.classIds, index)]),
  );
  const links = pageLinks(SCHOOL_PATHS.students, paging, result.nextCursor);
  const classesLink = (
    <LinkButton href={SCHOOL_PATHS.classes} variant="secondary">
      {t('students.openClasses')}
    </LinkButton>
  );

  return (
    <>
      <PageHeader
        title={tNav('school_admin.students')}
        description={t('students.description')}
        actions={classesLink}
      />
      {result.items.length === 0 && paging.cursor === null ? (
        <EmptyState
          icon={<Users />}
          titleAs="h2"
          title={t('students.empty.title')}
          description={t('students.empty.description')}
          action={classesLink}
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-ink-muted">{t('students.addHint')}</p>
          <StudentsTable students={result.items} classesByStudent={classesByStudent} />
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
