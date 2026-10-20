/**
 * A markdown source and the source range of each of its headings, in document order.
 *
 * mdast starts a setext heading at the paragraph it grew from, and that paragraph may have begun
 * with link definitions: in `[a]: b\nc\n---` the heading would start at 0, over the definition.
 * `Prose` corrects that for `data-source-from` and the anchor it looks up by offset, as the host
 * does for the outline it hands in, so an anchor the host gives always finds its heading.
 */
export interface HeadingStartCase {
  source: string
  /** `[from, to)` of every heading, UTF-16 offsets. */
  expected: readonly (readonly [number, number])[]
}

/**
 * The table `Prose`'s test walks: the library's copy of the one Orbit's core and renderer share
 * (`HEADING_START_CASES` of the testing helpers of Orbit's protocol package). Exported from
 * `./testing`, so a test on Orbit's side keeps the two equal.
 */
export const HEADING_START_CASES: readonly HeadingStartCase[] = [
  { source: '# Kop', expected: [[0, 5]] },
  { source: 'Kop\n===', expected: [[0, 7]] },
  { source: '  Kop\n---', expected: [[2, 9]] },
  { source: '[a]: b\n# Kop', expected: [[7, 12]] },
  { source: '[ref]: https://voorbeeld.test\nconst a = 1\n---', expected: [[30, 45]] },
  { source: '[a]: b\n*nadruk* kop\n---', expected: [[7, 23]] },
  { source: '[a]: b\r\n[c]: d\r\ne\r\n---', expected: [[16, 22]] },
  { source: '[a]: b\nc\nd\n===', expected: [[7, 14]] },
  { source: '> [a]: b\n> c\n> ---', expected: [[11, 18]] },
  {
    source: '# Een\n\n[a]: b\nTwee\n---\n\nDrie\n===',
    expected: [
      [0, 5],
      [14, 22],
      [24, 32],
    ],
  },
]
