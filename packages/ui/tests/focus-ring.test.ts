import { describe, expect, test } from 'vitest'
import { findFocusRingsWithoutOffset } from './guards/focus-ring'
import { read, sources, underSrc } from './guards/source'

describe('findFocusRingsWithoutOffset', () => {
  test('reports a ring without an offset', () => {
    expect(
      findFocusRingsWithoutOffset(`const c = 'outline-focus focus-visible:outline-2'`),
    ).toEqual(['outline-focus focus-visible:outline-2'])
  })

  test('accepts a positive and a negative offset alike', () => {
    expect(
      findFocusRingsWithoutOffset(`const c = 'outline-focus focus-visible:outline-offset-2'`),
    ).toEqual([])
    expect(
      findFocusRingsWithoutOffset(`const c = 'outline-focus focus-visible:-outline-offset-2'`),
    ).toEqual([])
  })

  test('leaves a class string without the focus ring alone', () => {
    expect(findFocusRingsWithoutOffset(`const c = 'rounded-md outline-none'`)).toEqual([])
  })

  test('leaves a ring written in a comment alone', () => {
    expect(
      findFocusRingsWithoutOffset(`// use 'outline-focus focus-visible:outline-2' here`),
    ).toEqual([])
  })
})

test('every focus ring in the library has an outline offset', () => {
  // Components, helpers and stories alike; tests are left out by `sources`.
  const offenders = sources(/\.tsx?$/).flatMap((file) =>
    findFocusRingsWithoutOffset(read(file)).map((classes) => `${underSrc(file)}: ${classes}`),
  )
  expect(offenders.sort()).toEqual([])
})
