// Everything here validates when it is called, never when the module loads, so importing any
// module with no environment present cannot throw and `next build` needs no variables.
// Error messages name variables and never include their values.

import { z } from 'zod';
import { AI_BUDGETS } from '@/lib/limits';

const EMULATOR_HOST_VARS = [
  'FIRESTORE_EMULATOR_HOST',
  'FIREBASE_AUTH_EMULATOR_HOST',
  'FIREBASE_STORAGE_EMULATOR_HOST',
] as const;

/** Firebase treats a project id with this prefix as offline-only; the emulators require it. */
export const EMULATOR_PROJECT_PREFIX = 'demo-';
const DEFAULT_EMULATOR_PROJECT_ID = 'demo-roboholic';
const EMULATOR_RATE_LIMIT_SECRET = 'emulator-only-rate-limit-secret';
const DEFAULT_APP_URL = 'http://localhost:3000';
const DEFAULT_ANTHROPIC_MODEL = 'claude-opus-5-5';

type RawEnv = Record<string, string | undefined>;

// An empty value (`NAME=` in an env file) means "not set".
function clean(raw: RawEnv): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, value] of Object.entries(raw)) {
    const trimmed = value?.trim();
    if (trimmed) result[name] = trimmed;
  }
  return result;
}

function parse<T>(schema: z.ZodType<T>, raw: RawEnv): T {
  const result = schema.safeParse(clean(raw));
  if (result.success) return result.data;
  const names = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
  throw new Error(`Invalid or missing environment variables: ${names.join(', ')}`);
}

// --- Client ------------------------------------------------------------------------------------

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  appId: string;
}

export interface PublicEnv {
  /** null while any of the five web-config variables is missing. */
  firebase: FirebaseWebConfig | null;
  /** Connect the Auth and Storage clients to the emulators. */
  useEmulators: boolean;
  /** Canonical origin, without a trailing slash. */
  appUrl: string;
  contactEmail: string | null;
}

const publicSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: z.enum(['true', 'false']).optional(),
  NEXT_PUBLIC_APP_URL: z.url({ protocol: /^https?$/ }).optional(),
  NEXT_PUBLIC_CONTACT_EMAIL: z.email().optional(),
});

/**
 * Never fails because a variable is absent (pages that only want the contact address are
 * prerendered with no environment); it fails on a value that is present and malformed.
 */
export function getPublicEnv(): PublicEnv {
  // Each variable is named in full: Next.js inlines `process.env.NEXT_PUBLIC_*` into the
  // browser bundle only where it is written out literally.
  const env = parse(publicSchema, {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_USE_FIREBASE_EMULATORS: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
  });

  const apiKey = env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const appId = env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const firebase =
    apiKey && authDomain && projectId && storageBucket && appId
      ? { apiKey, authDomain, projectId, storageBucket, appId }
      : null;

  return {
    firebase,
    useEmulators: env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true',
    appUrl: (env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL).replace(/\/+$/, ''),
    contactEmail: env.NEXT_PUBLIC_CONTACT_EMAIL ?? null,
  };
}

/** For the Firebase client SDK: throws when the web config is incomplete. */
export function getFirebaseWebConfig(): FirebaseWebConfig {
  const { firebase } = getPublicEnv();
  if (firebase === null) {
    throw new Error(
      'Firebase web config is incomplete: set the five NEXT_PUBLIC_FIREBASE_* variables.',
    );
  }
  return firebase;
}

// --- AI ----------------------------------------------------------------------------------------

export interface AiEnv {
  provider: 'mock' | 'anthropic';
  anthropicApiKey: string | null;
  anthropicModel: string;
  /** Platform-wide tokens per UTC day. */
  dailyTokenBudget: number;
}

const aiSchema = z.object({
  AI_PROVIDER: z.enum(['mock', 'anthropic']).default('mock'),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default(DEFAULT_ANTHROPIC_MODEL),
  AI_DAILY_TOKEN_BUDGET: z.coerce.number().int().positive().optional(),
});

/** The AI variables alone, so the AI layer and its mock provider need no Firebase credentials. */
export function getAiEnv(): AiEnv {
  const env = parse(aiSchema, {
    AI_PROVIDER: process.env.AI_PROVIDER,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
    AI_DAILY_TOKEN_BUDGET: process.env.AI_DAILY_TOKEN_BUDGET,
  });
  return {
    provider: env.AI_PROVIDER,
    anthropicApiKey: env.ANTHROPIC_API_KEY ?? null,
    anthropicModel: env.ANTHROPIC_MODEL,
    dailyTokenBudget: env.AI_DAILY_TOKEN_BUDGET ?? AI_BUDGETS.globalTokensPerDay,
  };
}

