import { describe, expect, test } from 'vitest'
import {
  controlHeight,
  controlPadEnd,
  controlPadX,
  controlPadXPx,
  controlSize,
  controlSquare,
} from './control-size'

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

describe('controlPadX', () => {
  // Literal pairs again: the class a consumer's Tailwind generates, and the pixels it stands for,
  // so a caller that aligns text with a button's (`13 - controlPadXPx.sm`) moves with the family.
  test.each([
    ['xs', 'px-1.5', 'pe-1.5', 6],
    ['sm', 'px-2.5', 'pe-2.5', 10],
    ['md', 'px-3', 'pe-3', 12],
    ['lg', 'px-4', 'pe-4', 16],
  ] as const)('%s pads with %s, the %s end and %ipx', (size, both, end, px) => {
    expect(controlPadX[size]).toBe(both)
    expect(controlPadEnd[size]).toBe(end)
    expect(controlPadXPx[size]).toBe(px)
  })
})
