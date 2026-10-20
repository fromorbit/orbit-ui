/**
 * Stands in for `shiki` itself through a build-time alias (in Orbit's `electron.vite.config.ts`,
 * here in `vitest.config.ts`), so `@pierre/diffs` gets every name it imports from `shiki` — but
 * with the twenty-five lazily loaded grammars of `@fromorbit/doc-view` instead of the real
 * package's 300+, which would weigh on every host that draws a diff.
 *
 * The bundle itself lives in `@fromorbit/doc-view`, so a document and a diff here, and a document
 * on the website, are coloured with the same grammars. This file stays a
 * target of the alias, and re-exports from `@fromorbit/doc-view/shiki-bundle`, never from `shiki`,
 * or the alias would resolve into a loop.
 */
export * from '@fromorbit/doc-view/shiki-bundle'
