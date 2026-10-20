import { describe, expect, test } from 'vitest'
import { outlineOf } from '../src/index'
import { HEADING_START_CASES } from './heading-start-cases'

describe('outlineOf', () => {
  test('lists headings in order with level, anchor and position', () => {
    const source = '# Handleiding\n\nTekst\n\n## Installatie\n\n### Met *npm*\n'
    expect(outlineOf(source)).toEqual([
      { depth: 1, text: 'Handleiding', anchor: 'handleiding', from: 0, to: 13 },
      { depth: 2, text: 'Installatie', anchor: 'installatie', from: 22, to: 36 },
      { depth: 3, text: 'Met npm', anchor: 'met-npm', from: 38, to: 51 },
    ])
  })

  test('reads no heading in frontmatter', () => {
    expect(outlineOf('---\ntitel: Kop\n---\n\n# Echt\n').map((entry) => entry.text)).toEqual([
      'Echt',
    ])
  })

  // A page without the app's backend reads the outline itself, and it must be the one the app's
  // parser gives, or an anchor of a link lands elsewhere. The golden examples in `fixtures/` hold
  // the same for whole documents.
  test.each(HEADING_START_CASES.map((c) => [c.source, c]))(
    'matches the app parser for %j',
    (_source, headingCase) => {
      expect(outlineOf(headingCase.source)).toEqual(headingCase.outline)
      expect(outlineOf(headingCase.source).map(({ from, to }) => [from, to])).toEqual(
        headingCase.expected,
      )
    },
  )
})
