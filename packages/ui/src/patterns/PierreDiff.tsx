import {
  DEFAULT_THEMES,
  getFiletypeFromFileName,
  getHighlighterIfLoaded,
  preloadHighlighter,
  type SupportedLanguages,
} from '@pierre/diffs'
import { File as LibraryFile, PatchDiff } from '@pierre/diffs/react'
import type { CSSProperties, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Theme } from '../provider/theme'
import { useUiTheme } from '../provider/UiProvider'
import type { FileChange } from '../types'
import { type DiffSelection, type LineRange, selectedLines } from './diff-selection'
import { ignoreWhitespace } from './ignore-whitespace'
import { patchWithHeaders } from './patch-headers'
import { scrollTopForLine } from './scroll-to-line'
import { bundledLanguages } from './shiki-bundle'

/** The props of `PierreDiff`. */
export interface PierreDiffProps {
  /** A unified diff as the provider sent it; the headers are added here, not by the caller. */
  diff: string
  /** The path the diff belongs to: it names the block and picks the syntax highlighter. */
  path: string
  kind: FileChange['kind']
  /** Where a moved file came from, so a rename can name both of its sides. */
  fromPath?: string
  /** How the reader asked to see a diff; comes straight from `settings.layout`. */
  view: { style: 'stacked' | 'split'; wordWrap: boolean; ignoreWhitespace: boolean }
  /**
   * What to say when there is nothing left to draw — either because the change carried no patch or
   * because ignoring whitespace emptied it. A prop, not a `useTranslation()`: this component lives
   * in `shared/ui/` and takes its words from above, the way `Tabs`, `List` and `DropdownMenu`
   * do.
   */
  emptyLabel: string
  /**
   * Makes the lines selectable: a click on a line number, a drag over the numbers or a Shift-click
   * (the library's own gestures). Left out, the diff is read-only as it always was.
   */
  selection?: DiffSelectionProps
}

/**
 * Takes away the room the library keeps under the last line, so whatever stands below the block
 * (a footer, the next row) meets its bottom border directly.
 *
 * The library pads the bottom of `[data-code]` with `--diffs-gap-block` (8px) minus the scrollbar
 * gutter, and gives it `overflow-x: scroll` with a styled 6px scrollbar: 2px of padding plus a 6px
 * track under every block, whether it scrolls sideways or not (measured).
 * `auto` still draws the scrollbar under a block that does overflow. Neither line, colour nor word
 * of the diff changes; the top padding stays the library's.
 */
const TIGHT_BOTTOM = '[data-code] { padding-bottom: 0; overflow-x: auto; scrollbar-gutter: auto; }'

/**
 * The ground of a diff from the app's own token, `--nt-diff-bg`, rather than the library theme's
 * white and near-black: in light the white code area stood out as a block against the canvas,
 * so the token lies a shade under the canvas in both themes. The library resolves
 * `--diffs-bg` from its theme on the host and hands it down, so this one is set on the host and the
 * block and has to win with `!important`; the tints of added and removed lines mix with it.
 */
const DIFF_GROUND = ':host, pre { --diffs-bg: var(--nt-diff-bg) !important; }'

/** The selection of a `PierreDiff`, held by the caller so that it can clear it. */
export interface DiffSelectionProps {
  value: DiffSelection | null
  /** A finished gesture, or `null` when the user took the selection away. */
  onChange(next: DiffSelection | null): void
  /** Drawn inside the diff, under the lowest selected line, while there is a selection. */
  note?: ReactNode
}

/**
 * The colours and faces of every block of the library: the app's surface and text, the success and
 * danger tones for added and removed lines, Geist Mono at 12px.
 *
 * Both of the library's palettes read the same tokens, which already differ per theme; which of the
 * two it draws is `themeType` and `color-scheme`, from the app's theme (`withTheme`).
 */
