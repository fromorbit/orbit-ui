import { describe, expect, test } from 'vitest'
import { selectedLines } from './diff-selection'

// Old lines 10–14 become new lines 10–15: line 12 is replaced by two lines.
const patch = [
  '--- a/src/lezer.ts',
  '+++ b/src/lezer.ts',
  '@@ -10,5 +10,6 @@ export function lees()',
  ' const a = 1',
  ' const b = 2',
  '-const c = 3',
  '+const c = 4',
  '+const d = 5',
  ' return a',
  ' }',
  '\\ No newline at end of file',
  '@@ -40,2 +41,2 @@',
  '---- oud',
  '+--- nieuw',
  ' einde',
].join('\n')

describe('selectedLines', () => {
  test('takes the new side of a range of context and additions', () => {
    expect(
      selectedLines(patch, { start: 11, side: 'additions', end: 13, endSide: 'additions' }),
    ).toEqual({
      side: 'new',
      from: 11,
      to: 13,
      lines: ['const b = 2', 'const c = 4', 'const d = 5'],
      last: { lineNumber: 13, side: 'additions' },
    })
  })

  test('takes the old side of deletions alone', () => {
    expect(selectedLines(patch, { start: 12, side: 'deletions', end: 12 })).toEqual({
      side: 'old',
      from: 12,
      to: 12,
      lines: ['const c = 3'],
      last: { lineNumber: 12, side: 'deletions' },
    })
    // A line that looks like a header inside a hunk is still a line.
    expect(selectedLines(patch, { start: 40, side: 'deletions', end: 40 })?.lines).toEqual([
      '--- oud',
    ])
  })

  test('a mixed range keeps the lines of the new side', () => {
    // From the deleted line 12 down to the new line 14, and the same range drawn upwards.
    const down = selectedLines(patch, {
      start: 12,
      side: 'deletions',
      end: 14,
      endSide: 'additions',
    })
    expect(down).toEqual({
      side: 'new',
      from: 12,
      to: 14,
      lines: ['const c = 4', 'const d = 5', 'return a'],
      last: { lineNumber: 14, side: 'additions' },
    })
    const up = selectedLines(patch, {
      start: 14,
      side: 'additions',
      end: 12,
      endSide: 'deletions',
    })
    expect(up).toEqual(down)
  })

  test('context on the left side of a split view is the old side', () => {
    expect(
      selectedLines(patch, { start: 10, side: 'deletions', end: 11, endSide: 'deletions' }),
    ).toMatchObject({ side: 'old', from: 10, to: 11, lines: ['const a = 1', 'const b = 2'] })
  })

  test('a line the patch does not hold selects nothing', () => {
    expect(selectedLines(patch, { start: 99, side: 'additions', end: 99 })).toBeNull()
    expect(selectedLines('', { start: 1, end: 1 })).toBeNull()
  })
})
