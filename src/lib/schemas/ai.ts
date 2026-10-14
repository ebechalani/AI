import type { z } from 'zod';
import { AI_LIMITS } from '@/lib/limits';
import { LAB_TOOL_IDS, TUTOR_MODES, type TutorRequest, type TutorTurn } from '@/types/ai';
import type { RunLabToolInput } from '@/types/inputs';
import { idSchema, list, localeSchema, obj, oneOf, requiredText, text, unionOf } from './common';

const LIMITS = AI_LIMITS.tutorRequest;

// Not trimmed: a learner may paste indented code to have it checked.
const turnSchema = obj({
  role: unionOf<TutorTurn['role']>()(['user', 'assistant']),
  content: text(LIMITS.assistantMessageChars, { trim: false }),
});

/**
 * Request body of POST /api/ai/tutor. The client sends the visible thread, so the history is
 * bounded here and treated as untrusted by the tutor (it may have been forged).
 */
export const tutorRequestSchema = obj({
  mode: oneOf(TUTOR_MODES),
  courseId: idSchema.nullable(),
  lessonId: idSchema.nullable(),
  messages: list(turnSchema, { min: 1, max: LIMITS.maxMessages }),
  locale: localeSchema,
}).superRefine((request, ctx) => {
  const issue = (message: string, ...path: PropertyKey[]) =>
    ctx.addIssue({ code: 'custom', message, path });

  // A lesson id means nothing without its course.
  if (request.lessonId !== null && request.courseId === null) issue('required', 'courseId');

  const { messages } = request;
  messages.forEach((turn, index) => {
    if (turn.role !== 'user') return;
    if (turn.content.trim() === '') issue('required', 'messages', index, 'content');
    if (turn.content.length > LIMITS.userMessageChars) {
      issue('too_long', 'messages', index, 'content');
    }
  });

  const alternates = messages.every(
    (turn, index) => index === 0 || turn.role !== messages[index - 1]?.role,
  );
  const endsWithLearner = messages.length === 0 || messages.at(-1)?.role === 'user';
  if (!alternates || !endsWithLearner) issue('invalid', 'messages');

  const totalChars = messages.reduce((sum, turn) => sum + turn.content.length, 0);
  if (totalChars > LIMITS.totalChars) issue('too_long', 'messages');
}) satisfies z.ZodType<TutorRequest>;

export const runLabToolInputSchema = obj({
  toolId: oneOf(LAB_TOOL_IDS),
  prompt: requiredText(AI_LIMITS.labPromptChars),
}) satisfies z.ZodType<RunLabToolInput>;
