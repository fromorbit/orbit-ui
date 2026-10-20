import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { defineConfig } from 'tsup'

/** A relative specifier in an import, an export-from or a dynamic `import()`. */
const RELATIVE = /(\bfrom\s*|\bimport\s*\(?\s*)(['"])(\.\.?(?:\/[^'"]*)?)\2/g

/** The files the `exports` of `package.json` point at. */
const ENTRIES = ['src/index.ts', 'src/gallery/index.ts', 'src/testing/index.ts']

/**
 * The peer dependencies plus `class-variance-authority`: every one stays an import, so a consumer
 * has one copy of React, Radix and the rest.
 */
const EXTERNAL = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'radix-ui',
  'lucide-react',
  'class-variance-authority',
  '@pierre/diffs',
  '@pierre/trees',
  'react-markdown',
  'remark-gfm',
  '@fromorbit/doc-view',
  '@testing-library/react',
]

/** The source file a relative specifier names: a `.ts` or `.tsx` file, or a folder's index. */
function sourceOf(from: string, specifier: string): string | undefined {
  const base = resolve(dirname(from), specifier)
  return [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')].find(
    (file) => existsSync(file),
  )
}

/**
 * Every source module the entries reach through relative imports, as paths relative to `root`.
 *
 * Only what an export reaches is built, so a test beside a component does not ship.
 */
export function sourceModules(entry: readonly string[], root: string): string[] {
  const found = new Set<string>()
  const visit = (file: string) => {
    if (found.has(file)) return
    found.add(file)
    for (const [, , , specifier] of readFileSync(file, 'utf8').matchAll(RELATIVE)) {
      const target = sourceOf(file, specifier ?? '')
      if (target) visit(target)
    }
  }
  for (const file of entry) visit(resolve(root, file))
  return [...found].map((file) => relative(root, file)).sort()
}

/**
 * Gives every relative specifier of an emitted file its `.js` (or `/index.js`), as Node's ESM
 * loader needs; the source leaves them out (`moduleResolution: bundler`).
 */
function withExtensions(code: string, output: string, root: string): string {
  const source = resolve(root, 'src', relative(resolve(root, 'dist'), output)).replace(
    /\.js$/,
    '.ts',
  )
  return code.replace(RELATIVE, (match, lead: string, quote: string, specifier: string) => {
    const target = sourceOf(source, specifier)
    if (!target) return match
    const index = /[\\/]index\.tsx?$/.test(target) && !/\/index$/.test(specifier)
    const spelled = index ? `${specifier.replace(/\/$/, '')}/index.js` : `${specifier}.js`
    return `${lead}${quote}${spelled}${quote}`
  })
}

/**
 * The build of `@fromorbit/ui`: one ES module per source module under `dist/`, at the same path
 * as in `src/`.
 *
 * Not minified and not bundled: a consumer's Tailwind scans `dist/` with `@source`, so every class
 * string has to stay literal, and a consumer's bundler can drop a module nobody imports. The
 * `.d.ts` files come from `tsc -p tsconfig.build.json`; `tokens.css` is copied by the build script.
 */
export default defineConfig({
  entry: sourceModules(ENTRIES, process.cwd()),
  bundle: false,
  format: ['esm'],
  outDir: 'dist',
  outExtension: () => ({ js: '.js' }),
  platform: 'neutral',
  target: 'es2023',
  sourcemap: true,
  minify: false,
  clean: true,
  dts: false,
  external: EXTERNAL,
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
  plugins: [
    {
      name: 'relative-extensions',
      renderChunk(code, chunk) {
        if (!chunk.path.endsWith('.js')) return
        return { code: withExtensions(code, chunk.path, process.cwd()) }
      },
    },
  ],
})
