import { expect, test } from 'vitest'
import { createMarkdownCache } from './markdown-cache'

/** A renderer that counts its calls and answers a fresh object for each, as a parse would. */
function counting() {
  const calls: string[] = []
  const render = (text: string) => {
    calls.push(text)
    return { text }
  }
  return { calls, render }
}

test('renders a text once and answers the same result after that', () => {
  const { calls, render } = counting()
  const cached = createMarkdownCache(render, 3)
  const first = cached('# Kop')
  expect(cached('# Kop')).toBe(first)
  expect(calls).toEqual(['# Kop'])
})

test('forgets the text used longest ago once over its limit', () => {
  const { calls, render } = counting()
  const cached = createMarkdownCache(render, 2)
  cached('een')
  cached('twee')
  // Asked again, so `twee` is now the one used longest ago.
  cached('een')
  cached('drie')
  cached('een')
  expect(calls).toEqual(['een', 'twee', 'drie'])
  cached('twee')
  expect(calls).toEqual(['een', 'twee', 'drie', 'twee'])
})
