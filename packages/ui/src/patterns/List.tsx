import {
  type ComponentPropsWithRef,
  createContext,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
} from 'react'
import { controlHeight } from '../primitives/control-size'
import { Icon, type IconName } from '../primitives/Icon'
import { type ClosedAs, StatusShape } from './StatusShape'
import type { RunStatusKind } from './status-kind'

/** Marks a focusable row for the arrow keys; the rows may sit anywhere below the list. */
const ROW = '[data-nt-list-row]'

/**
 * Arrow keys, Home and End move the focus through every row of the list, whatever sits between
 * them.
 *
 * Queried per keystroke rather than kept in a ref: a list re-orders and re-groups as runs come and
 * go, and the DOM is the only copy of that order which cannot go stale. The focus does not wrap:
 * in a list of chats the ends are meaningful places, and arriving back at the top by surprise
 * costs more than a keystroke.
 */
function moveFocus(event: KeyboardEvent<HTMLElement>): void {
  const step = { ArrowDown: 1, ArrowUp: -1 }[event.key]
  if (step === undefined && event.key !== 'Home' && event.key !== 'End') return
  const items = [...event.currentTarget.querySelectorAll<HTMLElement>(ROW)]
  if (items.length === 0) return
  const current = items.indexOf(document.activeElement as HTMLElement)
  if (current === -1) return
  event.preventDefault()
  const last = items.length - 1
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? last
        : Math.min(last, Math.max(0, current + (step ?? 0)))
  items[next]?.focus()
}

/**
 * Marks the box of controls beside a row (its menu, a one-move button): `ListRow` and `StackedRow`
 * put it on the box of their `actions`, and a `roving` list walks into it with → and ←.
 */
const ACTIONS = '[data-nt-list-actions]'

/**
 * The focusable controls inside a row's box of actions.
 *
 * Only a box beside the row, a child of the row's own `<li>`: a row that heads a group
 * (`ListGroup rowMark`, `ShelfGroup`) shares its `<li>` with the rows under it, and their boxes
 * are theirs, not its.
 */
function actionsOf(row: HTMLElement): HTMLElement[] {
  const item = row.closest('li')
  const box = item
    ? [...item.children].find((child): child is HTMLElement => child.matches(ACTIONS))
    : undefined
  return box ? controlsIn(box) : []
}

/** The controls of a box of actions that can take the focus: a disabled one is passed by. */
function controlsIn(box: HTMLElement): HTMLElement[] {
  return [...box.querySelectorAll<HTMLElement>('button, [tabindex]')].filter(
    (control) => !control.matches(':disabled'),
  )
}

/**
 * The keys of a roving list beyond the arrows: → into the controls of a row, ← back out of them,
 * and the context-menu key (or ⇧F10) on a row opens its last control, its menu.
 *
 * A key the row already answered itself (a row that folds with → and ←, `fold.keys`) is left to
 * it: the row's own handler runs first and says so with `preventDefault`.
 */
function moveAside(event: KeyboardEvent<HTMLElement>): boolean {
  if (event.defaultPrevented) return false
  const target = event.target as HTMLElement
  const row = target.closest<HTMLElement>(ROW)
  if (row && target === row) {
    if (event.key === 'ArrowRight') {
      const [first] = actionsOf(row)
      if (!first) return false
      event.preventDefault()
      first.focus()
      return true
    }
    if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
      const menu = actionsOf(row).at(-1)
      if (!menu) return false
      event.preventDefault()
      menu.focus()
      // A Radix menu trigger opens on a pointer press or a key, never on a bare click: the key it
      // answers opens the menu at once, on its first item. Any other control is pressed.
      if (menu.getAttribute('aria-haspopup') === 'menu') {
        if (menu.getAttribute('aria-expanded') !== 'true') {
          menu.dispatchEvent(
            new window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
          )
        }
      } else {
        menu.click()
      }
      return true
    }
    return false
  }
  const box = target.closest<HTMLElement>(ACTIONS)
  if (!box) return false
  const controls = controlsIn(box)
  const at = controls.indexOf(target)
  if (at === -1) return false
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    controls[at + 1]?.focus()
    return true
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    // The control before this one, or the row itself from the first.
    const before = at === 0 ? undefined : controls[at - 1]
    ;(before ?? box.closest('li')?.querySelector<HTMLElement>(ROW))?.focus()
    return true
  }
  return false
}

