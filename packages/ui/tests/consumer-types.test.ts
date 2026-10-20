import { execFileSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

/**
 * A consumer's types against the build: `tests/consumer-types/consumer.tsx` imports
 * `@fromorbit/ui` by its name (resolved through the `exports` of `package.json`, as NodeNext does)
 * and fills `ShortcutIds` with declaration merging. Needs `bun run build` first, so it runs in
 * `bun run test:consumer`, not in `check`.
 */

const root = resolve(import.meta.dirname, '..')

describe('the built types', () => {
  test('let a consumer merge its shortcut ids into ShortcutIds from the root module', () => {
    const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc')
    const project = join(root, 'tests', 'consumer-types', 'tsconfig.json')
    let output = ''
    try {
      execFileSync(process.execPath, [tsc, '-p', project], { encoding: 'utf8' })
    } catch (error) {
      output = String((error as { stdout?: string }).stdout ?? error)
    }
    expect(output, 'tsc reports errors in the consumer').toBe('')
  })
})
