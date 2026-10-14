import 'server-only';
import type { TutorContext } from '@/lib/ai/types';
import type { Actor } from '@/lib/auth/actor';
import { getCourse, getLesson } from '@/lib/data/courses';
import { getPublishedPathway } from '@/lib/data/pathways';
import { listRecentAttemptsForUser } from '@/lib/data/quizzes';
import { pickTranslation } from '@/lib/i18n/content';
import { AI_LIMITS, CONTENT_LIMITS } from '@/lib/limits';
import type { TutorRequest } from '@/types/ai';
import type { Locale, Localized } from '@/types/common';
import type { Lesson } from '@/types/content';
import { requireCourseAccess, requireLearnerSession } from './internal-common';

// What the tutor is told about the learner's situation (ARCHITECTURE.md 8.3): age band,
// language, where they are in the curriculum and how their last quizzes went. No name, uid,
// email, school, class, quiz question or answer key. About six document reads per message
// (3.7); blocks and quizzes are never read, thanks to lessons.tutorExcerpt and the quizTitle
// snapshot on attempts.

function blank(value: string | null | undefined): boolean {
  return value === undefined || value === null || value.trim() === '';
}

/** `lessons.tutorExcerpt` for a locale: the locale's text, else the default's, else any. */
function excerptFor(
  excerpt: Localized<string>,
  locale: Locale,
  defaultLocale: Locale,
): string | null {
  const candidates = [locale, defaultLocale, 'en', ...Object.keys(excerpt)];
  const found = candidates.map((key) => excerpt[key]).find((text) => !blank(text));
  return found === undefined ? null : found.slice(0, CONTENT_LIMITS.tutorExcerptChars);
}

const EMPTY_REFERENCE: TutorContext['reference'] = {
  pathwayTitle: null,
  courseTitle: null,
  lessonTitle: null,
  lessonSummary: null,
  lessonExcerpt: null,
};

/**
 * Builds the tutor's context for one message. The caller (the tutor route) has checked and
 * counted the learner's AI usage, which also applies the school switch. A course the actor
 * may not open answers not found, as everywhere else.
 */
export async function buildTutorContext(
  actor: Actor,
  request: Pick<TutorRequest, 'mode' | 'courseId' | 'lessonId' | 'locale'>,
): Promise<TutorContext> {
  const session = requireLearnerSession(actor, 'tutor.context');
  const { locale } = request;

  let reference = EMPTY_REFERENCE;
  let lesson: Lesson | null = null;
  if (request.courseId !== null) {
    const course = await getCourse(actor, request.courseId);
    await requireCourseAccess(actor, course);
    const [pathway, foundLesson] = await Promise.all([
      course.pathwayId === null ? null : getPublishedPathway(course.pathwayId),
      request.lessonId === null ? null : getLesson(actor, course.id, request.lessonId),
    ]);
    lesson = foundLesson;
    const courseText = pickTranslation(course.translations, locale, course.defaultLocale);
    const lessonText =
      lesson === null ? null : pickTranslation(lesson.translations, locale, lesson.defaultLocale);
    reference = {
      pathwayTitle:
        pathway === null
          ? null
          : pickTranslation(pathway.translations, locale, pathway.defaultLocale).title,
      courseTitle: courseText.title,
      lessonTitle: lessonText?.title ?? null,
      lessonSummary: blank(lessonText?.summary) ? null : (lessonText?.summary ?? null),
      // Teacher-made text is not quoted to the model; the tutor works from the titles (8.3).
      lessonExcerpt:
        lesson === null || !course.isOfficial
          ? null
          : excerptFor(lesson.tutorExcerpt, locale, lesson.defaultLocale),
    };
  }

  const attempts = await listRecentAttemptsForUser(actor, session.uid, {
    limit: AI_LIMITS.tutorRecentQuizResults,
  });

  return {
    mode: request.mode,
    ageBand: session.ageBand,
    locale,
    hasGradedWork: lesson !== null && (lesson.quizIds.length > 0 || lesson.projectIds.length > 0),
    reference,
    recentQuizResults: attempts.slice(0, AI_LIMITS.tutorRecentQuizResults).map((attempt) => ({
      quizTitle: pickTranslation(attempt.quizTitle, locale, locale).title ?? '',
      scorePercent: attempt.scorePercent,
      passed: attempt.passed,
    })),
  };
}