/**
 * One tab stop for the whole list (roving tabindex): the row that last had the focus, else the
 * current one, else the first, is `tabIndex=0`; every other row and every control beside a row is
 * `-1`, reached with the arrows. Kept on the DOM rather than in props, so a row stays a plain
 * memoised button, and re-applied whenever rows come, go or change which one is current.
 */
function useRoving(list: RefObject<HTMLUListElement | null>, on: boolean): void {
  const last = useRef<HTMLElement | null>(null)
  useLayoutEffect(() => {
    const root = list.current
    if (!on || !root) return
    // What roving changed, so turning it off gives every row and control its tab stop back.
    const touched = new Set<HTMLElement>()
    const apply = () => {
      const rows = [...root.querySelectorAll<HTMLElement>(ROW)]
      const stop =
        (last.current && rows.includes(last.current) ? last.current : null) ??
        rows.find((row) => row.getAttribute('aria-current') === 'page') ??
        rows[0]
      for (const row of rows) {
        const index = row === stop ? 0 : -1
        touched.add(row)
        if (row.tabIndex !== index) row.tabIndex = index
      }
      for (const control of root.querySelectorAll<HTMLElement>(
        `${ACTIONS} button, ${ACTIONS} [tabindex]`,
      )) {
        touched.add(control)
        if (control.tabIndex !== -1) control.tabIndex = -1
      }
    }
    const onFocus = (event: FocusEvent) => {
      const row = (event.target as HTMLElement).closest<HTMLElement>(ROW)
      if (row && row !== last.current) {
        last.current = row
        apply()
      }
    }
    apply()
    // A new current row (another chat chosen) takes the stop over from the one that last had the
    // focus, so Tab comes back to the chat on screen.
    const observer = new MutationObserver((records) => {
      if (records.some((record) => record.attributeName === 'aria-current')) last.current = null
      apply()
    })
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-current'],
    })
    root.addEventListener('focusin', onFocus)
    return () => {
      observer.disconnect()
      root.removeEventListener('focusin', onFocus)
      for (const element of touched) element.removeAttribute('tabindex')
    }
  }, [list, on])
}

/** What a `List` tells the rows inside it: only whether they lie in a card. */
const ListContext = createContext<{ card: boolean }>({ card: false })

/**
 * The name of a list: its own words, or the id of a visible heading that already says them — so a
 * screen reader hears what the eye reads, and the words live in one place.
 */
type ListName =
  | {
      /** Accessible name of the list, e.g. "Chats". */
      label: string
      labelledBy?: never
    }
  | {
      /** The id of the visible heading that names the list, e.g. "Bezig" over the workbench. */
      labelledBy: string
      label?: never
    }

/** The props of `List`. */
export type ListProps = ListName & {
  /**
   * `ListRow`s, or list items that group them.
   *
   * A group is an `<li>` holding a heading and a nested `<ul>` of rows: an `<ul>` may only contain
   * list items, so a `<section>` with its heading lives inside one rather than beside them. The
   * arrows do not care how deep the rows sit — they run through the whole list.
   */
  children: ReactNode
  /**
   * One tab stop for the whole list instead of one per row and per control: ↑ ↓ walk the rows,
   * → reaches the controls beside a row (`actions`), ← comes back, and the context-menu key (or
   * ⇧F10) opens a row's last control, its menu. For a long list the eye reads as one column, such
   * as the chats of a side panel. Left out, every row and every control is a tab stop of its own
   * and → and ← do nothing, as before.
   */
  roving?: boolean
  /**
   * The rows lie in an outlined region, a hairline between them, as a group of rows in the family
   * does (`docs/family-style.md`, Rhythm): 12px corners, no fill, the rows square to its edge.
   * The inset of the words is the row's own: 10px for a `comfortable` row, 8px for a regular
   * one. For a short list of things to choose from, such as the projects of a start screen.
   * Not for rows with a `fold` chevron, which needs the gutter outside the row.
   */
  card?: boolean
}

/**
 * A list of rows that the arrow keys run through, across group boundaries.
 *
 * One keyboard owner for the whole list, rather than one per group: the user reads a sidebar as a
 * single column, so ArrowDown at the bottom of a project continues in the next one. Home and End
 * jump to the ends of the whole list. By default every row and every control beside it stays an
 * ordinary tab stop, so Tab walks through them as it does through any row of buttons. `roving`
 * is the opt-in for a long column: one tab stop for the whole list, with → and ← into the
 * controls of a row and back.
 */
