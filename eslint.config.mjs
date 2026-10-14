import path from 'node:path';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const SRC_DIR = path.join(import.meta.dirname, 'src');
const code = (dir) => `${dir}/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}`;

// ---------------------------------------------------------------------------------------------
// Banned imports (docs/ARCHITECTURE.md 1.1, 1.6, 2, 9)
// ---------------------------------------------------------------------------------------------

const FIRESTORE_CLIENT = {
  group: ['firebase/firestore', '@firebase/firestore'],
  message:
    'The client SDK is for Auth and Storage only. Firestore is reached through src/lib/data (Admin SDK).',
};
const ADMIN_SDK = {
  group: ['firebase-admin'],
  message: 'firebase-admin is used only under src/lib and scripts.',
};
const NEXT_LINK = {
  group: ['next/link'],
  message: "Use Link from '@/lib/i18n/navigation' so the link keeps the locale.",
};
const UNAUTHORIZED_INTERNALS = {
  group: [
    '**/lib/gamification/award',
    '**/lib/gamification/certificates',
    '**/lib/gamification/events',
    '**/lib/services/identity',
  ],
  message:
    'This module performs no authorization. Call a service that authorizes first (ARCHITECTURE.md 1.6, 9).',
};
const SYSTEM_ACTOR = {
  group: ['**/lib/auth/actor'],
  importNames: ['SYSTEM_ACTOR'],
  message:
    'SYSTEM_ACTOR passes every authorization check and must stay out of request-handling code.',
};

const REQUEST_HANDLING = [code('src/app'), code('src/actions'), code('src/components')];

// A later block that matches the same file replaces the whole option list of an earlier one,
// so the five scopes below cover disjoint sets of files.
const BANNED_IMPORT_SCOPES = [
  {
    files: REQUEST_HANDLING,
    bans: [FIRESTORE_CLIENT, ADMIN_SDK, NEXT_LINK, UNAUTHORIZED_INTERNALS, SYSTEM_ACTOR],
  },
  {
    files: [code('src')],
    ignores: [...REQUEST_HANDLING, code('src/lib')],
    bans: [FIRESTORE_CLIENT, ADMIN_SDK, NEXT_LINK],
  },
  {
    files: [code('src/lib')],
    ignores: [code('src/lib/i18n')],
    bans: [FIRESTORE_CLIENT, NEXT_LINK],
  },
  { files: [code('src/lib/i18n')], bans: [FIRESTORE_CLIENT] },
  { files: [code('**')], ignores: [code('src'), code('scripts')], bans: [ADMIN_SDK] },
];

