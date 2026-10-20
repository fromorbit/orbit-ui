// Rewrites the relative specifiers in a package's emitted `.d.ts` files to what NodeNext needs:
// `./types` becomes `./types.js`, a folder becomes `./folder/index.js`. The source leaves the
// extensions out (`moduleResolution: bundler`), and `tsc` copies the specifiers as written, so
// without this step a NodeNext consumer cannot resolve a sibling and sees no export (TS2305).
// The JavaScript gets the same treatment from `tsup.shared.ts`. Run from a package folder, after `tsc`.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

/** A relative specifier in an import, an export-from or an `import()` type. */
const RELATIVE = /(\bfrom\s*|\bimport\s*\(\s*)(['"])(\.\.?(?:\/[^'"]*)?)\2/g

/** The specifier with the extension NodeNext needs, or the specifier itself when nothing matches. */
export function withExtension(file, specifier) {
  const base = resolve(dirname(file), specifier)
  if (existsSync(`${base}.d.ts`)) return `${specifier}.js`
  if (existsSync(join(base, 'index.d.ts'))) return `${specifier.replace(/\/$/, '')}/index.js`
  return specifier
}

function declarations(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return declarations(path)
    return name.endsWith('.d.ts') ? [path] : []
  })
}

/** Rewrites every `.d.ts` under `dist`; returns how many files changed. */
export function fixDeclarations(dist) {
  let changed = 0
  for (const file of declarations(dist)) {
    const before = readFileSync(file, 'utf8')
    const after = before.replace(RELATIVE, (_, lead, quote, specifier) => {
      return `${lead}${quote}${withExtension(file, specifier)}${quote}`
    })
    if (after !== before) {
      writeFileSync(file, after)
      changed++
    }
  }
  return changed
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fixDeclarations(resolve(process.cwd(), 'dist'))
}
