import { describe, expect, test } from 'vitest'
import { scrollTopForLine } from './scroll-to-line'

describe('scrollTopForLine', () => {
  const region = { top: 100, height: 400, scrollTop: 0, scrollHeight: 4_000 }

  test('centres a line far down the file', () => {
    // The line stands 1 600px below the region's top; centred, its middle meets the region's.
    expect(scrollTopForLine({ top: 1_700, height: 20 }, region)).toBe(1_600 + 10 - 200)
  })

  test('counts from where the region already scrolled', () => {
    const scrolled = { ...region, scrollTop: 1_000 }
    expect(scrollTopForLine({ top: 700, height: 20 }, scrolled)).toBe(1_000 + 600 + 10 - 200)
  })

  test('a line near the top leaves the region at the top', () => {
    expect(scrollTopForLine({ top: 140, height: 20 }, region)).toBe(0)
  })

  test('a line near the end goes no further than the end', () => {
    expect(scrollTopForLine({ top: 4_050, height: 20 }, region)).toBe(4_000 - 400)
  })

  test('a wrapped line taller than the region shows its first row at the top', () => {
    expect(scrollTopForLine({ top: 1_100, height: 900 }, region)).toBe(1_000)
  })
})