// The gitignore reading that no-restricted-imports gives a group entry: one that starts with
// `**/` or has no slash matches at any depth, any other one from the start of the specifier,
// and all of them include what lies below.
function toSpecifierPattern(group) {
  const floating = group.startsWith('**/') || !group.includes('/');
  const tail = group.replace(/^\*\*\//, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`${floating ? '(?:^|/)' : '^'}${tail}(?:/|$)`);
}

// no-restricted-imports reads static import and export-from declarations only. This rule
// applies the same lists to import() and to import('…') types. Neither names what it uses, so
// a ban on single names (SYSTEM_ACTOR) refuses the whole module here.
const bannedDynamicImports = {
  meta: {
    type: 'problem',
    schema: [{ type: 'array', items: { type: 'object' } }],
    messages: { banned: "'{{source}}' must not be imported here. {{message}}" },
  },
  create(context) {
    const bans = (context.options[0] ?? []).map(({ group, message }) => ({
      patterns: group.map(toSpecifierPattern),
      message,
    }));

    function check(source) {
      if (source?.type !== 'Literal' || typeof source.value !== 'string') return;
      const specifier = source.value;
      const ban = bans.find(({ patterns }) => patterns.some((pattern) => pattern.test(specifier)));
      if (ban) {
        context.report({
          node: source,
          messageId: 'banned',
          data: { source: specifier, message: ban.message },
        });
      }
    }

    return {
      ImportExpression: (node) => check(node.source),
      TSImportType: (node) => check(node.source),
    };
  },
};

// ---------------------------------------------------------------------------------------------
// Dependency direction (docs/ARCHITECTURE.md 1.2, 7.1)
// ---------------------------------------------------------------------------------------------

const GAMIFICATION_INTERNALS = [
  'lib/gamification/award',
  'lib/gamification/certificates',
  'lib/gamification/events',
];

// Zones are module ids relative to src/ and match a file or everything under a directory.
// `only` closes a zone: internal imports must land in the listed zones (and packages in
// `onlyPackages`, when given). `forbid` blocks single edges; `allow` and `exceptions` reopen
// part of what the same entry forbids.
const BOUNDARIES = [
  {
    from: ['lib/schemas', 'lib/limits', 'types'],
    only: ['lib/schemas', 'lib/limits', 'types', 'lib/i18n/config', 'lib/avatars'],
    onlyPackages: ['zod'],
    reason:
      'schemas, limits and types import only each other, zod and the constant lists i18n/config and avatars (1.2)',
  },
  {
    from: ['lib/i18n/config', 'lib/avatars'],
    only: [],
    onlyPackages: [],
    reason: 'the constant lists that schemas and types build on import nothing (1.2)',
  },
  {
    from: ['lib/ai'],
    only: ['lib/ai', 'lib/env', 'lib/limits', 'types'],
    reason: 'lib/ai depends on nothing but env, limits and types (1.2)',
  },
  {
    from: ['lib', 'types'],
    forbid: ['app', 'actions', 'components'],
    exceptions: [['lib/auth/client', 'actions/session']],
    reason: 'nothing in lib or types imports from app, actions or components (1.2)',
  },
  {
    from: ['actions'],
    forbid: ['app', 'components'],
    reason: 'actions depend on services, data, schemas and types, never on UI (1.2)',
  },
  {
    from: ['components'],
    forbid: ['app', 'lib/data', 'lib/services'],
    reason: 'pages fetch, components render; components reach the server through actions (7.1)',
  },
  {
    from: ['components/ui'],
    forbid: ['components'],
    allow: ['components/ui'],
    reason: 'ui primitives import no other component tier (7.1)',
  },
  {
    from: ['components/domain'],
    forbid: ['components'],
    allow: ['components/ui', 'components/domain'],
    reason: 'domain components import only from ui (7.1)',
  },
  {
    from: ['components/layout'],
    forbid: ['components'],
    allow: ['components/ui', 'components/domain', 'components/layout'],
    reason: 'layout components import only from ui and domain (7.1)',
  },
  {
    from: ['lib/services'],
    forbid: ['lib/services/provisioning'],
    allowFrom: ['lib/services/provisioning'],
    reason: 'no service imports provisioning (1.2)',
  },
  {
    from: ['lib/gamification'],
    forbid: ['lib/services'],
    reason: 'gamification depends on data, never on services (1.2)',
  },
  {
    from: ['lib/data'],
    forbid: [
      'lib/services',
      ...GAMIFICATION_INTERNALS,
      'lib/auth/session',
      'lib/auth/claims',
      'lib/auth/client',
    ],
    reason:
      'repositories sit below services, gamification and the session; from auth they use actor and authz (1.2)',
  },
  {
    from: ['lib/auth'],
    forbid: ['lib/data', 'lib/services', ...GAMIFICATION_INTERNALS],
    exceptions: [
      ['lib/auth/session', 'lib/data/users'],
      ['lib/auth/claims', 'lib/data/users'],
    ],
    reason: 'under auth only session.ts and claims.ts import data, and only data/users (1.2)',
  },
  {
    from: ['lib/firebase'],
    forbid: ['lib/data', 'lib/services', ...GAMIFICATION_INTERNALS],
    reason: 'firebase is the layer below data (1.2)',
  },
];

const within = (id, zones) => zones.some((zone) => id === zone || id.startsWith(`${zone}/`));

function toModuleId(absolutePath) {
  const relative = path.relative(SRC_DIR, absolutePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return relative
    .split(path.sep)
    .join('/')
    .replace(/\.[cm]?[jt]sx?$/, '')
    .replace(/\/index$/, '');
}

function violates(boundary, fromId, target) {
  if (boundary.allowFrom && within(fromId, boundary.allowFrom)) return false;
  if (target.packageName !== undefined) {
    return (
      boundary.onlyPackages !== undefined && !within(target.packageName, boundary.onlyPackages)
    );
  }
  if (boundary.exceptions?.some(([from, to]) => fromId === from && within(target.id, [to]))) {
    return false;
  }
  if (boundary.only) return !within(target.id, boundary.only);
  return within(target.id, boundary.forbid) && !within(target.id, boundary.allow ?? []);
}

const importBoundaries = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      forbidden: "'{{from}}' must not import '{{to}}': {{reason}}. See docs/ARCHITECTURE.md.",
    },
  },
  create(context) {
    const fromId = toModuleId(context.filename);
    if (fromId === null) return {};
    const boundaries = BOUNDARIES.filter((boundary) => within(fromId, boundary.from));
    if (boundaries.length === 0) return {};

    function resolve(specifier) {
      if (specifier.startsWith('@/'))
        return { id: toModuleId(path.join(SRC_DIR, specifier.slice(2))) };
      if (specifier.startsWith('.')) {
        return { id: toModuleId(path.resolve(path.dirname(context.filename), specifier)) };
      }
      return { packageName: specifier };
    }

    function check(source) {
      if (source?.type !== 'Literal' || typeof source.value !== 'string') return;
      const target = resolve(source.value);
      if (target.id === null) return;
      const broken = boundaries.find((boundary) => violates(boundary, fromId, target));
      if (broken) {
        context.report({
          node: source,
          messageId: 'forbidden',
          data: { from: fromId, to: target.id ?? target.packageName, reason: broken.reason },
        });
      }
    }

    return {
      ImportDeclaration: (node) => check(node.source),
      ExportNamedDeclaration: (node) => check(node.source),
      ExportAllDeclaration: (node) => check(node.source),
      ImportExpression: (node) => check(node.source),
      TSImportType: (node) => check(node.source),
    };
  },
};