export function List({ label, labelledBy, children, roving = false, card = false }: ListProps) {
  const ref = useRef<HTMLUListElement>(null)
  useRoving(ref, roving)
  return (
    <ListContext.Provider value={card ? CARD : PLAIN}>
      {/* The handler sits on the list rather than on each row: it needs the row order, and a row
          only knows itself. Nothing here is a target of its own — the keys move focus between the
          buttons inside. */}
      <ul
        ref={ref}
        aria-label={label}
        aria-labelledby={labelledBy}
        onKeyDown={(event) => {
          if (roving && moveAside(event)) return
          moveFocus(event)
        }}
        className={
          card
            ? 'm-0 list-none overflow-hidden rounded-lg border border-border p-0'
            : 'm-0 list-none p-0'
        }
      >
        {children}
      </ul>
    </ListContext.Provider>
  )
}

/** The two values of the context, made once so a re-render hands the rows the same object. */
const PLAIN = { card: false }
const CARD = { card: true }

/**
 * A row with a status icon needs the status in words as well.
 *
 * Split at the type level rather than guarded at runtime: a glyph with nothing to read is the one
 * way a caller can turn a status into shape and colour alone, and a status must never rest on colour alone.
 */
type RowStatus =
  | { kind?: null; status?: string; marker?: RowMarker }
  | { kind: RunStatusKind; status: string; marker?: RowMarker }
  | {
      kind?: null
      status: string
      /**
       * A glyph of the caller's own in the 14px slot, for a list whose rows are not chats (the
       * kinds of an SDD document, `DocKindIcon`). Decorative, so the status in words is required.
       */
      marker: ReactElement
    }

/**
 * How the status is drawn: always the shape on its number of sides (`StatusShape`), the one
 * drawing of a status in every list (`StatusIcon` is gone).
 * `'shape'` stays a value a caller may still name; it is also what a row without a marker draws.
 */
type RowMarker = 'shape'

/** The props of `ListRow`. */
export type ListRowProps = Omit<
  ComponentPropsWithRef<'button'>,
  'className' | 'style' | 'children' | 'title'
