// The demo learners' progress of ARCHITECTURE.md 11.6, made through the services as the
// learners and their teacher would make it: lessons started and completed, quizzes failed and
// passed, one project submitted and awaiting review, one reviewed and certified. Every step is
// skipped when its result already exists, so the seed can run again.

import { SYSTEM_ACTOR } from '@/lib/auth/actor';
import { getCertificate } from '@/lib/data/certificates';
import { getEnrollment } from '@/lib/data/enrollments';
import { getQuizWithKey } from '@/lib/data/quizzes';
import { getLatestSubmission } from '@/lib/data/submissions';
import { getUser } from '@/lib/data/users';
import { submitQuizAttempt } from '@/lib/services/assessment';
import { completeLesson, enrollSelf, saveResponse, startLesson } from '@/lib/services/learning';
import { generateAiReview, reviewSubmission, submitWork } from '@/lib/services/project-flow';
import { awardManualBadge } from '@/lib/services/recognition';
import type { Locale } from '@/types/common';
import type { Certificate } from '@/types/gamification';
import type { Submission } from '@/types/project';
import type { QuizAnswer, QuizAnswerKey, QuizQuestion } from '@/types/quiz';
import type { Session } from '@/types/user';
import { sessionOf } from '../lib/admin';
import type { SeedCourse, SeedLesson } from './types';

export interface DemoLearnerUids {
  lea: string;
  omar: string;
  maya: string;
  /** The individual learner, in no class. */
  student: string;
  teacher: string;
}

export interface DemoProgressSummary {
  certificate: Certificate | null;
  awaitingReview: Submission | null;
}

const MANUAL_BADGE_ID = 'responsible-ai-champion';

const REFLECTION: Record<Locale, string> = {
  en: 'Today I noticed AI when my tablet suggested a video and when the photo app found my friend in a picture. I think it learned that from many examples, and I will check its answers because it can be wrong.',
  fr: "Aujourd'hui, j'ai remarqué l'IA quand ma tablette m'a proposé une vidéo et quand l'application photo a retrouvé mon ami sur une image. Je pense qu'elle a appris cela avec beaucoup d'exemples, et je vérifierai ses réponses parce qu'elle peut se tromper.",
};

const STORY: Record<Locale, { title: string; description: string; text: string }> = {
  en: {
    title: 'Robo and the lost hat',
    description: 'A short story planned by me and polished with the AI tutor.',
    text: 'Robo was a small robot who loved its red hat. One windy morning the hat flew away over the garden wall. Robo rolled after it, but the wall was too high. A sparrow saw Robo looking sad and asked what was wrong. Robo explained, and the sparrow flew over the wall and found the hat on a sunflower. The sparrow could not lift it, so Robo had an idea: it stretched its long arm over the wall while the sparrow pushed. The hat landed on Robo again, a little dusty but safe. Robo thanked the sparrow and they shared a seed for breakfast. The AI tutor helped me find the word "sparrow" and check that my story had a hero, a problem, a solution and an ending.',
  },
  fr: {
    title: 'Robo et le chapeau perdu',
    description: 'Une histoire courte préparée par moi et améliorée avec le tuteur IA.',
    text: "Robo était un petit robot qui adorait son chapeau rouge. Un matin de grand vent, le chapeau s'est envolé par-dessus le mur du jardin. Robo a roulé derrière lui, mais le mur était trop haut. Un moineau a vu Robo tout triste et lui a demandé ce qui n'allait pas. Robo a expliqué, et le moineau a volé par-dessus le mur et a trouvé le chapeau sur un tournesol. Le moineau ne pouvait pas le soulever, alors Robo a eu une idée : il a tendu son long bras par-dessus le mur pendant que le moineau poussait. Le chapeau est retombé sur Robo, un peu poussiéreux mais sauvé. Robo a remercié le moineau et ils ont partagé une graine pour le petit-déjeuner. Le tuteur IA m'a aidé à trouver le mot « moineau » et à vérifier que mon histoire avait un héros, un problème, une solution et une fin.",
  },
};

const TEACHER_FEEDBACK =
  'A complete story with a clear hero, problem and solution, and you said how the AI helped you. Next time, try adding one line of dialogue.';

const MANUAL_BADGE_NOTE = 'Checked every AI answer and credited the tutor in the story.';

type QuizPlan = 'pass' | 'fail' | 'fail-then-pass';

