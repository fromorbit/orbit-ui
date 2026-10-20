import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { findMissingSiblings, findStaleHelpers } from './guards/component-siblings'
import { SRC, underSrc } from './guards/source'

describe('findMissingSiblings', () => {
  test('reports the missing test and the missing gallery story', () => {
    expect(findMissingSiblings(['Foo.tsx'])).toEqual(['Foo.test.tsx', 'Foo.gallery.tsx'])
  })

  test('a complete trio reports nothing', () => {
    expect(findMissingSiblings(['Foo.tsx', 'Foo.test.tsx', 'Foo.gallery.tsx'])).toEqual([])
  })

  test('a test or gallery file is not a component itself', () => {
    expect(findMissingSiblings(['Foo.test.tsx', 'Foo.gallery.tsx'])).toEqual([])
  })

  test('a lowercase name is no excuse: only the listed helpers are exempt', () => {
    expect(findMissingSiblings(['chip-row.tsx'], 'patterns')).toEqual([
      'chip-row.test.tsx',
      'chip-row.gallery.tsx',
    ])
  })

  test('a listed helper needs no pair, and only in the layer it is listed for', () => {
    expect(findMissingSiblings(['portal.tsx'], 'overlays')).toEqual([])
    expect(findMissingSiblings(['portal.tsx'], 'patterns')).toEqual([
      'portal.test.tsx',
      'portal.gallery.tsx',
    ])
  })
})

describe('findStaleHelpers', () => {
  test('a helper that still exists is not stale', () => {
    expect(findStaleHelpers(['overlays/portal.tsx', 'provider/UiProvider.tsx'])).toEqual([])
  })

  test('a listed helper that is gone is reported, so the list cannot rot', () => {
    expect(findStaleHelpers(['overlays/Popover.tsx', 'provider/UiProvider.tsx'])).toEqual([
      'overlays/portal.tsx',
    ])
  })
})

/** File names per directory under `src/`, so siblings are only compared within one folder. */
function filesByDirectory(directory: string): Map<string, string[]> {
  const result = new Map<string, string[]>()
  const walk = (current: string) => {
    const entries = readdirSync(current, { withFileTypes: true })
    const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name)
    if (files.length > 0) result.set(current, files)
    for (const entry of entries) {
      if (entry.isDirectory()) walk(join(current, entry.name))
    }
  }
  walk(directory)
  return result
}

test('every component has a test and a gallery story beside it', () => {
  const offenders = [...filesByDirectory(SRC)].flatMap(([directory, files]) =>
    findMissingSiblings(files, underSrc(directory)).map((missing) =>
      underSrc(join(directory, missing)),
    ),
  )
  expect(offenders).toEqual([])
})

test('every helper the guard excuses still exists', () => {
  const paths = [...filesByDirectory(SRC)].flatMap(([directory, files]) =>
    files.map((file) => underSrc(join(directory, file))),
  )
  expect(findStaleHelpers(paths)).toEqual([])
})
