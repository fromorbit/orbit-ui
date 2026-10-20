import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * The run of `bun run check` for `@fromorbit/doc-view`: the components in happy-dom, with the
 * tests in `test/` rather than beside the source, so `src/` is exactly what a consumer that keeps
 * its own copy takes over.
 *
 * The test against the build (`consumer/consumer.test.ts`) runs apart, in `bun run test:consumer`.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    name: 'doc-view',
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    environment: 'happy-dom',
    setupFiles: ['test/setup.ts'],
    css: false,
    // The boundary test runs Biome once per probe; that can outlast 5 s.
    testTimeout: 60_000,
  },
})
