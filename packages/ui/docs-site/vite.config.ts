import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defaultClientConditions, defineConfig } from 'vite'

/** The library's Shiki bundle, as in `vitest.config.ts` and in Orbit's renderer build. */
const shikiBundle = resolve(import.meta.dirname, '../src/patterns/shiki-bundle.ts')

/**
 * The build of the docs page: a static site in `docs-site/dist`, with relative asset paths
 * (`base: './'`), so it works under any sub path — `fromorbit.github.io/orbit-ui-docs/` — and the
 * hash carries the route. `public/.nojekyll` lands in the build, so GitHub Pages serves it as is.
 *
 * `shiki` points at the library's bundle by an exact match only: `@pierre/diffs` also imports
 * `shiki/core` and the engines, which must stay the real subpaths.
 */
export default defineConfig({
  root: import.meta.dirname,
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [{ find: /^shiki$/, replacement: shikiBundle }],
    // `@fromorbit/doc-view` of this workspace from its source, so the page needs no build of it.
    conditions: ['@fromorbit/source', ...defaultClientConditions],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // One page of every component; a warning about its size says nothing here.
    chunkSizeWarningLimit: 4096,
  },
})
