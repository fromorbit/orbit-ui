/**
 * Reading a demo's source for what it is made of: the library components it imports and the
 * `Missing` placeholders it draws.
 *
 * Read from the text rather than declared beside it, so the lists under a demo and the wishlist
 * can never drift from what the screen really holds. Plain regular expressions are enough: the
 * demos are our own files, formatted by Biome, and the test of every demo checks what it renders
 * against what is read here.
 */

/** A named import list from the library root: `import { … } from '../../src'` at any depth. */
const ROOT_IMPORT = /import\s*\{([^}]*)\}\s*from\s*['"](?:\.\.\/)+src['"]/g

/** A component name: capitalised, not a constant written in capitals. */
const COMPONENT = /^[A-Z][a-z][A-Za-z0-9]*$/

/** The `name` in the opening tag of a placeholder, wherever it stands among the props. */
const MISSING_TAG = /<Missing\b[^>]*?\bname="([^"]+)"/g

/** A relative import of a sibling file of the demos. */
const LOCAL_IMPORT = /\bfrom\s*['"](\.\.?\/[^'"]+)['"]/g

/** The components a source imports from the library root, in order of first appearance. */
export function libraryImports(source: string): string[] {
  const names = [...source.matchAll(ROOT_IMPORT)].flatMap((match) =>
    (match[1] ?? '')
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part !== '' && !part.startsWith('type '))
      .map((part) => part.split(/\s+as\s+/)[0]?.trim() ?? ''),
  )
  return unique(names.filter((name) => COMPONENT.test(name)))
}

/** The names of the `Missing` placeholders in a source, once each, in order of appearance. */
export function missingNames(source: string): string[] {
  return unique([...source.matchAll(MISSING_TAG)].map((match) => match[1] ?? ''))
}

/** The relative specifiers a source imports. */
export function localImports(source: string): string[] {
  return [...source.matchAll(LOCAL_IMPORT)].map((match) => match[1] ?? '')
}

/**
 * The glob key a relative specifier points at, without extension: from `../demos/chat.tsx`,
 * `./parts/AppFrame` is `../demos/parts/AppFrame`.
 */
export function resolveLocal(from: string, specifier: string): string {
  const parts = from.split('/').slice(0, -1)
  for (const segment of specifier.split('/')) {
    if (segment === '.') continue
    if (segment === '..' && parts.length > 0 && parts.at(-1) !== '..') parts.pop()
    else parts.push(segment)
  }
  return parts.join('/')
}

/** The array without repeats, keeping the first of each. */
function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}
