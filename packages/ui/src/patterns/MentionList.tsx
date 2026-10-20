import { Fragment, type ReactElement, useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePortalContainer } from '../overlays/portal'
import { Icon, type IconName } from '../primitives/Icon'
import { PierreFileIcon } from './PierreFileIcon'
import { highlightPieces, searchListMark, searchListRow } from './SearchList'

/** One row of the `@` list: a path of core's list, and what the query hit in it. */
export interface MentionListItem {
  path: string
  kind: 'file' | 'dir'
  /** `[start, end)` ranges of `path` that core's ranking hit; none for an empty query. */
  ranges?: readonly (readonly [number, number])[]
  /** Rows with the same group, next to each other, get one quiet heading above them. */
  group?: string
  /**
   * A row that is no file (an Expert, `#`): its name in words, drawn instead of the path, which
   * then only identifies the row. With `icon` for the glyph and `detail` for a quiet second line.
   */
  label?: string
  detail?: string
  icon?: IconName
}

/** The props of `MentionList`. */
export interface MentionListProps {
  /** The DOM id of the listbox, for the field's `aria-controls`. */
  id: string
  /** The name of the listbox ("Bestanden"). */
  label: string
  items: readonly MentionListItem[]
  /** Where the keyboard stands; the field points here with `aria-activedescendant`. */
  activeIndex: number
  onActiveChange(index: number): void
  onPick(index: number): void
  /** Core's list was cut at its limit: one quiet line under the rows says so. */
  truncated?: boolean
  truncatedLabel: string
  /** What an empty list says ("Geen bestanden"). */
  emptyLabel: string
  /**
   * How many hits, in words ("12 bestanden"), for a polite live region that speaks only after
   * 300 ms without a change, not at every key.
   */
  countLabel: string
  /** The element the list stands above, at its width: the composer's surface. */
  anchor: HTMLElement | null
}

/** Rows in view at most; the rest scroll. */
const VISIBLE_ROWS = 8

/** How long the count waits for quiet before a screen reader hears it, in ms. */
const COUNT_QUIET_MS = 300

/**
 * The DOM id of the option at `index` of the list with id `listId`, for `aria-activedescendant`.
 *
 * By place rather than by path: a path can hold any character, and an index is a valid IDREF.
 */
export function mentionOptionId(listId: string, index: number): string {
  return `${listId}-o-${index}`
}

/** The box of the anchor, and again whenever the window changes size. */
function useAnchorBox(anchor: HTMLElement | null): DOMRect | null {
  const [box, setBox] = useState<DOMRect | null>(null)
  useLayoutEffect(() => {
    if (!anchor) return
    const measure = () => setBox(anchor.getBoundingClientRect())
    measure()
    window.addEventListener('resize', measure)
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null
    observer?.observe(anchor)
    return () => {
      window.removeEventListener('resize', measure)
      observer?.disconnect()
    }
  }, [anchor])
  return box
}

/** A text only once it held still for `COUNT_QUIET_MS`. */
function useQuiet(text: string): string {
  const [quiet, setQuiet] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setQuiet(text), COUNT_QUIET_MS)
    return () => clearTimeout(timer)
  }, [text])
  return quiet
}

/**
 * A path in two tones — the folder muted, the name in the row's own colour — with what core hit
 * in `<mark>`.
 */
function MarkedPath({
  path,
  ranges,
  active,
}: {
  path: string
  ranges: readonly (readonly [number, number])[]
  active: boolean
}): ReactElement {
  const nameStart = path.lastIndexOf('/') + 1
  const cuts: { at: number; text: string; hit: boolean; folder: boolean }[] = []
  for (const piece of highlightPieces(path, ranges)) {
    const end = piece.at + piece.text.length
    if (piece.at < nameStart && end > nameStart) {
      cuts.push({ ...piece, text: path.slice(piece.at, nameStart), folder: true })
      cuts.push({ ...piece, at: nameStart, text: path.slice(nameStart, end), folder: false })
    } else cuts.push({ ...piece, folder: piece.at < nameStart })
  }
  const folderTone = active ? 'text-fg' : 'text-muted'
  // Built as data first, like `SearchList`'s pieces: the scan for hardcoded copy reads source text,
  // and a ternary between two JSX tags reads to it as words a user could see.
  const drawn = cuts.map((cut) => {
    const Tag = cut.hit ? 'mark' : 'span'
    const tone = cut.hit ? searchListMark : cut.folder ? folderTone : 'text-fg'
    return (
      <Tag key={cut.at} className={tone}>
        {cut.text}
      </Tag>
    )
  })
  return <span className="min-w-0 truncate font-mono">{drawn}</span>
}

