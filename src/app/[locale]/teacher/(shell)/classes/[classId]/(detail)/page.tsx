import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { AddStudentsCard } from '@/components/classes/AddStudentsCard';
import { ArchiveClassButton } from '@/components/classes/ArchiveClassButton';
import { AssignedCourses } from '@/components/classes/AssignedCourses';
import {
  accountCreation,
  assignedCourseRows,
  capacityLeft,
  joinCodeState,
  joinHint,
  policyContext,
  rosterEmptyVariant,
  type RosterEmptyVariant,
} from '@/components/classes/class-model';
import { EditClassButton } from '@/components/classes/EditClassButton';
import { JoinCodePanel } from '@/components/classes/JoinCodePanel';
import { NotVerifiedNotice } from '@/components/classes/NotVerifiedNotice';
import { RosterTable } from '@/components/classes/RosterTable';
import { PageHeader } from '@/components/layout';
import {
  classPath,
  invitePath,
  JOIN_PATH,
  reportPath,
  TEACHER_PATHS,
} from '@/components/teacher/paths';
import { Alert, Card, Chip, EmptyState, LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { getCourses } from '@/lib/data/courses';
import { listAssignments, listMembers } from '@/lib/data/classes';
import { getSchool } from '@/lib/data/schools';
import { isAppError, NotFoundError } from '@/lib/errors';
import { getPathname } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import type { School } from '@/types/school';
import { classOrNotFound, loadClass } from '../_lib/load';

type Params = Promise<{ classId: string }>;

// Every key named here is used: roster.empty.{description, descriptionCodeOnly,
// descriptionAddOnly, descriptionNone, descriptionArchived}.
const ROSTER_EMPTY_KEY: Record<RosterEmptyVariant, string> = {
  both: 'description',
  codeOnly: 'descriptionCodeOnly',
  addOnly: 'descriptionAddOnly',
  none: 'descriptionNone',
  archived: 'descriptionArchived',
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  await requireRole('teacher');
  const { classId } = await params;
  try {
    return { title: (await loadClass(classId)).name };
  } catch (error) {
    if (!isAppError(error)) throw error;
    const tNav = await getTranslations('nav');
    return { title: tNav('teacher.classes') };
  }
}

function nullOnNotFound(error: unknown): null {
  if (error instanceof NotFoundError) return null;
  throw error;
}

// One class (ARCHITECTURE.md 6.5, 3.7 "Class detail" with WS-E-1): join code, adding students,
// the roster and the assigned courses. An archived class is read-only.
export default async function TeacherClassPage({ params }: { params: Params }) {
  const session = await requireRole('teacher');
  const { classId } = await params;
  const now = new Date().toISOString();
  const cls = await classOrNotFound(classId);
  const [members, assignments, courses, school, locale, t, tNav, tDomain] = await Promise.all([
    listMembers(session, cls.id),
    listAssignments(session, cls.id),
    getCourses(session, cls.assignedCourseIds),
    cls.schoolId === null
      ? Promise.resolve<School | null>(null)
      : getSchool(session, cls.schoolId).catch(nullOnNotFound),
    getLocale(),
    getTranslations('classes'),
    getTranslations('nav'),
    getTranslations('domain'),
  ]);

  const readOnly = cls.archived;
  const schoolless = cls.schoolId === null;
  const creation = accountCreation(cls, policyContext(cls, school, session));
  const schoolJoinCodesOff = school !== null && !school.settings.joinCodesEnabled;
  const emptyKey =
    ROSTER_EMPTY_KEY[
      rosterEmptyVariant({
        archived: readOnly,
        creationBlocked: creation.blocked !== null,
        schoolJoinCodesOff,
      })
    ];
  const description = [
    cls.gradeLabel,
    tDomain(`ageBands.${cls.ageBand}`),
    t('detail.studentsCount', { count: cls.studentCount }),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <PageHeader
        title={cls.name}
        description={description}
        breadcrumbs={[
          { label: tNav('teacher.classes'), href: TEACHER_PATHS.classes },
          { label: cls.name },
        ]}
        actions={
          <>
            <LinkButton href={reportPath(cls.id)} variant="secondary">
              {t('detail.report')}
            </LinkButton>
            {!readOnly && <EditClassButton cls={cls} />}
          </>
        }
      />
      {readOnly && (
        <Alert tone="info" live="off" title={t('detail.archived.title')} className="mb-6">
          {t('detail.archived.description')}
        </Alert>
      )}
      {schoolless && !session.verifiedEducator && !readOnly && (
        <NotVerifiedNotice className="mb-6" />
      )}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* First in the DOM: on phones the code and "Add students" sit right under the header. */}
        {!readOnly && (
          <aside className="flex min-w-0 flex-col gap-6 lg:col-start-3 lg:row-start-1">
            <JoinCodePanel
              classId={cls.id}
              className={cls.name}
              joinCode={cls.joinCode}
              state={joinCodeState(cls, now)}
              invitePath={invitePath(getPathname({ href: JOIN_PATH, locale }), cls.joinCode)}
              hint={joinHint(creation)}
              schoolJoinCodesOff={schoolJoinCodesOff}
              creationBlocked={creation.blocked !== null}
            />
            <AddStudentsCard
              classId={cls.id}
              className={cls.name}
              creation={creation}
              capacityLeft={capacityLeft(cls)}
              schoolless={schoolless}
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
          <section aria-labelledby="roster-title" className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="roster-title" tabIndex={-1} className="rounded-sm text-xl font-bold text-ink">
                {t('roster.title')}
              </h2>
              <Chip>{t('roster.count', { count: members.length })}</Chip>
            </div>
            {members.length === 0 ? (
              <EmptyState
                icon={<Users />}
                title={t('roster.empty.title')}
                description={t(`roster.empty.${emptyKey}`)}
              />
            ) : (
              <RosterTable
                classId={cls.id}
                className={cls.name}
                members={members}
                viewerUid={session.uid}
                studentHrefBase={`${classPath(cls.id)}/students`}
                readOnly={readOnly}
              />
            )}
          </section>
          <AssignedCourses
            classId={cls.id}
            className={cls.name}
            rows={assignedCourseRows(assignments, courses)}
            now={now}
            readOnly={readOnly}
          />
          {!readOnly && (
            <Card as="section" aria-labelledby="class-settings-title" className="gap-3 p-5 sm:p-6">
              <h2 id="class-settings-title" className="text-lg leading-snug font-bold text-ink">
                {t('detail.settings.title')}
              </h2>
              <p className="text-sm text-ink-muted">{t('detail.settings.description')}</p>
              <div>
                <ArchiveClassButton
                  classId={cls.id}
                  className={cls.name}
                  redirectTo={TEACHER_PATHS.classes}
                />
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
