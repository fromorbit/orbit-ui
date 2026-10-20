import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { describe, expect, test } from 'vitest'

const root = resolve(import.meta.dirname, '..')
const src = join(root, 'src')

interface Manifest {
  readonly dependencies?: Readonly<Record<string, string>>
  readonly peerDependencies?: Readonly<Record<string, string>>
}

const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as Manifest

/**
 * What a component or a story may import: the dependencies and peer dependencies of the package,
 * since a consumer has exactly those. Built from `package.json`, so a new import needs a
 * declared dependency first.
 */
const PACKAGES = new Set([
  ...Object.keys(manifest.dependencies ?? {}),
  ...Object.keys(manifest.peerDependencies ?? {}),
])

/** What a test may import besides those, and `node:*`. */
const TEST_ONLY = new Set(['vitest', '@testing-library/react', '@testing-library/user-event'])

/** Every TypeScript file under `dir`. */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sources(path)
    return /\.tsx?$/.test(name) ? [path] : []
  })
}

/** Every module a source names: static and type imports, re-exports, side effects, `import()`, mocks. */
function specifiers(source: string): string[] {
  const found = [
    ...source.matchAll(/^\s*(?:import|export)\b[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]/gm),
    ...source.matchAll(/^\s*import\s*['"]([^'"]+)['"]/gm),
    ...source.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g),
    ...source.matchAll(/\bvi\.(?:mock|importActual|doMock)\(\s*['"]([^'"]+)['"]/g),
  ]
  return [...new Set(found.map((match) => match[1] ?? ''))]
}

/** Each import specifier in each source file, with the file relative to `src/`. */
const imports = sources(src).flatMap((file) =>
  specifiers(readFileSync(file, 'utf8')).map((specifier) => ({
    file: posix(relative(src, file)),
    specifier,
  })),
)

/** A relative path with slashes, on any platform: the form every rule below matches. */
function posix(path: string): string {
  return path.split(sep).join('/')
}

/** The path under `src/` a relative specifier of `file` names, with slashes. */
function target(file: string, specifier: string): string {
  return posix(relative(src, resolve(dirname(join(src, file)), specifier)))
}

/** A test file, which may also use the test libraries and `node:*`. */
function isTest(file: string): boolean {
  return /\.test(-d)?\.tsx?$/.test(file)
}

/** A helper of the `./testing` export, which may use a test library that is a peer. */
function isHelper(file: string): boolean {
  return file.startsWith('testing/')
}

/** The package a bare specifier belongs to: `@scope/name` or `name`, without a subpath. */
function packageOf(specifier: string): string {
  const parts = specifier.split('/')
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : (parts[0] ?? '')
}

/** Whether `file` (relative to `src/`) may import `specifier` without leaving the library. */
function allowed(file: string, specifier: string): boolean {
  if (specifier.startsWith('.')) {
    return resolve(dirname(join(src, file)), specifier).startsWith(`${src}${sep}`)
  }
  if (specifier.startsWith('node:')) return isTest(file)
  const name = packageOf(specifier)
  // Testing Library is an optional peer for `./testing` only: a component may not need it.
  if (TEST_ONLY.has(name)) return isTest(file) || (isHelper(file) && PACKAGES.has(name))
  return PACKAGES.has(name)
}

/** The layer a file or a resolved specifier lies in, or undefined outside the three. */
function layerOf(path: string): string | undefined {
  return /^(primitives|overlays|patterns)\//.exec(path)?.[1]
}

const ORDER = ['primitives', 'overlays', 'patterns']

describe('the boundaries of the library', () => {
  test('imports no i18next and no @nt/* package', () => {
    const wrong = imports.filter(({ specifier }) =>
      /^(i18next|react-i18next|@nt\/)/.test(specifier),
    )
    expect(wrong).toEqual([])
  })

  test('imports node:* only in a test', () => {
    const wrong = imports.filter(
      ({ file, specifier }) => specifier.startsWith('node:') && !isTest(file),
    )
    expect(wrong).toEqual([])
  })

  test('imports nothing outside src but its declared packages, and test libraries in a test', () => {
    const wrong = imports.filter(({ file, specifier }) => !allowed(file, specifier))
    expect(wrong, 'an import outside the library; give it a port or declare the package').toEqual(
      [],
    )
  })

  test('recognises an import that leaves the library', () => {
    expect(allowed('primitives/Kbd.tsx', '../../platform')).toBe(false)
    expect(allowed('primitives/Kbd.tsx', './Icon')).toBe(true)
    expect(allowed('primitives/Kbd.tsx', 'react-i18next')).toBe(false)
    expect(allowed('primitives/Kbd.tsx', '@pierre/diffs/react')).toBe(true)
    expect(allowed('primitives/Kbd.tsx', 'vitest')).toBe(false)
    expect(allowed('primitives/Kbd.test.tsx', 'vitest')).toBe(true)
    expect(allowed('primitives/Kbd.tsx', 'node:fs')).toBe(false)
    expect(allowed('primitives/Kbd.test.tsx', 'node:fs')).toBe(true)
    expect(allowed('testing/index.ts', '@testing-library/react')).toBe(true)
    expect(allowed('testing/index.ts', '@testing-library/user-event')).toBe(false)
    expect(allowed('primitives/Kbd.tsx', '@testing-library/react')).toBe(false)
  })

  test('reaches the fixtures of testing/ and gallery/ only from a test, a story or those folders', () => {
    // A component that imported them would carry the stories' Dutch words into the root export.
    const wrong = imports.filter(({ file, specifier }) => {
      if (!specifier.startsWith('.') || isTest(file) || /\.gallery\.tsx$/.test(file)) return false
      if (/^(testing|gallery)\//.test(file)) return false
      return /^(testing|gallery)(\/|$)/.test(target(file, specifier))
    })
    expect(wrong).toEqual([])
  })

  test('imports only downward between primitives, overlays and patterns', () => {
    const wrong = imports.filter(({ file, specifier }) => {
      if (!specifier.startsWith('.')) return false
      const from = layerOf(file)
      const to = layerOf(target(file, specifier))
      return from && to && ORDER.indexOf(to) > ORDER.indexOf(from)
    })
    expect(wrong).toEqual([])
  })
})
