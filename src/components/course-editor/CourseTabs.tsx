'use client';

import { createContext, use, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { flushSync } from 'react-dom';
import { Tabs } from '@/components/ui';
import type { CourseTab } from './paths';

// The course page's three sections (6.2.1). All panels stay mounted, so a dirty details form
// survives a tab switch. The readiness list switches tabs without navigating.

interface TabState {
  tab: CourseTab;
  setTab(tab: CourseTab): void;
}

const CourseTabContext = createContext<TabState | null>(null);

export function CourseTabProvider({
  initialTab,
  children,
}: {
  /** From the URL's `?tab=`. */
  initialTab: CourseTab;
  children: ReactNode;
}) {
  const [tab, setTab] = useState(initialTab);
  const [seen, setSeen] = useState(initialTab);
  // A navigation to the same page with another `?tab=` keeps this component mounted.
  if (seen !== initialTab) {
    setSeen(initialTab);
    setTab(initialTab);
  }
  return <CourseTabContext value={{ tab, setTab }}>{children}</CourseTabContext>;
}

export function useCourseTab(): { tab: CourseTab; show(tab: CourseTab, anchorId?: string): void } {
  const state = use(CourseTabContext);
  return {
    tab: state?.tab ?? 'outline',
    show(tab, anchorId) {
      if (state !== null) flushSync(() => state.setTab(tab));
      if (anchorId !== undefined) document.getElementById(anchorId)?.focus();
    },
  };
}

export function CourseEditorTabs({
  outline,
  details,
  content,
}: {
  outline: ReactNode;
  details: ReactNode;
  content: ReactNode;
}) {
  const t = useTranslations('courseEditor');
  const state = use(CourseTabContext);
  return (
    <Tabs
      aria-label={t('tabs.label')}
      value={state?.tab}
      onValueChange={(value) => state?.setTab(value as CourseTab)}
      tabs={[
        { value: 'outline', label: t('tabs.outline'), content: outline },
        { value: 'details', label: t('tabs.details'), content: details },
        { value: 'content', label: t('tabs.content'), content: content },
      ]}
    />
  );
}
