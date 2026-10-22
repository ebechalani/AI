import { useTranslations } from 'next-intl';
import { NamedIcon } from '@/components/domain';
import { Card, CardBody, LinkButton } from '@/components/ui';
import { ADMIN_PATHS } from './paths';

type Section = 'schools' | 'users' | 'subscriptions' | 'courses' | 'certificates' | 'challenges';

// The nav icons, by section. Every key is read: dashboard.manage.<section>.{title,description}.
const SECTIONS: readonly { key: Section; icon: string }[] = [
  { key: 'schools', icon: 'Building2' },
  { key: 'users', icon: 'Users' },
  { key: 'subscriptions', icon: 'CreditCard' },
  { key: 'courses', icon: 'BookOpen' },
  { key: 'certificates', icon: 'Award' },
  { key: 'challenges', icon: 'Trophy' },
];

/** One card per admin section, with a link to it. */
export function AdminShortcuts() {
  const t = useTranslations('admin');
  return (
    <section aria-labelledby="manage-title">
      <h2 id="manage-title" className="mb-4 text-xl font-semibold text-ink">
        {t('dashboard.manage.title')}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map(({ key, icon }) => {
          const title = t(`dashboard.manage.${key}.title`);
          return (
            <Card key={key} as="article" className="flex flex-col">
              <CardBody className="flex flex-1 flex-col gap-3">
                <span className="flex size-11 items-center justify-center rounded-control bg-brand-50 text-brand-700">
                  <NamedIcon name={icon} className="size-5" />
                </span>
                <h3 className="text-lg font-semibold text-ink">{title}</h3>
                <p className="flex-1 text-sm text-ink-muted">
                  {t(`dashboard.manage.${key}.description`)}
                </p>
                <div>
                  <LinkButton
                    href={ADMIN_PATHS[key]}
                    variant="secondary"
                    size="sm"
                    aria-label={t('dashboard.manage.openLabel', { section: title })}
                  >
                    {t('dashboard.manage.open')}
                  </LinkButton>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
