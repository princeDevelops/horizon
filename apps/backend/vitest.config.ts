import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@horizon/shared',
        replacement: path.resolve(__dirname, '../../shared/src/index.ts'),
      },
      {
        find: /^@horizon\/shared\/(.*)$/,
        replacement: path.resolve(__dirname, '../../shared/src/$1'),
      },
    ],
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    setupFiles: ['test/setup/env.setup.ts'],
    clearMocks: true,
    restoreMocks: true,
  },
});
