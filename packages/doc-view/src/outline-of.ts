import type { Heading, Node, Parent, Root } from 'mdast'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

/**
 * One heading of a document: its level, its plain text, its anchor and where it stands in the
 * source (`[from, to)`, offsets in UTF-16 code units).
 *
 * The same shape as `OutlineEntry` of `@nt/markdown` and on the wire (`@nt/protocol`), spelt out
 * here so the package stands on its own.
 */
export interface DocOutlineEntry {
  depth: 1 | 2 | 3 | 4 | 5 | 6
  text: string
  /** The slug a `#…` link points at; unique within the document. */
  anchor: string
  from: number
  to: number
}

/** The flavour `DocProse` draws and core parses: remark-gfm plus YAML frontmatter. */
const processor = unified().use(remarkParse).use(remarkGfm).use(remarkFrontmatter, ['yaml'])

/**
 * Everything GitHub's slugger drops: anything that is not a letter, a mark, a digit, a connector
 * (`_`), a space or a hyphen.
 */
const DROPPED = /[^\p{L}\p{M}\p{N}\p{Pc} -]/gu

/** The slug of a heading's text the way GitHub makes it (see `slug` of `@nt/markdown`). */
function slug(text: string): string {
  return text.toLowerCase().replace(DROPPED, '').replace(/ /g, '-')
}

/** The plain text of a node: its text and inline code, in order; images and HTML say nothing. */
function plainText(node: Node): string {
  if (node.type === 'text' || node.type === 'inlineCode')
    return (node as unknown as { value: string }).value
  if (!('children' in node)) return ''
  return (node as Parent).children.map((child) => plainText(child)).join('')
}

/**
 * Where a heading really starts: at its first child when that stands on a later line (a setext
 * heading after link definitions), the rule of `sourceStart` of `@nt/markdown`.
 */
function headingStart(heading: Heading): number | undefined {
  const start = heading.position?.start
  const child = heading.children[0]?.position?.start
  if (start && child && child.line > start.line) return child.offset
  return start?.offset
}

/**
 * The headings of a markdown source in order, each with an anchor of its own — the outline core
 * gives the app, read here from the markdown itself for a side without core (the website).
 *
 * A copy of `outline(parse(source))` of `@nt/markdown`, which this package may not import (it
 * stays independent of the app's packages); the test of this package holds the two together over a
 * table of cases frozen from that parser. A second heading with the same slug gets `-1`, a third `-2`, skipping any suffix a
 * heading of its own already took — GitHub's rule.
 */
export function outlineOf(source: string): DocOutlineEntry[] {
  const tree = processor.runSync(processor.parse(source)) as Root
  const entries: DocOutlineEntry[] = []
  const taken = new Set<string>()
  const counts = new Map<string, number>()
  const visit = (node: Node): void => {
    if (node.type === 'heading') {
      const heading = node as Heading
      const text = plainText(heading)
      const base = slug(text)
      let anchor = base
      if (taken.has(base)) {
        let count = counts.get(base) ?? 0
        do {
          count += 1
          anchor = `${base}-${count}`
        } while (taken.has(anchor))
        counts.set(base, count)
      }
      taken.add(anchor)
      entries.push({
        depth: heading.depth,
        text,
        anchor,
        from: headingStart(heading) ?? 0,
        to: heading.position?.end.offset ?? 0,
      })
      return
    }
    if ('children' in node) for (const child of (node as Parent).children) visit(child)
  }
  visit(tree)
  return entries
}
