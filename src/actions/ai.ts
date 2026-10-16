'use server';

import { getLabTool } from '@/lib/ai/lab-tools';
import { runLabToolWithReport, type LabToolResult } from '@/lib/ai/lab';
import { describeAiFailure } from '@/lib/ai/log';
import { AiError, type AiUsage } from '@/lib/ai/types';
import { runAction } from '@/lib/actions/run-action';
import { checkAndCountAiUsage, recordAiBlocked, recordAiTokens } from '@/lib/data/ai-usage';
import { getSchool } from '@/lib/data/schools';
import { AppError, ForbiddenError, NotFoundError, RateLimitError } from '@/lib/errors';
import { runLabToolInputSchema } from '@/lib/schemas/ai';
import type { ActionResult } from '@/types/actions';
import type { RunLabToolInput } from '@/types/inputs';
import type { Session } from '@/types/user';

// One AI Lab run (ARCHITECTURE.md 8.5, 8.7, 10.4). Only the live tool calls the provider, so
// only it is checked against and counted in the daily lab requests; the canned tools still
// respect the school's AI switch (8.6.3).

/** The school switch, for the calls that do not go through checkAndCountAiUsage. */
async function assertSchoolAllowsAi(session: Session): Promise<void> {
  if (session.schoolId === null) return;
  try {
    const school = await getSchool(session, session.schoolId);
    if (school.settings.aiEnabled === true) return;
  } catch (error: unknown) {
    if (!(error instanceof NotFoundError)) throw error;
  }
  throw new ForbiddenError('lab: AI switched off');
}

/** Accounting never costs the learner their result: a failure here is logged only. */
async function account(session: Session, usage: AiUsage, blocked: boolean): Promise<void> {
  try {
    await recordAiTokens(session, usage);
    if (blocked) await recordAiBlocked(session);
  } catch (error: unknown) {
    console.error(`[ai/lab] usage accounting failed: ${describeAiFailure(error)}`);
  }
}

export async function runLabToolAction(
  input: RunLabToolInput,
): Promise<ActionResult<{ kind: 'text'; text: string } | { kind: 'mock'; messageKey: string }>> {
  return runAction(
    runLabToolInputSchema,
    input,
    async (data, session, { locale }): Promise<LabToolResult> => {
      const tool = getLabTool(data.toolId);
      const ctx = { ageBand: session.ageBand, locale };

      if (tool.status !== 'live') {
        await assertSchoolAllowsAi(session);
        return (await runLabToolWithReport(data.toolId, { prompt: data.prompt }, ctx)).result;
      }

      const decision = await checkAndCountAiUsage(session, 'lab');
      if (!decision.allowed) {
        if (decision.reason === 'limit' || decision.reason === 'budget') {
          throw new RateLimitError(decision.retryAfterSeconds, `lab: ${decision.reason}`);
        }
        throw new ForbiddenError(`lab: ${decision.reason}`);
      }

      try {
        const report = await runLabToolWithReport(data.toolId, { prompt: data.prompt }, ctx);
        await account(session, report.usage, report.outcome === 'blocked');
        return report.result;
      } catch (error: unknown) {
        if (!(error instanceof AiError)) throw error;
        await account(session, error.usage, error.reason === 'blocked');
        console.error(`[ai/lab] ${describeAiFailure(error)}`);
        throw new AppError('internal', 'lab provider failure');
      }
    },
    { roles: ['student'] },
  );
}
