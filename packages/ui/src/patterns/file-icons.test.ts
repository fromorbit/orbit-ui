import { expect, test } from 'vitest'
import { iconSymbol } from '../primitives/Icon'
import { FILE_ICONS } from './file-icons'

test.each([
  ['file-tree-icon-chevron', 'chevron-down'],
  ['file-tree-icon-ellipsis', 'more-horizontal'],
] as const)('the tree draws its %s as the Lucide %s of the registry', (slot, glyph) => {
  // The controls of the tree are the app's own glyphs; only the
  // file-type icon per extension stays the library's.
  const remapped = FILE_ICONS.remap[slot]
  expect(remapped.viewBox).toBe('0 0 24 24')
  expect(FILE_ICONS.spriteSheet).toContain(iconSymbol(glyph, remapped.name))
})
