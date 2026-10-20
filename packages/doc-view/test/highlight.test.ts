import { describe, expect, test } from 'vitest'
import { bundledLanguageOf, highlightCode } from '../src/index'

describe('highlightCode', () => {
  test('names the grammar of a fence, through its short name too', () => {
    expect(bundledLanguageOf('ts')).toBe('typescript')
    expect(bundledLanguageOf('TypeScript')).toBe('typescript')
    expect(bundledLanguageOf('bash')).toBe('shellscript')
    expect(bundledLanguageOf('php')).toBe('php')
    expect(bundledLanguageOf('brainfuck')).toBeUndefined()
    expect(bundledLanguageOf(undefined)).toBeUndefined()
  })

  test('colours a line with the variables of the tokens', async () => {
    const lines = await highlightCode('export const a = 1', 'ts')
    expect(lines).not.toBeNull()
    const tokens = lines?.[0] ?? []
    expect(tokens.map((token) => token.content).join('')).toBe('export const a = 1')
    expect(tokens.find((token) => token.content === 'export')?.color).toBe(
      'var(--nt-code-token-keyword)',
    )
  })

  test('keeps the lines of the source', async () => {
    const lines = await highlightCode('a\n\nb', 'txt')
    expect(lines).toBeNull()
    const typed = await highlightCode('const a = 1\n\nconst b = 2', 'js')
    expect(typed).toHaveLength(3)
  })

  test('leaves a language outside the bundle bare', async () => {
    expect(await highlightCode('+++.', 'brainfuck')).toBeNull()
  })
})
