import { Cpu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Alert, EmptyState } from '@/components/ui';
import type { Course } from '@/types/content';
import type { HardwarePlatform } from '@/types/hardware';
import { HardwareCard } from './HardwareCard';
import { PageSection } from './PageSection';
import { coursesForPlatform } from './robotics-model';

export interface HardwareListProps {
  /** Active platforms in order; null when the read failed. */
  platforms: readonly HardwarePlatform[] | null;
  /** The robotics courses, to say which ones each platform fits. */
  courses: readonly Course[];
}

export function HardwareList({ platforms, courses }: HardwareListProps) {
  const t = useTranslations('robotics');
  return (
    <PageSection
      id="robotics-hardware"
      anchor
      title={t('hardware.title')}
      description={t('hardware.description')}
    >
      {platforms === null ? (
        <Alert tone="warning" live="off">
          {t('sectionError')}
        </Alert>
      ) : platforms.length === 0 ? (
        <EmptyState
          icon={<Cpu />}
          title={t('hardware.empty.title')}
          description={t('hardware.empty.description')}
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {platforms.map((platform) => (
            <HardwareCard
              key={platform.id}
              platform={platform}
              fits={coursesForPlatform(platform, courses)}
            />
          ))}
        </ul>
      )}
    </PageSection>
  );
}
