import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// Both suites share one emulator instance, so their files must not run concurrently.
const emulatorSuite = { fileParallelism: false, testTimeout: 30_000, hookTimeout: 60_000 };

export default defineConfig({
  resolve: {
    alias: {
      '@': fromRoot('./src'),
      // 'server-only' throws unless the react-server condition is active; its own empty
      // module lets tests import src/lib/** files that start with it.
      'server-only': fromRoot('./node_modules/server-only/empty.js'),
    },
  },
  test: {
    environment: 'node',
    projects: [
      { extends: true, test: { name: 'unit', include: ['tests/unit/**/*.test.ts'] } },
      {
        extends: true,
        test: { name: 'rules', include: ['tests/rules/**/*.test.ts'], ...emulatorSuite },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          ...emulatorSuite,
        },
      },
    ],
  },
});
