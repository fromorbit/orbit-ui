import { defineConfig } from 'vitest/config'

/**
 * The tests against the build (`bun run test:consumer`): every export loads from `dist/`, and a
 * component from `dist/` renders. They need `bun run build` first, so they stay out of `check`.
 */
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'exports',
          include: ['tests/exports.test.ts', 'tests/consumer-types.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'consumer',
          include: ['tests/consumer.test.tsx'],
          environment: 'happy-dom',
          setupFiles: ['tests/setup.ts'],
        },
      },
    ],
  },
})
