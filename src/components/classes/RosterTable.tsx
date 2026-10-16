import { useTranslations } from 'next-intl';
import { useDateFormat } from '@/components/domain';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';
import type { ClassMember } from '@/types/school';
import { joinMethod } from './class-model';
import { RemoveStudentButton } from './RemoveStudentButton';

export interface RosterTableProps {
  classId: string;
  className: string;
  members: ClassMember[];
  viewerUid: string;
  /** The pupil pages live at `${studentHrefBase}/${member.id}`. */
  studentHrefBase: string;
  /** An archived class: no Remove buttons. */
  readOnly: boolean;
}

/** The students of a class: name and username, age group, how and when they joined. */
export function RosterTable({
  classId,
  className,
  members,
  viewerUid,
  studentHrefBase,
  readOnly,
}: RosterTableProps) {
  const t = useTranslations('classes');
  const tDomain = useTranslations('domain');
  const formatDate = useDateFormat();

  return (
    <Table caption={t('roster.caption', { className })}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{t('roster.student')}</TableHeaderCell>
          <TableHeaderCell>{t('roster.ageBand')}</TableHeaderCell>
          <TableHeaderCell>{t('roster.joined')}</TableHeaderCell>
          {!readOnly && <TableHeaderCell align="end">{t('roster.actions')}</TableHeaderCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableHeaderCell scope="row" className="min-w-40 font-normal whitespace-normal!">
              <Link
                href={`${studentHrefBase}/${member.id}`}
                className="rounded-sm font-medium break-words text-ink underline-offset-4 hover:text-brand-700 hover:underline"
              >
                {member.displayName}
              </Link>
              {member.username !== null ? (
                <span translate="no" className="block font-mono text-sm break-all text-ink-muted">
                  <span className="sr-only">{t('roster.usernameLabel')} </span>
                  {member.username}
                </span>
              ) : (
                <span className="block text-sm text-ink-muted">{t('roster.ownAccount')}</span>
              )}
            </TableHeaderCell>
            <TableCell className="whitespace-nowrap">
              {tDomain(`ageBands.${member.ageBand}`)}
            </TableCell>
            <TableCell>
              <span className="block whitespace-nowrap">{formatDate(member.joinedAt)}</span>
              <span className="block text-sm text-ink-muted">
                {t(`roster.method.${joinMethod(member, viewerUid)}`)}
              </span>
            </TableCell>
            {!readOnly && (
              <TableCell align="end">
                <RemoveStudentButton
                  classId={classId}
                  className={className}
                  studentUid={member.id}
                  studentName={member.displayName}
                />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
