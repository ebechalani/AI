import 'server-only';
import { cache } from 'react';
import { targetOf } from '@/components/projects/projects-model';
import { requireRole } from '@/lib/auth/session';
import { getChallenge } from '@/lib/data/challenges';
import { getProject } from '@/lib/data/projects';
import { isAppError } from '@/lib/errors';
import { getSubmissionForViewer } from '@/lib/services/project-flow';
import type { Challenge, Project, Session, Submission } from '@/types';

/**
 * The submission as its owner sees it, read once per request: getSubmissionForViewer writes
 * (it repairs effects and re-runs a review still pending after two minutes), so
 * `generateMetadata` and the page share this one call.
 *
 * `updatedDuringRead`: the submission was written while it was read (most often a review that
 * finished and awarded XP). The shell around the page was read at the same time, so its XP and
 * level may be the old ones: the page then refreshes once (RefreshOnce).
 */
export const loadForStudent = cache(async (submissionId: string) => {
  const session = await requireRole('student');
  const startedAt = Date.now();
  const view = await getSubmissionForViewer(session, submissionId);
  return { ...view, updatedDuringRead: Date.parse(view.submission.updatedAt) >= startedAt };
});

export type Definition =
  { kind: 'project'; project: Project } | { kind: 'challenge'; challenge: Challenge };

// The definition may have gone (a project deleted, a challenge archived, a course no longer
// open): the brief is then unavailable and no new version can be sent.
const UNAVAILABLE = new Set(['not_found', 'forbidden', 'license_required']);

/** What the submission answered: the project or the challenge, or null when it is gone. */
export async function readDefinition(
  session: Session,
  submission: Submission,
): Promise<Definition | null> {
  const target = targetOf(submission);
  if (target === null) return null;
  try {
    return target.context === 'project'
      ? { kind: 'project', project: await getProject(session, target.courseId, target.projectId) }
      : { kind: 'challenge', challenge: await getChallenge(session, target.challengeId) };
  } catch (error) {
    if (isAppError(error) && UNAVAILABLE.has(error.code)) return null;
    throw error;
  }
}