> & {
  /** The row's own text, truncated with an ellipsis when the column is too narrow. */
  title: string
  /**
   * The id of the title, so a control beside the row can name it with `aria-describedby` ("Meer"
   * eleven times over says nothing about which chat). The caller makes it (`useId`), because the
   * controls that point at it are the caller's too.
   */
  titleId?: string
  /**
   * Right-hand detail, e.g. a `RelativeTime`. Left out, the status stands there; `false` leaves
   * the spot empty while the status stays in the accessible name.
   */
  meta?: ReactNode
  /**
   * A detail only under the pointer or with the focus, in the spot of `meta`, which steps aside
   * for it: the number of a document, which a column read all day does not need at rest. Hidden with opacity, so it stays in the accessible name, after the meta.
   */
  hoverMeta?: ReactNode
  /**
   * A small row under another one — only the steps of a plan in the workbench of Specs: 24px high (`controlHeight.sm`), in the 12px of a secondary line, so
   * a handful of them reads as detail of the row above rather than as rows of their own.
   */
  compact?: boolean
  /**
   * A row of 28px (`controlHeight.sm`) in the 12px of the small step, for a column whose rows a reader
   * scans as a map rather than works through one by one — only the documents of the Specs column.
   * `compact` wins when both are set.
   */
  dense?: boolean
  /**
   * `comfortable`: the title in the 13px of the base even with a `subline` (where a `regular` row
   * steps it down to 12px), and 10px of padding at the sides instead of 8px. For a column whose
   * rows are the reading itself, such as the chats of a side panel or the projects of a start
   * screen. Wins over `compact` for the title.
   */
  size?: 'regular' | 'comfortable'
  /**
   * Where the status shape (or the caller's `marker`) stands: `start`, before the title (the
   * default), or `end`, at the end of the first line in a slot of its own. At the end the
   * second line starts under the title rather than 22px in, and the row keeps 34px free at its end
   * for the shape; `actions` then take the shape's place on hover and keyboard focus.
   */
  markerSide?: 'start' | 'end'
  /**
   * The weight of the title: `semibold` (600) for a chat with news for the reader, `medium` (500)
   * for one under way. Left out, the weight of the text around it.
   */
  titleWeight?: 'medium' | 'semibold'
  /** The title in DM Mono, for a name that is a path or a folder: the name of a project. */
  monoTitle?: boolean
  /** Marks the row as the page the user is looking at (`aria-current="page"`). */
  current?: boolean
  /**
   * A control beside the row, e.g. a menu. Rendered next to the button, never inside it: a button
   * inside a button does not exist, so this sits as the row's second child, both inside the one
   * `<li>` the row already renders. Its box carries `data-nt-list-actions`, which a `roving` list
   * walks into with → and ←.
   *
   * Visible on hover and on focus-within, but always in the DOM: someone moving through the list
   * with the keyboard must be able to tab onto it without first pointing at the row.
   *
   * Reserving room for this beside the row (a fixed `pr-8`) would cost that space all day for
   * something only shown on hover; instead the detail (`meta`/`status`) steps aside on the same
   * hover/focus-within that brings the menu in, so the two trade one spot instead of each owning
   * their own.
   *
   * With `markerSide="end"` the controls take the place of the shape instead, and show on hover
   * and on keyboard focus (`:focus-visible`) only: the focus a click leaves behind brings nothing
   * in, so a chosen row keeps its shape. While they show, the row keeps room for at most two
   * controls of `--nt-control-sm` at its end, so they never lie over the title; a third would.
   */
  actions?: ReactNode
  /**
   * A chevron that folds the rows under this one away, as in a tree: whether they show, the name
   * of the button, and what a press does. Like `actions` it stands beside the button, never inside
   * it, on the row's left edge before the status glyph — so the row keeps its line with the rows
   * around it — and the arrow keys of `List` pass it by. It needs the 8px gutter a column leaves
   * left of its rows, never more. `keys`: the row itself folds with → and ← (a quick check of a
   * waiting row), so the chevron is for the pointer and no stop of Tab.
   */
  fold?: { open: boolean; label: string; onToggle(): void; keys?: boolean } | undefined
  /**
   * A second line under the title: `content` for the eye, `label` for the ear.
   *
   * The line itself is `aria-hidden` and its words go into the accessible name after the meta, so
   * a screen reader hears it once, in the order the eye reads the row. With it the row is 48px
   * (6px above and below, a 20px first and a 16px second line) instead of 32px, the title a step
   * down to 12px, and the line 11px in the sans with even figures, muted, indented to where the
   * title starts. Mono and 13px made the two lines of a chat read as loud as each other.
   *
   * `mono` sets the whole line in DM Mono (a project and a time); a part that should stay in the
   * sans, such as a status word, is a `<span className="font-sans">` inside `content`. Beside a
   * `marker` of the caller's own, or with the shape at the end, the line starts exactly under the
   * title, whatever the width of the mark.
   */
  subline?: { content: ReactNode; label: string; mono?: boolean }
  /**
   * For the status shape: a message stands ready in this chat, so its shape is drawn dotted, and
   * for a closed one how it last ended. Both only for the eye; the words are the caller's.
   * `label` shows the status word as the tooltip of the shape under the pointer (`StatusShape`'s
   * `tooltip`); the shape stays decorative, and the row's name keeps the status in its own place
   * (title, status, meta). With `markerSide="end"` and `actions` there is no tooltip: the actions
   * take the shape's place on hover, so the pointer never reaches it.
   */
  shape?: { pending?: boolean; closedAs?: ClosedAs | null; muted?: boolean; label?: string }
  /**
   * The colour of the row at rest: `muted` (the default) lets the hovered and current row stand
   * out by colour alone, `strong` keeps every title in the foreground colour, for a list whose
   * titles are what the eye scans for — there hover and current are carried by the fill;
   * `secondary` a step between, for the documents of Specs, whose titles are read at rest but should
   * not all speak at once.
   */
  emphasis?: 'muted' | 'secondary' | 'strong'
  /**
   * When the row takes a fill: `always` (the default) a faint one under the pointer and a stronger
   * one when current; `current` only when current. The second is for a tree read as a map of
   * documents, where a hovered row with a fill of its own read as a second selection.
   * A row with `aria-pressed="true"` (a choice, such as the project a new chat starts in, rather
   * than the page on screen) takes the fill of a current one.
   */
  fill?: 'always' | 'current'
  /** The title is no longer in force (a dropped document): drawn struck through. */
  struck?: boolean
  /** The whole title under the pointer, for a row that shows it shortened. */
  hint?: string
} & RowStatus

/** The resting text colour per `emphasis`; hover and current always lift a row to `text-fg`. */
const restingTone = { muted: 'text-muted', secondary: 'text-secondary', strong: 'text-fg' } as const

/** The class per `titleWeight`. */
const weightClass = { medium: 'font-medium', semibold: 'font-semibold' } as const

/**
 * The end padding of a row whose shape stands at the end: the 34px of the shape at rest, and room
 * for two controls of `--nt-control-sm` (4px apart, 6px from the end, 4px from the title) while
 * its actions show. Literal, because the consumer's Tailwind reads the classes from `dist/`.
 */
