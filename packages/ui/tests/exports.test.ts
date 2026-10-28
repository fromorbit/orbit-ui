import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, test } from 'vitest'

/**
 * Every export of `package.json` against the build: the file is there, and a JavaScript entry
 * loads. Needs `bun run build` first, so it runs in `bun run test:consumer`, not in `check`.
 */

const root = resolve(import.meta.dirname, '..')

interface Manifest {
  readonly exports: Readonly<Record<string, Readonly<Record<string, string>>>>
}

const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as Manifest

const targets = Object.entries(manifest.exports).flatMap(([subpath, conditions]) =>
  Object.entries(conditions).map(([condition, file]) => ({ subpath, condition, file })),
)

describe('the exports', () => {
  test('names the six entry points', () => {
    expect(Object.keys(manifest.exports)).toEqual([
      '.',
      './tokens.css',
      './theme.css',
      './fonts.css',
      './gallery',
      './testing',
    ])
  })

  test('every export resolves from dist', async () => {
    for (const { subpath, condition, file } of targets) {
      expect(file, `${subpath} ${condition}`).toMatch(/^\.\/dist\//)
      expect(existsSync(join(root, file)), `${subpath} ${condition}: ${file}`).toBe(true)
      if (condition === 'import') {
        await expect(import(pathToFileURL(join(root, file)).href)).resolves.toBeDefined()
      }
    }
  })
})
