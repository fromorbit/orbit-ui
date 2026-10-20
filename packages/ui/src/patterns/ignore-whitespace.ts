/**
 * Splits diff text into lines, dropping the one blank entry a trailing newline produces.
 *
 * That trailing entry is a side effect of `split('\n')`, not a line the provider meant to send —
 * counted as one it would draw a phantom line at the bottom of every diff that ends the way a file
 * normally does.
 */
function splitLines(text: string): string[] {
  if (text.length === 0) return []
  const lines = text.split('\n')
  if (lines[lines.length - 1] === '') lines.pop()
  return lines
}

/** All whitespace removed, so two lines that differ only in it compare equal. */
function stripWhitespace(text: string): string {
  return text.replace(/\s+/g, '')
}

/**
 * Drops the `-`/`+` pairs of one hunk's body that differ only in whitespace, keeping the order of
 * everything else.
 *
 * A run of consecutive `-` lines directly followed by a run of consecutive `+` lines is the shape
 * a unified diff draws for one edit; the line at position *i* of the removed run is compared
 * against the line at position *i* of the added run, with all whitespace stripped from both. A
 * pair that turns out equal is dropped together; a pair that does not, and a `-` or `+` line with
 * no partner on the other side, passes through untouched. Context lines are never touched.
 */
function filterBody(lines: readonly string[]): string[] {
  const result: string[] = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index] as string
    if (!line.startsWith('-')) {
      result.push(line)
      index++
      continue
    }

    const removed: string[] = []
    let cursor = index
    while (cursor < lines.length && (lines[cursor] as string).startsWith('-')) {
      removed.push(lines[cursor] as string)
      cursor++
    }
    const added: string[] = []
    while (cursor < lines.length && (lines[cursor] as string).startsWith('+')) {
      added.push(lines[cursor] as string)
      cursor++
    }

    const pairCount = Math.min(removed.length, added.length)
    for (let i = 0; i < pairCount; i++) {
      const removedLine = removed[i] as string
      const addedLine = added[i] as string
      if (stripWhitespace(removedLine.slice(1)) !== stripWhitespace(addedLine.slice(1))) {
        result.push(removedLine, addedLine)
      }
    }
    // A run with more removals than additions (or the reverse) leaves the extra lines as real,
    // unmatched changes rather than dropping them for lack of a partner.
    for (let i = pairCount; i < removed.length; i++) result.push(removed[i] as string)
    for (let i = pairCount; i < added.length; i++) result.push(added[i] as string)

    index = cursor
  }
  return result
}

/** One `@@ … @@` section of a diff, or the one implicit section a headerless diff gets. */
interface Section {
  readonly header?: string
  readonly lines: readonly string[]
}

/** A diff cut in two: everything above the first hunk, and the hunks themselves. */
interface SplitDiff {
  /**
   * The lines before the first `@@`, exactly as they came in.
   *
   * A provider may send its own `diff --git`, `---` and `+++` lines, and those are promised to be
   * left alone. They must not reach `filterBody`, which would read `---`/`+++` as a
   * removal and an addition, and they must not be dropped either: `patchWithHeaders` would then
   * glue a second pair in front of headers the patch already had.
   */
  readonly preamble: readonly string[]
  readonly sections: readonly Section[]
}

const HUNK_HEADER = /^@@ /

/** Splits diff lines into their `@@`-delimited sections, keeping each header's exact text. */
function splitSections(lines: readonly string[]): SplitDiff {
  const headerIndexes: number[] = []
  lines.forEach((line, index) => {
    if (HUNK_HEADER.test(line)) headerIndexes.push(index)
  })
  if (headerIndexes.length === 0) return { preamble: [], sections: [{ lines }] }

  const first = headerIndexes[0] as number
  const sections = headerIndexes.map((start, i) => {
    const end = i + 1 < headerIndexes.length ? (headerIndexes[i + 1] as number) : lines.length
    return { header: lines[start] as string, lines: lines.slice(start + 1, end) }
  })
  return { preamble: lines.slice(0, first), sections }
}

/** Whether a body line is a change rather than context; context alone is nothing to show. */
function isChange(line: string): boolean {
  return line.startsWith('+') || line.startsWith('-')
}

/**
 * Drops the changes that are only whitespace, for a reader who asked not to see them.
 *
 * We have no git to ask (a tool with git asks it when it builds the patch), so
 * this reads the patch text itself: a `-`/`+` pair that is identical once every whitespace
 * character is thought away is not a change worth showing. A hunk with no `+` or `-` left after
 * that disappears with its header and with the context lines it still carried — context without a
 * change is a hunk that shows nothing — and a diff that loses every hunk this way becomes the
 * empty string, the same "nothing to show" `PierreDiff` already knows how to draw. Headers the
 * provider sent above the first hunk ride along untouched, and go with it when nothing is left.
 *
 * **Line numbers in a filtered hunk's `@@`-header are not recomputed.** They become an
 * approximation once lines are dropped from under them, and an approximation is more honest than
 * a number invented to match nothing.
 */
export function ignoreWhitespace(diff: string): string {
  const lines = splitLines(diff)
  if (lines.length === 0) return ''

  const { preamble, sections } = splitSections(lines)
  const kept: string[] = []
  for (const section of sections) {
    const filteredBody = filterBody(section.lines)
    if (!filteredBody.some(isChange)) continue
    if (section.header !== undefined) kept.push(section.header)
    kept.push(...filteredBody)
  }
  if (kept.length === 0) return ''
  return [...preamble, ...kept].join('\n')
}
