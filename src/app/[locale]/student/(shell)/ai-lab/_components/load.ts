import 'server-only';
import { cache } from 'react';
import { getSchool } from '@/lib/data/schools';
import { NotFoundError } from '@/lib/errors';
import type { Session } from '@/types/user';

/**
 * The school's AI switch for both AI Lab pages (3.7 "AI Lab"), as checkAndCountAiUsage applies
 * it: no school is on; a missing school is off. `schools/{schoolId}` is read only when the
 * learner has a school, once per request.
 */
export const aiLabEnabled = cache(async (session: Session): Promise<boolean> => {
  if (session.schoolId === null) return true;
  try {
    return (await getSchool(session, session.schoolId)).settings.aiEnabled === true;
  } catch (error: unknown) {
    if (error instanceof NotFoundError) return false;
    throw error;
  }
});
