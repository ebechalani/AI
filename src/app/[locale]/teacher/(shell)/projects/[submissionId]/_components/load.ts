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
 * The submission with its AI suggestion and review history, read once per request:
 * getSubmissionForViewer writes (repairs, and an inline review of work still pending after two
 * minutes), so `generateMetadata` and the page share this one call.
 */
export const loadForTeacher = cache(async (submissionId: string) => {
  const session = await requireRole('teacher');
  return getSubmissionForViewer(session, submissionId);
});

export type Definition =
  { kind: 'project'; project: Project } | { kind: 'challenge'; challenge: Challenge };

const UNAVAILABLE = new Set(['not_found', 'forbidden', 'license_required']);

/** The project or challenge the work answered, or null when the teacher cannot read it. */
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
