import { Bot, CircleCheck, CircuitBoard, Cpu, Laptop, type LucideIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { MediaImage } from '@/components/domain';
import { Card, CardTitle, Chip } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import type { Course } from '@/types/content';
import type { HardwareKind, HardwarePlatform } from '@/types/hardware';

const KIND_ICONS: Record<HardwareKind, LucideIcon> = {
  robot: Bot,
  microcontroller: Cpu,
  sensor_kit: CircuitBoard,
  simulator: Laptop,
};

export interface HardwareCardProps {
  platform: HardwarePlatform;
  /** The courses whose required capabilities this platform covers. */
  fits: readonly Course[];
}

/** One supported platform: what it can do, how it is programmed and connected, what it fits. */
export function HardwareCard({ platform, fits }: HardwareCardProps) {
  const t = useTranslations('robotics');
  const locale = useLocale();
  const text = pickTranslation(platform.translations, locale, platform.defaultLocale);
  const list = (items: readonly string[]) =>
    new Intl.ListFormat(locale, { type: 'conjunction' }).format(items);
  const KindIcon = KIND_ICONS[platform.kind];
  const courseTitles = fits.map(
    (course) => pickTranslation(course.translations, locale, course.defaultLocale).title,
  );

  return (
    <Card as="li" className="h-full min-w-0">
      {platform.image && (
        <MediaImage
          media={platform.image}
          alt=""
          frame="16:9"
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="rounded-t-card"
        />
      )}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          {!platform.image && (
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700"
            >
              <KindIcon className="size-5" />
            </span>
          )}
          <div className="flex min-w-0 flex-col items-start gap-1.5">
            <CardTitle as="h3" className="break-words">
              {text.name}
            </CardTitle>
            <Chip tone="accent">{t(`hardware.kinds.${platform.kind}`)}</Chip>
            {platform.vendor && (
              <p className="text-sm text-ink-muted">{t('vendor', { vendor: platform.vendor })}</p>
            )}
          </div>
        </div>
        {text.description && <p className="text-sm text-ink-muted">{text.description}</p>}
        {/* Label over value at every width: in a third of the page a label column leaves the
            capability chips one per line. */}
        <dl className="flex flex-col gap-3 text-sm">
          {platform.capabilities.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <dt className="font-semibold text-ink">{t('hardware.capabilities')}</dt>
              <dd className="flex min-w-0 flex-wrap gap-1.5">
                {platform.capabilities.map((capability) => (
                  <Chip key={capability} size="sm">
                    {t(`capabilities.${capability}`)}
                  </Chip>
                ))}
              </dd>
            </div>
          )}
          {platform.programmingModes.length > 0 && (
            <div className="flex flex-col gap-0.5">
              <dt className="font-semibold text-ink">{t('hardware.programming')}</dt>
              <dd className="min-w-0 text-ink-muted">
                {list(platform.programmingModes.map((mode) => t(`hardware.modes.${mode}`)))}
              </dd>
            </div>
          )}
          {platform.connectivity.length > 0 && (
            <div className="flex flex-col gap-0.5">
              <dt className="font-semibold text-ink">{t('hardware.connectivity')}</dt>
              <dd className="min-w-0 text-ink-muted">
                {list(platform.connectivity.map((link) => t(`hardware.links.${link}`)))}
              </dd>
            </div>
          )}
        </dl>
        {courseTitles.length > 0 && (
          <p className="mt-auto flex items-start gap-2 text-sm font-medium text-ink">
            <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
            <span className="min-w-0 break-words">
              {t('hardware.fits', { courses: list(courseTitles) })}
            </span>
          </p>
        )}
      </div>
    </Card>
  );
}
