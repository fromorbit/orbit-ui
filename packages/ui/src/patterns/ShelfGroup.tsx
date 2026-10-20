import { type ReactNode, useEffect, useRef } from 'react'
import { Icon } from '../primitives/Icon'

/** The props of `ShelfGroup`. */
export interface ShelfGroupProps {
  /** The name of what is put away ("Afgerond"). */
  title: string
  /** How many items the shelf holds, also while folded: "Afgerond 143". */
  count: number
  /** The words of the row from title and count, in the host's order: "Afgerond 143". */
  text(title: string, count: number): string
  open: boolean
  onOpenChange(open: boolean): void
  /** The rows, as list items; not rendered while folded. */
  children: ReactNode
  /**
   * For a list that keeps an 8px gutter of its own (the chat list of the sidebar): the shelf steps
   * out of it on both sides, so its hairline still reaches the rim and its words stand on the line
   * of the titles above.
   */
  bleed?: boolean
  /**
   * Whether a hairline runs above the shelf (the default). The chat list of the sidebar leaves it
   * out: there the shelf is simply the last, quiet row, and a rule would be one more layer between
   * the head and the chats.
   */
  rule?: boolean
}

/**
 * A folded group at the foot of a list, for what no longer asks for anything: "Afgerond 143"
 * under the chats and under a list of specs.
 *
 * A row of 40px with a hairline above it that runs to the edge of its column, the words in 12px
 * `muted` and `chevron-down` on the right, turned over once open. Not a `ListGroup`: that is a
 * heading over rows in the middle of a list, in capitals; this is one more row at the end of it,
 * and it says with its count what lies behind it.
 *
 * It spans its column edge to edge, so the hairline reaches the rim; its words start 20px in, on
 * the line of the words of the rows above (8px of gutter and 12px of row padding), and the rows it
 * holds keep the 8px gutter of the column.
 *
 * Its button is a row of the `List` around it (the row mark), so the arrows walk onto it and, once
 * open, into the rows it holds. Controlled, like `ListGroup`: whether it is open
 * belongs to whoever keeps it per window. Folded, the rows are not rendered at all, so the arrows
 * never land on a hidden one. Opening it scrolls its first row into view.
 */
export function ShelfGroup({
  title,
  count,
  text,
  open,
  onOpenChange,
  children,
  bleed = false,
  rule = true,
}: ShelfGroupProps) {
  const rows = useRef<HTMLUListElement>(null)
  // Set by a click that opens the shelf, so a shelf that starts open scrolls nothing.
  const opened = useRef(false)
  // The shelf stands at the foot of its column: opened there, its rows appear below the fold and
  // nothing seems to happen. Its first row is brought into view instead.
  useEffect(() => {
    if (!open || !opened.current) return
    opened.current = false
    rows.current?.firstElementChild?.scrollIntoView({ block: 'nearest' })
  }, [open])
  return (
    <li className={bleed ? '-mx-2 my-0 list-none' : 'm-0 list-none'}>
      <button
        type="button"
        data-nt-list-row
        data-nt-shelf
        aria-expanded={open}
        onClick={() => {
          opened.current = !open
          onOpenChange(!open)
        }}
        className={`no-drag flex h-10 w-full min-w-0 items-center gap-2 ${rule ? 'border-t border-border ' : ''}px-5 text-left text-[12px] text-muted outline-focus hover:text-fg focus-visible:outline-2 focus-visible:-outline-offset-2`}
      >
        <span className="min-w-0 flex-1 truncate">{text(title, count)}</span>
        <span
          className={`flex shrink-0 transition-transform duration-100 ease-out motion-reduce:transition-none ${
            open ? 'rotate-180' : ''
          }`}
        >
          <Icon name="chevron-down" size="xs" />
        </span>
      </button>
      {open ? (
        <ul ref={rows} className="m-0 list-none px-2 py-0">
          {children}
        </ul>
      ) : null}
    </li>
  )
}
