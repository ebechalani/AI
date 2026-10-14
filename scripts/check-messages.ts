// Fails (exit code 1) when the message catalogs of two locales differ: a namespace file or a
// key that exists in the source locale but not in another one, or the other way round.
// Runs as part of `npm run lint`.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { DEFAULT_LOCALE, LOCALES } from '../src/lib/i18n/config';
import { NAMESPACES } from '../src/lib/i18n/namespaces';

const MESSAGES_DIR = path.join(import.meta.dirname, '..', 'src', 'messages');

const problems: string[] = [];

function namespacesOf(locale: string): string[] {
  const dir = path.join(MESSAGES_DIR, locale);
  if (!existsSync(dir)) {
    problems.push(`${locale}: the directory src/messages/${locale} does not exist`);
    return [];
  }
  return readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.slice(0, -'.json'.length));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// 'a.b.c' for every leaf. An empty object counts as a leaf so it cannot hide a missing subtree.
function leafPaths(node: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(node).flatMap(([key, value]) => {
    const keyPath = prefix ? `${prefix}.${key}` : key;
    return isRecord(value) && Object.keys(value).length > 0 ? leafPaths(value, keyPath) : [keyPath];
  });
}

function readKeys(locale: string, namespace: string): Set<string> | null {
  const label = `${locale}/${namespace}.json`;
  try {
    const parsed: unknown = JSON.parse(
      readFileSync(path.join(MESSAGES_DIR, locale, `${namespace}.json`), 'utf8'),
    );
    if (!isRecord(parsed)) {
      problems.push(`${label}: the top level must be an object`);
      return null;
    }
    return new Set(leafPaths(parsed));
  } catch (error) {
    problems.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

const known: readonly string[] = NAMESPACES;
const sourceNamespaces = namespacesOf(DEFAULT_LOCALE);

for (const namespace of sourceNamespaces) {
  if (!known.includes(namespace)) {
    problems.push(
      `${DEFAULT_LOCALE}/${namespace}.json: "${namespace}" is not listed in src/lib/i18n/namespaces.ts, so it is never loaded`,
    );
  }
}

for (const locale of LOCALES) {
  if (locale === DEFAULT_LOCALE) continue;
  const localeNamespaces = namespacesOf(locale);

  for (const namespace of localeNamespaces) {
    if (!sourceNamespaces.includes(namespace)) {
      problems.push(
        `${locale}/${namespace}.json: no ${DEFAULT_LOCALE}/${namespace}.json exists (${DEFAULT_LOCALE} is the source catalog)`,
      );
    }
  }

  for (const namespace of sourceNamespaces) {
    if (!localeNamespaces.includes(namespace)) {
      problems.push(`${locale}/${namespace}.json: file missing (${DEFAULT_LOCALE} has it)`);
      continue;
    }
    const sourceKeys = readKeys(DEFAULT_LOCALE, namespace);
    const localeKeys = readKeys(locale, namespace);
    if (!sourceKeys || !localeKeys) continue;

    for (const key of sourceKeys) {
      if (!localeKeys.has(key)) problems.push(`${locale}/${namespace}.json: missing key "${key}"`);
    }
    for (const key of localeKeys) {
      if (!sourceKeys.has(key)) {
        problems.push(
          `${locale}/${namespace}.json: key "${key}" does not exist in ${DEFAULT_LOCALE}/${namespace}.json`,
        );
      }
    }
  }
}

if (problems.length > 0) {
  const unique = [...new Set(problems)];
  console.error(`check-messages: ${unique.length} problem(s)\n`);
  for (const problem of unique) console.error(`  ${problem}`);
  process.exitCode = 1;
} else {
  console.log(
    `check-messages: ${sourceNamespaces.length} namespace(s) match across ${LOCALES.join(', ')}`,
  );
}
