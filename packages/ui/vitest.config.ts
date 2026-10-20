import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defaultClientConditions, defaultServerConditions } from 'vite'
import { defineConfig } from 'vitest/config'

/**
 * The bundle `shiki` resolves to, as in Orbit's renderer build: without the alias,
 * `PierreDiff.test.tsx`'s "a file in a language we do not bundle still renders" would exercise the
 * real, 300+-language `shiki` instead of the bundle a host ships.
 */
const shikiBundle = resolve(import.meta.dirname, 'src/patterns/shiki-bundle.ts')

/**
 * The export condition under which `@fromorbit/doc-view` of this workspace resolves to its `src/`,
 * so the tests need no build of it first. A consumer never sets it and gets `dist/`.
 */
const SOURCE_CONDITION = '@fromorbit/source'

/**
 * The run of `bun run check`: the components with happy-dom, the repo tests in Node. The same
 * environment as Orbit's `vitest.renderer.shared.ts`, which the tests were written against.
 *
 * The docs page (`docs-site/`) runs as a third project, in happy-dom like the components: its
 * test proves the page lists every story and follows the hash, without a build.
 *
 * The tests that need a build (`tests/exports.test.ts`, `tests/consumer.test.tsx`,
 * `tests/consumer-types.test.ts`) run apart, in `bun run test:consumer`.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: /^shiki$/, replacement: shikiBundle }],
    conditions: [SOURCE_CONDITION, ...defaultClientConditions],
  },
  ssr: { resolve: { conditions: [SOURCE_CONDITION, ...defaultServerConditions] } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'ui',
          include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
          environment: 'happy-dom',
          setupFiles: ['tests/setup.ts'],
          css: false,
          // Vitest externalizes node_modules packages (loaded by Node, past Vite's plugins), so
          // without inlining `@pierre/diffs` its `import … from 'shiki'` would skip the alias.
          server: { deps: { inline: [/@pierre\/diffs/] } },
        },
      },
      {
        extends: true,
        test: {
          name: 'docs-site',
          include: ['docs-site/src/**/*.test.{ts,tsx}'],
          environment: 'happy-dom',
          setupFiles: ['tests/setup.ts'],
          css: false,
          server: { deps: { inline: [/@pierre\/diffs/] } },
        },
      },
      {
        test: {
          name: 'repo',
          include: ['tests/**/*.test.ts'],
          exclude: ['tests/exports.test.ts', 'tests/consumer-types.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
})
