'use client';

import { CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';
import type { CourseStatus } from '@/types/content';
import { useCourseTab } from './CourseTabs';
import type { Readiness, ReadinessBlocker, ReadinessWarning } from './outline-model';
import {
  anchors,
  CONTENT_ANCHOR,
  COVER_ANCHOR,
  DETAILS_ANCHOR,
  editorPaths,
  type CourseTab,
  type EditorMode,
} from './paths';

export interface ReadinessTitles {
  modules: Record<string, string>;
  lessons: Record<string, string>;
}

interface Item {
  key: string;
  tone: 'danger' | 'warning';
  text: string;
  action:
    | { kind: 'tab'; tab: CourseTab; anchor?: string; label: string }
    | { kind: 'link'; href: string; label: string };
}

/** What stops the course from being published, then what is worth checking (6.2.2). */
export function ReadinessList({
  readiness,
  titles,
  mode,
  courseId,
  status,
}: {
  readiness: Readiness;
  titles: ReadinessTitles;
  mode: EditorMode;
  courseId: string;
  status: CourseStatus;
}) {
  const t = useTranslations('courseEditor');
  const { show } = useCourseTab();
  const paths = editorPaths(mode);

  function blockerItem(blocker: ReadinessBlocker): Item {
    switch (blocker.kind) {
      case 'no_modules':
        return {
          key: 'no-modules',
          tone: 'danger',
          text: t('readiness.noModules'),
          action: { kind: 'tab', tab: 'outline', anchor: anchors.outline, label: t('readiness.open.outline') },
        };
      case 'empty_module':
        return {
          key: `module-${blocker.moduleId}`,
          tone: 'danger',
          text: t('readiness.emptyModule', { module: titles.modules[blocker.moduleId] ?? '' }),
          action: {
            kind: 'tab',
            tab: 'outline',
            anchor: anchors.module(blocker.moduleId),
            label: t('readiness.open.outline'),
          },
        };
      case 'empty_lesson':
        return {
          key: `lesson-${blocker.lessonId}`,
          tone: 'danger',
          text: t('readiness.emptyLesson', { lesson: titles.lessons[blocker.lessonId] ?? '' }),
          action: {
            kind: 'link',
            href: paths.lesson(courseId, blocker.lessonId),
            label: t('readiness.open.lesson'),
          },
        };
    }
  }

  function warningItems(warning: ReadinessWarning): Item[] {
    switch (warning.kind) {
      case 'untranslated': {
        const language = t(`languageNames.${warning.locale}`);
        const items: Item[] = [];
        if (warning.course) {
          items.push({
            key: `course-${warning.locale}`,
            tone: 'warning',
            text: t('readiness.untranslatedCourse', { language }),
            action: { kind: 'tab', tab: 'details', anchor: DETAILS_ANCHOR, label: t('readiness.open.details') },
          });
        }
        if (warning.modules > 0) {
          items.push({
            key: `modules-${warning.locale}`,
            tone: 'warning',
            text: t('readiness.untranslatedModules', { count: warning.modules, language }),
            action: { kind: 'tab', tab: 'outline', anchor: anchors.outline, label: t('readiness.open.outline') },
          });
        }
        if (warning.lessons > 0) {
          items.push({
            key: `lessons-${warning.locale}`,
            tone: 'warning',
            text: t('readiness.untranslatedLessons', { count: warning.lessons, language }),
            action: { kind: 'tab', tab: 'outline', anchor: anchors.outline, label: t('readiness.open.outline') },
          });
        }
        return items;
      }
      case 'unused_quizzes':
        return [
          {
            key: 'unused-quizzes',
            tone: 'warning',
            text: t('readiness.unusedQuizzes', { count: warning.count }),
            action: { kind: 'tab', tab: 'content', anchor: CONTENT_ANCHOR, label: t('readiness.open.content') },
          },
        ];
      case 'unused_projects':
        return [
          {
            key: 'unused-projects',
            tone: 'warning',
            text: t('readiness.unusedProjects', { count: warning.count }),
            action: { kind: 'tab', tab: 'content', anchor: CONTENT_ANCHOR, label: t('readiness.open.content') },
          },
        ];
      case 'no_cover':
        return [
          {
            key: 'no-cover',
            tone: 'warning',
            text: t('readiness.noCover'),
            action: { kind: 'tab', tab: 'details', anchor: COVER_ANCHOR, label: t('readiness.open.cover') },
          },
        ];
    }
  }

  const items = [
    ...readiness.blockers.map(blockerItem),
    ...readiness.warnings.flatMap(warningItems),
  ];
  const published = status === 'published';
  if (items.length === 0 && status !== 'draft') return null;

  return (
    <section
      id={anchors.readiness}
      tabIndex={-1}
      aria-labelledby={`${anchors.readiness}-title`}
      className="flex flex-col gap-3 rounded-control outline-none"
    >
      <h3 id={`${anchors.readiness}-title`} className="text-sm font-semibold text-ink">
        {published ? t('readiness.checkTitle') : t('readiness.title')}
      </h3>
      {items.length === 0 ? (
        <p className="flex items-start gap-2 text-sm text-ink">
          <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
          {t('readiness.ready')}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const Icon = item.tone === 'danger' ? CircleAlert : TriangleAlert;
            const textId = `readiness-${item.key}`;
            return (
              <li key={item.key} className="flex flex-col items-start gap-1">
                <p id={textId} className="flex min-w-0 items-start gap-2 text-sm break-words text-ink">
                  <Icon
                    aria-hidden="true"
                    className={
                      item.tone === 'danger'
                        ? 'mt-0.5 size-4 shrink-0 text-danger'
                        : 'mt-0.5 size-4 shrink-0 text-warning'
                    }
                  />
                  <span className="min-w-0">{item.text}</span>
                </p>
                {item.action.kind === 'link' ? (
                  <Link
                    href={item.action.href}
                    aria-describedby={textId}
                    className="ms-6 rounded-sm text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800"
                  >
                    {item.action.label}
                  </Link>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-describedby={textId}
                    className="ms-4"
                    onClick={() => {
                      const action = item.action;
                      if (action.kind === 'tab') show(action.tab, action.anchor);
                    }}
                  >
                    {item.action.label}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
