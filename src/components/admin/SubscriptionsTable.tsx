import { useLocale, useTranslations } from 'next-intl';
import { useDateFormat } from '@/components/domain';
import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';
import type { Subscription } from '@/types/billing';
import type { IsoDateString } from '@/types/common';
import {
  periodEnded,
  subscriptionCoverage,
  subscriptionTone,
  type CourseChoice,
} from './billing-model';
import { unbreakable } from './dates';
import { adminSchoolPath, userSubscriptionsPath } from './paths';
import { SubscriptionButton } from './SubscriptionButton';

export type { CourseChoice };

export interface SubscriptionsTableProps {
  subscriptions: Subscription[];
  /** Owner names by id; null for an owner that no longer exists. */
  ownerNames: Record<string, string | null>;
  courseTitles: Record<string, string>;
  courses: CourseChoice[];
  showOwner: boolean;
  now: IsoDateString;
}

const LINK_CLASSES =
  'rounded-sm font-medium break-words text-ink underline-offset-4 hover:text-brand-700 hover:underline';

/** The subscriptions list: owner, plan, status, period, what it gives access to, notes and Edit. */
export function SubscriptionsTable({
  subscriptions,
  ownerNames,
  courseTitles,
  courses,
  showOwner,
  now,
}: SubscriptionsTableProps) {
  const t = useTranslations('admin');
  const locale = useLocale();
  const formatDate = useDateFormat();
  const list = new Intl.ListFormat(locale, { type: 'conjunction' });

  function coverageText(subscription: Subscription): string {
    const coverage = subscriptionCoverage(subscription);
    switch (coverage.kind) {
      case 'school':
        return t('billing.subscriptions.coversSchool');
      case 'individual':
        return t('billing.subscriptions.coversIndividual');
      case 'courses':
        return t('billing.subscriptions.coversCourses', {
          count: coverage.courseIds.length,
          names: list.format(
            coverage.courseIds.map((id) => courseTitles[id] ?? t('billing.subscriptions.unknownCourse')),
          ),
        });
    }
  }

  return (
    <Table caption={t('billing.subscriptions.caption')}>
      <TableHead>
        <TableRow>
          {showOwner && <TableHeaderCell>{t('billing.subscriptions.columns.owner')}</TableHeaderCell>}
          <TableHeaderCell>{t('billing.subscriptions.columns.plan')}</TableHeaderCell>
          <TableHeaderCell>{t('billing.subscriptions.columns.status')}</TableHeaderCell>
          <TableHeaderCell>{t('billing.subscriptions.columns.period')}</TableHeaderCell>
          <TableHeaderCell>{t('billing.subscriptions.columns.covers')}</TableHeaderCell>
          <TableHeaderCell>{t('billing.subscriptions.columns.notes')}</TableHeaderCell>
          <TableHeaderCell align="end">{t('billing.subscriptions.columns.actions')}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {subscriptions.map((subscription) => {
          const known = ownerNames[subscription.ownerId] ?? null;
          const school = subscription.ownerType === 'school';
          const ownerName =
            known ?? (school ? t('shared.unknownSchool') : t('shared.deletedUser'));
          const plan = t(`billing.plans.${subscription.plan}`);
          const owner = (
            <>
              {known === null ? (
                <span className="block font-medium break-words text-ink">{ownerName}</span>
              ) : (
                <Link
                  href={school ? adminSchoolPath(subscription.ownerId) : userSubscriptionsPath(subscription.ownerId)}
                  className={LINK_CLASSES}
                >
                  {ownerName}
                </Link>
              )}
              <span className="block text-sm text-ink-muted">
                {t(school ? 'billing.subscriptions.ownerSchool' : 'billing.subscriptions.ownerUser')}
              </span>
            </>
          );
          return (
            <TableRow key={subscription.id}>
              {showOwner ? (
                <TableHeaderCell scope="row" wrap className="min-w-48 font-normal">
                  {owner}
                </TableHeaderCell>
              ) : null}
              {showOwner ? (
                <TableCell className="whitespace-nowrap">{plan}</TableCell>
              ) : (
                <TableHeaderCell scope="row" wrap className="min-w-40 font-normal">
                  <span className="font-medium text-ink">{plan}</span>
                </TableHeaderCell>
              )}
              <TableCell>
                <div className="flex flex-wrap gap-1.5">
                  <Chip tone={subscriptionTone(subscription.status)}>
                    {t(`billing.subscriptionStatus.${subscription.status}`)}
                  </Chip>
                  {periodEnded(subscription, now) && (
                    <Chip tone="warning">{t('billing.subscriptions.periodEnded')}</Chip>
                  )}
                </div>
              </TableCell>
              <TableCell className="min-w-40 whitespace-normal">
                {t('shared.dateRange', {
                  start: unbreakable(formatDate(subscription.currentPeriodStart)),
                  end: unbreakable(formatDate(subscription.currentPeriodEnd)),
                })}
              </TableCell>
              <TableCell className="min-w-40">
                <span className="block break-words">{coverageText(subscription)}</span>
              </TableCell>
              <TableCell className="min-w-32">
                {subscription.notes === null ? (
                  <span className="text-ink-muted">{t('shared.noValue')}</span>
                ) : (
                  <p className="line-clamp-2 text-sm break-words text-ink-muted">{subscription.notes}</p>
                )}
              </TableCell>
              <TableCell align="end">
                <SubscriptionButton
                  mode="edit"
                  subscription={subscription}
                  owner={{
                    kind: 'fixed',
                    ownerType: subscription.ownerType,
                    ownerId: subscription.ownerId,
                    name: ownerName,
                  }}
                  ownerLabel={ownerName}
                  courses={courses}
                  schools={[]}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
