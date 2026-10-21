import { Radar, Route, ScanEye, type LucideIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Alert, Card, CardTitle } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import type { Course } from '@/types/content';
import { PageSection } from './PageSection';
import { coursesByTheme, ROBOTICS_THEMES, type RoboticsTheme } from './robotics-model';

const ICONS: Record<RoboticsTheme, LucideIcon> = {
  vision: ScanEye,
  sensors: Radar,
  autonomous: Route,
};

export interface RoboticsThemesProps {
  /** The student robotics courses; null when the read failed. */
  courses: readonly Course[] | null;
}

/** The three project themes (vision, sensors, autonomous), each with the courses that build one. */
export function RoboticsThemes({ courses }: RoboticsThemesProps) {
  const t = useTranslations('robotics');
  const locale = useLocale();
  const groups = courses === null ? null : coursesByTheme(courses);

  return (
    <PageSection
      id="robotics-themes"
      title={t('themes.title')}
      description={t('themes.description')}
    >
      {groups === null ? (
        <Alert tone="warning" live="off">
          {t('sectionError')}
        </Alert>
      ) : (
        <ul className="grid gap-4 md:grid-cols-3">
          {ROBOTICS_THEMES.map((theme) => {
            const Icon = ICONS[theme];
            const list = groups[theme];
            return (
              <Card key={theme} as="li" className="gap-3 p-5">
                <span
                  aria-hidden="true"
                  className="flex size-11 items-center justify-center rounded-full bg-brand-100 text-brand-700"
                >
                  <Icon className="size-5" />
                </span>
                <CardTitle as="h3">{t(`themes.${theme}.title`)}</CardTitle>
                <p className="text-sm text-ink-muted">{t(`themes.${theme}.description`)}</p>
                <p className="text-sm font-semibold text-ink">
                  {t('themes.courseCount', { count: list.length })}
                </p>
                {list.length > 0 ? (
                  <ul className="flex flex-col gap-1.5">
                    {list.map((course) => (
                      <li key={course.id} className="min-w-0">
                        <Link
                          href={`/student/learn/courses/${course.id}`}
                          className="rounded-sm text-sm font-semibold break-words text-brand-700 underline-offset-2 hover:text-brand-800 hover:underline"
                        >
                          {pickTranslation(course.translations, locale, course.defaultLocale).title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-muted">{t('themes.empty')}</p>
                )}
              </Card>
            );
          })}
        </ul>
      )}
    </PageSection>
  );
}
