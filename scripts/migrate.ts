// Runs the migrations of scripts/migrations in file order and records each one in
// meta/migrations (ARCHITECTURE.md 3.4). A recorded migration is skipped unless --rerun is
// given; every migration is written so that running it again is harmless.
//
//   npm run migrate                       against the emulators
//   npm run migrate -- --rerun            apply every migration again (repairs reference data)
//   npm run migrate -- --allow-project <id> [--yes]

import { readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { migrationsDoc } from '@/lib/firebase/collections';
import { serverTimestamp } from '@/lib/firebase/converters';
import {
  COMMON_USAGE,
  connect,
  parseScriptArgs,
  runScript,
  ScriptError,
  step,
  targetOptions,
} from './lib/admin';

/** What a file of scripts/migrations exports. */
export interface Migration {
  /** Equal to the file stem, e.g. '0001_initial'. */
  id: string;
  description: string;
  up(): Promise<void>;
}

const MIGRATIONS_DIR = path.join(import.meta.dirname, 'migrations');
const FILE_PATTERN = /^(\d{4}_[a-z0-9-]+)\.ts$/;

const USAGE = `Usage: npm run migrate -- [options]

Applies scripts/migrations/NNNN_*.ts in order and records them in meta/migrations.

  --rerun                apply migrations that are already recorded, too
${COMMON_USAGE}`;

function isMigration(value: unknown): value is Migration {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Migration).id === 'string' &&
    typeof (value as Migration).description === 'string' &&
    typeof (value as Migration).up === 'function'
  );
}

function migrationFiles(): { id: string; file: string }[] {
  return readdirSync(MIGRATIONS_DIR)
    .map((name) => ({ name, match: FILE_PATTERN.exec(name) }))
    .filter((entry) => entry.match !== null)
    .map((entry) => ({ id: entry.match![1]!, file: path.join(MIGRATIONS_DIR, entry.name) }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

async function loadMigration(id: string, file: string): Promise<Migration> {
  const loaded: unknown = await import(pathToFileURL(file).href);
  if (!isMigration(loaded)) {
    throw new ScriptError(`${path.basename(file)} does not export id, description and up().`);
  }
  if (loaded.id !== id) {
    throw new ScriptError(`${path.basename(file)} exports id "${loaded.id}"; expected "${id}".`);
  }
  return loaded;
}

async function main(): Promise<void> {
  const { values } = parseScriptArgs({ rerun: { type: 'boolean', default: false } }, USAGE);
  await connect(targetOptions(values));

  const recorded = ((await migrationsDoc().get()).get('applied') ?? {}) as Record<string, unknown>;
  const files = migrationFiles();
  if (files.length === 0) throw new ScriptError(`No migration found in ${MIGRATIONS_DIR}.`);

  let applied = 0;
  for (const { id, file } of files) {
    if (Object.hasOwn(recorded, id) && values.rerun !== true) {
      console.log(`-- ${id}: already applied`);
      continue;
    }
    const migration = await loadMigration(id, file);
    step(`${id}: ${migration.description}`);
    await migration.up();
    await migrationsDoc().set({ applied: { [id]: serverTimestamp() } }, { merge: true });
    applied += 1;
    console.log(`   recorded in meta/migrations`);
  }
  console.log(`\nmigrate: ${applied} applied, ${files.length - applied} skipped.`);
}

runScript(main);
