import { join } from 'node:path'
import { expect, test } from 'vitest'
import { read, SRC, sources, stripComments, underSrc } from './guards/source'

/**
 * Every icon comes from Lucide through `Icon`, so every icon has one stroke and one style: a drawing of
 * our own is a status shape, a file-type glyph, a mark, or a picture in a story — and each of
 * those is named here with its reason, so a new `<svg>` anywhere else fails.
 */
const allowed: Record<string, string> = {
  'patterns/StatusShape.tsx': 'the status shapes stay our own',
  'patterns/PierreFileIcon.tsx':
    'a file-type glyph per extension from the sprite of the tree; Lucide has none per language',
  'patterns/file-icons.ts': 'the sprite of those file-type glyphs, handed to the tree',
  'patterns/HostedSurface.gallery.tsx': 'a picture of a web page as data, not an icon',
  'patterns/Chip.gallery.tsx': 'thumbnails of a page as data, not icons',
  'primitives/BrandIcon.tsx':
    "the marks of an agent's maker and GitHub's; Lucide draws no logos, and may not",
  'primitives/OrbitWordmark.tsx': "the app's own wordmark, copied from the brand assets; a logo",
}

test('no <svg> outside the named exceptions: every icon is Lucide through Icon', () => {
  const offenders = sources(/\.tsx?$/)
    .map(underSrc)
    .filter((file) => !(file in allowed))
    .filter((file) => /<svg\b/.test(stripComments(read(join(SRC, file)))))
  expect(offenders).toEqual([])
})

test('every exception still draws an <svg>, so the list cannot go stale', () => {
  for (const file of Object.keys(allowed)) {
    expect(/<svg\b/.test(stripComments(read(join(SRC, file)))), file).toBe(true)
  }
})