const DIFF_STYLE = {
  '--diffs-dark-bg': 'var(--nt-surface)',
  '--diffs-dark': 'var(--nt-text)',
  '--diffs-added-dark': 'var(--nt-success)',
  '--diffs-deleted-dark': 'var(--nt-danger)',
  '--diffs-modified-dark': 'var(--nt-accent)',
  '--diffs-light-bg': 'var(--nt-surface)',
  '--diffs-light': 'var(--nt-text)',
  '--diffs-added-light': 'var(--nt-success)',
  '--diffs-deleted-light': 'var(--nt-danger)',
  '--diffs-modified-light': 'var(--nt-accent)',
  // The tint of a changed line, softer than the library's own 20% (and its 20%-on-top for the
  // changed words inside it). Not a taste: axe reads through the shadow root, and Shiki's own
  // keyword colours — a pink `#ff678d`, a purple `#9d6afb`, both from the library's theme and
  // neither ours to change — fell to 3,6:1 and 4,1:1 against the stronger tint. At these values
  // every token clears 4,5:1 and the line is still unmistakably green or red: the
  // contrast of the code is a requirement, not a preference.
  '--diffs-bg-addition-override': 'rgb(from var(--nt-success) r g b / 0.12)',
  '--diffs-bg-addition-emphasis-override': 'rgb(from var(--nt-success) r g b / 0.10)',
  '--diffs-bg-deletion-override': 'rgb(from var(--nt-danger) r g b / 0.12)',
  '--diffs-bg-deletion-emphasis-override': 'rgb(from var(--nt-danger) r g b / 0.10)',
  '--diffs-font-family': 'var(--nt-font-mono)',
  // No file header is drawn, but the library still sets its host and its hunk separators
  // ("n unmodified lines") in this face.
  '--diffs-header-font-family': 'var(--nt-font-sans)',
  '--diffs-font-size': '12px',
} as CSSProperties

/** One of the styles above in a theme: the library's `light-dark()` colours pick the same one. */
function withTheme(style: CSSProperties, theme: Theme): CSSProperties {
  return { ...style, colorScheme: theme }
}

/**
 * The one wrapper that knows `@pierre/diffs`, so replacing it later is one file.
 *
 * Three things happen here and nowhere else. **The vocabulary is translated**: the toolbar says
 * "stacked" and "split", the library understands `unified` and `split`, and that
 * mapping lives in this file so no screen has to know the other word. **The patch is made
 * whole**: `PatchDiff` refuses a bare hunk, so `patchWithHeaders` puts the `--- a/…` / `+++ b/…`
 * pair back that `file.changed.diff` lacks, after `ignoreWhitespace` has had its
 * say. **The accessibility is ours**: the library draws into a shadow root and documents no ARIA,
 * so the role, the name and the keyboard-reachable scroll are added out here, where our own tests
 * can see them.
 *
 * **The header is the caller's**: the library's own file header (name, counters) is switched off,
 * because the screen that places this block already has a row above it that says both — the row
 * is the header, and a second one inside the block would repeat it one line lower.
 *
 * **The block draws no side edges and no rounded corners**, only a line above and below, and its
 * focus ring lies inside it: a screen may let it bleed to the edges of a scrolling container, where
 * side borders would double the container's own edge and an outward outline would be clipped.
 * How far it bleeds is the screen's business, not this wrapper's.
 *
 * **Selecting lines is the library's, the words are ours**: with
 * `selection` the line numbers take a click, a drag and a Shift-click, and the finished range comes
 * back through `selectedLines` as lines of one version of the file. The caller holds the value, so
 * it can clear it once the note under the selection has done its work. While a drag is under way
 * the growing range is held here and drawn, and only the release reaches the caller: a controlled
 * selection draws nothing the prop does not say.
 *
 * Both memos exist because the library treats a fresh `options` object as a reason to re-theme the
 * whole block, which on a long diff is visible work — so neither the options nor the patch may be
 * rebuilt on a render that changed neither.
 */