/**
 * The list of an `@` mention: a `listbox` above the composer, with rows drawn like `SearchList`'s,
 * but without a field of its own — the field is the composer's `Textarea`, which keeps the focus
 * and walks this list as a `combobox`.
 *
 * Steered from outside: which row is active and what a pick means are the composer's. It lands in
 * the portal container as a layer of its own (`data-nt-layer`), so a hosted browser view under it
 * freezes while it is open. Each row: the type icon of the file (a folder's own icon),
 * the path with its folder muted, and the whole path as the option's name. Eight rows in view,
 * the rest scroll; no headings but the quiet group names, no keys in view.
 */
export function MentionList({
  id,
  label,
  items,
  activeIndex,
  onActiveChange,
  onPick,
  truncated = false,
  truncatedLabel,
  emptyLabel,
  countLabel,
  anchor,
}: MentionListProps): ReactElement {
  const container = usePortalContainer()
  const box = useAnchorBox(anchor)
  const spoken = useQuiet(countLabel)

  useEffect(() => {
    document
      .getElementById(mentionOptionId(id, activeIndex))
      ?.scrollIntoView?.({ block: 'nearest' })
  }, [id, activeIndex])

  const groups: { name: string | undefined; rows: { item: MentionListItem; index: number }[] }[] =
    []
  items.forEach((item, index) => {
    const last = groups.at(-1)
    if (last && last.name === item.group) last.rows.push({ item, index })
    else groups.push({ name: item.group, rows: [{ item, index }] })
  })

  const position = box
    ? {
        position: 'fixed' as const,
        left: box.left,
        width: box.width,
        bottom: window.innerHeight - box.top + 4,
      }
    : undefined

  const layer = (
    <div
      data-nt-layer="mention"
      data-nt-mention-list
      style={position}
      className="no-drag z-(--nt-z-popover) flex flex-col gap-1 rounded-lg border border-border bg-overlay p-1 shadow-menu"
    >
      {/* tabIndex: the rows scroll, and WCAG 2.1.1 (axe: scrollable-region-focusable) wants the keyboard to reach that overflow. Tab in the field picks a row, so the focus does not really leave the composer. */}
      <div
        id={id}
        role="listbox"
        aria-label={label}
        tabIndex={0}
        className="flex flex-col overflow-y-auto"
        style={{ maxHeight: `calc(var(--nt-control-md) * ${VISIBLE_ROWS})` }}
      >
        {groups.map((group, groupIndex) => {
          const rows = group.rows.map(({ item, index }) => {
            const active = index === activeIndex
            return (
              // biome-ignore lint/a11y/useFocusableInteractive: an option of a combobox is never focused; the composer's field keeps the caret and points here with aria-activedescendant.
              <div
                key={`${item.kind}:${item.path}`}
                id={mentionOptionId(id, index)}
                role="option"
                aria-selected={active}
                aria-label={item.label ?? item.path}
                title={item.label === undefined ? item.path : (item.detail ?? item.label)}
                data-nt-mention-row
                // Down, not click: a click would first take the focus out of the field.
                onMouseDown={(event) => {
                  event.preventDefault()
                  onPick(index)
                }}
                onMouseMove={() => {
                  if (!active) onActiveChange(index)
                }}
                className={searchListRow({ active })}
              >
                <span className="flex shrink-0 text-muted">
                  {item.icon ? (
                    <Icon name={item.icon} size="sm" />
                  ) : item.kind === 'dir' ? (
                    <Icon name="folder" size="sm" />
                  ) : (
                    <PierreFileIcon path={item.path} />
                  )}
                </span>
                {item.label === undefined ? (
                  <MarkedPath path={item.path} ranges={item.ranges ?? []} active={active} />
                ) : (
                  <span className="flex min-w-0 flex-1 items-baseline gap-2">
                    <span className="min-w-0 shrink-0 truncate text-fg">{item.label}</span>
                    {item.detail ? (
                      <span className="min-w-0 truncate text-[12px] text-muted">{item.detail}</span>
                    ) : null}
                  </span>
                )}
              </div>
            )
          })
          // biome-ignore lint/suspicious/noArrayIndexKey: runs without a name are told apart by place alone.
          if (!group.name) return <Fragment key={`rows-${groupIndex}`}>{rows}</Fragment>
          const headingId = `${id}-g${groupIndex}`
          return (
            // biome-ignore lint/a11y/useSemanticElements: a named run of options inside a listbox, not a form.
            <div key={group.name} role="group" aria-labelledby={headingId}>
              <p
                id={headingId}
                className="m-0 flex h-6 items-center px-2 text-[11px] font-medium text-muted"
              >
                {group.name}
              </p>
              {rows}
            </div>
          )
        })}
      </div>
      {items.length === 0 ? (
        <p className="m-0 px-2 py-2 text-[12px] text-muted">{emptyLabel}</p>
      ) : null}
      {truncated ? (
        <p data-nt-mention-truncated className="m-0 px-2 pb-1 text-[11px] text-muted">
          {truncatedLabel}
        </p>
      ) : null}
      <p role="status" className="sr-only">
        {spoken}
      </p>
    </div>
  )
  return container ? createPortal(layer, container) : layer
}
