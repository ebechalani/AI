'use server';

// Stub (F8): the signature and roles of ARCHITECTURE.md 10.4; WS-I fills it in.

import { runAction } from '@/lib/actions/run-action';
import { AppError } from '@/lib/errors';
import { runLabToolInputSchema } from '@/lib/schemas/ai';
import type { ActionResult } from '@/types/actions';
import type { RunLabToolInput } from '@/types/inputs';

async function notImplemented(): Promise<never> {
  throw new AppError('not_implemented');
}

export async function runLabToolAction(
  input: RunLabToolInput,
): Promise<ActionResult<{ kind: 'text'; text: string } | { kind: 'mock'; messageKey: string }>> {
  return runAction(runLabToolInputSchema, input, notImplemented, { roles: ['student'] });
}