async function learnerSession(uid: string): Promise<Session> {
  return sessionOf(await getUser(SYSTEM_ACTOR, uid));
}

function lessonsOf(course: SeedCourse): SeedLesson[] {
  return course.modules.flatMap((module) => module.lessons);
}

// --- Quizzes -----------------------------------------------------------------------------------

// A correct answer from the key, or an answer that scores nothing: the first option the key
// does not accept (none at all when every option is right), or a word nobody accepts.
function answerFor(
  question: QuizQuestion,
  key: QuizAnswerKey['answers'][string] | undefined,
  correct: boolean,
  locale: Locale,
  defaultLocale: Locale,
): QuizAnswer {
  if (question.type === 'short_answer') {
    const accepted = key?.acceptedAnswers ?? {};
    const text = correct ? (accepted[locale]?.[0] ?? accepted[defaultLocale]?.[0] ?? '') : 'banana';
    return { selectedOptionIds: [], text };
  }
  const right = key?.correctOptionIds ?? [];
  if (correct) return { selectedOptionIds: right, text: null };
  const wrong = question.options.find((option) => !right.includes(option.id));
  return { selectedOptionIds: wrong === undefined ? [] : [wrong.id], text: null };
}

async function attemptQuiz(
  session: Session,
  courseId: string,
  quizId: string,
  correct: boolean,
): Promise<void> {
  const { quiz, key } = await getQuizWithKey(SYSTEM_ACTOR, courseId, quizId);
  const answers = Object.fromEntries(
    quiz.questions.map((question) => [
      question.id,
      answerFor(
        question,
        Object.hasOwn(key.answers, question.id) ? key.answers[question.id] : undefined,
        correct,
        session.locale,
        quiz.defaultLocale,
      ),
    ]),
  );
  const result = await submitQuizAttempt(session, {
    courseId,
    quizId,
    answers,
    locale: session.locale,
  });
  console.log(
    `   ${session.displayName}: quiz ${quizId} attempt ${result.attempt.attemptNumber}, ${result.attempt.scorePercent}% (${result.attempt.passed ? 'passed' : 'failed'})`,
  );
}

async function ensureQuiz(
  session: Session,
  courseId: string,
  quizId: string,
  plan: QuizPlan,
): Promise<void> {
  const summaryOf = async () => {
    const enrollment = await getEnrollment(session, session.uid, courseId);
    const summary = enrollment?.quizSummary ?? {};
    return Object.hasOwn(summary, quizId) ? summary[quizId]! : { attempts: 0, passed: false };
  };
  let state = await summaryOf();
  if (plan !== 'pass' && state.attempts === 0) {
    await attemptQuiz(session, courseId, quizId, false);
    state = await summaryOf();
  }
  if (plan !== 'fail' && !state.passed) await attemptQuiz(session, courseId, quizId, true);
}

// --- Lessons -----------------------------------------------------------------------------------

/** Saves a response to every reflection and code activity of the lesson. */
async function respondToBlocks(session: Session, courseId: string, lesson: SeedLesson) {
  for (const block of lesson.blocks) {
    if (block.type === 'reflection') {
      await saveResponse(session, courseId, lesson.id, block.id, REFLECTION[session.locale]);
    } else if (block.type === 'code_activity') {
      const code = block.data.starterCode.replace('...', 'the photo app on my tablet');
      await saveResponse(session, courseId, lesson.id, block.id, code);
    }
  }
}

async function ensureSubmission(
  session: Session,
  courseId: string,
  projectId: string,
): Promise<Submission> {
  const latest = await getLatestSubmission(session, session.uid, { courseId, projectId });
  if (latest !== null) return latest;
  const story = STORY[session.locale];
  const submission = await submitWork(session, {
    target: { context: 'project', courseId, projectId },
    title: story.title,
    description: story.description,
    type: 'text',
    content: { text: story.text, linkUrl: null, code: null, codeLanguage: null },
    fileIds: [],
    previousSubmissionId: null,
    locale: session.locale,
  });
  // What the submit action does after its response: the mock provider's suggestion.
  await generateAiReview(submission.id);
  console.log(`   ${session.displayName}: submitted "${story.title}" for project ${projectId}`);
  return submission;
}