export function PierreDiff({
  diff,
  path,
  kind,
  fromPath,
  view,
  emptyLabel,
  selection,
}: PierreDiffProps) {
  const ready = useHighlighterFor(path)
  const theme = useUiTheme()
  const patch = useMemo(() => {
    const source = view.ignoreWhitespace ? ignoreWhitespace(diff) : diff
    return patchWithHeaders(source, path, kind, fromPath)
  }, [diff, path, kind, fromPath, view.ignoreWhitespace])

  // The library keeps the first callback it gets in its options, and a new one would re-theme the
  // block (see the memos below), so one stable function reads the latest patch and caller.
  const latest = useRef({ patch, onChange: selection?.onChange })
  latest.current = { patch, onChange: selection?.onChange }
  // A controlled selection is only drawn from the prop, so while the pointer drags the growing
  // range is held here and handed back to the library; without it the marking lags until release.
  const [dragged, setDragged] = useState<LineRange | null | undefined>(undefined)
  const dragging = useRef(false)
  const onLineSelectionStart = useCallback((range: LineRange | null) => {
    dragging.current = true
    setDragged(range === null ? null : { ...range })
  }, [])
  const onLineSelectionChange = useCallback((range: LineRange | null) => {
    if (dragging.current) setDragged(range === null ? null : { ...range })
  }, [])
  const onLineSelectionEnd = useCallback(() => {
    dragging.current = false
    setDragged(undefined)
  }, [])
  const onLineSelected = useCallback((range: LineRange | null) => {
    // Handing the dragged range back makes the library report it as selected; only the release
    // finishes the gesture, so the note does not appear under a range that is still growing.
    if (dragging.current) return
    const { patch: current, onChange } = latest.current
    const lines = range === null ? null : selectedLines(current, range)
    onChange?.(lines === null || range === null ? null : { ...lines, range: { ...range } })
  }, [])
  const selectable = selection !== undefined

  const options = useMemo(
    () => ({
      themeType: theme,
      diffStyle: view.style === 'stacked' ? ('unified' as const) : ('split' as const),
      overflow: view.wordWrap ? ('wrap' as const) : ('scroll' as const),
      diffIndicators: 'classic' as const,
      preferredHighlighter: 'shiki-js' as const,
      disableFileHeader: true,
      unsafeCSS: `${TIGHT_BOTTOM} ${DIFF_GROUND}`,
      ...(selectable
        ? {
            enableLineSelection: true,
            onLineSelected,
            onLineSelectionStart,
            onLineSelectionChange,
            onLineSelectionEnd,
          }
        : {}),
    }),
    [
      theme,
      view.style,
      view.wordWrap,
      selectable,
      onLineSelected,
      onLineSelectionStart,
      onLineSelectionChange,
      onLineSelectionEnd,
    ],
  )
  const current = selection?.value ?? null
  const note = selection?.note
  // The note hangs under the lowest selected line as an annotation of the library: it scrolls
  // with the diff and pushes the lines below it down, instead of floating over them.
  const annotations = useMemo(
    () =>
      current !== null && note !== undefined
        ? [{ side: current.last.side, lineNumber: current.last.lineNumber }]
        : undefined,
    [current, note],
  )

  if (patch.length === 0) {
    return (
      // biome-ignore lint/a11y/useSemanticElements: a named group beside the file it describes, not a form.
      <div role="group" aria-label={path} className="p-3 text-[12px] text-muted">
        {emptyLabel}
      </div>
    )
  }

  // `overflow-x-auto`, not `overflow-hidden`: the element that takes focus below has to be the one
  // that can scroll, or the tab stop is a dead one. The focus ring is the app's accent, not the user
  // agent's default, and it is drawn inward (`-outline-offset-2`): a block that runs to the edge
  // of a scrolling panel would have an outward ring clipped at that edge.
  const className =
    'nt-pierre-diff overflow-x-auto border-y border-border outline-focus focus-visible:outline-2 focus-visible:-outline-offset-2'
  const style = withTheme(DIFF_STYLE, theme)

  return (
    // biome-ignore lint/a11y/useSemanticElements: a named group beside the file it describes, not a form.
    // biome-ignore lint/a11y/noNoninteractiveTabindex: a diff can scroll sideways, and WCAG 2.1.1 (axe: scrollable-region-focusable) wants the keyboard to reach that overflow too.
    <div role="group" aria-label={path} tabIndex={0} className={className} style={style}>
      {ready ? (
        <PatchDiff
          patch={patch}
          options={options}
          key={path}
          // `null`, not left out, once selectable: the library decides at creation whether the
          // selection is the caller's to hold, and it must be, or a note could never clear it.
          {...(selectable
            ? { selectedLines: dragged !== undefined ? dragged : (current?.range ?? null) }
            : {})}
          {...(annotations === undefined
            ? {}
            : { lineAnnotations: annotations, renderAnnotation: () => note })}
        />
      ) : null}
    </div>
  )
}

/**
 * The language `path` is drawn in: the library's own guess when our bundle carries its grammar,
 * plain text when it does not.
 *
 * A guess the bundle lacks is not harmless: `.java` is a language to the library, not `text`, so
 * the preload for it rejects and — when it is the first file of the window, before any other file
 * brought the themes in — the highlighter never gets its themes and the file draws nothing at all.
 * Asking for `text` loads the themes whatever the file is.
 */
function drawnLanguage(path: string): string {
  const name = path.slice(path.lastIndexOf('/') + 1).toLowerCase()
  const guess = BY_NAME.find(([pattern]) => pattern.test(name))?.[1]
  const library = getFiletypeFromFileName(path)
  const lang = guess ?? ALIASES[library] ?? library
  return Object.hasOwn(bundledLanguages, lang) ? lang : 'text'
}

