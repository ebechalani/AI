// Shared by every script under scripts/: which Firebase project a run talks to, the environment
// it needs, the confirmation a real project requires, argument parsing and the exit protocol.
// Nothing here initialises firebase-admin: the lazy singletons of src/lib/firebase/admin.ts
// read the environment this module has prepared on their first call.

import { existsSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { parseArgs, type ParseArgsConfig } from 'node:util';
import { getServerEnv } from '@/lib/env';
import type { Session, UserProfile } from '@/types/user';

export const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');

/** The emulator ports of firebase.json, as the Admin SDK reads them. */
const EMULATOR_HOSTS = {
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
  FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9199',
} as const;

// STORAGE_EMULATOR_HOST is the variable the Storage client library itself reads; firebase
// emulators:exec sets it next to the FIREBASE_ one.
const EMULATOR_VARIABLES = [...Object.keys(EMULATOR_HOSTS), 'STORAGE_EMULATOR_HOST'];

const DEFAULT_EMULATOR_PROJECT_ID = 'demo-roboholic';

export interface ScriptTarget {
  /** 'emulator' unless --allow-project named the project. */
  mode: 'emulator' | 'project';
  projectId: string;
}

/** An expected failure: printed as one line, without a stack, and the script exits with 1. */
export class ScriptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScriptError';
  }
}

// --- Arguments ---------------------------------------------------------------------------------

type OptionsConfig = NonNullable<ParseArgsConfig['options']>;

/** The options every script accepts. */
export const COMMON_OPTIONS = {
  'allow-project': { type: 'string' },
  'env-file': { type: 'string' },
  yes: { type: 'boolean', default: false },
  help: { type: 'boolean', short: 'h', default: false },
} as const satisfies OptionsConfig;

export const COMMON_USAGE = `  --allow-project <id>   run against the real project <id> (FIREBASE_PROJECT_ID must match);
                         without it the script talks to the emulators
  --env-file <path>      environment file to load (default: .env.local when it exists;
                         variables already set in the environment win)
  --yes                  skip the confirmation a real project asks for
  --help                 show this help`;

/**
 * Parses process.argv with the common options plus the script's own. A malformed command line
 * or --help prints the usage and ends the process.
 */
export function parseScriptArgs<const O extends OptionsConfig>(options: O, usage: string) {
  const config = {
    args: process.argv.slice(2),
    options: { ...COMMON_OPTIONS, ...options },
    allowPositionals: true,
    strict: true,
  } as const;
  let parsed: ReturnType<typeof parseArgs<typeof config>>;
  try {
    parsed = parseArgs(config);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error(`\n${usage}`);
    process.exit(2);
  }
  // Inside the generic body the parsed shape is opaque; callers see the full type.
  const values: { help?: boolean } = parsed.values;
  if (values.help === true) {
    console.log(usage);
    process.exit(0);
  }
  return parsed;
}

/** The target options of a parsed command line, for connect(). */
export function targetOptions(values: {
  'allow-project'?: string;
  'env-file'?: string;
  yes?: boolean;
}): ConnectOptions {
  return {
    allowProject: values['allow-project'] ?? null,
    envFile: values['env-file'] ?? null,
    yes: values.yes === true,
  };
}

// --- Target ------------------------------------------------------------------------------------

export interface ConnectOptions {
  allowProject: string | null;
  envFile: string | null;
  yes: boolean;
}

function loadEnvironmentFile(envFile: string | null): void {
  const file = envFile === null ? path.join(REPO_ROOT, '.env.local') : path.resolve(envFile);
  if (!existsSync(file)) {
    if (envFile === null) return;
    throw new ScriptError(`--env-file ${envFile}: the file does not exist.`);
  }
  process.loadEnvFile(file);
  console.log(
    `Environment: ${path.relative(REPO_ROOT, file) || file} (variables already set win).`,
  );
}

/**
 * Prepares the environment and decides the target (ARCHITECTURE.md 11.6): the emulators unless
 * --allow-project names the real project, which then has to match FIREBASE_PROJECT_ID, must
 * not be mixed with emulator variables, and is confirmed on the terminal unless --yes is given.
 * getServerEnv() applies its own guard (a project id that must start with "demo-" while the
 * emulator variables are set) and names any missing variable of a real project.
 */
export async function connect(options: ConnectOptions): Promise<ScriptTarget> {
  loadEnvironmentFile(options.envFile);

  if (options.allowProject === null) {
    for (const [name, host] of Object.entries(EMULATOR_HOSTS)) process.env[name] ??= host;
    process.env.FIREBASE_PROJECT_ID ??= process.env.GCLOUD_PROJECT ?? DEFAULT_EMULATOR_PROJECT_ID;
    const env = getServerEnv();
    console.log(
      `Target: the Firebase emulators (project ${env.firebase.projectId}, Firestore at ${process.env.FIRESTORE_EMULATOR_HOST}).`,
    );
    return { mode: 'emulator', projectId: env.firebase.projectId };
  }

  const set = EMULATOR_VARIABLES.filter((name) => Boolean(process.env[name]?.trim()));
  if (set.length > 0) {
    throw new ScriptError(
      `--allow-project refuses to run while ${set.join(', ')} ${set.length === 1 ? 'is' : 'are'} set. Unset them, or pass --env-file with the environment of the real project.`,
    );
  }
  const env = getServerEnv();
  if (env.isEmulator) throw new ScriptError('The environment still points at the emulators.');
  if (env.firebase.projectId !== options.allowProject) {
    throw new ScriptError(
      `--allow-project ${options.allowProject} does not match FIREBASE_PROJECT_ID (${env.firebase.projectId}).`,
    );
  }

  console.warn(`\nTarget: the REAL Firebase project ${env.firebase.projectId}.`);
  if (!options.yes && !(await confirm('Continue?'))) throw new ScriptError('Aborted.');
  return { mode: 'project', projectId: env.firebase.projectId };
}

/** Asks on the terminal; answers false when there is no terminal to ask on. */
export async function confirm(question: string): Promise<boolean> {
  if (!process.stdin.isTTY) {
    console.error('There is no terminal to confirm on; pass --yes to confirm.');
    return false;
  }
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await readline.question(`${question} [y/N] `);
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    readline.close();
  }
}

// --- Actors ------------------------------------------------------------------------------------

/** The session a signed-in user would have, built from their profile, for acting as them. */
export function sessionOf(profile: UserProfile): Session {
  return {
    uid: profile.id,
    role: profile.role,
    schoolId: profile.schoolId,
    classIds: profile.classIds,
    displayName: profile.displayName,
    locale: profile.locale,
    ageBand: profile.ageBand,
    avatarId: profile.avatarId,
    verifiedEducator: profile.verifiedEducator,
  };
}

// --- Output and exit ---------------------------------------------------------------------------

export function step(title: string): void {
  console.log(`\n== ${title}`);
}

function flushStdout(): Promise<void> {
  return new Promise((resolve) => {
    process.stdout.write('', () => resolve());
  });
}

/**
 * Runs a script's main function and ends the process explicitly: firebase-admin keeps gRPC
 * channels open, which would otherwise keep a finished script alive.
 */
export function runScript(main: () => Promise<void>): void {
  main().then(
    async () => {
      await flushStdout();
      process.exit(0);
    },
    async (error: unknown) => {
      if (error instanceof ScriptError) console.error(`\n${error.message}`);
      else console.error('\n', error);
      await flushStdout();
      process.exit(1);
    },
  );
}