const END_ROOM = 'pe-[34px]'
const END_ROOM_ACTIONS =
  'pe-[34px] group-hover/row:pe-[calc(var(--nt-control-sm)*2+14px)] group-has-[:focus-visible]/row:pe-[calc(var(--nt-control-sm)*2+14px)] group-has-[[data-nt-list-actions]_[aria-expanded=true]]/row:pe-[calc(var(--nt-control-sm)*2+14px)]'

/**
 * One row of a `List`: a status icon, a title, and a detail on the right.
 *
 * The accessible name is title, then the status as its own clause between commas, then the meta —
 * the shape the sidebar has always read, so nothing about it changes as screens move onto this
 * pattern. When there is no `meta` the status takes that place visually, and the visible copy is
 * hidden from assistive technology so it is not announced twice.
 *
 * Renders the `<li>` itself, so a `List` only ever contains list items.
 */
export function ListRow({
  title,
  titleId,
  kind,
  status,
  meta,
  hoverMeta,
  compact = false,
  dense = false,
  size = 'regular',
  markerSide = 'start',
  titleWeight,
  monoTitle = false,
  current,
  actions,
  fold,
  marker = 'shape',
  emphasis = 'muted',
  fill = 'always',
  struck = false,
  hint,
  subline,
  shape,
  type = 'button',
  ...props
}: ListRowProps) {
  // `className` and `style` are not part of `ListRowProps`, but a caller working around the type
  // (or plain JS) could still pass either; drop them explicitly so they can never leak past the
  // variant classes.
  const { className: _className, style: _style, ...rest } = props as ComponentPropsWithRef<'button'>
  const { card } = useContext(ListContext)
  const end = markerSide === 'end'
  const comfortable = size === 'comfortable'
  const ownMarker = typeof marker === 'object'
  // The status word as the shape's tooltip, never as its name: the row says the status in words
  // already, in its fixed place. Not beside actions at the end, which lie over the shape on hover.
  const tooltip = shape?.label && !(end && actions) ? shape.label : undefined
  const detail = meta ?? (status ? <span aria-hidden="true">{status}</span> : null)
  const mark = ownMarker ? (
    marker
  ) : (
    <StatusShape
      kind={kind ?? null}
      pending={shape?.pending ?? false}
      closedAs={shape?.closedAs ?? null}
      muted={shape?.muted ?? false}
      {...(tooltip ? { tooltip } : {})}
    />
  )
  // Beside a mark of the caller's own the lines stand in a column of their own, so the second one
  // starts under the title whatever the width of the mark; the shape keeps the indent it always had.
  const columns = Boolean(subline) && ownMarker && !end
  const titleSize = comfortable ? 'text-[13px]' : subline ? 'text-[12px]' : ''
  const line = (
    <>
      {end || columns ? null : mark}
      <span
        id={titleId}
        data-nt-list-title
        className={`min-w-0 flex-1 truncate ${titleSize} ${
          struck ? 'line-through decoration-muted/60' : ''
        }${titleWeight ? ` ${weightClass[titleWeight]}` : ''}${monoTitle ? ' font-mono' : ''}`}
      >
        {title}
      </span>
      {/* Status never as colour alone: the word is part of the accessible name, set apart by
          commas so it does not run into the title or the detail beside it. */}
      {status ? <span className="sr-only">, {status},</span> : null}
      {detail && !hoverMeta ? (
        <span
          className={`shrink-0 text-[11px] text-muted ${
            // Hidden with opacity, not removed or aria-hidden: the accessible name must keep
            // reading this even while the actions cover its spot.
            actions && !end ? 'group-hover/row:opacity-0 group-focus-within/row:opacity-0' : ''
          }`}
        >
          {detail}
        </span>
      ) : null}
      {hoverMeta ? (
        // One grid cell for both details, so the one for the pointer takes the spot of the other.
        <span className="grid shrink-0 text-[11px] text-muted">
          {detail ? (
            <span className="col-start-1 row-start-1 justify-self-end group-hover/row:opacity-0 group-focus-within/row:opacity-0">
              {detail}
            </span>
          ) : null}
          <span className="col-start-1 row-start-1 justify-self-end opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100">
            {hoverMeta}
          </span>
        </span>
      ) : null}
    </>
  )
  const second = subline ? (
    <>
      <span
        aria-hidden="true"
        data-nt-list-subline
        className={`flex h-4 w-full min-w-0 items-center gap-2 ${
          end || columns ? '' : 'ps-[22px] '
        }text-[11px] text-muted tabular-nums${subline.mono ? ' font-mono' : ''}`}
      >
        {subline.content}
      </span>
      {subline.label ? <span className="sr-only">, {subline.label}</span> : null}
    </>
  ) : null
  const inline = end
    ? `${comfortable ? 'ps-2.5' : 'ps-2'} ${actions ? END_ROOM_ACTIONS : END_ROOM}`
    : comfortable
      ? 'px-2.5'
      : 'px-2'
  const surface = `no-drag w-full ${card ? 'rounded-none' : 'rounded-md'} ${inline} text-left ${
    compact ? 'text-[12px]' : 'text-[13px]'
  } outline-focus ${
    fill === 'always' ? 'hover:bg-surface ' : ''
  }hover:text-fg focus-visible:outline-2 ${
    card ? 'focus-visible:-outline-offset-2' : 'focus-visible:outline-offset-2'
  } aria-[current=page]:bg-surface-hover aria-[current=page]:text-fg aria-pressed:bg-surface-hover aria-pressed:text-fg${
    end ? ' relative' : ''
  }`
  return (
    <li
      className={`group/row relative m-0${card ? ' border-t border-border first:border-t-0' : ''}`}
    >
      {fold ? (
        // Level with the first line, centred on the row's left edge: its left half in the 8px
        // gutter, its right half in the row's own padding before the glyph, so the glyph and the
        // title stay where every other row has them. Centred on the gutter alone, the 16px button
        // reached 4px past it, and a column that clips at its edge (the sidebar's scroll area)
        // cut the chevron off. The glyph is 12px; the button around it is the 24px square of
        // the smallest target (WCAG 2.5.8), centred on the same edge, so it takes 12px of the
        // gutter and 12px of the row's padding before the glyph, and the box around it lets the
        // pointer through.
        <span
          data-nt-list-fold
          className="no-drag pointer-events-none absolute top-0 -left-3 flex h-(--nt-row) w-6 items-center justify-center"
        >
          <button
            type="button"
            aria-expanded={fold.open}
            aria-label={fold.label}
            {...(fold.keys ? { tabIndex: -1 } : {})}
            onClick={fold.onToggle}
            className="pointer-events-auto flex size-6 shrink-0 items-center justify-center rounded-sm text-muted outline-focus hover:text-fg focus-visible:outline-2 focus-visible:-outline-offset-2"
          >
            <span
              className={`flex transition-transform duration-(--nt-duration-fast) ease-out motion-reduce:transition-none ${
                fold.open ? '' : '-rotate-90'
              }`}
            >
              <Icon name="chevron-down" size="xs" />
            </span>
          </button>
        </span>
      ) : null}
      <button
        type={type}
        data-nt-list-row
        data-nt-list-compact={compact ? '' : undefined}
        data-nt-list-dense={dense && !compact ? '' : undefined}
        title={hint}
        aria-current={current ? 'page' : undefined}
        className={
          columns
            ? `${surface} flex h-12 items-start gap-2 py-1.5 ${restingTone[emphasis]}`
            : subline
              ? `${surface} flex h-12 flex-col justify-center py-1.5 ${restingTone[emphasis]}`
              : `${surface} flex ${
                  compact ? controlHeight.sm : dense ? controlHeight.md : 'h-(--nt-row)'
                } items-center gap-2 ${restingTone[emphasis]}`
        }
        {...rest}
        onPointerDown={(event) => {
          // A row the keyboard (or ⌘J) focused keeps its ring through a click, since the focus
          // does not move; let go of it first, so the click focuses it again as the pointer does
          // and the chosen row is the neutral plane alone: a ring means keyboard focus,
          // never selection.
          if (event.currentTarget === document.activeElement) event.currentTarget.blur()
          rest.onPointerDown?.(event)
        }}
      >
        {columns ? (
          <>
            <span data-nt-list-mark className="flex h-5 shrink-0 items-center">
              {mark}
            </span>
            <span data-nt-list-lines className="flex min-w-0 flex-1 flex-col">
              <span className="flex h-5 w-full items-center gap-2">{line}</span>
              {second}
            </span>
          </>
        ) : subline ? (
          <>
            <span className="flex h-5 w-full items-center gap-2">{line}</span>
            {second}
          </>
        ) : (
          line
        )}
        {end ? (
          // The end of the first line: a 16px slot 10px from the edge, in the 34px the row keeps
          // free. The actions take this place on hover and keyboard focus; the shape steps aside
          // on the same signals, hidden with opacity so the row keeps its width and its words.
          <span
            data-nt-list-marker-end
            className={`absolute end-2.5 flex w-4 items-center justify-center ${
              subline ? 'top-1.5 h-5' : 'inset-y-0'
            }${
              actions
                ? ' group-hover/row:opacity-0 group-has-[:focus-visible]/row:opacity-0 group-has-[[data-nt-list-actions]_[aria-expanded=true]]/row:opacity-0'
                : ''
            }`}
          >
            {mark}
          </span>
        ) : null}
      </button>
      {actions ? (
        end ? (
          // In the place of the shape, level with the first line: on hover, on keyboard focus,
          // and while a menu of its own is open; never on the focus a click leaves (A28).
          <span
            data-nt-list-actions
            className={`no-drag absolute end-1.5 flex items-center gap-1 opacity-0 group-hover/row:opacity-100 group-has-[:focus-visible]/row:opacity-100 has-[[aria-expanded=true]]:opacity-100 ${
              subline ? 'top-1 h-6' : 'inset-y-0'
            }`}
          >
            {actions}
          </span>
        ) : (
          // Level with the first line when there are two: the menu covers the meta it trades places
          // with, never the second line.
          <span
            data-nt-list-actions
            className={`no-drag absolute right-1 flex items-center opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 ${
              subline ? 'top-1 h-6' : 'inset-y-0'
            }`}
          >
            {actions}
          </span>
        )
      ) : null}
    </li>
  )
}

