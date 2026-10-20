import { FILE_TREE_DENSITY_PRESETS } from '@pierre/trees'
import { FileTree, useFileTree } from '@pierre/trees/react'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useUiTheme } from '../provider/UiProvider'
import { FILE_ICONS } from './file-icons'

/**
 * The height of one row at `density: 'compact'`, read from the library rather than written down.
 *
 * `FileTree` always virtualizes — `data-file-tree-virtualized="true"` is hard-coded in its own
 * renderer — and its stylesheet gives a virtualized host `height: 100%`. A percentage height
 * against a parent that sizes to its content is indefinite, so the whole tree collapses to nothing
 * unless somebody hands it a real height. Nobody else can: the caller knows how much room it may
 * take (`max-h-48` in the changes tab), not how much it needs. So this component measures itself,
 * and the caller's box stays the maximum and the scroll it was meant to be.
 */
const ROW_HEIGHT = FILE_TREE_DENSITY_PRESETS.compact.itemHeight

/**
 * The status this app tracks for a row, already spelled the way `@pierre/trees` wants it.
 *
 * `'untracked'` is the tab Bestanden's `new` mark and `'ignored'` its dimmed rows; only
 * Wijzigingen passes one through `entries` directly.
 */
type EntryStatus = 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked' | 'ignored'

interface PierreTreeEntry {
  /**
   * Relative to the workspace, the way `FileChange.path` carries it. **Not absolute**: the library
   * matches its `gitStatus` against relative paths only, and a leading slash costs every row its
   * colour without any complaint — the tree still draws, it just goes grey.
   */
  path: string
  /** Left out for a row with nothing to colour — the tab Bestanden marks through `statuses` instead. */
  status?: EntryStatus
  /**
   * `'dir'` for a folder named explicitly rather than derived from a file under it — the tab
   * Bestanden lists a folder before it knows what is inside. Left out (`'file'`) for
   * everything Wijzigingen has always passed, where every folder is derived from a file's path.
   */
  kind?: 'file' | 'dir'
}

/**
 * One marked path of the tab Bestanden: kept apart from `entries` rather than merged
 * into them, because almost no path of a large tree carries a mark.
 */
export interface PierreTreeStatus {
  path: string
  mark: 'modified' | 'added' | 'new' | 'ignored'
  /** `'dir'` for a whole ignored folder, the one kind of folder that carries a mark of its own. */
  kind?: 'dir'
}

/** A mark a folder shows for what changed below it; what git ignores never reaches a folder. */
type FolderMark = Exclude<PierreTreeStatus['mark'], 'ignored'>

/** `modified` wins over `added`, both over `new` — the same rule as `markFolders` in core. */
const FOLDER_STRENGTH = { modified: 3, added: 2, new: 1 } as const

/**
 * Every folder above a changed file, with the strongest mark below it.
 *
 * Derived here rather than left to the library: `@pierre/trees` counts an ignored path as a change
 * of every folder above it, and would put a dot on `src` for a `src/fout.log` git ignores.
 */
function foldersWithChanges(statuses: readonly PierreTreeStatus[]): Map<string, FolderMark> {
  const folders = new Map<string, FolderMark>()
  for (const { path, mark } of statuses) {
    if (mark === 'ignored') continue
    const segments = path.split('/').slice(0, -1)
    let prefix = ''
    for (const segment of segments) {
      prefix = prefix === '' ? segment : `${prefix}/${segment}`
      const existing = folders.get(prefix)
      if (existing === undefined || FOLDER_STRENGTH[mark] > FOLDER_STRENGTH[existing]) {
        folders.set(prefix, mark)
      }
    }
  }
  return folders
}

/** The library's own status for one of the tab Bestanden's marks. */
function libraryStatus(mark: PierreTreeStatus['mark']): EntryStatus {
  return mark === 'new' ? 'untracked' : mark
}

/**
 * The words of the marks of a tree with `statuses`, in the host's language: the letter at the right
 * of a row and the word of its tooltip, per mark, and the tooltip of a folder's dot. The letters
 * are git's and VS Code's (`M`, `A`, `U`) in every language, but still the host's to give.
 */
