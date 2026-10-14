import 'server-only';
import type { DocumentReference } from 'firebase-admin/firestore';
import type { Actor } from '@/lib/auth/actor';
import { ConflictError, ValidationError } from '@/lib/errors';
import { getAdminDb } from '@/lib/firebase/admin';
import { collections } from '@/lib/firebase/collections';
import { createdNow, fromQuery, fromSnapshot, updatedNow } from '@/lib/firebase/converters';
import { parseInput } from '@/lib/schemas/common';
import { saveProjectInputSchema } from '@/lib/schemas/project';
import type { ProjectInput } from '@/types/inputs';
import type { Project } from '@/types/project';
import {
  assertId,
  assertNoEnrollments,
  loadEditableCourse,
  loadViewableCourse,
  updateExisting,
} from './internal-content';

// Project and assignment definitions. Submissions against them are in ./submissions.

function projectDoc(courseId: string, projectId: string): DocumentReference {
  assertId(projectId);
  return collections.projects(courseId).doc(projectId);
}

export async function getProject(
  actor: Actor,
  courseId: string,
  projectId: string,
): Promise<Project> {
  await loadViewableCourse(actor, courseId);
  return fromSnapshot<Project>(await projectDoc(courseId, projectId).get(), { courseId });
}

/** Oldest first. */
export async function listProjects(actor: Actor, courseId: string): Promise<Project[]> {
  await loadViewableCourse(actor, courseId);
  const projects = fromQuery<Project>(await collections.projects(courseId).get(), { courseId });
  return projects.sort((a, b) =>
    a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0,
  );
}

/** The reverse link `lessonId` belongs to the block transaction (data/courses) and is left alone. */
export async function saveProject(
  actor: Actor,
  courseId: string,
  projectId: string | null,
  input: ProjectInput,
): Promise<Project> {
  await loadEditableCourse(actor, courseId);
  const parsed = parseInput(saveProjectInputSchema, { courseId, projectId, input });
  if (!parsed.success) throw new ValidationError('Invalid project.', parsed.fieldErrors);
  const data = parsed.data.input;
  const fields = {
    kind: data.kind,
    allowedSubmissionTypes: data.allowedSubmissionTypes,
    rubric: data.rubric,
    xpReward: data.xpReward,
    requiredForCertificate: data.requiredForCertificate,
    defaultLocale: data.defaultLocale,
    translations: data.translations,
  };

  const projects = collections.projects(courseId);
  const ref = projectId === null ? projects.doc() : projectDoc(courseId, projectId);
  if (projectId === null) {
    await ref.create({ lessonId: null, ...fields, ...createdNow() });
  } else {
    await updateExisting(ref, { ...fields, ...updatedNow() });
  }
  return fromSnapshot<Project>(await ref.get(), { courseId });
}

export async function deleteProject(
  actor: Actor,
  courseId: string,
  projectId: string,
): Promise<void> {
  await loadEditableCourse(actor, courseId);
  const ref = projectDoc(courseId, projectId);
  await getAdminDb().runTransaction(async (tx) => {
    const project = fromSnapshot<Project>(await tx.get(ref), { courseId });
    if (project.lessonId !== null) {
      throw new ConflictError(`${ref.path} is used by a block of lesson ${project.lessonId}.`);
    }
    await assertNoEnrollments(tx, courseId);
    tx.delete(ref);
  });
}
