import type { Metadata } from 'next';
import { GraduationCap } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { AddTeacherButton } from '@/components/school/AddTeacherButton';
import { pageLinks, PAGE_SIZE, parsePaging } from '@/components/school/paging';
import { firstParam, SCHOOL_PATHS } from '@/components/school/paths';
import { activeClassesOf } from '@/components/school/people-model';
import { requireSchoolId } from '@/components/school/school-model';
import { TeachersTable } from '@/components/school/TeachersTable';
import { EmptyState, Pagination } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listClassesForSchool } from '@/lib/data/classes';
import { listSchoolUsers } from '@/lib/data/users';
import { pageOrFirst } from '../_lib/load';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('school_admin');
  const tNav = await getTranslations('nav');
  return { title: tNav('school_admin.teachers') };
}

// The teachers of the school (ARCHITECTURE.md 6.6, 3.7 "School Teachers" with WS-G-1): 50 per
// page by name, with the active classes each one teaches.
export default async function SchoolTeachersPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireRole('school_admin');
  const schoolId = requireSchoolId(session);
  const raw = await searchParams;
  const paging = parsePaging(firstParam(raw.cursor), firstParam(raw.trail), firstParam(raw.page));
  const [result, classes] = await Promise.all([
    pageOrFirst(
      () =>
        listSchoolUsers(session, schoolId, 'teacher', { limit: PAGE_SIZE, cursor: paging.cursor }),
      SCHOOL_PATHS.teachers,
    ),
    listClassesForSchool(session, schoolId),
  ]);
  const t = await getTranslations('school');
  const tNav = await getTranslations('nav');

  const classesByTeacher = Object.fromEntries(
    result.items.map((teacher) => [teacher.id, activeClassesOf(teacher.id, classes)]),
  );
  const links = pageLinks(SCHOOL_PATHS.teachers, paging, result.nextCursor);

  return (
    <>
      <PageHeader
        title={tNav('school_admin.teachers')}
        description={t('teachers.description')}
        actions={<AddTeacherButton />}
      />
      {result.items.length === 0 && paging.cursor === null ? (
        <EmptyState
          icon={<GraduationCap />}
          titleAs="h2"
          title={t('teachers.empty.title')}
          description={t('teachers.empty.description')}
        />
      ) : (
        <>
          <TeachersTable teachers={result.items} classesByTeacher={classesByTeacher} />
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
