import { createFileTreeIconResolver, getBuiltInSpriteSheet } from '@pierre/trees'
import { FILE_ICONS } from './file-icons'

/** Picks a file's icon the way the tree does: from the same `FILE_ICONS` `PierreTree` is given. */
const iconResolver = createFileTreeIconResolver(FILE_ICONS)

/**
 * The library's sprite and our own after it: `<symbol>`s whose paths draw in `currentColor`, the
 * two the tree carries in its shadow root.
 */
const SPRITE = getBuiltInSpriteSheet(FILE_ICONS.set) + FILE_ICONS.spriteSheet

/** The icon every file without an icon of its own gets, in the tree and here alike. */
const FALLBACK_ICON = 'file-tree-icon-file'

/** One symbol of the sprite, taken apart once: what an inline `<svg>` needs to draw it. */
interface Glyph {
  viewBox: string
  markup: string
}

const glyphs = new Map<string, Glyph | null>()

/**
 * The viewBox and inner markup of the symbol `name` in the sprite, or `null` when it has none.
 *
 * Read from the library's own string rather than referenced with `<use href>`: the tree keeps its
 * sprite inside its shadow root, where no element of the page can point, and hanging a second copy
 * of the whole sheet in the document for a few icons would be a global side effect of a row.
 */
function glyphOf(name: string): Glyph | null {
  const known = glyphs.get(name)
  if (known !== undefined) return known
  const start = SPRITE.indexOf(`<symbol id="${name}"`)
  const open = start === -1 ? -1 : SPRITE.indexOf('>', start)
  const close = open === -1 ? -1 : SPRITE.indexOf('</symbol>', open)
  const viewBox = open === -1 ? null : /viewBox="([^"]+)"/.exec(SPRITE.slice(start, open))?.[1]
  // Without the white space between its tags: drawn inside running text (a path in an answer)
  // those text nodes would otherwise be read and copied as blanks around the icon.
  const markup = SPRITE.slice(open + 1, close)
    .replace(/>\s+</g, '><')
    .trim()
  const glyph = close === -1 || viewBox == null ? null : { viewBox, markup }
  glyphs.set(name, glyph)
  return glyph
}

/**
 * The file-type icon the tree above draws for `path`, for a row outside the tree.
 *
 * Beside `PierreTree`, one of the two files that may import `@pierre/trees`, because the row should show the very icon the tree does. A file
 * of its own rather than inside `PierreTree.tsx`: the icon is drawn in rows the first window
 * already shows (attachments, links, mentions), the tree only in tabs that are opened later, and a
 * module shared with the window's entry script brings all of its imports along — the tree
 * library's whole React side included, which slows the first window down. The glyph only, in `currentColor`: the tree's per-type colours are variables of its own
 * stylesheet, set inside its shadow root, and this app draws its rows in its own tokens — so the
 * row decides the colour, as it does for every other icon.
 *
 * Decorative (`aria-hidden`): the row it stands in names the file in words.
 */
export function PierreFileIcon({ path }: { path: string }) {
  const resolved = iconResolver.resolveIcon(FALLBACK_ICON, path).name
  const glyph = glyphOf(resolved)
  const name = glyph === null ? FALLBACK_ICON : resolved
  const drawn = glyph ?? glyphOf(FALLBACK_ICON)
  return (
    <svg
      data-nt-file-icon
      data-nt-icon-name={name}
      aria-hidden="true"
      viewBox={drawn?.viewBox ?? '0 0 16 16'}
      className="size-(--nt-icon-sm) shrink-0"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: a static symbol of the library's own sprite, never text from outside.
      dangerouslySetInnerHTML={{ __html: drawn?.markup ?? '' }}
    />
  )
}
