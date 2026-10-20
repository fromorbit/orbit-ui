import type { Story } from '../gallery/story'
import { PierreFile } from './PierreDiff'

/** A made-up source file, long enough that line 18 has to be scrolled to. */
const sourceFile = [
  "import type { Regel } from './regel'",
  '',
  'export function totaal(regels: Regel[]): number {',
  '  return regels.reduce((som, regel) => som + regel.prijs * regel.aantal, 0)',
  '}',
  '',
  ...Array.from({ length: 20 }, (_, i) => `export const korting${i + 1} = ${(i + 1) * 5}`),
  '',
].join('\n')

/** The same file with one description far wider than the view, at line 8. */
const wideFile = sourceFile
  .split('\n')
  .map((text, index) =>
    index === 7
      ? `export const omschrijving = '${'een verzonnen omschrijving van de winkel '.repeat(6).trim()}'`
      : text,
  )
  .join('\n')

/**
 * `PierreFile`, the file view of `@pierre/diffs` behind the same wall as `PierreDiff`: a whole
 * file, the same file with a line marked and scrolled into view, and a file whose
 * long line wraps under a hanging indent, as the chat's preview draws it.
 *
 * A page of its own rather than states of `PierreDiff`: on one page with a diff that has selected
 * lines, the file view changed the colour of that selection, and axe read it.
 */
export default {
  group: 'patterns',
  title: 'PierreFile',
  states: {
    File: () => (
      <div className="h-64 w-[36rem]">
        <PierreFile text={sourceFile} path="src/winkelmand/totaal.ts" />
      </div>
    ),
    'File at a line': () => (
      <div className="h-64 w-[36rem]">
        <PierreFile text={sourceFile} path="src/winkelmand/totaal.ts" line={18} />
      </div>
    ),
    'Wrapped lines': () => (
      <div className="h-64 w-[36rem]">
        <PierreFile text={wideFile} path="src/winkelmand/totaal.ts" line={7} wrap />
      </div>
    ),
  },
} satisfies Story