const roboholic = {
  rules: {
    'banned-dynamic-imports': bannedDynamicImports,
    'import-boundaries': importBoundaries,
  },
};

const bannedImports = BANNED_IMPORT_SCOPES.map(({ bans, ...scope }, index) => ({
  name: `roboholic/banned-imports-${index + 1}`,
  ...scope,
  plugins: { roboholic },
  rules: {
    'no-restricted-imports': ['error', { patterns: bans }],
    'roboholic/banned-dynamic-imports': ['error', bans],
  },
}));

// ---------------------------------------------------------------------------------------------
// Logical Tailwind utilities only (docs/ARCHITECTURE.md 2)
// ---------------------------------------------------------------------------------------------

// A class token is whitespace-delimited and may carry variants (`md:`), `!` and a minus sign.
// The trailing lookaheads keep `rounded-lg`, `border-red-500` and `text-left-foo` legal while
// `rounded-l`, `rounded-l-lg` and `border-r-2` are caught. esquery cannot parse a `/` inside
// the pattern, so none is used.
const PHYSICAL_CLASS = String.raw`(?:^|[\s:!])-?(?:(?:ml|mr|pl|pr|left|right|start|end)-|text-(?:left|right)(?![\w-])|(?:rounded|border)-[lr](?!\w))`;
const PHYSICAL_CLASS_MESSAGE =
  'Physical-direction Tailwind class. Use the logical utility (ms-*, me-*, ps-*, pe-*, inset-s-*, inset-e-*, text-start, text-end, border-s, border-e, rounded-s, rounded-e) so RTL needs no component changes.';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    '.emulator-data/**',
    'next-env.d.ts',
  ]),
  ...bannedImports,
  {
    name: 'roboholic/src',
    files: [code('src')],
    plugins: { roboholic },
    rules: {
      'roboholic/import-boundaries': 'error',
      'no-restricted-syntax': [
        'error',
        { selector: `Literal[value=/${PHYSICAL_CLASS}/]`, message: PHYSICAL_CLASS_MESSAGE },
        {
          selector: `TemplateElement[value.raw=/${PHYSICAL_CLASS}/]`,
          message: PHYSICAL_CLASS_MESSAGE,
        },
      ],
    },
  },
]);
