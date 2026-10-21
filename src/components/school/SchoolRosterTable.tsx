import { useTranslations } from 'next-intl';
import { joinMethod } from '@/components/classes/class-model';
import { useDateFormat } from '@/components/domain';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui';
import type { ClassMember } from '@/types/school';
import { RemoveFromClassButton } from './RemoveFromClassButton';
import { ResetPasswordRowButton } from './ResetPasswordRowButton';

export interface SchoolRosterTableProps {
  classId: string;
  className: string;
  members: ClassMember[];
  viewerUid: string;
  /** An archived class: no actions column. */
  readOnly: boolean;
}

/** The pupils of a class as the school admin sees them: no pupil pages, so no name links. */
export function SchoolRosterTable({
  classId,
  className,
  members,
  viewerUid,
  readOnly,
}: SchoolRosterTableProps) {
  const t = useTranslations('school');
  const tDomain = useTranslations('domain');
  const formatDate = useDateFormat();

  return (
    <Table caption={t('class.roster.caption', { className })}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{t('class.roster.student')}</TableHeaderCell>
          <TableHeaderCell>{t('class.roster.ageBand')}</TableHeaderCell>
          <TableHeaderCell>{t('class.roster.joined')}</TableHeaderCell>
          {!readOnly && <TableHeaderCell align="end">{t('class.roster.actions')}</TableHeaderCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableHeaderCell scope="row" wrap className="min-w-40 font-normal">
              <span className="block font-medium break-words">{member.displayName}</span>
              {member.username !== null ? (
                <span translate="no" className="block font-mono text-sm break-all text-ink-muted">
                  <span className="sr-only">{t('class.roster.username')} </span>
                  {member.username}
                </span>
              ) : (
                <span className="block text-sm text-ink-muted">{t('class.roster.ownAccount')}</span>
              )}
            </TableHeaderCell>
            <TableCell className="whitespace-nowrap">
              {tDomain(`ageBands.${member.ageBand}`)}
            </TableCell>
            <TableCell>
              <span className="block whitespace-nowrap">{formatDate(member.joinedAt)}</span>
              <span className="block text-sm text-ink-muted">
                {t(`class.roster.method.${joinMethod(member, viewerUid)}`)}
              </span>
            </TableCell>
            {!readOnly && (
              <TableCell align="end">
                <div className="flex flex-wrap justify-end gap-2">
                  {member.username !== null && (
                    <ResetPasswordRowButton
                      studentUid={member.id}
                      studentName={member.displayName}
                      className={className}
                    />
                  )}
                  <RemoveFromClassButton
                    classId={classId}
                    className={className}
                    studentUid={member.id}
                    studentName={member.displayName}
                  />
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