export interface PierreTreeMarkLabels {
  letters: Record<'modified' | 'added' | 'new', string>
  words: Record<'modified' | 'added' | 'new', string>
  /** The dot of a folder with a changed path below it: "Bevat wijzigingen". */
  folder: string
}

/** The props every variant of `PierreTree` shares. */
export interface PierreTreeBaseProps {
  /** Every file in the tree, with the status that colours its row (Wijzigingen's own use). */
  entries: readonly PierreTreeEntry[]
  /** The row that is selected, and the one a click reports back. */
  selectedPath?: string
  onSelect(path: string): void
  label: string
  /**
   * Takes the height of its parent instead of measuring its own rows.
   *
   * The measuring in `ROW_HEIGHT`'s doc exists because Wijzigingen puts this tree in a `max-h-48`
   * that must shrink to its content; the tab Bestanden gives it a place of a height already known,
   * where measuring would only fight the parent for the last word.
   */
  fill?: boolean
  /** `initialExpansion` of the library: every folder open (the default) or every folder closed. */
  expansion?: 'open' | 'closed'
  /**
   * A folder was opened whose contents this tree does not have yet: no entry below it. The tab
   * Bestanden asks core for that folder's children then; growing `entries` afterwards leaves every
   * folder the reader opened still open.
   */
  onOpenFolder?: (dir: string) => void
  /**
   * Folders to start expanded, read once at mount — a restored stand, not a
   * controlled value: a later change of this prop does nothing, the way React's own
   * `defaultValue` does not either. Left out, the tree starts exactly as `expansion` says.
   */
  initialExpandedPaths?: readonly string[]
  /**
   * The folders that are open right now, whenever that set changes — for a caller that remembers
   * it. Paths, not the library's own trailing-slash form.
   */
  onExpansionChange?: (openFolders: readonly string[]) => void
  /**
   * Narrows the tree to the paths that contain this text, through the library's own search
   * (`hide-non-matches`): case-insensitive, on the whole path, so a `/` in it matches at
   * a folder's edge; the folders above a match open. Empty or left out, the tree shows everything,
   * with the folders open that the reader had open before the filter began.
   *
   * While a filter stands, a folder it opens is not the reader's: neither `onOpenFolder` nor
   * `onExpansionChange` hears of it, so the tab never loads or remembers what a filter unfolded.
   */
  filter?: string
  /**
   * The paths that match `filter`, in the order the rows show them, whenever the filter or the
   * paths change — empty for a filter that matches nothing. The library then shows every row (it
   * hides nothing without a match), so it is the caller that says "Geen treffers".
   */
  onFilterMatches?: (paths: readonly string[]) => void
}

/**
 * The props of `PierreTree`: marks through `statuses` come with their words, or not at all.
 */
export type PierreTreeProps = PierreTreeBaseProps &
  (
    | { statuses?: undefined; markLabels?: undefined }
    | {
        /**
         * The tab Bestanden's own marks (colour plus letter, as VS Code
         * shows them), kept apart from `entries`. Each colours its row; `modified`, `added` and `new` also put
         * `M`, `A` or `U` at its right with the word as tooltip, and a folder with a changed path below
         * it — loaded or not — gets a 6px dot. `ignored` only dims the row.
         *
         * Given at mount or not at all: with it the library's own git lane (fixed English tooltips) makes
         * way for a lane of this component, whose texts are `markLabels`.
         */
        statuses: readonly PierreTreeStatus[]
        /** The letters and words of the marks; given together with `statuses`. */
        markLabels: PierreTreeMarkLabels
      }
  )

/**
 * What a caller can ask this tree to do from outside: put the DOM focus on one row.
 *
 * The one imperative hole in `PierreTree`'s otherwise prop-driven API — closing the preview under
 * the tab Bestanden has to give the focus back to the row that opened it, and that row
 * lives inside the library's own shadow root, out of reach of an ordinary DOM query from outside
 * the one file that is allowed to know `@pierre/trees` exists.
 */
