import { useTranslations } from 'next-intl';
import { QUEUE_LIMIT } from '@/components/projects/projects-model';
import { buttonClasses } from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';

export interface ViewSwitchProps {
  view: 'queue' | 'all';
  /** The queue's length on the queue view; null on the All view, where it is not read. */
  queueCount: number | null;
  /** The All view of the default class. */
  allHref: string;
}

/** The queue and the All view, as two links: Enter works without JavaScript. */
export function ViewSwitch({ view, queueCount, allHref }: ViewSwitchProps) {
  const t = useTranslations('review');
  const queueLabel =
    queueCount === null
      ? t('views.queuePlain')
      : queueCount >= QUEUE_LIMIT
        ? t('views.queueMax', { count: queueCount })
        : t('views.queue', { count: queueCount });
  const links = [
    { key: 'queue', href: '/teacher/projects', label: queueLabel },
    { key: 'all', href: allHref, label: t('views.all') },
  ] as const;

  return (
    <nav aria-label={t('views.label')} className="mb-6">
      <ul className="flex flex-wrap gap-2">
        {links.map((link) => {
          const current = link.key === view;
          return (
            <li key={link.key}>
              <Link
                href={link.href}
                aria-current={current ? 'page' : undefined}
                className={buttonClasses({ variant: current ? 'primary' : 'secondary' })}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
