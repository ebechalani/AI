import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SYSTEM_ACTOR } from '@/lib/auth/actor';
import { createUserBadge, getBadge, listBadges, listUserBadges } from '@/lib/data/badges';
import { listPublishedCoursesByPathway } from '@/lib/data/courses';
import { getEnrollment } from '@/lib/data/enrollments';
import { applyXpEntry } from '@/lib/data/xp';
import { NotFoundError } from '@/lib/errors';
import {
  awardBadge,
  awardXp,
  evaluateBadges,
  evaluateBadgeTriggers,
} from '@/lib/gamification/award';
import type { Badge, BadgeCriteria, BadgeTrigger, Course, Enrollment, UserBadge } from '@/types';

// gamification/award over fake repositories: which badges a trigger awards, what it reads to
// decide, and what a repeated or interrupted award does. The repositories' own transactions
// are covered against the emulator (tests/integration).

vi.mock('@/lib/data/badges', () => ({
  listBadges: vi.fn(),
  getBadge: vi.fn(),
  listUserBadges: vi.fn(),
  createUserBadge: vi.fn(),
}));
vi.mock('@/lib/data/xp', () => ({ applyXpEntry: vi.fn() }));
vi.mock('@/lib/data/courses', () => ({ listPublishedCoursesByPathway: vi.fn() }));
vi.mock('@/lib/data/enrollments', () => ({ getEnrollment: vi.fn() }));

const UID = 'student-1';

