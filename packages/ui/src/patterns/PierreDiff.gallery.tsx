import type { Story } from '../gallery/story'
import { PierreDiff } from './PierreDiff'

const stackedView = { style: 'stacked' as const, wordWrap: false, ignoreWhitespace: false }

const added = [
  '@@ -0,0 +1,3 @@',
  '+export function greet(name: string): string {',
  // biome-ignore lint/suspicious/noTemplateCurlyInString: the literal text of the added line, not a template of this file.
  '+  return `Hi, ${name}`',
  '+}',
].join('\n')

const removed = [
  '@@ -1,3 +0,0 @@',
  '-export function greet(name: string): string {',
  "-  return 'Hi'",
  '-}',
].join('\n')

const mixed = [
  '@@ -1,4 +1,5 @@',
  ' export function greet(name: string): string {',
  "-  return 'Hi'",
  "+  if (!name) return 'Hi, stranger'",
  // biome-ignore lint/suspicious/noTemplateCurlyInString: the literal text of the added line, not a template of this file.
  '+  return `Hi, ${name}`',
  ' }',
].join('\n')

/** The third line of `mixed` on its new side, as a selection of lines 2–3 carries it. */
// biome-ignore lint/suspicious/noTemplateCurlyInString: the literal text of the added line, not a template of this file.
const mixedLine3 = '  return `Hi, ${name}`'

const long = [
  '@@ -1,1 +1,30 @@',
  ...Array.from({ length: 30 }, (_, i) => `+export const line${i + 1} = ${i + 1}`),
].join('\n')

const unknownLanguage = ['@@ -1,1 +1,1 @@', '-old value', '+new value'].join('\n')

/**
 * Six states of `PierreDiff`, mirroring what `FileEdit` (`features/changes/FileRow.tsx`) feeds
 * it: an added file, a removed one, a mixed edit, a long file, and one whose extension we do not
 * bundle a grammar for — the last two exist to make the axe pass and the eye check
 * that `@pierre/diffs` never freezes or errors on either.
 */
export default {
  group: 'patterns',
  title: 'PierreDiff',
  states: {
    Added: () => (
      <PierreDiff
        diff={added}
        path="/work/lezer/src/greet.ts"
        kind="add"
        view={stackedView}
        emptyLabel="Geen wijziging"
      />
    ),
    Removed: () => (
      <PierreDiff
        diff={removed}
        path="/work/lezer/src/greet.ts"
        kind="delete"
        view={stackedView}
        emptyLabel="Geen wijziging"
      />
    ),
    Mixed: () => (
      <PierreDiff
        diff={mixed}
        path="/work/lezer/src/greet.ts"
        kind="modify"
        view={stackedView}
        emptyLabel="Geen wijziging"
      />
    ),
    Long: () => (
      <div className="w-96">
        <PierreDiff
          diff={long}
          path="/work/lezer/src/generated.ts"
          kind="add"
          view={stackedView}
          emptyLabel="Geen wijziging"
        />
      </div>
    ),
    'Unknown language': () => (
      <PierreDiff
        diff={unknownLanguage}
        path="/work/lezer/notes.zzz"
        kind="modify"
        view={stackedView}
        emptyLabel="Geen wijziging"
      />
    ),
    // Last, so it moves no reference above it: lines 2–3 selected, with a stand-in where the
    // changes tab hangs its note box (`LineNote`, which `shared/ui/` may not import).
    'Selected lines': () => (
      <PierreDiff
        diff={mixed}
        path="/work/lezer/src/greet.ts"
        kind="modify"
        view={stackedView}
        emptyLabel="Geen wijziging"
        selection={{
          value: {
            side: 'new',
            from: 2,
            to: 3,
            lines: ["  if (!name) return 'Hi, stranger'", mixedLine3],
            last: { lineNumber: 3, side: 'additions' },
            range: { start: 2, side: 'additions', end: 3, endSide: 'additions' },
          },
          onChange() {},
          note: (
            <div className="mx-3 my-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 font-sans text-[13px] text-muted">
              Note box
            </div>
          ),
        }}
      />
    ),
  },
} satisfies Story
