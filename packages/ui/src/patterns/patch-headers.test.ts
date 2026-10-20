import { describe, expect, test } from 'vitest'
import { patchWithHeaders } from './patch-headers'

describe('patchWithHeaders', () => {
  test('a created file gets a header from nowhere', () => {
    const diff = ['@@ -0,0 +1,1 @@', '+export const greet = 1'].join('\n')

    expect(patchWithHeaders(diff, 'src/greet.ts', 'add')).toBe(
      ['--- /dev/null', '+++ src/greet.ts', diff].join('\n'),
    )
  })

  test('a deleted file gets a header to nowhere', () => {
    const diff = ['@@ -1,1 +0,0 @@', '-export const greet = 1'].join('\n')

    expect(patchWithHeaders(diff, 'src/greet.ts', 'delete')).toBe(
      ['--- src/greet.ts', '+++ /dev/null', diff].join('\n'),
    )
  })

  test('a renamed file names both sides', () => {
    const diff = ['@@ -1,1 +1,1 @@', '-old', '+new'].join('\n')

    expect(patchWithHeaders(diff, 'src/new.ts', 'move', 'src/old.ts')).toBe(
      ['--- src/old.ts', '+++ src/new.ts', diff].join('\n'),
    )
  })

  test('a modified file names both sides the same, with no a/ b/ prefix', () => {
    // PatchDiff only strips the a/ b/ prefix when the patch also carries a `diff --git` line; we
    // never add one, so a prefixed pair for the same file would read as a rename of itself.
    const diff = ['@@ -1,1 +1,1 @@', '-old', '+new'].join('\n')

    expect(patchWithHeaders(diff, 'src/greet.ts', 'modify')).toBe(
      ['--- src/greet.ts', '+++ src/greet.ts', diff].join('\n'),
    )
  })

  test('a patch that already has headers is left alone', () => {
    const diff = [
      '--- a/src/greet.ts',
      '+++ b/src/greet.ts',
      '@@ -1,1 +1,1 @@',
      '-old',
      '+new',
    ].join('\n')

    expect(patchWithHeaders(diff, 'src/greet.ts', 'modify')).toBe(diff)
  })

  test('a patch that opens with diff --git is left alone', () => {
    // Prepending our own `---`/`+++` pair in front of a git header would make a malformed patch:
    // the file would be named twice, and the second naming is the one we invented.
    const diff = [
      'diff --git a/src/greet.ts b/src/greet.ts',
      '--- a/src/greet.ts',
      '+++ b/src/greet.ts',
      '@@ -1,1 +1,1 @@',
      '-old',
      '+new',
    ].join('\n')

    expect(patchWithHeaders(diff, 'src/greet.ts', 'modify')).toBe(diff)
  })

  test('a patch that opens with an Index: line is left alone', () => {
    const diff = [
      'Index: src/greet.ts',
      '--- src/greet.ts',
      '+++ src/greet.ts',
      '@@ -1,1 +1,1 @@',
      '-old',
      '+new',
    ].join('\n')

    expect(patchWithHeaders(diff, 'src/greet.ts', 'modify')).toBe(diff)
  })

  test('a change with no diff stays empty', () => {
    expect(patchWithHeaders('', 'src/greet.ts', 'modify')).toBe('')
  })
})
