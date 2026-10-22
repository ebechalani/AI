import { buttonClasses } from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';

export interface LinkTabsProps {
  label: string;
  items: { key: string; label: string; href: string; active: boolean }[];
  className?: string;
}

/**
 * A row of link "tabs": every tab is a URL (server-rendered, paging resets with it), the active
 * one is `aria-current="page"`. Used for the role tabs, the people tabs, the billing tabs and
 * the challenge status filters.
 */
export function LinkTabs({ label, items, className }: LinkTabsProps) {
  return (
    <nav aria-label={label} className={className}>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              className={buttonClasses({ variant: item.active ? 'primary' : 'secondary', size: 'sm' })}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
