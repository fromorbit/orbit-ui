import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, test } from 'vitest'
import * as library from './index'

/** The root of the library. */
const UI = import.meta.dirname

/**
 * The modules that stay behind the components that use them, with the reason: helpers of one
 * component, not part of the `.` export. A module here that Orbit starts to import needs to move
 * out of this list and into `index.ts`, since a host imports only from the package.
 */
const INTERNAL: Record<string, string> = {
  'overlays/layers': 'how HostedSurface measures the layers above it',
  'patterns/file-icons': 'the icon table of PierreTree and PierreFileIcon',
  'patterns/ignore-whitespace': 'the whitespace switch of PierreDiff',
  'patterns/markdown-cache': 'the parse cache of Prose',
  'patterns/patch-headers': 'how PierreDiff completes a patch',
  'patterns/scroll-to-line': 'how PierreFile scrolls to a line',
  'patterns/shiki-bundle': 'the Shiki alias of the build, never imported by name',
  'primitives/hand-back': 'how the overlays hand focus back',
}

/** The folders that are exports of their own (`./gallery`, `./testing`) rather than part of `.`. */
const OWN_EXPORTS = ['gallery', 'testing']

/** Every module of the library that `index.ts` might export: no test, story or own export. */
function modules(directory = UI): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    const rel = relative(UI, path)
    if (entry.isDirectory()) return OWN_EXPORTS.includes(rel) ? [] : modules(path)
    if (!/\.tsx?$/.test(entry.name) || /\.(test|gallery)\.tsx?$/.test(entry.name)) return []
    if (rel === 'index.ts') return []
    const source = readFileSync(path, 'utf8')
    return /^export\s/m.test(source) ? [rel.replace(/\.tsx?$/, '')] : []
  })
}

/** The modules `index.ts` re-exports, as `primitives/Button`. */
function reexported(): string[] {
  const source = readFileSync(join(UI, 'index.ts'), 'utf8')
  return [...source.matchAll(/^export \* from '\.\/([^']+)'/gm)].map((match) => match[1] ?? '')
}

describe('the index of the library', () => {
  test('exports every module that is not internal', () => {
    const listed = new Set(reexported())
    const missing = modules().filter((file) => !listed.has(file) && !(file in INTERNAL))
    expect(missing, 'a module neither in index.ts nor in INTERNAL').toEqual([])
  })

  test('exports no internal module and nothing twice', () => {
    const listed = reexported()
    expect(listed.filter((file) => file in INTERNAL)).toEqual([])
    expect(listed.length).toBe(new Set(listed).size)
    const known = new Set(modules())
    expect(
      Object.keys(INTERNAL).filter((file) => !known.has(file)),
      'a stale INTERNAL entry',
    ).toEqual([])
  })

  test('reaches a component, the provider and its ports', () => {
    expect(library.Button).toBeDefined()
    expect(library.UiProvider).toBeDefined()
    expect(library.useUi).toBeDefined()
    expect(library.literalShortcuts).toBeDefined()
  })
})
