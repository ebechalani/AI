import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { ArchiveClassButton } from '@/components/classes/ArchiveClassButton';
import {
  accountCreation,
  assignedCourseRows,
  capacityLeft,
  joinCodeState,
  joinHint,
  policyContext,
  rosterEmptyVariant,
} from '@/components/classes/class-model';
import { EditClassButton } from '@/components/classes/EditClassButton';
import { JoinCodePanel } from '@/components/classes/JoinCodePanel';
import { PageHeader } from '@/components/layout';
import { classTeachers, teacherIndex, teacherPicker } from '@/components/school/class-admin-model';
import { ClassTeachersCard } from '@/components/school/ClassTeachersCard';
import { JoinCodesOffNotice } from '@/components/school/JoinCodesOffNotice';
import { invitePath, JOIN_PATH, SCHOOL_PATHS } from '@/components/school/paths';
import { SchoolAddStudentsCard } from '@/components/school/SchoolAddStudentsCard';
import { SchoolAssignedCourses } from '@/components/school/SchoolAssignedCourses';
import { requireSchoolId } from '@/components/school/school-model';
import { SchoolRosterTable } from '@/components/school/SchoolRosterTable';
import { Alert, Card, Chip, EmptyState } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listAssignments, listMembers } from '@/lib/data/classes';
import { getCourses } from '@/lib/data/courses';
import { getSchool } from '@/lib/data/schools';
import { isAppError } from '@/lib/errors';
import { getPathname } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import { classOrNotFound, listAllSchoolTeachers, loadClass } from '../../../_lib/load';

type Params = Promise<{ classId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  await requireRole('school_admin');
  const { classId } = await params;
  try {
    return { title: (await loadClass(classId)).name };
  } catch (error) {
    if (!isAppError(error)) throw error;
    const tNav = await getTranslations('nav');
    return { title: tNav('school_admin.classes') };
  }
}

// One class of the school (ARCHITECTURE.md 6.6, 3.7 "School class detail" with WS-G-1): its
// teachers, join code, adding students, the roster and the assigned courses. WS-E's class
// components where their copy fits an admin; the school's own where it does not. An archived
// class is read-only.
export default async function SchoolClassPage({ params }: { params: Params }) {
  const session = await requireRole('school_admin');
  const schoolId = requireSchoolId(session);
  const { classId } = await params;
  const now = new Date().toISOString();
  const cls = await classOrNotFound(classId);
  const [members, assignments, courses, school, teachers, locale] = await Promise.all([
    listMembers(session, cls.id),
    listAssignments(session, cls.id),
    getCourses(session, cls.assignedCourseIds),
    getSchool(session, schoolId),
    listAllSchoolTeachers(session, schoolId),
    getLocale(),
  ]);
  const t = await getTranslations('school');
  const tNav = await getTranslations('nav');
  const tDomain = await getTranslations('domain');

  const readOnly = cls.archived;
  const creation = accountCreation(cls, policyContext(cls, school, session));
  const joinCodesOff = !school.settings.joinCodesEnabled;
  const emptyVariant = rosterEmptyVariant({
    archived: readOnly,
    creationBlocked: creation.blocked !== null,
    schoolJoinCodesOff: joinCodesOff,
  });
  const description = [
    cls.gradeLabel,
    tDomain(`ageBands.${cls.ageBand}`),
    t('class.studentsCount', { count: cls.studentCount }),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <PageHeader
        className="wrap-anywhere"
        title={cls.name}
        description={description}
        breadcrumbs={[
          { label: tNav('school_admin.classes'), href: SCHOOL_PATHS.classes },
          { label: cls.name },
        ]}
        actions={readOnly ? undefined : <EditClassButton cls={cls} />}
      />
      {readOnly && (
        <Alert tone="info" live="off" title={t('class.archived.title')} className="mb-6">
          {t('class.archived.description')}
        </Alert>
      )}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* First in the DOM: on phones the code and "Add students" sit right under the header. */}
        {!readOnly && (
          <aside className="flex min-w-0 flex-col gap-6 lg:col-start-3 lg:row-start-1">
            {joinCodesOff ? (
              <JoinCodesOffNotice />
            ) : (
              <JoinCodePanel
                classId={cls.id}
                className={cls.name}
                joinCode={cls.joinCode}
                state={joinCodeState(cls, now)}
                invitePath={invitePath(getPathname({ href: JOIN_PATH, locale }), cls.joinCode)}
                hint={joinHint(creation)}
                schoolJoinCodesOff={false}
                creationBlocked={creation.blocked !== null}
              />
            )}
            <SchoolAddStudentsCard
              classId={cls.id}
              className={cls.name}
              creation={creation}
              capacityLeft={capacityLeft(cls)}
            />
          </aside>
        )}
        {/* An archived class has no aside: the main column takes the whole width. */}
        <div
          className={cn(
            'flex min-w-0 flex-col gap-8 lg:col-start-1 lg:row-start-1',
            readOnly ? 'lg:col-span-3' : 'lg:col-span-2',
          )}
        >
          <ClassTeachersCard
            classId={cls.id}
            className={cls.name}
            teachers={classTeachers(cls, teacherIndex(teachers))}
            picker={teacherPicker(cls, teachers)}
            readOnly={readOnly}
          />
          <section aria-labelledby="roster-title" className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="roster-title" tabIndex={-1} className="rounded-sm text-xl font-bold text-ink">
                {t('class.roster.title')}
              </h2>
              <Chip>{t('class.roster.count', { count: members.length })}</Chip>
            </div>
            {members.length === 0 ? (
              <EmptyState
                icon={<Users />}
                title={t('class.roster.empty.title')}
                description={t(`class.roster.empty.${emptyVariant}`)}
              />
            ) : (
              <SchoolRosterTable
                classId={cls.id}
                className={cls.name}
                members={members}
                viewerUid={session.uid}
                readOnly={readOnly}
              />
            )}
          </section>
          <SchoolAssignedCourses
            classId={cls.id}
            className={cls.name}
            rows={assignedCourseRows(assignments, courses)}
            now={now}
            readOnly={readOnly}
          />
          {!readOnly && (
            <Card as="section" aria-labelledby="class-settings-title" className="gap-3 p-5 sm:p-6">
              <h2 id="class-settings-title" className="text-lg leading-snug font-bold text-ink">
                {t('class.settings.title')}
              </h2>
              <p className="text-sm text-ink-muted">{t('class.settings.description')}</p>
              <div>
                <ArchiveClassButton
                  classId={cls.id}
                  className={cls.name}
                  redirectTo={SCHOOL_PATHS.classes}
                />
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
