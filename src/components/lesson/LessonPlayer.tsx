import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { TutorPanel } from '@/components/ai/TutorPanel';
import { LessonNavigation } from '@/components/domain';
import { LessonShell } from '@/components/layout';
import { requireSession } from '@/lib/auth/session';
import { isAppError } from '@/lib/errors';
import { pickTranslation } from '@/lib/i18n/content';
import { groupBlocksByStage } from '@/lib/learning/stages';
// The one component that loads its own data (ARCHITECTURE.md 7.1, 7.6): three route files
// render it with fixed props.
import { getLessonPlayerData } from '@/lib/services/learning';
import type { LessonPlayerData } from '@/types/learning';
import { LessonAccessState } from './LessonAccessState';
import { LessonChecklist } from './LessonChecklist';
import { LessonCompleteControl } from './LessonCompleteControl';
import { LessonContent } from './LessonContent';
import { LessonFooter } from './LessonFooter';
import { LessonPreviewNotice } from './LessonPreviewNotice';
import { LessonStartBeacon } from './LessonStartBeacon';
import { LessonTopBar } from './LessonTopBar';
import {
  buildChecklist,
  canEnrollFromPreview,
  lessonHrefs,
  lessonPosition,
  stepperStages,
  toRuntime,
  visibleBlocks,
} from './lesson-model';

/**
 * The player's data, read once per request: the route's generateMetadata and the player share
 * it (the outline read of 3.7 is not repeated, and a repair of pending effects runs once).
 */
const loadPlayerData = cache(async (courseId: string, lessonId: string) =>
  // Cached: the route already ran requireRole.
  getLessonPlayerData(await requireSession(), courseId, lessonId),
);

/**
 * The document title of a lesson route, for its generateMetadata after its requireRole: the
 * lesson's title, the not-found page for an unknown course or lesson, and the generic "Lesson"
 * while the player shows an access state or an error.
 */
export async function lessonMetadata(courseId: string, lessonId: string): Promise<Metadata> {
  try {
    const { lesson } = await loadPlayerData(courseId, lessonId);
    const text = pickTranslation(lesson.translations, await getLocale(), lesson.defaultLocale);
    return { title: text.title };
  } catch (error) {
    if (isAppError(error) && error.code === 'not_found') notFound();
    // The player renders the access state, or error.tsx the fault, from the same cached read.
    const t = await getTranslations('nav');
    return { title: t('pages.lesson') };
  }
}

export interface LessonPlayerProps {
  courseId: string;
  lessonId: string;
  /** Locale-less path of the course's lessons, without the lesson id. */
  lessonBasePath: string;
  exitHref: string;
}

/**
 * The lesson player (ARCHITECTURE.md 7.6) for the student, teacher and preview routes. The
 * server decides `readOnly` and `tutorEnabled`; they are used here exactly as returned.
 */
export async function LessonPlayer({
  courseId,
  lessonId,
  lessonBasePath,
  exitHref,
}: LessonPlayerProps) {
  // Cached: the route already ran requireRole.
  const session = await requireSession();
  let data: LessonPlayerData;
  try {
    data = await loadPlayerData(courseId, lessonId);
  } catch (error) {
    // Real faults go to the route's error.tsx, which never sees an AppError's code.
    if (!isAppError(error)) throw error;
    if (error.code === 'not_found') notFound();
    if (error.code === 'forbidden' || error.code === 'license_required') {
      return <LessonAccessState reason={error.code} exitHref={exitHref} />;
    }
    throw error;
  }

  const locale = await getLocale();
  const { course, lesson, enrollment, readOnly, tutorEnabled } = data;
  const completed = data.progress?.status === 'completed';
  const courseText = pickTranslation(course.translations, locale, course.defaultLocale);
  const lessonText = pickTranslation(lesson.translations, locale, lesson.defaultLocale);

  const shown = visibleBlocks(data.blocks, tutorEnabled);
  const groups = groupBlocksByStage(shown);
  const stages = stepperStages(shown);
  const checklist = readOnly ? [] : buildChecklist(data, locale);
  const missingCount = checklist.filter((item) => !item.done).length;
  const canEnroll =
    readOnly && enrollment === null && canEnrollFromPreview(session.role, course.audience);
  const { previousHref, nextHref } = lessonHrefs(
    lessonBasePath,
    data.previousLessonId,
    data.nextLessonId,
  );
  const position = lessonPosition(data.lessons, lesson.id);

  return (
    <LessonShell
      top={
        <LessonTopBar
          courseTitle={courseText.title}
          progressPercent={readOnly ? null : (enrollment?.progressPercent ?? 0)}
          stages={stages}
          lessonCompleted={completed}
          exitHref={exitHref}
          preview={readOnly}
        />
      }
      nav={
        <LessonNavigation
          modules={data.modules}
          lessons={data.lessons}
          currentLessonId={lesson.id}
          completedLessonIds={enrollment?.completedLessonIds ?? []}
          lessonBasePath={lessonBasePath}
        />
      }
      aside={
        tutorEnabled ? (
          <TutorPanel courseId={course.id} lessonId={lesson.id} variant="panel" />
        ) : null
      }
      footer={
        <LessonFooter
          previousHref={previousHref}
          nextHref={nextHref}
          control={
            readOnly ? null : (
              <LessonCompleteControl
                key={`${course.id}/${lesson.id}`}
                courseId={course.id}
                lessonId={lesson.id}
                completed={completed}
                missingCount={missingCount}
                nextLessonHref={nextHref}
                courseHref={exitHref}
                courseCompletedBefore={enrollment?.status === 'completed'}
              />
            )
          }
        />
      }
    >
      {!readOnly && !completed && (
        <LessonStartBeacon
          key={`${course.id}/${lesson.id}`}
          courseId={course.id}
          lessonId={lesson.id}
        />
      )}
      <LessonContent
        title={lessonText.title}
        summary={lessonText.summary}
        position={position.current}
        total={position.total}
        estimatedMinutes={lesson.estimatedMinutes}
        xpReward={lesson.xpReward}
        groups={groups}
        stepCount={stages.length}
        runtime={toRuntime(data)}
        notice={
          readOnly ? <LessonPreviewNotice canEnroll={canEnroll} courseHref={exitHref} /> : null
        }
        earn={
          <LessonChecklist
            items={checklist}
            completed={completed}
            readOnly={readOnly}
            xpReward={lesson.xpReward}
          />
        }
      />
    </LessonShell>
  );
}
