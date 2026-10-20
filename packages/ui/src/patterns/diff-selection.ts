/** One of the two columns of a diff, in the words of `@pierre/diffs`. */
export type DiffColumn = 'deletions' | 'additions'

/**
 * A range of lines as `@pierre/diffs` reports it: two ends, each a line number on a side.
 *
 * Declared here in the library's own shape rather than imported, so that nothing outside
 * `PierreDiff.tsx` imports `@pierre/*`; TypeScript matches the two structurally.
 * `start` is where the pointer went down, `end` where it let go, so `end` may lie above `start`.
 */
export interface LineRange {
  start: number
  side?: DiffColumn
  end: number
  endSide?: DiffColumn
}

/** A selection of a diff in our words: lines of one version of the file, in that version's numbers. */
export interface DiffLines {
  side: 'old' | 'new'
  from: number
  to: number
  /** The selected lines as they stand in that version, without the `+`, `-` or space before them. */
  lines: string[]
  /** The lowest end of the range on screen: where a note under the selection belongs. */
  last: { lineNumber: number; side: DiffColumn }
}

interface Row {
  kind: 'context' | 'deletion' | 'addition'
  old?: number
  new?: number
  text: string
}

const HUNK = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/

/** The lines of a unified patch, numbered on both sides; headers before the first hunk are skipped. */
function rowsOf(patch: string): Row[] {
  const rows: Row[] = []
  let oldLine = 0
  let newLine = 0
  let inHunk = false
  for (const line of patch.split('\n')) {
    const hunk = HUNK.exec(line)
    if (hunk) {
      oldLine = Number(hunk[1])
      newLine = Number(hunk[2])
      inHunk = true
      continue
    }
    // Before the first hunk stand the `---`/`+++` headers, which are not lines of the file.
    if (!inHunk) continue
    const text = line.slice(1)
    if (line.startsWith('+')) rows.push({ kind: 'addition', new: newLine++, text })
    else if (line.startsWith('-')) rows.push({ kind: 'deletion', old: oldLine++, text })
    else if (line.startsWith(' '))
      rows.push({ kind: 'context', old: oldLine++, new: newLine++, text })
    // `\ No newline at end of file`, or a trailing empty line: no line of either version.
  }
  return rows
}

/** Where one end of a range stands among the rows; `undefined` if the patch does not hold it. */
function indexOf(rows: readonly Row[], lineNumber: number, side: DiffColumn | undefined): number {
  return side === 'deletions'
    ? rows.findIndex((row) => row.kind !== 'addition' && row.old === lineNumber)
    : rows.findIndex((row) => row.kind !== 'deletion' && row.new === lineNumber)
}

/**
 * The lines a range of `@pierre/diffs` covers in `patch`, as lines of one version of the file.
 *
 * An attachment names lines of one file, so a range that touches both versions has to choose:
 * both ends in the left column (deleted lines, or context on the left of a split view) are
 * the old version; anything else is the new version, from the first to the last selected line that
 * exists there — a deleted line in between falls away. Only deleted lines are still the old
 * version, since there is nothing else to name. `null` when an end is not a line of this patch.
 */
export function selectedLines(patch: string, range: LineRange): DiffLines | null {
  const rows = rowsOf(patch)
  const endSide = range.endSide ?? range.side
  const a = indexOf(rows, range.start, range.side)
  const b = indexOf(rows, range.end, endSide)
  if (a < 0 || b < 0) return null
  const [top, bottom] = a <= b ? [a, b] : [b, a]
  const covered = rows.slice(top, bottom + 1)
  const last =
    a <= b
      ? { lineNumber: range.end, side: endSide ?? 'additions' }
      : { lineNumber: range.start, side: range.side ?? 'additions' }
  const onNew = covered.filter((row) => row.new !== undefined)
  const leftOnly = range.side === 'deletions' && endSide === 'deletions'
  if (!leftOnly && onNew.length > 0) {
    return {
      side: 'new',
      from: onNew[0]?.new ?? 0,
      to: onNew.at(-1)?.new ?? 0,
      lines: onNew.map((row) => row.text),
      last,
    }
  }
  const onOld = covered.filter((row) => row.old !== undefined)
  return {
    side: 'old',
    from: onOld[0]?.old ?? 0,
    to: onOld.at(-1)?.old ?? 0,
    lines: onOld.map((row) => row.text),
    last,
  }
}

/**
 * A selection as `PierreDiff` hands it out and takes it back: the lines in our words, and the
 * range as the library drew it, so the highlight stays exactly where the user put it.
 */
export interface DiffSelection extends DiffLines {
  range: LineRange
}
