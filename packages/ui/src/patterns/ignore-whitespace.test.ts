import { describe, expect, test } from 'vitest'
import { ignoreWhitespace } from './ignore-whitespace'

describe('ignoreWhitespace', () => {
  test('a line that only gained indentation disappears', () => {
    const diff = ['@@ -1,1 +1,1 @@', '-  return greeting', '+    return greeting'].join('\n')

    expect(ignoreWhitespace(diff)).toBe('')
  })

  test('a real change beside a whitespace change survives', () => {
    const diff = [
      '@@ -1,2 +1,2 @@',
      '-  return greeting',
      "-  const name = 'lezer'",
      '+    return greeting',
      "+  const name = 'gebruiker'",
    ].join('\n')

    expect(ignoreWhitespace(diff)).toBe(
      ['@@ -1,2 +1,2 @@', "-  const name = 'lezer'", "+  const name = 'gebruiker'"].join('\n'),
    )
  })

  test('a hunk that becomes empty disappears with it', () => {
    const diff = [
      '@@ -1,1 +1,1 @@',
      '-  return greeting',
      '+    return greeting',
      '@@ -10,1 +10,1 @@',
      "-  const name = 'lezer'",
      "+  const name = 'gebruiker'",
    ].join('\n')

    expect(ignoreWhitespace(diff)).toBe(
      ['@@ -10,1 +10,1 @@', "-  const name = 'lezer'", "+  const name = 'gebruiker'"].join('\n'),
    )
  })

  test('a patch that is nothing but whitespace becomes empty', () => {
    const diff = [
      '@@ -1,2 +1,2 @@',
      '-  return greeting',
      "-  const name='lezer'",
      '+    return greeting',
      "+  const name = 'lezer'",
    ].join('\n')

    expect(ignoreWhitespace(diff)).toBe('')
  })

  test('a hunk whose only change was whitespace disappears with its context', () => {
    // A real patch always carries context lines; a hunk that keeps them but lost every `+` and `-`
    // shows the reader a change that is no longer there.
    const diff = [
      '@@ -1,3 +1,3 @@',
      ' function greet() {',
      '-  return 1',
      '+    return 1',
      ' }',
    ].join('\n')

    expect(ignoreWhitespace(diff)).toBe('')
  })

  test('the lines before the first hunk survive', () => {
    const diff = [
      'diff --git a/src/greet.ts b/src/greet.ts',
      '--- a/src/greet.ts',
      '+++ b/src/greet.ts',
      '@@ -1,2 +1,2 @@',
      '-  return greeting',
      "-  const name = 'lezer'",
      '+    return greeting',
      "+  const name = 'gebruiker'",
    ].join('\n')

    expect(ignoreWhitespace(diff)).toBe(
      [
        'diff --git a/src/greet.ts b/src/greet.ts',
        '--- a/src/greet.ts',
        '+++ b/src/greet.ts',
        '@@ -1,2 +1,2 @@',
        "-  const name = 'lezer'",
        "+  const name = 'gebruiker'",
      ].join('\n'),
    )
  })

  test('a patch that loses every hunk loses its headers too', () => {
    const diff = [
      '--- a/src/greet.ts',
      '+++ b/src/greet.ts',
      '@@ -1,1 +1,1 @@',
      '-  return greeting',
      '+    return greeting',
    ].join('\n')

    expect(ignoreWhitespace(diff)).toBe('')
  })

  test('a patch without whitespace changes is returned unchanged', () => {
    const diff = ['@@ -1,1 +1,1 @@', "-  const name = 'lezer'", "+  const name = 'gebruiker'"].join(
      '\n',
    )

    expect(ignoreWhitespace(diff)).toBe(diff)
  })
})
