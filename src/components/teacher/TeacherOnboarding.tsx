import { BookOpen, GraduationCap, School, SquarePen } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { CreateClassButton } from '@/components/classes/CreateClassButton';
import { Card, EmptyState } from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';
import { coursesPath, TEACHER_PATHS } from './paths';

export interface TeacherOnboardingProps {
  schoolless: boolean;
}

function NextStep({
  icon,
  title,
  description,
  href,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Card as="article" interactive className="h-full gap-3 p-5">
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-control bg-brand-100 text-brand-700 [&>svg]:size-5"
      >
        {icon}
      </span>
      <h3 className="text-base leading-snug font-semibold text-ink">
        <Link href={href} className="rounded-sm after:absolute after:inset-0 after:rounded-card">
          {title}
        </Link>
      </h3>
      <p className="text-sm text-ink-muted">{description}</p>
    </Card>
  );
}

/** The dashboard of a teacher without any class: create one, or start with the courses. */
export function TeacherOnboarding({ schoolless }: TeacherOnboardingProps) {
  const t = useTranslations('teacher');
  return (
    <div className="flex flex-col gap-8">
      <EmptyState
        icon={<School />}
        title={t('dashboard.onboarding.title')}
        titleAs="h2"
        description={t('dashboard.onboarding.description')}
        action={
          <CreateClassButton
            schoolless={schoolless}
            classHrefBase={TEACHER_PATHS.classes}
            size="lg"
          />
        }
      />
      <section aria-labelledby="onboarding-next-title" className="flex flex-col gap-4">
        <h2 id="onboarding-next-title" className="text-xl font-bold text-ink">
          {t('dashboard.onboarding.nextTitle')}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <NextStep
            icon={<BookOpen />}
            title={t('dashboard.onboarding.catalog.title')}
            description={t('dashboard.onboarding.catalog.description')}
            href={coursesPath()}
          />
          <NextStep
            icon={<GraduationCap />}
            title={t('dashboard.onboarding.academy.title')}
            description={t('dashboard.onboarding.academy.description')}
            href={coursesPath('academy')}
          />
          <NextStep
            icon={<SquarePen />}
            title={t('dashboard.onboarding.create.title')}
            description={t('dashboard.onboarding.create.description')}
            href={TEACHER_PATHS.create}
          />
        </div>
      </section>
    </div>
  );
}
