import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

/** The workspace's `bunfig.toml`: one install config for both packages. */
const bunfig = readFileSync(join(resolve(import.meta.dirname, '../../..'), 'bunfig.toml'), 'utf8')

/** The exact names listed in `minimumReleaseAgeExcludes`. */
function excludes(): string[] {
  const block = /minimumReleaseAgeExcludes\s*=\s*\[([\s\S]*?)\]/.exec(bunfig)?.[1] ?? ''
  return [...block.matchAll(/"([^"]*)"/g)].map((match) => match[1] ?? '')
}

describe('the install cooldown', () => {
  test('holds back versions younger than seven days', () => {
    expect(bunfig).toMatch(/^minimumReleaseAge\s*=\s*604800\s*$/m)
  })

  test('excludes nothing but a package of ours, and no wildcard', () => {
    expect(excludes().filter((name) => !/^@fromorbit\/[a-z-]+$/.test(name))).toEqual([])
  })
})
