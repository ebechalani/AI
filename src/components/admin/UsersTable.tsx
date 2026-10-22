import { BadgeCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StatusChip, useDateFormat } from '@/components/domain';
import {
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';
import type { Role } from '@/types/common';
import type { UserProfile } from '@/types/user';
import { adminSchoolPath, userCertificatesPath, userSubscriptionsPath } from './paths';
import { SchoolChoicesProvider } from './school-choices';
import type { SchoolChoice } from './school-model';
import { hasLearnerLinks, signInIdentifier, toUserRow } from './user-model';
import { UserRowActions } from './UserRowActions';

export interface UsersTableProps {
  users: UserProfile[];
  role: Role;
  viewerUid: string;
  schools: SchoolChoice[];
  schoolNames: Record<string, string>;
  showSchool: boolean;
  caption: string;
  /** Where the focus goes when a role change removes the row from this list. */
  focusAfterRemovalId: string;
}

const LINK_CLASSES =
  'rounded-sm text-brand-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

/** The accounts of one role: identity, school, status, educator state, dates and the row controls. */
export function UsersTable({
  users,
  role,
  viewerUid,
  schools,
  schoolNames,
  showSchool,
  caption,
  focusAfterRemovalId,
}: UsersTableProps) {
  const t = useTranslations('admin');
  const formatDate = useDateFormat();

  return (
    <SchoolChoicesProvider schools={schools}>
      <Table caption={caption}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{t('users.columns.name')}</TableHeaderCell>
            {showSchool && <TableHeaderCell>{t('users.columns.school')}</TableHeaderCell>}
            <TableHeaderCell>{t('users.columns.status')}</TableHeaderCell>
            {role === 'teacher' && <TableHeaderCell>{t('users.columns.educator')}</TableHeaderCell>}
            <TableHeaderCell>{t('users.columns.joined')}</TableHeaderCell>
            <TableHeaderCell>{t('users.columns.lastSignIn')}</TableHeaderCell>
            <TableHeaderCell align="end">{t('users.columns.actions')}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => {
            const identifier = signInIdentifier(user);
            return (
              <TableRow key={user.id}>
                <TableHeaderCell scope="row" wrap className="min-w-48 font-normal">
                  <div className="flex items-start gap-3">
                    <Avatar avatarId={user.avatarId} size="sm" className="mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <span className="block font-medium break-words text-ink">{user.displayName}</span>
                      {identifier.kind === 'email' && (
                        <span translate="no" className="block text-sm break-all text-ink-muted">
                          {identifier.value}
                        </span>
                      )}
                      {identifier.kind === 'username' && (
                        <span translate="no" className="block font-mono text-sm break-all text-ink-muted">
                          <span className="sr-only">{t('users.username')} </span>
                          {identifier.value}
                        </span>
                      )}
                      {identifier.kind === 'none' && (
                        <span className="block text-sm text-ink-muted">{t('users.noIdentifier')}</span>
                      )}
                      {hasLearnerLinks(user.role) && (
                        <span className="block text-sm">
                          <Link
                            href={userCertificatesPath(user.id)}
                            aria-label={t('users.links.certificatesLabel', { name: user.displayName })}
                            className={LINK_CLASSES}
                          >
                            {t('users.links.certificates')}
                          </Link>
                          <span aria-hidden="true" className="mx-1.5 text-ink-muted">
                            ·
                          </span>
                          <Link
                            href={userSubscriptionsPath(user.id)}
                            aria-label={t('users.links.subscriptionsLabel', { name: user.displayName })}
                            className={LINK_CLASSES}
                          >
                            {t('users.links.subscriptions')}
                          </Link>
                        </span>
                      )}
                    </div>
                  </div>
                </TableHeaderCell>
                {showSchool && (
                  <TableCell>
                    {user.schoolId === null ? (
                      <span className="text-ink-muted">{t('shared.noSchool')}</span>
                    ) : (
                      <Link href={adminSchoolPath(user.schoolId)} className={LINK_CLASSES}>
                        {schoolNames[user.schoolId] ?? t('shared.unknownSchool')}
                      </Link>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <StatusChip status={user.status} />
                </TableCell>
                {role === 'teacher' && (
                  <TableCell>
                    {user.verifiedEducator ? (
                      <Chip tone="success" icon={<BadgeCheck />}>
                        {t('users.verified')}
                      </Chip>
                    ) : (
                      <Chip tone="neutral">{t('users.notVerified')}</Chip>
                    )}
                  </TableCell>
                )}
                <TableCell className="whitespace-nowrap">{formatDate(user.createdAt)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {user.lastLoginAt === null ? t('shared.never') : formatDate(user.lastLoginAt, 'dateTime')}
                </TableCell>
                <TableCell align="end">
                  <UserRowActions
                    user={toUserRow(user)}
                    viewerUid={viewerUid}
                    focusAfterRemovalId={focusAfterRemovalId}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </SchoolChoicesProvider>
  );
}
