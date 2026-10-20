import { join } from 'node:path'
import { expect, test } from 'vitest'
import { read, SRC, sources, stripComments, underSrc } from './guards/source'

/**
 * `--nt-text-faint` (4.3:1) is below what body text owes, so it may colour an icon, a border or
 * decoration and never a word. These tests walk the source for
 * the ways it could become a text colour.
 */

test('the Tailwind class text-faint appears only in the tone of Icon', () => {
  // `text-*` sets `color`, which an `<svg>` of Lucide paints its stroke in: on `Icon` that is an
  // icon colour, anywhere else it would reach a word.
  const offenders = sources(/\.tsx?$/)
    .filter((file) => underSrc(file) !== 'primitives/Icon.tsx')
    .filter((file) => /text-faint\b|text-\(--nt-text-faint\)/.test(stripComments(read(file))))
    .map(underSrc)
  expect(offenders).toEqual([])
})

test('no stylesheet sets color to --nt-text-faint', () => {
  const offenders = sources(/\.css$/)
    .filter((file) =>
      /(^|[\s;{])color\s*:\s*var\(--nt-text-faint\)/m.test(
        read(file).replace(/\/\*[\s\S]*?\*\//g, ''),
      ),
    )
    .map(underSrc)
  expect(offenders).toEqual([])
})

test('the Icon tone faint exists, so an icon has a way to be faint', () => {
  expect(read(join(SRC, 'primitives', 'Icon.tsx'))).toMatch(/faint:\s*'text-faint'/)
})
