'use client';

import { useEffect, useRef } from 'react';
import { startLessonAction } from '@/actions/learning';

export interface LessonStartBeaconProps {
  courseId: string;
  lessonId: string;
}

/**
 * Tells the server once per lesson view that the learner opened the lesson: the progress
 * document, and the enrollment's "continue" target. Rendered only for a learner on a lesson not
 * completed yet, so reviewing an old lesson does not pull "Continue" back to it. A client
 * effect, not a server write during render, which would also run on link prefetches. Nothing
 * on screen depends on it, so its answer is ignored and the page is not refreshed.
 */
export function LessonStartBeacon({ courseId, lessonId }: LessonStartBeaconProps) {
  // StrictMode runs effects twice in development; the ref keeps it to one call per lesson.
  const sentFor = useRef<string | null>(null);

  useEffect(() => {
    const key = `${courseId}/${lessonId}`;
    if (sentFor.current === key) return;
    sentFor.current = key;
    startLessonAction({ courseId, lessonId }).catch(() => undefined);
  }, [courseId, lessonId]);

  return null;
}