/** Starts the lesson and does everything its blocks ask for, without completing it. */
async function workThrough(
  session: Session,
  courseId: string,
  lesson: SeedLesson,
  quizPlan: QuizPlan,
): Promise<void> {
  await startLesson(session, courseId, lesson.id);
  await respondToBlocks(session, courseId, lesson);
  for (const block of lesson.blocks) {
    if (block.type === 'quiz') await ensureQuiz(session, courseId, block.data.quizId, quizPlan);
    if (block.type === 'project') await ensureSubmission(session, courseId, block.data.projectId);
  }
}

async function complete(session: Session, courseId: string, lesson: SeedLesson): Promise<void> {
  const result = await completeLesson(session, courseId, lesson.id);
  if (!result.completed) {
    throw new Error(
      `${session.displayName} cannot complete lesson ${lesson.id}: ${JSON.stringify(result.missing)}`,
    );
  }
  const xp = result.gamification?.xpAwarded ?? 0;
  console.log(
    `   ${session.displayName}: completed lesson ${lesson.id}${xp > 0 ? ` (+${xp} XP)` : ''}`,
  );
}

async function learnLessons(
  session: Session,
  courseId: string,
  lessons: readonly SeedLesson[],
  quizPlan: QuizPlan,
): Promise<void> {
  for (const lesson of lessons) {
    await workThrough(session, courseId, lesson, quizPlan);
    await complete(session, courseId, lesson);
  }
}

// --- The plan ----------------------------------------------------------------------------------

/**
 * Lea finishes the course and gets its certificate once the teacher accepts her project; Omar
 * is half-way through with a project awaiting review; Maya has just started; the individual
 * learner studies alone, with one failed quiz. The learners of the class are enrolled by the
 * class assignment; the individual learner enrols by themselves.
 */
export async function seedDemoProgress(
  course: SeedCourse,
  uids: DemoLearnerUids,
): Promise<DemoProgressSummary> {
  const courseId = course.id;
  const lessons = lessonsOf(course);
  const [first, second, third] = lessons;
  if (first === undefined || second === undefined || third === undefined) {
    throw new Error(`${courseId} has fewer than three lessons.`);
  }
  const projectId = course.projects[0]?.id ?? null;

  const lea = await learnerSession(uids.lea);
  await learnLessons(lea, courseId, lessons, 'pass');

  const omar = await learnerSession(uids.omar);
  await learnLessons(omar, courseId, [first, second], 'fail-then-pass');
  await startLesson(omar, courseId, third.id);
  await respondToBlocks(omar, courseId, third);
  const awaitingReview =
    projectId === null ? null : await ensureSubmission(omar, courseId, projectId);

  const maya = await learnerSession(uids.maya);
  await startLesson(maya, courseId, first.id);
  await respondToBlocks(maya, courseId, first);

  const student = await learnerSession(uids.student);
  await enrollSelf(student, courseId);
  await learnLessons(student, courseId, [first], 'pass');
  await workThrough(student, courseId, second, 'fail');

  // The teacher accepts Lea's project, which issues her certificate (9.5), and awards her the
  // manual badge.
  const teacher = await learnerSession(uids.teacher);
  const leaSubmission =
    projectId === null
      ? null
      : await getLatestSubmission(teacher, uids.lea, { courseId, projectId });
  if (leaSubmission?.status === 'submitted') {
    await reviewSubmission(teacher, {
      submissionId: leaSubmission.id,
      decision: 'modify',
      criteria: { creativity: 90, technicalQuality: 85, understanding: 95, responsibleAi: 100 },
      feedback: TEACHER_FEEDBACK,
    });
    console.log(`   ${teacher.displayName}: accepted ${lea.displayName}'s project`);
  }
  const badge = await awardManualBadge(teacher, {
    studentUid: uids.lea,
    badgeId: MANUAL_BADGE_ID,
    note: MANUAL_BADGE_NOTE,
  });
  if (badge.awarded) console.log(`   ${teacher.displayName}: awarded badge ${MANUAL_BADGE_ID}`);

  const enrollment = await getEnrollment(SYSTEM_ACTOR, uids.lea, courseId);
  const certificate =
    enrollment?.certificateId == null
      ? null
      : await getCertificate(SYSTEM_ACTOR, enrollment.certificateId);
  if (certificate === null) {
    console.warn(`   WARNING: ${lea.displayName} has no certificate for ${courseId}.`);
  }
  return { certificate, awaitingReview };
}
