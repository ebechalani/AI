import { getTranslations } from 'next-intl/server';
import { getAiEnv, getPublicEnv, getServerEnv } from '@/lib/env';
import { getAdminApp, getAdminDb } from '@/lib/firebase/admin';
import { LOCALES } from '@/lib/i18n/config';
import { NAMESPACES } from '@/lib/i18n/namespaces';

// GET /api/health: a self-check of a deployment, for whoever deploys it. It answers which step
// of serving a page works on this server (configuration, message catalogs, the i18n request
// config, the service-account key, Firestore) and, for a step that fails, the error's name and
// message. It reveals no value: the configuration checks name missing or invalid variables
// only, and a failure is cut to its first line. Always 200, so the report itself is readable;
// `ok` says the verdict.

export const dynamic = 'force-dynamic';

interface Step {
  name: string;
  ok: boolean;
  ms: number;
  detail?: string;
}

function describe(error: unknown): string {
  if (!(error instanceof Error)) return 'Unknown error';
  const code = (error as { code?: unknown }).code;
  const firstLine = error.message.split('\n')[0]?.slice(0, 240) ?? '';
  return `${error.name}${typeof code === 'string' || typeof code === 'number' ? ` (${code})` : ''}: ${firstLine}`;
}

async function step(name: string, run: () => unknown, steps: Step[]): Promise<void> {
  const started = Date.now();
  try {
    const detail = await run();
    steps.push({
      name,
      ok: true,
      ms: Date.now() - started,
      ...(typeof detail === 'string' ? { detail } : {}),
    });
  } catch (error) {
    steps.push({ name, ok: false, ms: Date.now() - started, detail: describe(error) });
  }
}

function isModuleNotFound(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    (error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND' ||
    error.message.startsWith('Cannot find module')
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`timed out after ${ms} ms`)), ms)),
  ]);
}

export async function GET(): Promise<Response> {
  const steps: Step[] = [];

  await step('public configuration', () => {
    const env = getPublicEnv();
    return `firebase web config ${env.firebase === null ? 'MISSING' : 'complete'}, app URL ${env.appUrl}`;
  }, steps);
  await step('server configuration', () => {
    const env = getServerEnv();
    return env.isEmulator ? 'emulator mode' : `project ${env.firebase.projectId}`;
  }, steps);
  await step('AI configuration', () => `provider ${getAiEnv().provider}`, steps);

  for (const locale of LOCALES) {
    // As in src/lib/i18n/request.ts, a namespace whose file is not written yet is empty, not
    // an error; a file that exists and does not load is.
    await step(`messages ${locale}`, async () => {
      const absent: string[] = [];
      const broken: string[] = [];
      for (const namespace of NAMESPACES) {
        try {
          await import(`../../../messages/${locale}/${namespace}.json`);
        } catch (error) {
          (isModuleNotFound(error) ? absent : broken).push(namespace);
        }
      }
      if (broken.length > 0) throw new Error(`cannot load ${broken.join(', ')}`);
      const loaded = `${NAMESPACES.length - absent.length} of ${NAMESPACES.length} namespaces`;
      return absent.length > 0 ? `${loaded} (not written yet: ${absent.join(', ')})` : loaded;
    }, steps);
    await step(`translations ${locale}`, async () => {
      const t = await getTranslations({ locale, namespace: 'common' });
      return t('appName');
    }, steps);
  }

  // Asks Google for an access token with the service-account key: tells a key that does not
  // parse or that Google refuses (deleted, from another project) from a Firestore problem.
  await step('service account key', async () => {
    const credential = getAdminApp().options.credential;
    if (!credential) return 'none (emulator mode)';
    const token = await withTimeout(credential.getAccessToken(), 8_000);
    return `accepted by Google (token valid for ${token.expires_in} s)`;
  }, steps);

  await step('firestore read', async () => {
    const snapshot = await withTimeout(getAdminDb().collection('pathways').limit(1).get(), 8_000);
    return `${snapshot.size} document(s)`;
  }, steps);

  const body = {
    ok: steps.every((entry) => entry.ok),
    node: process.version,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? null,
    region: process.env.VERCEL_REGION ?? null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    steps,
  };
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' } });
}