export interface PierreTreeHandle {
  focusPath(path: string): void
  /**
   * The path of the row that has the tree's own focus right now, or `null` before anything has
   * been interacted with.
   *
   * The library reports only a *change* of selection (`onSelect`), never a click on the row that
   * was already selected — but a click always moves the tree's internal focus to the row it
   * landed on, whether or not that changes the selection. A caller that needs to know which row a
   * click really named, even a reselect, reads this from its own bubble-phase `onClick` (the
   * library's own row handling has already run inside its shadow root's target phase by then).
   */
  getFocusedPath(): string | null
  /**
   * Clears the library's own selection, so a later click on the same row is a genuine change of
   * selection again — a caller that stops showing what it selected (the tab Bestanden closing its
   * preview) has to say so here too, or the library still thinks that row is selected and a
   * plain reselect of it never reaches `onSelect` at all.
   */
  deselectPath(path: string): void
  /**
   * Puts the focus, the tree's and the DOM's, on the first row that shows — ↓ from the filter above
   * the tree. Does nothing for an empty tree.
   */
  focusFirst(): void
  /** Whether the row with the tree's focus is the first that shows: ↑ there goes back to the filter. */
  isFirstFocused(): boolean
  /**
   * The first file that matches the filter, in the order of the rows, or `null` without one —
   * Enter in the filter chooses it. A folder is passed over: choosing one would only
   * fold it shut.
   */
  firstMatch(): string | null
}

/** `path`, with the trailing slash that names it a folder to the library, whether or not it has one. */
function asDirectoryPath(path: string): string {
  return path.endsWith('/') ? path : `${path}/`
}

/** The trailing slash the library's canonical directory paths carry, gone again for our own code. */
function withoutTrailingSlash(path: string): string {
  return path.endsWith('/') ? path.slice(0, -1) : path
}

/**
 * The tokens our theme gives `@pierre/trees` through its shadow host, in the shape
 * its React binding expects: a transparent background (the panel already draws
 * one), selection and hover taken from `currentColor` rather than a fixed hue — the surrounding
 * text colour follows the theme by itself, so it is the only signal worth borrowing — and our own
 * type. `unsafeCSS` is a static string read once at construction (see `PierreTree`'s effects for
 * what does have to be pushed in on every change), so it never depends on a prop.
 *
 * Every name here is one the library actually reads: its stylesheet declares each token as
 * `var(--trees-<name>-override, <fallback>)`, so a name it does not declare is a line that does
 * nothing at all. Hover is `--trees-bg-muted`, not a `--trees-hover-bg` — that one does not exist.
 * The `color-scheme` on the host is what makes the `light-dark()` fallbacks the library keeps for
 * the colours we do *not* override — the git status of a row above all — pick the app's theme, the
 * same one `PierreDiff` asks for with `themeType`. It rides on the element's own style, from
 * `useUiTheme`, since this string is read once and the theme switches live.
 */
