import { ArrowRight, Bot, Camera, Cpu, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LinkButton } from '@/components/ui';
import type { Pathway } from '@/types/content';
import { FeatureTile, Section } from './Section';

export interface RoboticsSectionProps {
  /** The published AI Robotics pathway, when there is one, for the call to action. */
  pathway: Pathway | null;
}

const POINTS = [
  { key: 'courses', Icon: Bot },
  { key: 'vision', Icon: Camera },
  { key: 'challenges', Icon: Trophy },
  { key: 'hardware', Icon: Cpu },
] as const;

/** "AI + Robotics": the one dark section, so robotics reads as a main pathway. */
export function RoboticsSection({ pathway }: RoboticsSectionProps) {
  const t = useTranslations('home');
  return (
    <Section
      id="robotics"
      tone="dark"
      layout="split"
      eyebrow={t('robotics.eyebrow')}
      title={t('robotics.title')}
      description={t('robotics.description')}
      actions={
        <LinkButton href={pathway ? `/pathways/${pathway.id}` : '/pathways'} size="lg">
          {t('robotics.cta')}
          <ArrowRight aria-hidden="true" className="rtl:-scale-x-100" />
        </LinkButton>
      }
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {POINTS.map(({ key, Icon }) => (
          <li key={key} className="min-w-0">
            <FeatureTile
              tone="dark"
              icon={<Icon />}
              title={t(`robotics.points.${key}.title`)}
              description={t(`robotics.points.${key}.description`)}
              className="h-full"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
