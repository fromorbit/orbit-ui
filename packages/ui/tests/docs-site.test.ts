import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { describe, expect, test } from 'vitest'

const root = resolve(import.meta.dirname, '..')
const site = join(root, 'docs-site', 'src')

/**
 * The parts of the library the docs page may reach: the entry points a host has (`.`,
 * `./gallery`, `./testing`) and the two stylesheets. The page is a host like any other, so a
 * component it shows is the component a host gets, not an internal module beside it.
 */
const ENTRIES = new Set(['src', 'src/gallery', 'src/testing', 'src/tokens.css', 'src/theme.css'])

/** Every source file of the page. */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return files(path)
    return /\.(tsx?|css)$/.test(name) ? [path] : []
  })
}

/** The relative specifiers of a file: imports, re-exports and CSS `@import`s. */
function relativeSpecifiers(source: string): string[] {
  const found = [
    ...source.matchAll(/\bfrom\s*['"](\.[^'"]*)['"]/g),
    ...source.matchAll(/^\s*import\s*['"](\.[^'"]*)['"]/gm),
    ...source.matchAll(/@import\s*['"](\.[^'"]*)['"]/g),
  ]
  return found.map((match) => match[1] ?? '')
}

describe('the docs page', () => {
  test('reaches the library only through its entry points and stylesheets', () => {
    const wrong = files(site).flatMap((file) =>
      relativeSpecifiers(readFileSync(file, 'utf8'))
        .map((specifier) =>
          relative(root, resolve(file, '..', specifier))
            .split(sep)
            .join('/'),
        )
        .filter((target) => target.startsWith('src') && !ENTRIES.has(target))
        .map((target) => `${relative(root, file)} → ${target}`),
    )
    expect(wrong).toEqual([])
  })

  test('stays out of the published package', () => {
    const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      files: string[]
    }
    expect(manifest.files).toEqual(['dist'])
  })
})
