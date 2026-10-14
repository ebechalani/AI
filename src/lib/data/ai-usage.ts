import 'server-only';
import {
  FieldValue,
  type DocumentReference,
  type DocumentSnapshot,
} from 'firebase-admin/firestore';
import { getAiEnv } from '@/lib/env';
import { getAdminDb } from '@/lib/firebase/admin';
import { collections, docIds, utcDayKey } from '@/lib/firebase/collections';
import { createdNow, updatedNow } from '@/lib/firebase/converters';
import { AI_BUDGETS, AI_LIMITS } from '@/lib/limits';
import type { Role } from '@/types/common';
import { clampAiDailyMessageLimit, isId } from './internal-identity';

// The functions of this module take no actor: `subject` is the user an AI call is made for
// (the session user; for a review, the student who submitted), named by the caller, which has
// already authorized. Nothing here is returned to a client except the decision.

export type AiUsageKind = 'tutor' | 'lab' | 'review';

export interface AiUsageSubject {
  uid: string;
  role: Role;
  schoolId: string | null;
}

export interface AiUsageDecision {
  allowed: boolean;
  /** 'role' and 'disabled' are refusals for good (forbidden); 'limit' and 'budget' pass with time. */
  reason: 'ok' | 'role' | 'disabled' | 'limit' | 'budget';
  /** Requests of this kind the subject may still make in the current UTC day. */
  remainingToday: number;
  retryAfterSeconds: number | null;
}

const COUNTER_OF_KIND = {
  tutor: 'tutorMessages',
  lab: 'labRequests',
  review: 'reviewRequests',
} as const satisfies Record<AiUsageKind, string>;

interface RequestLimits {
  perDay: number;
  /** null = no per-minute limit for this kind. */
  perMinute: number | null;
  tokensPerDay: number;
}

/** null when the role may not use that kind at all. */
function limitsFor(
  role: Role,
  kind: AiUsageKind,
  schoolDailyLimit: number | null,
): RequestLimits | null {
  if (role === 'student') {
    const tokensPerDay = AI_LIMITS.tokensPerDay.student;
    if (kind === 'lab') return { perDay: AI_LIMITS.lab.perDay, perMinute: null, tokensPerDay };
    if (kind === 'review') {
      return { perDay: AI_LIMITS.review.perDay, perMinute: null, tokensPerDay };
    }
    const { perDay, perMinute } = AI_LIMITS.tutor.student;
    return { perDay: schoolDailyLimit ?? perDay, perMinute, tokensPerDay };
  }
  if (role === 'teacher' && kind === 'tutor') {
    return { ...AI_LIMITS.tutor.teacher, tokensPerDay: AI_LIMITS.tokensPerDay.teacher };
  }
  return null;
}

