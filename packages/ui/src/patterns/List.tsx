import {
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useId,
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
}

/**
 * A list of rows that the arrow keys run through, across group boundaries.
 *
 * One keyboard owner for the whole list, rather than one per group: the user reads a sidebar as a
 * single column, so ArrowDown at the bottom of a project continues in the next one. Home and End
 * jump to the ends of the whole list. Every row stays an ordinary tab stop, so Tab walks through
 * them as it does through any row of buttons: a roving tabindex would change how the sidebar
 * already behaves, and the migration onto this pattern must not change behaviour.
 */
export function List({ label, labelledBy, children }: ListProps) {
  return (
    // The handler sits on the list rather than on each row: it needs the row order, and a row only
    // knows itself. Nothing here is a target of its own — the keys move focus between the buttons
    // inside.
    <ul
      aria-label={label}
      aria-labelledby={labelledBy}
      onKeyDown={moveFocus}
      className="m-0 list-none p-0"
    >
      {children}
    </ul>
  )
}

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
   * A row of 28px (`controlHeight.md`) in the 13px of the base, for a column whose rows a reader
   * scans as a map rather than works through one by one — only the documents of the Specs column.
   * `compact` wins when both are set.
   */
  dense?: boolean
  /** Marks the row as the page the user is looking at (`aria-current="page"`). */
  current?: boolean
  /**
   * A control beside the row, e.g. a menu. Rendered next to the button, never inside it: a button
   * inside a button does not exist, so this sits as the row's second child, both inside the one
   * `<li>` the row already renders.
   *
   * Visible on hover and on focus-within, but always in the DOM: someone moving through the list
   * with the keyboard must be able to tab onto it without first pointing at the row.
   *
   * Reserving room for this beside the row (a fixed `pr-8`) would cost that space all day for
   * something only shown on hover; instead the detail (`meta`/`status`) steps aside on the same
   * hover/focus-within that brings the menu in, so the two trade one spot instead of each owning
   * their own.
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
   */
  subline?: { content: ReactNode; label: string }
  /**
   * For the status shape: a message stands ready in this chat, so its shape is drawn dotted, and
   * for a closed one how it last ended. Both only for the eye; the words are the caller's.
   */
  shape?: { pending?: boolean; closedAs?: ClosedAs | null; muted?: boolean }
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
   */
  fill?: 'always' | 'current'
  /** The title is no longer in force (a dropped document): drawn struck through. */
  struck?: boolean
  /** The whole title under the pointer, for a row that shows it shortened. */
  hint?: string
} & RowStatus

