import { ChartColumn, KeyRound, Mail, ShieldCheck, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LinkButton } from '@/components/ui';
import { FeatureTile, Section } from './Section';

export interface ForSchoolsProps {
  /** NEXT_PUBLIC_CONTACT_EMAIL; without it the contact button is not shown. */
  contactEmail: string | null;
}

const POINTS = [
  { key: 'licences', Icon: KeyRound },
  { key: 'classes', Icon: Users },
  { key: 'analytics', Icon: ChartColumn },
  { key: 'privacy', Icon: ShieldCheck },
] as const;

/** "For Schools": the target of the third entrance. Schools are onboarded by the platform team. */
export function ForSchools({ contactEmail }: ForSchoolsProps) {
  const t = useTranslations('home');
  return (
    <Section
      id="schools"
      tone="muted"
      layout="split"
      eyebrow={t('schools.eyebrow')}
      title={t('schools.title')}
      description={t('schools.description')}
      actions={
        contactEmail ? (
          <LinkButton href={`mailto:${contactEmail}`} size="lg">
            <Mail aria-hidden="true" />
            {t('schools.cta')}
          </LinkButton>
        ) : (
          <p className="text-sm font-medium text-ink">{t('schools.noContact')}</p>
        )
      }
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {POINTS.map(({ key, Icon }) => (
          <li key={key} className="min-w-0">
            <FeatureTile
              icon={<Icon />}
              title={t(`schools.points.${key}.title`)}
              description={t(`schools.points.${key}.description`)}
              className="h-full"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