/**
 * Files the library guesses wrong by name: a `.gradle` script is Groovy (the library says `text`),
 * `gradlew` is a shell script, Laravel's `artisan` is PHP, a
 * `Dockerfile.prod` is a Dockerfile, and an `.env.example` is as much dotenv as `.env` itself.
 */
const BY_NAME: readonly (readonly [RegExp, string])[] = [
  [/\.gradle$/, 'groovy'],
  [/^gradlew$/, 'shellscript'],
  [/^artisan$/, 'php'],
  [/^dockerfile\./, 'docker'],
  [/^\.env\./, 'dotenv'],
]

/**
 * The library's other names for a grammar our bundle keeps under one name only: a grammar loaded
 * under a second name would be registered twice.
 */
const ALIASES: Readonly<Record<string, string>> = {
  yml: 'yaml',
  dockerfile: 'docker',
  kts: 'kotlin',
}

/** Whether the library's shared highlighter is loaded, with its themes and the language of `lang`. */
function highlighterHas(lang: string): boolean {
  return getHighlighterIfLoaded({ theme: DEFAULT_THEMES, lang }) !== undefined
}

/**
 * Whether `PatchDiff` may be mounted for `path` yet: `true` once the shared highlighter has its
 * themes and the language of that file, and at once when an earlier diff already loaded them.
 *
 * **Why the diff waits for this.** Mounted before the highlighter exists, `PatchDiff` leaves its
 * first render to a promise, and under `StrictMode` (`bun run dev`) React mounts it, cleans it up
 * and mounts it again before that promise settles: the first instance's result lands on a cleaned-up
 * renderer and is dropped, and the second one takes the empty `<pre>` for hydrated markup and never
 * draws. The first diff opened in a fresh window stayed an empty block. With the
 * highlighter in place, `PatchDiff` draws synchronously on mount, which survives the double mount.
 * The library waits for the same highlighter itself, so a production build loses nothing.
 *
 * A language the bundle does not carry makes the preload reject; the diff is mounted anyway and
 * the library falls back to plain text (`shiki-bundle.ts`).
 */
function useHighlighterFor(path: string): boolean {
  const lang = drawnLanguage(path)
  const [loaded, setLoaded] = useState<string | null>(() => (highlighterHas(lang) ? lang : null))
  useEffect(() => {
    if (loaded === lang || highlighterHas(lang)) {
      setLoaded(lang)
      return
    }
    let live = true
    const settle = () => {
      if (live) setLoaded(lang)
    }
    preloadHighlighter({
      themes: [DEFAULT_THEMES.dark, DEFAULT_THEMES.light],
      langs: [lang],
      preferredHighlighter: 'shiki-js',
    }).then(settle, settle)
    return () => {
      live = false
    }
  }, [lang, loaded])
  return loaded === lang
}

/**
 * `DIFF_STYLE` with a quieter marked line: the library mixes its own blue into a selected line,
 * and axe reads Shiki's pink keyword (`#ff678d`) against it at 4,1:1. The accent's own subtle tint
 * as the mix target keeps the line recognisable and every token over 4,5:1.
 */
const FILE_STYLE = {
  ...DIFF_STYLE,
  '--diffs-bg-selection-override': 'var(--nt-accent-subtle)',
} as CSSProperties

/**
 * The file's code does not scroll on its own: the focusable group around it does, both ways, so
 * the keyboard reaches every overflow (axe: scrollable-region-focusable) and there is one
 * scrollbar, not one inside another.
 *
 * `contain: none` as well: the library contains its code (`contain: content`), and paint
 * containment clips whatever overflows — a long line was cut off at the edge of a narrow panel,
 * with nothing to scroll.
 */
const FILE_CSS = '[data-code] { padding-bottom: 0; overflow: visible; contain: none; }'

/**
 * `FILE_CSS` for a file whose long lines wrap: the code may not grow wider than the region, and
 * the rows after the first of a wrapped line stand 2ch further in than its first, a hanging
 * indent, so the eye reads them as the rest of that line and not as lines without a number.
 *
 * The library keeps 2ch before every line (`padding-inline-start`); here that becomes 4ch, and the
 * first row takes 2ch back with `text-indent`. The number stands once, beside the first row: the
 * gutter is a cell of the same grid row, which grows with the wrapped line.
 */
const WRAPPED_FILE_CSS = `${FILE_CSS} [data-code] { min-width: 0; } [data-line] { padding-inline-start: 4ch; text-indent: -2ch; }`