function badge(id: string, criteria: BadgeCriteria, extra: Partial<Badge> = {}): Badge {
  return {
    id,
    order: 0,
    icon: 'award',
    tier: 'bronze',
    criteria,
    xpBonus: 0,
    isActive: true,
    defaultLocale: 'en',
    translations: { en: { name: id, description: id } },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

// The seeded badges of ARCHITECTURE.md 9.3, plus what the tests need around them.
const CATALOG: Badge[] = [
  badge('ai-explorer', { type: 'pathway_completed', pathwayId: 'ai-explorer' }),
  badge('prompt-master', { type: 'course_completed', courseId: 'build-with-generative-ai' }),
  badge('data-detective', { type: 'stat_threshold', stat: 'quizzesPassed', threshold: 5 }),
  badge('vision-builder', { type: 'stat_threshold', stat: 'projectsAccepted', threshold: 3 }),
  badge('responsible-ai-champion', { type: 'manual' }),
  badge('robotics-engineer', { type: 'pathway_completed', pathwayId: 'ai-robotics' }),
  badge('first-lesson', { type: 'stat_threshold', stat: 'lessonsCompleted', threshold: 1 }),
  badge('course-collector', { type: 'stat_threshold', stat: 'coursesCompleted', threshold: 2 }),
  badge(
    'retired',
    { type: 'stat_threshold', stat: 'quizzesPassed', threshold: 1 },
    { isActive: false },
  ),
];

let catalog: Badge[];
let held: Set<string>;
let ledger: Set<string>;
let pathwayCourses: Record<string, string[]>;
let completedCourses: Set<string>;
let enrolledCourses: Set<string>;
let writes: string[];

beforeEach(() => {
  catalog = CATALOG;
  held = new Set();
  ledger = new Set();
  pathwayCourses = {};
  completedCourses = new Set();
  enrolledCourses = new Set();
  writes = [];
  vi.clearAllMocks();

  vi.mocked(listBadges).mockImplementation(async (_actor, opts) =>
    catalog.filter((item) => !opts?.activeOnly || item.isActive),
  );
  vi.mocked(getBadge).mockImplementation(async (_actor, badgeId) => {
    const found = catalog.find((item) => item.id === badgeId);
    if (!found) throw new NotFoundError(`badges/${badgeId} does not exist.`);
    return found;
  });
  vi.mocked(listUserBadges).mockImplementation(async (_actor, uid) =>
    [...held].map((badgeId) => ({ id: badgeId, uid, badgeId }) as UserBadge),
  );
  vi.mocked(createUserBadge).mockImplementation(async (_actor, _uid, badgeId) => {
    if (held.has(badgeId)) return { created: false };
    held.add(badgeId);
    writes.push(`badge:${badgeId}`);
    return { created: true };
  });
  vi.mocked(applyXpEntry).mockImplementation(async (_actor, _uid, entry) => {
    const id = `${entry.reason}_${entry.refId}`;
    const created = !ledger.has(id);
    if (created) {
      ledger.add(id);
      writes.push(`xp:${id}:${entry.amount}`);
    }
    return { created, xpTotal: 0, level: 1, previousLevel: 1, stat: null };
  });
  vi.mocked(listPublishedCoursesByPathway).mockImplementation(async (pathwayId) =>
    (pathwayCourses[pathwayId] ?? []).map((id) => ({ id }) as Course),
  );
  vi.mocked(getEnrollment).mockImplementation(async (_actor, _uid, courseId) => {
    if (completedCourses.has(courseId)) return { status: 'completed' } as Enrollment;
    return enrolledCourses.has(courseId) ? ({ status: 'active' } as Enrollment) : null;
  });
});

async function awardedBy(trigger: BadgeTrigger): Promise<string[]> {
  return (await evaluateBadges(UID, trigger)).map((item) => item.id);
}

const courseCompleted = (
  courseId: string,
  pathwayId: string | null,
  coursesCompleted = 1,
): BadgeTrigger => ({ type: 'course_completed', courseId, pathwayId, coursesCompleted });

describe('awardXp', () => {
  it('applies the entry as the system and reports a level change', async () => {
    vi.mocked(applyXpEntry).mockResolvedValueOnce({
      created: true,
      xpTotal: 250,
      level: 2,
      previousLevel: 1,
      stat: { name: 'lessonsCompleted', value: 4 },
    });
    const entry = {
      reason: 'lesson',
      refId: 'course-1_lesson-4',
      amount: 50,
      courseId: 'course-1',
    } as const;

    expect(await awardXp(UID, entry)).toEqual({
      awarded: true,
      xpTotal: 250,
      level: 2,
      leveledUp: true,
      stat: { name: 'lessonsCompleted', value: 4 },
    });
    expect(applyXpEntry).toHaveBeenCalledWith(SYSTEM_ACTOR, UID, entry);
  });

  it('reports a repeated award as not awarded and not a level-up', async () => {
    vi.mocked(applyXpEntry).mockResolvedValueOnce({
      created: false,
      xpTotal: 250,
      level: 2,
      previousLevel: 2,
      stat: { name: 'quizzesPassed', value: 1 },
    });
    expect(
      await awardXp(UID, {
        reason: 'quiz',
        refId: 'course-1_quiz-1',
        amount: 100,
        courseId: 'course-1',
      }),
    ).toMatchObject({
      awarded: false,
      leveledUp: false,
      stat: { name: 'quizzesPassed', value: 1 },
    });
  });
});

describe('evaluateBadges with a stat trigger', () => {
  it('awards the threshold badge of that counter once the value reaches it', async () => {
    expect(await awardedBy({ type: 'stat', stat: 'quizzesPassed', value: 4 })).toEqual([]);
    expect(await awardedBy({ type: 'stat', stat: 'quizzesPassed', value: 5 })).toEqual([
      'data-detective',
    ]);
    expect(createUserBadge).toHaveBeenCalledWith(
      SYSTEM_ACTOR,
      UID,
      'data-detective',
      'system',
      null,
    );
  });

  it('awards a badge whose threshold was passed earlier without being awarded', async () => {
    expect(await awardedBy({ type: 'stat', stat: 'projectsAccepted', value: 7 })).toEqual([
      'vision-builder',
    ]);
  });

  it('leaves the badges of other counters, inactive badges and manual badges alone', async () => {
    expect(await awardedBy({ type: 'stat', stat: 'lessonsCompleted', value: 100 })).toEqual([
      'first-lesson',
    ]);
    expect(held).toEqual(new Set(['first-lesson']));
  });

  it('does not award a badge the user already holds', async () => {
    held.add('data-detective');
    expect(await awardedBy({ type: 'stat', stat: 'quizzesPassed', value: 9 })).toEqual([]);
    expect(createUserBadge).not.toHaveBeenCalled();
  });

  it('costs two reads and no course or enrollment query', async () => {
    await awardedBy({ type: 'stat', stat: 'quizzesPassed', value: 5 });
    expect(listBadges).toHaveBeenCalledExactlyOnceWith(SYSTEM_ACTOR, { activeOnly: true });
    expect(listUserBadges).toHaveBeenCalledExactlyOnceWith(SYSTEM_ACTOR, UID);
    expect(listPublishedCoursesByPathway).not.toHaveBeenCalled();
    expect(getEnrollment).not.toHaveBeenCalled();
  });

  it('never awards a coursesCompleted badge: that counter has its own trigger', async () => {
    catalog = [badge('odd', { type: 'stat_threshold', stat: 'coursesCompleted', threshold: 0 })];
    expect(await awardedBy({ type: 'stat', stat: 'lessonsCompleted', value: 50 })).toEqual([]);
  });
});

describe('evaluateBadges with a course_completed trigger', () => {
  it('awards the badge of that course only', async () => {
    expect(await awardedBy(courseCompleted('build-with-generative-ai', null))).toEqual([
      'prompt-master',
    ]);
    held.clear();
    expect(await awardedBy(courseCompleted('another-course', null))).toEqual([]);
  });

  it('awards the coursesCompleted threshold badge from the trigger value', async () => {
    expect(await awardedBy(courseCompleted('course-x', null, 1))).toEqual([]);
    expect(await awardedBy(courseCompleted('course-x', null, 2))).toEqual(['course-collector']);
  });

  it('awards the pathway badge when every published course of the pathway is completed', async () => {
    pathwayCourses['ai-explorer'] = ['course-a', 'course-b'];
    completedCourses = new Set(['course-a', 'course-b']);

    expect(await awardedBy(courseCompleted('course-b', 'ai-explorer'))).toEqual(['ai-explorer']);
    expect(listPublishedCoursesByPathway).toHaveBeenCalledExactlyOnceWith('ai-explorer');
    expect(vi.mocked(getEnrollment).mock.calls.map((call) => call[2])).toEqual([
      'course-a',
      'course-b',
    ]);
  });

  it('holds the pathway badge back while a course is unfinished or not started', async () => {
    pathwayCourses['ai-explorer'] = ['course-a', 'course-b', 'course-c'];
    completedCourses = new Set(['course-a', 'course-b']);
    expect(await awardedBy(courseCompleted('course-b', 'ai-explorer'))).toEqual([]);

    enrolledCourses.add('course-c');
    expect(await awardedBy(courseCompleted('course-b', 'ai-explorer'))).toEqual([]);
  });

  it('looks at the pathway of the completed course only', async () => {
    pathwayCourses = { 'ai-explorer': ['course-a'], 'ai-robotics': ['course-r'] };
    completedCourses = new Set(['course-a', 'course-r']);

    expect(await awardedBy(courseCompleted('course-r', 'ai-robotics'))).toEqual([
      'robotics-engineer',
    ]);
    expect(listPublishedCoursesByPathway).toHaveBeenCalledExactlyOnceWith('ai-robotics');
  });

  it('reads no pathway for a course that has none', async () => {
    expect(await awardedBy(courseCompleted('teacher-made', null))).toEqual([]);
    expect(listPublishedCoursesByPathway).not.toHaveBeenCalled();
  });

  it('does not award the badge of a pathway with no published course', async () => {
    pathwayCourses['ai-explorer'] = [];
    expect(await awardedBy(courseCompleted('course-a', 'ai-explorer'))).toEqual([]);
  });

  it('does not touch the counters of ordinary XP events', async () => {
    expect(await awardedBy(courseCompleted('course-x', null, 0))).toEqual([]);
    expect(held.size).toBe(0);
  });
});

describe('evaluateBadgeTriggers', () => {
  it('evaluates several triggers of one event on one pair of reads', async () => {
    const awarded = await evaluateBadgeTriggers(UID, [
      { type: 'stat', stat: 'lessonsCompleted', value: 1 },
      courseCompleted('build-with-generative-ai', null, 2),
    ]);
    expect(awarded.map((item) => item.id)).toEqual([
      'prompt-master',
      'first-lesson',
      'course-collector',
    ]);
    expect(listBadges).toHaveBeenCalledTimes(1);
    expect(listUserBadges).toHaveBeenCalledTimes(1);
  });

  it('reads nothing when there is no trigger', async () => {
    expect(await evaluateBadgeTriggers(UID, [])).toEqual([]);
    expect(listBadges).not.toHaveBeenCalled();
  });
});

describe('badge bonus', () => {
  const bonusBadge = badge(
    'quiz-ace',
    { type: 'stat_threshold', stat: 'quizzesPassed', threshold: 1 },
    { xpBonus: 40 },
  );

  beforeEach(() => {
    catalog = [bonusBadge];
  });

  it('is granted once, under the ledger id badge_{badgeId}, and starts no new evaluation', async () => {
    expect(await awardedBy({ type: 'stat', stat: 'quizzesPassed', value: 1 })).toEqual([
      'quiz-ace',
    ]);
    expect(applyXpEntry).toHaveBeenCalledExactlyOnceWith(SYSTEM_ACTOR, UID, {
      reason: 'badge',
      refId: 'quiz-ace',
      amount: 40,
      courseId: null,
    });
    expect(listBadges).toHaveBeenCalledTimes(1);

    expect(await awardedBy({ type: 'stat', stat: 'quizzesPassed', value: 2 })).toEqual([]);
    expect(writes).toEqual(['xp:badge_quiz-ace:40', 'badge:quiz-ace']);
  });

  it('is not written for a badge without a bonus', async () => {
    catalog = CATALOG;
    await awardedBy({ type: 'stat', stat: 'quizzesPassed', value: 5 });
    expect(applyXpEntry).not.toHaveBeenCalled();
  });

  it('completes an award that stopped between the bonus and the badge', async () => {
    ledger.add('badge_quiz-ace');
    expect(await awardedBy({ type: 'stat', stat: 'quizzesPassed', value: 1 })).toEqual([
      'quiz-ace',
    ]);
    expect(writes).toEqual(['badge:quiz-ace']);
  });
});

describe('awardBadge', () => {
  it('awards a manual badge with the awarder and the note', async () => {
    expect(await awardBadge(UID, 'responsible-ai-champion', 'teacher-1', 'Great debate')).toEqual({
      awarded: true,
    });
    expect(createUserBadge).toHaveBeenCalledWith(
      SYSTEM_ACTOR,
      UID,
      'responsible-ai-champion',
      'teacher-1',
      'Great debate',
    );
  });

  it('stores no note when none is given', async () => {
    await awardBadge(UID, 'responsible-ai-champion', 'system');
    expect(createUserBadge).toHaveBeenCalledWith(
      SYSTEM_ACTOR,
      UID,
      'responsible-ai-champion',
      'system',
      null,
    );
  });

  it('answers awarded: false for a badge the user already holds', async () => {
    held.add('responsible-ai-champion');
    expect(await awardBadge(UID, 'responsible-ai-champion', 'teacher-1')).toEqual({
      awarded: false,
    });
  });

  it('fails with not_found for an unknown badge, before anything is written', async () => {
    await expect(awardBadge(UID, 'no-such-badge', 'system')).rejects.toMatchObject({
      code: 'not_found',
    });
    expect(createUserBadge).not.toHaveBeenCalled();
    expect(applyXpEntry).not.toHaveBeenCalled();
  });
});