/** The props of `ListGroup`. */
export interface ListGroupProps {
  /** The visible heading, and the group's accessible name: a folder, a team, a date. */
  heading: string
  /** How many rows the group holds, beside the heading: a bare figure, or the caller's own words. */
  count?: number | string
  /**
   * A step behind the rows: the regular weight instead of medium, and the count only under the
   * pointer, with the focus, or while folded — for the projects of the chat column, where a figure
   * beside every heading was noise. The count stays in `label`.
   */
  quiet?: boolean
  /**
   * How the heading draws its chevron and its count. `label` (the default): the count right after
   * the word, the chevron behind it and only in sight under the pointer, with the focus or folded.
   * `disclosure`: the chevron before the word and always in sight (turned to the word while
   * folded), the count at the end of the heading in DM Mono 11px, a figure or the caller's words
   * ("1 bezig, 1 vraagt iets"), and a faint fill under the pointer — the groups of a side panel's
   * column in the design. One form for every group that folds in such a column, the shelf at its
   * foot (Afgerond) too, so one column has one kind of heading; opened by the reader, it brings its
   * first row into view, as `ShelfGroup` does.
   */
  variant?: 'label' | 'disclosure'
  /**
   * The heading starts 12px in instead of 8px: in a column that keeps an 8px gutter (a side
   * panel), its first glyph stands 20px from the edge, on the line of a `SectionHeading` set 4px
   * in and of the words of the rows around it, rather than 4px left of them.
   */
  inset?: boolean
  /**
   * The steps between and inside the groups. `regular` (the default): 24px above every group but
   * the first and 4px between the rows. `column`: 14px and 1px, the steps of a side panel's column
   * in the design, where a group is one of several stacked headings over rows that read as one
   * column.
   */
  spacing?: 'regular' | 'column'
  /**
   * The heading's button is a row of the `List` around it (`data-nt-list-row`, as `ShelfGroup`):
   * ↑ ↓ Home and End walk onto it and on from it, and in a `roving` list it is no tab stop of its
   * own but one of the rows the single stop moves through. A folded group thus stays one step in
   * the column. Left out, the arrows pass the heading by and it is a tab stop of its own, as before.
   */
  rowMark?: boolean
  /**
   * The level of the heading in the outline of the page: 2 by default, 3 where the groups stand
   * beside a `SectionHeading` (a 3 by default) in one column, so the headings of that column are
   * one level rather than two.
   */
  level?: 2 | 3
  /** A 12px glyph before the heading, for a group that is not one more of its kind (the archive). */
  icon?: IconName | undefined
  /**
   * The accessible name of the heading's button: the heading with the count in words ("webshop,
   * 2 chats"). A bare "2" read after a name sounds like part of that name.
   */
  label: string
  open: boolean
  onOpenChange(open: boolean): void
  /** `ListRow`s. */
  children: ReactNode
}