/** The props of `PierreFile`. */
export interface PierreFileProps {
  /** The whole text of the file, as `files.read` gave it. */
  text: string
  /** The path relative to the working directory: it names the block and picks the highlighter. */
  path: string
  /** A line to mark and scroll to, counted from 1. */
  line?: number
  /**
   * Wraps long lines inside the width there is, instead of scrolling sideways: the chat's preview
   * wraps, the file tab does not (there a line keeps its shape).
   */
  wrap?: boolean
  /**
   * Takes the focus once the file is drawn, so the arrow keys, PageUp and PageDown scroll it at
   * once — but only while the focus is still on the panel around it (or nowhere): a reader who
   * already moved on to a button keeps it.
   */
  autoFocus?: boolean
}

/**
 * One file, read-only, with line numbers and the syntax colours of the languages of `shiki-bundle.ts`: the
 * library's `File` behind the same wall as `PatchDiff`, so the library stays
 * replaceable in one file.
 *
 * Here because this file is the one place that may import `@pierre/diffs`. A language the bundle
 * does not carry is drawn as plain text. A `line` is marked through the library's own selection —
 * the same marking as a selected line in a diff — and scrolled into view once it is drawn; the
 * column, if there is one, is not marked apart. Like `PierreDiff`, the block is a named
 * group whose scrolling region the keyboard can reach.
 */
export function PierreFile({ text, path, line, wrap = false, autoFocus = false }: PierreFileProps) {
  const ready = useHighlighterFor(path)
  const theme = useUiTheme()
  const host = useRef<HTMLDivElement>(null)
  // With the language it is drawn in, so the library does not go and ask for a grammar we lack.
  const file = useMemo(
    () => ({ name: path, contents: text, lang: drawnLanguage(path) as SupportedLanguages }),
    [path, text],
  )
  const options = useMemo(
    () => ({
      themeType: theme,
      overflow: wrap ? ('wrap' as const) : ('scroll' as const),
      preferredHighlighter: 'shiki-js' as const,
      disableFileHeader: true,
      unsafeCSS: wrap ? WRAPPED_FILE_CSS : FILE_CSS,
    }),
    [wrap, theme],
  )
  const selected = useMemo(() => (line === undefined ? null : { start: line, end: line }), [line])

  // The library draws into a shadow root, asynchronously: the marked line is looked for until it
  // is there, and then brought into the middle of this region once — this region only, not the
  // panel or the window around it (`scrollTopForLine`).
  useEffect(() => {
    if (!ready || line === undefined) return
    let frame = 0
    let tries = 0
    const find = () => {
      const region = host.current
      const root = [...(region?.querySelectorAll('*') ?? [])].find(
        (element) => element.shadowRoot !== null,
      )?.shadowRoot
      const target = root?.querySelector('[data-line][data-selected-line]')
      if (region && target) {
        const box = target.getBoundingClientRect()
        const bounds = region.getBoundingClientRect()
        region.scrollTo({
          top: scrollTopForLine(
            { top: box.top, height: box.height },
            {
              top: bounds.top,
              height: region.clientHeight,
              scrollTop: region.scrollTop,
              scrollHeight: region.scrollHeight,
            },
          ),
        })
        return
      }
      tries += 1
      if (tries < 120) frame = requestAnimationFrame(find)
    }
    frame = requestAnimationFrame(find)
    return () => cancelAnimationFrame(frame)
  }, [ready, line])

  // Only from the panel around it, or from nowhere: never away from a control the reader chose.
  useEffect(() => {
    const region = host.current
    if (!ready || !autoFocus || !region) return
    const active = document.activeElement
    if (active === null || active === document.body || active.contains(region)) {
      region.focus({ preventScroll: true })
    }
  }, [ready, autoFocus])

  // `min-h-0 flex-1` beside `h-full`: in a column that only has a maximum height (the popover),
  // a percentage height resolves to nothing and the file grew past the panel, clipped instead of
  // scrolled — 32 lines and no more. As a flex item it takes what is left and scrolls.
  const className =
    'nt-pierre-file h-full min-h-0 flex-1 overflow-auto outline-focus focus-visible:outline-2 focus-visible:-outline-offset-2'
  return (
    // biome-ignore lint/a11y/useSemanticElements: a named group for the file it shows, not a form.
    <div
      ref={host}
      role="group"
      aria-label={path}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the file scrolls, and WCAG 2.1.1 (axe: scrollable-region-focusable) wants the keyboard to reach it.
      tabIndex={0}
      className={className}
      style={withTheme(FILE_STYLE, theme)}
    >
      {ready ? (
        <LibraryFile file={file} options={options} selectedLines={selected} key={path} />
      ) : null}
    </div>
  )
}