const UNSAFE_CSS = `
  :host {
    --trees-bg-override: transparent;
    --trees-fg-override: currentColor;
    --trees-selected-bg-override: color-mix(in srgb, currentColor 14%, transparent);
    --trees-bg-muted-override: color-mix(in srgb, currentColor 7%, transparent);
    --trees-border-color-override: var(--nt-border);
    --trees-font-family-override: var(--nt-font-sans);
    --trees-font-size-override: 12px;
    /* No inset of the tree's own: the place that puts it down owns the gutter, so its rows line
       up with whatever stands beside them there instead of sitting one padding further in. The
       margin around each row goes too, or a row's background would stop short of that gutter by
       a pixel and a half; the padding inside a row stays the library's. */
    --trees-padding-inline-override: 0;
    --trees-item-margin-x-override: 0;
    /* The tree scrolls inside its own shadow root, where the app's \`::-webkit-scrollbar\` rules
       do not reach; the library draws the same kind of bar (no track, thumb only under the
       pointer), so it gets our size and colour through its own tokens. */
    --trees-scrollbar-gutter-override: var(--nt-scrollbar-size);
    --trees-scrollbar-thumb-override: var(--nt-scrollbar-thumb);
    /* Two colours in a tree, not four: every file icon in \`muted\` — each type's
       own colour falls back on this one first — and the git letters in the status tokens of the
       app rather than the library's teal and blue. */
    --trees-fg-muted-override: var(--nt-text-muted);
    --trees-file-icon-color: var(--nt-text-muted);
    --trees-status-added-override: var(--nt-success);
    --trees-status-untracked-override: var(--nt-success);
    --trees-status-modified-override: var(--nt-attention);
    --trees-status-renamed-override: var(--nt-attention);
    --trees-status-deleted-override: var(--nt-danger);
    --trees-status-ignored-override: var(--nt-text-muted);
  }
  /* A ring means keyboard focus, never selection: the
     library rings its focused row in the accent whether a click or a key put it there, and also
     while the focus is elsewhere. Only a row that has the focus from the keyboard keeps it; the
     chosen row is the neutral plane of the selection. */
  [data-item-focused="true"]:not(:focus-visible)::before {
    outline-style: none !important;
  }
  /* A 4px thumb inside the 8px bar, like everywhere else in the app (the library leaves 1px). */
  [data-file-tree-virtualized-scroll]::-webkit-scrollbar-thumb {
    border-width: 2px;
  }
  /* The library keeps a stable scrollbar gutter, which leaves an empty strip on the right of a
     tree that does not scroll at all and stops every row short of the edge the gutter above
     sets. \`auto\` gives that strip back until there is something to scroll; the scrollbar itself
     stays. */
  [data-file-tree-virtualized-scroll] {
    scrollbar-gutter: auto;
  }
`

/**
 * With `statuses`: the library's git lane gives way to its decoration lane, drawn by this
 * component (`renderRowDecoration`) so the tooltip of a letter or a dot comes from the catalogue —
 * the git lane's own are fixed English ("Git status: modified"). The decoration lane takes the git
 * lane's width, colour and weight, so the row looks the same as before; the row's own
 * `data-item-git-status` still colours the name and dims an ignored one.
 */
const STATUS_LANE_CSS = `
  [data-item-section="git"] {
    display: none;
  }
  [data-item-section="decoration"] > span {
    flex: none;
    width: var(--trees-git-lane-width);
    justify-content: center;
  }
  [data-item-git-status] > [data-item-section="decoration"] {
    color: var(--trees-item-git-status-color);
    font-weight: var(--trees-font-weight-semibold);
  }
  [data-item-type="folder"] > [data-item-section="decoration"] {
    color: var(--trees-git-modified-color);
    opacity: 0.5;
    fill: currentColor;
  }
`

/**
 * The one wrapper that knows `@pierre/trees`, so replacing it later is one file.
 *
 * `useFileTree` only ever reads the options object it is called with on the very first render —
 * it seeds one `FileTree` instance through `useState` and never looks at the argument again — so
 * every prop that can change after mount (`entries`, `selectedPath`, and `onSelect` itself) has to
 * reach the model through its own imperative method in an effect, the pattern the
 * library's React binding calls for. `onSelectRef` exists for the same reason: the closure
 * `onSelectionChange` captures at construction time must still call today's `onSelect`, not the
 * one that existed when the tree was built.
 */
