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
import { canSendPasswordEmail, type ClassRef } from './people-model';
import { SendPasswordEmailButton } from './SendPasswordEmailButton';
import { UserStatusButton } from './UserStatusButton';

export interface TeachersTableProps {
  teachers: UserProfile[];
  /** The active classes each teacher teaches, by uid. */
  classesByTeacher: Record<string, ClassRef[]>;
}

/** The teachers of the school: name and email, classes, status, last login and actions. */
export function TeachersTable({ teachers, classesByTeacher }: TeachersTableProps) {
  const t = useTranslations('school');
  const formatDate = useDateFormat();

  return (
    <Table caption={t('teachers.caption')}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{t('teachers.name')}</TableHeaderCell>
          <TableHeaderCell>{t('teachers.classes')}</TableHeaderCell>
          <TableHeaderCell>{t('teachers.status')}</TableHeaderCell>
          <TableHeaderCell>{t('teachers.lastSignIn')}</TableHeaderCell>
          <TableHeaderCell align="end">{t('teachers.actions')}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {teachers.map((teacher) => {
          return (
            <TableRow key={teacher.id}>
              <TableHeaderCell scope="row" wrap className="min-w-48 font-normal">
                <span className="block font-medium break-words">{teacher.displayName}</span>
                {teacher.email !== null && (
                  <span translate="no" className="block text-sm break-all text-ink-muted">
                    {teacher.email}
                  </span>
                )}
              </TableHeaderCell>
              <TableCell className="min-w-32">
                <ClassRefLinks
                  classes={classesByTeacher[teacher.id] ?? []}
                  empty={t('teachers.noClass')}
                />
              </TableCell>
              <TableCell>
                <StatusChip status={teacher.status} />
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {teacher.lastLoginAt === null
                  ? t('teachers.never')
                  : formatDate(teacher.lastLoginAt)}
              </TableCell>
              <TableCell align="end">
                {/* Each button stays on one line (only the buttons: the row's dialogs render
                    here too). Below lg they keep their natural width and the region scrolls;
                    from lg two of them may stack rather than overflow the region. */}
                <div className="flex justify-end gap-2 lg:flex-wrap [&>button]:whitespace-nowrap">
                  {canSendPasswordEmail(teacher) && teacher.email !== null && (
                    <SendPasswordEmailButton email={teacher.email} name={teacher.displayName} />
                  )}
                  <UserStatusButton
                    uid={teacher.id}
                    name={teacher.displayName}
                    status={teacher.status}
                    kind="teacher"
                  />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