function count(snapshot: DocumentSnapshot, field: string): number {
  const value: unknown = snapshot.get(field);
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function tokensUsed(snapshot: DocumentSnapshot): number {
  return count(snapshot, 'inputTokens') + count(snapshot, 'outputTokens');
}

function secondsUntilNextUtcDay(now: Date): number {
  const nextDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(1, Math.ceil((nextDay - now.getTime()) / 1000));
}

interface UsageDocs {
  date: string;
  user: DocumentReference;
  school: DocumentReference | null;
  global: DocumentReference;
}

function usageDocs(subject: AiUsageSubject, now: Date): UsageDocs {
  if (!isId(subject.uid)) throw new Error('AI usage: malformed uid.');
  if (subject.schoolId !== null && !isId(subject.schoolId)) {
    throw new Error('AI usage: malformed schoolId.');
  }
  const day = utcDayKey(now);
  const usage = collections.aiUsage();
  return {
    date: now.toISOString().slice(0, 10),
    user: usage.doc(docIds.userAiUsage(subject.uid, day)),
    school:
      subject.schoolId === null ? null : usage.doc(docIds.schoolAiUsage(subject.schoolId, day)),
    global: usage.doc(docIds.globalAiUsage(day)),
  };
}

/**
 * Called before every provider call. Refuses, in this order: a role that may not use the
 * feature; a school that switched AI off; the per-minute then the per-day request limit; the
 * user's daily token cap; the school's or the platform's daily token budget. When it allows,
 * the request is counted in the same transaction, so two parallel calls cannot both take the
 * last one. Tokens are added after the call by recordAiTokens, which is why the token
 * ceilings stop the next call rather than the one that crosses them.
 */
export async function checkAndCountAiUsage(
  subject: AiUsageSubject,
  kind: AiUsageKind,
): Promise<AiUsageDecision> {
  const refuse = (
    reason: AiUsageDecision['reason'],
    remainingToday = 0,
    retryAfterSeconds: number | null = null,
  ): AiUsageDecision => ({ allowed: false, reason, remainingToday, retryAfterSeconds });

  if (!Object.hasOwn(COUNTER_OF_KIND, kind) || limitsFor(subject.role, kind, null) === null) {
    return refuse('role');
  }
  const now = new Date();
  const docs = usageDocs(subject, now);

  // Read outside the transaction: every AI call on the platform reads the global counter, and
  // locking it would make them queue behind each other. The budgets are soft ceilings anyway.
  const [school, schoolUsage, globalUsage] = await Promise.all([
    subject.schoolId === null ? null : collections.schools().doc(subject.schoolId).get(),
    docs.school === null ? null : docs.school.get(),
    docs.global.get(),
  ]);
  if (school !== null && (!school.exists || school.get('settings.aiEnabled') !== true)) {
    return refuse('disabled');
  }
  const schoolDailyLimit =
    school === null
      ? null
      : clampAiDailyMessageLimit(school.get('settings.aiDailyMessageLimit') as number | null);
  const limits = limitsFor(subject.role, kind, schoolDailyLimit);
  if (limits === null) return refuse('role');
  const budgetExhausted =
    (schoolUsage !== null && tokensUsed(schoolUsage) >= AI_BUDGETS.schoolTokensPerDay) ||
    tokensUsed(globalUsage) >= getAiEnv().dailyTokenBudget;

  const counter = COUNTER_OF_KIND[kind];
  const minuteBucket = now.toISOString().slice(0, 16);
  const untilTomorrow = secondsUntilNextUtcDay(now);

  return getAdminDb().runTransaction(async (tx) => {
    const usage = await tx.get(docs.user);
    const usedToday = count(usage, counter);
    const usedThisMinute =
      usage.get('minuteBucket') === minuteBucket ? count(usage, 'minuteCount') : 0;
    const remaining = Math.max(0, limits.perDay - usedToday);

    if (limits.perMinute !== null && usedThisMinute >= limits.perMinute) {
      return refuse('limit', remaining, Math.max(1, 60 - now.getUTCSeconds()));
    }
    if (remaining === 0) return refuse('limit', 0, untilTomorrow);
    if (tokensUsed(usage) >= limits.tokensPerDay) return refuse('limit', remaining, untilTomorrow);
    if (budgetExhausted) return refuse('budget', remaining, untilTomorrow);

    const minute =
      limits.perMinute === null ? {} : { minuteBucket, minuteCount: usedThisMinute + 1 };
    if (usage.exists) {
      tx.update(docs.user, { [counter]: usedToday + 1, ...minute, ...updatedNow() });
    } else {
      tx.create(docs.user, {
        scope: 'user',
        uid: subject.uid,
        schoolId: subject.schoolId,
        date: docs.date,
        tutorMessages: 0,
        labRequests: 0,
        reviewRequests: 0,
        minuteBucket,
        minuteCount: 0,
        inputTokens: 0,
        outputTokens: 0,
        blockedCount: 0,
        [counter]: 1,
        ...minute,
        ...createdNow(),
      });
    }
    return { allowed: true, reason: 'ok', remainingToday: remaining - 1, retryAfterSeconds: null };
  });
}

function wholeTokens(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

/** After a provider call: the tokens it used, on the user's, the school's and the platform's counter. */
export async function recordAiTokens(
  subject: AiUsageSubject,
  usage: { inputTokens: number; outputTokens: number },
): Promise<void> {
  const docs = usageDocs(subject, new Date());
  const tokens = {
    inputTokens: FieldValue.increment(wholeTokens(usage.inputTokens)),
    outputTokens: FieldValue.increment(wholeTokens(usage.outputTokens)),
    ...updatedNow(),
  };
  const budget = { ...tokens, date: docs.date, requests: FieldValue.increment(1) };

  const batch = getAdminDb().batch();
  batch.set(
    docs.user,
    { scope: 'user', uid: subject.uid, schoolId: subject.schoolId, date: docs.date, ...tokens },
    { merge: true },
  );
  if (docs.school !== null) {
    batch.set(
      docs.school,
      { scope: 'school', schoolId: subject.schoolId, ...budget },
      { merge: true },
    );
  }
  batch.set(docs.global, { scope: 'global', schoolId: null, ...budget }, { merge: true });
  await batch.commit();
}

/** A request or a reply that the safety checks refused. */
export async function recordAiBlocked(subject: AiUsageSubject): Promise<void> {
  const docs = usageDocs(subject, new Date());
  await docs.user.set(
    {
      scope: 'user',
      uid: subject.uid,
      schoolId: subject.schoolId,
      date: docs.date,
      blockedCount: FieldValue.increment(1),
      ...updatedNow(),
    },
    { merge: true },
  );
}
