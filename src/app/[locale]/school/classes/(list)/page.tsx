import type { Metadata } from 'next';
import { School } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { ArchivedClassList } from '@/components/school/ArchivedClassList';
import {
  classTeacherNames,
  ownerOptions,
  splitClasses,
  teacherIndex,
} from '@/components/school/class-admin-model';
import { CreateSchoolClassButton } from '@/components/school/CreateSchoolClassButton';
import { SCHOOL_PATHS } from '@/components/school/paths';
import { SchoolClassCard } from '@/components/school/SchoolClassCard';
import { requireSchoolId } from '@/components/school/school-model';
import { EmptyState, LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listClassesForSchool } from '@/lib/data/classes';
import { getSchool } from '@/lib/data/schools';
import { listAllSchoolTeachers } from '../../_lib/load';

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('school_admin');
  const tNav = await getTranslations('nav');
  return { title: tNav('school_admin.classes') };
}

// Every class of the school (ARCHITECTURE.md 6.6, 3.7 "School Classes" with WS-G-1): the active
// ones as cards with their teachers, the archived ones in a disclosure, and "New class".
export default async function SchoolClassesPage() {
  const session = await requireRole('school_admin');
  const schoolId = requireSchoolId(session);
  const now = new Date().toISOString();
  const [classes, teachers, school] = await Promise.all([
    listClassesForSchool(session, schoolId, { includeArchived: true }),
    listAllSchoolTeachers(session, schoolId),
    getSchool(session, schoolId),
  ]);
  const t = await getTranslations('school');
  const tNav = await getTranslations('nav');

  const { active, archived } = splitClasses(classes);
  const index = teacherIndex(teachers);
  const owners = ownerOptions(teachers);
  const joinCodesOff = !school.settings.joinCodesEnabled;

  let body;
  if (classes.length === 0) {
    body =
      owners.length === 0 ? (
        <EmptyState
          icon={<School />}
          title={t('classes.empty.title')}
          description={t('classes.empty.descriptionNoTeacher')}
          action={
            <LinkButton href={SCHOOL_PATHS.teachers}>{t('classes.empty.addTeachers')}</LinkButton>
          }
        />
      ) : (
        <EmptyState
          icon={<School />}
          title={t('classes.empty.title')}
          description={t('classes.empty.description')}
        />
      );
  } else if (active.length === 0) {
    body = (
      <EmptyState
        icon={<School />}
        title={t('classes.noActive.title')}
        description={t('classes.noActive.description')}
      />
    );
  } else {
    body = (
      <section aria-labelledby="active-classes-title" className="flex flex-col gap-4">
        <h2 id="active-classes-title" className="sr-only">
          {t('classes.activeTitle')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {active.map((cls) => (
            <SchoolClassCard
              key={cls.id}
              cls={cls}
              teacherNames={classTeacherNames(cls, index)}
              now={now}
              joinCodesOff={joinCodesOff}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      <PageHeader
        title={tNav('school_admin.classes')}
        description={t('classes.description')}
        actions={owners.length > 0 ? <CreateSchoolClassButton teachers={owners} /> : undefined}
      />
      {body}
      <ArchivedClassList classes={archived} />
    </>
  );
}
