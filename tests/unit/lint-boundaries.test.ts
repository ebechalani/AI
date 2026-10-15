import path from 'node:path';
import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

// The one exception to "components never import lib/data or lib/services" (ARCHITECTURE.md
// 1.2, 7.1): LessonPlayer loads its own data. These cases keep the exception that narrow.

const ROOT = path.resolve(import.meta.dirname, '../..');
const RULE = 'roboholic/import-boundaries';

let eslint: ESLint;

beforeAll(async () => {
  eslint = new ESLint({ cwd: ROOT });
  // The first run loads eslint.config.mjs and its plugins.
  await eslint.lintText('export {};\n', { filePath: path.join(ROOT, 'src/components/warm-up.ts') });
}, 60_000);

async function boundaryErrors(file: string, specifier: string): Promise<string[]> {
  const code = `import * as target from '${specifier}';\nexport const used = target;\n`;
  const results = await eslint.lintText(code, { filePath: path.join(ROOT, file) });
  return results
    .flatMap((result) => result.messages)
    .filter((message) => message.ruleId === RULE)
    .map((message) => message.message);
}

const PLAYER = 'src/components/lesson/LessonPlayer.tsx';

describe('import boundaries: the LessonPlayer exception', () => {
  it('lets LessonPlayer import services/learning, in either spelling', async () => {
    expect(await boundaryErrors(PLAYER, '@/lib/services/learning')).toEqual([]);
    expect(await boundaryErrors(PLAYER, '../../lib/services/learning')).toEqual([]);
  });

  it('keeps every other service and every repository closed to LessonPlayer', async () => {
    for (const specifier of ['@/lib/services/access', '@/lib/services', '@/lib/data/courses']) {
      expect(await boundaryErrors(PLAYER, specifier)).toEqual([
        expect.stringContaining("'components/lesson/LessonPlayer' must not import"),
      ]);
    }
  });

  it('keeps services/learning closed to every other component', async () => {
    for (const file of [
      'src/components/lesson/LessonContent.tsx',
      'src/components/lesson/blocks/ReflectionForm.tsx',
      'src/components/quiz/LessonPlayer.tsx',
    ]) {
      expect(await boundaryErrors(file, '@/lib/services/learning')).toEqual([
        expect.stringContaining("must not import 'lib/services/learning'"),
      ]);
    }
  });
});