// --- Server ------------------------------------------------------------------------------------

export interface ServerEnv {
  /** True when the Admin SDK talks to the emulators. */
  isEmulator: boolean;
  firebase: {
    projectId: string;
    /** null on the emulator, which needs no service account. */
    clientEmail: string | null;
    privateKey: string | null;
    storageBucket: string;
  };
  /** HMAC key for hashing client IP addresses in rate-limit counters. */
  rateLimitSecret: string;
  ai: AiEnv;
}

const serverSchema = z.object({
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.email().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
  FIRESTORE_EMULATOR_HOST: z.string().optional(),
  FIREBASE_AUTH_EMULATOR_HOST: z.string().optional(),
  FIREBASE_STORAGE_EMULATOR_HOST: z.string().optional(),
  RATE_LIMIT_SECRET: z.string().min(16).optional(),
  VERCEL: z.string().optional(),
});

// Hosting dashboards store the key on one line, with literal \n and sometimes the quotes.
function normalizePrivateKey(key: string): string {
  return key.replace(/^"([\s\S]*)"$/, '$1').replace(/\\n/g, '\n');
}

export function getServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() was called in the browser.');
  }

  const env = parse(serverSchema, {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST,
    FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST,
    FIREBASE_STORAGE_EMULATOR_HOST: process.env.FIREBASE_STORAGE_EMULATOR_HOST,
    RATE_LIMIT_SECRET: process.env.RATE_LIMIT_SECRET,
    VERCEL: process.env.VERCEL,
  });
  const ai = getAiEnv();
  const emulatorVars = EMULATOR_HOST_VARS.filter((name) => env[name] !== undefined);

  if (emulatorVars.length > 0) {
    const projectId = env.FIREBASE_PROJECT_ID ?? DEFAULT_EMULATOR_PROJECT_ID;
    // With an emulator host set the Admin SDK accepts unsigned tokens, so that configuration
    // must never reach a deployment or a real project.
    if (env.VERCEL !== undefined) {
      throw new Error(
        `Emulator variables (${emulatorVars.join(', ')}) are set on Vercel. Remove them: they make the server accept unsigned tokens.`,
      );
    }
    if (!projectId.startsWith(EMULATOR_PROJECT_PREFIX)) {
      throw new Error(
        `Emulator variables (${emulatorVars.join(', ')}) are set, but FIREBASE_PROJECT_ID does not start with "${EMULATOR_PROJECT_PREFIX}". Remove them to use a real project.`,
      );
    }
    return {
      isEmulator: true,
      firebase: {
        projectId,
        clientEmail: null,
        privateKey: null,
        storageBucket: env.FIREBASE_STORAGE_BUCKET ?? `${projectId}.appspot.com`,
      },
      rateLimitSecret: env.RATE_LIMIT_SECRET ?? EMULATOR_RATE_LIMIT_SECRET,
      ai,
    };
  }

  const missing: string[] = [];
  const required = (name: keyof typeof env): string => {
    const value = env[name];
    if (value === undefined) missing.push(name);
    return value ?? '';
  };
  const real: ServerEnv = {
    isEmulator: false,
    firebase: {
      projectId: required('FIREBASE_PROJECT_ID'),
      clientEmail: required('FIREBASE_CLIENT_EMAIL'),
      privateKey: normalizePrivateKey(required('FIREBASE_PRIVATE_KEY')),
      storageBucket: required('FIREBASE_STORAGE_BUCKET'),
    },
    rateLimitSecret: required('RATE_LIMIT_SECRET'),
    ai,
  };
  if (missing.length > 0) {
    throw new Error(`Invalid or missing environment variables: ${missing.join(', ')}`);
  }
  return real;
}

/**
 * True when Firebase is the local emulator suite. Works on both sides: the browser only sees
 * NEXT_PUBLIC_USE_FIREBASE_EMULATORS, the server also sees the host variables, so the two
 * are set together (as in .env.example). It validates nothing; the guard is in getServerEnv().
 */
export function isEmulator(): boolean {
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') return true;
  if (typeof window !== 'undefined') return false;
  return EMULATOR_HOST_VARS.some((name) => Boolean(process.env[name]?.trim()));
}
