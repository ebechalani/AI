import { useTranslations } from 'next-intl';
import { StatusChip, useDateFormat } from '@/components/domain';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui';
import type { UserProfile } from '@/types/user';
import { ClassRefLinks } from './ClassRefLinks';
import { studentActions, type ClassRef } from './people-model';
import { ResetPasswordRowButton } from './ResetPasswordRowButton';
import { UserStatusButton } from './UserStatusButton';

export interface StudentsTableProps {
  students: UserProfile[];
  /** The classes of each student (archived ones included and marked), by uid. */
  classesByStudent: Record<string, ClassRef[]>;
}

/** The students of the school: account, age group, classes, status, last login and actions. */
export function StudentsTable({ students, classesByStudent }: StudentsTableProps) {
  const t = useTranslations('school');
  const tDomain = useTranslations('domain');
  const formatDate = useDateFormat();
  const anyOwnAccount = students.some((student) => student.username === null);

  return (
    <>
      <Table caption={t('students.caption')}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{t('students.name')}</TableHeaderCell>
            <TableHeaderCell>{t('students.ageBand')}</TableHeaderCell>
            <TableHeaderCell>{t('students.classes')}</TableHeaderCell>
            <TableHeaderCell>{t('students.status')}</TableHeaderCell>
            <TableHeaderCell>{t('students.lastSignIn')}</TableHeaderCell>
            <TableHeaderCell align="end">{t('students.actions')}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map((student) => {
            const actions = studentActions(student);
            return (
              <TableRow key={student.id}>
                <TableHeaderCell scope="row" wrap className="min-w-40 font-normal">
                  <span className="block font-medium break-words">{student.displayName}</span>
                  {student.username !== null ? (
                    <span
                      translate="no"
                      className="block font-mono text-sm break-all text-ink-muted"
                    >
                      <span className="sr-only">{t('students.username')} </span>
                      {student.username}
                    </span>
                  ) : (
                    <span className="block text-sm text-ink-muted">
                      {t('students.ownAccount')}
                    </span>
                  )}
                </TableHeaderCell>
                <TableCell className="whitespace-nowrap">
                  {tDomain(`ageBands.${student.ageBand}`)}
                </TableCell>
                <TableCell className="min-w-32">
                  <ClassRefLinks
                    classes={classesByStudent[student.id] ?? []}
                    empty={t('students.noClass')}
                  />
                </TableCell>
                <TableCell>
                  <StatusChip status={student.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {student.lastLoginAt === null
                    ? t('students.never')
                    : formatDate(student.lastLoginAt)}
                </TableCell>
                <TableCell align="end">
                  <div className="flex flex-wrap justify-end gap-2">
                    {actions.resetPassword && (
                      <ResetPasswordRowButton
                        studentUid={student.id}
                        studentName={student.displayName}
                        className={null}
                      />
                    )}
                    {actions.status !== null && (
                      <UserStatusButton
                        uid={student.id}
                        name={student.displayName}
                        status={student.status}
                        kind="student"
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {anyOwnAccount && (
        <p className="mt-3 text-sm text-ink-muted">{t('students.ownAccountNote')}</p>
      )}
    </>
  );
}