/** The resting text colour per `emphasis`; hover and current always lift a row to `text-fg`. */
const restingTone = { muted: 'text-muted', secondary: 'text-secondary', strong: 'text-fg' } as const

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
  kind,
  status,
  meta,
  hoverMeta,
  compact = false,
  dense = false,
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
  const detail = meta ?? (status ? <span aria-hidden="true">{status}</span> : null)
  const mark =
    typeof marker === 'object' ? (
      marker
    ) : (
      <StatusShape
        kind={kind ?? null}
        pending={shape?.pending ?? false}
        closedAs={shape?.closedAs ?? null}
        muted={shape?.muted ?? false}
      />
    )
  const line = (
    <>
      {mark}
      <span
        data-nt-list-title
        className={`min-w-0 flex-1 truncate ${subline ? 'text-[12px]' : ''} ${
          struck ? 'line-through decoration-muted/60' : ''
        }`}
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
            actions ? 'group-hover/row:opacity-0 group-focus-within/row:opacity-0' : ''
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
  const surface = `no-drag w-full rounded-md px-2 text-left ${
    compact ? 'text-[12px]' : 'text-[13px]'
  } outline-focus ${
    fill === 'always' ? 'hover:bg-surface ' : ''
  }hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 aria-[current=page]:bg-surface-hover aria-[current=page]:text-fg`
  return (
    <li className="group/row relative m-0">
      {fold ? (
        // Level with the first line, centred on the row's left edge: its left half in the 8px
        // gutter, its right half in the row's own padding before the glyph, so the glyph and the
        // title stay where every other row has them. Centred on the gutter alone, the 16px button
        // reached 4px past it, and a column that clips at its edge (the sidebar's scroll area)
        // cut the chevron off. The button is as wide as its 12px glyph and the box
        // around it lets the pointer through: either one wider took the last pixels of the row's
        // padding, where a click belongs to the row.
        <span
          data-nt-list-fold
          className="no-drag pointer-events-none absolute top-0 -left-2 flex h-8 w-4 items-center justify-center"
        >
          <button
            type="button"
            aria-expanded={fold.open}
            aria-label={fold.label}
            {...(fold.keys ? { tabIndex: -1 } : {})}
            onClick={fold.onToggle}
            className="pointer-events-auto flex h-4 w-3 shrink-0 items-center justify-center rounded-sm text-muted outline-focus hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-1"
          >
            <span
              className={`flex transition-transform duration-100 ease-out motion-reduce:transition-none ${
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
          subline
            ? `${surface} flex h-12 flex-col justify-center py-1.5 ${restingTone[emphasis]}`
            : `${surface} flex ${
                compact ? controlHeight.sm : dense ? controlHeight.md : controlHeight.lg
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
        {subline ? (
          <>
            <span className="flex h-5 w-full items-center gap-2">{line}</span>
            <span
              aria-hidden="true"
              data-nt-list-subline
              className="flex h-4 w-full min-w-0 items-center gap-2 ps-[22px] text-[11px] text-muted tabular-nums"
            >
              {subline.content}
            </span>
            {subline.label ? <span className="sr-only">, {subline.label}</span> : null}
          </>
        ) : (
          line
        )}
      </button>
      {actions ? (
        // Level with the first line when there are two: the menu covers the meta it trades places
        // with, never the second line.
        <span
          className={`no-drag absolute right-1 flex items-center opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 ${
            subline ? 'top-1 h-6' : 'inset-y-0'
          }`}
        >
          {actions}
        </span>
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
 * The heading is a small label in capitals — 11px, `text-muted`, a little letter-spacing — the one
 * place where capitals are a style: a section of a column has to read as a section and not as one
 * more row, and size and colour alone left a project looking like a chat without a status.
 * The chevron is an affordance, so it is `xs` and shows only under the
 * pointer, with the keyboard, or once folded.
 *
 * Controlled, like `Collapsible`: whether a group is folded belongs to whoever lists the groups.
 * Folded, the rows are not rendered at all rather than hidden: the arrows of `List` walk every row
 * in the DOM, and a hidden one would swallow a keystroke.
 */
export function ListGroup({
  heading,
  count,
  quiet = false,
  icon,
  label,
  open,
  onOpenChange,
  children,
}: ListGroupProps) {
  const nameId = useId()
  return (
    <li className="mt-4 first:mt-0">
      {/* biome-ignore lint/a11y/useSemanticElements: a fieldset is for forms; this is a named group in a list, and a named section would be a landmark. */}
      <section role="group" aria-labelledby={nameId}>
        <h2 className="m-0">
          <button
            type="button"
            data-nt-list-group-heading
            aria-expanded={open}
            aria-label={label}
            onClick={() => onOpenChange(!open)}
            className={`group/heading no-drag flex h-7 w-full items-center gap-1.5 rounded-md px-2 text-left text-[11px] ${
              quiet ? 'font-normal' : 'font-medium'
            } tracking-[0.04em] text-muted uppercase outline-focus hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2`}
          >
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
                className={`shrink-0 font-mono tracking-normal ${
                  quiet && open
                    ? 'opacity-0 group-hover/heading:opacity-100 group-focus-visible/heading:opacity-100'
                    : ''
                }`}
              >
                {count}
              </span>
            )}
            <span
              className={`flex shrink-0 transition-transform duration-100 ease-out motion-reduce:transition-none ${
                open
                  ? 'opacity-0 group-hover/heading:opacity-100 group-focus-visible/heading:opacity-100'
                  : '-rotate-90'
              }`}
            >
              <Icon name="chevron-down" size="xs" />
            </span>
          </button>
        </h2>
        {open ? <ul className="m-0 flex list-none flex-col gap-1 p-0">{children}</ul> : null}
      </section>
    </li>
  )
}
