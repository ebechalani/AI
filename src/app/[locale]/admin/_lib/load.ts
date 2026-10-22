import 'server-only';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { cache } from 'react';
import { requireRole } from '@/lib/auth/session';
import { getChallenge } from '@/lib/data/challenges';
import { getSchool, listSchools } from '@/lib/data/schools';
import { getUser } from '@/lib/data/users';
import { isAppError } from '@/lib/errors';
import { redirect } from '@/lib/i18n/navigation';
import type { Challenge } from '@/types/challenge';
import type { Page } from '@/types/common';
import type { School } from '@/types/school';
import type { Session, UserProfile } from '@/types/user';

// Reads shared by the admin pages and their `generateMetadata`, each run once per request.

const SCHOOLS_PAGE_SIZE = 100;
const MAX_SCHOOL_PAGES = 20;

/** Every school, all pages of the Admin lists `schools` query (for names and pickers). */
export const listAllSchools = cache(async (): Promise<School[]> => {
  const session = await requireRole('platform_admin');
  const schools: School[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < MAX_SCHOOL_PAGES; page += 1) {
    const result: Page<School> = await listSchools(session, { limit: SCHOOLS_PAGE_SIZE, cursor });
    schools.push(...result.items);
    if (result.nextCursor === null) break;
    cursor = result.nextCursor;
  }
  return schools;
});

/**
 * One page of a cursor-paged list, or a redirect to its first page when the URL's cursor is
 * stale or forged (`ValidationError { cursor: ['invalid'] }`, WS-C's pattern).
 */
export async function pageOrFirst<T>(
  load: () => Promise<Page<T>>,
  firstPageHref: string,
): Promise<Page<T>> {
  try {
    return await load();
  } catch (error) {
    if (isAppError(error) && error.code === 'validation') {
      redirect({ href: firstPageHref, locale: await getLocale() });
    }
    throw error;
  }
}

/** The area's not-found page for a missing or malformed id. */
function notFoundOn(error: unknown): never {
  if (isAppError(error) && error.code === 'not_found') notFound();
  throw error;
}

export const loadSchool = cache(async (schoolId: string) =>
  getSchool(await requireRole('platform_admin'), schoolId),
);

/** The school, or the not-found page for a missing or malformed id. */
export async function schoolOrNotFound(schoolId: string): Promise<School> {
  try {
    return await loadSchool(schoolId);
  } catch (error) {
    return notFoundOn(error);
  }
}

export const loadChallenge = cache(async (challengeId: string) =>
  getChallenge(await requireRole('platform_admin'), challengeId),
);

/** The challenge (drafts and archived ones included), or the not-found page. */
export async function challengeOrNotFound(challengeId: string): Promise<Challenge> {
  try {
    return await loadChallenge(challengeId);
  } catch (error) {
    return notFoundOn(error);
  }
}

export const loadUser = cache(async (uid: string) =>
  getUser(await requireRole('platform_admin'), uid),
);

/** The account, or the not-found page. */
export async function userOrNotFound(uid: string): Promise<UserProfile> {
  try {
    return await loadUser(uid);
  } catch (error) {
    return notFoundOn(error);
  }
}

/** The display names behind `uids`, each read once, in parallel; a missing account is null. */
export async function userNames(
  session: Session,
  uids: readonly string[],
): Promise<Record<string, string | null>> {
  const unique = [...new Set(uids)];
  const names = await Promise.all(
    unique.map((uid) =>
      getUser(session, uid)
        .then((user): string | null => user.displayName)
        .catch((error: unknown) => {
          if (isAppError(error) && error.code === 'not_found') return null;
          throw error;
        }),
    ),
  );
  const index: Record<string, string | null> = {};
  unique.forEach((uid, i) => {
    index[uid] = names[i] ?? null;
  });
  return index;
}
