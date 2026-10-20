/**
 * A markdown source, the source range of each of its headings, and the outline a full markdown
 * parser gives it.
 *
 * mdast starts a setext heading at the paragraph it grew from, and that paragraph may have begun
 * with link definitions: in `[a]: b\nc\n---` the heading would start at 0, over the definition.
 * `outlineOf` and `DocProse` correct that, so an anchor a host computes on its side of the wire
 * always finds its heading here.
 */
export interface HeadingStartCase {
  source: string
  /** `[from, to)` of every heading, UTF-16 offsets. */
  expected: readonly (readonly [number, number])[]
  /** The outline Orbit's own markdown parser gives the source; `outlineOf` must give the same. */
  outline: readonly {
    depth: number
    text: string
    anchor: string
    from: number
    to: number
  }[]
}

/**
 * The table the tests walk. The ranges are the same as `HEADING_START_CASES` of
 * `@fromorbit/ui/testing`; the outlines were frozen from the parser the Orbit app uses, so a host
 * that reads its outline elsewhere and a page that reads it here agree on every anchor.
 */
export const HEADING_START_CASES: readonly HeadingStartCase[] = [
  {
    source: '# Kop',
    expected: [[0, 5]],
    outline: [{ depth: 1, text: 'Kop', anchor: 'kop', from: 0, to: 5 }],
  },
  {
    source: 'Kop\n===',
    expected: [[0, 7]],
    outline: [{ depth: 1, text: 'Kop', anchor: 'kop', from: 0, to: 7 }],
  },
  {
    source: '  Kop\n---',
    expected: [[2, 9]],
    outline: [{ depth: 2, text: 'Kop', anchor: 'kop', from: 2, to: 9 }],
  },
  {
    source: '[a]: b\n# Kop',
    expected: [[7, 12]],
    outline: [{ depth: 1, text: 'Kop', anchor: 'kop', from: 7, to: 12 }],
  },
  {
    source: '[ref]: https://voorbeeld.test\nconst a = 1\n---',
    expected: [[30, 45]],
    outline: [{ depth: 2, text: 'const a = 1', anchor: 'const-a--1', from: 30, to: 45 }],
  },
  {
    source: '[a]: b\n*nadruk* kop\n---',
    expected: [[7, 23]],
    outline: [{ depth: 2, text: 'nadruk kop', anchor: 'nadruk-kop', from: 7, to: 23 }],
  },
  {
    source: '[a]: b\r\n[c]: d\r\ne\r\n---',
    expected: [[16, 22]],
    outline: [{ depth: 2, text: 'e', anchor: 'e', from: 16, to: 22 }],
  },
  {
    source: '[a]: b\nc\nd\n===',
    expected: [[7, 14]],
    outline: [{ depth: 1, text: 'c\nd', anchor: 'cd', from: 7, to: 14 }],
  },
  {
    source: '> [a]: b\n> c\n> ---',
    expected: [[11, 18]],
    outline: [{ depth: 2, text: 'c', anchor: 'c', from: 11, to: 18 }],
  },
  {
    source: '# Een\n\n[a]: b\nTwee\n---\n\nDrie\n===',
    expected: [
      [0, 5],
      [14, 22],
      [24, 32],
    ],
    outline: [
      { depth: 1, text: 'Een', anchor: 'een', from: 0, to: 5 },
      { depth: 2, text: 'Twee', anchor: 'twee', from: 14, to: 22 },
      { depth: 1, text: 'Drie', anchor: 'drie', from: 24, to: 32 },
    ],
  },
]
