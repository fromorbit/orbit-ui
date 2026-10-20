import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

const root = resolve(import.meta.dirname, '..')
const biome = resolve(root, 'node_modules/.bin/biome')

/**
 * Lints a source snippet as if it lived in the given directory.
 *
 * Biome picks its rules based on the path. Stdin mode gives no usable exit code, so the test puts
 * a temporary file in the real location and cleans it up afterwards.
 */
function lint(directory: string, source: string) {
  const dir = resolve(root, directory)
  const createdDir = mkdirSync(dir, { recursive: true })
  const file = join(dir, '__boundary_probe__.ts')
  try {
    writeFileSync(file, source)
    const result = spawnSync(biome, ['lint', '--max-diagnostics=none', file], {
      cwd: root,
      encoding: 'utf8',
    })
    return { ok: result.status === 0, output: `${result.stdout}${result.stderr}` }
  } finally {
    rmSync(file, { force: true })
    if (createdDir) rmSync(createdDir, { recursive: true, force: true })
  }
}

describe('the package boundary', () => {
  // The document view is presentation only: React and its markdown and code libraries, no other
  // package of ours, no Electron, no i18n library (labels come as props), no `node:*`, so a
  // consumer can take its source over as it is.
  test('src imports no package of ours, no electron, no i18n and no node builtin', () => {
    for (const name of [
      '@nt/protocol',
      '@nt/markdown',
      '@fromorbit/ui',
      'electron',
      'bun',
      'react-i18next',
      'i18next',
      'node:fs',
    ]) {
      const result = lint('src', `import '${name}'\n`)
      expect(result.ok, name).toBe(false)
      expect(result.output).toContain('noRestrictedImports')
    }
    for (const name of ['react', 'react-markdown', 'remark-gfm', 'shiki/core', 'lucide-react']) {
      expect(lint('src', `import '${name}'\n`).ok, name).toBe(true)
    }
  })

  test('Bun as a global is forbidden', () => {
    const result = lint('src', 'export const v = Bun.version\n')
    expect(result.ok).toBe(false)
    expect(result.output).toContain('noRestrictedGlobals')
  })
})
