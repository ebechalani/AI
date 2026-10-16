import { useTranslations } from 'next-intl';
import { NamedIcon } from '@/components/domain';
import { Card, Chip } from '@/components/ui';
import type { LabTool } from '@/lib/ai/lab-tools';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import { STATUS_TONE } from './lab-model';

export interface LabToolCardProps {
  tool: LabTool;
  /** Locale-less path of the tool; null for a tool that is only announced. */
  href: string | null;
  className?: string;
}

/** One AI Lab tool: the whole card is its link (the PathwayCard pattern). */
export function LabToolCard({ tool, href, className }: LabToolCardProps) {
  const t = useTranslations('aiLab');
  const title = t(`tools.${tool.id}.title`);
  return (
    <Card
      as="article"
      interactive={href !== null}
      tone={href !== null ? 'default' : 'muted'}
      className={cn('h-full gap-4 p-5 sm:p-6', className)}
    >
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-control bg-brand-100 text-brand-700">
          <NamedIcon name={tool.icon} className="size-6" />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg leading-snug font-semibold break-words text-ink">
            {href !== null ? (
              <Link
                href={href}
                className="rounded-sm after:absolute after:inset-0 after:rounded-card"
              >
                {title}
              </Link>
            ) : (
              title
            )}
          </h3>
          <p className="mt-1 text-sm text-ink-muted">{t(`tools.${tool.id}.description`)}</p>
        </div>
      </div>
      <div className="mt-auto">
        <Chip tone={STATUS_TONE[tool.status]}>{t(`status.${tool.status}`)}</Chip>
      </div>
    </Card>
  );
}
