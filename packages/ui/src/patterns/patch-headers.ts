import type { FileChange } from '../types'

/**
 * The first line of `diff` that is not empty, or `undefined` for a diff that has none.
 *
 * `PatchDiff` only cares about the very first line: a diff that already carries a `---` header
 * elsewhere in its text (it should not, but nothing stops a provider from sending one) still needs
 * headers added in front of it, so this looks at the start of the text, not anywhere in it.
 */
function firstNonEmptyLine(diff: string): string | undefined {
  return diff.split('\n').find((line) => line.length > 0)
}

/**
 * The three openings that mean "this patch names its own file already".
 *
 * `---` is the one `PatchDiff` reads, but it is not the only line a real patch starts with: git
 * opens with `diff --git a/… b/…` and every `svn diff`-shaped tool with `Index: …`, both followed
 * by the `---`/`+++` pair further down. Gluing a second pair in front of either would name the
 * file twice, and the invented name would be the one on top.
 */
const CARRIES_HEADERS = /^(---|diff --git |Index: )/

/** Whether `diff` opens with a line that already names the file it changes. */
function carriesHeaders(diff: string): boolean {
  const first = firstNonEmptyLine(diff)
  return first !== undefined && CARRIES_HEADERS.test(first)
}

/**
 * The `--- <from>` / `+++ <to>` pair for one kind of change.
 *
 * **No `a/`/`b/` prefix anywhere.** `PatchDiff` only strips it when the patch also carries a
 * `diff --git` line (`FILENAME_HEADER_REGEX_GIT` vs. the plain `FILENAME_HEADER_REGEX` in its
 * parser) — a header we never add, because it names an object id and a mode we do not have.
 * Without it the prefix is read as a literal part of the path: a prefixed pair for the same file
 * makes it a rename of itself, and a prefixed side across from `/dev/null` puts a visible
 * `b/` in front of the name in the header of every created file. Both were seen on screen before
 * the prefix went.
 *
 * `add`, `delete` and a real `move` are the only kinds that name two different paths; `modify` and
 * `copy` name the same string twice.
 */
function headerPaths(
  path: string,
  kind: FileChange['kind'],
  fromPath: string | undefined,
): readonly [from: string, to: string] {
  if (kind === 'add') return ['/dev/null', path]
  if (kind === 'delete') return [path, '/dev/null']
  if (kind === 'move' && fromPath !== undefined) return [fromPath, path]
  // A `move` without a `fromPath` should not happen, but is not a reason to throw either.
  return [path, path]
}

/**
 * Puts the `---` / `+++` lines back that `PatchDiff` needs and `file.changed.diff` lacks.
 *
 * `@pierre/diffs`' `PatchDiff` refuses a bare hunk: it reads the file header to know which side is
 * old and which is new, and our protocol never carried that header because a provider reports a
 * path and a kind, not a patch file. Deriving it here, from exactly those two fields, is the one
 * place that has to know the mapping — a provider that *does* send its own headers is left alone,
 * so a caller never pays for headers it already has.
 */
export function patchWithHeaders(
  diff: string,
  path: string,
  kind: FileChange['kind'],
  fromPath?: string,
): string {
  if (diff.length === 0) return diff
  if (carriesHeaders(diff)) return diff

  const [from, to] = headerPaths(path, kind, fromPath)
  return `--- ${from}\n+++ ${to}\n${diff}`
}
