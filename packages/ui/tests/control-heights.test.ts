import { expect, test } from 'vitest'
import { read, SRC, sources, stripComments, underSrc } from './guards/source'

/**
 * A control, a row or a head that stands on one of the four control heights takes it from
 * `--nt-control-*`, never from a Tailwind step that happens to match it (`h-8` is 32px). Only the
 * token follows the density a host chooses (`data-density="compact"`, `tokens.css`): a literal
 * `h-8` stays 32px in a compact app while the buttons beside it shrink to 28px.
 */

/**
 * Tailwind steps and pixel values that equal a control height of 0.5.0 (24, 28, 32, 40px), as a
 * height, a minimum height or a square size.
 */
const LITERAL_CONTROL_HEIGHT =
  /(?<![\w-])(?:min-h|h|size)-(?:6|7|8|10|\[(?:24|28|32|40)px\])(?![\w.-])/g

/**
 * Sizes that equal a control height by chance and are no control: a glyph, an image or a mark
 * keeps its size in every density. Each entry names the file and the class it may keep.
 */
const ALLOWED: Record<string, string[]> = {
  // The avatar of a person: a picture, not a target.
  'primitives/Avatar.tsx': ['size-10'],
  // The thumbnail of a file: its height is the picture's.
  'primitives/Thumbnail.tsx': ['h-8'],
  // The marks of a timeline and the line of text beside them.
  'primitives/Timeline.tsx': ['size-6', 'min-h-6', 'h-6'],
  // The card form of the website: the fields mirror a payment card and are not a host's density.
  'patterns/CreditCardField.tsx': ['size-7', 'h-7', 'h-10', 'h-8'],
  // The rows of a table in a document: the document's typography, the same in every host.
  'patterns/Prose.tsx': ['h-8'],
  // The thumb of the scrubber (a handle 16px wide) and the lines of its legend (text).
  'patterns/Scrubber.tsx': ['h-6', 'min-h-6'],
  // The heading of a group of mentions: a line of 11px type.
  'patterns/MentionList.tsx': ['h-6'],
  // The symbol of a row (a glyph), and the strip of a row's actions level with its first line of
  // text (24px, the line height of the label, not a control).
  'patterns/List.tsx': ['size-6', 'h-6'],
  // The symbol of a row, and the label's line of 24px: a line of text on the 4px grid.
  'patterns/SettingRow.tsx': ['size-6', 'min-h-6'],
  // The line of a plan's name: 28px of text with or without its tag, a line of type.
  'patterns/PlanCard.tsx': ['min-h-7'],
  'patterns/SettingFoldRow.tsx': ['size-6'],
  // The round plane behind the icon of a drop zone: a glyph.
  'patterns/FileDrop.tsx': ['size-8'],
  // The line of text under the composer's field: a line of 12px type, not a control.
  'patterns/Composer.tsx': ['min-h-6'],
}

test('a control, row or head takes its height from --nt-control-*', () => {
  const offenders = sources(/\.tsx$/)
    .filter((file) => !/\.gallery\.tsx$/.test(file))
    .filter((file) => /\/(primitives|overlays|patterns)\//.test(file))
    .flatMap((file) => {
      const path = underSrc(file)
      const allowed = ALLOWED[path] ?? []
      const found = stripComments(read(file)).match(LITERAL_CONTROL_HEIGHT) ?? []
      return [...new Set(found)]
        .filter((name) => !allowed.includes(name))
        .map((name) => `${path}: ${name}`)
    })
  expect(offenders).toEqual([])
})

test('the list of exceptions names only classes that are still there', () => {
  const stale = Object.entries(ALLOWED).flatMap(([path, names]) => {
    const text = stripComments(read(`${SRC}/${path}`))
    return names
      .filter(
        (name) => !new RegExp(`(?<![\\w-])${name.replace(/[[\]]/g, '\\$&')}(?![\\w.-])`).test(text),
      )
      .map((name) => `${path}: ${name}`)
  })
  expect(stale).toEqual([])
})