/**
 * A named group of rows in a `List`, under a heading that folds them away.
 *
 * An `<li>` holding a group, not a section beside the rows: a `<ul>` may only contain list items,
 * and `role="group"` rather than a named `<section>` keeps a group out of the landmark menu of a
 * screen reader. The group is named by its heading alone; the button inside that heading carries
 * the count as well and `aria-expanded`.
 *
 * The heading is a quiet label in sentence case, 12px and `text-muted`, as `SectionHeading`. By
 * default the chevron is an affordance, so it is `xs` and shows only under the pointer, with the
 * keyboard, or once folded. The groups of a side panel's column take the `disclosure` variant
 * (chevron before the word, always in sight, the count at the end in DM Mono) with `inset`,
 * `spacing="column"`, `rowMark` and `level={3}`: one form for every group that folds in that
 * column, Runs and Integraties as well as Afgerond at its foot.
 *
 * Controlled, like `Collapsible`: whether a group is folded belongs to whoever lists the groups.
 * Folded, the rows are not rendered at all rather than hidden: the arrows of `List` walk every row
 * in the DOM, and a hidden one would swallow a keystroke.
 */
export function ListGroup({
  heading,
  count,
  quiet = false,
  variant = 'label',
  inset = false,
  spacing = 'regular',
  level = 2,
  rowMark = false,
  icon,
  label,
  open,
  onOpenChange,
  children,
}: ListGroupProps) {
  const nameId = useId()
  const disclosure = variant === 'disclosure'
  const Heading = level === 3 ? 'h3' : 'h2'
  const rows = useRef<HTMLUListElement>(null)
  // Set by a press that opens the group, so a group that starts open scrolls nothing.
  const opened = useRef(false)
  // A disclosure group may stand at the foot of its column (Afgerond): opened there, its rows
  // appear below the fold and nothing seems to happen. Its first row is brought into view instead.
  useEffect(() => {
    if (!open || !opened.current) return
    opened.current = false
    rows.current?.firstElementChild?.scrollIntoView({ block: 'nearest' })
  }, [open])
  const chevron = (
    <span
      data-nt-list-group-chevron={disclosure ? '' : undefined}
      className={`flex shrink-0 transition-transform duration-(--nt-duration-fast) ease-out motion-reduce:transition-none ${
        open
          ? disclosure
            ? ''
            : 'opacity-0 group-hover/heading:opacity-100 group-focus-visible/heading:opacity-100'
          : '-rotate-90'
      }`}
    >
      <Icon name="chevron-down" size="xs" />
    </span>
  )
  return (
    <li className={spacing === 'column' ? 'mt-3.5 first:mt-0' : 'mt-6 first:mt-0'}>
      {/* biome-ignore lint/a11y/useSemanticElements: a fieldset is for forms; this is a named group in a list, and a named section would be a landmark. */}
      <section role="group" aria-labelledby={nameId}>
        <Heading className="m-0">
          <button
            type="button"
            data-nt-list-group-heading
            data-nt-list-row={rowMark ? '' : undefined}
            aria-expanded={open}
            aria-label={label}
            onClick={() => {
              opened.current = disclosure && !open
              onOpenChange(!open)
            }}
            className={`group/heading no-drag flex h-(--nt-control-md) w-full items-center gap-1.5 rounded-md ${
              inset ? 'ps-3 pe-2' : 'px-2'
            } text-left text-[12px] ${
              quiet ? 'font-normal' : 'font-medium'
            } text-muted outline-focus ${
              disclosure ? 'hover:bg-surface ' : ''
            }hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2`}
          >
            {disclosure ? chevron : null}
            {icon ? (
              <span data-nt-list-group-icon className="flex shrink-0">
                <Icon name={icon} size="xs" />
              </span>
            ) : null}
            <span id={nameId} className="min-w-0 truncate">
              {heading}
            </span>
            {count === undefined ? null : (
              <span
                data-nt-list-group-count
                className={`shrink-0 font-normal tabular-nums${
                  disclosure ? ' ms-auto font-mono text-[11px]' : ''
                }${
                  quiet && open
                    ? ' opacity-0 group-hover/heading:opacity-100 group-focus-visible/heading:opacity-100'
                    : ''
                }`}
              >
                {count}
              </span>
            )}
            {disclosure ? null : chevron}
          </button>
        </Heading>
        {open ? (
          <ul
            ref={rows}
            className={`m-0 flex list-none flex-col ${spacing === 'column' ? 'gap-px' : 'gap-1'} p-0`}
          >
            {children}
          </ul>
        ) : null}
      </section>
    </li>
  )
}