export const PierreTree = forwardRef<PierreTreeHandle, PierreTreeProps>(function PierreTree(
  {
    entries,
    selectedPath,
    onSelect,
    label,
    fill,
    expansion,
    onOpenFolder,
    statuses,
    markLabels,
    initialExpandedPaths,
    onExpansionChange,
    filter,
    onFilterMatches,
  }: PierreTreeProps,
  handle,
) {
  const theme = useUiTheme()
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const onOpenFolderRef = useRef(onOpenFolder)
  onOpenFolderRef.current = onOpenFolder
  const onExpansionChangeRef = useRef(onExpansionChange)
  onExpansionChangeRef.current = onExpansionChange
  const onFilterMatchesRef = useRef(onFilterMatches)
  onFilterMatchesRef.current = onFilterMatches
  // Normalised the way the library itself does (trimmed); read by the subscription below, which is
  // set up once and must still see today's filter.
  const activeFilter = (filter ?? '').trim()
  const activeFilterRef = useRef(activeFilter)
  activeFilterRef.current = activeFilter
  // `onSelectionChange` below is captured once, at construction, before `model` exists — this ref
  // is what lets it still read today's model rather than none at all (the same reason `onSelectRef`
  // exists). Set unconditionally on every render, right after `useFileTree` returns `model` a few
  // lines down, well before a later click could ever invoke the callback that reads it.
  const modelRef = useRef<ReturnType<typeof useFileTree>['model'] | null>(null)

  const paths = useMemo(
    () => entries.map((entry) => (entry.kind === 'dir' ? asDirectoryPath(entry.path) : entry.path)),
    [entries],
  )
  const gitStatus = useMemo(() => {
    const fromEntries = entries
      .filter((entry): entry is PierreTreeEntry & { status: EntryStatus } => entry.status != null)
      .map((entry) => ({ path: entry.path, status: entry.status }))
    // The tab Bestanden's own marks, for the colour of a row's name alone: the letter
    // and the folder dot are this component's decoration below. An ignored folder keeps its
    // trailing slash, so the library dims whatever of it is shown too.
    const fromStatuses = (statuses ?? []).map((entry) => ({
      path: entry.kind === 'dir' ? asDirectoryPath(entry.path) : entry.path,
      status: libraryStatus(entry.mark),
    }))
    return [...fromEntries, ...fromStatuses]
  }, [entries, statuses])

  // Read by `renderRowDecoration`, which the library calls while it draws a row and which is
  // captured once at construction: refs, set on every render, so it always reads today's marks.
  const labelsRef = useRef(markLabels)
  labelsRef.current = markLabels
  const fileMarks = useMemo(
    () => new Map((statuses ?? []).map((entry) => [entry.path, entry.mark])),
    [statuses],
  )
  const fileMarksRef = useRef(fileMarks)
  fileMarksRef.current = fileMarks
  const folderMarks = useMemo(() => foldersWithChanges(statuses ?? []), [statuses])
  const folderMarksRef = useRef(folderMarks)
  folderMarksRef.current = folderMarks
  // Whether this tree marks through `statuses` at all, fixed at mount like every option below.
  const marksStatuses = useRef(statuses !== undefined).current

  const { model } = useFileTree({
    density: 'compact',
    flattenEmptyDirectories: true,
    initialExpansion: expansion === 'closed' ? 'closed' : 'open',
    // No search field of the library's own: `filter` drives its search API from the tab's field.
    search: false,
    icons: FILE_ICONS,
    paths: [],
    gitStatus,
    unsafeCSS: marksStatuses ? UNSAFE_CSS + STATUS_LANE_CSS : UNSAFE_CSS,
    ...(marksStatuses
      ? {
          // `item.path`, not `row.path`: a flattened chain of folders (`src/utils`) is one row whose
          // own path is its first folder, while the mark belongs to the one it ends in.
          renderRowDecoration: ({ item }: { item: { kind: string; path: string } }) => {
            const path = withoutTrailingSlash(item.path)
            const words = labelsRef.current
            if (words === undefined) return null
            if (item.kind === 'directory') {
              return folderMarksRef.current.has(path)
                ? {
                    icon: { name: 'file-tree-icon-dot', width: 6, height: 6 },
                    title: words.folder,
                  }
                : null
            }
            const mark = fileMarksRef.current.get(path)
            if (mark === undefined || mark === 'ignored') return null
            return {
              text: words.letters[mark],
              title: words.words[mark],
            }
          },
        }
      : {}),
    onSelectionChange: (selectedPaths) => {
      // Not the last entry of `selectedPaths`: a modifier click (⌘ or Ctrl per platform, the tab
      // Bestanden's ⌘-click) is the library's own multi-select gesture under the hood, toggling
      // the row it lands on into or out of a Set rather than replacing it — so the row the reader
      // just chose can as easily be the one this leaves *out* as the one it adds (a second
      // ⌘-click on a row already in the Set removes it, and the newest surviving entry then names
      // an older click, not this one). The tree's own focus, unlike the Set, always follows the
      // row a click or a key landed on regardless of which way a toggle went — each row is its own
      // `<button>`, and Chromium already moves the focus there on mousedown, before any of the
      // library's own selection logic runs — so it is read from there instead.
      const path = modelRef.current?.getFocusedPath()
      if (path === null || path === undefined) return
      // Only a row the toggle just *added*: `PierreTree`'s own callers use `deselectPath` to clean
      // up a stray mark after the fact (an editor-open, a closed preview) — a removal, which fires
      // this same event — and would otherwise call back into `onSelect` a second time for the very
      // row it is cleaning up after, since focus itself never moves for a `deselect()` call.
      if (!selectedPaths.includes(path)) return
      onSelectRef.current(path)
    },
  })
  modelRef.current = model

  // The folders the reader opened, kept across a `resetPaths` so a growing `entries` (a map that
  // loaded, a revision that moved on) never folds a folder the reader had open back shut. Seeded
  // once from `initialExpandedPaths` (a restored stand); a later change of that
  // prop is not read again, the same as `useFileTree`'s own options.
  const expandedFolders = useRef<Set<string>>(
    new Set((initialExpandedPaths ?? []).map(asDirectoryPath)),
  )

  // The paths last handed to the model: a refresh that brings the same paths in a new array (a
  // status that moved on, a folder answered again with what it already had) builds nothing — a
  // `resetPaths` of a large folder is the one costly thing this component does.
  const appliedPaths = useRef<readonly string[] | null>(null)

  useEffect(() => {
    const previous = appliedPaths.current
    const samePaths =
      previous !== null &&
      previous.length === paths.length &&
      previous.every((path, index) => path === paths[index])
    if (!samePaths) {
      appliedPaths.current = paths
      const override = [...expandedFolders.current]
      // An empty override still overrides — nothing passed at all lets `initialExpansion` decide,
      // the first time this runs and every time after as long as nothing has been opened by hand.
      model.resetPaths(paths, override.length > 0 ? { initialExpandedPaths: override } : {})
    }
    if (activeFilter === '') {
      model.setSearch(null)
    } else if (!samePaths && model.getSearchValue() !== '') {
      // New paths under a standing filter: the library keeps the old matches after a
      // `resetPaths`, so the search runs again. Through `''` rather than `null`: `null` would
      // restore the folders from before the filter, which is for clearing it, not for this.
      model.setSearch('')
      model.setSearch(activeFilter)
    } else {
      model.setSearch(activeFilter)
    }
    if (activeFilter !== '') {
      onFilterMatchesRef.current?.(model.getSearchMatchingPaths().map(withoutTrailingSlash))
    }
  }, [model, paths, activeFilter])

  useEffect(() => {
    model.setGitStatus(gitStatus)
  }, [model, gitStatus])

  useEffect(() => {
    if (selectedPath === undefined) return
    // Replaces, not adds: `select()` only ever adds a path to the library's own Set (N1 of the
    // review), so a stray entry a modifier click left behind — the tab Bestanden's own `activate`
    // already clears the one case it knows about, but nothing stops a future caller from setting
    // `selectedPath` while the library's Set still holds something else — would keep marking a row
    // this prop no longer names. Read `getSelectedPaths()` fresh each time rather than trust one
    // kept locally, since the library's own toggling can change it without this effect running.
    for (const path of model.getSelectedPaths()) {
      if (path !== selectedPath) model.getItem(path)?.deselect()
    }
    model.getItem(selectedPath)?.select()
  }, [model, selectedPath])

  // Declared after the effects that fill the model, so the first read already counts the paths.
  // `subscribe` is what keeps it right afterwards: a folder that folds open or shut changes the
  // count without changing a single prop of this component, and is also how a newly opened folder
  // without children yet is caught, for `onOpenFolder`.
  const [rows, setRows] = useState(0)
  useEffect(() => {
    const read = () => {
      // The library takes a search for its own search field, which Escape or Enter on a row closes;
      // here the filter is the tab's, and only an empty `filter` ends it. Put back at once, so the
      // tree never shows everything under a field that still holds text.
      if (activeFilterRef.current !== '' && !model.isSearchOpen()) {
        model.setSearch(activeFilterRef.current)
        return
      }
      const count = model.getVisibleCount()
      setRows(count)
      // What a filter unfolds is not the reader's doing (see `filter`'s doc): the folders open
      // before it began stay the ones remembered, and the library puts them back when it clears.
      if (activeFilterRef.current !== '') return
      const visible = model.getVisibleRows(0, count)
      const nowOpen = new Set(
        visible.filter((row) => row.kind === 'directory' && row.isExpanded).map((row) => row.path),
      )
      if (onOpenFolderRef.current) {
        for (const row of visible) {
          if (
            row.kind === 'directory' &&
            row.isExpanded &&
            !row.hasChildren &&
            !expandedFolders.current.has(row.path)
          ) {
            onOpenFolderRef.current(withoutTrailingSlash(row.path))
          }
        }
      }
      if (
        onExpansionChangeRef.current &&
        (nowOpen.size !== expandedFolders.current.size ||
          [...nowOpen].some((path) => !expandedFolders.current.has(path)))
      ) {
        onExpansionChangeRef.current([...nowOpen].map(withoutTrailingSlash))
      }
      expandedFolders.current = nowOpen
    }
    read()
    return model.subscribe(read)
  }, [model])

  const containerRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(handle, () => {
    // `getItem(path)?.focus()` only moves the library's own *logical* focus (which row
    // `aria-activedescendant` names); it never calls the DOM `focus()` a keyboard or a screen reader
    // actually follows. That has to be found and called by hand — the one reason this wrapper keeps a
    // ref to its own container at all.
    function focusRow(path: string): void {
      model.getItem(path)?.focus()
      const host = [...(containerRef.current?.querySelectorAll<HTMLElement>('*') ?? [])].find(
        (element) => element.shadowRoot !== null,
      )
      // CSS.escape: a path can hold a quote or another character the attribute selector's own
      // syntax would otherwise read as part of it, rather than as the value to match.
      host?.shadowRoot
        ?.querySelector<HTMLElement>(`[data-item-path="${CSS.escape(path)}"]`)
        ?.focus()
    }
    return {
      focusPath: (path) => focusRow(path),
      getFocusedPath: () => model.getFocusedPath(),
      // The render model itself (`useFileTree`'s `FileTree`, not the fuller internal
      // `FileTreeController` its own `.d.ts` was read against) has no `deselectPath` of its own;
      // only a row's own handle does.
      deselectPath: (path) => model.getItem(path)?.deselect(),
      focusFirst: () => {
        const first = model.getVisibleRows(0, 0)[0]
        if (first !== undefined) focusRow(first.path)
      },
      isFirstFocused: () => {
        const first = model.getVisibleRows(0, 0)[0]
        return first !== undefined && model.getFocusedPath() === first.path
      },
      firstMatch: () => model.getSearchMatchingPaths().find((path) => !path.endsWith('/')) ?? null,
    }
  }, [model])

  return (
    // Only for `containerRef` (see `focusPath`'s own doc above): no size or layout class of its
    // own, so it adds nothing to what `FileTree` already does by itself here — confirmed against
    // the pre-existing state of every `patterns-pierretree` visual story, `flex` moved a row's
    // status badge by a pixel that this plain wrapper does not.
    <div ref={containerRef} className={fill ? 'h-full min-h-0' : undefined}>
      <FileTree
        model={model}
        aria-label={label}
        style={fill ? { colorScheme: theme } : { colorScheme: theme, height: rows * ROW_HEIGHT }}
      />
    </div>
  )
})
