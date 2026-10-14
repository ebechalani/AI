import type {
  AiReview,
  Badge,
  Certificate,
  Challenge,
  Course,
  Enrollment,
  FileRecord,
  GamificationOutcome,
  Lesson,
  LessonBlock,
  LessonProgress,
  Project,
  Quiz,
  QuizAttempt,
  Role,
  School,
  SchoolClass,
  Session,
  Submission,
  UserProfile,
} from '@/types';

// Document builders for the services-*.test.ts files: every field of the 3.4 shapes with a
// plain default, overridable per test. Not a test file (no .test suffix).

export const NOW = '2026-10-02T08:00:00.000Z';

export function session(
  role: Role,
  uid: string,
  schoolId: string | null = null,
  classIds: string[] = [],
  fields: Partial<Session> = {},
): Session {
  return {
    uid,
    role,
    schoolId,
    classIds,
    displayName: `Name of ${uid}`,
    locale: 'en',
    ageBand: role === 'student' ? '11-12' : 'adult',
    avatarId: 'robot',
    verifiedEducator: false,
    ...fields,
  };
}

export function profile(fields: Partial<UserProfile> & { id: string }): UserProfile {
  return {
    role: 'student',
    schoolId: null,
    displayName: `Name of ${fields.id}`,
    username: null,
    email: `${fields.id}@example.com`,
    ageBand: '11-12',
    locale: 'en',
    avatarId: 'robot',
    status: 'active',
    classIds: [],
    consentBasis: 'self_13_plus',
    provisionedByUid: null,
    verifiedEducator: false,
    sessionsValidAfter: null,
    xpTotal: 0,
    level: 1,
    stats: {
      lessonsCompleted: 0,
      quizzesPassed: 0,
      projectsAccepted: 0,
      challengesCompleted: 0,
      coursesCompleted: 0,
      badges: 0,
      certificates: 0,
    },
    lastLoginAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

export function school(fields: Partial<School> & { id: string }): School {
  return {
    name: fields.id,
    country: 'LB',
    city: null,
    defaultLocale: 'en',
    status: 'active',
    settings: { aiEnabled: true, aiDailyMessageLimit: null, joinCodesEnabled: true },
    counts: { teachers: 1, students: 0, classes: 1 },
    createdByUid: 'root',
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

export function schoolClass(fields: Partial<SchoolClass> & { id: string }): SchoolClass {
  return {
    schoolId: 'school-a',
    name: `Class ${fields.id}`,
    gradeLabel: null,
    ageBand: '11-12',
    ownerUid: 'teacher-1',
    teacherUids: ['teacher-1'],
    joinCode: 'ABCDEFGH',
    joinCodeEnabled: false,
    joinCodeExpiresAt: null,
    studentCount: 0,
    assignedCourseIds: [],
    archived: false,
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

export function course(fields: Partial<Course> & { id: string }): Course {
  return {
    pathwayId: 'ai-explorer',
    order: 1,
    ownerUid: 'root',
    schoolId: null,
    isOfficial: true,
    status: 'published',
    visibility: 'public',
    audience: 'student',
    area: 'ai',
    tags: [],
    ageMin: null,
    ageMax: null,
    estimatedMinutes: 60,
    accessTier: 'free',
    certificateEnabled: true,
    coverImage: null,
    hardwarePlatformIds: [],
    requiredCapabilities: [],
    moduleCount: 1,
    lessonCount: 3,
    defaultLocale: 'en',
    translations: {
      en: { title: `Course ${fields.id}`, summary: 'A summary', description: '', outcomes: [] },
      fr: { title: `Cours ${fields.id}`, summary: 'Un resume', description: '', outcomes: [] },
    },
    publishedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

export function lesson(fields: Partial<Lesson> & { id: string; courseId: string }): Lesson {
  return {
    moduleId: 'm1',
    order: 0,
    estimatedMinutes: 10,
    xpReward: 50,
    blockCount: 1,
    quizIds: [],
    projectIds: [],
    reflectionBlockIds: [],
    tutorExcerpt: {},
    defaultLocale: 'en',
    translations: { en: { title: `Lesson ${fields.id}`, summary: `About ${fields.id}` } },
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

export function reflectionBlock(
  id: string,
  courseId: string,
  lessonId: string,
  minLength: number,
): LessonBlock {
  return {
    id,
    courseId,
    lessonId,
    type: 'reflection',
    stage: 'reflect',
    order: 0,
    defaultLocale: 'en',
    translations: { en: { prompt: 'Reflect' } },
    data: { minLength },
    createdAt: NOW,
    updatedAt: NOW,
  };
}

export function richTextBlock(id: string, courseId: string, lessonId: string): LessonBlock {
  return {
    id,
    courseId,
    lessonId,
    type: 'rich_text',
    stage: 'learn',
    order: 0,
    defaultLocale: 'en',
    translations: { en: { heading: null, body: 'Text' } },
    data: {},
    createdAt: NOW,
    updatedAt: NOW,
  };
}

export function quiz(fields: Partial<Quiz> & { id: string; courseId: string }): Quiz {
  return {
    lessonId: 'l1',
    passingScorePercent: 70,
    maxAttempts: null,
    xpReward: 100,
    shuffleQuestions: false,
    revealAnswers: 'after_pass',
    questionCount: 1,
    defaultLocale: 'en',
    translations: { en: { title: `Quiz ${fields.id}`, instructions: null } },
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        points: 10,
        translations: { en: { prompt: 'Pick one' } },
        options: [
          { id: 'o1', translations: { en: { text: 'Right' } } },
          { id: 'o2', translations: { en: { text: 'Wrong' } } },
        ],
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

export function enrollment(
  fields: Partial<Enrollment> & { userUid: string; courseId: string },
): Enrollment {
  return {
    id: `${fields.userUid}_${fields.courseId}`,
    schoolId: null,
    classId: null,
    source: 'self',
    status: 'active',
    completedLessonIds: [],
    completedLessonCount: 0,
    totalLessonCount: 3,
    progressPercent: 0,
    lastLessonId: null,
    lastActivityAt: NOW,
    startedAt: NOW,
    completedAt: null,
    certificateId: null,
    quizSummary: {},
    projectSummary: {},
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

export function progress(
  fields: Partial<LessonProgress> & { id: string; userUid: string; courseId: string },
): LessonProgress {
  return {
    status: 'in_progress',
    responses: {},
    xpAwarded: 0,
    effectsApplied: true,
    startedAt: NOW,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

export function attempt(
  fields: Partial<QuizAttempt> & { userUid: string; courseId: string; quizId: string },
): QuizAttempt {
  const attemptNumber = fields.attemptNumber ?? 1;
  return {
    id: `${fields.userUid}_${fields.courseId}_${fields.quizId}_${attemptNumber}`,
    lessonId: 'l1',
    studentName: 'Student',
    quizTitle: { en: { title: 'Quiz' } },
    schoolId: null,
    classId: null,
    attemptNumber,
    locale: 'en',
    answers: {},
    results: { q1: { correct: true, pointsAwarded: 10 } },
    score: 10,
    maxScore: 10,
    scorePercent: 100,
    passed: true,
    xpAwarded: 100,
    effectsApplied: true,
    submittedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

export function project(fields: Partial<Project> & { id: string; courseId: string }): Project {
  return {
    lessonId: 'l1',
    kind: 'project',
    allowedSubmissionTypes: ['text', 'code', 'link', 'image'],
    rubric: [
      { key: 'creativity', weight: 25 },
      { key: 'technicalQuality', weight: 25 },
      { key: 'understanding', weight: 25 },
      { key: 'responsibleAi', weight: 25 },
    ],
    xpReward: 300,
    requiredForCertificate: false,
    defaultLocale: 'en',
    translations: {
      en: { title: `Project ${fields.id}`, brief: 'Build it', requirements: 'Explain it' },
    },
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

export function challenge(fields: Partial<Challenge> & { id: string }): Challenge {
  return {
    type: 'weekly',
    scope: 'global',
    schoolId: null,
    status: 'published',
    area: 'ai',
    ageMin: null,
    ageMax: null,
    startAt: '2026-10-01T00:00:00.000Z',
    deadlineAt: '2099-01-01T00:00:00.000Z',
    allowedSubmissionTypes: ['text', 'link'],
    rubric: [
      { key: 'creativity', weight: 50 },
      { key: 'understanding', weight: 50 },
    ],
    xpReward: 500,
    coverImage: null,
    hardwarePlatformIds: [],
    requiredCapabilities: [],
    submissionCount: 0,
    createdByUid: 'root',
    defaultLocale: 'en',
    translations: {
      en: {
        title: `Challenge ${fields.id}`,
        description: 'Do something',
        submissionRequirements: 'Show it',
        prizes: null,
      },
    },
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

export function submission(fields: Partial<Submission> & { id: string }): Submission {
  return {
    studentUid: 'student-1',
    studentName: 'Name of student-1',
    schoolId: null,
    classId: null,
    context: 'project',
    courseId: 'course-1',
    lessonId: 'l1',
    projectId: 'p1',
    challengeId: null,
    contextTitle: { en: { title: 'Project p1' } },
    attemptNumber: 1,
    previousSubmissionId: null,
    title: 'My work',
    description: 'What I did',
    type: 'text',
    content: { text: 'Some text', linkUrl: null, code: null, codeLanguage: null },
    attachments: [],
    locale: 'en',
    status: 'submitted',
    aiReviewStatus: 'pending',
    latestAiReviewId: null,
    aiRegenerations: 0,
    rubric: [
      { key: 'creativity', weight: 25 },
      { key: 'technicalQuality', weight: 25 },
      { key: 'understanding', weight: 25 },
      { key: 'responsibleAi', weight: 25 },
    ],
    finalScore: null,
    finalCriteria: null,
    finalFeedback: null,
    reviewedByUid: null,
    reviewedAt: null,
    xpAwarded: 0,
    effectsApplied: true,
    submittedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

export function aiReview(
  fields: Partial<AiReview> & { id: string; submissionId: string },
): AiReview {
  const criterion = (score: number) => ({ score, comment: 'A comment' });
  return {
    status: 'ready',
    provider: 'mock',
    model: 'mock-1',
    promptVersion: 'grading-1',
    locale: 'en',
    criteria: {
      creativity: criterion(80),
      technicalQuality: criterion(60),
      understanding: criterion(70),
      responsibleAi: criterion(90),
    },
    overallSuggestedScore: 75,
    writtenFeedback: 'Well done.',
    strengths: ['Clear'],
    improvements: ['Test more'],
    confidence: 'medium',
    limitations: [],
    flags: [],
    error: null,
    inputTokens: 100,
    outputTokens: 50,
    createdAt: NOW,
    ...fields,
  };
}

export function badge(fields: Partial<Badge> & { id: string }): Badge {
  return {
    order: 1,
    icon: 'award',
    tier: 'gold',
    criteria: { type: 'manual' },
    xpBonus: 0,
    isActive: true,
    defaultLocale: 'en',
    translations: { en: { name: fields.id, description: '' } },
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

export function certificate(fields: Partial<Certificate> & { id: string }): Certificate {
  return {
    userUid: 'student-1',
    recipientName: 'Name of student-1',
    type: 'course',
    courseId: 'course-1',
    pathwayId: 'ai-explorer',
    courseTitle: { en: { title: 'Course course-1' } },
    isOfficial: true,
    schoolId: 'school-a',
    schoolName: 'school-a',
    issuedBy: 'teacher-1',
    issuerName: 'Name of teacher-1',
    verificationCode: 'RH-ABCDEFGHJK',
    status: 'issued',
    revokedReason: null,
    issuedAt: NOW,
    revokedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

export function fileRecord(fields: Partial<FileRecord> & { id: string }): FileRecord {
  return {
    ownerUid: 'student-1',
    schoolId: null,
    purpose: 'submission',
    kind: 'image',
    storagePath: `user-uploads/student-1/image/${fields.id}/photo.png`,
    fileName: 'photo.png',
    contentType: 'image/png',
    sizeBytes: 1234,
    width: 640,
    height: 480,
    courseId: null,
    submissionId: null,
    createdAt: NOW,
    ...fields,
  };
}

export function outcome(fields: Partial<GamificationOutcome> = {}): GamificationOutcome {
  return {
    xpAwarded: 50,
    xpTotal: 50,
    level: 1,
    leveledUp: false,
    newBadges: [],
    certificate: null,
    ...fields,
  };
}

export const FILE_ID = '0f8fad5b-d9cb-469f-a165-70867728950e';
