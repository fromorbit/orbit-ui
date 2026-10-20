import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

/** The library's source, which every guard here walks. */
export const SRC = resolve(import.meta.dirname, '..', '..', 'src')

/** A path under `src/` written with slashes on any platform, as the guards' lists write it. */
export function underSrc(path: string): string {
  return relative(SRC, path).split(sep).join('/')
}

/**
 * Every file under `directory` whose name matches `extension`, tests left out: a string in a test
 * is an assertion about a class list or an element, not one itself.
 */
export function sources(extension: RegExp, directory = SRC): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = join(directory, entry.name)
    if (entry.isDirectory()) return sources(extension, full)
    return extension.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [full] : []
  })
}

/** A file's text. */
export function read(path: string): string {
  return readFileSync(path, 'utf8')
}

/**
 * Removes `//` line comments and `/* … *\/` block comments, respecting string and template
 * literals so a `//` inside one (as in `'https://…'`) is never mistaken for a comment start.
 *
 * The guards scan raw source with regexes rather than a parser; without this, a `<button>` or a
 * class written in a comment for a human reader would trip them. A copy of `stripComments` in
 * Orbit's `shared/i18n`.
 */
export function stripComments(source: string): string {
  let result = ''
  let quote: string | null = null
  for (let i = 0; i < source.length; i++) {
    const char = source[i] as string
    if (quote) {
      result += char
      if (char === '\\' && quote !== '`') {
        // Copy the escaped character too, so `\"` inside a "…" string never ends it early.
        i++
        result += source[i] ?? ''
        continue
      }
      if (char === quote) quote = null
      continue
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char
      result += char
      continue
    }
    // `://` is a URL in plain JSX text, not a comment.
    if (char === '/' && source[i + 1] === '/' && source[i - 1] !== ':') {
      while (i < source.length && source[i] !== '\n') i++
      i-- // the loop's own increment steps onto the newline (or past the end), as intended
      continue
    }
    if (char === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2)
      i = end === -1 ? source.length : end + 1
      continue
    }
    result += char
  }
  return result
}
