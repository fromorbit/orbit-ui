import { expect, test } from 'vitest'
import { read, sources, stripComments, underSrc } from './guards/source'

/**
 * The rhythm of the kit (`docs/family-style.md`, "Rhythm"): five type sizes, motion from the
 * tokens and labels in sentence case. A new component takes these rather than numbers of its own;
 * these guards catch the ones a review would otherwise have to find by eye.
 */
const files = () =>
  sources(/\.tsx?$/).map((file) => [underSrc(file), stripComments(read(file))] as const)

/** The five sizes of the scale: meta, secondary, body, a card's title, a page's title. */
const SCALE = new Set(['11', '12', '13', '15', '20'])

/**
 * The initials of a mark are a glyph drawn to fit its circle or square, not a step of the scale
 * (`family-style.md`).
 */
const GLYPHS = new Set([
  'primitives/Avatar.tsx',
  'primitives/AvatarGroup.tsx',
  'primitives/ProjectMark.tsx',
])

test('text takes one of the five sizes of the scale', () => {
  const offenders = files().flatMap(([file, text]) =>
    GLYPHS.has(file)
      ? []
      : [...text.matchAll(/\btext-\[([\d.]+)px\]/g)]
          .filter((match) => !SCALE.has(match[1] ?? ''))
          .map((match) => `${file}: ${match[0]}`),
  )
  expect(offenders).toEqual([])
})

test('a transition takes its duration from the motion tokens', () => {
  const offenders = files().flatMap(([file, text]) =>
    [...text.matchAll(/\bduration-(?:\d+|\[[^\]]+\])/g)].map((match) => `${file}: ${match[0]}`),
  )
  expect(offenders).toEqual([])
})

test('no label in spaced capitals', () => {
  const offenders = files().flatMap(([file, text]) =>
    [...text.matchAll(/(?<![\w:-])uppercase\b|\btracking-wide(?:r|st)\b/g)].map(
      (match) => `${file}: ${match[0]}`,
    ),
  )
  expect(offenders).toEqual([])
})
