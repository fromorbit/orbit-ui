import { describe, expect, test } from 'vitest'
import { controlHeight, controlSize, controlSquare } from './control-size'

describe('controlHeight', () => {
  test.each([
    ['sm', 'h-(--nt-control-sm)'],
    ['md', 'h-(--nt-control-md)'],
    ['lg', 'h-(--nt-control-lg)'],
  ] as const)('%s carries exactly the height token, no text size', (size, expected) => {
    expect(controlHeight[size]).toBe(expected)
  })
})

describe('controlSize', () => {
  test.each([
    ['sm', 'h-(--nt-control-sm)'],
    ['md', 'h-(--nt-control-md)'],
    ['lg', 'h-(--nt-control-lg)'],
  ] as const)('%s holds the matching height token', (size, expected) => {
    expect(controlSize[size]).toContain(expected)
  })
})

describe('controlSquare', () => {
  // Literal pairs, not built from a shared token string: Tailwind only discovers a utility class
  // whose exact text appears somewhere in the source, so a test asserting on an interpolated
  // string could pass here while the real class silently never gets generated (see
  // `control-size.ts`'s note on this).
  test.each([
    ['sm', 'w-(--nt-control-sm)', 'h-(--nt-control-sm)'],
    ['md', 'w-(--nt-control-md)', 'h-(--nt-control-md)'],
    ['lg', 'w-(--nt-control-lg)', 'h-(--nt-control-lg)'],
  ] as const)('%s has the same width as height, from the same token', (size, width, height) => {
    expect(controlSquare[size]).toContain(width)
    expect(controlSize[size]).toContain(height)
  })
})
