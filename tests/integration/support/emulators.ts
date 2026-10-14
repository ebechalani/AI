// Emulator plumbing shared by the integration files (ARCHITECTURE.md 11.1): the environment
// the server code reads, a clean slate, the migration and the seed as the scripts run them,
// and the two Auth emulator endpoints a browser would call.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAdminBucket } from '@/lib/firebase/admin';

export const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));

/** The ports of firebase.json, for a run outside `firebase emulators:exec`. */
const EMULATOR_HOSTS = {
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
  FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9199',
} as const;

for (const [name, host] of Object.entries(EMULATOR_HOSTS)) process.env[name] ??= host;
process.env.FIREBASE_PROJECT_ID ??= process.env.GCLOUD_PROJECT ?? 'demo-roboholic';
process.env.AI_PROVIDER ??= 'mock';

export const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;

const AUTH_ORIGIN = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`;
const FIRESTORE_ORIGIN = `http://${process.env.FIRESTORE_EMULATOR_HOST}`;

async function expectOk(response: Response, what: string): Promise<void> {
  if (!response.ok) throw new Error(`${what} failed: ${response.status} ${await response.text()}`);
}

// --- A clean slate -----------------------------------------------------------------------------

export async function clearAuth(): Promise<void> {
  const response = await fetch(`${AUTH_ORIGIN}/emulator/v1/projects/${PROJECT_ID}/accounts`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer owner' },
  });
  await expectOk(response, 'Clearing the Auth emulator');
}

export async function clearFirestore(): Promise<void> {
  const response = await fetch(
    `${FIRESTORE_ORIGIN}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' },
  );
  await expectOk(response, 'Clearing the Firestore emulator');
}

/** The default bucket may not exist yet on a fresh emulator; then there is nothing to delete. */
export async function clearStorage(): Promise<void> {
  try {
    await getAdminBucket().deleteFiles({ force: true });
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : null;
    if (code !== 404) throw error;
  }
}

/** The rules suite shares the emulator instance in sequence, so every file starts from nothing. */
export async function resetEmulators(): Promise<void> {
  await clearAuth();
  await clearFirestore();
  await clearStorage();
}

// --- The scripts -------------------------------------------------------------------------------

const TSX_CLI = path.join(REPO_ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs');

/** Runs a script of scripts/ exactly as its npm script does, against the same emulators. */
export function runScript(script: string, args: string[] = []): string {
  const result = spawnSync(
    process.execPath,
    [TSX_CLI, '--conditions=react-server', script, ...args],
    {
      cwd: REPO_ROOT,
      env: process.env,
      encoding: 'utf8',
      timeout: 240_000,
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${script} exited with ${result.status}\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
}

/** The reference data and the demo world of 11.6, as `npm run migrate` and `npm run seed` write them. */
export function seedEmulators(): void {
  runScript('scripts/migrate.ts');
  runScript('scripts/seed/index.ts');
}

// --- Auth emulator REST (what the Firebase client SDK would call) -------------------------------

interface TokenResponse {
  idToken: string;
  localId: string;
}

async function identityToolkit(method: string, body: object): Promise<TokenResponse> {
  const response = await fetch(
    `${AUTH_ORIGIN}/identitytoolkit.googleapis.com/v1/accounts:${method}?key=emulator`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, returnSecureToken: true }),
    },
  );
  const json = (await response.json()) as Partial<TokenResponse> & { error?: { message?: string } };
  if (!response.ok || typeof json.idToken !== 'string' || typeof json.localId !== 'string') {
    throw new Error(`accounts:${method} failed: ${json.error?.message ?? response.status}`);
  }
  return { idToken: json.idToken, localId: json.localId };
}

/** A fresh ID token for an existing account, as the login form obtains one. */
export function signInWithPassword(
  email: string,
  password: string,
): Promise<{ idToken: string; uid: string }> {
  return identityToolkit('signInWithPassword', { email, password }).then((token) => ({
    idToken: token.idToken,
    uid: token.localId,
  }));
}

/** The browser's half of self sign-up (section 1.5, path 1): the Auth user, not yet verified. */
export function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ idToken: string; uid: string }> {
  return identityToolkit('signUp', { email, password }).then((token) => ({
    idToken: token.idToken,
    uid: token.localId,
  }));
}
